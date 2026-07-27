# Real-Time Patient Intake System

Next.js patient intake form with a Socket.IO staff dashboard. Patients enter intake details at `/form/[sessionId]`; staff monitor live field changes and submission status at `/dashboard`.

## Stack

- Next.js 14 App Router
- TypeScript
- TailwindCSS
- React Hook Form + Zod
- Socket.IO standalone server

## Local Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
npm run dev:socket
```

Open these in separate tabs:

- Patient form: `http://localhost:3000/form/demo`
- Staff dashboard: `http://localhost:3000/dashboard`

The staff dashboard can create a new session link and copy it for a patient.

## Environment Variables

```bash
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
FRONTEND_ORIGIN=http://localhost:3000
STAFF_ACCESS_TOKEN=
STAFF_SOCKET_TOKEN=
```

`STAFF_ACCESS_TOKEN` protects `/dashboard` when set. Open `/dashboard?token=<token>` once to set the HTTP-only staff cookie.

`STAFF_SOCKET_TOKEN` protects the Socket.IO staff room. If enabled, pass the same value from a trusted staff client flow before joining the dashboard.

## Architecture

- `lib/schema.ts` is the single source of truth for patient validation and socket payload validation.
- `components/form/PatientForm.tsx` owns client form state and emits debounced `patient:update` events.
- `server/socket-server.ts` re-validates socket events, sanitizes free text, rate-limits updates, scopes messages by room, and sends staff snapshots.
- `components/staff/StaffDashboard.tsx` subscribes to snapshot/list events and renders one card per active session.
- `middleware.ts` protects `/dashboard` when `STAFF_ACCESS_TOKEN` is configured.

## Deployment Notes

Deploy the Next.js frontend to Vercel and deploy `server/socket-server.ts` as a separate long-running Node process on Render, Fly.io, or a VPS. Set `NEXT_PUBLIC_SOCKET_SERVER_URL` to the deployed Socket.IO URL and configure HTTPS/WSS plus a locked-down `FRONTEND_ORIGIN`.
