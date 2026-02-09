# Installation Guide

## Step 1: Prepare the Plugin

Your plugin is ready in the folder:
```
com.custom.lmstudio.sdPlugin/
```

## Step 2: Install to Stream Deck

### Method 1: Development/Testing (Recommended for testing)

1. **Locate Stream Deck Plugins Folder:**
   - Press `Win + R`
   - Type: `%appdata%\Elgato\StreamDeck\Plugins`
   - Press Enter

2. **Copy Plugin Folder:**
   - Copy the entire `com.custom.lmstudio.sdPlugin` folder
   - Paste it into the Plugins directory
   - Final path: `%appdata%\Elgato\StreamDeck\Plugins\com.custom.lmstudio.sdPlugin\`

3. **Restart Stream Deck:**
   - Right-click Stream Deck icon in system tray
   - Select "Quit Stream Deck"
   - Launch Stream Deck again from Start menu

### Method 2: Create Distribution Package (For sharing/production)

1. **Install DistributionTool:**
   - Download from [Elgato Developer Portal](https://developer.elgato.com)
   - Or use Stream Deck SDK

2. **Create Package:**
   ```powershell
   cd "c:\Users\claym\Desktop\custom plugins"
   DistributionTool.exe -b -i com.custom.lmstudio.sdPlugin -o .
   ```

3. **Install .streamDeckPlugin file:**
   - Double-click the generated `com.custom.lmstudio.streamDeckPlugin` file
   - Stream Deck will install automatically

## Step 3: Verify Installation

1. **Open Stream Deck Software**

2. **Check for Plugin:**
   - Look in the actions list (right side)
   - Find "LM Studio" category
   - You should see 5 actions:
     - Toggle Server
     - Load Model
     - Unload Model
     - Server Settings
     - Quick Chat

3. **Test an Action:**
   - Drag "Toggle Server" to a button
   - The property inspector should appear
   - Configure settings if needed

## Step 4: Setup LM Studio

1. **Start LM Studio:**
   - Launch LM Studio application
   - Load a model (optional, but recommended for testing)

2. **Start the Server:**
   - Navigate to "Local Server" tab
   - Click "Start Server"
   - Verify it's running on port 1234
   - Keep this window open

3. **Test Connection:**
   - Press the "Toggle Server" button on Stream Deck
   - Button should show checkmark if successful
   - Button shows X if server not found

## Troubleshooting

### Plugin Not Appearing

**Problem:** LM Studio category doesn't show in Stream Deck

**Solutions:**
1. Check the plugin folder is in correct location
2. Verify folder name is exactly: `com.custom.lmstudio.sdPlugin`
3. Restart Stream Deck software completely
4. Check Windows Event Viewer for errors

### Actions Show Errors

**Problem:** Actions appear but show errors when pressed

**Solutions:**
1. Check `manifest.json` for syntax errors
2. Verify all image files exist
3. Check `plugin.js` for JavaScript errors
4. Look at Stream Deck logs:
   - `%appdata%\Elgato\StreamDeck\logs\`

### Server Connection Failed

**Problem:** "Server not responding" errors

**Solutions:**
1. Ensure LM Studio is running
2. Verify server is started (green indicator in LM Studio)
3. Check port is 1234 (default)
4. Test API manually:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:1234/v1/models"
   ```
5. Check firewall isn't blocking port 1234

### Images Not Loading

**Problem:** Buttons show no icons

**Solutions:**
1. Verify SVG files are in `images/actions/` folder
2. Check file names match manifest.json
3. Ensure SVG files are valid XML
4. Try PNG format (144x144 pixels) if SVG issues persist

## File Checklist

Before installing, verify these files exist:

### Required Files:
- ✅ `manifest.json` - Plugin configuration
- ✅ `plugin.js` - Main logic
- ✅ `package.json` - Dependencies

### PropertyInspector Files:
- ✅ `PropertyInspector/toggleserver.html`
- ✅ `PropertyInspector/loadmodel.html`
- ✅ `PropertyInspector/unloadmodel.html`
- ✅ `PropertyInspector/serversettings.html`
- ✅ `PropertyInspector/quickchat.html`

### Supporting Files:
- ✅ `html/css/sdpi.css`
- ✅ `html/js/property-inspector.js`

### Image Files:
- ✅ `images/plugin.svg`
- ✅ `images/category.svg`
- ✅ `images/actions/toggle-server.svg`
- ✅ `images/actions/server-on.svg`
- ✅ `images/actions/server-off.svg`
- ✅ `images/actions/load-model.svg`
- ✅ `images/actions/unload-model.svg`
- ✅ `images/actions/settings.svg`
- ✅ `images/actions/chat.svg`

## Testing Checklist

After installation, test each action:

1. **Toggle Server**
   - [ ] Button appears on Stream Deck
   - [ ] Press button - no error
   - [ ] With LM Studio running - shows green
   - [ ] With LM Studio stopped - shows red

2. **Load Model**
   - [ ] Can configure model path
   - [ ] "Refresh Models" button works
   - [ ] Loading a model succeeds
   - [ ] Shows checkmark on success

3. **Unload Model**
   - [ ] Unloads current model
   - [ ] Shows checkmark on success
   - [ ] Confirmation works (if enabled)

4. **Server Settings**
   - [ ] Settings save correctly
   - [ ] Can modify port
   - [ ] Can adjust temperature
   - [ ] Values persist after restart

5. **Quick Chat**
   - [ ] Can send messages
   - [ ] Receives responses
   - [ ] Presets work
   - [ ] Copy to clipboard works (if enabled)

## Next Steps

Once installed and tested:

1. **Read the Documentation:**
   - See `README.md` for full features
   - Check `QUICKSTART.md` for usage tips

2. **Customize Your Setup:**
   - Add buttons to your Stream Deck
   - Configure your workflows
   - Create custom chat prompts

3. **Start Using:**
   - Load your favorite model
   - Set up quick chat shortcuts
   - Enjoy one-press AI control!

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Stream Deck logs
3. Test LM Studio API manually
4. Verify all files are present

## Updates

To update the plugin:
1. Delete old version from Plugins folder
2. Copy new version
3. Restart Stream Deck
4. Settings should be preserved

---

**Installation complete!** Your LM Studio controller is ready to use. 🚀
