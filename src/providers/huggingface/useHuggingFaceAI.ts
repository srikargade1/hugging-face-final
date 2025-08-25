import { useEffect, useRef } from 'react';

// Custom hook to intercept AI calls and route them to HuggingFace when needed
export function useHuggingFaceAI() {
  // Create a ref to store the original fetch function
  const originalFetchRef = useRef<typeof fetch | null>(null);
  const isInterceptingRef = useRef(false);
  const configRef = useRef<{
    apiKey: string | undefined;
    endpointUrl: string | undefined;
    modelId: string | undefined;
    isHuggingfaceProvider: boolean;
  }>({
    apiKey: undefined,
    endpointUrl: undefined,
    modelId: undefined,
    isHuggingfaceProvider: false,
  });
  
  // Function to update configuration without causing re-renders
  const updateConfig = (newConfig: typeof configRef.current) => {
    configRef.current = newConfig;
  };
  
  // Function to check if we should intercept
  const shouldIntercept = () => {
    const config = configRef.current;
    return config.isHuggingfaceProvider && 
           !!(config.apiKey && config.endpointUrl);
  };
  
  // Intercept fetch calls when HuggingFace is selected
  useEffect(() => {
    // Prevent multiple interceptors from being set up
    if (isInterceptingRef.current) {
      return;
    }
    
    if (shouldIntercept()) {
      // Store the original fetch function only once
      if (!originalFetchRef.current) {
        originalFetchRef.current = window.fetch;
      }
      
      // Mark that we're intercepting
      isInterceptingRef.current = true;
      
      // Override the fetch function to intercept AI calls
      const originalFetch = originalFetchRef.current;
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        // Check if this is an AI API call that should be routed to HuggingFace
        if (url.includes('/v1/chat/completions') || url.includes('/v1/completions')) {
          // This is an AI API call - route it to HuggingFace
          console.log('🚀 HuggingFace Interceptor: Intercepted AI API call:', url);
          console.log('📡 Routing to HuggingFace endpoint:', configRef.current.endpointUrl);
          
          try {
            // Construct the HuggingFace endpoint URL
            const hfEndpoint = configRef.current.endpointUrl!.replace(/\/$/, ''); // Remove trailing slash
            const hfUrl = `${hfEndpoint}/v1/chat/completions`;
            
            console.log('🔗 HuggingFace URL:', hfUrl);
            
            // Create a new request to HuggingFace
            const hfRequest = new Request(hfUrl, {
              method: init?.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${configRef.current.apiKey}`,
                ...init?.headers,
              },
              body: init?.body,
            });
            
            console.log('📤 Sending request to HuggingFace...');
            
            // Make the request to HuggingFace
            const response = await originalFetch(hfRequest);
            
            console.log('✅ HuggingFace response received:', response.status, response.statusText);
            
            // Return the response from HuggingFace
            return response;
          } catch (error) {
            // If HuggingFace fails, fall back to the original request
            console.error('❌ HuggingFace provider failed:', error);
            console.warn('🔄 Falling back to original API');
            return originalFetch(input, init);
          }
        }
        
        // For non-AI calls, use the original fetch
        return originalFetch(input, init);
      };
    } else {
      // If not using HuggingFace, restore the original fetch
      if (originalFetchRef.current && isInterceptingRef.current) {
        window.fetch = originalFetchRef.current;
        isInterceptingRef.current = false;
      }
    }
    
    // Cleanup function to restore the original fetch
    return () => {
      if (originalFetchRef.current && isInterceptingRef.current) {
        window.fetch = originalFetchRef.current;
        isInterceptingRef.current = false;
      }
    };
  }, []); // Empty dependency array to prevent re-runs
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (originalFetchRef.current && isInterceptingRef.current) {
        window.fetch = originalFetchRef.current;
        isInterceptingRef.current = false;
      }
    };
  }, []);
  
  return {
    updateConfig,
    isConfigured: shouldIntercept(),
  };
}
