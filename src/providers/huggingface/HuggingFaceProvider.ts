import { 
  LanguageModelV2, 
  LanguageModelV2CallOptions,
  LanguageModelV2StreamPart,
  CoreMessage,
  CoreToolMessage,
  CoreAssistantMessage,
  CoreSystemMessage,
  CoreUserMessage,
  TextPart,
  ImagePart,
  ToolCallPart,
  FinishReason,
  LanguageModelUsage
} from '@ai-sdk/provider';
import { HfInference, ChatCompletionStreamOutput } from '@huggingface/inference';
import { HuggingFaceSettings } from './types';

export class HuggingFaceProvider implements LanguageModelV2 {
  readonly specificationVersion = 'V2' as const;
  readonly provider = 'huggingface';
  readonly modelId: string;
  readonly defaultObjectGenerationMode = undefined;
  
  private client: HfInference;
  private settings: HuggingFaceSettings;
  
  constructor(modelId: string, settings: HuggingFaceSettings) {
    this.modelId = modelId;
    this.settings = settings;
    this.client = new HfInference(settings.apiKey);
  }

  get supportedUrls() {
    return {};
  }

  async doGenerate(options: LanguageModelV2CallOptions) {
    try {
      const messages = this.convertPromptToMessages(options.prompt);
      
      const response = await this.client.chatCompletion({
        model: this.modelId,
        messages,
        max_tokens: options.maxOutputTokens ?? 500,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        stop: options.stopSequences,
        seed: options.seed,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error('No response from Hugging Face API');
      }

      const content = choice.message?.content || '';
      
      // Estimate token usage if not provided
      const usage: LanguageModelUsage = {
        inputTokens: response.usage?.prompt_tokens ?? this.estimateTokens(messages),
        outputTokens: response.usage?.completion_tokens ?? this.estimateTokens(content),
        totalTokens: response.usage?.total_tokens ?? 0,
      };
      
      if (usage.totalTokens === 0) {
        usage.totalTokens = usage.inputTokens + usage.outputTokens;
      }

      const finishReason = this.mapFinishReason(choice.finish_reason);

      return {
        content: [{ type: 'text' as const, text: content }],
        usage,
        finishReason,
        request: { 
          body: { 
            model: this.modelId, 
            messages,
            temperature: options.temperature,
            max_tokens: options.maxOutputTokens,
          } 
        },
        response: { 
          body: response,
          headers: {},
        },
        warnings: [],
      };
    } catch (error) {
      console.error('HuggingFace API error:', error);
      throw this.wrapError(error);
    }
  }

  async doStream(options: LanguageModelV2CallOptions) {
    try {
      const messages = this.convertPromptToMessages(options.prompt);
      
      // Create the HF stream
      const hfStream = this.client.chatCompletionStream({
        model: this.modelId,
        messages,
        max_tokens: options.maxOutputTokens ?? 500,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        stop: options.stopSequences,
        seed: options.seed,
      });

      let accumulatedText = '';
      let inputTokens = this.estimateTokens(messages);
      let outputTokens = 0;

      const stream = new ReadableStream<LanguageModelV2StreamPart>({
        async start(controller) {
          try {
            // Send stream start
            controller.enqueue({ 
              type: 'stream-start' as const, 
              warnings: [] 
            });

            // Process the stream
            for await (const chunk of hfStream) {
              if (chunk.choices?.[0]?.delta?.content) {
                const text = chunk.choices[0].delta.content;
                accumulatedText += text;
                outputTokens = Math.ceil(accumulatedText.length / 4); // Rough estimate
                
                controller.enqueue({ 
                  type: 'text' as const, 
                  text 
                });
              }

              // Check for finish
              if (chunk.choices?.[0]?.finish_reason) {
                const finishReason = this.mapFinishReason(chunk.choices[0].finish_reason);
                
                controller.enqueue({ 
                  type: 'finish' as const,
                  usage: {
                    inputTokens,
                    outputTokens,
                    totalTokens: inputTokens + outputTokens,
                  },
                  finishReason,
                });
                
                controller.close();
                return;
              }
            }

            // If we get here without a finish reason, close normally
            controller.enqueue({ 
              type: 'finish' as const,
              usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
              },
              finishReason: 'stop' as FinishReason,
            });
            
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return { 
        stream, 
        warnings: [],
        rawResponse: undefined,
      };
    } catch (error) {
      console.error('HuggingFace streaming error:', error);
      throw this.wrapError(error);
    }
  }

  private convertPromptToMessages(prompt: CoreMessage[]): any[] {
    return prompt.map(message => {
      switch (message.role) {
        case 'system':
          return { 
            role: 'system', 
            content: (message as CoreSystemMessage).content 
          };
          
        case 'user':
          const userMessage = message as CoreUserMessage;
          if (Array.isArray(userMessage.content)) {
            // Extract text and handle images if needed
            const textParts = userMessage.content
              .filter((part): part is TextPart => part.type === 'text')
              .map(part => part.text)
              .join('\n');
            
            // Note: HF Chat API doesn't support images directly
            // You might need to use a vision model endpoint
            const hasImages = userMessage.content.some(
              (part): part is ImagePart => part.type === 'image'
            );
            
            if (hasImages) {
              console.warn('Image parts detected but not supported by HF Chat API');
            }
            
            return { role: 'user', content: textParts };
          } else {
            return { role: 'user', content: userMessage.content };
          }
          
        case 'assistant':
          const assistantMessage = message as CoreAssistantMessage;
          if (Array.isArray(assistantMessage.content)) {
            const textContent = assistantMessage.content
              .filter((part): part is TextPart => part.type === 'text')
              .map(part => part.text)
              .join('\n');
            
            // Handle tool calls if present
            const toolCalls = assistantMessage.content
              .filter((part): part is ToolCallPart => part.type === 'tool-call');
            
            if (toolCalls.length > 0) {
              // HF doesn't support function calling natively
              // You'd need to implement a workaround or use a different endpoint
              console.warn('Tool calls detected but not supported by HF Chat API');
            }
            
            return { role: 'assistant', content: textContent };
          } else {
            return { role: 'assistant', content: assistantMessage.content };
          }
          
        case 'tool':
          // HF doesn't support tool messages natively
          const toolMessage = message as CoreToolMessage;
          return { 
            role: 'assistant', 
            content: `Tool result (${toolMessage.content[0].toolName}): ${JSON.stringify(toolMessage.content[0].result)}` 
          };
          
        default:
          // Fallback for any other roles
          return { 
            role: 'user', 
            content: JSON.stringify(message) 
          };
      }
    });
  }

  private mapFinishReason(reason?: string): FinishReason {
    switch (reason) {
      case 'stop':
      case 'eos_token':
        return 'stop';
      case 'length':
      case 'max_tokens':
        return 'length';
      default:
        return 'other';
    }
  }

  private estimateTokens(input: string | any[]): number {
    // Rough estimation: ~4 characters per token
    const text = typeof input === 'string' 
      ? input 
      : JSON.stringify(input);
    return Math.ceil(text.length / 4);
  }

  private wrapError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }
    
    if (error?.message) {
      return new Error(error.message);
    }
    
    return new Error('Unknown error from Hugging Face API');
  }
}