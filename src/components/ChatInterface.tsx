import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ChatMessageComponent } from './ChatMessage';
import type { ChatMessage, ThreadRun } from '../types/agent';
import type { AzureConfig } from '../hooks/useAzureConfig';
import { createAzureAIFoundryAgentService, AzureAIFoundryAgentService, getAzureAgentInfo } from '../services/azureAgentService';

interface ChatInterfaceProps {
  config: AzureConfig | null;
  onConfigUpdate: (config: AzureConfig) => void;
  onConfigClear: () => void;
  onConfigReload: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  config,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentService, setAgentService] = useState<AzureAIFoundryAgentService | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<ThreadRun | null>(null);
  const [agentName, setAgentName] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Azure AI Foundry Agent service
  useEffect(() => {
    if (!config) {
      setAgentService(null);
      setError(null);
      setMessages([]); // メッセージもクリア
      setAgentName('');
      return;
    }
    
    const initializeAgent = async () => {
      try {
        // エージェント情報を取得
        const agentInfo = await getAzureAgentInfo(config.endpoint, config.apiKey, config.agentId);
        setAgentName(agentInfo.name);
        
        const service = createAzureAIFoundryAgentService(config);
        setAgentService(service);
        setError(null);
        
        // Initialize with welcome message
        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `こんにちは！${agentInfo.name}です。何かお手伝いできることはありますか？`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (err) {
        console.warn('Agent service initialization failed:', err);
        setError(err instanceof Error ? err.message : '設定エラーが発生しました');
        setAgentService(null);
        setMessages([]); // エラー時もメッセージをクリア
        setAgentName('');
      }
    };

    initializeAgent();
  }, [config]);

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
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Create thread and run with message
      const run = await agentService.createThreadAndRun(messageText);
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

  const handleNewConversation = () => {
    setCurrentThreadId(null);
    setCurrentRun(null);
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `こんにちは！${agentName || config?.agentId || 'エージェント'}です。新しい会話を始めました。何かお手伝いできることはありますか？`,
      timestamp: new Date(),
    }]);
    setError(null);
  };

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900/50 to-purple-900/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Azure AI Foundry Agent Chat
            </h1>
            <p className="text-sm text-white/70 mt-1">
              {!agentService ? (
                <span className="text-red-300 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  設定エラー - 左側の設定パネルで設定を確認してください
                </span>
              ) : (
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  AIエージェントとの対話が可能です
                  {currentThreadId && (
                    <span className="ml-3 text-blue-300">
                      スレッドID: {currentThreadId.slice(-8)}
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewConversation}
              disabled={isLoading || !agentService}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              title="新しい会話を開始"
            >
              <RefreshCw className="w-4 h-4" />
              新しい会話
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {!agentService ? (
              <div className="text-center py-16">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    設定エラー
                  </h3>
                  <p className="text-white/70">
                    {error || 'Azure AI Foundryの設定に問題があります。左側の設定パネルで設定を確認してください。'}
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    チャットを開始しましょう
                  </h3>
                  <p className="text-white/70">
                    下のテキストボックスにメッセージを入力してAIエージェントと対話を開始してください。
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <ChatMessageComponent key={message.id} message={message} agentName={agentName} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <div className="relative">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                      <div className="absolute inset-0 w-6 h-6 border-2 border-purple-400/30 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <span className="font-medium">AIエージェントが応答中...</span>
                      {currentRun && (
                        <div className="text-xs text-white/60 mt-1">
                          Run ID: {currentRun.id.slice(-8)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/10 backdrop-blur-xl border-t border-white/20 p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 text-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Message Input */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      !config 
                        ? "まず設定を行ってください..." 
                        : !agentService 
                        ? "設定を確認してください..." 
                        : "メッセージを入力してください..."
                    }
                    disabled={isLoading || !config || !agentService}
                    className="w-full px-6 py-4 bg-white/10 border border-white/30 rounded-2xl resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-16 max-h-32 text-white placeholder-white/50 transition-all duration-200"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || !config || !agentService}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  title={!config || !agentService ? "設定が必要です" : "送信 (Enter)"}
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
