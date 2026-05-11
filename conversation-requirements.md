DocMind — Conversation Management Feature
Read alongside requirements.md and frontend-requirements.md before executing any task.

1. Feature Overview
Each conversation is an isolated RAG session with its own:

Title (auto-generated or user-defined)
Selected documents (RAG only searches within these documents)
Message history (persisted in MongoDB)

Users can create multiple conversations, each scoped to different document sets.
The global "chat with all documents" behavior is replaced entirely by this system.

2. Data Model Changes
New: Conversation Mongoose Model
js{
  title: { type: String, required: true, default: 'New Conversation' },
  userId: { type: ObjectId, ref: 'User', required: true },
  documentIds: [{ type: ObjectId, ref: 'Document' }],  // selected docs for this conversation
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      sources: [{ fileName: String, chunkIndex: Number }],  // only for assistant messages
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
Modified: No changes to Document or User models.

3. API Endpoints
Conversations
MethodPathAuthDescriptionPOST/api/conversationsuser/adminCreate new conversationGET/api/conversationsuser/adminList user's conversations (newest first)GET/api/conversations/:iduser/adminGet conversation with full message historyPATCH/api/conversations/:id/titleuser/adminRename conversationDELETE/api/conversations/:iduser/adminDelete conversation + messagesPOST/api/conversations/:id/queryuser/adminSend message + get RAG response
Remove

POST /api/chat/query — replaced by POST /api/conversations/:id/query
chatRoutes.js and chatController.js — deprecated, remove cleanly


4. Backend Implementation
ConversationService.js
All business logic here. Controllers stay thin.
createConversation({ userId, title, documentIds })

Validate documentIds exist and belong to ready documents
Create and return new Conversation document

listConversations(userId)

Return all conversations for user, sorted by updatedAt desc
Populate documentIds with { _id, originalName, status } only — no file paths

getConversation(conversationId, userId)

Return full conversation including messages
Throw 403 if userId doesn't match conversation.userId

renameConversation(conversationId, userId, newTitle)

Update title, return updated conversation

deleteConversation(conversationId, userId)

Auth check: only owner can delete
Delete conversation document

queryConversation(conversationId, userId, question)

Auth check
Call RAGService.query(question, documentIds) — pass conversation's documentIds
Append user message + assistant response to conversation.messages
Update conversation.updatedAt
Return { answer, sources }

RAGService.js — Modify existing
Add documentIds parameter to query():
jsasync query(question, documentIds = [])

If documentIds is non-empty, pass as filter to VectorDBService.queryCollection()
ChromaDB supports metadata filtering: where: { documentId: { $in: documentIds.map(id => id.toString()) } }

VectorDBService.js — Modify existing
Update queryCollection(queryEmbedding, nResults, documentIds = []):
js// Add where clause if documentIds provided
const queryParams = {
  queryEmbeddings: [queryEmbedding],
  nResults,
};
if (documentIds.length > 0) {
  queryParams.where = { documentId: { $in: documentIds } };
}

5. Frontend Changes
Sidebar — Full redesign
Replace the single "Chat" nav item with a conversation list:
┌─────────────────────────┐
│ DocMind                 │
│                         │
│ [+ New Conversation]    │  ← primary CTA button
│                         │
│ CONVERSATIONS           │  ← section label
│ > My first chat     ⋯  │  ← active conversation
│   Voicebot Q&A      ⋯  │
│   HR Policy Review  ⋯  │
│                         │
│ ─────────────────────   │
│ Documents               │  ← admin only
│ ─────────────────────   │
│ [user@email] [logout]   │
└─────────────────────────┘

Each conversation item: title (truncated), hover shows ⋯ menu (rename, delete)
Active conversation: bg-accent-subtle border-l-2 border-accent
"New Conversation" button: full width, bg-background-elevated hover:bg-background-hover border border-border-subtle

New Conversation Modal
Triggered by "New Conversation" button:

Input: conversation title (optional, default "New Conversation")
Document selector: checkbox list of all ready documents with originalName
At least 1 document must be selected (validate before submit)
Submit → POST /api/conversations → navigate to new conversation

ChatPage — Redesign

Load conversation from GET /api/conversations/:id on mount
Display selected documents as chips below the header: 📄 Voicebot Guide  📄 HR Policy
Send message to POST /api/conversations/:id/query
Messages come from conversation.messages — persistent across page navigations
No more localStorage for chat — MongoDB is the source of truth

New hooks
useConversations.js

conversations state, createConversation(), deleteConversation(), renameConversation()
Fetch on mount

useConversation.js (single conversation)

conversation state, sendMessage(), isLoading
Fetch on conversationId change

Remove

useChat.js — replaced by useConversation.js
localStorage chat persistence — no longer needed


6. New File Structure
server/src/
  models/
    Conversation.js          ← NEW
  services/
    ConversationService.js   ← NEW
  controllers/
    conversationController.js ← NEW
  routes/
    conversationRoutes.js    ← NEW
  # Remove: chatController.js, chatRoutes.js

client/src/
  hooks/
    useConversations.js      ← NEW (list)
    useConversation.js       ← NEW (single)
    # Remove: useChat.js
  components/
    chat/
      NewConversationModal.jsx ← NEW
      ConversationHeader.jsx   ← NEW
    layout/
      Sidebar.jsx              ← MODIFY (conversation list)
  pages/
    ChatPage.jsx               ← MODIFY (load from API)

7. Verification Criteria
CriteriaExpected ResultCreate conversationModal opens, documents selectable, conversation created and appears in sidebarConversation isolationAsking about Doc A in Conv A returns answer from Doc A only — not Doc BMessage persistenceNavigate away and back — messages still thereRenameClick ⋯ → rename → title updates in sidebarDeleteClick ⋯ → delete → conversation removed from sidebar, redirects to empty stateMulti-conversationTwo conversations with different documents return different answers to same question

8. Constraints

A conversation can only be queried if all its documentIds have status: 'ready' — return 400 if any are still processing
Users can only see and interact with their own conversations — never another user's
Max 10 documents per conversation
Conversation title max 100 characters
Do not delete documents when deleting a conversation — only the conversation record