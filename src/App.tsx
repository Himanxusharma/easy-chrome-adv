import React, { useState, useEffect } from 'react';

const App: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

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

    // Get stored password on component mount
    chrome.storage.local.get(['lockPassword'], (result) => {
      if (result.lockPassword) {
        setStoredPassword(result.lockPassword);
      }
    });

    // Check if tab is currently locked
    const checkTabLockStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Check for the presence of our lock overlay elements
              const hasLockOverlay = document.getElementById('tab-lock-overlay') !== null;
              const hasBackgroundOverlay = document.getElementById('tab-lock-background') !== null;
              const hasContentWrapper = document.getElementById('original-content-wrapper') !== null;
              
              return {
                isLocked: hasLockOverlay && hasBackgroundOverlay && hasContentWrapper
              };
            }
          });
          setIsLocked(results[0]?.result?.isLocked || false);
        }
      } catch (error) {
        console.error('Error checking tab lock status:', error);
      }
    };
    checkTabLockStatus();

    // Check if any video is in PiP mode
    const checkPiPStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const videos = document.querySelectorAll('video');
              return Array.from(videos).some(video => document.pictureInPictureElement === video);
            }
          });
          setIsPiPActive(results[0]?.result || false);
        }
      } catch (error) {
        console.error('Error checking PiP status:', error);
      }
    };
    checkPiPStatus();
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

  const handleLockToggle = async () => {
    if (!storedPassword) {
      // If no password is set, show password input
      setShowPasswordInput(true);
      return;
    }

    // Always show password input for both lock and unlock
    setShowPasswordInput(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storedPassword) {
      // Set new password
      await chrome.storage.local.set({ lockPassword: password });
      setStoredPassword(password);
      setPassword('');
      setShowPasswordInput(false);
      await lockTab();
    } else if (password === storedPassword) {
      // Correct password entered
      setPassword('');
      setShowPasswordInput(false);
      if (isLocked) {
        await unlockTab();
      } else {
        await lockTab();
      }
    } else {
      // Incorrect password
      alert('Incorrect password');
      setPassword('');
    }
  };

  const lockTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // First, wrap all existing body content in a container
            const contentWrapper = document.createElement('div');
            contentWrapper.id = 'original-content-wrapper';
            // Move all body content into the wrapper
            while (document.body.firstChild) {
              contentWrapper.appendChild(document.body.firstChild);
            }
            document.body.appendChild(contentWrapper);
            
            // Apply blur to the content wrapper
            contentWrapper.style.cssText = `
              filter: blur(5px);
              pointer-events: none;
            `;

            // Create overlay div
            const overlay = document.createElement('div');
            overlay.id = 'tab-lock-overlay';
            overlay.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 999999;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              color: #2c3e50;
              text-align: center;
              background: white;
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.05);
              max-width: 90%;
              width: 400px;
            `;

            // Create lock icon
            const lockIcon = document.createElement('div');
            lockIcon.innerHTML = `
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            `;
            lockIcon.style.cssText = `
              margin-bottom: 20px;
              color: #2c3e50;
            `;

            // Create message
            const message = document.createElement('div');
            message.innerHTML = `
              <h1 style="font-size: 24px; margin-bottom: 10px; color: #2c3e50;">🔒 Tab Locked 🔒</h1>
              <p style="font-size: 16px; margin-bottom: 5px; color: #2c3e50;">This tab is currently locked</p>
              <p style="font-size: 14px; color: #666;">Enter the password in the extension popup to unlock</p>
            `;

            // Add elements to overlay
            overlay.appendChild(lockIcon);
            overlay.appendChild(message);
            document.body.appendChild(overlay);

            // Add semi-transparent background overlay
            const backgroundOverlay = document.createElement('div');
            backgroundOverlay.id = 'tab-lock-background';
            backgroundOverlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              opacity: 0.95;
              z-index: 999998;
            `;
            document.body.insertBefore(backgroundOverlay, overlay);
          }
        });
        setIsLocked(true);
      }
    } catch (error) {
      console.error('Error locking tab:', error);
    }
  };

  const unlockTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Remove overlay elements
            const overlay = document.getElementById('tab-lock-overlay');
            const backgroundOverlay = document.getElementById('tab-lock-background');
            if (overlay) overlay.remove();
            if (backgroundOverlay) backgroundOverlay.remove();

            // Restore original content
            const contentWrapper = document.getElementById('original-content-wrapper');
            if (contentWrapper) {
              // Move all content back to body
              while (contentWrapper.firstChild) {
                document.body.appendChild(contentWrapper.firstChild);
              }
              contentWrapper.remove();
            }
          }
        });
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Error unlocking tab:', error);
    }
  };

  const handlePiPToggle = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async () => {
            try {
              if (document.pictureInPictureElement) {
                // Exit PiP mode
                await document.exitPictureInPicture();
                return { success: true, action: 'exit' };
              } else {
                // Special handling for different platforms
                const url = window.location.href;
                let video: HTMLVideoElement | null = null;

                if (url.includes('youtube.com/shorts')) {
                  // YouTube Shorts
                  video = document.querySelector('#shorts-player video') as HTMLVideoElement ||
                         document.querySelector('.html5-main-video') as HTMLVideoElement;
                } else if (url.includes('instagram.com/reels')) {
                  // Instagram Reels
                  video = document.querySelector('video[preload="auto"]') as HTMLVideoElement ||
                         document.querySelector('video[type="video/mp4"]') as HTMLVideoElement ||
                         document.querySelector('.tWeCl') as HTMLVideoElement;
                } else {
                  // Regular video handling
                  const videos = document.querySelectorAll('video');
                  video = Array.from(videos).find(v => !v.paused) || videos[0] as HTMLVideoElement;
                }

                if (video) {
                  // For YouTube Shorts and Instagram Reels, ensure video is playing
                  if (!video.paused) {
                    await video.requestPictureInPicture();
                  } else {
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                      await playPromise;
                      await video.requestPictureInPicture();
                    }
                  }
                  return { success: true, action: 'enter' };
                } else {
                  return { success: false, error: 'No video found' };
                }
              }
            } catch (error: unknown) {
              return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              };
            }
          }
        });
        
        // Update PiP status after toggle
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const videos = document.querySelectorAll('video');
            return Array.from(videos).some(video => document.pictureInPictureElement === video);
          }
        });
        setIsPiPActive(results[0]?.result || false);
      }
    } catch (error) {
      console.error('Error toggling PiP:', error);
    }
  };

  return (
    <div 
      className="w-[220px] min-h-[10px] bg-white flex flex-col items-center gap-1 pt-1 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-center gap-2">
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

        <button 
          onClick={handleLockToggle}
          onMouseEnter={() => setActiveTooltip('lock')}
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
            {isLocked ? (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                <line x1="12" y1="15" x2="12" y2="18"></line>
                <circle cx="12" cy="18" r="1"></circle>
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </>
            )}
          </svg>
        </button>

        <button 
          onClick={handlePiPToggle}
          onMouseEnter={() => setActiveTooltip('pip')}
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
            {isPiPActive ? (
              <>
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                <rect x="8" y="8" width="14" height="14" rx="2" ry="2"></rect>
              </>
            ) : (
              <>
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                <rect x="14" y="14" width="8" height="8" rx="1" ry="1"></rect>
              </>
            )}
          </svg>
        </button>
      </div>

      {showPasswordInput && (
        <div className="w-full p-2">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={storedPassword ? "Enter password" : "Set new password"}
              className="w-full px-2 py-1 text-sm border rounded"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {!storedPassword ? "Set Password" : (isLocked ? "Unlock" : "Lock")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordInput(false);
                  setPassword('');
                }}
                className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className={`transition-all duration-300 ${isHovered ? 'h-[20px]' : 'h-0'}`}>
        <span 
          className={`text-[10px] text-gray-500 transition-all duration-300 ${
            activeTooltip ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeTooltip === 'refresh' ? 'Hard Refresh' : 
           activeTooltip === 'mute' ? (isMuted ? 'Unmute Tab' : 'Mute Tab') :
           activeTooltip === 'screenshot' ? (isCapturing ? 'Capturing...' : 'Take Screenshot') :
           activeTooltip === 'lock' ? (isLocked ? 'Unlock Tab' : 'Lock Tab') :
           activeTooltip === 'pip' ? (isPiPActive ? 'Exit PiP' : 'Enter PiP') : ''}
        </span>
      </div>
    </div>
  );
};

export default App; 