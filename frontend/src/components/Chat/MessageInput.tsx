import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { sendMessage } from '../../store/slices/chatSlice';
import { useSocket } from '../../hooks/useSocket';

export const MessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const { activeConversation } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeConversation || !user) return;

    // Send message
    dispatch(sendMessage({
      conversationId: activeConversation.id,
      content: message.trim(),
    }));

    // Emit via socket
    if (socket) {
      socket.emit('message:send', {
        content: message.trim(),
        conversationId: activeConversation.id,
      });
    }

    setMessage('');
    stopTyping();
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!activeConversation || !user || !socket) return;

    // Start typing indicator
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      socket.emit('typing:start', {
        userId: user.id,
        conversationId: activeConversation.id,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const stopTyping = () => {
    if (isTyping && socket && activeConversation && user) {
      setIsTyping(false);
      socket.emit('typing:stop', {
        userId: user.id,
        conversationId: activeConversation.id,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, []);

  if (!activeConversation) {
    return null;
  }

  return (
    <div className="p-6 border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex items-end space-x-4">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type your message..."
            className="message-input w-full resize-none"
            disabled={!activeConversation}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || !activeConversation}
          className="send-button"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
          </svg>
        </button>
      </form>
    </div>
  );
};