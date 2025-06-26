import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ChatMessageComponent } from './ChatMessage';
import { FileUpload } from './FileUpload';
import type { ChatMessage, FileAttachment, ThreadRun } from '../types/agent';
import { createAzureAIFoundryAgentService, AzureAIFoundryAgentService } from '../services/azureAgentService';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentService, setAgentService] = useState<AzureAIFoundryAgentService | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<ThreadRun | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Azure AI Foundry Agent service
  useEffect(() => {
    try {
      const service = createAzureAIFoundryAgentService();
      setAgentService(service);
      setError(null);
      
      // Initialize with welcome message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'こんにちは！Azure AI Foundry Agentです。何かお手伝いできることはありますか？',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定エラーが発生しました');
    }
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !agentService) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    const messageAttachments = [...attachments];
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);
    setError(null);

    try {
      // Create thread and run with message
      const run = await agentService.createThreadAndRun(messageText, messageAttachments);
      setCurrentRun(run);
      setCurrentThreadId(run.thread_id);

      // Poll for completion
      const completedRun = await agentService.waitForRunCompletion(run.thread_id, run.id);
      
      if (completedRun.status === 'completed') {
        // Get the latest messages
        const threadMessages = await agentService.getThreadMessages(run.thread_id);
        
        // Find the assistant's latest response
        const assistantMessages = threadMessages
          .filter((msg: any) => msg.role === 'assistant')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (assistantMessages.length > 0) {
          const latestAssistantMessage = assistantMessages[0];
          let content = '';
          
          if (Array.isArray(latestAssistantMessage.content)) {
            content = latestAssistantMessage.content
              .map((c: any) => c.type === 'text' ? c.text.value : '[File]')
              .join('\n');
          } else {
            content = latestAssistantMessage.content;
          }

          const assistantMessage: ChatMessage = {
            id: latestAssistantMessage.id,
            role: 'assistant',
            content,
            timestamp: new Date(latestAssistantMessage.created_at),
          };

          setMessages(prev => [...prev, assistantMessage]);
        }
      } else if (completedRun.status === 'failed') {
        throw new Error(`Run failed: ${completedRun.last_error?.message || 'Unknown error'}`);
      } else {
        throw new Error(`Run ended with status: ${completedRun.status}`);
      }

    } catch (err) {
      console.error('Message send error:', err);
      const errorMsg = err instanceof Error ? err.message : 'メッセージの送信に失敗しました';
      setError(errorMsg);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `申し訳ございません。エラーが発生しました: ${errorMsg}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentRun(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFilesAdded = (newFiles: FileAttachment[]) => {
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  const handleNewConversation = () => {
    setCurrentThreadId(null);
    setCurrentRun(null);
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'こんにちは！新しい会話を始めました。何かお手伝いできることはありますか？',
      timestamp: new Date(),
    }]);
    setError(null);
  };

  if (!agentService && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">設定エラー</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">必要な環境変数:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• VITE_AZURE_AI_FOUNDARY_ENDPOINT_URL</li>
              <li>• VITE_AZURE_AI_FOUNDARY_API_KEY</li>
              <li>• VITE_AZURE_AI_AGENT_ID</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Azure AI Foundry Agent Chat
            </h1>
            <p className="text-sm text-gray-600">
              テキストとファイルでAIエージェントと対話できます
              {currentThreadId && (
                <span className="ml-2 text-blue-600">
                  • スレッドID: {currentThreadId.slice(-8)}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleNewConversation}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="新しい会話を開始"
          >
            <RefreshCw className="w-4 h-4" />
            新しい会話
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    チャットを開始しましょう
                  </h3>
                  <p className="text-gray-600">
                    下のテキストボックスにメッセージを入力するか、ファイルを添付してAIエージェントと対話を開始してください。
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessageComponent key={message.id} message={message} />
                ))}
              </div>
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    AIエージェントが応答中...
                    {currentRun && (
                      <span className="ml-2 text-xs text-gray-500">
                        Run ID: {currentRun.id.slice(-8)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* File Upload */}
              <FileUpload
                attachments={attachments}
                onFilesAdded={handleFilesAdded}
                onFileRemoved={handleFileRemoved}
                disabled={isLoading}
              />

              {/* Message Input */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="メッセージを入力してください..."
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-12 max-h-30"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title="送信 (Enter)"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
