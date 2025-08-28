import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveConversation, fetchMessages } from '../../store/slices/chatSlice';
import { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  onClick 
}) => {
  const { user } = useAppSelector((state) => state.auth);

  const getConversationName = () => {
    if (conversation.name) {
      return conversation.name;
    }
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant?.username || otherParticipant?.email || 'Unknown User';
    }
    
    return `${conversation.type} Chat`;
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }
    
    return conversation.lastMessage.content;
  };

  const getLastMessageTime = () => {
    if (!conversation.lastMessage) {
      return '';
    }
    
    const date = new Date(conversation.lastMessage.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors ${
        isActive ? 'bg-white/10' : ''
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-sm font-semibold">
            {getConversationName()[0].toUpperCase()}
          </span>
        </div>
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {conversation.unreadCount}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium truncate">{getConversationName()}</p>
          <span className="text-xs text-white/70">{getLastMessageTime()}</span>
        </div>
        <p className="text-sm text-white/70 truncate">{getLastMessagePreview()}</p>
      </div>
    </div>
  );
};

export const ConversationList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { conversations, activeConversation } = useAppSelector((state) => state.chat);

  const handleConversationClick = (conversation: Conversation) => {
    dispatch(setActiveConversation(conversation));
    dispatch(fetchMessages(conversation.id));
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
        Recent Chats
      </h3>
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={activeConversation?.id === conversation.id}
            onClick={() => handleConversationClick(conversation)}
          />
        ))}
        {conversations.length === 0 && (
          <div className="text-center text-white/50 py-8">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};