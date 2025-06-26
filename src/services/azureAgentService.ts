import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { getConfig } from '../config/appConfig';
import type { 
  CreateThreadAndRunRequest, 
  ThreadRun, 
  ApiConfig, 
  FileAttachment,
  ThreadMessageOption,
  MessageAttachment,
  VectorStoreDataSource
} from '../types/agent';

export class AzureAIFoundryAgentService {
  private client: AxiosInstance;
  private agentId: string;

  constructor(config: ApiConfig) {
    this.agentId = config.agentId;
    this.client = axios.create({
      baseURL: config.endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 120000, // 2 minutes timeout for agent responses
    });

    // Add retry logic for transient failures
    this.setupRetryInterceptor();
  }

  private setupRetryInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        if (!config) return Promise.reject(error);

        // Retry logic for transient failures (429, 502, 503, 504)
        const retryableStatusCodes = [429, 502, 503, 504];
        const shouldRetry = retryableStatusCodes.includes(error.response?.status || 0);
        
        if (shouldRetry && !config._retry) {
          config._retry = 0;
        }

        if (shouldRetry && config._retry < 3) {
          config._retry++;
          const delay = Math.pow(2, config._retry) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a thread and run with the Azure AI Foundry Agent
   * This follows the official API specification: POST {endpoint}/threads/runs
   */
  async createThreadAndRun(
    message: string, 
    attachments?: FileAttachment[], 
    options?: Partial<CreateThreadAndRunRequest>
  ): Promise<ThreadRun> {
    try {
      // Prepare message with attachments
      const messageContent: ThreadMessageOption = {
        role: 'user',
        content: message,
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        messageContent.attachments = await this.convertToMessageAttachments(attachments);
      }

      const requestBody: CreateThreadAndRunRequest = {
        assistant_id: this.agentId,
        thread: {
          messages: [messageContent],
        },
        temperature: 0.7,
        max_completion_tokens: 4000,
        max_prompt_tokens: 16000,
        parallel_tool_calls: true,
        ...options,
      };

      const response = await this.client.post('/threads/runs', requestBody, {
        params: {
          'api-version': 'v1'
        }
      });

      return response.data as ThreadRun;
    } catch (error) {
      console.error('Azure AI Foundry Agent API Error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message;
        
        throw new Error(`API Error: ${errorMessage}`);
      }
      
      throw new Error('Failed to communicate with Azure AI Foundry Agent');
    }
  }

  /**
   * Get the status and result of a thread run
   */
  async getThreadRun(threadId: string, runId: string): Promise<ThreadRun> {
    try {
      const response = await this.client.get(`/threads/${threadId}/runs/${runId}`, {
        params: {
          'api-version': 'v1'
        }
      });

      return response.data as ThreadRun;
    } catch (error) {
      console.error('Error getting thread run:', error);
      throw new Error('Failed to get thread run status');
    }
  }

  /**
   * Get messages from a thread
   */
  async getThreadMessages(threadId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/threads/${threadId}/messages`, {
        params: {
          'api-version': 'v1'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error getting thread messages:', error);
      throw new Error('Failed to get thread messages');
    }
  }

  /**
   * Poll for thread run completion
   */
  async waitForRunCompletion(threadId: string, runId: string, maxWaitTime = 300000): Promise<ThreadRun> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const run = await this.getThreadRun(threadId, runId);
      
      // Terminal states
      if (['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
        return run;
      }

      // If requires action, we'll handle it in the UI
      if (run.status === 'requires_action') {
        return run;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Thread run timed out');
  }

  /**
   * Convert file attachments to message attachments format
   */
  private async convertToMessageAttachments(attachments: FileAttachment[]): Promise<MessageAttachment[]> {
    return attachments.map(attachment => {
      // For Azure AI Foundry, we need to upload files first and get file_ids
      // For now, we'll use data_source approach with base64 data
      const dataSource: VectorStoreDataSource = {
        type: 'uri_asset',
        uri: `data:${attachment.type};base64,${attachment.data}`
      };

      return {
        data_source: dataSource,
        tools: [
          { type: 'file_search' },
          { type: 'code_interpreter' }
        ]
      };
    });
  }

  /**
   * Upload a file to Azure AI Foundry (if file upload is supported)
   */
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'assistants');

      const response = await this.client.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          'api-version': 'v1'
        }
      });

      return response.data.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to get agent details to verify connectivity
      await this.client.get(`/assistants/${this.agentId}`, {
        params: {
          'api-version': 'v1'
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Simple method for sending a message and getting a response
   */
  async sendMessage(message: string, attachments?: FileAttachment[]): Promise<string> {
    try {
      // Create thread and run
      const run = await this.createThreadAndRun(message, attachments);
      
      // Wait for completion
      const completedRun = await this.waitForRunCompletion(run.thread_id, run.id);
      
      if (completedRun.status === 'completed') {
        // Get the messages to extract the response
        const messages = await this.getThreadMessages(run.thread_id);
        
        // Find the assistant's response (most recent message from assistant)
        const assistantMessage = messages
          .filter(msg => msg.role === 'assistant')
          .sort((a, b) => b.created_at - a.created_at)[0];
        
        if (assistantMessage && assistantMessage.content) {
          // Extract text content
          const textContent = assistantMessage.content.find((c: any) => c.type === 'text');
          return textContent?.text?.value || 'エージェントからの応答を取得できませんでした。';
        }
      } else if (completedRun.status === 'failed') {
        throw new Error(completedRun.last_error?.message || 'エージェントの実行に失敗しました。');
      }
      
      return 'エージェントからの応答を取得できませんでした。';
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('メッセージの送信に失敗しました。');
    }
  }
}

// Factory function for creating service instance
export const createAzureAIFoundryAgentService = (): AzureAIFoundryAgentService => {
  const appConfig = getConfig();
  
  const config: ApiConfig = {
    endpoint: appConfig.AZURE_AI_FOUNDARY_ENDPOINT_URL,
    apiKey: appConfig.AZURE_AI_FOUNDARY_API_KEY,
    agentId: appConfig.AZURE_AI_AGENT_ID,
  };

  console.log('Creating Azure AI Foundry Agent Service with config:', {
    hasEndpoint: !!config.endpoint,
    hasApiKey: !!config.apiKey,
    hasAgentId: !!config.agentId,
    endpoint: config.endpoint?.substring(0, 50) + '...',
  });

  if (!config.endpoint || !config.apiKey || !config.agentId) {
    throw new Error('Azure AI Foundry Agent configuration is missing. Please check environment variables: VITE_AZURE_AI_FOUNDARY_ENDPOINT_URL, VITE_AZURE_AI_FOUNDARY_API_KEY, VITE_AZURE_AI_AGENT_ID');
  }

  return new AzureAIFoundryAgentService(config);
};
