import {
  AiSliceConfig,
  AiSliceState,
  createAiSlice,
  createDefaultAiConfig,
} from '@sqlrooms/ai';
import {
  BaseRoomConfig,
  createRoomShellSlice,
  createRoomStore,
  LayoutTypes,
  MAIN_VIEW,
  RoomShellSliceState,
  StateCreator,
} from '@sqlrooms/room-shell';
import {
  createDefaultSqlEditorConfig,
  createSqlEditorSlice,
  SqlEditorSliceConfig,
  SqlEditorSliceState,
} from '@sqlrooms/sql-editor';
import {createVegaChartTool} from '@sqlrooms/vega';
import {DatabaseIcon} from 'lucide-react';
import {z} from 'zod';
import {persist} from 'zustand/middleware';
import {DataSourcesPanel} from './components/DataSourcesPanel';
import EchoToolResult from './components/EchoToolResult';
import {MainView} from './components/MainView';
import exampleSessions from './example-sessions.json';
import {DEFAULT_MODEL} from './models';


export const RoomPanelTypes = z.enum([
  'room-details',
  'data-sources',
  'view-configuration',
  MAIN_VIEW,
] as const);
export type RoomPanelTypes = z.infer<typeof RoomPanelTypes>;

/**
 * Room config for saving
 */
export const RoomConfig =
  BaseRoomConfig.merge(AiSliceConfig).merge(SqlEditorSliceConfig);
export type RoomConfig = z.infer<typeof RoomConfig>;

/**
 * Room state
 */
type CustomRoomState = {
  selectedModel: {
    model: string;
    provider: string;
  };
  setSelectedModel: (model: string, provider: string) => void;
  /** API keys by provider */
  apiKeys: Record<string, string | undefined>;
  setProviderApiKey: (provider: string, apiKey: string) => void;
  
  // HuggingFace configuration
  huggingfaceEndpointUrl: string | undefined;
  setHuggingfaceEndpointUrl: (url: string) => void;
  huggingfaceModelId: string | undefined;
  setHuggingfaceModelId: (modelId: string) => void;
};
export type RoomState = RoomShellSliceState<RoomConfig> &
  AiSliceState &
  SqlEditorSliceState &
  CustomRoomState;

/**
 * Create a customized room store
 */
export const {roomStore, useRoomStore} = createRoomStore<RoomConfig, RoomState>(
  persist(
    (set, get, store) => ({
      // Base room slice
      ...createRoomShellSlice<RoomConfig>({
        config: {
          layout: {
            type: LayoutTypes.enum.mosaic,
            nodes: {
              direction: 'row',
              first: RoomPanelTypes.enum['data-sources'],
              second: MAIN_VIEW,
              splitPercentage: 30,
            },
          },
          dataSources: [
            {
              tableName: 'earthquakes',
              type: 'url',
              url: 'https://raw.githubusercontent.com/keplergl/kepler.gl-data/refs/heads/master/earthquakes/data.csv',
            },
          ],
          ...createDefaultAiConfig(
            AiSliceConfig.shape.ai.parse(exampleSessions),
          ),
          ...createDefaultSqlEditorConfig(),
        },
        room: {
          panels: {
            [RoomPanelTypes.enum['data-sources']]: {
              title: 'Data Sources',
              // icon: FolderIcon,
              icon: DatabaseIcon,
              component: DataSourcesPanel,
              placement: 'sidebar',
            },
            main: {
              title: 'Main view',
              icon: () => null,
              component: MainView,
              placement: 'main',
            },
          },
        },
      })(set, get, store),

      // Sql editor slice
      ...createSqlEditorSlice()(set, get, store),

      // Ai slice
      ...createAiSlice({
        getApiKey: (modelProvider: string) => {
          return get()?.apiKeys[modelProvider] || '';
        },
        
        // Add custom tools
        customTools: {
          // Add the VegaChart tool from the vega package with a custom description
          chart: createVegaChartTool(),

          // Example of adding a simple echo tool
          echo: {
            description: 'A simple echo tool that returns the input text',
            parameters: z.object({
              text: z.string().describe('The text to echo back'),
            }),
            execute: async ({text}: {text: string}) => {
              return {
                llmResult: {
                  success: true,
                  details: `Echo: ${text}`,
                },
              };
            },
            component: EchoToolResult,
          },
        },
      })(set, get, store),

      selectedModel: {
        model: DEFAULT_MODEL,
        provider: 'openai',
      },
      setSelectedModel: (model: string, provider: string) => {
        set({selectedModel: {model, provider}});
      },
      apiKeys: {
        openai: undefined,
        huggingface: undefined,        // ADD: For HF API token
        anthropic: undefined,          // If you have other providers
      },
      setProviderApiKey: (provider: string, apiKey: string) => {
        set({
          apiKeys: {...get().apiKeys, [provider]: apiKey},
        });
      },
      
      // HuggingFace configuration
      huggingfaceEndpointUrl: undefined,
      setHuggingfaceEndpointUrl: (url: string) => {
        set({ huggingfaceEndpointUrl: url });
      },
      huggingfaceModelId: 'custom', // Default to custom
      setHuggingfaceModelId: (modelId: string) => {
        set({ huggingfaceModelId: modelId });
      },
    }),

    // Persist settings
    {
      // Local storage key
      name: 'ai-example-app-state-storage',
      // Subset of the state to persist
      partialize: (state) => ({
        config: RoomConfig.parse(state.config),
        selectedModel: state.selectedModel,
        apiKeys: state.apiKeys,
        huggingfaceEndpointUrl: state.huggingfaceEndpointUrl,
        huggingfaceModelId: state.huggingfaceModelId,
      }),
    },
  ) as StateCreator<RoomState>,
);
