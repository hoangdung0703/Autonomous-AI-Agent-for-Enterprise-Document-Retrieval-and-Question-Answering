# DocMind — Autonomous AI Agent for Enterprise Document Retrieval and Q&A

DocMind is an internal knowledge management system that lets enterprise teams upload documents (PDF, DOCX, XLSX) and query them through an AI chat interface powered by RAG (Retrieval-Augmented Generation). The agent retrieves relevant context from a ChromaDB vector store and uses Google Gemini to produce accurate, fact-grounded answers — minimising hallucination.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v20+ |
| npm | v10+ |
| Docker Desktop | Latest (for MongoDB & ChromaDB) |
| Google AI Studio API key | [aistudio.google.com](https://aistudio.google.com) |

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "Autonomous AI Agent for Enterprise Document Retrieval and Q&A"
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the two required secrets:

```
GOOGLE_API_KEY=<your key from aistudio.google.com>
JWT_SECRET=<generate with: openssl rand -hex 32>
```

All other values in `.env.example` are pre-filled with correct defaults for local development.

### 3. Start infrastructure (MongoDB + ChromaDB)

```bash
docker-compose up -d
```

This starts:
- **MongoDB** on port `27017`
- **ChromaDB** on port `8001`

### 4. Install server dependencies

```bash
cd server
npm install
```

### 5. Install client dependencies

```bash
cd ../client
npm install
```

---

## Running Locally

Open two terminal tabs:

**Terminal 1 — Backend API server:**
```bash
cd server
node src/server.js
# → Server running on http://localhost:5001
```

**Terminal 2 — Frontend dev server:**
```bash
cd client
npm run dev
# → App available at http://localhost:5173
```

### Create an admin account (first-time setup only)

```bash
cd server
node createAdmin.js
```

This prints the admin email, password, and a JWT token you can use immediately.

---

## API Reference

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register a new user account. Body: `{ name, email, password }` |
| `POST` | `/api/auth/login` | None | Login and receive a JWT. Body: `{ email, password }` |

### Documents (Admin only)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/documents` | Admin JWT | List all uploaded documents with status and metadata |
| `POST` | `/api/documents/upload` | Admin JWT | Upload a PDF, DOCX, or XLSX file (max 10 MB). Triggers async embedding pipeline |
| `DELETE` | `/api/documents/:id` | Admin JWT | Delete a document, its disk file, and its ChromaDB vectors |

### Chat (Any authenticated user)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat/query` | Any JWT | Ask a question. Body: `{ question: string }`. Returns `{ answer, sources }` |

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Returns `{ status: 'ok' }` — used to verify the server is running |

All protected routes require `Authorization: Bearer <token>` header.

---

## Project Structure

```
.
├── client/               # React + Vite frontend (Tailwind CSS v4)
│   └── src/
│       ├── components/   # UI, layout, chat, document components
│       ├── hooks/        # useAuth, useChat, useDocuments
│       ├── pages/        # LoginPage, ChatPage, DashboardPage
│       └── services/     # Axios API wrapper
│
├── server/               # Express.js backend
│   └── src/
│       ├── config/       # env validation, DB connections
│       ├── controllers/  # HTTP layer only — thin
│       ├── middleware/   # auth, admin, upload, error handler
│       ├── models/       # Mongoose schemas (User, Document)
│       ├── routes/       # Route definitions
│       ├── services/     # Business logic (Auth, Embedding, RAG, VectorDB, Storage)
│       └── utils/        # embedText.js shared utility
│
├── docker-compose.yml    # MongoDB + ChromaDB local infrastructure
├── .env.example          # Template — copy to .env and fill in secrets
└── requirements.md       # Full project specification
```

---

## Known Limitations

- **File storage is local only.** Uploaded files are saved to `server/uploads/`. This directory is not shared between machines or persisted across Docker restarts. For production, replace `StorageService.js` with an S3 adapter.
- **No real-time streaming.** Chat responses are returned as a single HTTP response after the full LLM call completes. Streaming (SSE/WebSocket) is out of scope per spec.
- **Embedding rate limits.** The Gemini embedding API (free tier) has strict RPM limits. Large documents are processed in batches of 3 chunks with 1-second delays to stay within limits — processing a 100-page PDF may take 2–3 minutes.
- **ChromaDB default embedding warning.** You may see `Cannot instantiate a collection with the DefaultEmbeddingFunction` in the server logs. This is a ChromaDB SDK warning — it does not affect functionality because DocMind always provides pre-computed embeddings.
- **No OAuth or social login.** Authentication is email + password JWT only.
- **Single-tenant.** There is no organisation or workspace isolation between users.
