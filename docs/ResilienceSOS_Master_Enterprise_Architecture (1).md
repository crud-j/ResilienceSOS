# ResilienceSOS --- Master Enterprise Architecture

**Version:** 2.0\
**Status:** Hackathon MVP Architecture / Production Evolution Blueprint\
**Date:** 9 October 2026\
**Product:** ResilienceSOS --- Offline SOS Relay for Android

> **Architecture principle:** Prove reliable emergency-message
> forwarding before adding intelligent detection or production-scale
> complexity.

## 1. Executive Summary

ResilienceSOS is an Android-first, offline-first personal-safety
prototype that lets a user create an SOS alert when their phone has no
internet connection. The app packages minimal incident data, transfers
it to compatible nearby devices, and allows a participating device with
internet access to upload the alert to a backend. The backend can notify
a designated emergency contact by SMS.

The defining capability is **offline emergency-message forwarding**, not
AI-based threat detection. The first release focuses on proving a real
device-to-device relay and clearly communicating what the system has and
has not achieved.

### 1.1 Product promise

> When the originating phone has no internet, ResilienceSOS can attempt
> to pass a compact SOS alert through compatible nearby participating
> devices toward an internet-connected gateway.

This promise is conditional. Successful delivery depends on compatible
devices being nearby, required radios and permissions being available, a
viable forwarding path existing, and a gateway eventually reaching the
internet. ResilienceSOS must never imply that help has been contacted
until the relevant system has confirmed the corresponding step.

### 1.2 MVP success criteria

The MVP is successful when the team can demonstrate, on physical Android
devices:

1.  Device A creates an SOS while it has no internet access.
2.  Device B receives and stores the real alert over a supported nearby
    connection.
3.  Device B forwards the alert to Device C, or the team explicitly
    documents any narrower working topology.
4.  An internet-connected gateway uploads the alert to the backend.
5.  The backend accepts the incident and requests an SMS to a test
    contact.
6.  The app displays truthful states for local creation, relay, backend
    receipt, and SMS provider acceptance.
7.  Duplicate, expired, malformed, and over-limit alerts are handled
    safely.

The MVP is a prototype, not a certified life-safety system. It does not
guarantee emergency response or replace local emergency services.

## 2. Business Context and Product Strategy

### 2.1 Problem statement

Conventional mobile safety applications often rely on the originating
device having cellular or internet connectivity at the moment of an
incident. During outages, disasters, remote travel, or network
congestion, direct reporting may be unavailable.

ResilienceSOS explores a fallback path: nearby compatible devices may
forward an alert until one can reach an internet-connected gateway.

### 2.2 Target users and stakeholders

  -----------------------------------------------------------------------
  Stakeholder             Need                    MVP responsibility
  ----------------------- ----------------------- -----------------------
  Person requesting help  Create an alert and     SOS creation, location
                          understand its status   capture, status clarity

  Relay participant       Safely help forward an  Visible relay mode,
                          alert                   validation, bounded
                                                  forwarding

  Emergency contact       Receive a useful,       SMS with incident time
                          trustworthy             and location link, if
                          notification            available

  Hackathon judge         Verify that the core    Observable, repeatable
                          claim is real           three-device
                                                  demonstration

  Product operator        Diagnose failures       Basic logs, delivery
                                                  events, configuration
                                                  controls

  Future                  Receive reliable,       Out of MVP scope;
  emergency-response      authorized incident     requires separate
  partner                 data                    agreements and
                                                  validation
  -----------------------------------------------------------------------

### 2.3 Product principles

1.  **Truthful status over reassuring fiction.** Never report delivery
    based only on a local action.
2.  **Offline-first incident creation.** An SOS must be saved locally
    even when no network is available.
3.  **Relay is explicit and bounded.** Forward only validated, unexpired
    incidents within configured limits.
4.  **Privacy by minimization.** Collect only the data required to route
    and understand an incident.
5.  **Android-first scope.** One platform and one nearby-communication
    implementation for the MVP.
6.  **Failure is a first-class state.** Show when no relay, location,
    gateway, or notification confirmation is available.
7.  **Demonstrable functionality.** Clearly distinguish live behavior
    from simulated or planned capabilities.
8.  **No unverified life-safety claims.** ResilienceSOS is an
    experimental supplemental communication path.

## 3. Scope and Release Boundaries

### 3.1 MVP --- required

-   React Native application with TypeScript UI/business logic and a small native Kotlin Android module for Nearby Connections and radio/lifecycle integration.
-   Manual hold-to-send SOS control.
-   Short cancellation window and haptic feedback where supported.
-   Location capture with accuracy and timestamp metadata.
-   Compact versioned SOS payload.
-   Google Nearby Connections for device discovery and data exchange.
-   User-visible relay mode.
-   Local persistent queue using Room/SQLite.
-   Duplicate suppression, expiry, hop limit, and payload validation.
-   Gateway upload to a TypeScript/Node.js HTTPS API backed by PostgreSQL and Prisma.
-   Backend incident record and event history.
-   Optional Twilio SMS to a verified test contact.
-   Basic relay diagnostics and a controlled demonstration mode.
-   Clear network and delivery status.
-   Minimal automated tests for payload validation and relay rules.

### 3.2 Explicitly excluded from MVP

-   Continuous microphone monitoring.
-   Scream, glass-break, or gunshot classification.
-   Automatic threat inference.
-   AI triage or AI dispatch.
-   Automatic police, ambulance, or fire-service dispatch.
-   Guaranteed global or city-scale mesh coverage.
-   iOS client or cross-platform interoperability.
-   Custom BLE/Wi-Fi Direct transport protocol.
-   Complex hardware-enclave identity infrastructure.
-   Arbitrary background execution guarantees.
-   Cloud incident clustering based on a fixed geographic radius.
-   Transmission or storage of audio recordings.
-   Claims of production-grade reliability or certification.

### 3.3 Post-MVP candidates

-   Carefully tested hardware-button shortcuts where permitted by
    Android.
-   Optional, opt-in on-device audio classification.
-   Stronger origin authentication and signed incident envelopes.
-   More extensive relay scheduling and battery-aware behavior.
-   Android background reliability improvements and device compatibility
    matrix.
-   iOS client using a separately designed compatible transport
    strategy.
-   Partner integrations with authorized response organizations.
-   Independent security, privacy, accessibility, and field reliability
    reviews.

## 4. Logical Architecture

``` mermaid
flowchart TD
    U[User] --> APP[Android ResilienceSOS App]
    APP --> TR[Manual SOS Trigger]
    TR --> LOC[Location Capture]
    LOC --> PACK[Create and Validate Incident Packet]
    PACK --> DB[(Local Room Database)]
    DB --> RELAY[Nearby Connections Relay Service]

    RELAY <--> PEER[Compatible Nearby Peer]
    PEER --> VALID[Validate, Deduplicate, Check Expiry and Hop Limit]
    VALID --> PEERDB[(Peer Persistent Queue)]
    PEERDB --> NEXT[Forward to Another Compatible Peer]
    NEXT --> GATEWAY[Internet-Connected Gateway Device]

    GATEWAY --> API[Authenticated Backend API]
    API --> VALIDATE[Server Validation and Idempotency]
    VALIDATE --> PRISMA[Prisma ORM]
    PRISMA --> PG[(PostgreSQL)]
    PG --> INCIDENT[Incident Records]
    PG --> EVENTS[Delivery Event Log]
    VALIDATE --> NOTIFY[Notification Worker]
    NOTIFY --> SMS[SMS Provider]
    SMS --> CONTACT[Designated Test Contact]

    API --> STATUS[Status Response]
    STATUS --> APP
```

**Architecture note:** The diagram expresses intended application
behavior. Nearby Connections provides peer discovery and connections;
the application must implement forwarding, persistent queues,
deduplication, expiry, and hop limits. A diagram does not prove that
arbitrary multi-hop routing works. Validate the exact topology on
physical devices before claiming mesh behavior.

### 4.1 System boundaries

**On-device boundary** - SOS interaction - Location acquisition -
Incident packet creation - Local storage - Peer discovery and transfer -
Relay policy enforcement - Status presentation

**Cloud boundary** - Gateway API - Payload validation - Idempotent
incident ingestion - Incident persistence - Notification request and
provider integration - Operational event records

**External boundary** - Nearby Android devices - SMS provider -
User-designated contact - Location provider and mapping application

The MVP does not directly integrate with public emergency dispatch
systems.

## 5. Recommended Technology Stack

  ------------------------------------------------------------------------
  Layer             MVP choice        Responsibility     Constraint
  ----------------- ----------------- ------------------ -----------------
  Mobile            React Native +   UI, app state,     Android-first MVP;
                    TypeScript        SOS flow           test native bridge
                                                         on devices

  UI                React Native      Accessible,        Do not delay
                    components        responsive         networking to
                                      interface          rewrite UI                              

  Nearby transport  Google Nearby     Discovery and      Must be tested on
                    Connections       device-to-device   actual devices
                                      data transfer      

  Local persistence SQLite via a      Incident queue and Persist before
                    maintained RN     processed IDs      forwarding
                    adapter

  Backend           TypeScript /      Validate and       Keep one clear
                    Node.js HTTPS API ingest gateway     ingestion path
                                      uploads

  Database          PostgreSQL        Canonical incident Use managed DB,
                    via Prisma ORM    and event storage  least privilege,
                                                         backups

  SMS               Twilio, only if   Notify test        Provider
                    account and       contact            acceptance is not
                    destination are                      proof of reading
                    ready                                

  Maps              HTTPS map link    Let contact view   Include accuracy
                    using available   reported location  and capture time
                    coordinates                          

  Testing           Physical Android  Verify real        Emulator-only
                    devices + unit    transfer and       results are
                    tests             failure handling   insufficient

  Version control   Git and GitHub    Reproducible       Never commit
                                      source and         secrets
                                      collaboration      
  ------------------------------------------------------------------------

Avoid introducing a separate Python AI service, custom network daemon, or multiple backend frameworks. PostgreSQL is the canonical cloud database; Prisma is the ORM/schema and migration layer, not a separate database. Keep the backend as one small TypeScript/Node.js API.

## 6. Mobile Application Architecture

Use React Native + TypeScript for the app UI and ordinary application logic, with a narrow native Kotlin module for Google Nearby Connections, required Android permissions, and radio/connection lifecycle. Keep the backend as a separate small TypeScript/Node.js API. Use a small layered structure rather than a large enterprise microservice design.

``` text
resilience-sos/
├── src/
│   ├── screens/       # Home, SOS, incident, relay, settings
│   ├── components/
│   ├── navigation/
│   ├── domain/        # Incident types and relay policy
│   ├── data/          # Room/native bridge adapter, API client
│   ├── state/
│   └── diagnostics/
├── android/
│   └── app/src/main/java/.../nearby/  # Native Kotlin bridge
└── backend/
    ├── src/           # TypeScript API and validation
    └── prisma/
        └── schema.prisma
```

### 6.1 Main modules

**Presentation (React Native)** - Home and network status. - SOS creation and cancellation. - Incident timeline. - Relay participation and diagnostics. - Contact and permission settings.

**Domain** - Create incident. - Validate incident. - Queue incident. -
Receive and process incident. - Forward incident. - Upload incident
through gateway. - Update delivery state.

**Data** - Offline persistent store (Room/SQLite through a native module, or a vetted React Native SQLite adapter). - TypeScript API client. - Native Kotlin Nearby Connections bridge. - SMS status received from backend.

**Relay service** - Explicitly enabled discovery and advertising. -
Connection lifecycle handling. - Incoming payload processing. -
Store-and-forward orchestration. - Retry with bounded backoff.

Android background-service constraints apply. The app must not promise
uninterrupted background discovery across all Android versions, OEMs,
battery states, or permission configurations. For the MVP, a visible,
user-enabled relay session is safer to demonstrate and debug than
claiming an always-on covert listener.

### 6.2 Primary UI screens

1.  **Home:** SOS control, internet state, nearby connection state,
    queued incidents.
2.  **SOS confirmation:** incident details, cancellation window, capture
    status.
3.  **Incident details:** incident ID, captured location, accuracy,
    time, current delivery state.
4.  **Relay mode:** whether advertising/discovery is active, connected
    peer count if reliably known, queued relay count.
5.  **Diagnostics:** permission state, radio availability, connection
    errors, backend reachability.
6.  **Settings:** emergency contact, consent, privacy information, relay
    opt-in.

## 7. SOS Incident Lifecycle and State Machine

Use explicit states; do not collapse them into a generic green "Sent"
status.

``` mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Created: User confirms SOS
    Draft --> Cancelled: User cancels
    Created --> Queued: Persisted locally
    Queued --> Relaying: Nearby transfer starts
    Relaying --> Relayed: Peer acknowledges receipt
    Relaying --> Queued: Transfer fails or peer disappears
    Relayed --> GatewayQueued: A relay retains the incident
    GatewayQueued --> Uploaded: Backend accepts incident
    Uploaded --> NotificationRequested: Notification job created
    NotificationRequested --> ProviderAccepted: SMS provider accepts request
    NotificationRequested --> NotificationFailed: Provider request fails
    Queued --> Expired: Incident TTL reached
    Relaying --> Expired: Incident TTL reached
    Relayed --> Expired: Incident TTL reached
```

The state diagram represents the originating device's simplified view.
Relay devices and the backend should maintain their own per-incident
processing states.

### 7.1 Status semantics

  -----------------------------------------------------------------------
  Status                              Exact meaning
  ----------------------------------- -----------------------------------
  `CREATED`                           SOS event created on the
                                      originating device

  `QUEUED`                            Incident persisted locally and
                                      awaiting an available route

  `RELAYED`                           A compatible peer acknowledged
                                      receiving the incident

  `UPLOADED`                          Backend validated and persisted the
                                      incident

  `SMS_REQUESTED`                     Backend initiated an SMS send
                                      request

  `SMS_PROVIDER_ACCEPTED`             SMS provider accepted the request

  `SMS_DELIVERED`                     Only used if provider delivery
                                      status explicitly confirms it

  `ACKNOWLEDGED`                      Recipient explicitly acknowledged,
                                      if such a feature is implemented

  `EXPIRED`                           Incident exceeded its configured
                                      validity period

  `FAILED`                            A specific, recorded failure
                                      prevented the attempted step
  -----------------------------------------------------------------------

Never use `RELAYED` to mean that emergency contacts have been notified.

## 8. Incident Data Contract

Keep the payload compact and versioned. Do not transmit audio in the
MVP.

### 8.1 Example payload

``` json
{
  "schema_version": 1,
  "incident_id": "uuid",
  "origin_id": "opaque-random-id",
  "created_at": "2026-10-09T00:00:00Z",
  "expires_at": "2026-10-09T00:30:00Z",
  "incident_type": "USER_INITIATED_SOS",
  "location": {
    "latitude": 14.000000,
    "longitude": 120.000000,
    "accuracy_m": 25.0,
    "captured_at": "2026-10-09T00:00:00Z"
  },
  "battery_percent": 54,
  "hop_count": 0
}
```

The coordinates are illustrative placeholders, not an actual location.
Use a real incident UUID in implementation. Avoid placing phone numbers,
contact details, or unnecessary personal identifiers in relay
broadcasts.

### 8.2 Required validation

-   Supported schema version.
-   Valid incident ID format.
-   Required fields present and correctly typed.
-   Latitude and longitude within valid ranges.
-   Timestamp and expiry within acceptable limits.
-   Maximum packet size.
-   Hop count within the configured maximum.
-   Incident not expired.
-   Incident ID not already processed by that relay.
-   Valid connection/session context.
-   No executable content or untrusted commands in payload fields.

### 8.3 Incident ID and origin identity

Use a random incident identifier generated once per SOS. Every relay
preserves that ID while updating relay metadata such as hop count and
last-forwarded time.

For the MVP, use the secure transport provided by the selected nearby
API, validate all fields, and enforce bounded forwarding. Do not claim
cryptographic proof of the original user's identity unless origin
authentication and signature verification are actually implemented and
tested.

## 9. Peer-to-Peer Relay Protocol

### 9.1 Connection workflow

1.  User explicitly enables relay mode.
2.  The device checks Bluetooth, required permissions, and transport
    availability.
3.  Nearby Connections advertises and discovers compatible application
    endpoints.
4.  Devices establish and authenticate the supported connection
    according to the API's connection workflow.
5.  A sender transmits a versioned incident packet.
6.  Receiver validates the packet.
7.  Receiver checks incident ID, expiry, hop limit, and local processing
    history.
8.  Receiver persists the incident before acknowledging it.
9.  Receiver schedules bounded forwarding when another compatible peer
    is available.
10. Gateway-capable device uploads eligible incidents to the backend.

### 9.2 Relay policy

Recommended initial demonstration defaults:

  ------------------------------------------------------------------------
  Setting                            Initial default Reason
  --------------------- ---------------------------- ---------------------
  Incident expiry                         30 minutes Limits stale alert
                                                     propagation

  Maximum hops                                     5 Bounds forwarding
                                                     loops

  Maximum packet size                           4 KB Prevents unexpectedly
                                                     large packets

  Duplicate retention       At least incident expiry Suppresses repeated
                                                     processing

  Retry policy              Exponential backoff with Avoids rapid retry
                                              jitter loops

  Concurrent demo               1 per peer initially Reduces debugging
  transfers                                          complexity

  Relay mode                   User-enabled, visible Improves consent and
                                                     observability
  ------------------------------------------------------------------------

These are prototype defaults. Validate and tune them through testing;
they are not certified emergency-network settings.

### 9.3 Reliability behavior

-   Persist before acknowledging receipt.
-   Treat acknowledgement as proof of peer receipt only.
-   Retry transient failures with a bounded policy.
-   Keep queued incidents across process restarts.
-   Do not forward expired incidents.
-   Do not endlessly forward to the same peer.
-   Record transfer attempt time and failure reason.
-   Handle peer disconnection during transfer.
-   Avoid assuming that discovery means a successful data connection.
-   Avoid assuming that a connection to one peer creates a route to
    every other peer.

### 9.4 Multi-hop proof requirement

The architecture must not claim a functioning multi-hop mesh until the
team has demonstrated:

**A creates → B receives and persists → B forwards → C receives → C
uploads.**

If the selected Nearby Connections topology or implementation cannot
support the intended concurrent forwarding arrangement, document the
actual topology and use a tested relay design rather than assuming that
the API supplies automatic routing.

## 10. Backend Architecture

Use one small TypeScript/Node.js API (Express, Fastify, or NestJS only if the team already knows it). Prisma is the ORM and migration tool; PostgreSQL is the source of truth. The mobile app and relay peers must never connect directly to PostgreSQL. Keep `DATABASE_URL` on the server only.

### 10.1 Minimum backend responsibilities

-   Authenticate or otherwise validate gateway uploads.
-   Validate payload size, schema, timestamps, and incident fields.
-   Enforce idempotency on `incident_id`.
-   Persist incident records.
-   Record gateway receipt time.
-   Enqueue a notification request.
-   Send an SMS through the configured provider.
-   Record provider response and delivery callbacks, if available.
-   Expose an incident status response to authorized clients.
-   Apply rate limits and audit security-relevant actions.

### 10.2 API outline

  -----------------------------------------------------------------------------
  Endpoint                                  Purpose
  ----------------------------------------- -----------------------------------
  `POST /v1/incidents`                      Ingest an incident from an
                                            authorized gateway

  `GET /v1/incidents/{id}`                  Read incident status with
                                            appropriate authorization

  `POST /v1/incidents/{id}/notifications`   Request or retry an authorized
                                            notification

  `POST /v1/provider/sms-status`            Receive SMS provider status
                                            callbacks
  -----------------------------------------------------------------------------

These are proposed API contracts, not existing endpoints. Implement only
what is needed for the demo.

### 10.3 Example incident record

``` json
{
  "incident_id": "uuid",
  "status": "UPLOADED",
  "created_at": "server-validated-time",
  "gateway_received_at": "server-time",
  "origin_location": {
    "latitude": 14.0,
    "longitude": 120.0,
    "accuracy_m": 25.0
  },
  "hop_count": 2,
  "notification_status": "PENDING"
}
```

The server must distinguish device-provided timestamps from
server-observed timestamps. Do not trust a client timestamp as proof of
when the backend received an incident.

### 10.4 Idempotency and duplicate notifications

Use `incident_id` as the idempotency key for incident ingestion. Store
notification attempts separately and enforce a policy that prevents
duplicate SMS messages on retried uploads unless a deliberate retry is
authorized.

Do not cluster separate incidents solely because they fall within 100
meters of one another. Two people in the same area may be experiencing
unrelated emergencies. Incident correlation is a later, separately
validated feature.

### 10.5 Initial Prisma schema

Store the following in `backend/prisma/schema.prisma`. This is a practical MVP baseline; validate it against the chosen Prisma version and database before applying migrations. Keep coordinates as scalar columns for simple indexing and avoid storing unnecessary personal data.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum IncidentStatus {
  RECEIVED
  VALIDATED
  NOTIFICATION_PENDING
  NOTIFICATION_REQUESTED
  CLOSED
  EXPIRED
}

enum NotificationStatus {
  PENDING
  ACCEPTED_BY_PROVIDER
  DELIVERED
  FAILED
  UNKNOWN
}

model Incident {
  id                  String              @id @default(uuid()) @db.Uuid
  clientIncidentId    String              @unique @db.VarChar(80)
  status              IncidentStatus      @default(RECEIVED)
  originCreatedAt     DateTime?
  gatewayReceivedAt   DateTime            @default(now())
  originLatitude      Decimal?            @db.Decimal(9, 6)
  originLongitude     Decimal?            @db.Decimal(9, 6)
  locationAccuracyM   Decimal?            @db.Decimal(8, 2)
  locationCapturedAt  DateTime?
  hopCount            Int                 @default(0)
  payloadVersion      Int                 @default(1)
  gatewayId           String?             @db.VarChar(100)
  events              DeliveryEvent[]
  notifications       NotificationAttempt[]
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([status, gatewayReceivedAt])
  @@index([originLatitude, originLongitude])
}

model DeliveryEvent {
  id             String   @id @default(uuid()) @db.Uuid
  incidentId     String   @db.Uuid
  eventType      String   @db.VarChar(60)
  deviceId       String?  @db.VarChar(100)
  hopNumber      Int?
  occurredAt     DateTime @default(now())
  details        Json?
  incident       Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)

  @@index([incidentId, occurredAt])
}

model NotificationAttempt {
  id                String             @id @default(uuid()) @db.Uuid
  incidentId        String             @db.Uuid
  status            NotificationStatus @default(PENDING)
  provider          String             @db.VarChar(40)
  providerMessageId String?            @unique @db.VarChar(160)
  idempotencyKey    String             @unique @db.VarChar(160)
  destinationHash   String?            @db.VarChar(128)
  attemptedAt       DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  errorCode         String?            @db.VarChar(80)
  incident          Incident           @relation(fields: [incidentId], references: [id], onDelete: Cascade)

  @@index([incidentId, attemptedAt])
}
```

**Schema notes:** `clientIncidentId` is the client-generated incident identifier used for idempotent uploads; the server's `id` is the canonical database UUID. The gateway should send the same `clientIncidentId` on every retry. Use a transaction when creating an incident and its initial event. Create a notification attempt only once per idempotency key, and do not treat provider acceptance as proof that the recipient read the SMS. `destinationHash` is optional and must use a deliberate, secret-keyed hashing strategy if needed; do not store raw phone numbers in general event logs.

Suggested setup commands (run from the backend project):

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init --datasource-provider postgresql
# Add DATABASE_URL to the backend's untracked .env file.
npx prisma migrate dev --name init_resilience_sos
npx prisma generate
```

For deployment, apply committed migrations with `npx prisma migrate deploy`; do not use `migrate dev` against production. Keep `.env` out of Git and provide a least-privilege database user.

## 11. Security, Privacy, and Abuse Prevention

### 11.1 Threat model

  -----------------------------------------------------------------------
  Threat                              Mitigation in MVP
  ----------------------------------- -----------------------------------
  Accidental SOS                      Hold-to-send, cancellation window,
                                      clear state

  Malformed packet                    Strict schema and size validation

  Repeated forwarding                 Incident deduplication, expiry, hop
                                      limit

  Fake or malicious incident          Rate limits, validated gateway
                                      ingestion, abuse logs

  Unauthorized incident access        Backend authorization and
                                      restrictive database rules

  Contact number exposure             Keep contact data out of peer
                                      payloads

  Location leakage                    Minimal location sharing, visible
                                      relay consent, access controls

  Replayed stale alert                Expiry and processed-incident cache

  SMS spam                            Per-incident notification
                                      idempotency and backend rate limits

  Credential leakage                  Environment configuration, secret
                                      manager, no secrets in Git
  -----------------------------------------------------------------------

### 11.2 Privacy rules

-   Capture location only when needed for the user-initiated incident.
-   Explain what location is shared and why.
-   Avoid storing or forwarding audio in the MVP.
-   Avoid broadcasting personal phone numbers through nearby discovery.
-   Restrict incident details to authorized recipients and services.
-   Set retention limits and provide a deletion policy appropriate to
    the prototype.
-   Use test contacts and clearly labeled demo incidents during the
    event.
-   Obtain consent from participants whose phones act as relays.
-   Document that location and alert delivery may be delayed or
    unavailable.

### 11.3 Security limitations

The MVP is not a hardened emergency communications network. Transport
encryption does not automatically prove the identity of the original SOS
sender, protect a compromised endpoint, or prevent every malicious
relay. Stronger origin authentication, key management, revocation, and
independent security testing are post-MVP requirements.

## 12. Observability and Diagnostics

Expose only states that the app can actually observe.

### Mobile diagnostic fields

-   Bluetooth/radio availability.
-   Required permission status.
-   Advertising/discovery status.
-   Peer connection state.
-   Incident queue count.
-   Last transfer attempt and result.
-   Last successful peer acknowledgement.
-   Pending upload count.
-   Last backend response.
-   Location availability, accuracy, and capture time.

### Backend event fields

-   Incident ID.
-   Server receipt timestamp.
-   Gateway identifier.
-   Validation result.
-   Idempotency outcome.
-   Notification request ID.
-   SMS provider message ID and status, if returned.
-   Failure category.

Avoid logging unnecessary precise location, phone numbers, or full
payloads in general debug logs. Provide a demo diagnostic view without
exposing sensitive values.

## 13. Failure Modes and Recovery

  -----------------------------------------------------------------------
  Failure                 Expected behavior       User-facing status
  ----------------------- ----------------------- -----------------------
  No location available   Create SOS without      "SOS created; location
                          coordinates if policy   unavailable"
                          permits                 

  No nearby peers         Keep incident queued    "Waiting for a
                          locally                 compatible relay"

  Peer disconnects        Retain incident and     "Relay interrupted;
                          retry later             alert queued"

  Duplicate packet        Ignore repeat           No duplicate incident
                          processing              

  Expired incident        Stop forwarding and     "Alert expired before
                          record expiry           gateway delivery"

  No internet gateway     Preserve queued         "Waiting for an
                          incident on relay       internet-connected
                                                  gateway"

  Backend unavailable     Retry boundedly         "Gateway upload
                                                  pending"

  SMS provider error      Record failure and      "Alert uploaded; SMS
                          expose retry policy     not confirmed"

  App process stops       Recover queued          "Pending alerts
                          incidents from          restored"
                          persistent storage      

  Permission revoked      Stop the affected       "Relay unavailable:
                          function and explain    permission required"
                          how to restore it       
  -----------------------------------------------------------------------

A failed route must not silently delete the incident. If the device can
no longer make progress, show the limitation rather than suggesting that
help is on the way.

## 14. Testing and Acceptance Criteria

### 14.1 Required physical-device tests

  -----------------------------------------------------------------------
  Test                    Procedure               Pass condition
  ----------------------- ----------------------- -----------------------
  Local SOS               Create an SOS without   Incident persists
                          internet                locally

  Offline peer transfer   Disable internet and    B validates and stores
                          send A → B              the packet

  Multi-hop relay         A → B → C               C receives the same
                                                  incident ID

  Gateway upload          C connects to internet  Backend persists the
                                                  incident

  SMS request             Backend requests SMS    Provider returns an
                                                  identifiable response

  Duplicate suppression   Forward the same packet Only one incident
                          twice                   record and no duplicate
                                                  notification

  Expiry                  Send an expired packet  Receiver refuses
                                                  forwarding

  Hop limit               Send packet at maximum  Receiver refuses
                          hops                    additional forwarding

  Disconnection           Disconnect a peer       Incident remains queued
                          during transfer         and retryable

  Permission failure      Revoke a required       App shows a clear
                          permission              failure state

  Location unavailable    Disable location access App communicates that
                                                  location is missing

  Screen-off/background   Test supported          Results documented for
                          lifecycle scenarios     each device; no
                                                  unsupported guarantee
  -----------------------------------------------------------------------

### 14.2 Definition of done

The MVP is ready for presentation when:

-   The critical A → B → C flow succeeds repeatedly on the selected
    devices.
-   The team can demonstrate the flow without manually editing a
    database.
-   Gateway ingestion is real, not simulated.
-   The SMS provider request is real, if SMS is included in the claim.
-   Failure states are visible and truthful.
-   Duplicate and expired alerts are rejected.
-   The README identifies the tested devices, Android versions, radio
    configuration, and known limitations.
-   No credentials or real users' private data are exposed in the
    repository.

Record the number of successful runs and total attempts. Do not
advertise a reliability percentage based on a tiny or selectively chosen
sample as a production reliability guarantee.

## 15. Hackathon Demonstration Plan

### Demo sequence

**Step 1 --- Establish the offline condition** - Show Device A has no
internet access. - Confirm required Bluetooth/radio settings and
permissions. - Trigger an SOS using the visible in-app control.

**Step 2 --- Show the real relay** - Device B receives the incident
ID. - Display receipt time and "stored for forwarding." - Device B
forwards the same incident to Device C.

**Step 3 --- Show gateway recovery** - Device C has internet access. - C
uploads the incident to the backend. - Display the backend's actual
acknowledgement.

**Step 4 --- Show contact notification** - The backend requests an SMS
to a consenting test contact. - Display the provider response. - Open
the map link if location was captured. - Distinguish provider acceptance
from confirmed delivery or recipient acknowledgement.

**Step 5 --- Demonstrate resilience** - Repeat a packet to show
deduplication. - Send an expired packet to show it is rejected. - If
time permits, disconnect a peer and show the incident remains queued.

### Demo honesty rule

If a component is simulated, label it as simulated. If only one-hop
transfer works, call it a one-hop prototype. Do not describe a
successful A → B transfer as proof of arbitrary multi-hop routing.

### Fallback plan

Prepare a pre-recorded video of a genuine successful run, including
visible device states and the backend event. Use it only as a clearly
identified fallback if hardware or venue conditions fail. A video does
not substitute for describing which parts are live.

## 16. Team Responsibilities and Work Priorities

Assign ownership by dependency, not by feature glamour.

  -----------------------------------------------------------------------
  Workstream              Responsibility          Priority
  ----------------------- ----------------------- -----------------------
  Networking spike        Prove Nearby discovery, P0
                          transfer, and intended  
                          relay topology          

  Mobile SOS flow         Trigger, location,      P0
                          local queue, status     
                          states                  

  Relay logic             Validation,             P0
                          persistence,            
                          deduplication, expiry,  
                          hop limits              

  Backend and SMS         Ingestion, idempotency, P1
                          provider request        

  UI/UX                   Clear SOS control,      P1
                          truthful statuses,      
                          relay diagnostics       

  QA/demo                 Device setup,           P0
                          repeatability, logs,    
                          fallback video          

  AI, iOS, advanced       Deferred roadmap        P2
  cryptography                                    
  -----------------------------------------------------------------------

If the team is small, combine UI with mobile work and backend with
testing, but keep one person accountable for the networking proof.

## 17. Delivery Roadmap

### Phase 0 --- Technical feasibility

-   Confirm the exact devices and Android versions.
-   Verify permissions and radio settings.
-   Prove a real nearby transfer.
-   Prove the intended multi-hop arrangement.

**Exit gate:** A → B → C forwarding works on physical devices.

### Phase 1 --- Reliable offline incident handling

-   Implement the manual SOS.
-   Define and validate the payload.
-   Persist locally.
-   Add deduplication, expiry, and hop limit.
-   Handle connection loss.

**Exit gate:** Alerts survive interrupted transfers and are not
forwarded indefinitely.

### Phase 2 --- Gateway and notification

-   Implement backend ingestion.
-   Add idempotent persistence.
-   Integrate SMS if available.
-   Report backend and provider statuses.

**Exit gate:** One real alert reaches the backend and produces an
observable notification-provider result.

### Phase 3 --- Demo polish

-   Complete the core screens.
-   Add diagnostics.
-   Rehearse the demonstration.
-   Document limitations and tested configurations.

**Exit gate:** The complete flow can be reproduced and explained
clearly.

### Phase 4 --- Post-hackathon hardening

-   Broaden device and lifecycle testing.
-   Review privacy and security.
-   Improve battery and reconnection behavior.
-   Evaluate authenticated origin signatures.
-   Research opt-in acoustic detection and cross-platform compatibility.
-   Conduct usability and accessibility reviews.

## 18. Risks and Mitigation Priorities

  -----------------------------------------------------------------------
  Risk                    Severity                Mitigation
  ----------------------- ----------------------- -----------------------
  Multi-hop routing fails Critical                Prove it first;
  on the selected API                             redesign the topology
  topology                                        before adding features

  OS restrictions stop    High                    Use visible relay mode
  discovery in the                                and document tested
  background                                      lifecycle behavior

  Insufficient compatible High                    Explain the dependency;
  devices nearby                                  do not claim universal
                                                  coverage

  No internet-connected   High                    Persist and clearly
  gateway is reachable                            report queued status

  False SOS or spam       High                    Confirmation,
                                                  validation, expiry,
                                                  rate limits,
                                                  idempotency

  Sensitive location is   High                    Data minimization,
  exposed                                         consent, access
                                                  control, retention
                                                  policy

  SMS credentials or      Medium--high            Validate early and
  destination setup fails                         maintain an honest
                                                  non-SMS fallback

  UI claims more than the High                    State machine and
  system knows                                    strict status semantics

  Too much scope for 24   Critical                Defer AI, iOS, advanced
  hours                                           dispatch, and custom
                                                  transport
  -----------------------------------------------------------------------

## 19. Post-MVP Enterprise Evolution

"Enterprise architecture" should mean clear boundaries, governance,
reliability objectives, and a controlled evolution path---not
unnecessary microservices during a hackathon.

After the MVP proves the core relay, future architecture can introduce:

-   **Identity and trust:** origin authentication, key lifecycle,
    revocation, device integrity assessment where appropriate.
-   **Resilient routing:** better peer selection, queue scheduling,
    congestion controls, battery-aware relaying, and measured delivery
    behavior.
-   **Backend scalability:** separate ingestion, notification workers,
    audit pipeline, operational monitoring, and retention management
    only when justified by load.
-   **Emergency partnerships:** formal authorization, escalation
    policies, data-sharing agreements, and verified integrations.
-   **Platform expansion:** a separately validated iOS strategy and
    interoperability design.
-   **Optional AI:** opt-in on-device event classification with
    documented accuracy, privacy behavior, and a non-AI fallback.
-   **Governance:** threat modeling, incident response procedures,
    privacy impact assessment, accessibility review, and independent
    security testing.

Do not assign production service-level objectives or emergency-delivery
guarantees until field data, failure analysis, and independent testing
support them.

## 20. Architecture Decision Records

### ADR-001 --- Android-first

**Decision:** Build the MVP for native Android.\
**Reason:** Reduce platform variability and focus engineering effort on
the relay.\
**Consequence:** No iOS compatibility claim.

### ADR-002 --- Nearby Connections

**Decision:** Use Google Nearby Connections as the initial transport.\
**Reason:** Avoid creating a custom transport protocol under a severe
time limit.\
**Consequence:** Validate topology and device behavior; forwarding
remains application logic.

### ADR-003 --- User-initiated SOS

**Decision:** Use an in-app hold-to-send trigger as the reliable
baseline.\
**Reason:** Avoid relying on unverified global hardware-key
interception.\
**Consequence:** Covert or lock-screen activation is not an MVP promise.

### ADR-004 --- No continuous audio

**Decision:** Exclude microphone monitoring and audio transmission.\
**Reason:** Reduce privacy, permission, model-accuracy, and
implementation risks.\
**Consequence:** No automatic acoustic threat detection in the MVP.

### ADR-005 --- Persistent store-and-forward

**Decision:** Persist incident packets before acknowledging or
forwarding them.\
**Reason:** Recover from interrupted connections and process restarts.\
**Consequence:** Queue expiry and cleanup must be implemented.

### ADR-006 --- Truthful delivery states

**Decision:** Track local creation, peer receipt, backend acceptance,
and SMS provider state separately.\
**Reason:** Prevent misleading life-safety claims.\
**Consequence:** UI must reflect backend and transport evidence
accurately.

### ADR-007 --- Idempotent incident ingestion

**Decision:** Use incident ID to prevent duplicate incident creation and
notification requests.\
**Reason:** Relays and gateways may retry.\
**Consequence:** Backend storage and notification processing need
idempotency controls.

### ADR-008 --- No automatic dispatch

**Decision:** Notify designated test contacts only in the MVP.\
**Reason:** Avoid implying an unauthorized or unverified
emergency-service integration.\
**Consequence:** Public emergency dispatch remains out of scope.

## 21. Final Architecture Position

ResilienceSOS should be judged first as an **offline incident-forwarding
prototype**, not as a complete AI-powered emergency-response platform.

The architecture's central hypothesis is testable:

> Can an SOS created on a phone without internet be persisted,
> transferred through compatible nearby devices, and eventually uploaded
> by a gateway that has connectivity?

Everything in the MVP should support answering that question.

If the answer is demonstrated with real devices, observable backend
records, truthful delivery states, and a polished interface,
ResilienceSOS will have a much stronger technical story than a broad
architecture full of unverified capabilities.

**Build the smallest system that proves the hardest claim. Then expand
it only when evidence justifies the next layer.**
