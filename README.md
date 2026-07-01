# Archon — AI-powered Enterprise Document Retrieval & Q&A

## Overview

Archon is a full-stack enterprise application that enables organizations to upload documents and ask natural-language questions about their content using Retrieval-Augmented Generation (RAG). It combines vector search with Google Gemini AI to deliver accurate, source-cited answers from private document collections, with user authentication, role-based access, and organization management.

## Live Demo

https://autonomous-ai-agent-for-enterprise.vercel.app

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, MongoDB (Mongoose), ChromaDB |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| AI/ML | Google Gemini API, LangChain |
| Auth | JWT (access + refresh tokens), bcrypt |
| Email | Resend |
| Other | Multer, PDF-parse, Mammoth (DOCX), Winston, Rate Limiting |

## Prerequisites

- Node.js v18 or higher
- npm v8 or higher
- MongoDB Atlas account (free tier sufficient)
- ChromaDB instance (local via Docker or deployed)
- Google Gemini API key
- Resend API key (for email features)

## Installation

### 1. Extract the project

```bash
unzip Archon-Source-Code.zip
cd Archon-Source-Code
```

### 2. Install backend dependencies

```bash
cd server
npm install --legacy-peer-deps
```

### 3. Install frontend dependencies

```bash
cd client
npm install --legacy-peer-deps
```

### 4. Configure environment variables

Copy `server/.env.example` to `server/.env` and fill in your values.
Copy `client/.env.example` to `client/.env` and fill in your values.

### 5. Start ChromaDB locally (Docker)

```bash
docker run -p 8001:8000 chromadb/chroma
```

### 6. Start backend

```bash
cd server
node src/server.js
```

Backend runs on http://localhost:5001

### 7. Start frontend

```bash
cd client
npm run dev
```

Frontend runs on http://localhost:5173

## Environment Variables

### server/.env

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing |
| `GOOGLE_API_KEY` | Google Gemini API key |
| `CHROMA_HOST` | ChromaDB URL (e.g. http://localhost:8001) |
| `CHROMA_COLLECTION` | ChromaDB collection name (default: `archon_vectors`) |
| `RESEND_API_KEY` | Resend email service API key |
| `RESEND_FROM_EMAIL` | Sender email address |
| `FRONTEND_URL` | Frontend URL for CORS (e.g. http://localhost:5173) |
| `PORT` | Backend port (default: 5001) |
| `NODE_ENV` | `development` or `production` |

### client/.env

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (e.g. http://localhost:5001) |

## Project Structure

```
server/src/
├── app.js                  # Express app setup (middleware, routes, CORS)
├── server.js               # Entry point — starts HTTP server
├── config/
│   ├── db.js               # MongoDB/Mongoose connection
│   └── env.js              # Environment variable validation
├── controllers/
│   ├── authController.js   # Register, login, refresh, forgot/reset password
│   ├── conversationController.js  # Chat conversations & messaging
│   ├── documentController.js      # Document upload, list, delete
│   ├── inviteCodeController.js    # Organization invite code management
│   ├── joinRequestController.js   # Join request approval/rejection
│   ├── organizationController.js  # Organization CRUD
│   └── userController.js         # User profile & management
├── middleware/
│   ├── auth.js             # JWT verification middleware
│   ├── errorHandler.js     # Global error handling
│   ├── rateLimiter.js      # Rate limiting (express-rate-limit)
│   ├── requestLogger.js    # Request logging (Winston)
│   └── validate.js         # express-validator wrappers
├── models/
│   ├── Conversation.js     # Conversation & message schema
│   ├── Document.js         # Document metadata schema
│   ├── InviteCode.js       # Invite code schema
│   ├── JoinRequest.js      # Join request schema
│   ├── Message.js          # Individual message schema
│   ├── Organization.js     # Organization schema
│   ├── User.js             # User schema (with password hashing)
│   └── VerificationToken.js# Password reset token schema
├── routes/                 # Express route definitions (mirrors controllers)
├── services/
│   ├── AuthService.js      # Authentication logic
│   ├── ConversationService.js  # Chat & RAG query orchestration
│   ├── EmailService.js     # Resend email integration
│   ├── EmbeddingService.js # LangChain text splitting & embedding
│   ├── InviteCodeService.js
│   ├── JoinRequestService.js
│   ├── OrganizationService.js
│   ├── RAGService.js       # Retrieval-Augmented Generation pipeline
│   ├── StorageService.js   # Local file storage & cleanup
│   └── VectorDBService.js  # ChromaDB vector store operations
├── utils/
│   └── helpers.js          # Shared utility functions
└── validators/
    └── schemas.js          # express-validator validation schemas

client/src/
├── main.jsx                # React entry point
├── App.jsx                 # Root component with router setup
├── App.css                 # Global styles
├── index.css               # Tailwind imports & base styles
├── assets/                 # Static images (hero, logo, icons)
├── components/
│   ├── chat/               # ChatWindow, ChatInput, MessageBubble, etc.
│   ├── dashboard/          # InviteCodesTab, RequestsTab
│   ├── documents/          # DocumentList, UploadForm, StatusBadge
│   ├── layout/             # AppShell, Sidebar, ProtectedRoute
│   └── ui/                 # Button, Input, Spinner, Toast, SkeletonRow
├── context/
│   └── AuthContext.jsx     # Auth state management (React Context)
├── hooks/
│   └── useApi.js           # Custom hook for API calls with auth headers
├── pages/
│   ├── LoginPage.jsx       # Login
│   ├── RegisterPage.jsx    # Registration with invite code
│   ├── ForgotPasswordPage.jsx
│   ├── ResetPasswordPage.jsx
│   ├── ChatPage.jsx        # Main RAG chat interface
│   ├── DashboardPage.jsx   # Admin dashboard (invites, requests)
│   ├── OnboardingPage.jsx  # Organization setup wizard
│   └── ProfilePage.jsx     # User profile settings
└── services/
    └── api.js              # Axios instance with interceptors & refresh logic
```

## Production Deployment

- **Frontend**: Vercel
- **Backend + ChromaDB**: Render
- **Database**: MongoDB Atlas
