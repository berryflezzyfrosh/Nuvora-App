import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/hooks';
import { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isOwn) {
    return (
      <div className="flex justify-end mb-4">
        <div className="message-bubble message-sent">
          <p>{message.content}</p>
          <p className="text-xs text-white/70 mt-1">
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 mb-4">
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-gray-600">
          {message.sender.username?.[0] || message.sender.email[0].toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {message.sender.username || message.sender.email}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div className="message-bubble message-received">
          <p>{message.content}</p>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC<{ typingUsers: string[] }> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-start space-x-3 mb-4">
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-gray-600">•</span>
      </div>
      <div className="typing-indicator">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
    </div>
  );
};

export const MessageList: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, typingUsers } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === user?.id}
        />
      ))}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={messagesEndRef} />
    </div>
  );
};