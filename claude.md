# Quizora — AI Reference Guide

> **What is this file?** This is a comprehensive reference for any AI assistant (Claude, Copilot, Gemini, etc.) working on the Quizora codebase. Read this first before making changes.

---

## 1. Project Overview

**Quizora** is a real-time interactive quiz platform (similar to Kahoot/Mentimeter). A host creates a quiz, starts a live session with a join code, and participants answer questions in real-time via WebSocket. Features include AI-generated quizzes, OCR-scanned questions from images, adaptive difficulty, timed questions, leaderboards, and detailed result analytics.

### Key User Flows

1. **Host creates a quiz** → adds questions (manual, AI-generated, or OCR-scanned) → creates a live session → shares join code
2. **Participants join** via join code → enter waiting room → answer questions live as host advances them
3. **During session**: real-time scoring, timed questions, host controls (pause/resume/end)
4. **After session**: leaderboard, per-question result breakdown, correction rates

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Monorepo** | npm workspaces + Turborepo | turbo ^2.8.9 |
| **Frontend** | React (Vite) | React ^19.2.0, Vite ^7.3.1 |
| **HTTP Backend** | Express.js (Node.js) | ES Modules (`"type": "module"`) |
| **WebSocket Backend** | Native `ws` library | Separate Node.js server |
| **Database** | PostgreSQL via Prisma ORM | @prisma/client ^6.0.0 |
| **Auth** | JWT (JSON Web Tokens) | Custom implementation |
| **Language** | JavaScript (ES Modules throughout) | Node ≥ 18 |
| **Formatter** | Prettier | ^3.7.4 |

### Important Notes
- **No TypeScript** — the entire project is plain JavaScript with `.js` and `.jsx` extensions.
- **ES Modules everywhere** — all `package.json` files have `"type": "module"`. Use `import/export`, not `require/module.exports`.
- **No routing library installed on frontend** — `react-router-dom` is imported in `App.jsx` but is NOT listed in `package.json` dependencies. It needs to be installed.
- **No Express installed** — `express` is imported in http-backend but NOT in its `package.json` dependencies. It needs to be installed.
- **No `ws` installed** — same situation for ws-backend.
- **No `jsonwebtoken` or `bcrypt` installed** — needed for auth but not in dependencies.

---

## 3. Project Structure

```
Quizora/
├── package.json              ← Root: npm workspaces + turbo scripts
├── turbo.json                ← Turborepo pipeline config
├── .gitignore
├── .npmrc
│
├── apps/
│   ├── frontend/             ← React SPA (Vite)
│   │   ├── package.json      ← name: "frontend"
│   │   ├── vite.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx      ← Entry point, renders <App />
│   │       ├── App.jsx       ← BrowserRouter + all routes
│   │       ├── App.css
│   │       ├── index.css
│   │       ├── api/          ← HTTP & WebSocket client modules
│   │       │   ├── client.js     ← apiRequest() fetch wrapper (TODO)
│   │       │   ├── auth.js       ← signup, login, getMe (TODO)
│   │       │   ├── quiz.js       ← CRUD quiz endpoints (TODO)
│   │       │   ├── question.js   ← CRUD question endpoints (TODO)
│   │       │   ├── session.js    ← session endpoints (TODO)
│   │       │   ├── result.js     ← result endpoints (TODO)
│   │       │   └── socket.js     ← createSocket, sendMessage, onMessage (TODO)
│   │       ├── context/
│   │       │   ├── AuthContext.jsx   ← Auth state + token management (TODO)
│   │       │   └── SocketContext.jsx ← WebSocket connection management (TODO)
│   │       ├── hooks/
│   │       │   ├── useQuiz.js    ← Fetch quiz data (TODO)
│   │       │   ├── useSession.js ← Fetch session data (TODO)
│   │       │   └── useTimer.js   ← Countdown timer state (TODO)
│   │       ├── components/
│   │       │   ├── Navbar.jsx          ← Navigation bar (TODO)
│   │       │   ├── QuizCard.jsx        ← Quiz display card (TODO)
│   │       │   ├── QuestionEditor.jsx  ← Question editing form (TODO)
│   │       │   ├── OptionList.jsx      ← Answer options display (TODO)
│   │       │   ├── Timer.jsx           ← Countdown timer UI (TODO)
│   │       │   ├── ParticipantList.jsx ← Session participants (TODO)
│   │       │   ├── LeaderboardTable.jsx← Leaderboard display (TODO)
│   │       │   └── ResultChart.jsx     ← Result visualization (TODO)
│   │       ├── pages/
│   │       │   ├── LoginPage.jsx       ← User login (TODO)
│   │       │   ├── SignupPage.jsx      ← User registration (TODO)
│   │       │   ├── DashboardPage.jsx   ← User's quizzes + create new (TODO)
│   │       │   ├── CreateQuizPage.jsx  ← New quiz form (TODO)
│   │       │   ├── EditQuizPage.jsx    ← Edit quiz + questions (TODO)
│   │       │   ├── JoinPage.jsx        ← Enter join code (TODO)
│   │       │   ├── WaitingRoomPage.jsx ← Pre-quiz lobby (TODO)
│   │       │   ├── LiveQuizPage.jsx    ← Active quiz participation (TODO)
│   │       │   ├── HostControlPage.jsx ← Host dashboard during quiz (TODO)
│   │       │   ├── ResultsPage.jsx     ← Post-quiz results (TODO)
│   │       │   └── LeaderboardPage.jsx ← Final leaderboard (TODO)
│   │       ├── styles/
│   │       │   └── global.css          ← Global styles (minimal)
│   │       └── utils/                  ← (empty, for future utility functions)
│   │
│   ├── http-backend/         ← Express REST API
│   │   ├── package.json      ← name: "http-backend", depends on @repo/db
│   │   ├── index.js          ← Express app, mounts routes, error handler
│   │   ├── seed.js           ← Database seeding script
│   │   ├── config/
│   │   │   └── index.js      ← PORT, JWT_SECRET, AI_API_KEY, OCR_API_KEY
│   │   ├── middlewares/
│   │   │   ├── auth.js       ← JWT verification middleware (TODO)
│   │   │   ├── validate.js   ← Request body validation (TODO — passes through)
│   │   │   └── errorHandler.js ← Global error handler (✅ IMPLEMENTED)
│   │   ├── routes/
│   │   │   ├── auth.js       ← POST /signup, POST /login, GET /me
│   │   │   ├── quiz.js       ← CRUD /api/quizzes (auth required)
│   │   │   ├── question.js   ← CRUD /api/quizzes/:quizId/questions (auth required)
│   │   │   ├── session.js    ← /api/sessions (mixed auth)
│   │   │   └── result.js     ← /api/results (auth required)
│   │   ├── controllers/
│   │   │   ├── auth.js       ← signup, login, getMe (TODO)
│   │   │   ├── quiz.js       ← createQuiz, getMyQuizzes, getQuiz, updateQuiz, deleteQuiz (TODO)
│   │   │   ├── question.js   ← addQuestion, updateQuestion, deleteQuestion, reorderQuestions (TODO)
│   │   │   ├── session.js    ← createSession, getSession, joinSession, startSession, endSession (TODO)
│   │   │   └── result.js     ← getSessionResults, getLeaderboard, getQuestionResult (TODO)
│   │   └── utils/
│   │       ├── token.js      ← signToken, verifyToken (TODO)
│   │       ├── joinCode.js   ← generateJoinCode — 8-digit numeric (TODO)
│   │       ├── scoring.js    ← calculatePoints, calculateLeaderboard (TODO)
│   │       ├── ai.js         ← generateQuizFromPrompt, generateQuestionsFromTopic (TODO)
│   │       ├── ocr.js        ← extractQuestionsFromImage (TODO)
│   │       └── adaptive.js   ← pickNextQuestion, adjustDifficulty (TODO)
│   │
│   └── ws-backend/           ← WebSocket real-time server
│       ├── package.json      ← name: "ws-backend", depends on @repo/db
│       ├── index.js          ← WebSocketServer, message router
│       ├── seed.js           ← Database seeding script
│       ├── config/
│       │   └── index.js      ← WS_PORT (default 8080), JWT_SECRET
│       ├── handlers/
│       │   ├── connection.js  ← handleConnection, handleDisconnect (TODO)
│       │   ├── session.js     ← handleJoinSession, handleLeaveSession (TODO)
│       │   ├── question.js    ← handleNextQuestion, handleSubmitResponse (TODO)
│       │   ├── host.js        ← handleStartQuiz, handlePauseQuiz, handleResumeQuiz, handleEndQuiz (TODO)
│       │   └── leaderboard.js ← handleBroadcastLeaderboard, handleBroadcastQuestionResult (TODO)
│       └── utils/
│           ├── auth.js       ← verifyWsToken (TODO)
│           ├── rooms.js      ← In-memory Map: sessionId → Set<ws> (TODO)
│           ├── broadcast.js  ← broadcastToRoom, sendToOne, broadcastToRoomExcept (TODO)
│           └── timer.js      ← In-memory Map: sessionId → timer (TODO)
│
├── packages/
│   └── db/                   ← Shared Prisma database package
│       ├── package.json      ← name: "@repo/db"
│       ├── index.js          ← PrismaClient singleton export
│       ├── .env              ← DATABASE_URL (currently empty)
│       ├── .gitignore        ← ignores generated/, .env
│       ├── prisma/
│       │   ├── schema.prisma ← Full database schema (✅ COMPLETE)
│       │   ├── ERD.svg       ← Auto-generated ERD diagram
│       │   └── migrations/   ← Has initial migration "init_quiz_platform"
│       └── generated/        ← Prisma Client generated code
│
└── files/                    ← Project documentation artifacts (ERD, SRS, use cases)
```

---

## 4. Database Schema (Prisma)

The schema is **fully defined** in `packages/db/prisma/schema.prisma`. Database is **PostgreSQL**.

### Models & Relationships

```
User ──1:N──> Quiz (creator)
User ──1:N──> Session (host)
User ──1:N──> SessionParticipant
User ──1:N──> Response

Quiz ──1:N──> Question
Quiz ──1:N──> Session

Question ──1:N──> Option
Question ──1:N──> Response
Question ──1:N──> QuestionResult

Session ──1:N──> SessionParticipant
Session ──1:N──> Response
Session ──1:1──> SessionState
Session ──1:N──> QuestionResult

Response ──1:N──> ResponseOption
ResponseOption ──N:1──> Option
```

### Key Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | Registered users | email (unique), passwordHash, name, avatar?, role (USER/ADMIN) |
| `Quiz` | Quiz container | title, description, creatorId, isAIGenerated, isScannedFromImage, enableAdaptiveDifficulty, expiresAt? |
| `Question` | Individual question | quizId, questionType (enum), text, imageUrl?, order, difficulty (1-10), hasTimeLimit, timeLimitSeconds?, points (default 100) |
| `Option` | Answer choice | questionId, text, imageUrl?, isCorrect, order |
| `Session` | Live quiz session | quizId, hostId, joinCode (unique 8-char), status (enum), currentQuestionId?, allowLateJoiners, allowRejoin, expiresAt |
| `SessionState` | Real-time state | sessionId (1:1), currentQuestionIndex, questionStartedAt?, isAcceptingResponses, participantCount |
| `SessionParticipant` | User in session | sessionId, userId (unique pair), isActive, totalScore, rank? |
| `Response` | User's answer | sessionId, questionId, participantId (unique triple), responseData (JSON), responseTimeMs?, isCorrect, pointsEarned |
| `ResponseOption` | Selected options | responseId, optionId (unique pair) |
| `QuestionResult` | Aggregated stats | sessionId, questionId (unique pair), totalResponses, correctResponses, correctionRate, averageResponseTimeMs?, resultData (JSON) |

### Enums

```
UserRole: USER, ADMIN
QuestionType: MULTIPLE_CHOICE_SINGLE, MULTIPLE_CHOICE_MULTI, TRUE_FALSE, RATING_SCALE, OPEN_ENDED
SessionStatus: DRAFT, WAITING_ROOM, LIVE, PAUSED, COMPLETED
```

---

## 5. API Routes (HTTP Backend)

Base URL: `http://localhost:3000`

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Controller |
|--------|----------|------|------------|
| POST | `/api/auth/signup` | No | `signup()` |
| POST | `/api/auth/login` | No | `login()` |
| GET | `/api/auth/me` | Yes | `getMe()` |

### Quizzes (`/api/quizzes`) — All require auth
| Method | Endpoint | Controller |
|--------|----------|------------|
| POST | `/api/quizzes` | `createQuiz()` |
| GET | `/api/quizzes` | `getMyQuizzes()` |
| GET | `/api/quizzes/:quizId` | `getQuiz()` |
| PUT | `/api/quizzes/:quizId` | `updateQuiz()` |
| DELETE | `/api/quizzes/:quizId` | `deleteQuiz()` |

### Questions (`/api/quizzes/:quizId/questions`) — All require auth
| Method | Endpoint | Controller |
|--------|----------|------------|
| POST | `/api/quizzes/:quizId/questions` | `addQuestion()` |
| PUT | `/api/quizzes/:quizId/questions/:questionId` | `updateQuestion()` |
| DELETE | `/api/quizzes/:quizId/questions/:questionId` | `deleteQuestion()` |
| PUT | `/api/quizzes/:quizId/questions/reorder` | `reorderQuestions()` |

### Sessions (`/api/sessions`)
| Method | Endpoint | Auth | Controller |
|--------|----------|------|------------|
| POST | `/api/sessions` | Yes | `createSession()` |
| GET | `/api/sessions/:sessionId` | Yes | `getSession()` |
| POST | `/api/sessions/join` | No | `joinSession()` |
| PUT | `/api/sessions/:sessionId/start` | Yes | `startSession()` |
| PUT | `/api/sessions/:sessionId/end` | Yes | `endSession()` |

### Results (`/api/results`) — All require auth
| Method | Endpoint | Controller |
|--------|----------|------------|
| GET | `/api/results/:sessionId` | `getSessionResults()` |
| GET | `/api/results/:sessionId/leaderboard` | `getLeaderboard()` |
| GET | `/api/results/:sessionId/questions/:questionId` | `getQuestionResult()` |

---

## 6. WebSocket Protocol (WS Backend)

Server: `ws://localhost:8080`

### Connection
- Client connects with JWT token as query parameter
- Server verifies token and stores user info on the `ws` object

### Message Format
All messages are JSON: `{ "type": "<message_type>", "data": { ... } }`

### Client → Server Message Types
| Type | Purpose | Data |
|------|---------|------|
| `join_session` | Join a session room | `{ joinCode }` |
| `leave_session` | Leave a session room | `{ sessionId }` |
| `submit_response` | Submit an answer | `{ sessionId, questionId, selectedOptionIds, responseData }` |
| `start_quiz` | Host starts quiz | `{ sessionId }` |
| `pause_quiz` | Host pauses quiz | `{ sessionId }` |
| `resume_quiz` | Host resumes quiz | `{ sessionId }` |
| `end_quiz` | Host ends quiz | `{ sessionId }` |
| `next_question` | Host advances question | `{ sessionId }` |
| `get_leaderboard` | Request leaderboard | `{ sessionId }` |
| `get_question_result` | Request question stats | `{ sessionId, questionId }` |

### Server → Client Message Types (expected broadcasts)
| Type | Purpose |
|------|---------|
| `participant_joined` | New participant entered |
| `participant_left` | Participant disconnected |
| `quiz_started` | Quiz has begun |
| `quiz_paused` | Quiz paused by host |
| `quiz_resumed` | Quiz resumed by host |
| `quiz_ended` | Quiz completed |
| `question_started` | New question broadcast to all |
| `response_received` | Acknowledgment to participant |
| `leaderboard_update` | Leaderboard data broadcast |
| `question_result` | Per-question stats broadcast |

### Room Management
- In-memory `Map<sessionId, Set<ws>>` — no Redis/external store
- Timer management also in-memory `Map<sessionId, timerRef>`

---

## 7. Frontend Routes

| Path | Page Component | Purpose |
|------|---------------|---------|
| `/login` | `LoginPage` | User login form |
| `/signup` | `SignupPage` | User registration form |
| `/` | `DashboardPage` | User's quizzes, create new, recent sessions |
| `/quiz/create` | `CreateQuizPage` | New quiz creation form |
| `/quiz/:quizId/edit` | `EditQuizPage` | Edit quiz details + manage questions |
| `/join` | `JoinPage` | Enter join code to join session |
| `/session/:sessionId/waiting` | `WaitingRoomPage` | Pre-quiz lobby |
| `/session/:sessionId/live` | `LiveQuizPage` | Active quiz participation |
| `/session/:sessionId/host` | `HostControlPage` | Host controls during live quiz |
| `/session/:sessionId/results` | `ResultsPage` | Post-quiz results view |
| `/session/:sessionId/leaderboard` | `LeaderboardPage` | Final leaderboard |

### Frontend Architecture
- **Context Providers**: `AuthProvider` (user state, token), `SocketProvider` (WebSocket connection)
- **API Layer**: `src/api/client.js` provides `apiRequest()` fetch wrapper; domain modules call it
- **Environment Variables**: `VITE_API_URL` (default `http://localhost:3000/api`), `VITE_WS_URL` (default `ws://localhost:8080`)

---

## 8. Implementation Status

### ✅ Fully Implemented
- Database schema (`schema.prisma`) — complete with all models, relations, indexes, enums
- Prisma Client singleton (`packages/db/index.js`)
- Initial database migration (`20260223205325_init_quiz_platform`)
- Error handler middleware (`errorHandler.js`)
- HTTP backend entry point — Express app with route mounting (`apps/http-backend/index.js`)
- WS backend entry point — WebSocket server with message routing (`apps/ws-backend/index.js`)
- Frontend routing — all routes defined in `App.jsx`
- Frontend entry point (`main.jsx`)
- Monorepo config (workspaces, turbo pipeline)
- Seed scripts exist (`seed.js` in both backends, ~20KB each — contain substantial seeding logic)

### 🔲 Stubbed (TODO) — Function signatures exist, bodies are empty
**All** controllers, middlewares (except errorHandler), utilities, frontend API modules, context providers, hooks, pages, and components are **stubbed with TODO comments**. This means:

- Every controller function has `// TODO: ...` in its body
- Every frontend page renders just `<div>PageName</div>`
- Every component renders just `<nav>Navbar</nav>` or similar
- Context providers pass empty objects `value={{}}`
- API client functions have empty bodies
- Custom hooks have empty bodies

### ❌ Missing Dependencies (need `npm install`)
The following packages are imported but NOT in any `package.json`:
- **frontend**: `react-router-dom`
- **http-backend**: `express`, `cors`, `jsonwebtoken`, `bcrypt`/`bcryptjs`
- **ws-backend**: `ws`, `jsonwebtoken`

---

## 9. Environment Variables

### `packages/db/.env`
```
DATABASE_URL=postgresql://user:password@localhost:5432/quizora
```

### `apps/http-backend/.env` (expected)
```
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
AI_API_KEY=your-ai-api-key
OCR_API_KEY=your-ocr-api-key
DATABASE_URL=postgresql://user:password@localhost:5432/quizora
```

### `apps/ws-backend/.env` (expected)
```
WS_PORT=8080
JWT_SECRET=your-secret-key  # Must match http-backend
DATABASE_URL=postgresql://user:password@localhost:5432/quizora
```

### Frontend (Vite env)
```
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:8080
```

---

## 10. Development Commands

```bash
# From root — runs all apps in parallel via Turborepo
npm run dev

# Individual apps
cd apps/frontend && npm run dev       # Vite dev server (default port 5173)
cd apps/http-backend && npm run dev   # node index.js (port 3000)
cd apps/ws-backend && npm run dev     # node index.js (port 8080)

# Database
cd packages/db
npx prisma generate                   # Generate Prisma Client
npx prisma migrate dev                # Run migrations
npx prisma db push                    # Push schema without migration
npx prisma studio                     # Visual DB browser

# Seeding
cd apps/http-backend && node seed.js
cd apps/ws-backend && npm run seed

# Formatting
npm run format                        # Prettier on all .js/.jsx/.md files

# Building
npm run build                         # Turbo build all apps
```

---

## 11. Coding Conventions

1. **ES Modules only** — `import/export`, never `require`
2. **Async controller pattern** — `async function handler(req, res, next) { try { ... } catch(e) { next(e) } }`
3. **Prisma for all DB access** — import `prisma` from `@repo/db`
4. **JWT auth pattern** — Token in `Authorization: Bearer <token>` header
5. **WebSocket message format** — `JSON.stringify({ type, data })`
6. **File naming** — lowercase, camelCase for multi-word (e.g., `joinCode.js`, `errorHandler.js`)
7. **React components** — PascalCase files, functional components, hooks pattern
8. **No TypeScript** — plain JavaScript throughout
9. **Config via dotenv** — each backend loads its own `.env`
10. **Shared DB package** — both backends import `prisma` from `@repo/db`

---

## 12. Architecture Diagram

```
┌─────────────┐     HTTP REST      ┌──────────────────┐
│             │ ──────────────────> │  HTTP Backend     │
│  Frontend   │                    │  (Express :3000)  │──┐
│  (React     │     WebSocket      ├──────────────────┤  │
│   Vite      │ ──────────────────>│  WS Backend       │  │  ┌──────────┐
│   :5173)    │                    │  (ws :8080)       │──┼──│ PostgreSQL│
│             │                    └──────────────────┘  │  │ Database  │
└─────────────┘                                          │  └──────────┘
                                   ┌──────────────────┐  │
                                   │  @repo/db        │──┘
                                   │  (Prisma Client) │
                                   └──────────────────┘
```

### Data Flow
1. **Auth & CRUD** → Frontend ↔ HTTP Backend ↔ PostgreSQL
2. **Real-time quiz** → Frontend ↔ WS Backend ↔ PostgreSQL
3. **Both backends** share the same database via `@repo/db` package

---

## 13. Key Design Decisions

1. **Separate HTTP & WS servers** — REST for CRUD operations, WebSocket for real-time quiz gameplay. They share the same database and JWT secret but run as independent processes.
2. **In-memory rooms & timers** — WebSocket rooms and question timers are stored in memory (Maps), not persisted. This means a WS server restart loses all active session state.
3. **Join codes** — 8-digit numeric strings for session access, unique per session.
4. **Flexible response storage** — `Response.responseData` is a JSON field to handle different question types uniformly. `ResponseOption` junction table tracks which options were selected.
5. **Adaptive difficulty** — Optional per-quiz. Uses `correctionRate` from `QuestionResult` to dynamically adjust which question to show next.
6. **AI & OCR as utilities** — Quiz generation and image scanning are utility functions that call external APIs. The specific AI/OCR provider is not locked in (configurable via env vars).
7. **Prisma Client singleton** — Uses `globalThis` pattern to prevent connection pool exhaustion during hot reloads in development.

---

## 14. Common Tasks for AI Assistants

### Implementing a TODO controller
1. Import `prisma` from `@repo/db`
2. Use try/catch with `next(err)` for error handling
3. Use `req.user` (set by auth middleware) for authenticated user info
4. Return JSON responses with `res.json()`

### Adding a new feature
1. Add/modify Prisma schema → run `npx prisma migrate dev`
2. Add route in `routes/` → add controller in `controllers/`
3. Add frontend API function in `src/api/`
4. Add/modify pages and components
5. For real-time features, add WS handler and message type

### Installing missing dependencies
```bash
# Frontend
cd apps/frontend && npm install react-router-dom

# HTTP Backend
cd apps/http-backend && npm install express cors jsonwebtoken bcryptjs

# WS Backend
cd apps/ws-backend && npm install ws jsonwebtoken
```

---

## 15. Files Reference Quick Lookup

| What you need | Where to find it |
|--------------|-----------------|
| Database schema | `packages/db/prisma/schema.prisma` |
| Prisma client | `packages/db/index.js` |
| HTTP server entry | `apps/http-backend/index.js` |
| WS server entry | `apps/ws-backend/index.js` |
| Frontend entry | `apps/frontend/src/main.jsx` |
| Frontend routing | `apps/frontend/src/App.jsx` |
| API base URL config | `apps/frontend/src/api/client.js` |
| WS URL config | `apps/frontend/src/api/socket.js` |
| HTTP port config | `apps/http-backend/config/index.js` |
| WS port config | `apps/ws-backend/config/index.js` |
| Auth middleware | `apps/http-backend/middlewares/auth.js` |
| Error handler | `apps/http-backend/middlewares/errorHandler.js` |
| JWT utilities | `apps/http-backend/utils/token.js` |
| Seed data | `apps/http-backend/seed.js`, `apps/ws-backend/seed.js` |
| ERD diagram | `packages/db/prisma/ERD.svg` |
| Project docs | `files/` directory |
