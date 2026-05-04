Autonomous AI Agent for Enterprise Document Retrieval and Q&A
Master context file — read this before executing any task.

1. Project Identity
Name: DocMind — Autonomous AI Agent for Enterprise Document Retrieval and Q&A
Purpose: An internal knowledge management system that allows enterprise users to upload documents and query them via an AI Agent powered by RAG (Retrieval-Augmented Generation). The agent retrieves relevant context from a vector database and returns accurate, fact-grounded answers — minimizing hallucination.
Target Users:

Admin: Uploads, manages, and organizes internal documents.
End User: Queries the system via a chat interface to get answers sourced strictly from uploaded documents.


2. Tech Stack
LayerTechnologyRuntimeNode.js (v20+)Backend FrameworkExpress.jsFrontend FrameworkReact.js (Vite)DatabaseMongoDB (via Mongoose)Vector DatabaseChromaDB (default) — Pinecone as fallbackAI FrameworkLangChain (JS)LLMGoogle Gemini 2.5 Flash via @langchain/google-genaiEmbeddingsGoogle gemini-embedding-001 via direct REST API (v1beta)File Parsingpdf-parse, mammoth (docx), xlsxAuthJWT (jsonwebtoken) + bcryptFile StorageLocal /uploads folder (dev) — abstract behind a StorageService for future S3 swapStylingTailwind CSSAPI StyleRESTfulPackage Managernpm

3. Architecture
client/                          # React frontend (Vite)
  src/
    components/
    pages/
    services/                    # API call wrappers
    hooks/
  index.html

server/                          # Express backend
  src/
    config/                      # DB connections, env validation
    controllers/
    middleware/                  # auth, error handler, multer
    models/                      # Mongoose schemas
    routes/
    services/
      StorageService.js          # File I/O abstraction
      EmbeddingService.js        # Chunking + embedding logic
      RAGService.js              # LangChain retrieval + LLM call
      VectorDBService.js         # ChromaDB adapter
    utils/
    app.js
    server.js

uploads/                         # Temp file storage (gitignored)
.env
requirements.md                  # This file

4. Architecture Constraints (Hard Rules)
These rules are non-negotiable. Do not deviate.

No monolith controllers. Business logic lives in services/, controllers only handle HTTP request/response.
Environment variables only. No API keys or secrets hardcoded anywhere. All secrets via .env and validated at startup in config/env.js.
StorageService abstraction. Never call fs directly in controllers — always go through StorageService.
RAG grounding. The LLM must ONLY answer using retrieved context. System prompt must explicitly forbid the model from using its parametric knowledge.
Chunking strategy. Split documents into chunks of 512 tokens with 50-token overlap using LangChain's RecursiveCharacterTextSplitter.
Vector metadata. Every embedded chunk must store: documentId, fileName, chunkIndex, uploadedBy, uploadedAt.
Auth on all non-public routes. Every /api route except /auth/login and /auth/register requires a valid JWT in Authorization: Bearer <token> header.
Unified error handler. All errors bubble up to a single Express error middleware — never send raw error messages to the client.
CORS. Restrict to http://localhost:5173 in development.
No any types if using TypeScript. (Project uses JS, but apply the same discipline with JSDoc where relevant.)


5. Deliverables & Build Order
Execute phases in order. Do not start the next phase until the current phase is verified.
Phase 1 — Project Scaffold

 Initialize monorepo: client/ (Vite + React) and server/ (Express) in one root
 Setup .env with all required keys (provide .env.example)
 Connect MongoDB via Mongoose with connection error handling
 Setup ChromaDB client connection
 Basic Express app with health check route GET /api/health
 CORS, JSON body parser, unified error middleware wired up

Phase 2 — Auth System

 User Mongoose model: { name, email, password (hashed), role: ['admin','user'] }
 POST /api/auth/register — hash password with bcrypt, return JWT
 POST /api/auth/login — validate credentials, return JWT
 authMiddleware.js — verify JWT, attach req.user
 adminMiddleware.js — restrict route to role === 'admin'

Phase 3 — Document Upload Pipeline

 Document Mongoose model: { fileName, originalName, mimeType, size, uploadedBy, uploadedAt, status: ['processing','ready','failed'], chunkCount }
 POST /api/documents/upload — accept PDF, DOCX, XLSX via multer (10MB limit)
 StorageService — save file to uploads/, return file path
 EmbeddingService — extract text by file type, chunk with RecursiveCharacterTextSplitter, embed with gemini-embedding-001 via direct REST API (v1beta), upsert to ChromaDB
 GET /api/documents — list all documents (admin only)
 DELETE /api/documents/:id — delete document + its vectors from ChromaDB

Phase 4 — RAG Query Pipeline

 RAGService — given a user query: embed query → similarity search ChromaDB (top 5 chunks) → build prompt with retrieved context → call LLM → return answer + source chunks
 POST /api/chat/query — accepts { question: string }, returns { answer: string, sources: [{fileName, chunkIndex}] }
 System prompt template: "You are a document assistant. Answer ONLY using the provided context. If the context does not contain the answer, respond: 'I could not find this information in the uploaded documents.' Do not use outside knowledge."
 Response latency target: < 3 seconds for queries on documents up to 50 pages

Phase 5 — React Frontend

 Login page (JWT stored in localStorage)
 Admin dashboard: upload document form, document list with delete button, status badge (processing / ready / failed)
 Chat interface: message input, conversation history, display answer + collapsible source citations
 Axios service layer in client/src/services/api.js — all API calls centralized here
 Loading states and error messages on all async actions

Phase 6 — Polish & Verification

 .env.example with all required keys and descriptions
 README.md with: project overview, setup steps, how to run, API reference
 Basic input validation on all routes (express-validator or manual)
 Test the full flow end-to-end: register → login → upload PDF → query → receive grounded answer


6. Code Standards

Language: JavaScript (ES2022+). Use async/await, never raw .then() chains.
Comments: English only. Comment only non-obvious logic — do not comment self-explanatory code.
Naming:

Files: camelCase.js for utilities/services, PascalCase.jsx for React components
Variables/functions: camelCase
Constants: UPPER_SNAKE_CASE
MongoDB collections: camelCase (Mongoose handles pluralization)


Imports: Named imports preferred. Group: 3rd-party → internal services → utils.
No console.log in production paths. Use a simple logger utility wrapping console that can be silenced via NODE_ENV.
React: Functional components only. No class components. Custom hooks for reusable logic.
Tailwind: Utility-first. No inline style={} except for truly dynamic values.


7. Environment Variables Required
env# Server
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/docmind
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Google AI (Gemini) — free tier via Google AI Studio: aistudio.google.com
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# ChromaDB
CHROMA_HOST=http://localhost:8001
CHROMA_COLLECTION=docmind_vectors

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads

8. Verification Criteria (Definition of Done)
A phase is done only when ALL criteria below are met:
PhaseCriteria1 — ScaffoldGET /api/health returns { status: 'ok' }. MongoDB and ChromaDB connections logged on startup.2 — AuthJWT issued on login. Protected route returns 401 without token. Admin route returns 403 for non-admin user.3 — UploadPDF upload triggers text extraction, chunking, embedding, and ChromaDB upsert. Document status changes to ready.4 — RAGQuery on uploaded document returns answer citing correct source file. Unrelated query returns the fallback message. Latency < 3s.5 — FrontendFull flow completable in browser: login → upload → chat → see answer with source citation.6 — PolishProject runs from scratch with only npm install + .env setup. README accurately describes setup.

9. Out of Scope (Do Not Implement)

OAuth / social login
Real-time streaming responses (WebSocket / SSE) — use standard HTTP response
Cloud file storage (S3) — abstract the interface but implement locally only
Multi-tenancy / organization management
Image extraction from documents
Document versioning