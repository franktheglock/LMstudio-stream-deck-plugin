# LM Studio Controller - Stream Deck Plugin

A comprehensive Stream Deck plugin for controlling [LM Studio](https://lmstudio.ai), allowing you to manage models, server settings, and interact with your local AI models directly from your Stream Deck.

## Features

### 🔄 Toggle Server
- Check if LM Studio server is running
- View number of loaded models
- Auto-refresh server status

### 📥 Load Model
- Load models with a single button press
- Configure model settings (context length, GPU layers)
- Browse and select from available models

### 📤 Unload Model
- Unload the current model to free up memory
- Optional confirmation before unloading

### ⚙️ Server Settings
- Configure server port and timeout
- Adjust generation parameters (temperature, max tokens)
- Enable/disable CORS

### 💬 Quick Chat
- Send predefined messages to LM Studio
- Message presets for common tasks
- Copy responses to clipboard
- Display response previews on button

## Installation

### Download the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/franktheglock/LMstudio-stream-deck-plugin.git
cd LMstudio-stream-deck-plugin
```

### Prerequisites
- [Elgato Stream Deck Software](https://www.elgato.com/downloads) (version 6.0 or higher)
- [LM Studio](https://lmstudio.ai) installed and running
- Node.js 20 or higher (typically bundled with Stream Deck)

### Install the Plugin

#### Elgato Stream Deck (Elgato Hardware - Windows/macOS)
For users with Elgato Stream Deck hardware:
1. **Recommended: Installer (Windows)**
   - Run `install-streamdeck.bat` from the repository root to automatically copy the plugin into Stream Deck's plugins directory and attempt a restart of the Stream Deck app.
   - Example: double-click `install-streamdeck.bat` or run from PowerShell:
     `.\install-streamdeck.bat`

2. **Manual Installation**
   - Copy the `com.custom.lmstudio.sdPlugin` folder to:
     - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
     - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
   - Restart Stream Deck software

#### HotSpot StreamDock (AmpliGame Hardware - Windows)
For users with AmpliGame StreamDock hardware:
1. ~~**Recommended: Installer (Windows)** 
   - Run `install-streamdock.bat` from the repository root to automatically copy the plugin into StreamDock's plugins directory and attempt a restart of the StreamDock app.
   - Example: double-click `install-streamdock.bat` or run from PowerShell:
     `.\install-streamdock.bat`~~ **CURRENTLY BROKEN** (will try to fix later) 

2. **Manual Installation**
   - Copy the `com.custom.lmstudio.sdPlugin` folder to:
     - **Windows:** `%appdata%\HotSpot\StreamDock\plugins\`
   - Restart StreamDock software

#### Verify Installation
   - Open Stream Deck software
   - Look for "LM Studio" category in the actions list
   - You should see 5 actions available

## Usage

### Setting up LM Studio

1. **Start LM Studio**
   - Launch LM Studio application
   - Load a model (if needed)

2. **Start the Server**
   - In LM Studio, go to the "Local Server" tab
   - Click "Start Server" (default port: 1234)
   - Ensure the server is running before using the plugin

### Adding Actions to Stream Deck

1. **Toggle Server Action**
   - Drag "Toggle Server" to a button
   - Configure auto-refresh interval
   - Press to check server status

2. **Load Model Action**
   - Drag "Load Model" to a button
   - Enter the model path or select from available models
   - Configure GPU layers and context length
   - Press to load the model

3. **Unload Model Action**
   - Drag "Unload Model" to a button
   - Optionally enable confirmation
   - Press to unload current model

4. **Server Settings Action**
   - Drag "Server Settings" to a button
   - Configure server parameters
   - Adjust temperature and token limits

5. **Quick Chat Action**
   - Drag "Quick Chat" to a button
   - Enter your message or select a preset
   - Choose whether to show response
   - Press to send message

## Configuration

### Toggle Server Settings
- **Server URL:** LM Studio API endpoint (default: `http://localhost:1234`)
- **Auto-refresh:** Automatically check server status
- **Refresh Interval:** How often to check (5-300 seconds)

### Load Model Settings
- **Model Path:** Relative path to model file
- **Model Name:** Display name for the model
- **Context Length:** Token context window (512-32768)
- **GPU Layers:** Number of layers to offload to GPU

### Server Settings
- **Server Port:** API port (default: 1234)
- **Enable CORS:** Allow cross-origin requests
- **Request Timeout:** API timeout in milliseconds
- **Max Tokens:** Maximum output tokens (-1 for unlimited)
- **Temperature:** Randomness in generation (0-2)

### Quick Chat Settings
- **Message:** The text to send to LM Studio
- **Button Label:** Custom label for the button
- **Target Model:** Specific model to use (optional)
- **Show Response:** Display response preview
- **Copy to Clipboard:** Auto-copy response

## LM Studio API

This plugin uses the LM Studio API which follows the OpenAI API format:

- `GET /v1/models` - List available models
- `POST /v1/models/load` - Load a model
- `POST /v1/models/unload` - Unload current model
- `POST /v1/chat/completions` - Send chat message

Make sure the LM Studio server is running on `http://localhost:1234` (or your configured port).

## Troubleshooting

### Server Not Responding
- Verify LM Studio is running
- Check the server is started in LM Studio
- Confirm the port matches (default: 1234)
- Check firewall settings

### Model Won't Load
- Verify the model path is correct
- Ensure you have enough RAM/VRAM
- Check LM Studio logs for errors
- Try loading the model directly in LM Studio first

### Actions Not Working
- Restart Stream Deck software
- Check the plugin logs in Stream Deck
- Verify LM Studio server is accessible
- Try uninstalling and reinstalling the plugin

### Connection Timeout
- Increase timeout in Server Settings
- Check if another application is using port 1234
- Verify network/firewall isn't blocking localhost

## Development

### Project Structure
```
com.custom.lmstudio.sdPlugin/
├── manifest.json              # Plugin configuration
├── plugin.js                  # Main plugin logic
├── package.json              # Node.js dependencies
├── PropertyInspector/        # Settings UI
│   ├── toggleserver.html
│   ├── loadmodel.html
│   ├── unloadmodel.html
│   ├── serversettings.html
│   └── quickchat.html
├── html/
│   ├── css/
│   │   └── sdpi.css         # Property inspector styles
│   └── js/
│       └── property-inspector.js  # PI helper functions
└── images/
    ├── actions/             # Action icons
    ├── plugin.svg          # Plugin icon
    └── category.svg        # Category icon
```

### Modifying the Plugin

1. Edit `plugin.js` for backend logic
2. Modify HTML files in `PropertyInspector/` for settings UI
3. Update `manifest.json` to add new actions
4. Restart Stream Deck to reload changes

### Adding New Actions

1. Add action to `manifest.json`:
```json
{
  "Name": "My Action",
  "UUID": "com.custom.lmstudio.myaction",
  "Icon": "images/actions/myaction",
  "Tooltip": "Description",
  "PropertyInspectorPath": "PropertyInspector/myaction.html"
}
```

2. Create property inspector HTML
3. Add handler in `plugin.js`
4. Create icon images

## Credits

- Built for [Stream Deck](https://www.elgato.com/stream-deck)
- Designed for [LM Studio](https://lmstudio.ai)

## License

MIT License - Feel free to modify and distribute

## Support

For issues or questions:
- Check the [troubleshooting](#troubleshooting) section
- Review LM Studio documentation
- Check Stream Deck SDK documentation

## Version History

### 1.0.0 (2026-02-09)
- Initial release
- Toggle server action
- Load/unload model actions
- Server settings configuration
- Quick chat functionality
- Auto-refresh server status
