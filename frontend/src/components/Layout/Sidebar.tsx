import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  TextField,
  InputAdornment,
  Badge,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
} from '@mui/material';
import {
  Search,
  Chat,
  Group,
  Public,
  Add,
  MoreVert,
  Circle,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchChats } from '../../store/slices/chatSlice';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { chats, isLoading } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.members.some(member =>
      member.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${member.user.firstName} ${member.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    onClose?.();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, chatId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedChatId(chatId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedChatId(null);
  };

  const getChatName = (chat: any) => {
    if (chat.name) return chat.name;
    
    // For direct messages, show the other user's name
    if (chat.type === 'DIRECT') {
      const otherMember = chat.members.find((member: any) => member.userId !== user?.id);
      return otherMember ? `${otherMember.user.firstName} ${otherMember.user.lastName}` : 'Unknown User';
    }
    
    return 'Unnamed Chat';
  };

  const getChatAvatar = (chat: any) => {
    if (chat.avatar) return chat.avatar;
    
    // For direct messages, show the other user's avatar
    if (chat.type === 'DIRECT') {
      const otherMember = chat.members.find((member: any) => member.userId !== user?.id);
      return otherMember?.user.avatar;
    }
    
    return null;
  };

  const getLastMessagePreview = (chat: any) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const content = chat.lastMessage.content;
    if (content.length > 50) {
      return content.substring(0, 50) + '...';
    }
    return content;
  };

  const getUserStatus = (userId: string) => {
    // This would come from socket connection in real implementation
    return 'OFFLINE'; // Placeholder
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#4caf50';
      case 'AWAY': return '#ff9800';
      case 'BUSY': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Toolbar>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Nuvora
        </Typography>
      </Toolbar>
      
      <Divider />

      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Chat Types */}
      <Box sx={{ px: 2, pb: 1 }}>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/chat'}
              onClick={() => {
                navigate('/chat');
                onClose?.();
              }}
            >
              <ListItemIcon>
                <Chat />
              </ListItemIcon>
              <ListItemText primary="All Chats" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/chat/groups'}
              onClick={() => {
                navigate('/chat/groups');
                onClose?.();
              }}
            >
              <ListItemIcon>
                <Group />
              </ListItemIcon>
              <ListItemText primary="Groups" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/chat/public'}
              onClick={() => {
                navigate('/chat/public');
                onClose?.();
              }}
            >
              <ListItemIcon>
                <Public />
              </ListItemIcon>
              <ListItemText primary="Public Rooms" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      <Divider />

      {/* Chat List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {filteredChats.map((chat) => {
            const isSelected = location.pathname === `/chat/${chat.id}`;
            const chatName = getChatName(chat);
            const chatAvatar = getChatAvatar(chat);
            const lastMessagePreview = getLastMessagePreview(chat);
            
            // Get other user's status for direct messages
            const otherMember = chat.type === 'DIRECT' 
              ? chat.members.find((member: any) => member.userId !== user?.id)
              : null;
            const userStatus = otherMember ? getUserStatus(otherMember.userId) : null;

            return (
              <ListItem key={chat.id} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleChatClick(chat.id)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        userStatus && chat.type === 'DIRECT' ? (
                          <Circle
                            sx={{
                              color: getStatusColor(userStatus),
                              fontSize: 12,
                            }}
                          />
                        ) : null
                      }
                    >
                      <Avatar src={chatAvatar} sx={{ width: 40, height: 40 }}>
                        {chatName[0]?.toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 500 }}>
                          {chatName}
                        </Typography>
                        {chat.unreadCount > 0 && (
                          <Chip
                            label={chat.unreadCount}
                            size="small"
                            color="primary"
                            sx={{ minWidth: 20, height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {lastMessagePreview}
                        </Typography>
                        {chat.lastMessageAt && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, chat.id)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {filteredChats.length === 0 && !isLoading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No chats found' : 'No chats yet'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          Mute notifications
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Archive chat
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Delete chat
        </MenuItem>
      </Menu>

      {/* Add Chat Button */}
      <Box sx={{ p: 2 }}>
        <IconButton
          color="primary"
          sx={{
            width: '100%',
            height: 48,
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
          }}
          onClick={() => {
            // TODO: Open new chat dialog
            console.log('Open new chat dialog');
          }}
        >
          <Add />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Sidebar;