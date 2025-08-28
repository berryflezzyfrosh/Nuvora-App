import React, { useEffect, useState } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { Chat, Group, Public } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchChats } from '../../store/slices/chatSlice';
import ChatWindow from '../../components/Chat/ChatWindow';
import ChatList from '../../components/Chat/ChatList';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { chats, isLoading } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  // If no chat is selected, show welcome screen
  if (!chatId) {
    return (
      <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'transparent',
          }}
        >
          <Chat sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Welcome to Nuvora Chat
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
            Select a chat from the sidebar to start messaging, or create a new conversation.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Chat />}
              onClick={() => navigate('/chat/new')}
              sx={{ minWidth: 140 }}
            >
              New Chat
            </Button>
            <Button
              variant="outlined"
              startIcon={<Group />}
              onClick={() => navigate('/chat/groups')}
              sx={{ minWidth: 140 }}
            >
              Join Group
            </Button>
            <Button
              variant="outlined"
              startIcon={<Public />}
              onClick={() => navigate('/chat/public')}
              sx={{ minWidth: 140 }}
            >
              Public Rooms
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Find the selected chat
  const selectedChat = chats.find(chat => chat.id === chatId);

  if (!selectedChat && !isLoading) {
    return (
      <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Chat not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The chat you're looking for doesn't exist or you don't have access to it.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/chat')}>
            Back to Chats
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ChatList />} />
      <Route path="/groups" element={<ChatList filter="GROUP" />} />
      <Route path="/public" element={<ChatList filter="PUBLIC" />} />
      <Route path="/:chatId" element={<ChatWindow chat={selectedChat} />} />
    </Routes>
  );
};

export default ChatPage;