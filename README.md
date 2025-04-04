# Easy Chrome Advanced

A minimalist Chrome extension that provides quick access to essential browser tab management features.

## Features

- **Hard Refresh**: Clear cache, cookies, and storage for the current domain with a single click
- **Tab Muting**: Quickly mute/unmute the current tab
- **Minimalist UI**: Clean, intuitive interface with hover tooltips
- **Lightweight**: Built with modern web technologies for optimal performance

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from this project

## Development

- **Start development server**:
  ```bash
  npm run dev
  ```
- **Build for production**:
  ```bash
  npm run build
  ```

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Vite
- Chrome Extension APIs

## Permissions

This extension requires the following permissions:
- `activeTab`: To interact with the current tab
- `browsingData`: To clear cache and cookies
- `cookies`: To manage cookies
- `storage`: To store extension settings

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.