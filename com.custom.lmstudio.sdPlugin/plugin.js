// LM Studio Controller Plugin for Stream Deck
// Handles communication with LM Studio API

const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Logging disabled to prevent large log files
function debugLog(message) {
    return;
}

// LM Studio API configuration
const LM_STUDIO_CONFIG = {
    baseUrl: 'http://localhost:1234',
    timeout: 300000 // 5 minutes (LLMs take time to think)
};

// Plugin actions
const ACTIONS = {
    TOGGLE_SERVER: 'com.custom.lmstudio.toggleserver',
    LOAD_MODEL: 'com.custom.lmstudio.loadmodel',
    UNLOAD_MODEL: 'com.custom.lmstudio.unloadmodel',
    SERVER_SETTINGS: 'com.custom.lmstudio.serversettings',
    QUICK_CHAT: 'com.custom.lmstudio.quickchat',
    PROCESS_CLIPBOARD: 'com.custom.lmstudio.processclipboard'
};

// Global plugin instance
let pluginUUID = null;
let websocket = null;
let contexts = {};
let serverStatus = {};
let connectionParams = null; // Store connection parameters for reconnection

// Helper function to make HTTP requests
async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, LM_STUDIO_CONFIG.baseUrl);
        debugLog(`HTTP Request: ${method} ${url.toString()}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: LM_STUDIO_CONFIG.timeout
        };

        if (data) {
            const bodyStr = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
            debugLog(`Request Body: ${bodyStr.substring(0, 500)}${bodyStr.length > 500 ? '...' : ''}`);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                debugLog(`HTTP Response: ${res.statusCode}`);
                debugLog(`Response Body: ${body.substring(0, 500)}${body.length > 500 ? '...' : ''}`);
                try {
                    const response = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (err) => {
            debugLog(`HTTP Error: ${err.message}`);
            reject(err);
        });
        req.on('timeout', () => {
            debugLog('HTTP Timeout');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// LM Studio CLI functions
function runLMSCommand(command) {
    return new Promise((resolve, reject) => {
        exec(`lms ${command}`, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                debugLog(`CLI Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                debugLog(`CLI stderr: ${stderr}`);
            }
            debugLog(`CLI stdout: ${stdout}`);
            resolve({ stdout, stderr });
        });
    });
}

async function startServer() {
    try {
        debugLog('Starting LM Studio server via CLI...');
        const result = await runLMSCommand('server start');
        debugLog('Server start command completed');
        // Wait a moment for server to actually start
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, output: result.stdout };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function stopServer() {
    try {
        debugLog('Stopping LM Studio server via CLI...');
        const result = await runLMSCommand('server stop');
        debugLog('Server stop command completed');
        return { success: true, output: result.stdout };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// LM Studio API functions
async function checkServerStatus() {
    try {
        const response = await makeRequest('GET', '/api/v1/models');
        const models = response.data.models || [];
        // Get all loaded instances across all models
        const loadedInstances = [];
        models.forEach(model => {
            if (model.loaded_instances && model.loaded_instances.length > 0) {
                model.loaded_instances.forEach(instance => {
                    loadedInstances.push({
                        id: instance.id,
                        model: model.key,
                        display_name: model.display_name
                    });
                });
            }
        });
        return { running: true, models: models, loadedInstances: loadedInstances };
    } catch (error) {
        return { running: false, models: [], loadedInstances: [] };
    }
}

async function loadModel(modelPath, config = {}) {
    try {
        // First attempt: include config if provided and not 'useLastSettings'
        if (config && Object.keys(config).length > 0 && !config.useLastSettings) {
            const payloadWithConfig = { model: modelPath, config };
            debugLog(`Trying load with config: ${JSON.stringify(payloadWithConfig)}`);
            const response = await makeRequest('POST', '/api/v1/models/load', payloadWithConfig);
            debugLog(`Load with config status: ${response.status}`);
            debugLog(`Load with config body: ${JSON.stringify(response.data).substring(0,1000)}${JSON.stringify(response.data).length > 1000 ? '...' : ''}`);

            if (response.status === 200) {
                return { success: true, data: response.data, usedFallback: false };
            }

            debugLog('Load with config failed; will try alternate config shape (top-level fields)');

            // Second attempt: try sending context_length & gpu_layers as top-level fields
            const altPayload = {
                model: modelPath,
                context_length: config.context_length,
                gpu_layers: config.gpu_layers
            };
            debugLog(`Trying alternate payload: ${JSON.stringify(altPayload)}`);
            const altResp = await makeRequest('POST', '/api/v1/models/load', altPayload);
            debugLog(`Alt payload status: ${altResp.status}`);
            debugLog(`Alt payload body: ${JSON.stringify(altResp.data).substring(0,1000)}${JSON.stringify(altResp.data).length > 1000 ? '...' : ''}`);

            if (altResp.status === 200) {
                return { success: true, data: altResp.data, usedFallback: true };
            }

            debugLog('Alternate payload failed; will retry without config');
        }

        // Final attempt: load without config (use server defaults / last settings)
        const payload = { model: modelPath };
        debugLog(`Retrying load without config: ${JSON.stringify(payload)}`);
        const response2 = await makeRequest('POST', '/api/v1/models/load', payload);
        debugLog(`Load without config status: ${response2.status}`);
        debugLog(`Load without config body: ${JSON.stringify(response2.data).substring(0,1000)}${JSON.stringify(response2.data).length > 1000 ? '...' : ''}`);

        if (response2.status === 200) {
            return { success: true, data: response2.data, usedFallback: true };
        }

        const errDetail = (response2.data && response2.data.error) ? response2.data.error : `API returned status ${response2.status}`;
        return { success: false, error: errDetail };
    } catch (error) {
        debugLog(`Load Model Exception: ${error.stack || error.message}`);
        return { success: false, error: error.message };
    }
}

async function unloadModel(instanceId = null) {
    try {
        // If no instance_id provided, get the first loaded model
        if (!instanceId) {
            const status = await checkServerStatus();
            if (status.loadedInstances.length === 0) {
                return { success: false, error: 'No models loaded' };
            }
            instanceId = status.loadedInstances[0].id;
        }
        
        const response = await makeRequest('POST', '/api/v1/models/unload', {
            instance_id: instanceId
        });
        return { success: response.status === 200, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getAllModels() {
    try {
        const response = await makeRequest('GET', '/api/v1/models');
        const models = response.data.models || [];
        // Map to a simple format for the Property Inspector
        return models.map(m => ({
            id: m.key,
            name: m.display_name || m.key,
            isLoaded: m.loaded_instances && m.loaded_instances.length > 0
        }));
    } catch (error) {
        return [];
    }
}

async function getLoadedModels() {
    try {
        const models = await getAllModels();
        // Return only the ones that have loaded instances
        return models.filter(m => m.isLoaded);
    } catch (error) {
        return [];
    }
}

async function sendChatMessage(message, model = null, systemPrompt = null) {
    try {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: message });

        // Use 'local-model' as the default if nothing else is specified
        const selectedModel = model || 'local-model';

        const payload = {
            model: selectedModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: -1,
            stream: false
        };
        const response = await makeRequest('POST', '/v1/chat/completions', payload);
        
        // Handle cases where response might be 200 but data is unexpected
        if (response.status !== 200) {
            return { success: false, error: `API returned status ${response.status}` };
        }
        
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getClipboard() {
    return new Promise((resolve) => {
        exec('powershell -Command "Get-Clipboard"', { encoding: 'utf8' }, (error, stdout) => {
            if (error) {
                debugLog(`Clipboard Error: ${error.message}`);
                resolve('');
                return;
            }
            resolve(stdout.trim());
        });
    });
}

async function setClipboard(text) {
    return new Promise((resolve) => {
        try {
            // Using a temporary file is more robust for large/multiline text
            // Use process.env.TEMP to get the Windows temp directory
            const tempDir = process.env.TEMP || __dirname;
            const tempPath = path.join(tempDir, `lms_cb_${Date.now()}.txt`);
            
            // Clean the text - ensure correct line endings for Windows
            const normalizedText = text.replace(/\n/g, '\r\n');
            fs.writeFileSync(tempPath, normalizedText, 'utf8');
            
            // Use PowerShell to read the file and set clipboard
            // -Raw ensures the content is read exactly as is
            const psCommand = `powershell -NoProfile -Command "Get-Content -Path '${tempPath}' -Raw | Set-Clipboard"; Remove-Item -Path '${tempPath}' -ErrorAction SilentlyContinue`;
            
            exec(psCommand, (error) => {
                if (error) {
                    debugLog(`Set Clipboard Error: ${error.message}`);
                } else {
                    debugLog(`Clipboard set successfully using file: ${tempPath}`);
                }
                resolve();
            });
        } catch (e) {
            debugLog(`Set Clipboard Exception: ${e.message}`);
            resolve();
        }
    });
}

// Stream Deck communication functions
function sendToPlugin(context, action, payload) {
    if (websocket) {
        const json = {
            action: action,
            event: 'sendToPlugin',
            context: context,
            payload: payload
        };
        websocket.send(JSON.stringify(json));
    }
}

function sendToPropertyInspector(context, payload) {
    if (websocket) {
        const json = {
            event: 'sendToPropertyInspector',
            context: context,
            payload: payload
        };
        websocket.send(JSON.stringify(json));
    }
}

function setTitle(context, title, target = 0) {
    if (websocket) {
        const json = {
            event: 'setTitle',
            context: context,
            payload: {
                title: title,
                target: target
            }
        };
        websocket.send(JSON.stringify(json));
    }
}

function setState(context, state) {
    if (websocket) {
        const json = {
            event: 'setState',
            context: context,
            payload: {
                state: state
            }
        };
        websocket.send(JSON.stringify(json));
    }
}

function showAlert(context) {
    if (websocket) {
        const json = {
            event: 'showAlert',
            context: context
        };
        websocket.send(JSON.stringify(json));
    }
}

function showOk(context) {
    if (websocket) {
        const json = {
            event: 'showOk',
            context: context
        };
        websocket.send(JSON.stringify(json));
    }
}

function logMessage(message) {
    return;
}

// Action handlers
async function handleToggleServer(context, settings) {
    const status = await checkServerStatus();
    
    if (!status.running) {
        logMessage('Starting LM Studio server...');
        setTitle(context, 'Starting...');
        
        const result = await startServer();
        if (result.success) {
            logMessage('Server started successfully');
            showOk(context);
            setState(context, 1);
            setTitle(context, 'Running');
        } else {
            logMessage('Failed to start server: ' + result.error);
            showAlert(context);
            setState(context, 0);
            setTitle(context, 'Failed');
        }
    } else {
        logMessage('Stopping LM Studio server...');
        setTitle(context, 'Stopping...');
        
        const result = await stopServer();
        if (result.success) {
            logMessage('Server stopped successfully');
            showOk(context);
            setState(context, 0);
            setTitle(context, 'Stopped');
        } else {
            logMessage('Failed to stop server: ' + result.error);
            showAlert(context);
            setState(context, 1);
            setTitle(context, 'Failed');
        }
    }
}

async function handleLoadModel(context, settings) {
    const modelPath = settings.modelPath || '';
    const modelName = settings.modelName || 'Load Model';
    const useLastSettings = settings.useLastSettings === true || settings.useLastSettings === "true";
    
    if (!modelPath) {
        logMessage('No model path specified');
        showAlert(context);
        return;
    }

    logMessage(`Loading model: ${modelPath} (Custom Settings: ${!useLastSettings})`);
    setTitle(context, 'Loading...');
    
    let config = {};
    if (!useLastSettings) {
        const gpuLayersInt = parseInt(settings.gpuLayers) || 0;
        config = {
            context_length: parseInt(settings.contextLength) || 2048,
            gpu_layers: gpuLayersInt,
            gpu_offload: {
                ratio: gpuLayersInt / 100
            }
        };
        debugLog(`Constructed load config: ${JSON.stringify(config)}`);
    }

    const result = await loadModel(modelPath, config);
    
    if (result.success) {
        if (result.usedFallback) {
            logMessage('Model loaded successfully, but custom settings were ignored by the server; used default settings');
            showOk(context);
            setTitle(context, `${modelName} (default)`);
        } else {
            logMessage('Model loaded successfully with requested settings');
            showOk(context);
            setTitle(context, modelName);
        }
    } else {
        logMessage(`Failed to load model: ${result.error || 'Unknown error'}`);
        showAlert(context);
        setTitle(context, 'Failed');
    }
}

async function handleUnloadModel(context, settings) {
    // Get loaded models to show what we're unloading
    const status = await checkServerStatus();
    if (status.loadedInstances.length === 0) {
        logMessage('No models currently loaded');
        showAlert(context);
        setTitle(context, 'None loaded');
        return;
    }
    
    const instanceToUnload = status.loadedInstances[0];
    logMessage(`Unloading model: ${instanceToUnload.display_name || instanceToUnload.id}`);
    setTitle(context, 'Unloading...');
    
    const result = await unloadModel(instanceToUnload.id);
    
    if (result.success) {
        logMessage('Model unloaded successfully');
        showOk(context);
        setTitle(context, 'Unloaded');
    } else {
        logMessage(`Failed to unload model: ${result.error || 'Unknown error'}`);
        showAlert(context);
        setTitle(context, 'Failed');
    }
}

async function handleServerSettings(context, settings) {
    // This would open LM Studio settings or configure server parameters
    logMessage('Opening server settings');
    showOk(context);
}

async function handleQuickChat(context, settings) {
    debugLog(`handleQuickChat settings received: ${JSON.stringify(settings)}`);
    const message = settings.message || '';
    const model = settings.model || settings.targetModel || null;
    const copyToClipboard = settings.copyToClipboard === true || settings.copyToClipboard === "true";
    
    if (!message) {
        logMessage('No message specified');
        showAlert(context);
        return;
    }

    logMessage(`Sending message: ${message}`);
    setTitle(context, 'Chatting...');
    const result = await sendChatMessage(message, model);
    
    if (result.success) {
        logMessage('Message sent successfully');
        showOk(context);
        
        let response = '';
        if (result.data && result.data.choices && result.data.choices[0]) {
            response = result.data.choices[0].message.content;
            
            // Handle Copy to Clipboard
            if (copyToClipboard) {
                logMessage('Action: Copying response to clipboard...');
                await setClipboard(response);
            } else {
                debugLog('Clipboard copy skipped (setting disabled)');
            }

            // Optionally display response preview
            const preview = response.substring(0, 50);
            setTitle(context, preview);
        }
    } else {
        logMessage(`Failed to send message: ${result.error || 'Unknown error'}`);
        showAlert(context);
        setTitle(context, 'Error');
    }
}

async function handleProcessClipboard(context, settings) {
    const systemPrompt = settings.system_prompt || '';
    const model = settings.model || null;
    
    logMessage('Reading clipboard...');
    setTitle(context, 'Reading...');
    const clipboardText = await getClipboard();
    
    if (!clipboardText) {
        logMessage('Clipboard is empty');
        showAlert(context);
        setTitle(context, 'Empty');
        return;
    }

    logMessage(`Processing clipboard with system prompt: ${systemPrompt}`);
    setTitle(context, 'LLM Processing...');
    
    const result = await sendChatMessage(clipboardText, model, systemPrompt);
    
    if (result.success && result.data && result.data.choices && result.data.choices[0]) {
        const response = result.data.choices[0].message.content;
        logMessage('LLM response received, updating clipboard...');
        
        await setClipboard(response);
        logMessage('Clipboard updated with LLM response');
        showOk(context);
        setTitle(context, 'Success');
        
        // Restore title after 3 seconds if needed
        setTimeout(() => {
            if (contexts[context]) {
                const title = contexts[context].settings.model_name_display || 'Clipboard Action';
                setTitle(context, title);
            }
        }, 3000);
    } else {
        logMessage(`Failed to process clipboard: ${result.error || 'Unknown error'}`);
        showAlert(context);
        setTitle(context, 'Failed');
    }
}

// Event handlers
function onKeyDown(context, settings, action) {
    switch (action) {
        case ACTIONS.TOGGLE_SERVER:
            handleToggleServer(context, settings);
            break;
        case ACTIONS.LOAD_MODEL:
            handleLoadModel(context, settings);
            break;
        case ACTIONS.UNLOAD_MODEL:
            handleUnloadModel(context, settings);
            break;
        case ACTIONS.SERVER_SETTINGS:
            handleServerSettings(context, settings);
            break;
        case ACTIONS.QUICK_CHAT:
            handleQuickChat(context, settings);
            break;
        case ACTIONS.PROCESS_CLIPBOARD:
            handleProcessClipboard(context, settings);
            break;
    }
}

function onWillAppear(context, settings, action, device) {
    contexts[context] = { settings, action, device };
    
    // Initialize based on action type
    if (action === ACTIONS.TOGGLE_SERVER) {
        // Check initial server status
        checkServerStatus().then(status => {
            setState(context, status.running ? 1 : 0);
        });
    } else if (action === ACTIONS.LOAD_MODEL || action === ACTIONS.PROCESS_CLIPBOARD) {
        const title = settings.model_name_display || settings.modelName;
        if (title) {
            setTitle(context, title);
        }
    }
}

function onWillDisappear(context) {
    delete contexts[context];
}

function onDidReceiveSettings(context, settings, action) {
    if (contexts[context]) {
        contexts[context].settings = settings;
    }
    
    if (action === ACTIONS.LOAD_MODEL || action === ACTIONS.PROCESS_CLIPBOARD) {
        const title = settings.model_name_display || settings.modelName;
        if (title) {
            setTitle(context, title);
        }
    }
}

function onSendToPlugin(context, action, payload) {
    // Handle messages from Property Inspector
    if (payload.event === 'getModels') {
        getAllModels().then(models => {
            // Send the full model list to the property inspector
            sendToPropertyInspector(context, {
                event: 'modelsData',
                models: models
            });
        });
    }
}

// WebSocket connection
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
    debugLog(`connectElgatoStreamDeckSocket called with port ${inPort}`);
    pluginUUID = inPluginUUID;
    
    // Store connection parameters for reconnection
    connectionParams = { inPort, inPluginUUID, inRegisterEvent, inInfo };
    
    // Close existing connection if any
    if (websocket && websocket.readyState === 1) {
        debugLog('Closing existing WebSocket connection');
        websocket.close();
    }
    
    try {
        debugLog(`Creating WebSocket to ws://localhost:${inPort}`);
        websocket = new WebSocket(`ws://localhost:${inPort}`);
        debugLog('WebSocket created successfully');
        
        websocket.onopen = function() {
            debugLog('WebSocket onopen triggered');
            const json = {
                event: inRegisterEvent,
                uuid: inPluginUUID
            };
            websocket.send(JSON.stringify(json));
            logMessage('Plugin connected to Stream Deck');
        };
    
    websocket.onmessage = function(evt) {
        try {
            const jsonObj = JSON.parse(evt.data);
            const event = jsonObj.event;
            const context = jsonObj.context;
            const action = jsonObj.action;
            const settings = jsonObj.payload?.settings || {};
            const payload = jsonObj.payload || {};
            
            switch (event) {
                case 'keyDown':
                    onKeyDown(context, settings, action);
                    break;
                case 'willAppear':
                    onWillAppear(context, settings, action, jsonObj.device);
                    break;
                case 'willDisappear':
                    onWillDisappear(context);
                    break;
                case 'didReceiveSettings':
                    onDidReceiveSettings(context, settings, action);
                    break;
                case 'sendToPlugin':
                    onSendToPlugin(context, action, payload);
                    break;
            }
        } catch (e) {
            logMessage(`Error parsing message: ${e.message}`);
        }
    };
    
    websocket.onerror = function(evt) {
        debugLog(`WebSocket error: ${evt.message || 'Connection failed'}`);
        logMessage(`WebSocket error: ${evt.message || 'Connection failed'}`);
    };
    
    websocket.onclose = function() {
        debugLog('WebSocket closed - scheduling reconnect in 5 seconds');
        logMessage('Plugin disconnected from Stream Deck - reconnecting in 5 seconds...');
        setTimeout(() => {
            if (connectionParams) {
                debugLog('Attempting reconnection...');
                connectElgatoStreamDeckSocket(
                    connectionParams.inPort,
                    connectionParams.inPluginUUID,
                    connectionParams.inRegisterEvent,
                    connectionParams.inInfo
                );
            }
        }, 5000);
    };
    } catch (error) {
        debugLog(`CATCH BLOCK: Failed to create WebSocket: ${error.message}`);
        debugLog(`Error stack: ${error.stack}`);
        logMessage(`Failed to create WebSocket: ${error.message} - retrying in 5 seconds...`);
        setTimeout(() => {
            if (connectionParams) {
                debugLog('Retrying after catch block error...');
                connectElgatoStreamDeckSocket(
                    connectionParams.inPort,
                    connectionParams.inPluginUUID,
                    connectionParams.inRegisterEvent,
                    connectionParams.inInfo
                );
            }
        }, 5000);
    }
    debugLog('connectElgatoStreamDeckSocket function completed');
}

// Entry point
function parseArgValue(flag) {
    const index = process.argv.indexOf(flag);
    if (index !== -1 && index + 1 < process.argv.length) {
        return process.argv[index + 1];
    }
    return null;
}

if (require.main === module) {
    debugLog('=== LM Studio Plugin Starting ===');
    debugLog(`Node version: ${process.version}`);
    debugLog(`Args: ${process.argv.join(' ')}`);
    
    const inPort = parseArgValue('-port');
    const inPluginUUID = parseArgValue('-pluginUUID');
    const inRegisterEvent = parseArgValue('-registerEvent');
    const inInfo = parseArgValue('-info');

    debugLog(`Parsed args - Port: ${inPort}, UUID: ${inPluginUUID}, Event: ${inRegisterEvent}`);

    if (inPort && inPluginUUID && inRegisterEvent) {
        // Prevent process from crashing on unhandled errors
        process.on('uncaughtException', (error) => {
            debugLog(`UNCAUGHT EXCEPTION: ${error.stack || error}`);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            debugLog(`UNHANDLED REJECTION: ${reason}`);
        });
        
        debugLog('Calling connectElgatoStreamDeckSocket...');
        connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo);
    } else {
        debugLog('ERROR: Missing required Stream Deck connection args');
        debugLog('Usage: node plugin.js -port <port> -pluginUUID <uuid> -registerEvent <event> -info <info>');
        process.exit(1);
    }
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        connectElgatoStreamDeckSocket
    };
}
