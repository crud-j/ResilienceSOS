# ResilienceSOS — Recommended Folder Structure & Installation Guide

**Purpose:** Give this document to an AI coding agent (Claude Code, Codex, Cursor, etc.) and instruct it to create the project structure, install dependencies, configure the Expo app, prepare the native Android networking module, and set up the TypeScript API with PostgreSQL + Prisma.

**Architecture baseline:** React Native + TypeScript using the latest **stable Expo SDK**, a local Kotlin Expo module for Google Nearby Connections, SQLite on devices, and a Node.js/TypeScript API backed by PostgreSQL + Prisma.

**Version note (checked 9 October 2026):** Expo SDK 57 is the latest stable SDK; SDK 58 is beta. Use SDK 57 stable, not a beta/canary, unless the user explicitly asks otherwise. Always confirm current official Expo compatibility before installing. Expo's default project creation flow and versioned package installation are documented at https://docs.expo.dev/get-started/create-a-project/ and https://docs.expo.dev/versions/latest/. Prisma ORM 7 is the stable Prisma line; Prisma 8 is currently a release candidate. Do not install Prisma 8 RC for this MVP unless explicitly requested.

---

# 1. Instructions for the AI Coding Agent

You are the senior mobile, Android-native, backend, and DevOps engineer implementing **ResilienceSOS**, an Android-first offline SOS relay prototype.

## 1.1 First inspect, then implement

1. Inspect the current repository, existing files, package manager, installed dependencies, Git status, and any existing `README.md`, architecture Markdown, Expo app, API, or Prisma schema.
2. Preserve existing working code and user changes. Do not overwrite a working project or delete files simply to match this document.
3. If the repository is empty, create the structure described below.
4. If an Expo project already exists, upgrade/align it to the latest **stable** Expo SDK supported by the project rather than blindly recreating it.
5. Use **npm** consistently for this MVP unless the repository already uses pnpm, Yarn, or Bun. Do not create multiple lockfiles.
6. Use current official Expo and Prisma documentation when version-specific details have changed. Do not copy outdated setup commands from old tutorials.
7. Do not install arbitrary or abandoned Nearby Connections React Native wrappers. Build a small local Expo native module in Kotlin using Expo Modules API and the official Google Nearby Connections Android SDK.
8. Work in small stages and run the checks in Section 9. Fix errors caused by your changes before finishing.
9. Do not claim nearby transfer, multi-hop forwarding, cloud upload, or SMS works until each is implemented and tested. Add clear TODOs only for genuine blockers; do not leave fake or simulated success states in production code.

## 1.2 Non-negotiable architecture

- **Mobile:** Expo SDK 57 stable, React Native, TypeScript, Expo Router.
- **Platform focus:** Android first. Do not promise iOS relay compatibility.
- **Nearby networking:** Google Nearby Connections through a local Kotlin Expo module.
- **Offline persistence:** `expo-sqlite` for incident packets, received/processed IDs, and pending uploads.
- **Backend:** Node.js + TypeScript + Express (keep one small API; do not create microservices).
- **Cloud database:** PostgreSQL.
- **ORM:** Prisma ORM 7 stable with migrations. Check current Prisma 7 setup requirements before writing configuration. Do not use Prisma 8 RC.
- **Validation:** Zod for API payloads and environment configuration.
- **Secrets:** Keep all backend credentials in `backend/.env`, never in Expo public environment variables or mobile code.
- **Transport:** HTTPS from the gateway to the backend. A mobile device must never connect directly to PostgreSQL.
- **No AI audio detection, automatic emergency dispatch, iOS relay, or custom radio protocol in the MVP.**

---

# 2. Target Repository Structure

Create the following structure. Keep the project intentionally small enough for a hackathon.

```text
ResilienceSOS/
├── README.md
├── AGENTS.md
├── .gitignore
├── .editorconfig
├── .gitattributes
├── docs/
│   ├── MASTER_ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE_AND_SETUP.md
│   ├── API_CONTRACT.md
│   ├── INCIDENT_LIFECYCLE.md
│   ├── SECURITY_AND_PRIVACY.md
│   └── TEST_PLAN.md
│
├── mobile/
│   ├── package.json
│   ├── package-lock.json
│   ├── app.json
│   ├── eas.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── expo-env.d.ts
│   ├── .env.example
│   ├── .gitignore
│   │
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── sos/
│   │   │   ├── confirm.tsx
│   │   │   └── [incidentId].tsx
│   │   ├── relay/
│   │   │   └── index.tsx
│   │   ├── incidents/
│   │   │   ├── index.tsx
│   │   │   └── [incidentId].tsx
│   │   ├── diagnostics/
│   │   │   └── index.tsx
│   │   └── settings/
│   │       └── index.tsx
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── SOSHoldButton.tsx
│   │   │   ├── DeliveryStatusBadge.tsx
│   │   │   ├── NetworkStatusCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ScreenContainer.tsx
│   │   │
│   │   ├── features/
│   │   │   ├── sos/
│   │   │   │   ├── createSOS.ts
│   │   │   │   ├── cancelSOS.ts
│   │   │   │   └── sos.types.ts
│   │   │   ├── incidents/
│   │   │   │   ├── incident.types.ts
│   │   │   │   ├── incident.validation.ts
│   │   │   │   └── incidentStatus.ts
│   │   │   ├── relay/
│   │   │   │   ├── relayCoordinator.ts
│   │   │   │   ├── relayPolicy.ts
│   │   │   │   └── relay.types.ts
│   │   │   └── diagnostics/
│   │   │       └── diagnostics.types.ts
│   │   │
│   │   ├── db/
│   │   │   ├── database.ts
│   │   │   ├── migrations/
│   │   │   ├── incidentRepository.ts
│   │   │   ├── processedIncidentRepository.ts
│   │   │   └── uploadQueueRepository.ts
│   │   │
│   │   ├── services/
│   │   │   ├── location/
│   │   │   │   └── locationService.ts
│   │   │   ├── nearby/
│   │   │   │   ├── nearby.types.ts
│   │   │   │   ├── nearbyService.ts
│   │   │   │   └── nearbyEvents.ts
│   │   │   ├── api/
│   │   │   │   ├── apiClient.ts
│   │   │   │   └── incidentApi.ts
│   │   │   ├── upload/
│   │   │   │   └── uploadQueueWorker.ts
│   │   │   └── permissions/
│   │   │       └── permissionService.ts
│   │   │
│   │   ├── state/
│   │   │   └── appStore.ts
│   │   ├── hooks/
│   │   │   ├── useNetworkStatus.ts
│   │   │   └── useRelayStatus.ts
│   │   ├── constants/
│   │   │   ├── config.ts
│   │   │   └── relayLimits.ts
│   │   ├── utils/
│   │   │   ├── ids.ts
│   │   │   ├── time.ts
│   │   │   └── logger.ts
│   │   └── theme/
│   │       ├── colors.ts
│   │       ├── spacing.ts
│   │       └── typography.ts
│   │
│   ├── modules/
│   │   └── resilience-nearby/
│   │       ├── expo-module.config.json
│   │       ├── index.ts
│   │       ├── src/
│   │       │   └── ResilienceNearbyModule.ts
│   │       └── android/
│   │           └── src/main/java/expo/modules/resiliencenearby/
│   │               ├── ResilienceNearbyModule.kt
│   │               ├── NearbyConnectionManager.kt
│   │               ├── NearbyPayloadCodec.kt
│   │               └── NearbyPermissions.kt
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── tests/
│   │   ├── relayPolicy.test.ts
│   │   ├── incidentValidation.test.ts
│   │   └── uploadQueue.test.ts
│   │
│   └── android/                 # Generated by Expo Prebuild; do not hand-scaffold
│
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .gitignore
│   ├── prisma.config.ts          # Use the correct config format for Prisma 7
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   └── logger.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── requestId.ts
│   │   │   └── rateLimit.ts
│   │   ├── modules/
│   │   │   ├── incidents/
│   │   │   │   ├── incident.routes.ts
│   │   │   │   ├── incident.controller.ts
│   │   │   │   ├── incident.service.ts
│   │   │   │   ├── incident.schema.ts
│   │   │   │   └── incident.repository.ts
│   │   │   ├── delivery-events/
│   │   │   │   ├── deliveryEvent.service.ts
│   │   │   │   └── deliveryEvent.repository.ts
│   │   │   └── notifications/
│   │   │       ├── notification.service.ts
│   │   │       ├── notification.provider.ts
│   │   │       └── notification.types.ts
│   │   ├── routes/
│   │   │   └── health.routes.ts
│   │   └── utils/
│   │       ├── asyncHandler.ts
│   │       └── httpErrors.ts
│   └── tests/
│       ├── incident.schema.test.ts
│       └── incident.service.test.ts
│
└── scripts/
    ├── check-env.mjs
    └── dev-checks.md
```

### Structure rules

- Expo Router route files in `mobile/app/` should stay thin. They compose screens and connect to feature hooks/services.
- App-specific domain logic belongs in `mobile/src/features/`.
- SQLite queries belong in repositories under `mobile/src/db/`; UI components must not issue raw SQL.
- `mobile/modules/resilience-nearby/` is a **local Expo module** containing the native Kotlin bridge. Generate it using Expo's module generator rather than manually inventing module boilerplate.
- `mobile/android/` is generated by Expo Prebuild. Do not create or maintain the entire Android project by hand.
- Backend routes validate input and delegate to services. Database access goes through Prisma repositories/services, not directly from route handlers.
- `backend/prisma/schema.prisma` is the source of truth for cloud database models.
- Do not add Redis, Kafka, microservices, a separate Python server, or a monorepo build system for this MVP.

---

# 3. Prerequisites

Install these on the development computer:

1. **Node.js LTS** compatible with the latest stable Expo SDK. Use the Node version required by the official Expo SDK reference; prefer the current LTS release.
2. **npm**, bundled with Node.js.
3. **Git**.
4. **Android Studio** with Android SDK, platform tools, and an emulator (for ordinary UI work).
5. **At least two or preferably three physical Android phones** for real Nearby Connections and multi-hop testing.
6. **PostgreSQL** locally or a hosted PostgreSQL database.
7. **VS Code** or another editor.
8. An Expo account if using EAS Build.

For native Android builds on Windows, ensure Android Studio's SDK and Java/Gradle requirements match the selected Expo SDK. Use the versions required by the generated Android project rather than installing arbitrary Java/Gradle versions.

**Important:** A simulator/emulator alone is not enough to prove the offline peer-to-peer relay. The final A → B → C test must use physical Android devices.

---

# 4. Initialize the Repository and Expo App

## 4.1 Create the repository folders

Run from the parent directory where you want the project:

```bash
mkdir ResilienceSOS
cd ResilienceSOS
git init
mkdir docs
```

If a repository already exists, do not run `git init` again or overwrite its files.

## 4.2 Create the Expo app

Use the official Expo project creator and select **SDK 57 stable** if the CLI asks you to choose an SDK:

```bash
npx create-expo-app@latest mobile
```

Choose the default multi-screen TypeScript template with Expo Router when prompted. If the current CLI no longer prompts, inspect the generated `package.json` and official documentation to confirm that the app uses the latest stable Expo SDK and TypeScript.

Then:

```bash
cd mobile
npx expo install --fix
npx expo-doctor
cd ..
```

Do not manually upgrade React Native, React, Metro, or individual Expo packages to arbitrary versions. Use `npx expo install` for Expo-compatible packages and follow the current SDK's compatibility matrix.

## 4.3 Generate the local native module

From the Expo app directory:

```bash
cd mobile
npx create-expo-module@latest --local
```

When prompted:

- Module name: `resilience-nearby`
- Native module class name: `ResilienceNearby`
- Package namespace: `expo.modules.resiliencenearby`
- Platforms: Android only for the MVP, if the generator offers platform selection.
- Features: minimal function/async-function support; add event support only if required for connection and payload events.

Inspect the generated files and adapt them to the structure above. Do not replace generator-created configuration with guessed JSON or Kotlin boilerplate.

The module must expose a small typed API to TypeScript, for example:

- `checkPermissions()`
- `startAdvertising()`
- `startDiscovery()`
- `requestConnection(endpointId)`
- `acceptConnection(endpointId)`
- `sendIncident(endpointId, payload)`
- `disconnect(endpointId)`
- `stopAll()`
- Events for endpoint discovered, connection state changed, payload received, transfer result, and errors.

These are proposed bridge methods. Implement only methods that map to real native behavior. Do not return fake success responses.

## 4.4 Native development build is required

Expo Go does not contain your custom Kotlin module. Use a **development build**, not Expo Go, for Nearby Connections testing.

After adding/configuring the native module and its Android dependency:

```bash
cd mobile
npx expo prebuild
npx expo run:android
```

Use `npx expo prebuild --clean` only when you intentionally want to regenerate native projects and understand that generated native edits can be removed. Prefer `npx expo prebuild` for the first generation.

For a cloud development build, configure EAS using the current Expo documentation, then use a development profile. Do not assume a JavaScript reload can apply Kotlin changes; native changes require a new native build.

---

# 5. Mobile Dependency Installation

Run package installation from `mobile/`. Use Expo's installer for Expo and React Native packages so versions match the selected SDK.

```bash
cd mobile

# Core Expo modules used by the MVP
npx expo install expo-location expo-haptics expo-sqlite expo-constants expo-device expo-network expo-application

# Expo development build support
npx expo install expo-dev-client

# Common UI / routing dependencies
# Expo Router and TypeScript are usually included by the default template.
# Install only if the generated project does not already contain them.
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-status-bar

# TypeScript runtime validation and IDs
npm install zod uuid

# Development/test tooling; check compatibility with the generated SDK
npm install -D jest jest-expo @types/jest @types/uuid
```

The AI agent must inspect the generated `package.json` before installing to avoid duplicate packages. If a package is already installed, do not install it again unnecessarily.

### Purpose of key mobile packages

- `expo-location`: user-initiated location capture, including accuracy and timestamp.
- `expo-haptics`: haptic feedback for the SOS interaction.
- `expo-sqlite`: persistent local incident, processed-ID, and upload queues.
- `expo-network`: display network reachability hints; it is not proof that the backend is reachable.
- `expo-device` / `expo-application`: diagnostics and build/device metadata.
- `expo-dev-client`: install and run a custom native development build.
- `zod`: validate incident payloads before persistence/forwarding.
- `uuid`: generate stable incident IDs.
- `jest` / `jest-expo`: unit tests, if compatible with the generated SDK and template.

Do not add AsyncStorage as a second source of truth for incident queues. SQLite should own durable incident state. Small noncritical UI preferences may use a separate preference store if necessary.

### Nearby Connections dependency

The native Kotlin module must use the **official Google Play services Nearby Connections SDK**. The AI agent must:

1. Consult the current official Google Nearby Connections Android documentation.
2. Select the documented stable dependency version compatible with the generated Android project.
3. Add it to the appropriate generated/local module Gradle configuration.
4. Add only the permissions required by the selected Nearby Connections API and Android versions.
5. implement runtime permission requests and radio-enabled checks.
6. Handle connection lifecycle, disconnections, rejected connections, and transfer errors.
7. Ensure all Nearby payloads are validated by the application before storage/forwarding.
8. Document any transport/topology constraints found during the initial proof.

Do not use an old community React Native wrapper without verifying active maintenance, SDK compatibility, and the exact APIs it supports.

---

# 6. Expo App Configuration

Configure `mobile/app.json` (or the app config file generated by Expo) with:

- App name: `ResilienceSOS`
- Slug: `resilience-sos`
- A stable Android package/application ID, for example `com.resiliencesos.app`
- `scheme`: `resiliencessos`
- Expo Router plugin
- Location permission copy explaining that location is used only when creating an SOS
- Any plugin configuration required by installed Expo modules
- No unnecessary permissions
- Android-only product claims in the UI and documentation

The AI agent must configure Android Nearby Connections permissions in the appropriate native manifest/configuration for the current Android API levels and the official Nearby Connections requirements. Do not blindly paste an old permission list from a tutorial. Explain why each permission is required, request runtime permissions where required, and handle denial gracefully.

Do not request microphone, contacts, SMS-send, or background location permissions unless a real MVP feature requires them. The backend sends SMS; the phone should not request direct SMS-sending permission.

Create a `mobile/.env.example` containing only safe, public configuration such as:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000
```

This example host is for an Android emulator accessing a backend on the host computer. For a physical phone, use the computer's LAN IP address or a deployed HTTPS URL. Do not assume `localhost` on a phone means the developer computer.

Never put `DATABASE_URL`, SMS credentials, server secrets, private signing keys, or admin tokens in `EXPO_PUBLIC_*` variables. Expo public variables are bundled into the client app.

---

# 7. Backend Installation — Node.js, TypeScript, Express, PostgreSQL, Prisma

## 7.1 Initialize the backend

From the repository root:

```bash
mkdir backend
cd backend
npm init -y
npm pkg set type=module
```

Install the core API dependencies:

```bash
npm install express cors helmet express-rate-limit zod dotenv
npm install pino pino-http
npm install @prisma/client@7 @prisma/adapter-pg pg
npm install -D prisma@7 typescript tsx @types/node @types/express @types/cors @types/pg
```

Use Prisma ORM **7 stable** for this setup. Keep `prisma` and `@prisma/client` on compatible matching 7.x versions. Before installation, check the official Prisma documentation in case the stable version has changed since this document was written. Do not silently install Prisma 8 release candidates.

For Prisma 7 with PostgreSQL, follow the current Prisma 7 configuration and driver-adapter instructions. The exact client generator/output and `PrismaClient` initialization must match the installed Prisma 7 release. Do not copy Prisma 6 examples into a Prisma 7 project.

## 7.2 Backend environment

Create `backend/.env.example`:

```dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/resilience_sos?schema=public
CORS_ORIGIN=http://localhost:8081
LOG_LEVEL=info

# Optional: configure only if the team has a real SMS provider account
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

Create `backend/.env` locally using real development values. Never commit it. Do not use the example credentials in a real deployment.

If using a hosted PostgreSQL service, follow its current Prisma connection instructions. Some providers require separate pooled runtime and direct migration connection URLs. Add the appropriate environment variables only if the selected provider needs them.

## 7.3 PostgreSQL database

Create a PostgreSQL database named `resilience_sos` using local PostgreSQL or a trusted hosted provider. Use a dedicated database user with least privilege. Do not expose PostgreSQL publicly just to connect the mobile app.

The backend must be the only application layer that accesses the cloud database.

## 7.4 Prisma schema and migrations

Create and verify:

```text
backend/
├── prisma.config.ts
└── prisma/
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

Use the current Prisma 7 configuration format. In Prisma 7, database connection configuration is handled through the Prisma config file rather than blindly relying on old Prisma 6 schema examples.

The initial schema should contain at least:

- `Incident`: canonical server record and unique client-generated incident ID.
- `DeliveryEvent`: append-only incident delivery/processing events.
- `NotificationAttempt`: idempotent SMS provider attempts and status.
- Enums for incident and notification states.
- Timestamps and indexes needed for status lookup and incident timelines.

Keep the cloud schema aligned with the ResilienceSOS master architecture. Store the original client incident ID with a unique constraint to make gateway retries idempotent. Do not store raw phone numbers in generic relay/event logs. Never interpret SMS provider acceptance as proof that the recipient read the message.

After writing the schema and Prisma configuration, use the migration commands supported by the installed Prisma 7 release. The usual Prisma 7 development workflow is based on `prisma migrate dev` and `prisma generate`, but the agent must verify exact command requirements for the installed release and config.

Example commands to adapt after verifying the generated config:

```bash
npx prisma validate
npx prisma migrate dev --name init_resilience_sos
npx prisma generate
```

Never run development migrations against production. Commit migration files to version control.

## 7.5 Suggested backend scripts

Add appropriate scripts to `backend/package.json`:

- `dev`: run the TypeScript server in development.
- `build`: type-check/compile the backend.
- `start`: run the built server.
- `typecheck`: run TypeScript without emitting output.
- `test`: run backend tests.
- `db:validate`: validate Prisma schema.
- `db:migrate`: documented local migration command.
- `db:generate`: generate the Prisma client using the installed Prisma version.

Use scripts that match the actual tools and module configuration; do not leave broken placeholder commands.

---

# 8. API and Incident Handling Requirements

Implement only the minimum API required for the relay demo.

## 8.1 Initial endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | API liveness and basic service status |
| `POST` | `/v1/incidents` | Validate and ingest an incident from an authorized gateway |
| `GET` | `/v1/incidents/:id` | Return incident status to an authorized caller |
| `POST` | `/v1/incidents/:id/notifications` | Request an allowed notification/retry if this feature is implemented |
| `POST` | `/v1/provider/sms-status` | Provider callback endpoint, only if SMS callbacks are configured |

These are planned endpoints, not existing functionality until implemented and tested.

## 8.2 Backend rules

- Validate payloads with Zod.
- Limit request body size.
- Apply rate limiting to public-facing endpoints.
- Enforce idempotency using the client-generated incident ID.
- Persist the incident and initial delivery event transactionally where appropriate.
- Record server receipt time separately from device-provided time.
- Reject expired, malformed, unsupported, or oversized incidents.
- Return truthful states and machine-readable error codes.
- Never trust a mobile-supplied `status` field as proof of backend or SMS delivery.
- Do not send repeated SMS messages just because a gateway retries the same incident upload.
- Add authentication/authorization for non-demo access. If the hackathon uses a simple demo token, label it as a temporary development control and keep it server-side.
- Do not include real user data in seeded examples or logs.

---

# 9. Development Commands and Validation

## 9.1 Run the mobile app

From `mobile/`:

```bash
npx expo start
```

For a native build with the local Kotlin module, first build/install the development client:

```bash
npx expo prebuild
npx expo run:android
```

After changing Kotlin code or native Gradle/manifest configuration, rebuild the native app. A JavaScript refresh alone is not sufficient.

## 9.2 Run the backend

From `backend/`, use the scripts created in `package.json`, for example:

```bash
npm run dev
```

Confirm that `GET /health` returns a real health response and that the backend logs no missing environment variables or database connection errors.

## 9.3 Checks the agent must run

Mobile:

```bash
cd mobile
npx expo-doctor
npx tsc --noEmit
npm test -- --runInBand
```

If the generated test setup does not support one of these commands, fix the setup or document the exact reason and run the equivalent valid check. Do not claim a test passed if it was not run.

Backend:

```bash
cd backend
npx prisma validate
npx tsc --noEmit
npm test
```

Also verify that:

- the API can connect to the development PostgreSQL database;
- migrations apply to a fresh development database;
- a duplicate incident upload does not create a duplicate incident;
- malformed and expired payloads are rejected;
- local SQLite persists incidents after app restart;
- a failed upload remains queued for retry;
- Nearby module methods fail clearly when permissions/radios are unavailable;
- physical devices can discover/connect/transfer in the supported topology.

---

# 10. ResilienceSOS Relay Defaults

Place initial tunable values in `mobile/src/constants/relayLimits.ts` and validate them on both client and server:

- Incident expiry: 30 minutes.
- Maximum hop count: 5.
- Maximum serialized incident packet: 4 KB.
- Duplicate retention: at least as long as incident expiry.
- Visible, user-enabled relay session.
- Bounded exponential retry with jitter.
- Persist received incident before acknowledging it.
- Never forward an expired incident.
- Keep the same incident ID across all relay hops.
- Never send contact phone numbers in nearby broadcast payloads.

These are prototype defaults, not certified emergency-network settings.

---

# 11. Secrets and Git Hygiene

Ensure `.gitignore` excludes at least:

```gitignore
# Dependencies and build output
node_modules/
dist/
build/
.expo/
coverage/

# Secrets
.env
.env.*
!.env.example

# Generated native build artifacts and local IDE state
android/.gradle/
android/app/build/
ios/Pods/
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/extensions.json
```

Review the generated Expo `.gitignore` and existing repository rules before editing. Do not accidentally ignore the `mobile/android/` native project if the team decides to commit prebuild output; choose one consistent native-project strategy and document it. Never commit `.env`, signing credentials, provider tokens, database URLs, or personal incident data.

---

# 12. Definition of Done

The agent must finish only when all achievable items below are true:

- [ ] Repository inspected and existing work preserved.
- [ ] Recommended folder structure created.
- [ ] Expo app uses the latest stable SDK available at implementation time; stable SDK selected rather than beta/canary.
- [ ] Expo Router and TypeScript are configured.
- [ ] Local Kotlin Expo module is generated through Expo's module tooling.
- [ ] App is configured for a custom development build, not Expo Go-only testing.
- [ ] Official Google Nearby Connections dependency and Android permissions are documented and configured based on current official requirements.
- [ ] SQLite persistence layer and repositories are scaffolded.
- [ ] Node.js/TypeScript API structure is created.
- [ ] PostgreSQL and Prisma ORM 7 stable configuration are created.
- [ ] Prisma schema and initial migration are validated.
- [ ] `.env.example` files exist and secrets are not committed.
- [ ] README explains prerequisites, install commands, run commands, environment variables, and known limitations.
- [ ] Expo doctor and TypeScript checks have been run; errors caused by the changes are fixed.
- [ ] Backend schema/type checks have been run.
- [ ] Unimplemented features are clearly marked and never represented as successful.
- [ ] A concise completion report lists files created/modified, commands executed, tests run, and remaining blockers.

---

# 13. Official Documentation to Use

Use current official documentation as the authority for version-sensitive installation details:

- Expo project creation: https://docs.expo.dev/get-started/create-a-project/
- Expo latest SDK reference: https://docs.expo.dev/versions/latest/
- Expo custom native code: https://docs.expo.dev/workflow/customizing/
- Expo Modules API: https://docs.expo.dev/modules/get-started/
- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Google Nearby Connections Android: https://developers.google.com/nearby/connections/android/get-started
- Prisma ORM 7 setup: https://www.prisma.io/docs/orm/v7/getting-started
- Prisma PostgreSQL connector: https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql
- Express documentation: https://expressjs.com/
- PostgreSQL documentation: https://www.postgresql.org/docs/

**Final instruction to the coding agent:** Implement the structure and installation in the existing repository, not just describe it. Follow current official documentation for exact versions and native configuration. Prioritize a real offline SOS creation → persistent local queue → nearby transfer → gateway upload path. Do not overbuild or claim that multi-hop routing works until it has been tested on physical Android devices.
