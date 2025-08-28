export interface User {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  messageType: 'text' | 'image' | 'file';
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender: User;
}

export interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'channel';
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
}

export interface SocketEvents {
  'user:join': (data: { userId: string; conversationId: string }) => void;
  'user:leave': (data: { userId: string; conversationId: string }) => void;
  'message:send': (data: { content: string; conversationId: string }) => void;
  'message:receive': (message: Message) => void;
  'typing:start': (data: { userId: string; conversationId: string }) => void;
  'typing:stop': (data: { userId: string; conversationId: string }) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
}