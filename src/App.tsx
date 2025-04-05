import React, { useState, useEffect } from 'react';

interface TabArchive {
  url: string;
  title: string;
  favicon: string;
  timestamp: number;
  group?: string;
}

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
  const [showAutoRefreshInput, setShowAutoRefreshInput] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archivedTabs, setArchivedTabs] = useState<TabArchive[]>([]);
  const [archiveSettings, setArchiveSettings] = useState({
    keepImportant: true
  });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

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
    // Get current tab ID
    const getCurrentTab = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          setCurrentTabId(tab.id);
        }
      } catch (error) {
        console.error('Error getting current tab:', error);
      }
    };
    getCurrentTab();

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

    // Check if auto-refresh is active for current tab
    const checkAutoRefreshStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          const tabId = tab.id.toString();
          chrome.storage.local.get(['autoRefreshTabs'], (result) => {
            const autoRefreshTabs: Record<string, number> = result.autoRefreshTabs || {};
            if (autoRefreshTabs[tabId]) {
              setAutoRefreshInterval(autoRefreshTabs[tabId]);
              setAutoRefreshActive(true);
            } else {
              setAutoRefreshActive(false);
              setAutoRefreshInterval(30); // Default value
            }
          });
        }
      } catch (error) {
        console.error('Error checking auto-refresh status:', error);
      }
    };
    checkAutoRefreshStatus();
  }, []);

  // Handle auto-refresh functionality
  useEffect(() => {
    let refreshTimer: number | null = null;
    
    const setupAutoRefresh = async () => {
      if (!currentTabId) return;

      if (autoRefreshActive && autoRefreshInterval > 0) {
        // Store the auto-refresh settings for this specific tab
        chrome.storage.local.get(['autoRefreshTabs'], (result) => {
          const autoRefreshTabs: Record<string, number> = result.autoRefreshTabs || {};
          const tabId = currentTabId.toString();
          autoRefreshTabs[tabId] = autoRefreshInterval;
          chrome.storage.local.set({ autoRefreshTabs });
        });
        
        // Clear any existing timer
        if (refreshTimer) {
          window.clearInterval(refreshTimer);
        }
        
        // Setup interval to refresh the page
        refreshTimer = window.setInterval(() => {
          chrome.tabs.reload(currentTabId, { bypassCache: true });
        }, autoRefreshInterval * 1000);
      } else if (!autoRefreshActive) {
        // Remove this tab from auto-refresh tabs
        chrome.storage.local.get(['autoRefreshTabs'], (result) => {
          const autoRefreshTabs: Record<string, number> = result.autoRefreshTabs || {};
          const tabId = currentTabId.toString();
          if (autoRefreshTabs[tabId]) {
            delete autoRefreshTabs[tabId];
            chrome.storage.local.set({ autoRefreshTabs });
          }
        });

        if (refreshTimer) {
          window.clearInterval(refreshTimer);
        }
      }
    };
    
    setupAutoRefresh();
    
    // Cleanup function
    return () => {
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
      }
    };
  }, [autoRefreshActive, autoRefreshInterval, currentTabId]);

  const handleHardRefresh = async () => {
    try {
      setShowPasswordInput(false);
      setShowNoteInput(false);
      setShowAutoRefreshInput(false);
      setShowArchiveModal(false);
      setShowInfoModal(false);
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
      setShowPasswordInput(false);
      setShowNoteInput(false);
      setShowAutoRefreshInput(false);
      setShowArchiveModal(false);
      setShowInfoModal(false);
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
      setShowPasswordInput(false);
      setShowNoteInput(false);
      setShowAutoRefreshInput(false);
      setShowArchiveModal(false);
      setShowInfoModal(false);
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
      setShowNoteInput(false);
      setShowAutoRefreshInput(false);
      setShowArchiveModal(false);
      setShowInfoModal(false);
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
      setShowPasswordInput(false);
      setShowNoteInput(false);
      setShowAutoRefreshInput(false);
      setShowArchiveModal(false);
      setShowInfoModal(false);
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
      setShowPasswordInput(false);
      setShowNoteInput(false);
      setShowAutoRefreshInput(false);
      setShowArchiveModal(false);
      setShowInfoModal(false);
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
    setShowPasswordInput(false);
    setShowAutoRefreshInput(false);
    setShowArchiveModal(false);
    setShowInfoModal(false);
    if (storedNote) {
      setNote(storedNote);
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

  const handleAutoRefreshToggle = () => {
    setShowPasswordInput(false);
    setShowNoteInput(false);
    setShowArchiveModal(false);
    setShowInfoModal(false);
    setShowAutoRefreshInput(!showAutoRefreshInput);
  };

  const startAutoRefresh = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        setCurrentTabId(tab.id);
        setAutoRefreshActive(true);
        setShowAutoRefreshInput(false);
      }
    } catch (error) {
      showError("Failed to start auto-refresh");
    }
  };

  const stopAutoRefresh = () => {
    setAutoRefreshActive(false);
    setShowAutoRefreshInput(false);
  };

  // Load archived tabs from storage on component mount
  useEffect(() => {
    chrome.storage.local.get(['archivedTabs'], (result) => {
      if (result.archivedTabs) {
        setArchivedTabs(result.archivedTabs);
      }
    });
  }, []);

  // Save archived tabs to storage whenever they change
  useEffect(() => {
    chrome.storage.local.set({ archivedTabs });
  }, [archivedTabs]);

  // Track last active time for each tab
  useEffect(() => {
    // Initialize tab activity tracking
    const initTabActivity = async () => {
      const tabs = await chrome.tabs.query({});
      const currentTime = Date.now();
      const tabActivity: Record<string, number> = {};
      
      tabs.forEach(tab => {
        if (tab.id) {
          tabActivity[tab.id.toString()] = currentTime;
        }
      });

      await chrome.storage.local.set({ tabActivity });
    };

    // Update tab activity when a tab becomes active
    const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      const currentTime = Date.now();
      const tabId = activeInfo.tabId.toString();
      
      const { tabActivity } = await chrome.storage.local.get(['tabActivity']) as { tabActivity: Record<string, number> };
      tabActivity[tabId] = currentTime;
      await chrome.storage.local.set({ tabActivity });
    };

    // Initialize activity tracking
    initTabActivity();

    // Add event listener for tab activation
    chrome.tabs.onActivated.addListener(handleTabActivated);

    // Cleanup
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, []);

  // Function to archive inactive tabs
  const archiveInactiveTabs = async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const currentTime = Date.now();
      
      const tabsToArchive = tabs.filter(tab => {
        if (!tab.id || !tab.url || tab.url.startsWith('chrome://')) return false;
        
        // Check if tab is pinned (important)
        if (archiveSettings.keepImportant && tab.pinned) return false;
        
        // Check if tab is currently active
        if (tab.active) return false;

        return true;
      });

      if (tabsToArchive.length === 0) {
        showError('No inactive tabs found');
        return;
      }

      const newArchivedTabs: TabArchive[] = tabsToArchive.map(tab => ({
        url: tab.url || '',
        title: tab.title || '',
        favicon: tab.favIconUrl || '',
        timestamp: currentTime,
        group: 'Inactive'
      }));

      // Update archived tabs
      setArchivedTabs(prev => [...prev, ...newArchivedTabs]);
      
      // Close the archived tabs
      const tabIds = tabsToArchive.map(tab => tab.id).filter((id): id is number => id !== undefined);
      await chrome.tabs.remove(tabIds);

      // Show success message
      showError(`Archived ${tabsToArchive.length} inactive tabs`);
    } catch (error) {
      console.error('Error archiving tabs:', error);
      showError('Error archiving tabs');
    }
  };

  // Function to restore archived tab
  const restoreArchivedTab = async (tab: TabArchive) => {
    try {
      // First update storage
      const updatedTabs = archivedTabs.filter(t => t.url !== tab.url);
      await chrome.storage.local.set({ archivedTabs: updatedTabs });
      
      // Then update state
      setArchivedTabs(updatedTabs);
      
      // Finally create the new tab
      await chrome.tabs.create({ url: tab.url });
      showError('Tab restored successfully');
    } catch (error) {
      console.error('Error restoring tab:', error);
      showError('Error restoring tab');
    }
  };

  return (
    <div 
      className="w-[460px] min-h-[10px] bg-white flex flex-col items-center gap-1 pt-1 transition-all duration-300"
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

      {/* Auto-refresh status indicator */}
      {autoRefreshActive && !showAutoRefreshInput && (
        <div className="w-full px-2 mb-1">
          <div className="w-full bg-green-50 text-green-600 text-[11px] px-2 py-1 rounded text-center flex items-center justify-center">
            <svg className="w-3 h-3 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Auto-refreshing this tab every {autoRefreshInterval} seconds
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
            className={`transform hover:rotate-180 transition-transform duration-500 ${autoRefreshActive ? 'text-green-500' : ''}`}
          >
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
        
        <button 
          onClick={handleAutoRefreshToggle}
          onMouseEnter={() => setActiveTooltip('autoRefresh')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={autoRefreshActive ? "#16a34a" : "currentColor"} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
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
                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                <path d="M23 9l-6 6"></path>
                <path d="M17 9l6 6"></path>
              </>
            ) : (
              <>
                <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
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

        {/* Archive Button */}
        <button
          onClick={() => {
            setShowAutoRefreshInput(false);
            setShowNoteInput(false);
            setShowInfoModal(false);
            setShowArchiveModal(true);
          }}
          onMouseEnter={() => setActiveTooltip('archive')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8v13H3V8"></path>
            <path d="M1 3h22v5H1z"></path>
            <path d="M10 12h4"></path>
          </svg>
        </button>

        {/* Info Button */}
        <button
          onClick={() => {
            setShowAutoRefreshInput(false);
            setShowNoteInput(false);
            setShowArchiveModal(false);
            setShowInfoModal(true);
          }}
          onMouseEnter={() => setActiveTooltip('info')}
          onMouseLeave={() => setActiveTooltip(null)}
          className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
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
                  onClick={() => {
                    setShowAutoRefreshInput(false);
                    setShowArchiveModal(false);
                    setShowInfoModal(false);
                    handleNoteToggle();
                  }}
                  className="text-xs text-black hover:text-gray-600 transition-colors duration-200"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {showAutoRefreshInput && (
        <div className="w-full p-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <label className="text-sm mr-2">Refresh every:</label>
              <input
                type="number"
                min="5"
                max="3600"
                value={autoRefreshInterval || ''}
                onChange={(e) => setAutoRefreshInterval(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-sm transition-all duration-200"
                placeholder="Seconds"
              />
              <span className="text-sm ml-2">seconds</span>
            </div>
            <div className="text-[10px] text-gray-500 mb-2">
              {autoRefreshActive 
                ? `Auto-refreshing this tab every ${autoRefreshInterval} seconds` 
                : 'Minimum 5 seconds. Recommended: 30+ seconds'}
            </div>
            {autoRefreshActive && (
              <div className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded mb-2">
                <strong>Warning:</strong> Auto-refresh will stop working if you close this extension popup. Keep it open.
              </div>
            )}
            <div className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded mb-2">
              <strong>Tip:</strong> You can set different refresh intervals for different tabs. Each tab refreshes independently.
            </div>
            <div className="flex gap-2">
              {!autoRefreshActive ? (
                <button
                  onClick={startAutoRefresh}
                  disabled={!autoRefreshInterval || autoRefreshInterval < 5}
                  className={`flex-1 px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black hover:border hover:border-black transition-colors duration-200 ${
                    !autoRefreshInterval || autoRefreshInterval < 5 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Start Auto-Refresh
                </button>
              ) : (
                <button
                  onClick={stopAutoRefresh}
                  className="flex-1 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-white hover:text-red-500 hover:border hover:border-red-500 transition-colors duration-200"
                >
                  Stop Auto-Refresh
                </button>
              )}
              <button
                onClick={() => {
                  setShowAutoRefreshInput(false);
                  setShowNoteInput(false);
                  setShowArchiveModal(false);
                  setShowInfoModal(false);
                }}
                className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={`transition-all duration-300 ${isHovered ? 'h-[20px]' : 'h-0'}`}>
        <span 
          className={`text-[10px] text-gray-500 transition-all duration-300 ${
            activeTooltip ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeTooltip === 'refresh' ? 'Hard Refresh' : 
           activeTooltip === 'autoRefresh' ? (autoRefreshActive ? `Auto-Refresh (${autoRefreshInterval}s)` : 'Auto-Refresh') :
           activeTooltip === 'mute' ? (isMuted ? 'Unmute Tab' : 'Mute Tab') :
           activeTooltip === 'screenshot' ? (isCapturing ? 'Capturing...' : 'Take Screenshot') :
           activeTooltip === 'lock' ? (isLocked ? 'Unlock Tab' : 'Lock Tab') :
           activeTooltip === 'pip' ? (isPiPActive ? 'Exit PiP' : 'Enter PiP') :
           activeTooltip === 'shorten' ? (isShortening ? 'Shortening...' : 'Shorten URL') :
           activeTooltip === 'note' ? 'Quick Note' :
           activeTooltip === 'archive' ? 'Archive Tabs' :
           activeTooltip === 'info' ? 'Info' : ''}
        </span>
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="w-full p-2">
          <div className="flex flex-col gap-2">
            <button
              onClick={archiveInactiveTabs}
              className="w-full px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black hover:border hover:border-black transition-colors duration-200"
            >
              Archive Inactive Tabs
            </button>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={archiveSettings.keepImportant}
                onChange={(e) => setArchiveSettings(prev => ({
                  ...prev,
                  keepImportant: e.target.checked
                }))}
                className="rounded focus:ring-2 focus:ring-black"
              />
              <label className="text-sm">Keep important tabs (pinned or active)</label>
            </div>

            {/* Archived Tabs List */}
            {archivedTabs.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium">Archived Tabs</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const tabsCount = archivedTabs.length;
                          // Create all tabs first
                          const restorePromises = archivedTabs.map(tab => 
                            chrome.tabs.create({ url: tab.url })
                          );
                          await Promise.all(restorePromises);
                          
                          // Use the existing Clear All functionality
                          setArchivedTabs([]);
                          await chrome.storage.local.set({ archivedTabs: [] });
                          
                          showError(`Restored ${tabsCount} tabs`);
                        } catch (error) {
                          console.error('Error restoring all tabs:', error);
                          showError('Error restoring tabs');
                        }
                      }}
                      className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      Restore All
                    </button>
                    <button
                      onClick={async () => {
                        setArchivedTabs([]);
                        await chrome.storage.local.set({ archivedTabs: [] });
                      }}
                      className="text-xs text-red-500 hover:text-red-600 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {archivedTabs.map((tab, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-1.5 rounded">
                      <div className="flex items-center space-x-1.5">
                        <img src={tab.favicon} alt="" className="w-3 h-3" />
                        <span className="text-xs truncate max-w-[180px]">{tab.title}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => restoreArchivedTab(tab)}
                          className="text-xs text-blue-500 hover:text-blue-600 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100"
                        >
                          Restore
                        </button>
                        <button
                          onClick={async () => {
                            const updatedTabs = archivedTabs.filter(t => t.url !== tab.url);
                            setArchivedTabs(updatedTabs);
                            await chrome.storage.local.set({ archivedTabs: updatedTabs });
                          }}
                          className="text-xs text-red-500 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="flex-1 px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="w-full p-2">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-700">
              <h3 className="font-medium mb-2">Easy Chrome</h3>
              <p className="mb-2">A powerful Chrome extension to enhance your browsing experience.</p>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </button>
                <span className="text-sm">Click to {showFeatures ? 'hide' : 'show'} features</span>
              </div>
              
              {showFeatures && (
                <div className="grid grid-cols-2 gap-x-4 mb-2">
                  <ul className="list-disc list-inside">
                    <li>Hard Refresh</li>
                    <li>Auto-Refresh</li>
                    <li>Tab Muting</li>
                    <li>Screenshot Capture</li>
                    <li>Tab Locking</li>
                  </ul>
                  <ul className="list-disc list-inside">
                    <li>Picture-in-Picture</li>
                    <li>URL Shortening</li>
                    <li>Quick Notes</li>
                    <li>Tab Archiving</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1 mb-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={star <= (hoverRating || rating) ? "#fbbf24" : "none"}
                      stroke={star <= (hoverRating || rating) ? "#fbbf24" : "currentColor"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {rating === 0 ? 'Rate your experience' : `You rated ${rating} star${rating > 1 ? 's' : ''}`}
              </span>
            </div>

            {!showFeedback ? (
              <button
                onClick={() => setShowFeedback(true)}
                className="w-full px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black hover:border hover:border-black transition-colors duration-200"
              >
                Send Feedback
              </button>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  // Send feedback to API
                  const response = await fetch('https://api.ootmlab.com/feedback', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      rating,
                      feedback,
                      extension: 'Easy Chrome',
                      version: '1.0.0',
                      timestamp: new Date().toISOString()
                    })
                  });

                  if (!response.ok) {
                    throw new Error('Failed to send feedback');
                  }

                  setFeedback('');
                  setRating(0);
                  setShowFeedback(false);
                  showError('Thank you for your feedback!');
                } catch (error) {
                  console.error('Error sending feedback:', error);
                  showError('Failed to send feedback. Please try again.');
                }
              }} className="flex flex-col gap-2">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or report issues..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-sm hover:shadow-md transition-all duration-200"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-2 py-1 text-sm bg-black text-white rounded hover:bg-white hover:text-black hover:border hover:border-black transition-colors duration-200"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.open('https://buymeacoffee.com/ootmlab', '_blank')}
                className="w-full px-2 py-1 text-sm bg-pink-50 text-pink-600 rounded hover:bg-pink-100 transition-colors duration-200 flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Support Us
              </button>
              <p className="text-center text-gray-500 italic text-sm">
                Made with ❤️ by{' '}
                <a 
                  href="https://min-ootm.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 hover:underline transition-colors duration-200"
                >
                  OOTM Lab
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App; 