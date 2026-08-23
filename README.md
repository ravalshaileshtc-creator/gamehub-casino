<div align="center">
  <h1>🎰 Next.js Full Stack Cryptographic Gambling Platform</h1>
  <p><strong>A production-ready, highly secure, and provably fair gambling platform baseline.</strong></p>
  <p>Built exclusively on Next.js 15, React 19, Tailwind CSS v4, Prisma (PostgreSQL), and Redis (Upstash) with a heavy emphasis on <strong>auditability</strong>, <strong>transactional integrity</strong>, and <strong>race-condition prevention</strong>.</p>
</div>

---

## 📖 Table of Contents
1. [Executive Overview & Philosophy](#-executive-overview--philosophy)
2. [Deep System Design & Architecture](#-deep-system-design--architecture)
   - [High-Level Flow](#high-level-flow)
   - [The Immutable Ledger System](#the-immutable-ledger-system-critical)
   - [Database Schema (Relational Breakdown)](#database-schema-relational-breakdown)
   - [Race Condition Prevention & Idempotency](#race-condition-prevention--idempotency)
3. [Provably Fair Cryptography](#-provably-fair-cryptography)
4. [Real-Time WebSocket Infrastructure](#-real-time-websocket-infrastructure)
5. [Anti-Cheat, Security & Compliance](#-anti-cheat-security--compliance)
6. [UI/UX & Frontend Architecture](#-uiux--frontend-architecture)
7. [In-Depth Project Structure](#-in-depth-project-structure)
8. [Comprehensive Local Setup Guide](#-comprehensive-local-setup-guide)
9. [Deployment & Production Readiness](#-deployment--production-readiness)

---

## 🎯 Executive Overview & Philosophy

This project is not a simple "website." It is a financial engine wrapped in a gaming interface. The core philosophy of this platform is **zero trust in the client**. 
*   **The Frontend (Next.js App Router):** Is treated purely as a reactive display and user-intent collector. It holds no authority over money, odds, or game results.
*   **The Backend (Next.js API + Services):** Acts as the absolute source of truth. It validates every single request mathematically and cryptographically before interacting with the database.

### The 14 Integrated Games:
The platform comes pre-built with full mathematical models and React components for:
`Baccarat`, `Blackjack`, `CoinFlip`, `Crash`, `DiceRoll`, `HiLo`, `Keno`, `Limbo`, `Mines`, `Plinko`, `Roulette`, `Slots`, `Video Poker`, and `Wheel`.

---

## 🏗 Deep System Design & Architecture

### High-Level Flow
Every critical request (like placing a bet or withdrawing funds) follows a strict pipeline:

```mermaid
sequenceDiagram
    participant User as Client (Next.js UI)
    participant API as /app/api/route
    participant Redis as Redis (Upstash)
    participant PF as Provably Fair Service
    participant Wallet as Ledger Service
    participant DB as PostgreSQL (Prisma)

    User->>API: POST /api/games/dice/bet {wager, clientSeed, target}
    API->>Redis: Lock request (Idempotency Key) + Rate Limit Check
    Redis-->>API: Allow / Deny
    API->>Wallet: Validate Balance (wager) & Deduct
    Wallet->>DB: ATOMIC Row Lock + Create Transaction (BET)
    API->>PF: Resolve Game Outcome (serverSeed + clientSeed + nonce)
    PF-->>API: Outcome Result (Win/Loss, Payout)
    alt isWin == true
        API->>Wallet: Add Funds
        Wallet->>DB: ATOMIC Row Lock + Create Transaction (WIN)
    end
    API->>DB: Record 'Bet' with seeds used (for audit)
    API-->>User: Response {payout, profit, result}
```

### The Immutable Ledger System (CRITICAL)
Most platforms fail because they store user balances like this: `[User.balance = 500] -> [User.balance = 600]`. If a request is duplicated, money is printed from nowhere.
This platform strictly implements an **Immutable Ledger Model**.
*   The `Transaction` table is the sole source of truth.
*   The literal formula for a user's wallet balance is: `SUM(All DEPOSITS + WINS) - SUM(All WITHDRAWALS + BETS)`.
*   Whenever a user places a bet:
    1. A `Transaction` is logged with type `BET` and the `balanceBefore` and `balanceAfter` are recorded.
    2. If the user wins, a second separate `Transaction` of type `WIN` is logged instantly.
*   No financial row is *ever* deleted. "Reversals" are handled by issuing opposing transactions (e.g., `ADJUSTMENT`).

### Database Schema (Relational Breakdown)
Operating on PostgreSQL via **Prisma ORM**, the primary entities are tightly constrained:

*   **`User`**: Core identity. Stores Auth credentials, 2FA keys, unified KYC state, VIP Wagered amounts, and the active `ServerSeed`/`ClientSeed` required for the next bet.
*   **`Transaction`**: The holy grail of the platform. Enums define `DEPOSIT`, `WITHDRAWAL`, `BET`, `WIN`, and `BONUS`.
*   **`Bet`**: Connects to the User and Game. Stores the exact cryptographic seeds utilized at the millisecond the bet was processed. It holds a JSON `result` column for game-specific data (e.g., exactly what cards were drawn in Blackjack).
*   **`Withdrawal` / `Deposit`**: Handles fiat and cryptocurency lifecycle states (`PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED`).

### Race Condition Prevention & Idempotency
To prevent users from exploiting the platform by spamming buttons, refreshing rapidly, or manipulating network latency:
1. **Idempotency Keys (`src/services/idempotency.service.ts`)**: Every request generates a unique hash based on User ID + Action. This hash is temporarily stored in Redis/DB. If another request with the same hash arrives within `X` milliseconds, it is violently rejected.
2. **Atomic Locks**: Prisma `update` queries use native database row-locks preventing parallel balance reads/writes from overlapping.

---

## 🎲 Provably Fair Cryptography

The fundamental requirement of a cryptographic casino is proving the house did not cheat. This is handled by `src/services/provably-fair.service.ts`.

**The Math:**
1. **Server Seed Generation:** Server generates a massive random string (`serverSeed`). The server hashes this string using SHA-256 (`serverSeedHash`) and displays the hash to the player. The player now knows the outcome is set, but cannot decipher it.
2. **Client Seed Generation:** The player provides their own string (`clientSeed`), acting as entropy the server cannot predict.
3. **Nonce:** Starts at `0`. Increases by `1` for every bet placed with the current seed pair.
4. **Resolution Hash:** `HMAC_SHA256(clientSeed + ":" + nonce, serverSeed)`.
5. **Number Generation:** The first few bytes of that hexadecimal hash are converted into a float between `0` and `1`. This uniform float is then multiplied by game logic (e.g., multiplying by 10,000 for a Crash multiplier).

When the player rotates their seed, the previous `serverSeed` is revealed in plaintext, allowing the player to verify every past bet mathematically entirely offline.

---

## ⚡ Real-Time WebSocket Infrastructure

Standard serverless Next.js functions cannot handle the persistent polling required for a live multiplayer Crash game or global chatting.

This project utilizes a **Custom Server Base** (`server.ts`):
*   Next.js is injected into a standard Node.js `http` server.
*   **Socket.io** is attached to the same port.
*   **Authentication Flow:** Clients emit an `authenticate` packet with their NextAuth JWT. The server verifies the JWT using the `NEXTAUTH_SECRET` before allowing the socket to emit to protected chat channels or receive personalized WebSocket events.
*   **Use Cases:** 
    - The Crash curve rising (emitting multiplier every 100ms to all clients).
    - Global "Live Bets" feed broadcasting large wins.

---

## 🛡 Anti-Cheat, Security & Compliance

### Fraud Detection Service
`src/services/fraud-detection.service.ts` actively monitors transaction velocities.
*   **Win-Rate Monitoring:** Identifies mathematically impossible win streaks based on established standard deviations.
*   **Bet Velocity:** Flags users hitting API endpoints faster than humanly possible (bypassing normal frontend UI limitations).

### Admin Tools & KYC (Know Your Customer)
- **Withdrawal Cooldowns:** The system strictly prohibits instant withdrawals immediately following deposits + bonuses, circumventing free-money washing exploits.
- **Identity Gates:** The admin panel requires manual approval of uploaded ID formats before the `kycStatus` flips to `APPROVED`, unlocking the Withdrawal tier.
- **Deep Audit Logging:** `src/services/audit.service.ts` logs *everything*. Example: "Admin 'Dave' approved KYC for User 'X' at 11:42 PM". 

---

## 🎨 UI/UX & Frontend Architecture

The frontend is built to feel like an immersive, extremely premium modern gaming application.

*   **Responsive Mobile-First constraints:** Using strict Tailwind CSS v4 breakpoints (`sm`, `md`, `lg`, `xl`). The UI collapses cleanly on smartphones without horizontal scroll breakage.
*   **Headless Accessibility:** Radix UI enables keyboard-navigable dialogs, tooltips, toasts, and dropdowns. Screen readers easily interpret the states.
*   **Fluid Animations:** `framer-motion` dictates page transitions, chip placements in Roulette, and smooth ticker numbers. The UI must *wow* the user while gracefully handling asynchronous loading states to prevent "button lag" panic.
*   **Component Structure:** Heavily modularized. `components/ui/` contains reusable buttons, inputs, and layout wrappers. `components/games/` contains the distinct rendering canvas/SVG configurations for the various game boards.

---

## 📂 In-Depth Project Structure

```text
gambling-platform/
├── .env.example              # Crucial environment variable templates (DB, Redis, Auth)
├── package.json              # Script definitions (build, dev, lint)
├── prisma/                   
│   └── schema.prisma         # The absolute backbone: 500+ lines defining the relational DB
├── server.ts                 # Custom Node Wrapper for Next.js + Socket.io Server
├── public/                   # Static assets, branding, and game vector SVGs
└── src/
    ├── app/                  # Next.js App Router
    │   ├── (public)/         # Unauthenticated marketing & login interfaces
    │   ├── (dashboard)/      # Authenticated wallet, profiles, and game grids
    │   └── api/              # Serverless execution routes
    │       ├── admin/        # Protected endpoints regulating Users, KYC, and Settings
    │       ├── auth/         # NextAuth callback providers
    │       ├── games/        # [GAME_NAME]/bet REST execution endpoints
    │       └── webhooks/     # Incoming server-to-server Razorpay/Gateway confirmations
    ├── components/           # React Components
    │   ├── admin/            # Dashboards, tables, graphs, and audit-logs UI
    │   ├── games/            # Highly complex Game Client components (Crash curve, Roulette wheel)
    │   └── ui/               # Core design system primitives (Tailwind integrated)
    ├── lib/                  # Singletons (PrismaClient, RedisClient, NextAuth Config)
    ├── services/             # Core Backend Services (MUST REMAIN ISOLATED FROM API ROUTES)
    │   ├── audit.service.ts
    │   ├── betting.service.ts
    │   ├── fraud-detection.service.ts
    │   ├── idempotency.service.ts
    │   ├── provably-fair.service.ts
    │   └── wallet.service.ts
    └── types/                # Global TypeScript Definitions
```

---

## 💻 Comprehensive Local Setup Guide

1. **System Prerequisites:**
   - Node.js `v18+` or `v20+` is mandatory for Next.js 15 features.
   - Access to a PostgreSQL instance (Local Docker or cloud provider like Supabase/Neon).
   - Redis Database (Local Docker or Upstash).

2. **Clone & Install:**
   ```bash
   git clone <repository_url>
   cd gambling-platform
   npm install
   ```

3. **Environment Setup:**
   Duplicate the `.env.example` file and rename it to `.env`.
   Configure the following critical vars:
   ```env
   # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   DATABASE_URL="mongodb+srv://... or postgresql://..." 
   
   # Required for Rate Limiting & NextAuth sessions
   REDIS_URL="redis://..."
   
   # Execute `openssl rand -base64 32` to generate a secure secret
   NEXTAUTH_SECRET="..."
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize the Database Ledger:**
   Synchronize the Prisma schema to construct the strict transaction columns.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server:**
   Launch the comprehensive `server.ts` build (Next.js + WebSockets).
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000`.

---

## 🌍 Deployment & Production Readiness

**Vercel / Next.js Serverless deployments DO NOT SUPPORT standard Socket.io connections natively within the same build.**

To deploy this application correctly into a production environment:
1. **The Next.js Frontend & API:** Can be hosted uniformly on Vercel.
2. **The Socket.io Server:** Needs to be decoupled and hosted on a long-running instance (like an AWS EC2, DigitalOcean Droplet, Railway, or Render service). Configure the frontend's Socket.io client to connect to this detached live URL.
3. **Database Connectivity:** When deploying Serverless APIs interacting with Prisma, utilize Prisma Accelerate or PgBouncer connection pooling to avoid exhausting PostgreSQL instances upon high traffic loads. You **cannot** allow 1000 simultaneous users to open direct single DB connections on every refresh.
4. **Build command overriding:** As programmed in `package.json`, ensure `prisma generate` executes during the build process to inject the ORM correctly.

---
<div align="center">
  <p><i>Strictly Confidential & Proprietary Software. Do not distribute. Audit trailing is perpetually active.</i></p>
</div>
