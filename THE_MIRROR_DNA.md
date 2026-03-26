# THE MIRROR — Complete DNA Documentation

> A psychological self-reflection AI tool that guides users through layered introspection
> Built by MachineMind | Version 3.0

---

## Table of Contents

1. [Architecture & Stack](#1-architecture--stack)
2. [File Structure](#2-file-structure)
3. [Features](#3-features)
4. [UI/UX Flow](#4-uiux-flow)
5. [Visual Effects & Animations](#5-visual-effects--animations)
6. [Components](#6-components)
7. [API Routes](#7-api-routes)
8. [Hooks](#8-hooks)
9. [State Management](#9-state-management)
10. [Data Storage](#10-data-storage)
11. [Voice System](#11-voice-system)
12. [Language System](#12-language-system)
13. [Security](#13-security)
14. [Styling](#14-styling)
15. [AI Integration](#15-ai-integration)

---

## 1. Architecture & Stack

### Core Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.1.6 |
| Runtime | React | 19.0.0 |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 4.x |
| AI Engine | Anthropic Claude | claude-sonnet-4-20250514 |
| Database | Supabase | PostgreSQL + Auth |
| Voice (Primary) | Web Speech API | Browser native |
| Voice (Backup) | OpenAI Whisper | whisper-1 |
| Deployment | Vercel | Edge-optimized |

### Key Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.39.0",
  "@supabase/ssr": "^0.6.1",
  "@supabase/supabase-js": "^2.48.1",
  "next": "15.1.6",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────┤
│  MirrorV3.tsx (Main Component)                              │
│  ├── Voice Input (Web Speech API / Whisper)                 │
│  ├── Text Input                                             │
│  ├── Descent Journey UI                                     │
│  ├── Vault (Session History)                                │
│  └── Auth Modal                                             │
├─────────────────────────────────────────────────────────────┤
│                     API LAYER (Edge)                         │
├─────────────────────────────────────────────────────────────┤
│  /api/mirror/v3    → Claude AI responses                    │
│  /api/transcribe   → OpenAI Whisper transcription           │
│  /api/mirror       → Legacy v1 endpoint                     │
├─────────────────────────────────────────────────────────────┤
│                   STORAGE LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  localStorage (Anonymous)  ←→  Supabase (Authenticated)    │
│  - Sessions                    - mirror_profiles            │
│  - Patterns                    - mirror_sessions            │
│  - Cognitive Map               - mirror_entries             │
│  - Profile                     - mirror_patterns            │
│                                - mirror_cognitive_maps      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. File Structure

```
the-mirror/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Entry point (dynamic import)
│   │   ├── layout.tsx                  # Root layout with fonts & SEO
│   │   ├── globals.css                 # 2100+ lines design system
│   │   ├── error.tsx                   # Error boundary
│   │   ├── not-found.tsx               # 404 page
│   │   ├── api/
│   │   │   ├── mirror/
│   │   │   │   ├── route.ts            # v1 API (legacy)
│   │   │   │   └── v3/
│   │   │   │       └── route.ts        # v3 API (current)
│   │   │   └── transcribe/
│   │   │       └── route.ts            # Whisper transcription
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts            # OAuth callback handler
│   │
│   ├── components/
│   │   ├── MirrorV3.tsx                # Main app (2200+ lines)
│   │   └── MicButton.tsx               # Voice input button
│   │
│   └── lib/
│       ├── i18n.ts                     # Internationalization (EN/ES)
│       ├── types.ts                    # Core TypeScript types
│       ├── prompts.ts                  # AI system prompts
│       ├── useVoice.ts                 # Voice hook exports
│       ├── useWebSpeech.ts             # Web Speech API hook
│       ├── useWhisperVoice.ts          # Whisper API hook
│       └── supabase/
│           ├── types.ts                # Database types (300+ lines)
│           ├── client.ts               # Browser Supabase client
│           ├── server.ts               # Server Supabase client
│           ├── storage.ts              # localStorage layer
│           ├── db.ts                   # Supabase CRUD operations
│           ├── middleware.ts           # Auth middleware helper
│           └── useAuth.ts              # Auth hook
│
├── public/
│   └── manifest.json                   # PWA manifest
│
├── middleware.ts                       # Route protection
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── postcss.config.mjs
```

---

## 3. Features

### Core Experience: The Descent Journey

The Mirror guides users through 4 levels of psychological depth:

| Level | Name | Color | Purpose |
|-------|------|-------|---------|
| 1 | Surface | `#7dd3fc` (sky-300) | What happened? Initial reflection |
| 2 | Pattern | `#a78bfa` (violet-400) | What patterns emerge? Recognition |
| 3 | Origin | `#f472b6` (pink-400) | Where does this come from? Root causes |
| 4 | Core | `#fbbf24` (amber-400) | What truth lives here? Deep insight |

### Feature List

1. **Voice Input System**
   - Primary: Web Speech API (free, real-time, browser-native)
   - Backup: OpenAI Whisper (99%+ accuracy, 15 languages)
   - Audio level visualization
   - Automatic silence detection

2. **Text Input**
   - Auto-expanding textarea
   - Placeholder cycling
   - Character preservation

3. **AI-Powered Responses**
   - Anthropic Claude (claude-sonnet-4-20250514)
   - Context-aware prompts per descent level
   - Pattern recognition across sessions
   - Cognitive map integration

4. **Session Management**
   - Automatic session creation/continuation
   - 4-hour session timeout for new session
   - Entry timestamping
   - Full conversation history

5. **Pattern Detection**
   - AI-identified recurring themes
   - Cross-session pattern recognition
   - Pattern status tracking (emerging → active → integrated)

6. **Cognitive Mapping**
   - 6 dimensions tracked (0-100 scale):
     - Self-Awareness
     - Emotional Clarity
     - Pattern Recognition
     - Origin Understanding
     - Integration Progress
     - Resilience Growth

7. **Vault (Session History)**
   - Browse all past sessions
   - Filter by date
   - View full conversation threads
   - Pattern summary per session

8. **Crisis Detection**
   - Real-time keyword monitoring
   - Bilingual crisis word lists
   - Immediate support resources
   - Non-blocking UX (user can continue)

9. **Authentication**
   - Email/password signup
   - Magic link authentication
   - Anonymous mode (localStorage)
   - Data sync on login

10. **Bilingual Support**
    - English (default)
    - Spanish (Colombian market)
    - Auto-detect from browser
    - Manual language toggle

---

## 4. UI/UX Flow

### Application Phases

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   LOADING   │───▶│   LANDING   │───▶│    INPUT    │
│  (shimmer)  │    │  (welcome)  │    │   (entry)   │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    VAULT    │◀───│   DESCENT   │◀───│ PROCESSING  │
│  (history)  │    │  (journey)  │    │  (AI call)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Descent Sub-Phases

```
DESCENT PHASE STATES:
├── showing      → Displaying AI response (typing effect)
├── responding   → User composing reply
├── processing   → Waiting for AI
└── complete     → Level finished, ready to advance
```

### User Journey

1. **Landing Phase**
   - Cosmic background with orbital rings
   - Pulsing "Enter The Mirror" button
   - Language toggle (top-right)
   - Vault access (top-left if sessions exist)

2. **Input Phase**
   - Question display with typewriter reveal
   - Text/voice input area
   - Microphone button with level indicator
   - Submit button with loading state

3. **Processing Phase**
   - Centered loading indicator
   - "Reflecting..." or localized message
   - Background atmospheric effects

4. **Descent Phase**
   - Level indicator (1-4 dots)
   - AI response with typing animation
   - Response navigation (continue/complete)
   - Pattern highlights (if detected)

5. **Vault Phase**
   - Session list with dates
   - Expandable session cards
   - Full conversation threads
   - Pattern summaries

---

## 5. Visual Effects & Animations

### CSS Keyframe Animations

```css
/* Core Animations (from globals.css) */

@keyframes cosmicPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

@keyframes orbitalSlow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseRing {
  0% { transform: scale(0.8); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.6); }
}

@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes levelPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
```

### Atmospheric Layers

```css
/* Background Layer System */

.atmospheric-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

/* Film grain overlay */
.film-grain {
  background-image: url("data:image/svg+xml,...");
  opacity: 0.03;
  animation: grain 0.5s steps(1) infinite;
}

/* Vignette effect */
.vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    rgba(0, 0, 0, 0.4) 100%
  );
}

/* Orbital rings */
.orbital-ring {
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  animation: orbitalSlow var(--duration) linear infinite;
}
```

### Level-Specific Colors

```css
/* Descent Level Spectrum */
--color-surface: #7dd3fc;   /* Level 1 - Sky blue */
--color-pattern: #a78bfa;   /* Level 2 - Violet */
--color-origin: #f472b6;    /* Level 3 - Pink */
--color-core: #fbbf24;      /* Level 4 - Amber/Gold */
```

### Component Animations

| Component | Animation | Duration |
|-----------|-----------|----------|
| Landing button | `pulseRing` | 2s infinite |
| AI response text | `fadeInUp` | 0.5s |
| Level indicators | `levelPulse` | 1.5s |
| Loading shimmer | `shimmer` | 2s infinite |
| Voice level | Real-time scale | 60fps |
| Orbital rings | `orbitalSlow` | 20-40s |

---

## 6. Components

### MirrorV3.tsx (Main Component)

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/components/MirrorV3.tsx`

**Size:** 2200+ lines

**State Variables:**

```typescript
// Phase Management
const [phase, setPhase] = useState<Phase>("loading");
const [descentPhase, setDescentPhase] = useState<DescentPhase>("showing");

// Descent Journey
const [descentLevel, setDescentLevel] = useState(0);
const [descentResponses, setDescentResponses] = useState<string[]>([]);
const [userInputs, setUserInputs] = useState<string[]>([]);

// Input
const [inputValue, setInputValue] = useState("");
const [inputType, setInputType] = useState<"text" | "voice">("text");

// Session & Data
const [sessions, setSessions] = useState<LocalSession[]>([]);
const [currentSession, setCurrentSession] = useState<LocalSession | null>(null);
const [patterns, setPatterns] = useState<LocalPattern[]>([]);
const [cognitiveMap, setCognitiveMap] = useState<LocalCognitiveMap | null>(null);

// Auth
const [user, setUser] = useState<User | null>(null);
const [showAuthModal, setShowAuthModal] = useState(false);

// UI
const [language, setLanguage] = useState<"en" | "es">("en");
const [showCrisisBar, setShowCrisisBar] = useState(false);
const [vaultFilter, setVaultFilter] = useState<string>("all");
```

**Sub-Components (Inline):**

1. **AuthModal** - Email/password and magic link authentication
2. **VaultView** - Session history browser
3. **CrisisBar** - Mental health resources banner
4. **LevelIndicator** - Descent progress dots

**Key Functions:**

```typescript
// AI Communication
async function sendToMirror(content: string, level: number)
async function analyzeSession()

// Session Management
function startNewSession()
function continueSession()
function saveEntry(role: "user" | "mirror", content: string)

// Descent Navigation
function advanceLevel()
function completeJourney()

// Crisis Detection
function checkForCrisisWords(text: string): boolean
```

### MicButton.tsx

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/components/MicButton.tsx`

Simple microphone toggle button with visual states for listening/idle.

---

## 7. API Routes

### /api/mirror/v3 (Primary)

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/app/api/mirror/v3/route.ts`

**Purpose:** Flexible AI endpoint for descent journey

**Rate Limit:** 50 requests/day per IP

**Request Body:**

```typescript
interface V3Request {
  systemPrompt: string;  // Dynamic per level/context
  content: string;       // User message
}
```

**Response:**

```typescript
interface V3Response {
  response: string;      // AI response text
  error?: string;        // Error message if failed
}
```

**Implementation:**

```typescript
export async function POST(req: NextRequest) {
  // Rate limiting check
  const rate = checkRateLimit(ip);
  if (!rate.allowed) return 429;

  // Parse request
  const { systemPrompt, content } = await req.json();

  // Call Claude API
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  return NextResponse.json({
    response: response.content[0].text,
  });
}
```

### /api/transcribe

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/app/api/transcribe/route.ts`

**Purpose:** OpenAI Whisper transcription (backup voice system)

**Rate Limit:** 20 requests/hour per IP

**Request:** FormData with:
- `audio`: File (webm, mp4, mp3, wav, ogg)
- `language`: string (optional hint)

**Response:**

```typescript
interface TranscribeResponse {
  text: string;           // Transcribed text
  language: string;       // Detected language
  duration: number;       // Audio duration in seconds
  segments?: Array<{      // Word-level segments
    start: number;
    end: number;
    text: string;
  }>;
}
```

**Max File Size:** 25MB

### /api/mirror (Legacy v1)

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/app/api/mirror/route.ts`

**Purpose:** Original 4-level descent (deprecated)

**Rate Limit:** 15 requests/day per IP

**Levels:** question, observation, deeper, card

### /auth/callback

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/app/auth/callback/route.ts`

**Purpose:** Handle OAuth/magic link callbacks

**Flow:**
1. Exchange code for session
2. Redirect to home page
3. Handle errors gracefully

---

## 8. Hooks

### useWebSpeech (Primary Voice)

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/lib/useWebSpeech.ts`

**Purpose:** Browser-native speech recognition (free, no API key)

**Interface:**

```typescript
interface UseWebSpeechOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string;      // "en-US", "es-ES", "auto"
  continuous?: boolean;   // Keep listening after pauses
  interimResults?: boolean; // Show results while speaking
}

interface UseWebSpeechResult {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  language: string;
  setLanguage: (lang: string) => void;
}
```

**Supported Languages:**

```typescript
const langMap = {
  "auto": "",
  "en": "en-US", "en-US": "en-US", "en-GB": "en-GB", "en-AU": "en-AU",
  "es": "es-ES", "es-ES": "es-ES", "es-MX": "es-MX", "es-CO": "es-CO",
  "zh": "zh-CN", "zh-CN": "zh-CN", "zh-TW": "zh-TW", "zh-HK": "zh-HK",
  "pt": "pt-BR", "pt-BR": "pt-BR", "pt-PT": "pt-PT",
  "hi": "hi-IN", "ar": "ar-SA", "fr": "fr-FR", "fr-CA": "fr-CA",
  "de": "de-DE", "ja": "ja-JP", "ru": "ru-RU", "ko": "ko-KR", "it": "it-IT"
};
```

**Error Handling:**

| Error Code | User Message |
|------------|--------------|
| `no-speech` | Silent - just logs |
| `audio-capture` | "Microphone not available" |
| `not-allowed` | "Microphone permission denied" |
| `network` | "Network error" |
| `aborted` | Silent - user initiated |

### useWhisperVoice (Backup Voice)

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/lib/useWhisperVoice.ts`

**Purpose:** Server-side transcription for unsupported browsers

**Features:**
- Audio level monitoring via AnalyserNode
- Automatic silence detection (2s threshold)
- MediaRecorder with 250ms timeslice
- Progress callback during recording

**Interface:**

```typescript
interface UseWhisperVoiceOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  onProgress?: (audioLevel: number) => void;
  silenceThreshold?: number;  // Default: 0.01
  silenceDuration?: number;   // Default: 2000ms
  language?: string;
}
```

### useAuth

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/lib/supabase/useAuth.ts`

**Methods:**

```typescript
const {
  user,
  loading,
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
  signOut,
} = useAuth();
```

---

## 9. State Management

### Local State (React useState)

The Mirror uses React's built-in useState for all state management. No external state libraries.

**State Categories:**

```typescript
// 1. PHASE STATE
phase: "loading" | "landing" | "input" | "processing" | "descent" | "vault"
descentPhase: "showing" | "responding" | "processing" | "complete"

// 2. JOURNEY STATE
descentLevel: number (0-3, maps to surface/pattern/origin/core)
descentResponses: string[] (AI responses per level)
userInputs: string[] (user entries per level)

// 3. DATA STATE
sessions: LocalSession[]
currentSession: LocalSession | null
patterns: LocalPattern[]
cognitiveMap: LocalCognitiveMap | null
profile: LocalProfile | null

// 4. AUTH STATE
user: User | null
showAuthModal: boolean

// 5. UI STATE
language: "en" | "es"
showCrisisBar: boolean
vaultFilter: string
inputValue: string
inputType: "text" | "voice"
```

### Persistence Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    USER SESSION                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Anonymous User          Authenticated User              │
│  ┌─────────────┐        ┌─────────────────┐             │
│  │ localStorage │        │    Supabase     │             │
│  │             │◀──sync──│                 │             │
│  │ - sessions  │        │ - mirror_*      │             │
│  │ - patterns  │        │   tables        │             │
│  │ - cognitive │        │                 │             │
│  │ - profile   │        │                 │             │
│  └─────────────┘        └─────────────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Data Storage

### localStorage Keys (Anonymous)

**Prefix:** `mirror_v3_`

```typescript
const STORAGE_KEYS = {
  SESSIONS: "mirror_v3_sessions",
  PATTERNS: "mirror_v3_patterns",
  COGNITIVE_MAP: "mirror_v3_cognitive_map",
  PROFILE: "mirror_v3_profile",
};
```

### Local Data Types

```typescript
interface LocalSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  descentLevel: DescentLevel;
  entryCount: number;
  patternsIdentified: string[];
  entries: LocalEntry[];
  summary?: string;
}

interface LocalEntry {
  id: string;
  sessionId: string;
  content: string;
  type: EntryType;
  descentLevel: DescentLevel;
  createdAt: string;
  emotionalMarkers: string[];
  themes: string[];
}

interface LocalPattern {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  status: PatternStatus;
  relatedEntries: string[];
}

interface LocalCognitiveMap {
  userId: string;
  selfAwareness: number;      // 0-100
  emotionalClarity: number;   // 0-100
  patternRecognition: number; // 0-100
  originUnderstanding: number;// 0-100
  integrationProgress: number;// 0-100
  resilienceGrowth: number;   // 0-100
  lastUpdated: string;
}
```

### Supabase Tables (Authenticated)

```sql
-- Core tables
mirror_profiles
mirror_sessions
mirror_entries
mirror_patterns
mirror_cognitive_maps
mirror_calibrations

-- Key relationships
mirror_entries.session_id → mirror_sessions.id
mirror_patterns.user_id → mirror_profiles.user_id
```

### Storage Functions

```typescript
// localStorage layer (storage.ts)
export function getProfile(): LocalProfile | null
export function saveProfile(profile: LocalProfile): void
export function getSessions(): LocalSession[]
export function saveSessions(sessions: LocalSession[]): void
export function getPatterns(): LocalPattern[]
export function savePatterns(patterns: LocalPattern[]): void
export function getCognitiveMap(): LocalCognitiveMap | null
export function saveCognitiveMap(map: LocalCognitiveMap): void

// Supabase layer (db.ts)
export async function getProfile(userId: string)
export async function upsertProfile(profile: Partial<MirrorProfile>)
export async function getSessions(userId: string)
export async function createSession(session: Partial<MirrorSession>)
export async function syncFromLocalStorage(userId: string)
```

---

## 11. Voice System

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   VOICE INPUT FLOW                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User clicks mic                                         │
│        │                                                 │
│        ▼                                                 │
│  ┌─────────────────┐                                    │
│  │ Check Support   │                                    │
│  └────────┬────────┘                                    │
│           │                                              │
│     ┌─────┴─────┐                                       │
│     │           │                                        │
│     ▼           ▼                                        │
│  Supported   Not Supported                               │
│     │           │                                        │
│     ▼           ▼                                        │
│  ┌───────┐   ┌───────────┐                              │
│  │ Web   │   │ Whisper   │                              │
│  │Speech │   │ (backup)  │                              │
│  │ API   │   │           │                              │
│  └───┬───┘   └─────┬─────┘                              │
│      │             │                                     │
│      └──────┬──────┘                                     │
│             │                                            │
│             ▼                                            │
│      ┌─────────────┐                                    │
│      │ onTranscript│                                    │
│      │ (text, final)                                    │
│      └─────────────┘                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Web Speech API (Primary)

**Advantages:**
- Free (no API costs)
- Real-time (interim results)
- Browser-native (no server round-trip)
- Works offline (Chrome/Edge)

**Limitations:**
- Chrome/Edge only (not Firefox/Safari)
- Accuracy varies by language
- Requires HTTPS in production

**Usage in MirrorV3:**

```typescript
const webSpeech = useWebSpeech({
  onTranscript: (text, isFinal) => {
    if (isFinal) {
      setInputValue((prev) => prev + " " + text);
    }
  },
  onError: (error) => {
    console.error("[Voice]", error);
  },
  language: language === "es" ? "es-CO" : "en-US",
  continuous: true,
  interimResults: true,
});
```

### OpenAI Whisper (Backup)

**Advantages:**
- 99%+ accuracy
- Works in all browsers
- Supports 15+ languages
- Handles accents well

**Limitations:**
- Costs $0.006/minute
- Requires server round-trip
- 20 requests/hour rate limit
- Max 25MB file size

**Flow:**
1. MediaRecorder captures audio chunks
2. Silence detection (2s) auto-stops
3. Audio blob sent to /api/transcribe
4. Whisper returns text + metadata

---

## 12. Language System

### i18n Implementation

**Location:** `/Users/showowt/machinemind-builds/the-mirror/src/lib/i18n.ts`

**Structure:**

```typescript
export const T = {
  en: {
    // Landing
    welcome: "Welcome to The Mirror",
    enterMirror: "Enter The Mirror",
    tagline: "A space for honest reflection",

    // Input
    inputPlaceholder: "Share what's on your mind...",
    submit: "Share",
    listening: "Listening...",

    // Descent
    surface: "Surface",
    pattern: "Pattern",
    origin: "Origin",
    core: "Core",

    // Levels
    level1Q: "What's present for you right now?",
    level2Q: "What patterns do you notice?",
    level3Q: "Where might this come from?",
    level4Q: "What truth lives at the center?",

    // Actions
    continue: "Continue Deeper",
    complete: "Complete Journey",
    newSession: "New Session",

    // Vault
    vault: "Vault",
    noSessions: "No sessions yet",

    // Auth
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",

    // Crisis
    crisisTitle: "Need support?",
    crisisText: "If you're in crisis, help is available.",
    crisisLink: "Crisis Resources",

    // ... 50+ more keys
  },
  es: {
    welcome: "Bienvenido a El Espejo",
    enterMirror: "Entrar al Espejo",
    tagline: "Un espacio para la reflexión honesta",
    // ... Spanish translations for all keys
  },
};

export function formatDate(date: string, locale: "en" | "es"): string {
  return new Date(date).toLocaleDateString(
    locale === "es" ? "es-CO" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
}
```

### Language Detection

```typescript
// Auto-detect from browser
useEffect(() => {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("es")) {
    setLanguage("es");
  }
}, []);
```

### Voice Language Mapping

```typescript
const voiceLanguages = {
  en: "en-US",
  es: "es-CO",  // Colombian Spanish for target market
};
```

---

## 13. Security

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                   AUTH FLOW                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Option 1: Email/Password                                │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐         │
│  │ Sign Up │───▶│ Supabase │───▶│ Session Set │         │
│  └─────────┘    │ Auth     │    └─────────────┘         │
│                 └──────────┘                             │
│                                                          │
│  Option 2: Magic Link                                    │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐         │
│  │ Request │───▶│ Email    │───▶│ Click Link  │         │
│  │ Link    │    │ Sent     │    │             │         │
│  └─────────┘    └──────────┘    └──────┬──────┘         │
│                                        │                 │
│                                        ▼                 │
│                               ┌─────────────────┐        │
│                               │ /auth/callback  │        │
│                               │ Code Exchange   │        │
│                               └────────┬────────┘        │
│                                        │                 │
│                                        ▼                 │
│                               ┌─────────────────┐        │
│                               │ Session Created │        │
│                               └─────────────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Security Headers (next.config.mjs)

```javascript
headers: [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Permissions-Policy",
        value: "microphone=(self)"
      },
    ],
  },
],
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/mirror/v3 | 50 requests | Per day |
| /api/mirror | 15 requests | Per day |
| /api/transcribe | 20 requests | Per hour |

**Implementation:**

```typescript
const rateMap = new Map<string, { count: number; start: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);

  // Cleanup old entries
  // Check/update count
  // Return status
}
```

### Data Protection

1. **Anonymous Mode**
   - All data in localStorage (client-only)
   - No server-side storage
   - No cookies for tracking

2. **Authenticated Mode**
   - Supabase RLS (Row Level Security)
   - JWT token validation
   - Server-side session management

3. **Voice Data**
   - Web Speech: Processed locally by browser
   - Whisper: Audio sent to OpenAI (not stored)

---

## 14. Styling

### Design System (globals.css)

**File Size:** 2100+ lines

### CSS Custom Properties

```css
:root {
  /* Void/Background */
  --color-void: #030304;
  --color-surface-dark: #0a0a0b;

  /* Light System */
  --light-full: rgba(255, 255, 255, 1);
  --light-90: rgba(255, 255, 255, 0.9);
  --light-70: rgba(255, 255, 255, 0.7);
  --light-50: rgba(255, 255, 255, 0.5);
  --light-30: rgba(255, 255, 255, 0.3);
  --light-10: rgba(255, 255, 255, 0.1);
  --light-05: rgba(255, 255, 255, 0.05);

  /* Descent Level Colors */
  --color-surface: #7dd3fc;   /* sky-300 */
  --color-pattern: #a78bfa;   /* violet-400 */
  --color-origin: #f472b6;    /* pink-400 */
  --color-core: #fbbf24;      /* amber-400 */

  /* Accent */
  --color-gold: #C9A84C;
  --color-gold-bright: #F5D47A;

  /* Typography */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Outfit', system-ui, sans-serif;
}
```

### Typography

**Fonts (loaded in layout.tsx):**

```typescript
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
```

**Usage:**

```css
/* Headings */
font-family: var(--font-display);
font-weight: 400;
letter-spacing: -0.02em;

/* Body */
font-family: var(--font-body);
font-weight: 300;
letter-spacing: 0.01em;
line-height: 1.7;
```

### Responsive Breakpoints

```css
/* Mobile-first approach */
/* Base: Mobile (< 640px) */

/* Tablet and up */
@media (min-width: 640px) {
  .container {
    max-width: 600px;
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 800px;
  }
}
```

### Component Classes

```css
/* Glass morphism card */
.glass-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
}

/* Gold accent button */
.gold-button {
  background: linear-gradient(135deg, var(--color-gold), var(--color-gold-bright));
  color: #000;
  font-weight: 500;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.gold-button:hover {
  box-shadow: 0 0 30px rgba(201, 168, 76, 0.4);
  transform: translateY(-2px);
}

/* Level indicator dots */
.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.level-dot.active {
  background: var(--level-color);
  box-shadow: 0 0 10px var(--level-color);
}

.level-dot.current {
  animation: levelPulse 1.5s ease-in-out infinite;
}
```

---

## 15. AI Integration

### Claude API Configuration

```typescript
// Model
const MODEL = "claude-sonnet-4-20250514";

// Settings
max_tokens: 1000
temperature: (not specified, uses default ~1.0)
```

### System Prompt Architecture

The system prompt is dynamically constructed based on:

1. **Current Descent Level**
2. **User's Language**
3. **Cognitive Map State**
4. **Detected Patterns**
5. **Session History**

**Prompt Builder (MirrorV3.tsx):**

```typescript
function buildSystemPrompt(level: number, lang: "en" | "es") {
  const levelPrompts = {
    0: lang === "es"
      ? "Eres un espejo psicológico. Nivel: SUPERFICIE. Refleja lo que el usuario comparte sin juicio. Haz una pregunta que invite a más profundidad."
      : "You are a psychological mirror. Level: SURFACE. Reflect what the user shares without judgment. Ask one question that invites deeper exploration.",
    1: "Level: PATTERN. Help the user notice recurring themes...",
    2: "Level: ORIGIN. Guide the user to explore where patterns began...",
    3: "Level: CORE. Help the user touch the deepest truth...",
  };

  let prompt = levelPrompts[level];

  // Add cognitive map context
  if (cognitiveMap) {
    prompt += `\n\nUser's cognitive map: Self-awareness ${cognitiveMap.selfAwareness}%, Pattern recognition ${cognitiveMap.patternRecognition}%...`;
  }

  // Add pattern context
  if (patterns.length > 0) {
    prompt += `\n\nIdentified patterns: ${patterns.map(p => p.name).join(", ")}`;
  }

  return prompt;
}
```

### Response Handling

```typescript
async function sendToMirror(content: string, level: number) {
  setDescentPhase("processing");

  const systemPrompt = buildSystemPrompt(level, language);

  try {
    const response = await fetch("/api/mirror/v3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        content,
      }),
    });

    if (!response.ok) throw new Error("API error");

    const data = await response.json();

    // Update state
    setDescentResponses(prev => [...prev, data.response]);
    saveEntry("mirror", data.response);
    setDescentPhase("showing");

  } catch (error) {
    console.error("[Mirror]", error);
    // Graceful fallback
  }
}
```

### Session Analysis

At journey completion, AI analyzes the full session:

```typescript
async function analyzeSession() {
  const analysisPrompt = `
    Analyze this reflection session and return JSON:
    {
      "patterns": ["pattern1", "pattern2"],
      "themes": ["theme1", "theme2"],
      "cognitiveGrowth": {
        "selfAwareness": +5,
        "emotionalClarity": +3,
        ...
      },
      "summary": "Brief session summary"
    }
  `;

  const response = await fetch("/api/mirror/v3", {
    method: "POST",
    body: JSON.stringify({
      systemPrompt: analysisPrompt,
      content: JSON.stringify(currentSession.entries),
    }),
  });

  const analysis = JSON.parse((await response.json()).response);

  // Update patterns
  // Update cognitive map
  // Save session summary
}
```

### Crisis Detection

**Implementation (MirrorV3.tsx):**

```typescript
const CRISIS_WORDS = {
  en: [
    "suicide", "kill myself", "end my life", "want to die",
    "hurt myself", "self-harm", "cutting", "overdose",
    "no reason to live", "better off dead", "can't go on"
  ],
  es: [
    "suicidio", "matarme", "quitarme la vida", "quiero morir",
    "hacerme daño", "autolesión", "cortarme", "sobredosis",
    "no hay razón para vivir", "mejor muerto"
  ]
};

function checkForCrisisWords(text: string): boolean {
  const words = CRISIS_WORDS[language];
  const lower = text.toLowerCase();
  return words.some(word => lower.includes(word));
}

// Usage in input handler
function handleSubmit() {
  if (checkForCrisisWords(inputValue)) {
    setShowCrisisBar(true);
  }
  // Continue with normal flow (non-blocking)
}
```

---

## Appendix A: Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Supabase (for authenticated mode)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
NEXT_PUBLIC_APP_URL=https://the-mirror.vercel.app
```

---

## Appendix B: Deployment

### Vercel Configuration

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "nodeVersion": "20.x"
}
```

### Required Vercel Settings

1. Environment variables (see above)
2. Edge runtime enabled for API routes
3. Node.js 20.x runtime

---

## Appendix C: Future Enhancements

1. **Voice Output (TTS)** - AI reads responses aloud
2. **Meditation Mode** - Guided breathing between levels
3. **Pattern Visualization** - Graph view of cognitive map
4. **Export** - PDF/JSON session exports
5. **Sharing** - Anonymous insight sharing
6. **Therapist Integration** - Export for clinical review

---

*Documentation generated: March 2026*
*The Mirror v3.0 | MachineMind Genesis Engine*
