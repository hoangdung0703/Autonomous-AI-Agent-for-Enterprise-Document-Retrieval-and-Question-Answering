# invite-code-requirements.md
# DocMind — Invite Code Feature
# Read alongside requirements.md, organization-requirements.md, join-request-requirements.md, and SKILL.md before executing any task.

---

## 1. Feature Overview

Admins generate time-limited, usage-capped invite codes to share with teammates. Users enter an invite code on the Onboarding page to submit a join request. A code expires when EITHER its expiry time is reached OR its usage count hits the maximum — whichever comes first. Admins can also manually deactivate a code at any time.

**Code format:** `XXXXXX` — 6 uppercase alphanumeric chars, no prefix, no hyphen. Same generation pattern as orgCode: `crypto.randomBytes(3).toString('hex').toUpperCase()`

---

## 2. Data Model

### New: `InviteCode` Mongoose Model
```js
{
  code:           { type: String, required: true, unique: true, uppercase: true },
  organizationId: { type: ObjectId, ref: 'Organization', required: true },
  createdBy:      { type: ObjectId, ref: 'User', required: true },
  expiresAt:      { type: Date, required: true },
  maxUsage:       { type: Number, required: true, min: 1, max: 100, default: 10 },
  usageCount:     { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now }
}
```

**Expiry options admin can choose:**
- 1 hour, 6 hours, 24 hours, 7 days, 30 days

**A code is considered VALID if ALL of the following are true:**
- `isActive === true`
- `expiresAt > Date.now()`
- `usageCount < maxUsage`

### Modified: `JoinRequestService.submitRequest()`
Replace `orgCode` lookup with `inviteCode` lookup:
- Find `InviteCode` by `code.toUpperCase()` — throw 404 `"Invite code not found"`
- Validate code is still valid (active + not expired + not maxed out) — throw 400 `"Invite code has expired or reached its usage limit"`
- Get `organizationId` from the invite code
- Increment `inviteCode.usageCount += 1` and save
- Create `JoinRequest` with the org's `organizationId`

### Remove dependency on orgCode for joining
- `OnboardingPage` Join tab now asks for **invite code** instead of org code
- Users never see or enter the org's permanent `code` — that's for admin reference only

---

## 3. API Endpoints

### Invite Codes (admin only)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/invite-codes` | admin + org | Generate new invite code |
| GET | `/api/invite-codes` | admin + org | List all invite codes for org |
| PATCH | `/api/invite-codes/:id/deactivate` | admin + org | Manually deactivate a code |
| DELETE | `/api/invite-codes/:id` | admin + org | Delete a code permanently |

### Modified: `POST /api/join-requests`
Body changes from `{ orgCode }` to `{ inviteCode }` — no auth change, still authMiddleware only.

---

## 4. Backend Implementation

### `InviteCodeService.js`

**`generateCode({ adminId, organizationId, expiryHours, maxUsage })`**
1. Validate `expiryHours` is one of: `[1, 6, 24, 168, 720]` (1h, 6h, 24h, 7d, 30d)
2. Validate `maxUsage` between 1-100
3. Generate unique code: loop `crypto.randomBytes(3).toString('hex').toUpperCase()` until no collision
4. Create and return `InviteCode` document

**`listCodes(organizationId)`**
- Find all codes for org, sort by `createdAt: -1`
- Populate `createdBy` with `{ name }`
- Return array with computed `isExpired` and `isExhausted` flags:
  ```js
  codes.map(c => ({
    ...c.toObject(),
    isExpired: c.expiresAt < new Date(),
    isExhausted: c.usageCount >= c.maxUsage,
    isValid: c.isActive && c.expiresAt > new Date() && c.usageCount < c.maxUsage
  }))
  ```

**`deactivateCode({ codeId, organizationId })`**
- Find code, verify it belongs to org, set `isActive = false`

**`deleteCode({ codeId, organizationId })`**
- Find code, verify it belongs to org, delete

### Modified: `JoinRequestService.submitRequest()`
```js
async submitRequest({ userId, inviteCode }) {
  // 1. Find invite code
  const invite = await InviteCode.findOne({ code: inviteCode.toUpperCase() });
  if (!invite) throw { status: 404, message: 'Invite code not found' };

  // 2. Validate
  const now = new Date();
  if (!invite.isActive || invite.expiresAt < now || invite.usageCount >= invite.maxUsage) {
    throw { status: 400, message: 'Invite code has expired or reached its usage limit' };
  }

  // 3. Check user has no org
  const user = await User.findById(userId);
  if (user.organizationId) throw { status: 400, message: 'You are already in an organization' };

  // 4. Check no existing pending request
  const existing = await JoinRequest.findOne({ userId, status: 'pending' });
  if (existing) throw { status: 400, message: 'You already have a pending request' };

  // 5. Increment usage
  invite.usageCount += 1;
  await invite.save();

  // 6. Create request
  const request = await JoinRequest.create({ userId, organizationId: invite.organizationId });
  return { request, organization: await Organization.findById(invite.organizationId, 'name') };
}
```

### `inviteCodeController.js`
Four thin handlers: `generate`, `list`, `deactivate`, `remove`.

### `inviteCodeRoutes.js`
```
POST   /api/invite-codes              → generate    (authMiddleware, adminMiddleware, orgMiddleware)
GET    /api/invite-codes              → list        (authMiddleware, adminMiddleware, orgMiddleware)
PATCH  /api/invite-codes/:id/deactivate → deactivate (authMiddleware, adminMiddleware, orgMiddleware)
DELETE /api/invite-codes/:id          → remove      (authMiddleware, adminMiddleware, orgMiddleware)
```

### `app.js`
Add: `app.use('/api/invite-codes', inviteCodeRoutes)`

---

## 5. Frontend Changes

### Modified: `OnboardingPage.jsx` — Join tab
- Change label from "Organization Code" to "Invite Code"
- Change placeholder from `XXXXXX` to `Enter invite code`
- Change API call from `POST /api/join-requests` with `{ orgCode }` to `{ inviteCode }`
- Error messages remain the same structure

### New: `InviteCodesTab.jsx` — `client/src/components/dashboard/InviteCodesTab.jsx`
Admin-only tab in Dashboard for managing invite codes.

**Generate section (top):**
```
┌─────────────────────────────────────────────┐
│  Generate Invite Code                       │
│                                             │
│  Expires in: [1h] [6h] [24h] [7d] [30d]    │
│  Max uses:   [____10____]  (1-100)          │
│                                             │
│  [Generate Code]                            │
└─────────────────────────────────────────────┘
```
- Expiry options as toggle buttons, default `24h`
- Max uses as number input, default `10`
- On success: new code appears at top of list with a **copy button**

**Code list (below):**
Table with columns: Code, Status, Uses, Expires, Created By, Actions

| Column | Details |
|---|---|
| Code | `font-mono` + copy icon button |
| Status | Badge: `Valid` (green) / `Expired` (red) / `Exhausted` (amber) / `Deactivated` (gray) |
| Uses | `{usageCount} / {maxUsage}` |
| Expires | Relative time: "in 23h", "2 days ago" |
| Created By | Admin name |
| Actions | `[Deactivate]` (ghost, only if valid) + `[Delete]` (danger) |

### Modified: `DashboardPage.jsx`
Add third tab: `Invite Codes` (admin only):
```
[Documents] [Member Requests] [Invite Codes]
```

### New hook: `useInviteCodes.js`
- State: `codes`, `loading`
- `fetchCodes()` — `GET /api/invite-codes`
- `generateCode(expiryHours, maxUsage)` — `POST /api/invite-codes`, prepends to state
- `deactivateCode(id)` — `PATCH`, updates status in state
- `deleteCode(id)` — `DELETE`, removes from state

---

## 6. New File Structure

```
server/src/
  models/
    InviteCode.js                    ← NEW
  services/
    InviteCodeService.js             ← NEW
  controllers/
    inviteCodeController.js          ← NEW
  routes/
    inviteCodeRoutes.js              ← NEW

server/src/services/
  JoinRequestService.js              ← MODIFY (inviteCode lookup)

client/src/
  hooks/
    useInviteCodes.js                ← NEW
  components/
    dashboard/
      InviteCodesTab.jsx             ← NEW
  pages/
    DashboardPage.jsx                ← MODIFY (add Invite Codes tab)
    OnboardingPage.jsx               ← MODIFY (inviteCode field)
```

---

## 7. Verification Criteria

| Criteria | Expected |
|---|---|
| Generate code | Admin sets expiry + maxUsage → code appears in list with copy button |
| Valid code | User enters valid invite code → Waiting Screen shows org name |
| Expired code | User enters expired code → "Invite code has expired or reached its usage limit" |
| Exhausted code | After maxUsage requests → same error message |
| Deactivated code | Admin deactivates → same error message |
| Delete code | Code removed from list |
| Status badges | Correct badge shown for each state |
| Usage counter | Each join request increments `usageCount` in list |

---

## 8. Constraints

- `expiryHours` must be one of `[1, 6, 24, 168, 720]` — validated server-side
- `maxUsage` must be 1-100 — validated server-side
- Incrementing `usageCount` happens BEFORE creating the JoinRequest — if request creation fails, usage is still counted (acceptable tradeoff, avoid complex transactions)
- Deactivated codes cannot be reactivated — delete and regenerate instead
- A deleted code cannot be recovered
- Invite codes are org-scoped — admin cannot see or manage another org's codes

---

*Last updated: 2026 — Nguyễn Hoàng Dũng — FPT Smart Cloud Internship Project*