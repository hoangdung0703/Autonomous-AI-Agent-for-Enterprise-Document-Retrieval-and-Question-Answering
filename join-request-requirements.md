# join-request-requirements.md
# DocMind — Organization Join Request Feature
# Read alongside requirements.md, frontend-requirements.md, conversation-requirements.md, organization-requirements.md, and SKILL.md before executing any task.

---

## 1. Feature Overview

Instead of immediately joining an organization, users submit a **join request** that must be approved by an org admin. Users cannot access the app until approved. Rejected users can re-submit.

**orgCode format:** 6-character alphanumeric, uppercase, no hyphen (e.g. `X4K2F9`). Shorter and easier to share verbally.

---

## 2. Data Model

### New: `JoinRequest` Mongoose Model
```js
{
  userId:         { type: ObjectId, ref: 'User', required: true },
  organizationId: { type: ObjectId, ref: 'Organization', required: true },
  status:         { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt:      { type: Date, default: Date.now },
  reviewedAt:     { type: Date, default: null },
  reviewedBy:     { type: ObjectId, ref: 'User', default: null }
}
```

**Constraints:**
- A user can only have ONE `pending` request at a time — enforce at service level
- A user CAN re-submit after rejection (previous rejected request is kept for audit, new one created)
- A user cannot submit a new request if they already have a `pending` one

### Modified: `Organization` Model
Change `code` from 8-char (`XXXX-XXXX`) to **6-char** (`XXXXXX`) format:
```js
code: { type: String, required: true, unique: true, uppercase: true, minlength: 6, maxlength: 6 }
```
Generation: `crypto.randomBytes(3).toString('hex').toUpperCase()` → always exactly 6 chars.

### Modified: `OrganizationService.joinOrganization()`
Remove the direct join logic entirely. Replace with request flow — see `JoinRequestService` below.

### Modified: `User` Model
No changes needed beyond what organization-requirements.md already added.

---

## 3. API Endpoints

### Join Requests

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/join-requests` | authenticated, no org | Submit join request via orgCode |
| GET | `/api/join-requests/me` | authenticated, no org | Get current user's latest request status |
| GET | `/api/join-requests` | admin + org | List all pending requests for admin's org |
| PATCH | `/api/join-requests/:id/approve` | admin + org | Approve request |
| PATCH | `/api/join-requests/:id/reject` | admin + org | Reject request |

---

## 4. Backend Implementation

### `JoinRequestService.js`

**`submitRequest({ userId, orgCode })`**
1. Find org by `orgCode.toUpperCase()` → throw 404 `"Organization not found"` if not found
2. Load user → throw 400 `"You are already in an organization"` if `user.organizationId !== null`
3. Check for existing pending request for this user → throw 400 `"You already have a pending request"` if found
4. Create new `JoinRequest` with `status: 'pending'`
5. Return `{ request, organization: { name, code } }`

**`getMyRequest(userId)`**
- Find the most recent request for userId (sort by `createdAt: -1`)
- Populate `organizationId` with `{ name, code }`
- Return request or null

**`listPendingRequests(organizationId)`**
- Find all requests where `{ organizationId, status: 'pending' }`
- Populate `userId` with `{ name, email, createdAt }`
- Sort by `createdAt: asc` (oldest first)
- Return array

**`approveRequest({ requestId, adminId, organizationId })`**
1. Find request by `requestId` where `{ organizationId, status: 'pending' }` → throw 404 if not found
2. Update request: `status: 'approved'`, `reviewedAt: Date.now()`, `reviewedBy: adminId`
3. Update user: `organizationId = request.organizationId`, `role = 'user'`
4. Generate fresh JWT via `AuthService.generateToken(updatedUser)`
5. Return `{ request, token }` — token is for the approved user (frontend polls and receives it)

**`rejectRequest({ requestId, adminId, organizationId })`**
1. Find request → throw 404 if not found or not pending
2. Update: `status: 'rejected'`, `reviewedAt: Date.now()`, `reviewedBy: adminId`
3. Return `{ request }`

### `joinRequestController.js`
Thin HTTP wrapper. Five handlers mapping to service methods above.

### `joinRequestRoutes.js`
```
POST  /api/join-requests              → submit    (authMiddleware)
GET   /api/join-requests/me           → getMe     (authMiddleware)
GET   /api/join-requests              → list      (authMiddleware, adminMiddleware, orgMiddleware)
PATCH /api/join-requests/:id/approve  → approve   (authMiddleware, adminMiddleware, orgMiddleware)
PATCH /api/join-requests/:id/reject   → reject    (authMiddleware, adminMiddleware, orgMiddleware)
```

### `app.js`
Add: `app.use('/api/join-requests', joinRequestRoutes)`

---

## 5. Polling Mechanism (No WebSocket)

After submitting a request, the frontend polls `GET /api/join-requests/me` every **5 seconds**.

Response shape:
```json
{
  "status": "pending" | "approved" | "rejected",
  "organization": { "name": "FPT Smart Cloud", "code": "X4K2F9" },
  "reviewedAt": null | "<ISO date>"
}
```

- `pending` → keep showing waiting screen
- `approved` → backend returns fresh JWT in the approve endpoint response, but the **polling endpoint does NOT return a token**. Instead: when status becomes `approved`, frontend calls `POST /api/auth/login` is NOT an option. Better: create a dedicated token-refresh endpoint.

### Token Refresh Endpoint
```
GET /api/auth/refresh-token   (authMiddleware)
```
Returns a fresh JWT for the current user with updated `organizationId`. Called by frontend when polling detects `status: 'approved'`.

---

## 6. Frontend Changes

### Modified: `OnboardingPage.jsx`
**Join tab — new flow:**
- Input: 6-char orgCode (auto-uppercase, maxlength 6)
- Submit → `POST /api/join-requests`
- On success → switch to **Waiting Screen** (same page, different view state)

**Waiting Screen:**
```
┌─────────────────────────────────┐
│  ⏳ Request Pending             │
│                                 │
│  You've requested to join       │
│  "FPT Smart Cloud"              │
│                                 │
│  Waiting for admin approval...  │
│  [animated pulse indicator]     │
│                                 │
│  [Cancel Request]               │
└─────────────────────────────────┘
```
- Poll `GET /api/join-requests/me` every 5 seconds
- On `approved`: call `GET /api/auth/refresh-token` → store new JWT → redirect to `/`
- On `rejected`: show rejection message + "Submit another request" button → back to Join tab input

**Create tab — unchanged** (org creator is immediately admin, no request needed)

**On mount:** Call `GET /api/join-requests/me` first — if there's a pending request already, skip directly to Waiting Screen.

### Modified: `Sidebar.jsx` — Admin Badge
Add pending request count badge to the Dashboard nav item:
```jsx
{pendingCount > 0 && (
  <span className="ml-auto bg-status-failed text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
    {pendingCount}
  </span>
)}
```
Fetch `GET /api/join-requests` count on mount (admin only). Poll every 30 seconds.

### Modified: `DashboardPage.jsx`
Add a "Member Requests" tab alongside the existing Upload/Documents sections:

```
Dashboard
├── [Documents tab]    ← existing
└── [Requests tab]     ← NEW — only visible to admin
```

**Requests tab content:**
- Table: Name, Email, Requested At, Actions
- Actions: `[Approve]` (green) `[Reject]` (red) buttons per row
- Empty state: "No pending requests"
- After approve/reject: remove from list optimistically

### New hook: `useJoinRequests.js`
- `pendingRequests` state
- `fetchPendingRequests()` — admin only
- `approveRequest(id)`, `rejectRequest(id)`
- Used by `DashboardPage` Requests tab and `Sidebar` badge

---

## 7. New File Structure

```
server/src/
  models/
    JoinRequest.js               ← NEW
  services/
    JoinRequestService.js        ← NEW
  controllers/
    joinRequestController.js     ← NEW
  routes/
    joinRequestRoutes.js         ← NEW

server/src/routes/
  authRoutes.js                  ← MODIFY (add refresh-token endpoint)

server/src/controllers/
  authController.js              ← MODIFY (add refreshToken handler)

client/src/
  hooks/
    useJoinRequests.js           ← NEW
  pages/
    OnboardingPage.jsx           ← MODIFY (waiting screen + polling)
  components/
    layout/
      Sidebar.jsx                ← MODIFY (pending badge)
    dashboard/
      RequestsTab.jsx            ← NEW
  pages/
    DashboardPage.jsx            ← MODIFY (add Requests tab)
```

---

## 8. Verification Criteria

| Criteria | Expected |
|---|---|
| Submit request | User enters valid orgCode → sees Waiting Screen with org name |
| Invalid orgCode | Error: "Organization not found" shown inline |
| Duplicate pending | Error: "You already have a pending request" |
| Admin sees badge | Sidebar shows red badge with count on Dashboard nav item |
| Admin approves | User polling detects approved → refreshes token → enters app |
| Admin rejects | User sees rejection message + can re-submit |
| Re-submit after reject | New pending request created, old rejected one preserved |
| Data isolation | Approved user only sees org's documents and conversations |

---

## 9. Constraints

- Polling interval: 5 seconds on OnboardingPage waiting screen, 30 seconds on Sidebar badge
- Stop polling when component unmounts (use `clearInterval` in `useEffect` cleanup)
- `GET /api/join-requests/me` does NOT require org — user has no org yet
- `GET /api/join-requests` (admin list) DOES require org via `orgMiddleware`
- Token returned from `approve` endpoint is for the **approved user**, not the admin — do not store it on the admin's side
- Cancel request: out of scope for this iteration

---

*Last updated: 2026 — Nguyễn Hoàng Dũng — FPT Smart Cloud Internship Project*