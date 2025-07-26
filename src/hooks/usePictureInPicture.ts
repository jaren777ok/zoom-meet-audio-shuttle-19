import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePictureInPictureProps {
  width?: number;
  height?: number;
}

export const usePictureInPicture = ({ width = 400, height = 300 }: UsePictureInPictureProps = {}) => {
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const sourceElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check if Picture-in-Picture is supported
    setIsPiPSupported('documentPictureInPicture' in window);
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

      // Copy styles from main document
      const styleSheets = Array.from(document.styleSheets);
      styleSheets.forEach((styleSheet) => {
        try {
          const cssRules = Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          // Some stylesheets might not be accessible due to CORS
          console.warn('Could not copy stylesheet:', e);
        }
      });

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
      setIsPiPActive(false);
    }
  }, []);

  const updatePictureInPictureContent = useCallback(() => {
    if (pipWindowRef.current && sourceElementRef.current) {
      console.log('🔄 Updating PiP content with 100ms timeout');
      
      // Use 100ms timeout like in the successful implementation
      setTimeout(() => {
        if (pipWindowRef.current && sourceElementRef.current) {
          const targetElement = pipWindowRef.current.document.body.firstElementChild;
          if (targetElement) {
            // Update the content by cloning the source element fresh
            const updatedClone = sourceElementRef.current.cloneNode(true) as HTMLElement;
            pipWindowRef.current.document.body.removeChild(targetElement);
            pipWindowRef.current.document.body.appendChild(updatedClone);
            console.log('✅ PiP content updated successfully');
          }
        }
      }, 100);
    }
  }, []);

  // Keep the old function for backward compatibility
  const updatePiPContent = useCallback((newContent: string) => {
    updatePictureInPictureContent();
  }, [updatePictureInPictureContent]);

  return {
    isPiPSupported,
    isPiPActive,
    error,
    openPictureInPicture,
    closePictureInPicture,
    updatePiPContent,
    updatePictureInPictureContent, // New main function with timeout
    pipWindow: pipWindowRef.current,
  };
};