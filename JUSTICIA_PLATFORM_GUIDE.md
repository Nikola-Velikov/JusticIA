# JusticIA Platform Guide
_Last updated: 2025-11-13_

## 1. Product Overview
JusticIA is a bilingual (Bulgarian-facing) AI companion for legal research. The product pairs a modern React + Vite single-page application with an Express + MongoDB API. End-users can authenticate, spin up contextual chat threads, review cited sources, and organize conversations into cases (folders). This guide consolidates the current architecture, flows, and deployment details that evolved during the latest development sprint.

Key functionality at a glance:
- Secure email + password onboarding backed by JWTs.
- Rich chat workspace with sidebar navigation, editable prompts, stop-and-resend controls, and Markdown rendering.
- Source transparency via a dedicated panel that reads structured metadata from backend responses.
- Case management (lightweight CRMs for conversations) that keeps chats uniquely assigned.
- A marketing landing page that routes visitors toward the chat experience or highlights product value.

## 2. Repository Map
| Path | Purpose |
| --- | --- |
| `src/` | React application (pages, hooks, components, shadcn UI wrappers). |
| `server-side/` | Express + TypeScript API with controllers, services, and Mongoose models. |
| `public/`, `dist/` | Frontend static assets and build output. |
| `supabase/` | Placeholder for infra experiments (not tied to the current flow). |
| `README.md`, `server-side/README.md` | Legacy setup notes now superseded by this document. |

## 3. Frontend (React + Vite)

### 3.1 Tech stack
- React 18 + TypeScript bundled with Vite.
- Tailwind CSS with shadcn/ui primitives (Radix-based) for consistent styling.
- React Router v6 for navigation guarded by custom route wrappers.
- TanStack Query (QueryClient is ready for future data fetching) plus a lightweight REST helper.
- React Markdown for assistant replies and lucide-react for iconography.
- Radix Toast/Sonner plus the `useToast` hook for localized notifications.

### 3.2 Routing and layout
- `src/App.tsx` registers global providers (QueryClientProvider, TooltipProvider, toasters) and declares routes:
  - `/` → `Landing`.
  - `/chat` → protected `Index` workspace (`ProtectedRoute` in `src/routes/guards.tsx` checks for a token in `localStorage` and redirects guests to `/login`).
  - `/login` and `/signup` → wrapped in `GuestRoute`, which short-circuits authenticated visitors back to `/chat`.
  - Catch-all `*` → `NotFound`.
- `Header` (`src/components/Header.tsx`) is reused on landing, auth, and workspace views and manages section-aware navigation, mobile sheet toggles, and user menus.

### 3.3 Authentication UX
- `src/pages/Login.tsx` and `src/pages/Signup.tsx` post to `/auth/login` or `/auth/signup` via `apiPost`. Successful responses store the JWT under `localStorage.token`, show a localized toast, reset the cached chat id, and navigate to `/chat`.
- Toast copy is localized to Bulgarian, while layouts remain responsive and theme-aware.
- `ProtectedRoute` and `GuestRoute` rely solely on `localStorage`, so clearing the token logs users out instantly.

### 3.4 Chat workspace (`src/pages/Index.tsx`)
- Wraps the experience in `SidebarProvider` and `ResizablePanelGroup` for flexible layouts. `Sheet` exposes the sources panel on smaller viewports so the main column stays uncluttered.
- When `/chat` loads, the page:
  1. Confirms the token (calls `/auth/me`). Invalid tokens are purged and the user is redirected to `/login`.
  2. Creates one fresh chat per navigation entry (tracked via `sessionStorage` key `createdFor:<historyKey>`) to ensure the composer is always ready.
  3. Restores the previously active chat id from `localStorage.lastChatId` when possible, otherwise picks the most recent chat returned by the API.
  4. Tracks the edit state. If the user leaves a chat mid-edit, `discardMessage` removes the half-finished pair before switching.

#### 3.4.1 `useChat` hook (`src/hooks/useChat.ts`)
- Centralizes chat data in React state: `chats`, `messages`, `currentChatId`, and the id that is currently streaming (`loadingChatId`).
- Persists metadata in storage:
  - `lastChatId` to reopen the same thread after reloads.
  - `emptyChatId` so blank auto-created chats can be deleted if the user never sends a message.
  - `sessionStorage.newChatOnNextVisit` toggled by the guest guard and auth screens.
- Message sending:
  - Creates a local placeholder user message immediately, then posts to `/chats/:id/messages/send`.
  - Uses `AbortController` to support the "Stop" button. If the controller is aborted, the UI stays in a consistent state.
  - After a successful response, replaces the placeholder with the persisted record and appends the assistant reply plus metadata (sources, matches, indices).
  - If the user is editing the very first prompt in a chat, the hook refreshes the sidebar list so that titles stay in sync.
- Editing (`editLastMessage`):
  - Only the most recent user message can be edited (mirrors backend limitations). The hook removes the old pair from UI, posts to `/chats/:id/messages/edit`, and swaps in the regenerated pair upon success. Non-persisted (temporary) messages are simply resent as new prompts.
- Deletion:
  - `deleteChat` clears a chat remotely and locally, then opens the newest available chat.
  - `discardMessage` removes a user/assistant pair in place, calls `/chats/:id/messages/:messageId` when needed, and deletes the chat entirely if it becomes empty.
  - When switching away from an empty chat, the hook proactively deletes it to avoid clutter.

#### 3.4.2 `ChatArea` (`src/components/ChatArea.tsx`)
- Renders the conversation list with avatars for the assistant (`Bot` icon) and the authenticated user (initials or the default `User` icon).
- Implements a typing animation for the latest assistant message via a `typedMap` ref, which creates about 80 incremental steps for smoother playback.
- Supports Markdown for assistant output (`ReactMarkdown` inside a prose container).
- Actions:
  - Copy buttons exist for both user and assistant messages.
  - User messages include an Edit icon; triggering it stops any inflight request, loads the content into the textarea, and notifies the `Index` page through `onEditingChange`.
  - The footer houses a disabled file-upload button (UI placeholder for future document ingestion), a `Stop` button that appears during streaming, and the main `Send` button (disabled while streaming unless editing).
  - Keyboard shortcuts: `Enter` submits, `Shift+Enter` inserts a newline (hint shown under the textarea).

#### 3.4.3 `ChatSidebar` (`src/components/ChatSidebar.tsx`)
- A collapsible shadcn `Sidebar` listing chats and cases. It tracks search queries, collapsed state, and per-case expansion in component state.
- Case management:
  - Fetches `/cases` on mount.
  - Allows creating, renaming, and deleting cases through dialogs that call `/cases`, `/cases/:id`, and `DELETE /cases/:id`.
  - Ensures a chat can belong to only one case at a time. Adding a chat to a case first removes it from all other cases (backend enforcement), and the UI mirrors that behavior.
  - Offers contextual menus per case and per chat entry for assignment/removal as well as permanent chat deletion (delegates to `onDeleteChat` from `useChat`).
- General chat list:
  - Shows unclassified chats separately, sorted by recency with a helper that formats timestamps (minutes, hours, days ago).
  - Keeps the active chat scrolled into view via refs.
  - Presents login/register CTAs when no user is present; otherwise shows the user block with a logout button.
  - Provides quick-access buttons when the sidebar is collapsed (up to three most recent chats plus auth shortcuts).

#### 3.4.4 `SourcesPanel` (`src/components/SourcesPanel.tsx`)
- Reads assistant messages with `metadata.sources` and `metadata.matches` and spreads the matches evenly across listed sources so each citation preview can show related excerpts.
- Displays cards in a scrollable column; clicking a source opens a Radix dialog with:
  - The source title, index (URL or citation string), and timestamp of the originating assistant reply.
  - A CTA to open the original link in a new tab (when the index is a URL).
  - A copy button that concatenates all matches for quick sharing.
- When no sources are present yet, the panel shows contextual empty states (one for "waiting for first answer," another for "assistant answered without sources").
- On mobile, the `Index` page renders the panel inside a `Sheet` and toggles it via the header's "Sources" button.

### 3.5 Landing and marketing surfaces
- `src/pages/Landing.tsx` composes multiple sections (`hero`, `features`, `how-it-works`, `benefits`, `testimonials`, `pricing`, `cta`) with large imagery, iconography, and Bulgarian marketing copy.
- Smooth scrolling is driven by both `Header` navigation and `useLocation` hash lookups so deep links such as `/#pricing` land on the right block.
- The hero CTA routes authenticated users straight to `/chat` while guests go to `/signup`.

### 3.6 Utilities and UX helpers
- `src/lib/api.ts` attaches the `VITE_API_BASE_URL` prefix, injects the bearer token, and normalizes server errors (mapping common English backend strings to Bulgarian-friendly phrases via `userError`).
- `src/components/AuthModals.tsx` (not currently mounted) hosts modal versions of login/signup in case inline auth is reintroduced later.
- Toasts (`useToast`, `components/ui/toaster`, `components/ui/sonner`) surface both optimistic success messages and destructive alerts.

## 4. Backend (Express + MongoDB)

### 4.1 App and configuration
- Entry points live in `server-side/src/server.ts` and `server-side/src/app.ts`. `server.ts` connects to Mongo via `connectDB` before starting the HTTP listener, while `app.ts` sets up middleware (`helmet` for security headers, JSON body parser capped at 1 MB, `cors` with `env.CORS_ORIGIN`, and `morgan` logging).
- Environment configuration is centralized in `server-side/src/config/env.ts`; variables load through `dotenv` so both development and production builds share a single source of truth.
- `env.GENERATE_URL` defaults to `https://web-production-d8499.up.railway.app/generate`, which the chat service hits for AI completions.

### 4.2 Data models (`server-side/src/models`)
- `User`: `{ email, passwordHash }` with automatic timestamps; passwords are hashed via `bcryptjs`.
  - Additional fields can be added later (name, roles).
- `Chat`: `{ userId, title }` plus timestamps and an index on `{ userId, createdAt }`. Titles default to a placeholder until the first message snippet overwrites them.
- `Message`: `{ chatId, role, content, metadata }`. Metadata is loosely typed so the generator can attach arbitrary JSON (term, indices, sources, matches, results_count).
- `Case`: `{ userId, name, chatIds[] }`. Chat references are stored as ObjectIds; the service maintains single-case membership.

### 4.3 Services and controllers
- Auth (`src/services/authService.ts`, `src/controllers/authController.ts`):
  - `signup` rejects duplicate emails, hashes passwords, creates users, and returns a JWT valid for 7 days.
  - `login` validates credentials and mirrors the response shape. Both controllers rely on `validateBody` with a Zod schema.
  - `GET /auth/me` simply echoes `req.user` as populated by the `requireAuth` middleware.
- Chat (`src/services/chatService.ts`, `src/controllers/chatController.ts`):
  - `listChats`, `createChat`, and `deleteChat` expose CRUD for the sidebar.
  - `listMessages` streams the ordered conversation history.
  - `addUserAndAssistantMessage` inserts the user message, optionally updates the chat title (first 50 characters of the opening prompt), attempts to reuse a cached assistant reply when the same question appeared earlier, and finally calls the external generator. Failed upstream calls fall back to a localized generic summary so the UI never breaks.
  - `editAndResend` enforces that only the latest user message can be edited, deletes the subsequent assistant reply, and reuses cached answers when possible before calling the generator again.
  - `deleteSingleMessage` removes the target message and its pair (user plus assistant). When a chat becomes empty, it deletes the chat document as well.
- Case (`src/services/caseService.ts`, `src/controllers/caseController.ts`):
  - Provides list/create/rename/delete plus assignment helpers.
  - When adding a chat to a case, the service first `$pull`s the chat id from every case belonging to the user, guaranteeing uniqueness.

### 4.4 REST endpoints
All routes are mounted under `/api`. Auth routes are open; everything else uses `requireAuth`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Returns `{ "status": "ok" }` for deploy checks. |
| POST | `/api/auth/signup` | Registers a user; body `{ email, password }`. |
| POST | `/api/auth/login` | Authenticates and returns `{ token, user }`. |
| GET | `/api/auth/me` | Returns `{ user }` for the current JWT. |
| GET | `/api/chats` | Lists chats owned by the user. |
| POST | `/api/chats` | Creates a new chat; optional `{ title }`. |
| DELETE | `/api/chats/:id` | Deletes a chat and its messages. |
| GET | `/api/chats/:id/messages` | Lists ordered messages for a chat. |
| POST | `/api/chats/:id/messages/send` | Adds a user plus assistant pair; body `{ content }`. |
| POST | `/api/chats/:id/messages/edit` | Rewrites the latest user prompt; body `{ messageId, content }`. |
| DELETE | `/api/chats/:id/messages/:messageId` | Removes a single message (and its pair). |
| GET | `/api/cases` | Lists cases with chat memberships. |
| POST | `/api/cases` | Creates a case `{ name }`. |
| PATCH | `/api/cases/:id` | Renames a case `{ name }`. |
| DELETE | `/api/cases/:id` | Deletes a case. |
| POST | `/api/cases/:id/chats` | Adds `{ chatId }` to the case. |
| DELETE | `/api/cases/:id/chats/:chatId` | Removes a chat from the case. |

### 4.5 Middleware and errors
- `requireAuth` (`server-side/src/middlewares/auth.ts`) expects `Authorization: Bearer <token>`; it gracefully lets CORS `OPTIONS` traffic through. Invalid or missing tokens yield a 401 `ApiError`.
- `validateBody` wraps Zod schemas and populates `req.validatedBody` to keep controllers lean.
- `errorHandler` converts thrown `ApiError`s to JSON, while logging unexpected failures. The `notFound` middleware covers unmatched routes.

### 4.6 External generator contract
- Each send/edit call issues `POST env.GENERATE_URL` with `{ question: string }`.
- The expected response payload resembles:

```json
{
  "summary": "string",
  "term": "string",
  "indices": ["string"],
  "sources": [{ "index": "string", "title": "string" }],
  "matches": ["string"],
  "results_count": 0
}
```

- The server stores the `summary` as the assistant `content` and the rest under `metadata`. Even if upstream errors occur, the service synthesizes a fallback summary and stores empty arrays so the client can still render the message without special cases.

## 5. Chat lifecycle (end-to-end)
1. The landing or auth screen sets `sessionStorage.newChatOnNextVisit` when routing the user to `/chat`.
2. `Index` verifies `/auth/me`, then either reuses the stored chat id or calls `POST /api/chats` (forced once per navigation history entry).
3. When the user submits text, `useChat` optimistically appends a user message and calls `/api/chats/:id/messages/send`.
4. The API writes the user message, updates the chat title if needed, and attempts to reuse a cached answer before contacting the external generator.
5. Once the assistant message is persisted, the API responds with `{ userMessage, assistantMessage }`.
6. `useChat` replaces the placeholder, appends the assistant reply, and sets `localStorage.lastChatId`.
7. `SourcesPanel` now has access to `assistantMessage.metadata`, making citations available for the slide-over panel.
8. If the user presses "Stop," the frontend aborts the fetch; the backend receives an `AbortError` and the hook resets the loading state without appending an assistant reply.
9. Editing or deleting messages uses the same channel with extra guardrails (latest user message only, pair deletions).

## 6. Cases and knowledge organization
- Cases act like folders visible in the sidebar. Each case document owns a set of `chatIds`.
- Frontend UX:
  - Creating or renaming a case opens a dialog; success triggers a reload via `loadCases`.
  - Case rows have menus to assign existing chats (via modal) or remove them. Assignment forms also expose a dropdown of available chats.
  - Cases can be collapsed individually to keep the sidebar tidy, and the entire section can be toggled with the `Folder` controls at the top.
- Backend enforcement:
  - `addChatToCase` first confirms that the chat belongs to the authenticated user, then purges the id from every other case before `$addToSet` on the target.
  - Removing a chat simply `$pull`s the reference; chats themselves are left intact.

## 7. Sources and citation UX
- The backend stores generator metadata verbatim under `Message.metadata`. The structure currently includes: `term`, `indices` (raw identifiers or URLs), `sources` (title plus index), `matches` (snippets), and `results_count`.
- `SourcesPanel` groups `matches` evenly per source so each citation preview can show a relevant excerpt.
- Clicking a source opens a dialog where the user can:
  - Follow the citation link in a new tab (if the index is a valid URL; otherwise it is shown as copyable text).
  - Copy the highlighted excerpts to the clipboard (with a graceful fallback for browsers that block `navigator.clipboard`).
- When no assistant replies exist yet, the panel explains how to trigger the first answer. When replies exist but `metadata.sources` is empty, it hints that the generator returned a summary without citations.

## 8. Deployment and environment

### 8.1 Environment variables
Frontend (`.env`, see `.env.example`):
- `VITE_API_BASE_URL` → e.g. `https://<backend>.railway.app`.

Backend (`server-side/.env`, see `server-side/.env.example`):
- `NODE_ENV` - `production` in deployed envs.
- `PORT` - default `8080` (Railway injects `PORT`, but this acts as a fallback).
- `MONGO_URI` - MongoDB Atlas or Railway Mongo connection string.
- `JWT_SECRET` - long random string (keep private).
- `CORS_ORIGIN` - exact origin of the frontend (use `*` only for local dev).
- `GENERATE_URL` - upstream model endpoint that returns summaries and sources.

### 8.2 Recommended hosting flow
Frontend on Vercel:
1. Import the repository, pick the Vite preset, build with `npm run build`, output `dist/`.
2. Provide `VITE_API_BASE_URL` pointing to the backend URL.
3. Deploy and smoke-test.

Backend on Railway:
1. Create a new service pointing at `server-side/`.
2. Build command `npm run build`, start command `npm run start`.
3. Provision MongoDB (Railway or Atlas) and set `MONGO_URI`.
4. Add custom env vars (`JWT_SECRET`, `CORS_ORIGIN`, `GENERATE_URL`).
5. Verify with `GET https://<service>.railway.app/api/health`.

CORS reminder: ensure `CORS_ORIGIN` matches the deployed frontend domain, otherwise browsers will block API calls.

## 9. Local development workflow
Prerequisites: Node 18+, npm, and a running MongoDB instance.

Frontend:
```bash
npm install
npm run dev
```
The dev server runs on Vite's default port (usually 5173). Configure `VITE_API_BASE_URL=http://localhost:8080` (or whichever port the backend uses).

Backend:
```bash
cd server-side
npm install
npm run dev
```
`npm run dev` uses `tsx watch src/server.ts` for fast reloads. `npm run build && npm start` compiles to `dist/` and runs the production bundle.

Useful tips:
- Because the API enforces JWT auth, copy the `token` from `localStorage` when calling endpoints via tools like Thunder Client or Postman.
- Seed data by creating an account through the signup page; the frontend will automatically hit `/auth/me` and `/chats` afterward.
- When iterating on the chat flow, keep the browser console open to see localized error toasts plus raw warnings from the `fetch` helper.

## 10. Operational notes and next steps
- File upload support is surfaced in the UI (Paperclip button) but intentionally disabled. Hook it up once the backend accepts documents.
- Streaming responses are currently simulated with a typing animation; the API waits for the upstream generator before responding. Consider adding server-sent events or chunked responses for real streaming.
- The cache for identical questions compares the entire prompt string. Normalizing text (case folding, trimming punctuation) would improve hit rates.
- There is no rate limiting or audit logging yet. Add middleware (for example `express-rate-limit`) before exposing the API publicly.
- Tests are still absent on both tiers. Start with unit tests for `chatService` and component tests for `useChat` to cover the complex state transitions.
- Localization: UI copy is in Bulgarian, but backend fallbacks are partially transliterated due to encoding issues. Standardize UTF-8 handling to avoid garbled characters in logs.
- Monitoring: rely on Railway logs and Mongo metrics today. Budget for structured logging (pino or Winston) and tracing once traffic grows.
