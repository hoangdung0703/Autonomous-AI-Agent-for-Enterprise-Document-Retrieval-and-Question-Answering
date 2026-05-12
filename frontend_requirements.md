Archon — Frontend Design System & Component Specifications
Read this alongside requirements.md before writing any frontend code.

1. Design Philosophy
Inspiration: ChatGPT / Claude — chat-first layout with sidebar navigation.
Mode: Dark mode only. No light mode toggle.
Aesthetic: Professional, minimal, dense. Similar to Linear.app and Vercel Dashboard.
No gradients, no glassmorphism, no drop shadows everywhere — restraint is the point.
Every element should feel intentional.

2. Color Palette (Tailwind CSS custom config)
Extend tailwind.config.js with these exact tokens:
jscolors: {
  background: {
    primary:   '#0a0a0a',   // main page background
    secondary: '#111111',   // sidebar, panels
    elevated:  '#1a1a1a',   // cards, modals, input fields
    hover:     '#222222',   // hover states
  },
  border: {
    subtle:  '#2a2a2a',     // default borders
    default: '#3a3a3a',     // focused borders
    strong:  '#555555',     // active/selected borders
  },
  text: {
    primary:   '#f5f5f5',   // headings, important text
    secondary: '#a3a3a3',   // labels, metadata
    muted:     '#666666',   // placeholders, disabled
  },
  accent: {
    DEFAULT: '#6366f1',     // indigo — primary CTA, active states
    hover:   '#4f46e5',     // darker on hover
    subtle:  '#1e1b4b',     // accent background tint
  },
  status: {
    ready:      '#22c55e',  // green
    processing: '#f59e0b',  // amber
    failed:     '#ef4444',  // red
    ready_bg:       '#052e16',
    processing_bg:  '#451a03',
    failed_bg:      '#450a0a',
  }
}

3. Typography
jsfontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
}
Load Inter from Google Fonts in index.html. Use font-mono for file names, chunk indices, and code snippets.
Scale:

Page titles: text-xl font-semibold text-text-primary
Section headers: text-sm font-medium text-text-secondary uppercase tracking-wider
Body: text-sm text-text-primary
Metadata / labels: text-xs text-text-muted


4. Layout — App Shell
Replicate the ChatGPT/Claude sidebar layout:
┌─────────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main Content Area        │
│                         │                           │
│  [Logo + App Name]      │  <Page content here>      │
│                         │                           │
│  Navigation:            │                           │
│  > Chat                 │                           │
│  > Documents (admin)    │                           │
│                         │                           │
│  ─────────────────      │                           │
│  [User info + logout]   │                           │
└─────────────────────────────────────────────────────┘

Sidebar background: bg-background-secondary
Main area background: bg-background-primary
Sidebar border right: border-r border-border-subtle
No top navbar — sidebar handles all navigation


5. Component Specifications
5.1 Sidebar

Logo: simple text "Archon" in text-text-primary font-semibold with a small indigo square icon prefix
Nav items: text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover with rounded-md px-3 py-2
Active nav item: bg-accent-subtle text-accent border-l-2 border-accent
Bottom section: user email truncated + logout button in text-text-muted hover:text-text-primary

5.2 LoginPage

Centered card on bg-background-primary, card width max-w-sm
Card: bg-background-elevated border border-border-subtle rounded-xl p-8
Title: "Welcome to Archon" — text-xl font-semibold
Subtitle: "Sign in to continue" — text-sm text-text-secondary
Input fields: bg-background-primary border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-border-default focus:outline-none
Submit button: full width, bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium
Error state: red border on input + text-xs text-status-failed below field

5.3 ChatPage (primary view)
Layout identical to Claude.ai:

Messages area: scrollable, flex-1 overflow-y-auto px-4 py-6 space-y-6
Input area: fixed at bottom, border-t border-border-subtle bg-background-primary p-4
Input box: bg-background-elevated border border-border-subtle rounded-xl px-4 py-3 resize-none — auto-expand up to 5 lines
Send button: icon button (arrow up), bg-accent hover:bg-accent-hover rounded-lg p-2

Message bubbles:

User message: right-aligned, bg-accent-subtle border border-accent/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%] ml-auto
Assistant message: left-aligned, no bubble background — just text with subtle left padding, max-w-[80%]
Assistant avatar: small indigo circle with "D" (Archon) — w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs text-white

Source citations:

Collapsed by default under each assistant message
Toggle: text-xs text-text-muted hover:text-text-secondary — "Show 5 sources ›"
Expanded: list of font-mono text-xs text-text-muted bg-background-elevated rounded px-2 py-1 chips showing fileName (chunk #N)
Truncate long file names with truncate max-w-xs

Loading state:

Three animated dots (typing indicator) while waiting for response
Implement with Tailwind animate-bounce on 3 dots with staggered animation-delay

5.4 DashboardPage (admin)
Two-column layout on desktop, stacked on mobile:

Left column (40%): UploadForm
Right column (60%): DocumentList

UploadForm:

Drag-and-drop zone: border-2 border-dashed border-border-default rounded-xl p-8 text-center hover:border-accent transition-colors
Shows file icon + "Drag PDF, DOCX, or XLSX here" + "or click to browse"
Selected file: shows file name + size, green checkmark icon
Upload button: bg-accent hover:bg-accent-hover — disabled + spinner while uploading
Progress: simple text "Uploading..." with animated spinner

DocumentList:

Table with columns: Name, Status, Chunks, Uploaded, Actions
Status badge: text-xs font-medium px-2 py-0.5 rounded-full with color from status tokens
File name: font-mono text-xs text-text-secondary truncate max-w-[200px]
Delete button: icon button (trash), text-text-muted hover:text-status-failed — shows confirmation tooltip on hover
Empty state: centered illustration placeholder + "No documents uploaded yet"
Auto-refresh every 3s for processing documents — stops when all are ready or failed


6. Motion & Transitions
Use these consistently — do not add more:
css/* All interactive elements */
transition-colors duration-150

/* Page/panel transitions */
transition-opacity duration-200

/* Sidebar nav active indicator */
transition-all duration-150

/* Message appearance */
animate-fade-in — implement as custom Tailwind animation:
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: fadeIn 200ms ease-out;
Add fadeIn to tailwind.config.js under theme.extend.animation and theme.extend.keyframes.
Loading states:

Buttons: replace text with <svg> spinner (animate-spin) + keep button width stable using min-w
Document list: skeleton rows (3 placeholder rows) on initial load — bg-background-elevated animate-pulse rounded
Chat: typing indicator dots while awaiting response


7. Iconography
Use lucide-react exclusively. Install: npm install lucide-react
Key icons:

Send: <Send size={16} />
Upload: <Upload size={16} />
Delete: <Trash2 size={16} />
Document: <FileText size={16} />
Logout: <LogOut size={16} />
Chat: <MessageSquare size={16} />
Dashboard: <LayoutDashboard size={16} />
Loading spinner: custom SVG animate-spin (lucide has <Loader2>)
Chevron for source toggle: <ChevronDown size={12} />


8. Responsive Behavior

Desktop (≥1024px): sidebar visible, two-column dashboard
Tablet (768–1023px): sidebar hidden behind hamburger menu
Mobile (<768px): single column, bottom sheet for upload form

Implement mobile sidebar as a slide-in overlay with translate-x transition.

9. File Structure
client/src/
  components/
    layout/
      Sidebar.jsx
      AppShell.jsx
      ProtectedRoute.jsx
    chat/
      ChatWindow.jsx
      MessageBubble.jsx
      ChatInput.jsx
      SourceCitations.jsx
      TypingIndicator.jsx
    documents/
      DocumentList.jsx
      UploadForm.jsx
      StatusBadge.jsx
    ui/
      Button.jsx          # reusable button with loading state
      Input.jsx           # reusable input with error state
      Spinner.jsx
      SkeletonRow.jsx
  pages/
    LoginPage.jsx
    ChatPage.jsx
    DashboardPage.jsx
  services/
    api.js
  hooks/
    useAuth.js            # read/write token, get current user
    useDocuments.js       # fetch + polling logic
    useChat.js            # chat state + send message
  main.jsx
  App.jsx

10. Reusable UI Components
Button.jsx
jsx// Props: variant ('primary' | 'ghost' | 'danger'), size ('sm' | 'md'), loading, disabled, children
// Primary: bg-accent hover:bg-accent-hover
// Ghost: bg-transparent hover:bg-background-hover border border-border-subtle
// Danger: bg-transparent hover:bg-status-failed_bg text-status-failed
// Loading: show <Loader2 animate-spin> replacing children, keep width stable
Input.jsx
jsx// Props: label, error, placeholder, type, ...rest
// Shows label above, error message below in text-status-failed

11. Key UX Behaviors

Token expiry: if API returns 401, clear localStorage and redirect to /login
Optimistic delete: remove document from list immediately on delete click, restore on error
Auto-scroll: chat messages area auto-scrolls to bottom on new message
Empty chat state: centered "Ask anything about your documents" with subtle icon — disappears when first message is sent
Disabled input: chat input + send button disabled while response is loading
File validation: client-side check before upload — reject files not PDF/DOCX/XLSX and >10MB, show inline error