# LM Studio Stream Deck Plugin - Quick Start

## Before You Begin
1. ✅ Install [LM Studio](https://lmstudio.ai)
2. ✅ Install [Stream Deck Software 6.0+](https://www.elgato.com/downloads)
3. ✅ Have at least one model downloaded in LM Studio

## Installation Steps

### 1. Install the Plugin
- **Option A:** Distribution file to be created
- **Option B:** Copy `com.custom.lmstudio.sdPlugin` folder to Stream Deck plugins directory

### 2. Start LM Studio Server
1. Open LM Studio
2. Go to "Local Server" tab
3. Click "Start Server"
4. Note the port (default: 1234)

### 3. Add Actions to Stream Deck

#### Quick Setup Profile
Here's a recommended button layout:

```
┌──────────┬──────────┬──────────┬──────────┐
│  Toggle  │   Load   │  Unload  │ Settings │
│  Server  │  Model   │  Model   │          │
├──────────┼──────────┼──────────┼──────────┤
│  Quick   │  Quick   │  Quick   │  Quick   │
│  Chat 1  │  Chat 2  │  Chat 3  │  Chat 4  │
└──────────┴──────────┴──────────┴──────────┘
```

#### Button 1: Toggle Server
- Action: "Toggle Server"
- Settings:
  - Auto-refresh: ✓ Enabled
  - Interval: 30 seconds
- **What it does:** Shows if LM Studio server is running

#### Button 2: Load Model
- Action: "Load Model"
- Settings:
  - Click "Refresh Model List"
  - Select your model
  - Set GPU layers (32 for good GPU, 0 for CPU)
- **What it does:** Loads your chosen model

#### Button 3: Unload Model
- Action: "Unload Model"
- Settings:
  - Optional: Enable confirmation
- **What it does:** Frees up memory

#### Button 4: Server Settings
- Action: "Server Settings"
- Settings:
  - Port: 1234
  - Temperature: 0.7
  - Max Tokens: -1 (unlimited)
- **What it does:** Configure generation settings

#### Buttons 5-8: Quick Chat (Examples)

**Button 5: Summarize**
- Message: `Please summarize the following text:`
- Label: "Summarize"
- Show response: ✓ Enabled

**Button 6: Explain Code**
- Message: `Please explain what this code does:`
- Label: "Code Help"
- Show response: ✓ Enabled

**Button 7: Grammar Check**
- Message: `Please check grammar and spelling:`
- Label: "Grammar"
- Copy to clipboard: ✓ Enabled

**Button 8: Ideas**
- Message: `Give me 5 creative ideas for:`
- Label: "Ideas"
- Show response: ✓ Enabled

## Testing Your Setup

### Test 1: Server Status
1. Make sure LM Studio server is running
2. Press "Toggle Server" button
3. Button should show ✓ and turn green
4. Title should update with model count

### Test 2: Load a Model
1. Press "Load Model" button
2. Wait for model to load
3. Check LM Studio to confirm
4. Button should show ✓

### Test 3: Send a Message
1. Press any "Quick Chat" button
2. Check LM Studio for the message
3. Response should appear (if enabled)
4. Button shows ✓ when complete

## Common Issues

### "Server not responding"
**Solution:** 
- Check LM Studio is running
- Click "Start Server" in LM Studio
- Verify port is 1234

### "Model failed to load"
**Solution:**
- Check you have enough RAM/VRAM
- Try loading in LM Studio first
- Verify model path is correct

### "Button doesn't respond"
**Solution:**
- Restart Stream Deck software
- Check settings are saved
- Verify LM Studio server is running

## Tips & Tricks

### Faster Model Switching
- Create multiple "Load Model" buttons
- Each configured with a different model
- One-press to switch between models

### Workflow Automation
- Combine with multi-actions
- Load model → Wait → Send message
- Create complex sequences

### Custom Prompts
- Use Quick Chat for repetitive tasks
- Create a button for each workflow
- Save time with one-press prompts

### Monitor Server
- Enable auto-refresh on Toggle Server
- Always know server status at a glance
- Set interval based on needs (30s recommended)

## Next Steps

1. **Customize Quick Chat Buttons**
   - Add your most-used prompts
   - Set up your workflow

2. **Create Model Profiles**
   - Different buttons for different models
   - Quick switching between tasks

3. **Explore Settings**
   - Adjust temperature for creativity
   - Set context length for longer chats
   - Configure GPU usage

4. **Build Automations**
   - Use multi-actions in Stream Deck
   - Chain multiple commands
   - Create complex workflows

## Getting Help

- Read the full README.md
- Check LM Studio documentation
- Visit Stream Deck support

---

**Ready to go!** Start by pressing the Toggle Server button to check your setup. 🚀
