# 🚀 Easy Chrome Advanced

A powerful Chrome extension that supercharges your browsing experience with essential tools at your fingertips! ✨

<div align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Chrome-Extension-yellow" alt="Chrome Extension">
</div>

## 🌟 Features

### 🔄 Hard Refresh
- One-click cache clearing
- Instant page reload
- Perfect for developers and testers
- Clears cookies and cache for the current domain

### ⏱️ Auto-Refresh
- Tab-specific refresh intervals
- Customizable timing (5-3600 seconds)
- Multiple tabs refresh independently
- Visual status indicator
- Persistent settings per tab

### 📚 Daily URLs
- Save frequently visited URLs
- Automatic title generation from domain names
- Quick access to your daily sites
- Open all URLs with one click
- Edit and manage your URL list
- Add current tab with one click

### 🔇 Smart Mute
- Quick tab muting/unmuting
- Visual mute status indicator
- Works on any tab

### 📸 Screenshot Tool
- Instant tab capture
- Automatic file naming
- One-click download
- High-quality PNG format

### 🎥 Picture-in-Picture
- Smart video detection
- Works with YouTube, Instagram, and more
- One-click PiP mode

### 📝 Quick Notes
- Persistent note storage
- Easy editing
- Clean interface
- Quick access to your important notes

### 📦 Smart Tab Archive
- Archive inactive tabs
- Restore archived tabs
- Keep important tabs (pinned/active)
- Restore all tabs at once
- Clear archived tabs

## 🎨 UI/UX Highlights

- **Minimalist Design**: Clean, modern interface with a black color scheme
- **Smart Tooltips**: Context-aware tooltips provide guidance
- **Smooth Animations**: Fluid transitions and effects
- **Responsive Layout**: Adapts to content dynamically
- **Error Handling**: User-friendly error messages for restricted pages
- **Tab-Specific Features**: Features like auto-refresh work independently on different tabs
- **Modal Management**: Clean modal system with proper state handling

## 🛠️ Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

## 🔧 Development

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes
npm run watch
```

## 🎯 Usage

### Hard Refresh & Auto-Refresh
- Click the refresh icon for a one-time hard refresh
- Click the clock icon to set up auto-refresh intervals
- Each tab can have its own refresh schedule

### Daily URLs
- Click the house icon to manage your daily URLs
- Add URLs with optional custom titles
- Open all saved URLs at once
- Edit or delete URLs as needed
- Add current tab with one click

### Tab Management
- Use the mute button to toggle audio
- Click the lock icon to password-protect sensitive tabs
- Enable Picture-in-Picture mode for videos with a single click
- Archive inactive tabs to free up memory
- Restore archived tabs when needed

### Productivity Tools
- Save persistent notes with the pencil icon
- Access your notes across browser sessions

## 🌈 Pro Tips

- **Error Handling**: The extension shows helpful error messages for restricted pages
- **Auto-Refresh**: Keep the popup open in a separate window for continuous refreshing
- **Multiple Tabs**: Set different refresh intervals for different tabs
- **Quick Notes**: Notes persist across browser sessions
- **Daily URLs**: Leave the title field empty to automatically use the domain name
- **Tab Archive**: Use the "Keep important tabs" option to preserve pinned tabs

## Privacy

- All data is stored locally in your browser
- No sensitive information is collected
- No personal data is shared with third parties
- See [Privacy Policy](PRIVACY_POLICY.md) for details

## Permissions

The extension requires the following permissions:
- `activeTab`: For interacting with current tab
- `browsingData`: For cache clearing
- `cookies`: For managing cookies
- `storage`: For saving preferences
- `tabCapture`: For screenshots
- `scripting`: For tab locking
- `clipboardWrite`: For copying URLs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome Extension API
- React
- TypeScript
- Tailwind CSS
- Supabase (for feedback)

---

<div align="center">
  <p>Made with ❤️ by OOTM Lab</p>
  <p>⭐ Star this repository if you find it useful!</p>
</div>