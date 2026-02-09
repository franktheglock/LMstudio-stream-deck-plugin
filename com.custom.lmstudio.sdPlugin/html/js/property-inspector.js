/* Stream Deck Property Inspector Helper */

let websocket = null;
let uuid = null;
let actionInfo = {};

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
    uuid = inUUID;
    actionInfo = JSON.parse(inActionInfo);
    
    websocket = new WebSocket('ws://localhost:' + inPort);
    
    websocket.onopen = function() {
        const json = {
            event: inRegisterEvent,
            uuid: inUUID
        };
        websocket.send(JSON.stringify(json));
        
        // Request current settings
        requestSettings();
    };
    
    websocket.onmessage = function(evt) {
        const jsonObj = JSON.parse(evt.data);
        const event = jsonObj.event;
        const jsonPayload = jsonObj.payload;
        
        if (event === 'didReceiveSettings') {
            const settings = jsonPayload.settings;
            loadSettings(settings);
        } else if (event === 'sendToPropertyInspector') {
            handlePluginMessage(jsonPayload);
        }
    };
}

function requestSettings() {
    if (websocket) {
        const json = {
            event: 'getSettings',
            context: uuid
        };
        websocket.send(JSON.stringify(json));
    }
}

function saveSettingsToPlugin(settings) {
    if (websocket) {
        const json = {
            event: 'setSettings',
            context: uuid,
            payload: settings
        };
        websocket.send(JSON.stringify(json));
    }
}

function sendToPlugin(payload) {
    if (websocket) {
        const json = {
            action: actionInfo.action,
            event: 'sendToPlugin',
            context: uuid,
            payload: payload
        };
        websocket.send(JSON.stringify(json));
    }
}

function loadSettings(settings) {
    // Load settings into form elements
    for (const key in settings) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    }
}

function handlePluginMessage(payload) {
    // Handle messages from plugin
    if (payload.event === 'modelsData') {
        const select = document.getElementById('availableModels') || document.getElementById('model');
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '';
            
            // Add "Currently Loaded Model" option
            const currentOption = document.createElement('option');
            currentOption.value = 'local-model';
            currentOption.text = 'Currently Loaded (local-model)';
            select.appendChild(currentOption);

            if (payload.models) {
                payload.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    const status = model.isLoaded ? ' (Loaded)' : '';
                    option.textContent = (model.name || model.id) + status;
                    select.appendChild(option);
                });
            }
            
            // Restore previous selection if valid
            if (currentValue) select.value = currentValue;
        }
    }
}

// Auto-populate logic and simplified listener
document.addEventListener('DOMContentLoaded', () => {
    // Listen for all input changes and save them
    document.body.addEventListener('input', (e) => {
        const settings = {};
        document.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.id) {
                settings[el.id] = el.type === 'checkbox' ? el.checked : el.value;
            }
        });
        
        // Auto-fill logic for the model loader
        if (e.target.id === 'availableModels') {
            const modelPathInput = document.getElementById('modelPath');
            const modelNameInput = document.getElementById('modelName') || document.getElementById('model_name_display');
            if (modelPathInput) modelPathInput.value = e.target.value;
            if (modelNameInput && e.target.value !== 'local-model') {
                modelNameInput.value = e.target.options[e.target.selectedIndex].text.replace(' (Loaded)', '');
            }
            
            // Re-collect updated settings after auto-fill
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.id) settings[el.id] = el.type === 'checkbox' ? el.checked : el.value;
            });
        }
        
        saveSettingsToPlugin(settings);
    });

    // Handle refresh buttons if they exist
    const refreshBtn = document.getElementById('refreshModels');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            sendToPlugin({ event: 'getModels' });
        });
    }
    
    // Initial request for models
    setTimeout(() => {
        sendToPlugin({ event: 'getModels' });
    }, 500);
});
