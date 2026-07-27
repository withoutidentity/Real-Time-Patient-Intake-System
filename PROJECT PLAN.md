# Real-Time Patient Intake System — Development Plan

> Framework: **Next.js** · Styling: **TailwindCSS** · Real-time: **WebSockets** · Hosting: **Vercel**

---

## 1. Project Overview

This project implements two synchronized interfaces:

- **Patient Form** — a responsive, validated form where a patient enters personal/medical intake details.
- **Staff View** — a real-time dashboard where staff watch patient input as it happens, with live status indicators (Inactive / Filling / Submitted).

Both interfaces are joined by a **room/session ID** so multiple patients can be monitored independently and simultaneously by staff.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR-friendly, API routes for backend logic |
| Language | TypeScript | Type safety for form schemas and socket payloads |
| Styling | TailwindCSS | Utility-first, fast responsive breakpoints |
| Forms & Validation | React Hook Form + Zod | Schema-based validation shared by client & server |
| Real-time | Socket.IO (WebSockets) | Auto-reconnect, room support, fallback to polling |
| State | React Context / Zustand | Lightweight, no need for Redux at this scale |
| Hosting | Vercel | Native Next.js support; Socket.IO server hosted separately (see §7) |

---

## 3. Project Structure

```
patient-intake/
├── app/
│   ├── (patient)/
│   │   └── form/[sessionId]/page.tsx      # Patient form entry
│   ├── (staff)/
│   │   └── dashboard/page.tsx             # Staff real-time view
│   ├── api/
│   │   └── session/route.ts               # Create/validate session IDs
│   └── layout.tsx
├── components/
│   ├── form/
│   │   ├── PatientForm.tsx
│   │   ├── FormField.tsx
│   │   └── fields/                        # Input, Select, DatePicker, PhoneInput
│   ├── staff/
│   │   ├── PatientCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── LiveFieldViewer.tsx
│   └── ui/                                # Shared buttons, inputs, layout primitives
├── lib/
│   ├── schema.ts                          # Zod schema (single source of truth)
│   ├── socket-client.ts
│   └── sanitize.ts                        # Input sanitization helpers
├── server/
│   └── socket-server.ts                   # Standalone Socket.IO server
├── types/
│   └── patient.ts
├── middleware.ts                          # Basic route protection for /dashboard
└── .env.local.example
```

**Rationale:** route groups `(patient)` and `(staff)` keep concerns isolated; `lib/schema.ts` is imported by both the form (client validation) and the socket server (server-side re-validation), preventing drift between the two.

---

## 4. Data Model

```ts
interface PatientData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;       // ISO 8601
  gender: string;
  phoneNumber: string;
  email: string;
  address: string;
  preferredLanguage: string;
  nationality: string;
  emergencyContact?: { name: string; relationship: string };
  religion?: string;
}

type FieldStatus = "inactive" | "filling" | "submitted";
```

---

## 5. Design Decisions (UI/UX)

- **Mobile-first Tailwind breakpoints**: single-column form on `<640px`, two-column grid from `md:` up.
- **Progressive disclosure**: optional fields (middle name, emergency contact, religion) are visually de-emphasized but never hidden, to respect clarity over cleverness.
- **Staff dashboard as a grid of cards**, one per active session, so multiple patients can be monitored at once; each card shows a colored status badge (gray = inactive, blue = filling, green = submitted).
- **Debounced live updates** (~300ms) on text fields to avoid flooding the socket with every keystroke while still feeling instant.
- **Accessible forms**: proper `<label>` association, `aria-invalid`, error text linked via `aria-describedby`, visible focus rings.

---

## 6. Component Architecture

| Component | Purpose |
|---|---|
| `PatientForm` | Owns form state (React Hook Form), emits debounced socket events on change, full validation via Zod on submit |
| `FormField` | Generic wrapper handling label, error message, and field type dispatch |
| `LiveFieldViewer` | Renders a single patient's data on the staff side, subscribing to that patient's socket room |
| `PatientCard` | Wraps `LiveFieldViewer` + `StatusBadge`, one per session |
| `StatusBadge` | Pure presentational component driven by `FieldStatus` |
| `socket-client.ts` | Thin wrapper around `socket.io-client`; exposes `joinSession`, `emitUpdate`, `onUpdate` |

---

## 7. Real-Time Synchronization Flow

1. A **session ID** is generated when a patient opens the form (e.g. `/form/[sessionId]`), either via QR code/link from staff or auto-generated.
2. Patient client connects to the Socket.IO server and joins a room named after the `sessionId`.
3. On each field change (debounced), the client emits `patient:update` with `{ sessionId, field, value }`.
4. The server **re-validates the payload against the same Zod schema** used on the client, then re-broadcasts `patient:update` to everyone else in that room (staff dashboard).
5. On blur/inactivity, the client emits `patient:status` (`filling` → `inactive`) to update the badge.
6. On submit, the client emits `patient:submitted`; the server persists the record (see §8) and the room receives a final `submitted` status — the card becomes read-only on the staff side.
7. **Socket.IO server** runs as a standalone Node process (not on Vercel's serverless functions, which don't support persistent WebSocket connections) — deployed on Render/Fly.io/a small VPS, with the Next.js app on Vercel connecting to it over `wss://`.

```
Patient Browser  ──(debounced update)──▶  Socket.IO Server  ──(broadcast)──▶  Staff Dashboard(s)
       │                                        │
       └──────────── submit (validated) ────────┴──▶ Database (persist)
```

---

## 8. Security & Best Practices

Because this handles **personal and health-adjacent data**, security is treated as a first-class requirement, not an afterthought:

- **Server-side re-validation**: never trust client validation alone — every socket payload is re-parsed with Zod on the server before broadcast or persistence.
- **Input sanitization**: strip/escape HTML from free-text fields (`address`, names) to prevent stored/reflected XSS when rendered on the staff dashboard.
- **Transport security**: enforce HTTPS/WSS everywhere; no plaintext WebSocket connections in production.
- **Session scoping**: each patient's data only broadcasts to sockets joined to that specific `sessionId` room — never a global broadcast — to prevent one patient's data leaking to another's view.
- **Staff authentication**: `/dashboard` is protected via Next.js `middleware.ts` (session cookie / JWT check); unauthenticated users cannot open a WebSocket to staff rooms.
- **Least-privilege environment variables**: secrets (DB connection string, JWT signing key, socket server URL) live in `.env.local`, never committed; `.env.local.example` documents required keys without values.
- **Rate limiting**: throttle `patient:update` events per socket (e.g. max 1 per 150ms) server-side to mitigate abuse/DoS, independent of client debounce.
- **No sensitive data in logs**: avoid logging full `PatientData` payloads; log event types and session IDs only.
- **CORS lockdown**: Socket.IO server only accepts connections from the deployed frontend origin, not `*`.
- **Data minimization**: only the fields explicitly required by the assignment are collected; optional fields stay optional and are never required client- or server-side.
- **Dependency hygiene**: run `npm audit` / Dependabot; pin major versions in `package.json`.

---

## 9. Deliverables Checklist

- [ ] GitHub repository with clear `README.md` (setup, run, env vars, architecture summary)
- [ ] Live deployed link (Vercel for frontend + separate host for socket server)
- [ ] This planning document (`PROJECT_PLAN.md`)
- [ ] Bonus (optional, time permitting): multi-patient staff grid view, dark mode, i18n for `preferredLanguage`, form auto-save/resume via `sessionId`

---

## 10. Local Development

```bash
git clone <repo-url>
cd patient-intake
npm install
cp .env.local.example .env.local   # fill in SOCKET_SERVER_URL, etc.
npm run dev                        # Next.js app
npm run dev:socket                 # Socket.IO server (separate terminal)
```

Open `http://localhost:3000/form/demo` in one tab and `http://localhost:3000/dashboard` in another to see real-time sync locally.
