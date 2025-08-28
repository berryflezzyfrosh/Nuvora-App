import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Phone,
  VideoCall,
  Info,
  Circle,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { sendMessage, fetchMessages } from '../../store/slices/messageSlice';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import EmojiPicker from './EmojiPicker';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  chat: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { messages, isLoading } = useAppSelector((state) => state.message);
  const { socket } = useAppSelector((state) => state.socket);
  
  const [messageText, setMessageText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (chat?.id) {
      dispatch(fetchMessages(chat.id));
      
      // Join chat room via socket
      if (socket) {
        socket.emit('chat:join', chat.id);
      }
    }
  }, [chat?.id, dispatch, socket]);

  useEffect(() => {
    if (socket) {
      // Listen for typing indicators
      socket.on('typing:start', ({ userId, username, chatId }) => {
        if (chatId === chat?.id && userId !== user?.id) {
          setTypingUsers(prev => [...prev.filter(u => u !== username), username]);
        }
      });

      socket.on('typing:stop', ({ userId, username, chatId }) => {
        if (chatId === chat?.id) {
          setTypingUsers(prev => prev.filter(u => u !== username));
        }
      });

      return () => {
        socket.off('typing:start');
        socket.off('typing:stop');
      };
    }
  }, [socket, chat?.id, user?.id]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !chat?.id) return;

    dispatch(sendMessage({
      chatId: chat.id,
      content: messageText.trim(),
      type: 'TEXT'
    }));

    setMessageText('');
    
    // Stop typing indicator
    if (socket && isTyping) {
      socket.emit('typing:stop', chat.id);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMessageText(value);

    // Handle typing indicators
    if (socket && chat?.id) {
      if (value.trim() && !isTyping) {
        socket.emit('typing:start', chat.id);
        setIsTyping(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          socket.emit('typing:stop', chat.id);
          setIsTyping(false);
        }
      }, 1000);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const getChatName = () => {
    if (chat.name) return chat.name;
    
    if (chat.type === 'DIRECT') {
      const otherMember = chat.members.find((member: any) => member.userId !== user?.id);
      return otherMember ? `${otherMember.user.firstName} ${otherMember.user.lastName}` : 'Unknown User';
    }
    
    return 'Unnamed Chat';
  };

  const getChatAvatar = () => {
    if (chat.avatar) return chat.avatar;
    
    if (chat.type === 'DIRECT') {
      const otherMember = chat.members.find((member: any) => member.userId !== user?.id);
      return otherMember?.user.avatar;
    }
    
    return null;
  };

  const getOnlineStatus = () => {
    if (chat.type === 'DIRECT') {
      const otherMember = chat.members.find((member: any) => member.userId !== user?.id);
      // This would come from socket connection in real implementation
      return otherMember?.user.status || 'OFFLINE';
    }
    return null;
  };

  const getLastSeen = () => {
    if (chat.type === 'DIRECT') {
      const otherMember = chat.members.find((member: any) => member.userId !== user?.id);
      return otherMember?.user.lastSeen;
    }
    return null;
  };

  const chatName = getChatName();
  const chatAvatar = getChatAvatar();
  const onlineStatus = getOnlineStatus();
  const lastSeen = getLastSeen();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#4caf50';
      case 'AWAY': return '#ff9800';
      case 'BUSY': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = () => {
    if (onlineStatus === 'ONLINE') return 'Online';
    if (onlineStatus === 'AWAY') return 'Away';
    if (onlineStatus === 'BUSY') return 'Busy';
    if (lastSeen) {
      return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
    }
    return 'Offline';
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            onlineStatus && chat.type === 'DIRECT' ? (
              <Circle
                sx={{
                  color: getStatusColor(onlineStatus),
                  fontSize: 12,
                }}
              />
            ) : null
          }
        >
          <Avatar src={chatAvatar} sx={{ width: 40, height: 40, mr: 2 }}>
            {chatName[0]?.toUpperCase()}
          </Avatar>
        </Badge>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {chatName}
          </Typography>
          {chat.type === 'DIRECT' && (
            <Typography variant="caption" color="text.secondary">
              {getStatusText()}
            </Typography>
          )}
          {chat.type === 'GROUP' && (
            <Typography variant="caption" color="text.secondary">
              {chat.members.length} members
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {chat.type === 'DIRECT' && (
            <>
              <Tooltip title="Voice call">
                <IconButton>
                  <Phone />
                </IconButton>
              </Tooltip>
              <Tooltip title="Video call">
                <IconButton>
                  <VideoCall />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          <Tooltip title="Chat info">
            <IconButton>
              <Info />
            </IconButton>
          </Tooltip>
          
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Search messages</MenuItem>
          <MenuItem onClick={handleMenuClose}>Mute notifications</MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose}>Clear chat</MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            {chat.type === 'DIRECT' ? 'Block user' : 'Leave chat'}
          </MenuItem>
        </Menu>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        <MessageList
          messages={messages.filter(msg => msg.chatId === chat.id)}
          currentUserId={user?.id || ''}
          isLoading={isLoading}
        />
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
      </Box>

      {/* Message Input */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <IconButton size="small">
            <AttachFile />
          </IconButton>
          
          <TextField
            ref={messageInputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
          
          <IconButton
            size="small"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <EmojiEmotions />
          </IconButton>
          
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            sx={{
              backgroundColor: messageText.trim() ? 'primary.main' : 'transparent',
              color: messageText.trim() ? 'white' : 'inherit',
              '&:hover': {
                backgroundColor: messageText.trim() ? 'primary.dark' : 'transparent',
              },
            }}
          >
            <Send />
          </IconButton>
        </Box>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </Paper>
    </Box>
  );
};

export default ChatWindow;