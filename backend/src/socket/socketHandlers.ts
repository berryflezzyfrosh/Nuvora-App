import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupSocketHandlers = (io: Server, prisma: PrismaClient) => {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          isEmailVerified: true
        }
      });

      if (!user || !user.isEmailVerified) {
        return next(new Error('Invalid user'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;

    logger.info(`User connected: ${username} (${userId})`);

    // Update user status to online
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ONLINE',
        lastSeen: new Date()
      }
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join user to their chat rooms
    const userChats = await prisma.chatMember.findMany({
      where: { userId },
      include: { chat: true }
    });

    userChats.forEach(chatMember => {
      socket.join(`chat:${chatMember.chatId}`);
    });

    // Notify contacts that user is online
    socket.broadcast.emit('user:status', {
      userId,
      status: 'ONLINE',
      lastSeen: new Date()
    });

    // Handle joining a chat room
    socket.on('chat:join', async (chatId: string) => {
      try {
        // Verify user is member of the chat
        const chatMember = await prisma.chatMember.findFirst({
          where: {
            chatId,
            userId
          }
        });

        if (!chatMember) {
          socket.emit('error', { message: 'Not authorized to join this chat' });
          return;
        }

        socket.join(`chat:${chatId}`);
        socket.emit('chat:joined', { chatId });
        
        logger.info(`User ${username} joined chat ${chatId}`);
      } catch (error) {
        logger.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving a chat room
    socket.on('chat:leave', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      socket.emit('chat:left', { chatId });
      logger.info(`User ${username} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on('message:send', async (data: {
      chatId: string;
      content: string;
      type?: string;
      replyToId?: string;
    }) => {
      try {
        const { chatId, content, type = 'TEXT', replyToId } = data;

        // Verify user is member of the chat
        const chatMember = await prisma.chatMember.findFirst({
          where: {
            chatId,
            userId
          }
        });

        if (!chatMember) {
          socket.emit('error', { message: 'Not authorized to send messages to this chat' });
          return;
        }

        // Get chat details
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: {
            members: {
              include: { user: true }
            }
          }
        });

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            content,
            type: type as any,
            chatId,
            senderId: userId,
            replyToId
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            replyTo: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        });

        // Update chat's last message timestamp
        await prisma.chat.update({
          where: { id: chatId },
          data: { lastMessageAt: new Date() }
        });

        // Emit message to all chat members
        io.to(`chat:${chatId}`).emit('message:new', message);

        // Send push notifications to offline users
        const offlineMembers = chat.members.filter(
          member => member.userId !== userId && member.user.status === 'OFFLINE'
        );

        // TODO: Implement push notification service
        // await sendPushNotifications(offlineMembers, message);

        logger.info(`Message sent by ${username} in chat ${chatId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('typing:start', {
        userId,
        username,
        chatId
      });
    });

    socket.on('typing:stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', {
        userId,
        username,
        chatId
      });
    });

    // Handle message reactions
    socket.on('message:react', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        const { messageId, emoji } = data;

        // Check if reaction already exists
        const existingReaction = await prisma.messageReaction.findFirst({
          where: {
            messageId,
            userId,
            emoji
          }
        });

        if (existingReaction) {
          // Remove reaction
          await prisma.messageReaction.delete({
            where: { id: existingReaction.id }
          });
        } else {
          // Add reaction
          await prisma.messageReaction.create({
            data: {
              messageId,
              userId,
              emoji
            }
          });
        }

        // Get updated reactions
        const reactions = await prisma.messageReaction.findMany({
          where: { messageId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });

        // Get message to find chat
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { chatId: true }
        });

        if (message) {
          io.to(`chat:${message.chatId}`).emit('message:reactions', {
            messageId,
            reactions
          });
        }
      } catch (error) {
        logger.error('Error handling message reaction:', error);
        socket.emit('error', { message: 'Failed to react to message' });
      }
    });

    // Handle message read receipts
    socket.on('message:read', async (messageId: string) => {
      try {
        // Create read receipt
        await prisma.messageReadReceipt.upsert({
          where: {
            messageId_userId: {
              messageId,
              userId
            }
          },
          update: {
            readAt: new Date()
          },
          create: {
            messageId,
            userId,
            readAt: new Date()
          }
        });

        // Get message to find chat and sender
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: {
            chatId: true,
            senderId: true
          }
        });

        if (message) {
          // Notify message sender
          io.to(`user:${message.senderId}`).emit('message:read', {
            messageId,
            readBy: userId,
            readAt: new Date()
          });
        }
      } catch (error) {
        logger.error('Error marking message as read:', error);
      }
    });

    // Handle user status updates
    socket.on('status:update', async (status: 'ONLINE' | 'AWAY' | 'BUSY') => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            status,
            lastSeen: new Date()
          }
        });

        // Broadcast status update
        socket.broadcast.emit('user:status', {
          userId,
          status,
          lastSeen: new Date()
        });

        logger.info(`User ${username} status updated to ${status}`);
      } catch (error) {
        logger.error('Error updating user status:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Update user status to offline
        await prisma.user.update({
          where: { id: userId },
          data: {
            status: 'OFFLINE',
            lastSeen: new Date()
          }
        });

        // Notify contacts that user is offline
        socket.broadcast.emit('user:status', {
          userId,
          status: 'OFFLINE',
          lastSeen: new Date()
        });

        logger.info(`User disconnected: ${username} (${userId})`);
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });
  });
};