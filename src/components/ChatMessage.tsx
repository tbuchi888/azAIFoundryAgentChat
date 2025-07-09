import { User, Bot } from 'lucide-react';
import type { ChatMessage } from '../types/agent';

interface ChatMessageProps {
  message: ChatMessage;
  agentName?: string;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, agentName }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'order-1' : ''}`}>
        <div className={`rounded-2xl px-6 py-4 shadow-lg backdrop-blur-sm border ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-white/20' 
            : 'bg-white/10 text-white border-white/20'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-semibold text-sm ${isUser ? 'text-white/90' : 'text-white/90'}`}>
              {isUser ? 'あなた ' : (agentName || 'AI エージェント') + ' '}
            </span>
            <span className={`text-xs ${isUser ? 'text-white/60' : 'text-white/60'}`}>
              {message.timestamp.toLocaleTimeString('ja-JP')}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className={`whitespace-pre-wrap leading-relaxed ${
              isUser ? 'text-white' : 'text-white'
            }`}>
              {message.content}
            </p>
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg order-2">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};
