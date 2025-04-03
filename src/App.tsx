import React from 'react';

const App: React.FC = () => {
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

  return (
    <div className="w-[100px] min-h-[10px] bg-white flex flex-col items-center gap-1 pt-1 group">
      <button 
        onClick={handleHardRefresh}
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
      <span className="text-[10px] text-gray-500 h-0 group-hover:h-[20px] opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-300">
        Hard Refresh
      </span>
    </div>
  );
};

export default App; 