# ResilienceSOS

**Offline SOS relay prototype — Android-first.**

An SOS created on a phone without internet is persisted locally, forwarded over Google Nearby Connections through compatible nearby devices, and uploaded to a backend by any internet-connected gateway in the chain. The backend persists the incident and can send an SMS to a designated test contact.

> This is an experimental supplemental communication path, not a certified life-safety system.

---

## Architecture

```
[Device A — no internet]
    → SOS created, stored locally (SQLite)
    → Nearby Connections → [Device B — relay]
    → Nearby Connections → [Device C — gateway with internet]
    → HTTPS POST → [Node.js/Express backend]
    → PostgreSQL (Prisma)
    → SMS provider → test contact
```

See `docs/ResilienceSOS_Master_Enterprise_Architecture.md` for the full architecture.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js LTS | ≥ 22 |
| npm | ≥ 10 |
| Android Studio | Latest stable |
| PostgreSQL | ≥ 14 |
| Physical Android devices | ≥ 2 for Nearby relay |

---

## Quick start

### Mobile

```bash
cd mobile
npm install
cp .env.example .env   # edit EXPO_PUBLIC_API_BASE_URL
npx expo start         # JavaScript-only (no Nearby)

# For full native build with Nearby Connections:
npx expo prebuild
npx expo run:android
```

> Nearby Connections requires a **development build** — Expo Go is not supported.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill DATABASE_URL and optional Twilio credentials

# Create the PostgreSQL database, then:
npm run db:migrate     # applies migrations (dev only)
npm run db:generate    # generates Prisma client
npm run dev            # starts the server on PORT 4000
```

---

## Environment variables

### `mobile/.env`

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend URL (use `10.0.2.2:4000` for emulator, LAN IP for physical device) |

### `backend/.env`

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: 4000) |
| `CORS_ORIGIN` | Allowed CORS origin |
| `TWILIO_ACCOUNT_SID` | Optional — SMS provider |
| `TWILIO_AUTH_TOKEN` | Optional — SMS provider |
| `TWILIO_FROM_NUMBER` | Optional — SMS sender number |
| `DEMO_AUTH_TOKEN` | Optional — temporary demo auth token (server-side only) |

---

## Development checks

```bash
# Mobile
cd mobile
npx expo-doctor          # all 21 checks must pass
npx tsc --noEmit         # TypeScript
npm test -- --runInBand  # unit tests (relay policy, incident validation)

# Backend
cd backend
npx prisma validate      # schema valid
npx tsc --noEmit         # TypeScript
npm test                 # (TODO: add backend tests)
```

---

## Known limitations / TODO

- **Nearby Connections relay**: Kotlin module scaffolded and built; actual end-to-end relay (A→B→C) **not yet tested on physical devices**.
- **`npx expo prebuild` required** before any native test; Expo Go cannot load the Kotlin module.
- **Backend SMS**: Twilio integration stub exists; actual sending **not yet implemented**.
- **Backend tests**: No test suite yet; `npm test` returns an error.
- **`npx prisma migrate dev`**: Requires a running PostgreSQL instance with `DATABASE_URL` set.
- **Multi-hop claim**: Not proven. Do not claim mesh relay until A → B → C → upload is demonstrated on real devices.
- **iOS**: Not supported.

---

## Tested on

- Node.js 24.18.0
- Expo SDK 57.0.27 (stable)
- Prisma ORM 7.10.0 (stable)
- expo-doctor: 21/21 checks pass
- TypeScript: 0 errors (mobile + backend)
- Unit tests: 13/13 pass (relay policy + incident validation)

Physical-device relay testing: **not yet performed**.
