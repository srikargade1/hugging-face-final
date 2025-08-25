import {Input, SkeletonPane} from '@sqlrooms/ui';
import {KeyIcon, ServerIcon, CpuIcon, GlobeIcon} from 'lucide-react';
import {
  AnalysisResultsContainer,
  SessionControls,
  QueryControls,
  ModelSelector,
  useStoreWithAi,
} from '@sqlrooms/ai';
import {useRoomStore} from '../store';
import {
  LLM_MODELS,
  OLLAMA_DEFAULT_BASE_URL,
  CUSTOM_MODEL_NAME,
} from '../models';
import {capitalize} from '@sqlrooms/utils';
import {useMemo, useState, useEffect} from 'react';
import { useHuggingFaceProvider } from '../providers/huggingface/useHuggingFaceProvider';
import { useHuggingFaceAI } from '../providers/huggingface/useHuggingFaceAI';

// Toast notification component
const ToastNotification: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const MainView: React.FC = () => {
  const currentSessionId = useRoomStore((s) => s.config.ai.currentSessionId);
  const currentSession = useRoomStore((s) => {
    const sessions = s.config.ai.sessions;
    return sessions.find((session) => session.id === currentSessionId);
  });

  // Check if data is available
  const isDataAvailable = useRoomStore((state) => state.room.initialized);

  const apiKeys = useRoomStore((s) => s.apiKeys);
  const setProviderApiKey = useRoomStore((s) => s.setProviderApiKey);

  // Get AI slice functions
  const setOllamaBaseUrl = useStoreWithAi((s) => s.ai.setOllamaBaseUrl);
  const setCustomModelName = useStoreWithAi((s) => s.ai.setCustomModelName);

  // Get HuggingFace-specific state and setters
  const huggingfaceProvider = useHuggingFaceProvider();
  const huggingfaceEndpointUrl = huggingfaceProvider.endpointUrl;
  const setHuggingfaceEndpointUrl = useRoomStore((s) => s.setHuggingfaceEndpointUrl);
  const huggingfaceModelId = huggingfaceProvider.modelId;
  const setHuggingfaceModelId = useRoomStore((s) => s.setHuggingfaceModelId);

  // Enable HuggingFace AI integration with fetch interception
  const huggingfaceAI = useHuggingFaceAI();
  
  // The current model is from the session
  const currentModelProvider =
    currentSession?.modelProvider || LLM_MODELS[0].name;

  const apiKey = apiKeys[currentModelProvider] || '';
  const ollamaBaseUrl =
    currentSession?.ollamaBaseUrl || OLLAMA_DEFAULT_BASE_URL;

  // State for custom model name
  const [customModelNameLocal, setCustomModelNameLocal] = useState('');
  
  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Check if current provider is ollama
  const isOllamaProvider = currentModelProvider === 'ollama';

  // Check if current provider is huggingface
  const isHuggingfaceProvider = currentModelProvider === 'huggingface';

  // Check if current model is custom
  const isCustomModel = currentSession?.model === CUSTOM_MODEL_NAME;
  
  // Update HuggingFace AI configuration when needed
  useEffect(() => {
    if (isHuggingfaceProvider) {
      huggingfaceAI.updateConfig({
        apiKey: huggingfaceProvider.apiKey,
        endpointUrl: huggingfaceProvider.endpointUrl,
        modelId: huggingfaceProvider.modelId,
        isHuggingfaceProvider: true,
      });
    } else {
      huggingfaceAI.updateConfig({
        apiKey: undefined,
        endpointUrl: undefined,
        modelId: undefined,
        isHuggingfaceProvider: false,
      });
    }
  }, [isHuggingfaceProvider, huggingfaceProvider.apiKey, huggingfaceProvider.endpointUrl, huggingfaceProvider.modelId, huggingfaceAI]);

  // Initialize custom model name from current session
  useEffect(() => {
    if (
      currentSession?.customModelName &&
      currentSession?.model === CUSTOM_MODEL_NAME
    ) {
      setCustomModelNameLocal(currentSession.customModelName);
    } else {
      setCustomModelNameLocal('');
    }
  }, [currentSession]);

  const onApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProviderApiKey(currentModelProvider, e.target.value);
  };

  const onOllamaBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOllamaBaseUrl(e.target.value);
  };

  const onCustomModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const modelName = e.target.value;
    setCustomModelNameLocal(modelName);
  };

  const onHuggingfaceEndpointUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHuggingfaceEndpointUrl(e.target.value);
  };

  const onHuggingfaceModelIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHuggingfaceModelId(e.target.value);
  };

  // Close toast notification
  const closeToast = () => {
    setToast(null);
  };

  // Test HuggingFace connection
  const testHuggingFaceConnection = async () => {
    if (!huggingfaceProvider.isConfigured) {
      setToast({
        message: 'Please configure HuggingFace API key and endpoint URL first.',
        type: 'error'
      });
      return;
    }
    
    try {
      // Test the actual HuggingFace endpoint directly
      const endpoint = huggingfaceProvider.endpointUrl!.replace(/\/$/, '');
      const testUrl = `${endpoint}/v1/chat/completions`;
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${huggingfaceProvider.apiKey}`,
        },
        body: JSON.stringify({
          model: huggingfaceProvider.modelId || 'tgi',
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message.'
            }
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });
      
      if (response.ok) {
        setToast({
          message: 'HuggingFace connection successful! API interception will work properly.',
          type: 'success'
        });
      } else {
        const errorData = await response.text();
        setToast({
          message: `Connection failed: HTTP ${response.status} - ${errorData}`,
          type: 'error'
        });
      }
    } catch (error) {
      setToast({
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };

  // Debounced effect to update the custom model name in the store after user stops typing
  useEffect(() => {
    if (currentSession?.model === CUSTOM_MODEL_NAME) {
      const timeoutId = setTimeout(() => {
        setCustomModelName(customModelNameLocal);
      }, 500); // 500ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [customModelNameLocal, currentSession, setCustomModelName]);

  // Transform LLM_MODELS into the format expected by ModelSelector
  const modelOptions = useMemo(
    () =>
      LLM_MODELS.flatMap((provider) =>
        provider.models.map((model) => ({
          provider: provider.name,
          label: model,
          value: model,
        })),
      ),
    [],
  );



  return (
    <div className="flex h-full w-full flex-col gap-0 overflow-hidden p-4">
      {/* Display SessionControls at the top */}
      <div className="mb-4">
        <SessionControls />
      </div>

      {/* Display AnalysisResultsContainer without the session controls UI  */}
      <div className="flex-grow overflow-auto">
        {isDataAvailable ? (
          <AnalysisResultsContainer
            key={currentSessionId} // will prevent scrolling to bottom after changing current session
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <SkeletonPane className="p-4" />
            <p className="text-muted-foreground mt-4">Loading database...</p>
          </div>
        )}
      </div>

      <QueryControls placeholder="Type here what would you like to learn about the data? Something like 'What is the max magnitude of the earthquakes by year?'">

        
        
        
        <div className="flex items-center justify-end gap-2">
          {!isOllamaProvider && !isHuggingfaceProvider && (
            <div className="relative flex items-center">
              <KeyIcon className="absolute left-2 h-4 w-4" />
              <Input
                className="w-[165px] pl-8"
                type="password"
                placeholder={`${capitalize(currentModelProvider)} API Key`}
                value={apiKey}
                onChange={onApiKeyChange}
              />
            </div>
          )}
          {isOllamaProvider && (
            <div className="relative flex items-center">
              <ServerIcon className="absolute left-2 h-4 w-4" />
              <Input
                className="w-[200px] pl-8"
                type="text"
                placeholder="Ollama Server URL"
                value={ollamaBaseUrl}
                onChange={onOllamaBaseUrlChange}
              />
            </div>
          )}
          {isOllamaProvider && isCustomModel && (
            <div className="relative flex items-center">
              <CpuIcon className="absolute left-2 h-4 w-4" />
              <Input
                className="w-[200px] pl-8"
                type="text"
                placeholder="e.g., llama2:7b, codellama:7b"
                value={customModelNameLocal}
                onChange={onCustomModelNameChange}
              />
            </div>
          )}
          {isHuggingfaceProvider && (
            <div className="relative flex items-center">
              <KeyIcon className="absolute left-2 h-4 w-4" />
              <Input
                className="w-[165px] pl-8"
                type="password"
                placeholder="HuggingFace API Key"
                value={apiKey}
                onChange={onApiKeyChange}
              />
            </div>
          )}
          {isHuggingfaceProvider && (
            <div className="relative flex items-center">
              <GlobeIcon className="absolute left-2 h-4 w-4" />
              <Input
                className="w-[280px] pl-8"
                type="text"
                placeholder="https://your-endpoint.endpoints.huggingface.cloud"
                value={huggingfaceEndpointUrl || ''}
                onChange={onHuggingfaceEndpointUrlChange}
              />
            </div>
          )}
          {isHuggingfaceProvider && isCustomModel && (
            <div className="relative flex items-center">
              <CpuIcon className="absolute left-2 h-4 w-4" />
              <Input
                className="w-[200px] pl-8"
                type="text"
                placeholder="e.g., microsoft/Phi-3-mini-4k-instruct"
                value={huggingfaceModelId || ''}
                onChange={onHuggingfaceModelIdChange}
              />
            </div>
          )}
          {isHuggingfaceProvider && huggingfaceProvider.isConfigured && (
            <button
              onClick={testHuggingFaceConnection}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              title="Test HuggingFace connection"
            >
              Test Connection
            </button>
          )}
                     <ModelSelector models={modelOptions} className="w-[200px]" />
         </div>
       </QueryControls>
       
       {/* Toast notification */}
       {toast && (
         <ToastNotification
           message={toast.message}
           type={toast.type}
           onClose={closeToast}
         />
       )}
     </div>
   );
 };
