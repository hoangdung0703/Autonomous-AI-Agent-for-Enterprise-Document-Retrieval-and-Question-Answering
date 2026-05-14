# Forgot Password — Implementation Plan
# Archon Project · Awaiting Approval Before Execution

---

## 0. Pre-Execution Checklist

- [ ] All open questions in Section 5 answered
- [ ] `npm install resend --legacy-peer-deps` run from `/server` (SKILL.md: always use --legacy-peer-deps)
- [ ] `RESEND_API_KEY` and `FRONTEND_URL` added to `.env` manually before server restart
- [ ] Resend account created and API key obtained from resend.com

---

## 1. Execution Order (strict — do not reorder)

```
1. server/src/models/User.js               ← add 2 DB fields
2. server/src/config/env.js                ← add 2 env vars
3. server/.env + server/.env.example       ← add RESEND_API_KEY, FRONTEND_URL
4. server/src/services/EmailService.js     ← NEW — Resend wrapper
5. server/src/services/AuthService.js      ← add 2 methods
6. server/src/validators/authValidators.js ← add 2 validator arrays
7. server/src/controllers/authController.js← add 2 HTTP handlers
8. server/src/routes/authRoutes.js         ← add 2 routes
9. client/src/pages/ForgotPasswordPage.jsx ← NEW
10. client/src/pages/ResetPasswordPage.jsx  ← NEW
11. client/src/pages/LoginPage.jsx          ← add forgot-password link
12. client/src/App.jsx                      ← add 2 public routes
```

Rationale: Models before services (services import models), services before controllers (controllers call services), routes last in backend. Frontend pages before App.jsx routing.

---

## 2. Backend Changes

---

### 2.1 `server/src/models/User.js` — MODIFY

**What changes:** Add two optional fields to the Mongoose schema.

**Lines modified:** Insert after the existing `organizationId` field block (before `}, { timestamps: true }`):

```js
resetToken: {
  type: String,
  default: null,
},
resetTokenExpiry: {
  type: Date,
  default: null,
},
```

**No other changes.** Schema already has `timestamps: true` so `createdAt`/`updatedAt` are present.

---

### 2.2 `server/src/config/env.js` — MODIFY

**What changes:** Add 2 new required vars.

**Lines modified:**

1. In `requiredVars` array — append:
   ```js
   'RESEND_API_KEY',
   'FRONTEND_URL'
   ```

2. In the `module.exports` object — append:
   ```js
   RESEND_API_KEY: process.env.RESEND_API_KEY,
   FRONTEND_URL: process.env.FRONTEND_URL,
   ```

**Note:** Adding to `requiredVars` means the server will refuse to start if either is missing. This is intentional — email service is core to this feature.

---

### 2.3 `server/.env` and `server/.env.example` — MODIFY

**What changes:** Add 2 new env var entries.

**Lines to add** (in both files, under the existing vars):
```env
# Email (Resend)
RESEND_API_KEY=your_resend_api_key_here
FRONTEND_URL=http://localhost:5173
```

In `.env`: use real API key value.
In `.env.example`: use placeholder string `your_resend_api_key_here`.

---

### 2.4 `server/src/services/EmailService.js` — NEW FILE

**Purpose:** Single Resend wrapper. All email sending in the project goes through here.

**Full file content:**

```js
const { Resend } = require('resend');
const env = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendPasswordResetEmail(toEmail, resetLink) {
    try {
      await this.resend.emails.send({
        from: 'Archon <onboarding@resend.dev>',
        to: toEmail,
        subject: 'Reset your Archon password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Reset your password</h2>
            <p>You requested a password reset for your Archon account.</p>
            <a href="${resetLink}" style="
              display: inline-block;
              background: #6366f1;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              margin: 16px 0;
            ">Reset Password</a>
            <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });
      logger.info(`[EmailService] Password reset email sent to ${toEmail}`);
    } catch (err) {
      // Log but do not rethrow — email failure must not block API response (per requirements §8)
      logger.error(`[EmailService] Failed to send reset email to ${toEmail}: ${err.message}`);
    }
  }
}

module.exports = new EmailService();
```

**Key decisions:**
- Uses CommonJS `require` (not ESM `import`) — project is CommonJS throughout
- `sendPasswordResetEmail` swallows its own error and logs it — matches requirements constraint that email failure must not block the response
- Singleton export `new EmailService()` — consistent with all other services

---

### 2.5 `server/src/services/AuthService.js` — MODIFY

**What changes:** Add 2 new methods to the existing `AuthService` class. No existing methods change.

**Imports to add** at top of file:
```js
const crypto = require('crypto');
const emailService = require('./EmailService');
const env = require('../config/env');
```
(Note: `bcrypt`, `jwt`, `User`, `env` are already imported — only add what's missing.)

**Method 1: `requestPasswordReset(email)`** — add before the closing `}` of the class:

```js
async requestPasswordReset(email) {
  const user = await User.findOne({ email });

  // Always return without error regardless of whether email exists (prevent enumeration)
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await emailService.sendPasswordResetEmail(user.email, resetLink);
}
```

**Method 2: `resetPassword(token, newPassword)`** — add after `requestPasswordReset`:

```js
async resetPassword(token, newPassword) {
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() }
  });

  if (!user) {
    const err = new Error('Reset link is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();
}
```

---

### 2.6 `server/src/validators/authValidators.js` — MODIFY

**What changes:** Add 2 new validator arrays. Existing `register` and `login` exports unchanged.

**Lines to add** before `module.exports`:

```js
const forgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
];

const resetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
];
```

**`module.exports` line modified** — add new exports:
```js
module.exports = { register, login, forgotPassword, resetPassword };
```

---

### 2.7 `server/src/controllers/authController.js` — MODIFY

**What changes:** Add 2 new handler methods to `AuthController`. Existing `register`, `login`, `refreshToken` unchanged.

**Method 1: `forgotPassword`** — add after `refreshToken`:

```js
async forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    // Always return 200 — do not reveal whether email exists
    res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
}
```

**Method 2: `resetPassword`** — add after `forgotPassword`:

```js
async resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json({ message: 'Password reset successful. Please sign in.' });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
}
```

---

### 2.8 `server/src/routes/authRoutes.js` — MODIFY

**What changes:** Add 2 new public routes + import new validators.

**Import line modified** — add `forgotPassword` and `resetPassword` validators:
```js
const { register, login, forgotPassword, resetPassword } = require('../validators/authValidators');
```

**Routes to add** after the existing `router.get('/refresh-token', ...)` line:

```js
router.post('/forgot-password', authLimiter, validate(forgotPassword), authController.forgotPassword.bind(authController));
router.post('/reset-password', authLimiter, validate(resetPassword), authController.resetPassword.bind(authController));
```

**Note:** `authLimiter` (20 requests / 15 min) applied to both — prevents email spam abuse on forgot-password and brute-force on reset-password. See Open Question #1 if stricter limiting is desired.

---

## 3. Frontend Changes

---

### 3.1 `client/src/pages/ForgotPasswordPage.jsx` — NEW FILE

**Purpose:** Form where user enters email to request a reset link.

**Route:** `/forgot-password` (public, no auth required)

**Style:** MUST copy exact inline styles from `LoginPage.jsx`:
- Outer wrapper: `backgroundColor: '#0a0a0a'` + starfield + dual radial orb divs
- Glass card: `rgba(20,20,28,0.90)` + `backdropFilter: 'blur(24px)'` + border + box-shadow
- Accent top line: gradient fading at both ends
- Logo: `<img src="/logo.png" className="w-10 h-10 mx-auto mb-4" />`
- Input: Mail icon from lucide-react, same styling as LoginPage
- Button: `background: linear-gradient(to right, #6366f1, rgba(99,102,241,0.8))`

**States and JSX logic:**
- `email` — controlled input state
- `isSubmitting` — boolean, disables button + shows "Sending..."
- `error` — string, shown as inline error
- `success` — boolean; when true, replaces form with success message

**Success state UI:**
```
Check your email — a reset link has been sent.
[← Back to Sign In]
```

**Form footer:** `← Back to Sign In` link to `/login` (always visible below form)

**API call:** `POST /api/auth/forgot-password` with `{ email }` via `api.js`

**Imports needed:** `useState`, `Link` from react-router-dom, `Mail` from lucide-react, `api` from `services/api`

---

### 3.2 `client/src/pages/ResetPasswordPage.jsx` — NEW FILE

**Purpose:** Form where user enters new password using token from URL.

**Route:** `/reset-password` (public, no auth required)

**On mount:**
```js
const [searchParams] = useSearchParams();
const token = searchParams.get('token');
// If no token → useEffect redirect to /forgot-password
```

**Style:** Identical inline styles as `ForgotPasswordPage` / `LoginPage`.

**Heading:** "Set new password"

**Fields:**
- New password input — `Lock` icon, `type="password"`
- Confirm password input — `Lock` icon, `type="password"`

**States:**
- `password`, `confirmPassword` — controlled input state
- `isSubmitting` — boolean
- `error` — string (inline error)
- `success` — boolean; when true shows success message + starts 2-second redirect

**Client-side validation (before API call):**
1. `password.length < 6` → "Password must be at least 6 characters"
2. `password !== confirmPassword` → "Passwords do not match"

**Success state:**
```
Password reset! Redirecting to login...
```
Then `useEffect` with `setTimeout(navigate('/login'), 2000)`.

**API call:** `POST /api/auth/reset-password` with `{ token, password }` via `api.js`

**Error mapping:** If API returns 400 → show `err.response?.data?.error` inline

**Imports needed:** `useState`, `useEffect`, `useSearchParams`, `useNavigate` from react-router-dom, `Lock` from lucide-react, `api` from `services/api`

---

### 3.3 `client/src/pages/LoginPage.jsx` — MODIFY

**What changes:** Add one link below the Sign In button.

**Lines modified:** After the closing `</button>` of the submit button, add:

```jsx
<Link
  to="/forgot-password"
  className="text-xs text-text-muted hover:text-text-secondary block text-center mt-2"
>
  Forgot your password?
</Link>
```

**Import line modified:** Add `Link` to the existing react-router-dom import if not already present. Check current imports first — `Link` may already be imported.

---

### 3.4 `client/src/App.jsx` — MODIFY

**What changes:** Import 2 new page components and add 2 public routes.

**Import lines to add:**
```js
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
```

**Routes to add** alongside existing public routes (outside `ProtectedRoute`):
```jsx
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
```
Place after the existing `<Route path="/onboarding" ... />` line.

---

## 4. Package Installation

Run from `/server` directory **before starting the server:**
```bash
npm install resend --legacy-peer-deps
```
(SKILL.md constraint: always `--legacy-peer-deps` due to LangChain peer dep conflicts)

---

## 5. Open Questions — Need Approval Before Executing

### Q1 — Rate limiting on forgot-password
**Issue:** The existing `authLimiter` allows 20 requests per 15 minutes. For forgot-password, this means one IP could trigger 20 reset emails in 15 minutes to arbitrary addresses (email spam vector).

**Options:**
- A) Use existing `authLimiter` (20/15min) — simpler, already imported
- B) Add a dedicated `passwordResetLimiter` (e.g., 5/15min) in `rateLimiter.js` — stricter, one extra file change

**Recommendation:** Option B for production. Option A is acceptable for dev/demo.

---

### Q2 — Reset token: plaintext vs hashed in DB
**Issue:** Requirements store `crypto.randomBytes(32).toString('hex')` directly in `User.resetToken`. If MongoDB is compromised, all active reset tokens are exposed — an attacker could reset any user's password.

**Secure alternative:** Store `sha256(token)` in DB, send raw token in URL. On verification, hash the incoming token before querying.

**Options:**
- A) Store plaintext token (as spec'd) — simpler, matches requirements exactly
- B) Store `sha256(token)` in DB — more secure, 3 extra lines of code

**Recommendation:** Option B. But requires deviation from the requirements spec — needs explicit approval.

---

### Q3 — Email service failure and token state
**Issue:** Requirements say "Email sending failure must NOT block the API response." The plan saves the reset token to DB before attempting to send email. If the email fails, the token is in the DB but the user never received the link.

**Consequence:** The user would see the generic success message, wait for an email that never arrives, and have to request again (which works — new token overwrites old). This is acceptable behavior per the spec.

**Confirming:** No action needed. Just flagging so behavior is understood.

---

### Q4 — `resend` package CommonJS vs ESM
**Issue:** The requirements show ESM syntax (`import { Resend } from 'resend'`). The project uses CommonJS (`require`).

**Resolution:** Plan uses `const { Resend } = require('resend')`.

The `resend` npm package ships both CJS and ESM — CJS works with `require`. **Confirming this is the correct approach.** No approval needed unless the project plans to migrate to ESM.

---

### Q5 — Should `forgotPassword` and `resetPassword` live in `AuthService` or a new `PasswordResetService`?
**Issue:** `AuthService.js` owns "JWT + bcrypt" per the file ownership map. Password reset uses both (`bcrypt` for hashing the new password, `crypto` for the token). It also introduces a new dependency (`EmailService`).

**Options:**
- A) Add to `AuthService.js` — fewer files, existing pattern
- B) Create `PasswordResetService.js` — cleaner separation, consistent with how other services are scoped

**Recommendation:** Option A. The methods are tightly coupled to the auth flow, and keeping them in `AuthService` avoids another singleton export. But both are valid.

---

## 6. Verification Steps

Execute these in order after implementation. Each maps to a criteria in requirements §7.

### Step 1 — Valid email: receive reset email
```
1. Register a test user via POST /api/auth/register
2. POST /api/auth/forgot-password with { "email": "<registered email>" }
3. Expect: 200 { "message": "If this email exists, a reset link has been sent." }
4. Check inbox of the email address — should receive email from onboarding@resend.dev
5. Email should contain a link: http://localhost:5173/reset-password?token=<64-char hex>
6. Verify link expires label says "This link expires in 1 hour"
```

### Step 2 — Invalid email: no info leak
```
1. POST /api/auth/forgot-password with { "email": "notregistered@example.com" }
2. Expect: 200 with IDENTICAL message as Step 1
3. No email should arrive (but response is indistinguishable)
4. No error, no "user not found" in response
```

### Step 3 — Valid token: password reset flow
```
1. Complete Step 1 to get a valid reset link
2. Navigate to http://localhost:5173/reset-password?token=<token>
3. Expect: ResetPasswordPage loads with "Set new password" heading
4. Enter new password (min 6 chars), confirm password matches
5. Submit → expect success message "Password reset! Redirecting to login..."
6. After 2 seconds → auto-redirect to /login
7. Login with NEW password → succeeds
8. Login with OLD password → fails (401)
```

### Step 4 — Expired token: error shown
```
1. Generate a reset token
2. Manually update User in MongoDB: set resetTokenExpiry to a past date
   (use MongoDB Compass or: db.users.updateOne({email}, {$set:{resetTokenExpiry: new Date(0)}}))
3. POST /api/auth/reset-password with that token and a new password
4. Expect: 400 { "error": "Reset link is invalid or has expired" }
5. Frontend: ResetPasswordPage should show this error inline
```

### Step 5 — Used token: one-time use
```
1. Complete Step 3 (successful reset)
2. Re-use the same token: POST /api/auth/reset-password with same token
3. Expect: 400 — token was cleared on first use (resetToken = null)
```

### Step 6 — Client-side password validation
```
1. Navigate to /reset-password?token=anytoken
2. Enter password shorter than 6 chars → submit
3. Expect: client-side error "Password must be at least 6 characters" — NO API call made
4. Enter matching 6+ char passwords in both fields → re-test mismatch:
   Enter "password1" and "password2" → submit
5. Expect: client-side error "Passwords do not match" — NO API call made
```

### Step 7 — No-token redirect
```
1. Navigate to /reset-password (no ?token param)
2. Expect: immediate redirect to /forgot-password
```

### Step 8 — Forgot password link on login page
```
1. Navigate to /login
2. Expect: "Forgot your password?" link visible below Sign In button
3. Click it → navigate to /forgot-password
```

### Step 9 — Rate limit on forgot-password
```
1. POST /api/auth/forgot-password 21+ times in quick succession from same IP
2. Expect: 429 Too Many Requests on the 21st request (authLimiter: 20/15min)
```

---

## 7. Files Summary

| File | Action | Layer |
|---|---|---|
| `server/src/models/User.js` | Modify — add `resetToken`, `resetTokenExpiry` fields | Model |
| `server/src/config/env.js` | Modify — add `RESEND_API_KEY`, `FRONTEND_URL` | Config |
| `server/.env` | Modify — add 2 env var values | Config |
| `server/.env.example` | Modify — add 2 env var placeholders | Config |
| `server/src/services/EmailService.js` | **Create new** — Resend wrapper | Service |
| `server/src/services/AuthService.js` | Modify — add `requestPasswordReset`, `resetPassword` | Service |
| `server/src/validators/authValidators.js` | Modify — add `forgotPassword`, `resetPassword` validators | Validator |
| `server/src/controllers/authController.js` | Modify — add `forgotPassword`, `resetPassword` handlers | Controller |
| `server/src/routes/authRoutes.js` | Modify — add 2 new POST routes | Route |
| `client/src/pages/ForgotPasswordPage.jsx` | **Create new** — email entry form | Frontend |
| `client/src/pages/ResetPasswordPage.jsx` | **Create new** — new password form | Frontend |
| `client/src/pages/LoginPage.jsx` | Modify — add "Forgot your password?" link | Frontend |
| `client/src/App.jsx` | Modify — add 2 public routes | Frontend |

**Total: 13 files** (4 new, 9 modified)

---

*Plan generated from: `forgot-password-requirements.md`, `SKILL.md`, and current codebase state.*
*Status: AWAITING APPROVAL — do not execute until open questions in Section 5 are resolved.*
