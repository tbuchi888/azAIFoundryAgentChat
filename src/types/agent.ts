// Azure AI Foundry Agent API related types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 encoded
}

// Azure AI Foundry Agent API types based on official documentation
export interface ThreadRun {
  id: string;
  object: 'thread.run';
  thread_id: string;
  assistant_id: string;
  status: RunStatus;
  started_at?: number;
  completed_at?: number;
  created_at: number;
  expires_at?: number;
  cancelled_at?: number;
  failed_at?: number;
  last_error?: RunError;
  model?: string;
  instructions?: string;
  tools?: ToolDefinition[];
  metadata?: Record<string, string>;
  usage?: RunCompletionUsage;
  temperature?: number;
  top_p?: number;
  max_completion_tokens?: number;
  max_prompt_tokens?: number;
  truncation_strategy?: TruncationObject;
  tool_choice?: any;
  parallel_tool_calls?: boolean;
  response_format?: any;
  required_action?: RequiredAction;
}

export type RunStatus = 
  | 'queued'
  | 'in_progress'
  | 'requires_action'
  | 'cancelling'
  | 'cancelled'
  | 'failed'
  | 'completed'
  | 'expired';

export interface RunError {
  code: string;
  message: string;
}

export interface RunCompletionUsage {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
}

export interface RequiredAction {
  type: 'submit_tool_outputs';
  submit_tool_outputs: {
    tool_calls: RequiredToolCall[];
  };
}

export interface RequiredToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface TruncationObject {
  type: 'auto' | 'last_messages';
  last_messages?: number;
}

export interface ToolDefinition {
  type: string;
  [key: string]: any;
}

// Request/Response types for the API
export interface CreateThreadAndRunRequest {
  assistant_id: string;
  thread?: ThreadCreationOptions;
  model?: string;
  instructions?: string;
  tools?: ToolDefinition[];
  metadata?: Record<string, string>;
  temperature?: number;
  top_p?: number;
  max_completion_tokens?: number;
  max_prompt_tokens?: number;
  truncation_strategy?: TruncationObject;
  tool_choice?: any;
  parallel_tool_calls?: boolean;
  response_format?: any;
  stream?: boolean;
}

export interface ThreadCreationOptions {
  messages?: ThreadMessageOption[];
  metadata?: Record<string, string>;
  tool_resources?: ToolResources;
}

export interface ThreadMessageOption {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
  attachments?: MessageAttachment[];
  metadata?: Record<string, string>;
}

export interface MessageContent {
  type: 'text' | 'image_file' | 'image_url';
  text?: {
    value: string;
    annotations?: any[];
  };
  image_file?: {
    file_id: string;
    detail?: 'auto' | 'low' | 'high';
  };
  image_url?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

export interface MessageAttachment {
  file_id?: string;
  data_source?: VectorStoreDataSource;
  tools: MessageAttachmentTool[];
}

export interface MessageAttachmentTool {
  type: 'code_interpreter' | 'file_search';
}

export interface VectorStoreDataSource {
  type: 'uri_asset' | 'id_asset';
  uri: string;
}

export interface ToolResources {
  code_interpreter?: {
    file_ids?: string[];
    data_sources?: VectorStoreDataSource[];
  };
  file_search?: {
    vector_store_ids?: string[];
    vector_stores?: VectorStoreConfiguration[];
  };
  azure_ai_search?: {
    indexes?: AISearchIndexResource[];
  };
}

export interface VectorStoreConfiguration {
  name: string;
  configuration: {
    data_sources: VectorStoreDataSource[];
  };
}

export interface AISearchIndexResource {
  index_name: string;
  index_connection_id?: string;
  index_asset_id?: string;
  query_type?: 'simple' | 'semantic' | 'vector' | 'vector_simple_hybrid' | 'vector_semantic_hybrid';
  top_k?: number;
  filter?: string;
}

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  agentId: string;
}
