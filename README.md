# Easy Chrome Extension

A powerful Chrome extension to enhance your browsing experience with essential tools and features.

## Features

### 🔄 Hard Refresh
- One-click hard refresh with cache clearing
- Perfect for developers and web testing
- Clears cookies and cache for the current domain

### 📝 Quick Notes
- Instant note-taking in the extension popup
- Persistent storage across sessions
- Quick access to your important notes

### 🔒 Tab Locking
- Password-protect your tabs
- Prevents unauthorized access
- Customizable lock screen

### 📸 Screenshot Capture
- Capture full tab screenshots
- Automatic download
- High-quality PNG format

### 🎥 Picture-in-Picture
- Enter PiP mode for any video
- Works with YouTube, Instagram, and more
- One-click toggle

### 🔄 Auto-Refresh
- Set custom refresh intervals
- Per-tab configuration
- Visual status indicator

### 📚 Daily URLs
- Save and manage frequently visited URLs
- Quick access to saved links
- Add current tab with one click
- Open all URLs at once

### 📦 Tab Archiving
- Archive inactive tabs
- Restore archived tabs anytime
- Keep important tabs (pinned/active)

## Installation

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your toolbar

## Usage

1. Click the extension icon to open the popup
2. Use the toolbar buttons to access different features
3. Configure settings as needed
4. Your data is automatically saved locally

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

## Development

Built with:
- React
- TypeScript
- Chrome Extension APIs
- Supabase (for feedback)

## Support

For support or feedback:
1. Use the feedback feature in the extension
2. Open an issue on GitHub
3. Contact through the extension's info section

## License

MIT License - See LICENSE file for details