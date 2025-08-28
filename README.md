# Nuvora Chat - Enterprise-Grade Chat Application

![Nuvora Logo](https://via.placeholder.com/200x80/1976d2/ffffff?text=NUVORA)

Nuvora is a production-ready, scalable chat application built with modern technologies and designed to handle billions of users globally. It features real-time messaging, end-to-end encryption, file sharing, and comprehensive admin tools.

## 🚀 Features

### Core Messaging
- **Real-time bidirectional messaging** with Socket.io
- **Message persistence** with PostgreSQL
- **Typing indicators** with debouncing
- **Read receipts** and delivery status
- **Message editing and deletion** with timestamps
- **Message reactions** and threading
- **Message search** with full-text indexing

### Chat Types
- **Direct messages** (1-on-1)
- **Group chats** with admin controls
- **Public chat rooms** with moderation
- **Channel-based communication**

### Media & Content
- **Image/video sharing** with compression
- **File attachments** with size limits
- **Emoji picker** with custom emoji support
- **Message forwarding** and quoting

### Security & Privacy
- **End-to-end encryption** using Web Crypto API
- **JWT authentication** with refresh tokens
- **Rate limiting** and DDoS protection
- **Input validation** and sanitization
- **User blocking/reporting** system

### Advanced Features
- **Push notifications** (Web Push API + FCM)
- **Offline support** with service workers
- **Multi-device synchronization**
- **Admin dashboard** for user management
- **Analytics dashboard** (active users, message volume)
- **Content moderation** tools

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Redux Toolkit for state management
- Material-UI for components
- Socket.io-client for real-time communication
- Vite for build tooling

**Backend:**
- Node.js 18+ with Express.js and TypeScript
- PostgreSQL with Prisma ORM
- Socket.io server with Redis adapter
- JWT authentication with bcrypt
- AWS S3 for file storage
- Redis for caching and sessions

**Infrastructure:**
- Docker containers for deployment
- Nginx for load balancing
- Redis for horizontal scaling
- PostgreSQL for data persistence

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   CDN/Static    │    │   Push Service  │
│     (Nginx)     │    │     Assets      │    │      (FCM)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   File Storage  │    │   Notification  │
│   (React SPA)   │    │    (AWS S3)     │    │    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   WebSocket     │    │   Auth Service  │
│   (Express.js)  │◄──►│   (Socket.io)   │◄──►│     (JWT)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Cache Layer   │
│  (PostgreSQL)   │    │    (Redis)      │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/nuvora-chat.git
   cd nuvora-chat
   ```

2. **Install dependencies:**
   ```bash
   npm run setup
   ```

3. **Set up environment variables:**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   
   # Frontend environment
   cp frontend/.env.example frontend/.env
   ```

4. **Start development services:**
   ```bash
   # Start database and Redis
   docker-compose up postgres redis -d
   
   # Run database migrations
   cd backend && npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Socket.io: ws://localhost:5000

### Production Deployment

1. **Using Docker Compose:**
   ```bash
   # Build and start all services
   docker-compose up --build -d
   
   # Check service health
   docker-compose ps
   ```

2. **Manual deployment:**
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # Build backend
   cd ../backend && npm run build
   
   # Start production server
   npm start
   ```

## 📁 Project Structure

```
nuvora-chat/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── dist/               # Built application
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── socket/         # Socket.io handlers
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── prisma/             # Database schema and migrations
│   ├── uploads/            # File uploads directory
│   └── dist/               # Built application
├── database/               # Database scripts and migrations
├── docs/                   # Documentation
├── docker/                 # Docker configuration files
├── deployment/             # Deployment scripts and configs
├── nginx/                  # Nginx configuration
└── tests/                  # Test files
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/nuvora_chat
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=http://localhost:3000
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nuvora-chat-uploads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Nuvora Chat
VITE_MAX_FILE_SIZE=10485760
VITE_SUPPORTED_FILE_TYPES=image/*,video/*,audio/*,.pdf,.doc,.docx
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Structure

- **Unit Tests:** Jest for both frontend and backend
- **Integration Tests:** Supertest for API endpoints
- **E2E Tests:** Cypress for user workflows
- **Performance Tests:** Artillery for load testing

## 📊 Monitoring & Analytics

### Health Checks

- **Application Health:** `/health` endpoint
- **Database Health:** Connection pool monitoring
- **Redis Health:** Connection status
- **Socket.io Health:** Connection count

### Metrics

- **User Metrics:** Active users, registration rate
- **Message Metrics:** Messages per second, delivery rate
- **Performance Metrics:** Response time, error rate
- **System Metrics:** CPU, memory, disk usage

### Logging

- **Structured Logging:** Winston with JSON format
- **Log Levels:** Error, warn, info, debug
- **Log Aggregation:** ELK stack or similar
- **Error Tracking:** Sentry integration

## 🔒 Security

### Authentication & Authorization

- **JWT Tokens:** Access and refresh token pattern
- **Password Security:** bcrypt with salt rounds
- **Session Management:** Redis-based sessions
- **Role-Based Access:** Admin, moderator, user roles

### Data Protection

- **Input Validation:** express-validator
- **SQL Injection Prevention:** Parameterized queries
- **XSS Protection:** Content Security Policy
- **CSRF Protection:** CSRF tokens
- **Rate Limiting:** Express rate limit

### Encryption

- **Data at Rest:** Database encryption
- **Data in Transit:** TLS/SSL encryption
- **End-to-End:** Web Crypto API implementation
- **File Encryption:** Encrypted file storage

## 📈 Scaling Strategy

### Horizontal Scaling

- **Load Balancing:** Nginx with multiple backend instances
- **Database Scaling:** Read replicas and sharding
- **Cache Scaling:** Redis cluster
- **CDN Integration:** Static asset distribution

### Performance Optimization

- **Database Optimization:** Indexing, query optimization
- **Caching Strategy:** Multi-level caching
- **Asset Optimization:** Compression, minification
- **Code Splitting:** Lazy loading, tree shaking

### Infrastructure

- **Container Orchestration:** Kubernetes deployment
- **Auto Scaling:** Based on CPU/memory metrics
- **Database Clustering:** PostgreSQL cluster
- **Message Queue:** Redis pub/sub for scaling

## 🚀 Deployment

### Cloud Providers

**AWS Deployment:**
- **Compute:** ECS or EKS
- **Database:** RDS PostgreSQL
- **Cache:** ElastiCache Redis
- **Storage:** S3 for files
- **CDN:** CloudFront
- **Load Balancer:** ALB

**Google Cloud Deployment:**
- **Compute:** GKE or Cloud Run
- **Database:** Cloud SQL PostgreSQL
- **Cache:** Memorystore Redis
- **Storage:** Cloud Storage
- **CDN:** Cloud CDN
- **Load Balancer:** Cloud Load Balancing

**Azure Deployment:**
- **Compute:** AKS or Container Instances
- **Database:** Azure Database for PostgreSQL
- **Cache:** Azure Cache for Redis
- **Storage:** Blob Storage
- **CDN:** Azure CDN
- **Load Balancer:** Azure Load Balancer

### CI/CD Pipeline

```yaml
# GitHub Actions example
name: Deploy Nuvora Chat
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t nuvora-chat .
      - run: docker push ${{ secrets.REGISTRY }}/nuvora-chat
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: kubectl apply -f k8s/
```

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Refresh access token
POST /api/auth/verify-email # Email verification
```

### Chat Endpoints

```
GET    /api/chats           # Get user's chats
POST   /api/chats           # Create new chat
GET    /api/chats/:id       # Get chat details
PUT    /api/chats/:id       # Update chat
DELETE /api/chats/:id       # Delete chat
POST   /api/chats/:id/join  # Join chat
POST   /api/chats/:id/leave # Leave chat
```

### Message Endpoints

```
GET    /api/messages/:chatId     # Get chat messages
POST   /api/messages             # Send message
PUT    /api/messages/:id         # Edit message
DELETE /api/messages/:id         # Delete message
POST   /api/messages/:id/react   # React to message
```

### User Endpoints

```
GET    /api/users/me        # Get current user
PUT    /api/users/me        # Update profile
GET    /api/users/search    # Search users
POST   /api/users/block     # Block user
POST   /api/users/report    # Report user
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- **Code Style:** ESLint + Prettier configuration
- **Commit Messages:** Conventional commits format
- **Testing:** Minimum 80% code coverage
- **Documentation:** Update docs for new features
- **Security:** Security review for sensitive changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** [docs.nuvora.com](https://docs.nuvora.com)
- **Issues:** [GitHub Issues](https://github.com/your-org/nuvora-chat/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/nuvora-chat/discussions)
- **Email:** support@nuvora.com

## 🙏 Acknowledgments

- **Socket.io** for real-time communication
- **Prisma** for database management
- **Material-UI** for UI components
- **Redis** for caching and pub/sub
- **PostgreSQL** for data persistence

---

**Built with ❤️ by the Nuvora Team**

*Ready for production deployment and scaling to billions of users worldwide.*