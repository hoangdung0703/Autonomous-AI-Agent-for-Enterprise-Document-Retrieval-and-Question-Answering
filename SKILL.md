DocMind — Agent Skill Sheet
Read this file before executing ANY task in this project.

1. Project Identity
Name: DocMind — Autonomous AI Agent for Enterprise Document Retrieval and Q&A
Stack: Node.js + Express + MongoDB + ChromaDB + React (Vite) + Tailwind v4
AI: Gemini 2.5 Flash (chat) + gemini-embedding-001 via direct REST API (embeddings)
Ports: Backend 5001, Frontend 5173, ChromaDB 8001, MongoDB 27017

2. Critical Project-Specific Knowledge
These are hard-won facts from debugging. Do not repeat these mistakes.
Embedding API

Model: gemini-embedding-001 — NOT text-embedding-004 (does not exist for this API key)
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent
Use v1beta — NOT v1 (returns 404)
Do NOT use @langchain/google-genai for embeddings — use direct fetch in utils/embedText.js
Batch size: max 3 chunks per Promise.all batch
Inter-batch delay: 1000ms between every batch
Retry: up to 2 retries with 2000ms delay on empty embedding
Skip chunks shorter than 50 chars after whitespace normalization

Tailwind v4

Config is in client/src/index.css via @theme directive — NO tailwind.config.js
Plugin must be in client/vite.config.js: import tailwindcss from '@tailwindcss/vite'
CSS token names must use hyphens only: --color-status-ready-bg NOT --color-status-ready_bg

File Upload

Vietnamese filenames must be decoded: decodeURIComponent(escape(file.originalname))
Wrap in try/catch — fallback to raw originalname if decode throws
Apply in both uploadMiddleware.js AND documentController.js

React Router v6

Layout wrappers MUST render <Outlet /> — never {children} for nested routes
ProtectedRoute must render <Outlet /> after auth check

npm Install

Always use --legacy-peer-deps for this project due to LangChain peer dependency conflicts

Port Conflicts

Port 5000 is taken by macOS AirPlay Receiver — backend runs on 5001
ChromaDB runs on 8001 (not default 8000) — already in .env

JWT

Payload includes: { id, email, role, name } — all four fields required


3. Architecture Rules (Non-Negotiable)

Business logic → services/ only. Controllers handle HTTP only.
Never call fs directly in controllers — use StorageService
Never hardcode secrets — all from env.js
All API calls in frontend → through client/src/services/api.js only
Never use fetch or raw axios in React components
Comments in English only
No console.log in production paths — use logger


4. File Ownership Map
FileOwner LayerNotesutils/embedText.jsUtilityShared by EmbeddingService + RAGServiceservices/EmbeddingService.jsServiceChunking + embedding pipelineservices/RAGService.jsServiceQuery embedding + ChromaDB search + LLM callservices/VectorDBService.jsServiceAll ChromaDB operationsservices/StorageService.jsServiceAll disk I/Oservices/AuthService.jsServiceJWT + bcryptconfig/env.jsConfigSingle source of truth for all env varsmiddleware/errorHandler.jsMiddlewareAll errors bubble hereclient/src/services/api.jsFrontendAll HTTP calls go through here

5. Current Project State
Completed Phases

✅ Phase 1: Scaffold (Express + MongoDB + ChromaDB)
✅ Phase 2: Auth (JWT + bcrypt + role-based middleware)
✅ Phase 3: Document upload pipeline (PDF/DOCX/XLSX + embeddings)
✅ Phase 4: RAG query pipeline (Gemini 2.5 Flash + ChromaDB retrieval)
✅ Phase 5: React frontend (chat UI + admin dashboard)
✅ Phase 6: Polish (README, .env.example, bug fixes)

In Progress

🔄 Conversation Management (see conversation-requirements.md)

Known Issues (Already Fixed — Do Not Reintroduce)

Vietnamese filename encoding ✅
Tailwind v4 vite plugin missing ✅
CSS token underscore → hyphen ✅
AppShell {children} → <Outlet /> ✅
JWT missing name field ✅
Embedding model text-embedding-004 → gemini-embedding-001 ✅
Embedding API v1 → v1beta ✅
Rate limiting: batch size reduced, delays added ✅


6. How to Run the Project
bash# 1. Start databases
docker-compose up -d

# 2. Start backend (from /server)
node src/server.js

# 3. Start frontend (from /client)
npm run dev
Access: http://localhost:5173
Admin account: create via POST /api/auth/register with "role": "admin"

7. Task Execution Protocol
When given a task:

Read SKILL.md (this file) first
Read relevant requirements.md or conversation-requirements.md
Identify which files need to change using the File Ownership Map
Propose changes before executing if the change touches more than 3 files
After executing, state which verification criteria from requirements are now met
Never mark a task done without specifying how to verify it