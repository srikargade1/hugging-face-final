import { useMemo } from 'react';
import { useRoomStore } from '../../store';

export function useHuggingFaceProvider() {
  const apiKey = useRoomStore((s) => s.apiKeys.huggingface);
  const endpointUrl = useRoomStore((s) => s.huggingfaceEndpointUrl);
  const modelId = useRoomStore((s) => s.huggingfaceModelId);
  
  const isConfigured = useMemo(() => {
    return !!(apiKey && endpointUrl);
  }, [apiKey, endpointUrl]);
  
  const validateConfig = () => {
    const errors: string[] = [];
    
    if (!apiKey) {
      errors.push('HuggingFace API key is required');
    }
    
    if (!endpointUrl) {
      errors.push('HuggingFace endpoint URL is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  return {
    apiKey,
    endpointUrl,
    modelId,
    isConfigured,
    validateConfig,
  };
}
