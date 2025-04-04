import React, { useState, useEffect } from 'react';

const App: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    // Get initial mute status
    const getInitialMuteStatus = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const tabInfo = await chrome.tabs.get(tab.id);
        setIsMuted(tabInfo.mutedInfo?.muted || false);
      }
    };
    getInitialMuteStatus();
  }, []);

  const handleHardRefresh = async () => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.id && tab.url) {
        // Clear cache and cookies for the current domain
        const url = new URL(tab.url);
        const origin = `${url.protocol}//${url.hostname}`;
        
        // Clear cache for the current domain
        await chrome.browsingData.remove(
          {
            origins: [origin]
          },
          {
            cache: true,
            cacheStorage: true,
            cookies: true,
            localStorage: true,
            serviceWorkers: true
          }
        );

        // Hard refresh the page
        await chrome.tabs.reload(tab.id, { bypassCache: true });
      }
    } catch (error) {
      console.error('Error during hard refresh:', error);
    }
  };

  const handleMuteToggle = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.update(tab.id, { muted: !isMuted });
        setIsMuted(!isMuted);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleScreenshot = async () => {
    try {
      setIsCapturing(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.id) {
        // Capture the visible tab
        const dataUrl = await chrome.tabs.captureVisibleTab();
        
        // Create a download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `screenshot-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error taking screenshot:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div 
      className="w-[180px] min-h-[10px] bg-white flex flex-col items-center gap-1 pt-1 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={handleHardRefresh}
          onMouseEnter={() => setActiveTooltip('refresh')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transform hover:rotate-180 transition-transform duration-500"
          >
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
        
        <button 
          onClick={handleMuteToggle}
          onMouseEnter={() => setActiveTooltip('mute')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {isMuted ? (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </>
            ) : (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </>
            )}
          </svg>
        </button>

        <button 
          onClick={handleScreenshot}
          onMouseEnter={() => setActiveTooltip('screenshot')}
          onMouseLeave={() => setActiveTooltip(null)}
          disabled={isCapturing}
          className={`p-2 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center ${
            isCapturing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={isCapturing ? 'animate-spin' : ''}
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
      </div>
      
      <div className={`transition-all duration-300 ${isHovered ? 'h-[20px]' : 'h-0'}`}>
        <span 
          className={`text-[10px] text-gray-500 transition-all duration-300 ${
            activeTooltip ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeTooltip === 'refresh' ? 'Hard Refresh' : 
           activeTooltip === 'mute' ? (isMuted ? 'Unmute Tab' : 'Mute Tab') :
           activeTooltip === 'screenshot' ? (isCapturing ? 'Capturing...' : 'Take Screenshot') : ''}
        </span>
      </div>
    </div>
  );
};

export default App; 