# organization-requirements.md
# DocMind — Organization & Multi-Tenancy Feature
# Read alongside requirements.md, frontend-requirements.md, conversation-requirements.md, and SKILL.md before executing any task.

---

## 1. Feature Overview

Every user belongs to exactly one Organization. All data (documents, conversations) is scoped to an organization — users in different organizations cannot see each other's data.

**Flow:**
1. User registers → no organization yet → redirected to `/onboarding`
2. On Onboarding page, user either:
   - **Creates a new org** → becomes `admin` of that org, receives `orgCode`
   - **Joins existing org** → becomes `user` of that org via `orgCode`
3. After joining/creating → redirected to home

---

## 2. Data Model Changes

### New: `Organization` Mongoose Model
```js
{
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  createdBy: { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}
```

**`code` generation:** 8-character alphanumeric string, uppercase, auto-generated on creation. Format: `XXXX-XXXX` (e.g. `FPT-X4K2`). Use `crypto.randomBytes(4).toString('hex').toUpperCase()` then insert hyphen at position 4.

### Modified: `User` Model
Add fields:
```js
organizationId: { type: ObjectId, ref: 'Organization', default: null }
```
Note: `organizationId: null` means user has not joined any org yet — they must complete onboarding.

### Modified: `Document` Model
Add field:
```js
organizationId: { type: ObjectId, ref: 'Organization', required: true }
```

### Modified: `Conversation` Model
Add field:
```js
organizationId: { type: ObjectId, ref: 'Organization', required: true }
```

---

## 3. API Endpoints

### Organizations

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/organizations` | authenticated | Create new org — caller becomes admin |
| POST | `/api/organizations/join` | authenticated | Join org via orgCode |
| GET | `/api/organizations/me` | authenticated | Get current user's org info |

### No changes to existing endpoints — just add org-scoping middleware.

---

## 4. Backend Implementation

### `OrganizationService.js`

**`createOrganization({ userId, name })`**
- Check user doesn't already have an org (`user.organizationId !== null`) → throw 400 if already in org
- Generate unique `code`: loop `crypto.randomBytes(4).toString('hex').toUpperCase()` until no collision in DB, insert hyphen at index 4
- Create Organization document with `createdBy: userId`
- Update `user.organizationId = org._id` and `user.role = 'admin'`
- Return `{ organization, user }`

**`joinOrganization({ userId, code })`**
- Check user doesn't already have an org → throw 400 if already in org
- Find org by `code.toUpperCase()` → throw 404 if not found
- Update `user.organizationId = org._id` (role stays `'user'`)
- Return `{ organization, user }`

**`getOrganization(userId)`**
- Find user → populate `organizationId`
- Return organization or null

### `orgMiddleware.js`
Middleware that runs after `authMiddleware` on all data routes:
```js
const orgMiddleware = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user.organizationId) {
    return res.status(403).json({ error: 'You must join an organization first.' });
  }
  req.organizationId = user.organizationId;
  next();
};
```

Add `orgMiddleware` to:
- All `/api/documents` routes
- All `/api/conversations` routes

### Scope all queries by `organizationId`

**`documentController.js`:**
- Upload: add `organizationId: req.organizationId` when creating Document record
- List: add `{ organizationId: req.organizationId }` to find query
- Delete: add org check before delete

**`ConversationService.js`:**
- `createConversation`: add `organizationId`
- `listConversations`: filter by `organizationId`
- `queryConversation`: verify conversation belongs to user's org

### Update JWT — add `organizationId` to token payload
In `AuthService.generateToken()`:
```js
{ id: user._id, email: user.email, role: user.role, name: user.name, organizationId: user.organizationId }
```

---

## 5. Frontend Changes

### New: `OnboardingPage.jsx`
Route: `/onboarding` — public but redirects to `/` if user already has org.

Layout: same centered card as `LoginPage`. Two tabs/sections:

**Tab 1 — Create Organization:**
- Input: Organization name (required, min 3 chars)
- Button: "Create Organization"
- On success: show `orgCode` in a copyable box with message "Share this code with your team" → then auto-redirect to `/` after 3 seconds

**Tab 2 — Join Organization:**
- Input: Organization code (required, uppercase, format hint `XXXX-XXXX`)
- Button: "Join Organization"  
- On success: redirect to `/`

Both tabs show API error messages inline.

### Modified: `ProtectedRoute.jsx`
Add org check after auth check:
```jsx
// After verifying token exists:
const { organizationId } = decodeToken(token);
if (!organizationId && location.pathname !== '/onboarding') {
  return <Navigate to="/onboarding" replace />;
}
if (organizationId && location.pathname === '/onboarding') {
  return <Navigate to="/" replace />;
}
```

### Modified: `RegisterPage.jsx`
After successful register → redirect to `/onboarding` instead of `/`

### Modified: `Sidebar.jsx`
Show org name in sidebar below the DocMind logo:
```
DocMind
[Org name here]  ← text-xs text-text-muted
```
Read from `useAuth` hook which decodes JWT.

### Modified: `useAuth.js`
Decode `organizationId` and expose it alongside existing fields.

### New route in `App.jsx`
```jsx
<Route path="/onboarding" element={<OnboardingPage />} />
```
No `ProtectedRoute` wrapper — accessible while logged in but without org.

---

## 6. New File Structure

```
server/src/
  models/
    Organization.js              ← NEW
  services/
    OrganizationService.js       ← NEW
  controllers/
    organizationController.js    ← NEW
  routes/
    organizationRoutes.js        ← NEW
  middleware/
    orgMiddleware.js             ← NEW

client/src/
  pages/
    OnboardingPage.jsx           ← NEW
  components/
    layout/
      Sidebar.jsx                ← MODIFY (show org name)
      ProtectedRoute.jsx         ← MODIFY (org check)
  hooks/
    useAuth.js                   ← MODIFY (expose organizationId)
```

---

## 7. Verification Criteria

| Criteria | Expected |
|---|---|
| Register → Onboarding | After register, user lands on `/onboarding` |
| Create org | Org created, user becomes admin, orgCode displayed |
| Join org | User joins org, redirected to home |
| Data isolation | Admin uploads doc → only users in same org see it |
| No org access | User without org hitting `/api/documents` gets 403 |
| Sidebar org name | Org name visible below DocMind logo |
| Existing admin | Existing accounts without org → redirected to onboarding on next login |

---

## 8. Constraints

- A user can only belong to ONE organization — no switching
- `orgCode` is permanent — cannot be changed after creation
- Deleting an organization is out of scope
- Users cannot change their role — only the system sets `admin` on org creation
- `orgCode` comparison must be case-insensitive on join (`code.toUpperCase()`)
- All existing documents/conversations in DB without `organizationId` should be handled gracefully — queries with `{ organizationId }` filter will naturally exclude them

---

