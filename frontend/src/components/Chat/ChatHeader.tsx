import React from 'react';
import { useAppSelector } from '../../store/hooks';

export const ChatHeader: React.FC = () => {
  const { activeConversation } = useAppSelector((state) => state.chat);

  if (!activeConversation) {
    return (
      <div className="chat-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Select a conversation</h2>
            <p className="text-white/70 text-sm">Choose a chat to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  const getConversationName = () => {
    if (activeConversation.name) {
      return activeConversation.name;
    }
    
    if (activeConversation.type === 'direct') {
      // For direct messages, show the other participant's name
      const otherParticipant = activeConversation.participants[0];
      return otherParticipant?.username || otherParticipant?.email || 'Unknown User';
    }
    
    return `${activeConversation.type} Chat`;
  };

  const getOnlineCount = () => {
    return activeConversation.participants.filter(p => p.isOnline).length;
  };

  return (
    <div className="chat-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {getConversationName()[0].toUpperCase()}
              </span>
            </div>
            {activeConversation.type === 'direct' && activeConversation.participants[0]?.isOnline && (
              <div className="online-indicator"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{getConversationName()}</h2>
            <p className="text-white/70 text-sm">
              {activeConversation.type === 'direct' 
                ? (activeConversation.participants[0]?.isOnline ? 'Online' : 'Offline')
                : `${getOnlineCount()} members online`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
            </svg>
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};