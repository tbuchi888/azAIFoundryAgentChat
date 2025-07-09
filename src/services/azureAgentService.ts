import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { 
  CreateThreadAndRunRequest, 
  ThreadRun, 
  ApiConfig, 
  ThreadMessageOption
} from '../types/agent';
import type { AzureConfig } from '../hooks/useAzureConfig';

export class AzureAIFoundryAgentService {
  private client: AxiosInstance;
  private agentId: string;

  constructor(config: ApiConfig) {
    this.agentId = config.agentId;
    
    // Azure AI Foundryの認証ヘッダーを設定
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Azure-AI-Foundry-Chat-UI/1.0'
    };

    // Azure AI Foundryには正しいアクセストークンが必要
    if (config.apiKey) {
      // Bearer形式のトークンの場合
      if (config.apiKey.startsWith('Bearer ')) {
        headers['Authorization'] = config.apiKey;
      } else {
        // アクセストークンをBearerトークンとして設定
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
    }

    this.client = axios.create({
      baseURL: config.endpoint,
      headers,
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
    options?: Partial<CreateThreadAndRunRequest>
  ): Promise<ThreadRun> {
    try {
      // Prepare message
      const messageContent: ThreadMessageOption = {
        role: 'user',
        content: message,
      };

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

      console.log('Azure AI Foundry API リクエスト送信中...');
      const response = await this.client.post('/threads/runs', requestBody, {
        params: {
          'api-version': 'v1'
        }
      });

      console.log('Azure AI Foundry API レスポンス受信完了');
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
  async sendMessage(message: string): Promise<string> {
    try {
      // Create thread and run
      const run = await this.createThreadAndRun(message);
      
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

  /**
   * Get list of available agents/assistants
   */
  async getAgents(): Promise<any[]> {
    try {
      const response = await this.client.get('/assistants', {
        params: {
          'api-version': 'v1'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error getting agents:', error);
      throw new Error('Failed to get agents list');
    }
  }
}

// Static method for getting agents list without full configuration
export const getAzureAgentsList = async (endpoint: string, apiKey: string): Promise<any[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Azure-AI-Foundry-Chat-UI/1.0'
    };

    // Azure AI Foundryには正しいアクセストークンが必要
    if (apiKey) {
      if (apiKey.startsWith('Bearer ')) {
        headers['Authorization'] = apiKey;
      } else {
        // アクセストークンをBearerトークンとして設定
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const client = axios.create({
      baseURL: endpoint,
      headers,
      timeout: 30000,
    });

    const response = await client.get('/assistants', {
      params: {
        'api-version': 'v1'
      }
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Error getting agents list:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || 
                         error.response?.data?.message || 
                         error.message;
      throw new Error(`エージェント一覧の取得に失敗しました: ${errorMessage}`);
    }
    throw new Error('エージェント一覧の取得に失敗しました');
  }
};

// Static method for getting specific agent info
export const getAzureAgentInfo = async (endpoint: string, apiKey: string, agentId: string): Promise<{ id: string; name: string; description?: string }> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Azure-AI-Foundry-Chat-UI/1.0'
    };

    // Azure AI Foundryには正しいアクセストークンが必要
    if (apiKey) {
      if (apiKey.startsWith('Bearer ')) {
        headers['Authorization'] = apiKey;
      } else {
        // アクセストークンをBearerトークンとして設定
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const client = axios.create({
      baseURL: endpoint,
      headers,
      timeout: 30000,
    });

    const response = await client.get(`/assistants/${agentId}`, {
      params: {
        'api-version': 'v1'
      }
    });

    return {
      id: response.data.id,
      name: response.data.name || response.data.id,
      description: response.data.description
    };
  } catch (error) {
    console.error('Error getting agent info:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message || 
                         error.response?.data?.message || 
                         error.message;
      throw new Error(`エージェント情報の取得に失敗しました: ${errorMessage}`);
    }
    throw new Error('エージェント情報の取得に失敗しました');
  }
};

// Factory function for creating service instance
export const createAzureAIFoundryAgentService = (config: AzureConfig): AzureAIFoundryAgentService => {
  console.log('Creating Azure AI Foundry Agent Service with config:', {
    hasEndpoint: !!config.endpoint,
    hasApiKey: !!config.apiKey,
    hasAgentId: !!config.agentId,
    endpoint: config.endpoint?.substring(0, 50) + '...',
  });

  // 設定が不完全な場合は具体的なエラーメッセージを提供
  const missingConfigs: string[] = [];
  if (!config.endpoint || config.endpoint.trim() === '') missingConfigs.push('エンドポイントURL');
  if (!config.apiKey || config.apiKey.trim() === '') missingConfigs.push('APIキー');
  if (!config.agentId || config.agentId.trim() === '') missingConfigs.push('Agent ID');

  if (missingConfigs.length > 0) {
    throw new Error(`Azure AI Foundry設定が不完全です。以下の項目を設定してください: ${missingConfigs.join(', ')}`);
  }

  const apiConfig: ApiConfig = {
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    agentId: config.agentId,
  };

  return new AzureAIFoundryAgentService(apiConfig);
};
