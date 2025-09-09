import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface UsePictureInPictureProps {
  width?: number;
  height?: number;
}

export const usePictureInPicture = ({ width = 400, height = 300 }: UsePictureInPictureProps = {}) => {
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPiPUpdatePaused, setIsPiPUpdatePaused] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const sourceElementRef = useRef<HTMLElement | null>(null);
  const stylesCache = useRef<string | null>(null);
  const lastContentHash = useRef<string>('');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if Picture-in-Picture is supported
    setIsPiPSupported('documentPictureInPicture' in window);
    
    // Listen for window focus/blur to pause updates
    const handleWindowBlur = () => {
      console.log('🔇 Main window blurred, pausing PiP updates');
      setIsPiPUpdatePaused(true);
    };
    
    const handleWindowFocus = () => {
      console.log('🔊 Main window focused, resuming PiP updates');
      setIsPiPUpdatePaused(false);
    };
    
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const openPictureInPicture = useCallback(async (sourceElement: HTMLElement) => {
    if (!isPiPSupported) {
      setError('Picture-in-Picture no está soportado en este navegador');
      return false;
    }

    if (isPiPActive) {
      setError('Ya hay una ventana Picture-in-Picture activa');
      return false;
    }

    try {
      // @ts-ignore - documentPictureInPicture is experimental
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width,
        height,
      });

      // Copy styles from main document (use cache if available)
      if (!stylesCache.current) {
        console.log('💾 Caching styles for PiP');
        const styleSheets = Array.from(document.styleSheets);
        const allStyles: string[] = [];
        
        styleSheets.forEach((styleSheet) => {
          try {
            const cssRules = Array.from(styleSheet.cssRules)
              .map((rule) => rule.cssText)
              .join('');
            allStyles.push(cssRules);
          } catch (e) {
            // Some stylesheets might not be accessible due to CORS
            console.warn('Could not copy stylesheet:', e);
          }
        });
        
        stylesCache.current = allStyles.join('');
      }
      
      const style = document.createElement('style');
      style.textContent = stylesCache.current;
      pipWindow.document.head.appendChild(style);

      // Add Tailwind CSS link
      const tailwindLink = document.createElement('link');
      tailwindLink.rel = 'stylesheet';
      tailwindLink.href = 'https://cdn.tailwindcss.com';
      pipWindow.document.head.appendChild(tailwindLink);

      // Clone the source element
      const clonedElement = sourceElement.cloneNode(true) as HTMLElement;
      pipWindow.document.body.appendChild(clonedElement);

      // Style the PiP window body
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.padding = '0';
      pipWindow.document.body.style.backgroundColor = 'hsl(var(--background))';
      pipWindow.document.body.style.color = 'hsl(var(--foreground))';

      pipWindowRef.current = pipWindow;
      sourceElementRef.current = sourceElement;
      setIsPiPActive(true);
      setError(null);

      // Listen for window close
      pipWindow.addEventListener('pagehide', () => {
        setIsPiPActive(false);
        pipWindowRef.current = null;
        sourceElementRef.current = null;
        lastContentHash.current = '';
        setIsPiPUpdatePaused(false);
      });

      return true;
    } catch (err) {
      console.error('Error opening Picture-in-Picture:', err);
      setError('Error al abrir Picture-in-Picture');
      return false;
    }
  }, [isPiPSupported, isPiPActive, width, height]);

  const closePictureInPicture = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      sourceElementRef.current = null;
      lastContentHash.current = '';
      setIsPiPActive(false);
      setIsPiPUpdatePaused(false);
      
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    }
  }, []);

  // Debounced and optimized update function
  const debouncedUpdate = useDebouncedCallback(() => {
    if (!pipWindowRef.current || !sourceElementRef.current || isPiPUpdatePaused) {
      console.log('🚫 PiP update skipped (paused or no refs)');
      return;
    }

    try {
      // Generate content hash for change detection
      const messagesContainer = sourceElementRef.current.querySelector('[data-messages-container]');
      const currentContent = messagesContainer?.innerHTML || sourceElementRef.current.innerHTML;
      const contentHash = btoa(currentContent).slice(0, 20); // Simple hash
      
      if (contentHash === lastContentHash.current) {
        console.log('🔍 PiP content unchanged, skipping update');
        return;
      }
      
      console.log('🔄 Updating PiP content (optimized)');
      lastContentHash.current = contentHash;
      
      const targetElement = pipWindowRef.current.document.body.firstElementChild;
      if (targetElement && messagesContainer) {
        // Only update the messages container instead of the whole element
        const targetMessagesContainer = targetElement.querySelector('[data-messages-container]');
        if (targetMessagesContainer) {
          targetMessagesContainer.innerHTML = messagesContainer.innerHTML;
          console.log('✅ PiP messages container updated');
        } else {
          // Fallback to full clone if messages container not found
          const updatedClone = sourceElementRef.current.cloneNode(true) as HTMLElement;
          pipWindowRef.current.document.body.removeChild(targetElement);
          pipWindowRef.current.document.body.appendChild(updatedClone);
          console.log('✅ PiP full content updated (fallback)');
        }
      }
    } catch (error) {
      console.error('❌ Error updating PiP content:', error);
    }
  }, 500); // 500ms debounce instead of 100ms immediate

  const updatePictureInPictureContent = useCallback(() => {
    if (isPiPActive && !isPiPUpdatePaused) {
      // Clear any existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Schedule debounced update
      updateTimeoutRef.current = setTimeout(() => {
        debouncedUpdate();
      }, 50); // Small delay to batch rapid calls
    }
  }, [isPiPActive, isPiPUpdatePaused, debouncedUpdate]);

  // Keep the old function for backward compatibility
  const updatePiPContent = useCallback((newContent: string) => {
    updatePictureInPictureContent();
  }, [updatePictureInPictureContent]);

  return {
    isPiPSupported,
    isPiPActive,
    isPiPUpdatePaused,
    error,
    openPictureInPicture,
    closePictureInPicture,
    updatePiPContent,
    updatePictureInPictureContent,
    pipWindow: pipWindowRef.current,
  };
};