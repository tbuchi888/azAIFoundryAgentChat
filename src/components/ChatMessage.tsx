import { User, Bot, Paperclip } from 'lucide-react';
import type { ChatMessage } from '../types/agent';
import { formatFileSize } from '../utils/fileUtils';

interface ChatMessageProps {
  message: ChatMessage;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'bg-blue-50' : 'bg-white'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gray-500'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {isUser ? 'あなた' : 'AI エージェント'}
          </span>
          <span className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString('ja-JP')}
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  {attachment.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(attachment.size)})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
