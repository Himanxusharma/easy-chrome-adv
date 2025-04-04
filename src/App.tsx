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
  const [isShortening, setIsShortening] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [storedNote, setStoredNote] = useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Helper function to check if URL is restricted
  const isRestrictedUrl = (url: string | undefined) => {
    if (!url) return true;
    return url.startsWith('chrome://') || url.startsWith('chrome-extension://');
  };

  // Helper function to show error message
  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  useEffect(() => {
    // Get initial mute status
    const getInitialMuteStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          const tabInfo = await chrome.tabs.get(tab.id);
          setIsMuted(tabInfo.mutedInfo?.muted || false);
        }
      } catch (error: unknown) {
        // Don't show error for restricted pages
        if (error instanceof Error && !isRestrictedUrl(error.message)) {
          showError("Failed to get mute status");
        }
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
        if (isRestrictedUrl(tab.url)) {
          setIsLocked(false);
          return;
        }
        
        if (tab.id) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
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
      } catch (error: unknown) {
        // Don't show error for restricted pages
        if (error instanceof Error && !isRestrictedUrl(error.message)) {
          showError("Failed to check lock status");
        }
        setIsLocked(false);
      }
    };
    checkTabLockStatus();

    // Check if any video is in PiP mode
    const checkPiPStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (isRestrictedUrl(tab.url)) {
          setIsPiPActive(false);
          return;
        }
        
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
      } catch (error: unknown) {
        // Don't show error for restricted pages
        if (error instanceof Error && !isRestrictedUrl(error.message)) {
          showError("Failed to check PiP status");
        }
        setIsPiPActive(false);
      }
    };
    checkPiPStatus();

    // Get stored note on component mount
    chrome.storage.local.get(['quickNote'], (result) => {
      if (result.quickNote) {
        setStoredNote(result.quickNote);
      }
    });
  }, []);

  const handleHardRefresh = async () => {
    try {
      setShowPasswordInput(false); // Close password modal
      setShowNoteInput(false); // Close note input
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        // Clear cache and cookies for the current domain
        if (tab.url) {
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
        }

        // Hard refresh the page
        await chrome.tabs.reload(tab.id, { bypassCache: true });
      }
    } catch (error) {
      showError("Failed to refresh the page");
    }
  };

  const handleMuteToggle = async () => {
    try {
      setShowPasswordInput(false); // Close password modal
      setShowNoteInput(false); // Close note input
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.update(tab.id, { muted: !isMuted });
        setIsMuted(!isMuted);
      }
    } catch (error) {
      showError("Failed to toggle mute");
    }
  };

  const handleScreenshot = async () => {
    try {
      setShowPasswordInput(false); // Close password modal
      setShowNoteInput(false); // Close note input
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      setIsCapturing(true);
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
      showError("Failed to capture screenshot");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleLockToggle = async () => {
    try {
      setShowNoteInput(false); // Close note input
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (isRestrictedUrl(tab.url)) {
        showError("Can't lock this type of page");
        return;
      }
      
      if (!storedPassword) {
        setShowPasswordInput(true);
        return;
      }
      setShowPasswordInput(true);
    } catch (error) {
      showError("Failed to toggle lock");
    }
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
      showError("Failed to lock the tab");
      setIsLocked(false);
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
      showError("Failed to unlock the tab");
      setIsLocked(true);
    }
  };

  const handlePiPToggle = async () => {
    try {
      setShowPasswordInput(false); // Close password modal
      setShowNoteInput(false); // Close note input
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (isRestrictedUrl(tab.url)) {
        showError("Can't use Picture-in-Picture on this page");
        return;
      }
      
      if (tab.id) {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async () => {
            try {
              if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                return { success: true, action: 'exit' };
              } else {
                const url = window.location.href;
                let video: HTMLVideoElement | null = null;

                if (url.includes('youtube.com/shorts')) {
                  video = document.querySelector('#shorts-player video') as HTMLVideoElement ||
                         document.querySelector('.html5-main-video') as HTMLVideoElement;
                } else if (url.includes('instagram.com/reels')) {
                  video = document.querySelector('video[preload="auto"]') as HTMLVideoElement ||
                         document.querySelector('video[type="video/mp4"]') as HTMLVideoElement ||
                         document.querySelector('.tWeCl') as HTMLVideoElement;
                } else {
                  const videos = document.querySelectorAll('video');
                  video = Array.from(videos).find(v => !v.paused) || videos[0] as HTMLVideoElement;
                }

                if (video) {
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
                  return { success: false, error: 'No video found on this page' };
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

        // Check for errors in the result
        if (!result[0]?.result?.success) {
          showError(result[0]?.result?.error || "Failed to toggle Picture-in-Picture");
          return;
        }
        
        // Update PiP status after successful toggle
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const videos = document.querySelectorAll('video');
            return Array.from(videos).some(video => document.pictureInPictureElement === video);
          }
        });
        setIsPiPActive(results[0]?.result || false);
      }
    } catch (error: unknown) {
      // Don't show error for restricted pages
      if (error instanceof Error && !isRestrictedUrl(error.message)) {
        showError("Failed to toggle Picture-in-Picture");
      }
    }
  };

  const handleShortenUrl = async () => {
    try {
      setShowPasswordInput(false); // Close password modal
      setShowNoteInput(false); // Close note input
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (isRestrictedUrl(tab.url)) {
        showError("Can't shorten this type of URL");
        return;
      }
      
      setIsShortening(true);
      if (!tab.url) {
        showError("No URL to shorten");
        return;
      }

      // Use TinyURL API to shorten the URL
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(tab.url)}`);
      if (!response.ok) {
        showError("Failed to shorten URL");
        return;
      }
      
      const shortUrl = await response.text();
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shortUrl);
      
      // Show copied notification
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      showError("Failed to shorten URL");
    } finally {
      setIsShortening(false);
    }
  };

  const handleNoteToggle = () => {
    setShowPasswordInput(false); // Close password modal
    if (storedNote) {
      setNote(storedNote); // Load existing note into input
      // Use setTimeout to ensure the textarea is rendered before setting cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const length = storedNote.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }
    setShowNoteInput(!showNoteInput);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (note.trim()) {
        await chrome.storage.local.set({ quickNote: note });
        setStoredNote(note);
        setNote('');
        setShowNoteInput(false);
      }
    } catch (error) {
      showError("Failed to save note");
    }
  };

  const handleClearNote = async () => {
    try {
      setNote(''); // Clear the input text
      await chrome.storage.local.remove(['quickNote']); // Remove from storage
      setStoredNote(null); // Clear the stored note state
    } catch (error) {
      showError("Failed to clear note");
    }
  };

  return (
    <div 
      className="w-[320px] min-h-[10px] bg-white flex flex-col items-center gap-1 pt-1 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {errorMessage && (
        <div className="w-full px-2 mb-1">
          <div className="w-full bg-red-100 text-red-600 text-[11px] px-2 py-1 rounded text-center">
            {errorMessage}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
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

        <button 
          onClick={handleShortenUrl}
          onMouseEnter={() => setActiveTooltip('shorten')}
          onMouseLeave={() => setActiveTooltip(null)}
          disabled={isShortening}
          className={`p-2 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center relative ${
            isShortening ? 'opacity-50 cursor-not-allowed' : ''
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
            className={isShortening ? 'animate-spin' : ''}
          >
            <path d="M13.5 10.5L21 3"></path>
            <path d="M21 3h-7"></path>
            <path d="M21 3v7"></path>
            <path d="M10.5 13.5L3 21"></path>
            <path d="M3 21h7"></path>
            <path d="M3 21v-7"></path>
          </svg>
          {showCopied && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded">
              Copied!
            </div>
          )}
        </button>

        <button 
          onClick={handleNoteToggle}
          onMouseEnter={() => setActiveTooltip('note')}
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
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
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
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-sm hover:shadow-md transition-all duration-200"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black hover:border hover:border-black transition-colors duration-200"
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

      {(showNoteInput || (storedNote && !showPasswordInput)) && (
        <div className="w-full p-2">
          {showNoteInput ? (
            <form onSubmit={handleNoteSubmit} className="flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type your note here..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-sm hover:shadow-md transition-all duration-200"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black hover:border hover:border-black transition-colors duration-200"
                >
                  Save Note
                </button>
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"
                >
                  Clear
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {storedNote}
              </div>
              <div className="flex justify-end mt-1">
                <button
                  onClick={handleNoteToggle}
                  className="text-xs text-black hover:text-gray-600 transition-colors duration-200"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
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
           activeTooltip === 'pip' ? (isPiPActive ? 'Exit PiP' : 'Enter PiP') :
           activeTooltip === 'shorten' ? (isShortening ? 'Shortening...' : 'Shorten URL') :
           activeTooltip === 'note' ? 'Quick Note' : ''}
        </span>
      </div>
    </div>
  );
};

export default App; 