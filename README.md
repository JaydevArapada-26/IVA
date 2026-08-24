<div align="center">

  <img src="./logo.png" alt="IVA Logo" width="120" height="120" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />

# 🇮🇳 IVA — Intelligent Vanguard Assistant

### _Empowering Every Citizen. Bridging Every Scheme._

#### _Sarkari Yojana, Aasaan Bhasha Mein._

[![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen?style=for-the-badge)](https://github.com/JaydevArapada-26/IVA)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Node.js%20%7C%20TypeScript%20%7C%20Supabase-718355?style=for-the-badge)](#9-detailed-tech-stack)
[![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange?style=for-the-badge)](#11-ai-assistant)
[![SMS](https://img.shields.io/badge/SMS-Twilio%20%7C%20MSG91-blueviolet?style=for-the-badge)](#12-sms-system)
[![Languages](https://img.shields.io/badge/Languages-10%20Indian%20Languages-success?style=for-the-badge)](#16-accessibility)

</div>

---

> [!IMPORTANT]
> **Digital Public Infrastructure (DPI) Prototype**
> IVA is an AI-powered, multilingual welfare scheme discovery platform designed to eliminate information asymmetry across 4,670+ Indian central and state government schemes. Powered by a deterministic rule-based eligibility engine, SMS-first delivery architecture, and voice assistance.

---

## 📑 Table of Contents

- [1. Project Header & Badges](#1-project-header)
- [2. Project Overview](#2-project-overview)
- [3. Problem Statement](#3-problem-statement)
- [4. Our Solution](#4-our-solution)
- [5. Key Features Matrix](#5-key-features)
- [6. Unique Selling Points (USPs)](#6-unique-selling-points)
- [7. System Architecture](#7-system-architecture)
- [8. Application & Data Flows](#8-application-flow)
- [9. Detailed Tech Stack](#9-detailed-tech-stack)
- [10. Eligibility Engine Deep Dive](#10-eligibility-engine)
- [11. AI Assistant & Multilingual Voice](#11-ai-assistant)
- [12. SMS Delivery Architecture](#12-sms-system)
- [13. Database Schema & Data Models](#13-database-design)
- [14. User Experience & Navigation Guide](#14-user-experience)
- [15. UI/UX Design System](#15-ui-design)
- [16. Accessibility & Inclusivity](#16-accessibility)
- [17. Privacy-First Architecture](#17-privacy)
- [18. Security & Authentication](#18-security)
- [19. Complete Project Structure](#19-project-structure)
- [20. Installation & Setup Guide](#20-installation)
- [21. Environment Variables Reference](#21-environment-variables)
- [22. Future Roadmap](#22-future-roadmap)
- [23. Engineering Challenges & Solutions](#23-challenges)
- [24. What We Learned](#24-what-we-learned)
- [25. Social Impact Assessment](#25-impact)
- [26. Core Team](#26-team)
- [27. Contributing Guidelines](#27-contributing)
- [28. License](#28-license)
- [29. Acknowledgements](#29-acknowledgements)
- [30. Future Vision](#30-future-vision)

---

## 2. Project Overview

**IVA (Intelligent Welfare Assistance)** is a Digital Public Infrastructure platform designed to ensure that **no Indian citizen misses a government benefit due to lack of information, literacy, or language barriers**.

India spends over **₹3,000,000 Crore (~$360 Billion)** annually on direct welfare, subsidies, and development assistance spread across **4,670+ schemes** across central ministries and 28 states. Yet, over 60% of eligible citizens—especially in rural areas, farming communities, senior citizens, and low-income households—never apply for benefits they legally qualify for.

IVA addresses this challenge at scale:

1. **Profile Once, Match Always**: Citizens share basic attributes (state, district, age, occupation, income range, category, and document availability) once.
2. **Deterministic Engine**: A graded, multi-factor priority engine scans 4,670+ schemes instantly and computes a 0–100 eligibility & urgency score per scheme.
3. **Multilingual Voice & Chat**: Powered by Google Gemini AI, citizens can ask questions out loud in Hindi, Tamil, Telugu, Marathi, Gujarati, Bengali, Kannada, Malayalam, Odia, or English.
4. **SMS-First Delivery**: Personalized scheme alerts and application summaries are sent directly via SMS, enabling last-mile delivery on feature phones without requiring an internet connection.

```
┌─────────────────┐       ┌────────────────────────┐       ┌──────────────────┐
│  Indian Citizen │ ────► │  IVA Eligibility Engine│ ────► │ Official Scheme  │
│ (Web/Voice/SMS) │       │ (Deterministic & AI)   │       │ Portal/CSC Center│
└─────────────────┘       └────────────────────────┘       └──────────────────┘
```

---

## 3. Problem Statement

The welfare delivery ecosystem in India faces structural barriers at the discovery phase:

```mermaid
graph TD
    A["4,670+ Government Schemes"] --> B["Scattered Across 1,000+ Portals"]
    B --> C["Complex Eligibility Criteria"]
    C --> D["English/Hindi Only Jargon"]
    D --> E["Information Asymmetry & Middlemen"]
    E --> F["Citizen Abandonment & Missed Benefits"]
```

### The 6 Core Pain Points:

1. **Extreme Information Fragmentation**: Schemes are split across hundreds of central and state government portals (MyScheme, PM-Kisan, National Portal, individual state portals) with no single unified matching engine.
2. **Opaque & Complex Eligibility Rules**: Eligibility criteria involve multi-variable combinations (e.g. Landholding < 2 hectares AND Income < 2.5 Lakhs AND SC/ST Category AND Resident of Maharashtra). Citizens cannot decipher complex legal notifications.
3. **Severe Language & Jargon Barriers**: Over 70% of rural citizens do not read formal administrative English or official Hindi legalese.
4. **The Feature Phone & Digital Divide**: Millions of citizens in rural India possess basic feature phones (2G/3G) without active internet access or app capabilities. Existing portals require modern desktop browsers.
5. **Middlemen Exploitation & Corruption**: Due to confusion, citizens rely on unauthorized brokers who charge high commissions (up to 30% of benefit amounts) to fill simple application forms.
6. **Document Confusion**: Citizens visit CSC (Common Service Centre) offices without knowing the required certificate checklist, resulting in repeated trips and application rejections.

---

## 4. Our Solution

IVA bridges the discovery gap through an intelligent, citizen-first platform:

> [!TIP]
> **Deterministic Matching + Natural Language AI**
> IVA uses a **deterministic rule engine** for zero-error eligibility scoring combined with a **multilingual AI conversational interface** for natural human interaction.

```mermaid
flowchart LR
    subgraph Inputs
        A[Citizen Profile]
        B[Document Checklist]
    end

    subgraph IVA Core Platform
        C[Deterministic Rule Engine]
        D[Priority Scoring Engine]
        E[Gemini Multilingual AI]
    end

    subgraph Channels
        F[Web Portal]
        G[Voice Assistant]
        H[SMS Pipeline]
    end

    Inputs --> C --> D --> F & G & H
    E <--> G & F
```

### How IVA Resolves Pain Points:

- **Unified Lookup**: 4,670+ pre-categorized schemes mapped in a single relational lookup database (`schemes_categorized`).
- **Zero Document Uploads**: Citizens simply check off documents they possess (Aadhaar, PAN, Ration, Domicile). IVA computes eligibility locally without ever storing sensitive physical files.
- **SMS Reach**: Direct SMS dispatch delivers concise scheme recommendations, eligibility rationales, and document checklists to feature phone users.
- **AI Voice Assistant**: Spoken voice query resolution in 10 Indian languages.

---

## 5. Key Features

| Feature                              | Purpose                                                              | User Benefit                                                                      | Technical Implementation                                                           | Future Expansion                       |
| :----------------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :------------------------------------- |
| **Deterministic Eligibility Engine** | Computes 0–100 match score per scheme based on citizen attributes.   | Eliminates guesswork; shows exact match percentage and reason.                    | SQL multi-column evaluation (`schemes_categorized`) + TypeScript scoring pipeline. | Real-time policy change sync.          |
| **Priority Scoring Pipeline**        | Weights urgency (40%), eligibility (40%), and recency (20%).         | Urgently closing schemes float to the top of citizen recommendations.             | Decay calculation over 180 days since scheme publication date.                     | Machine learning feedback tuning.      |
| **Multilingual AI Assistant**        | Answers natural queries about schemes, benefits, and steps.          | Citizens can ask _"Mujhe kheti ke liye kaunsi yojana milegi?"_ in plain language. | Google Gemini 2.5 Flash API with conversation history tracking.                    | Fine-tuned Indic-LLM model.            |
| **SMS Notification Pipeline**        | Sends formatted scheme summaries and document lists via SMS.         | Works on any ₹2,000 feature phone without internet connection.                    | Twilio / MSG91 API integration with character-trimmed message generator.           | WhatsApp Business API & IVR call back. |
| **Document Availability Checklist**  | Tracks which 10 core certificates a citizen possesses.               | Prevents wasted trips to CSC centers by listing required docs upfront.            | Local state tracking + relational document mapping.                                | DigiLocker API integration.            |
| **Personalized Recommendations**     | "Schemes For Me" tab tailored to state, age, income, and occupation. | Curated dashboard of relevant benefits instead of searching thousands of items.   | Dynamic SQL pagination + citizen profile join.                                     | Cross-family member profile bundling.  |
| **Saved Schemes Reference**          | Allows citizens to bookmark schemes for offline application.         | Quick access to official portal links and required steps.                         | Relational `saved_schemes` table with cascade deletion.                            | Application deadline calendar sync.    |
| **SMS History Timeline**             | Displays past SMS recommendation dispatches.                         | Re-read sent SMS messages in a rich timeline view.                                | `sms_logs` table with delivery status badges (`Sent`, `Delivered`).                | Interactive SMS reply actions.         |
| **Glassmorphism UI Shell**           | Modern, accessible responsive design in light & dark modes.          | High contrast, calm aesthetic suitable for low-literacy users.                    | React + Vanilla CSS design system (`tokens.ts` & `theme.ts`).                      | PWA offline caching layer.             |
| **Story-Driven About Page**          | Transparent explanation of mission, vision, values, and founders.    | Builds trust with citizens and government stakeholders.                           | React component with responsive stat counters and founder cards.                   | Official government partner directory. |

---

## 6. Unique Selling Points (USPs)

```
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│              TRADITIONAL PORTALS              │                    IVA                        │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ ❌ Requires manual searching & filters        │ ✅ Proactive profile-based recommendations   │
│ ❌ Complex administrative English/Hindi       │ ✅ 10 Indian languages + AI Voice assistance │
│ ❌ Internet & smartphone required             │ ✅ Works on feature phones via SMS            │
│ ❌ Requires uploading sensitive PDF documents │ ✅ Privacy-first document availability check │
│ ❌ Probabilistic AI guesswork                 │ ✅ Deterministic, rule-based exact matching   │
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

1. **Deterministic Accuracy over AI Hallucinations**: Unlike purely generative AI search engines that invent non-existent government schemes, IVA uses a **hardened SQL eligibility engine** for matching and uses AI purely for natural language explanation.
2. **SMS-First Architecture for Bharat**: IVA is designed from the ground up for rural India. Scheme recommendations can be dispatched directly to feature phone numbers via SMS.
3. **Zero Document Storage (Privacy-First)**: IVA never asks citizens to upload sensitive PDF/image files (Aadhaar cards, PAN cards, income certificates). We only store boolean checkmarks (`hasAadhaar: true`), ensuring zero privacy risk or data leaks.
4. **Graded Priority Scoring**: Schemes are not listed randomly. They are ranked using a multi-factor score:
   $$\text{PriorityScore} = \min(100, \text{UrgencyPts} + \text{EligibilityPts} + \text{RecencyPts})$$

---

## 7. System Architecture

```mermaid
graph TB
    subgraph Client Layer
        Web[Web Portal - Next.js / TypeScript]
        SMS_Phone[Feature Phone - SMS Interface]
    end

    subgraph API Gateway & Routing
        API[Node.js HTTP Server]
        AuthGuard[Supabase JWT Auth Guard]
    end

    subgraph Core Engine Layer
        RuleEngine[Deterministic Eligibility Matching Engine]
        PriorityScore[Priority Scoring Pipeline]
        AIAssistant[Google Gemini 2.5 Flash AI Engine]
        SMSManager[SMS Dispatch Service - Twilio/MSG91]
    end

    subgraph Data & Storage Layer
        Supabase[(Supabase PostgreSQL Database)]
        SchemesDB[(schemes_categorized - 4,670 Rows)]
        UserProfiles[(Citizen Profiles & Document Checklists)]
        SMSLogs[(SMS History Logs)]
    end

    Web --> AuthGuard --> API
    SMS_Phone <. SMSManager

    API --> RuleEngine
    API --> PriorityScore
    API --> AIAssistant
    API --> SMSManager

    RuleEngine --> SchemesDB
    PriorityScore --> SchemesDB
    API --> UserProfiles
    SMSManager --> SMSLogs
    AIAssistant --> SchemesDB

    UserProfiles --> Supabase
    SMSLogs --> Supabase
```

### Architectural Component Breakdown:

- **Frontend (`apps/web`)**: Built with Next.js 14, React 18, TypeScript, and standard CSS design tokens (`tokens.ts`). Serves desktop, tablet, and mobile web browsers with light/dark theme toggle capabilities.
- **Backend API (`apps/backend`)**: Node.js API server hosting profile routes, recommendation controllers, SMS dispatch services, and Gemini AI endpoints.
- **Shared Package (`packages/shared`)**: Shared TypeScript contracts, DTOs, theme constants, i18n translations, and validation schemas used by both frontend and backend.
- **Database (`Supabase PostgreSQL`)**: Relational database storing authenticated users, citizen demographic profiles, document availability maps, saved schemes, SMS dispatch logs, and the 4,670-row `schemes_categorized` lookup table.

---

## 8. Application Flow

### 1. Citizen Registration & Onboarding Flow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Web as Web Portal
    participant API as Backend API
    participant DB as Supabase DB

    Citizen->>Web: Register with Email/Password or Phone
    Web->>API: POST /api/v1/auth/register
    API->>DB: Create User & Identity Record
    DB-->>API: User ID & JWT Token
    API-->>Web: Set Auth Token
    Citizen->>Web: Fill Demographic Profile (State, Age, Income, Occupation)
    Citizen->>Web: Mark Document Checklist (Aadhaar, PAN, Ration, etc.)
    Web->>API: PUT /api/v1/profile
    API->>DB: Upsert Profile & Document Checkmarks
    DB-->>API: Profile Updated DTO
    API-->>Web: Profile Ready
    Web->>Citizen: Redirect to "Schemes For Me" Dashboard
```

### 2. Scheme Matching & Priority Scoring Flow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Dashboard as Schemes For Me View
    participant Engine as Priority Engine
    participant DB as PostgreSQL schemes_categorized

    Citizen->>Dashboard: Open "Schemes For Me"
    Dashboard->>Engine: Fetch Recommendations (User Attributes)
    Engine->>DB: SELECT * FROM schemes_categorized WHERE State = User.State AND Income <= User.Income ...
    DB-->>Engine: 4,670 Candidate Schemes Filtered
    Engine->>Engine: Calculate Urgency (40pts) + Eligibility (40pts) + Recency (20pts)
    Engine->>Engine: Sort by Priority Score DESC
    Engine-->>Dashboard: Return Ranked Recommendation DTOs
    Dashboard-->>Citizen: Display Scheme Cards with Match Reason & Urgency Badges
```

---

## 9. Detailed Tech Stack

| Technology                  | Layer              | Purpose                                         | Why Chosen                                                              | Future Scalability                       |
| :-------------------------- | :----------------- | :---------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------- |
| **Next.js 14**              | Frontend Framework | Component-driven web interface                  | Industry standard, SSR & App Router support, rich ecosystem             | Server Components & production builds    |
| **TypeScript 5**            | Language           | Type safety across monorepo                     | Prevents runtime bugs across shared API contracts                       | Strict null checks & contract validation |
| **Node.js**                 | Backend API        | Custom HTTP REST API endpoints & business logic | Lightweight, non-blocking native I/O, fast execution                    | Microservices decomposition              |
| **Supabase (PostgreSQL)**   | Database & Auth    | Relational database & JWT authentication        | Built-in row-level security, instant REST APIs, PostgreSQL power        | Read replicas & connection pooling       |
| **Google Gemini 2.5 Flash** | AI Engine          | Multilingual conversational assistant           | Extremely low latency, 1M context window, native Indic language support | Fine-tuned domain model                  |
| **Twilio / MSG91 API**      | Communication      | SMS notification pipeline                       | Reliable last-mile delivery to feature phones across India              | Multi-gateway failover                   |
| **Drizzle ORM / Prisma**    | Database ORM       | Schema management & type-safe SQL queries       | High performance, zero-overhead SQL generation                          | Automated migration pipelines            |
| **Vanilla CSS & Tokens**    | Styling System     | Design system tokens (`tokens.ts`)              | Zero runtime overhead, 100% style control, zero utility CSS bloat       | CSS Modules / Styled Primitives          |

---

## 10. Eligibility Engine

The **IVA Priority Scoring Engine** evaluates candidate schemes for a citizen based on three mathematical components:

$$\text{PriorityScore} = \min\Big(100, \text{UrgencyPts} + \text{EligibilityPts} + \text{RecencyPts}\Big)$$

```
                               ┌─────────────────────────────┐
                               │     Candidate Scheme        │
                               └──────────────┬──────────────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     ▼                        ▼                        ▼
           ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
           │   Urgency Pts    │     │  Eligibility Pts │     │   Recency Pts    │
           │   (Max 40 Pts)   │     │   (Max 40 Pts)   │     │   (Max 20 Pts)   │
           └────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
                    │                        │                        │
                    │  isUrgent == true ? 40 │  score * 40            │  180-day decay
                    │  : 0                   │                        │  linear formula
                    │                        │                        │
                    └────────────────────────┼────────────────────────┘
                                              │
                                              ▼
                               ┌─────────────────────────────┐
                               │ Total Priority Score (0-100)│
                               └─────────────────────────────┘
```

### Breakdown of Scoring Factors:

1. **Urgency Points (40 Max)**:
   - Evaluated as `40` if `scheme.isUrgent === true` (e.g. deadline within 15 days or seasonal sowing support), else `0`.

2. **Eligibility Points (40 Max)**:
   - Evaluated as $\text{EligibilityScore} \times 40$, where $\text{EligibilityScore}$ (0.0 to 1.0) is the fraction of matched mandatory eligibility attributes (State, Category, Gender, Occupation, Income, and Document Availability).

3. **Recency Points (20 Max)**:
   - Evaluated using a 180-day linear decay formula from the scheme's publication date (`publishedAt`):
     $$\text{RecencyPts} = \max\left(0, 20 \times \left(1 - \frac{\text{DaysSincePublished}}{180}\right)\right)$$

---

## 11. AI Assistant

The **IVA AI Assistant** is powered by Google Gemini 2.5 Flash API and provides natural language conversational help in **10 Indian languages**.

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Voice as Voice/Chat UI
    participant Assistant as WebAssistant Component
    participant Gemini as Google Gemini 2.5 Flash API
    participant DB as Schemes Database

    Citizen->>Voice: "Mujhe kheti ke liye kaunsi yojana milegi?"
    Voice->>Assistant: POST /api/v1/assistant/chat { message, language: "hi" }
    Assistant->>DB: Fetch relevant scheme context matching query
    DB-->>Assistant: Scheme context data
    Assistant->>Gemini: Prompt + System Persona + Scheme Context + Citizen Profile
    Gemini-->>Assistant: Natural language response in Hindi
    Assistant-->>Voice: Display response bubble & optional text-to-speech output
```

### Supported Languages:

- 🇮🇳 English
- 🇮🇳 Hindi (हिन्दी)
- 🇮🇳 Tamil (தமிழ்)
- 🇮🇳 Telugu (తెలుగు)
- 🇮🇳 Bengali (বাংলা)
- 🇮🇳 Marathi (मराठी)
- 🇮🇳 Gujarati (ગુજરાતી)
- 🇮🇳 Kannada (કન્નડ)
- 🇮🇳 Malayalam (മലയാളം)
- 🇮🇳 Odia (ଓଡ଼ିଆ)

---

## 12. SMS System

IVA features a dedicated SMS pipeline (`admin-send-sms.ts`) designed to reach citizens who do not possess smartphones or active internet access:

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Admin / System  │ ────► │ SMS Dispatch Service │ ────► │ Twilio / MSG91  │ ────► │ Feature Phone   │
│ Trigger         │       │ (Message Trimmer)    │       │ Gateway         │       │ (Any 2G Network)│
└─────────────────┘       └──────────────────────┘       └─────────────────┘       └─────────────────┘
```

### Key Technical Capabilities:

- **Automatic Title Trimming**: Scheme titles are trimmed dynamically so the overall message does not exceed standard SMS segment limits (160 characters for single segment).
- **Auto-Dismiss Feedback**: UI notifications automatically clear after 5 seconds post-dispatch.
- **Delivery Logging**: Every dispatched SMS is logged into the `sms_logs` table with timestamp, recipient number, message payload, and status (`sent`, `delivered`, `failed`).

---

## 13. Database Design

```mermaid
erDiagram
    USERS ||--o{ PROFILES : owns
    PROFILES ||--o{ SAVED_SCHEMES : saves
    PROFILES ||--o{ SMS_LOGS : receives
    SCHEMES_CATEGORIZED ||--o{ SAVED_SCHEMES : referenced_in

    USERS {
        uuid id PK
        string email
        string encrypted_password
        timestamp created_at
    }

    PROFILES {
        uuid id PK
        uuid user_id FK
        string name
        string username
        string phone_number
        string state
        string district
        string occupation
        string income_range
        boolean disability_status
        jsonb documents
        timestamp updated_at
    }

    SCHEMES_CATEGORIZED {
        uuid id PK
        string title
        string slug
        string category
        string department
        string state
        text summary
        text full_description
        text eligibility_text
        text benefits_text
        text documents_required_text
        boolean is_urgent
        timestamp published_at
    }

    SAVED_SCHEMES {
        uuid id PK
        uuid user_id FK
        uuid scheme_id FK
        timestamp saved_at
    }

    SMS_LOGS {
        uuid id PK
        uuid user_id FK
        string phone_number
        text message_body
        string status
        timestamp sent_at
    }
```

---

## 14. User Experience

| Page                    | Route                     | Purpose                                                                 | Key UI Components                                                                    |
| :---------------------- | :------------------------ | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Home Page**           | `/`                       | Platform introduction, stats, feature highlights, and CTA.              | Radial background artwork, stat counters, feature cards, 3-step process.             |
| **Scheme Directory**    | `/schemes`                | Searchable directory of 4,670+ central and state schemes.               | Sticky search bar with glow, skeleton loaders, detail reader pane.                   |
| **Schemes For Me**      | `/profile/schemes-for-me` | Personalized AI/rule-ranked recommendations.                            | Match reason bubbles, urgency stripes, 3-step empty state hints.                     |
| **Saved Schemes**       | `/saved-schemes`          | Citizen's bookmarked schemes for offline application.                   | Saved date badges, external official portal CTA, unsave toggle.                      |
| **SMS History**         | `/sms-history`            | Timeline of recommendation SMS messages sent to citizen's phone.        | Status dot connectors (`Sent`, `Delivered`), expandable message boxes.               |
| **Profile Dashboard**   | `/profile/dashboard`      | Manage demographics, location, and document availability checklist.     | Section icons, read/edit card containers, Yes/No toggle pills.                       |
| **Password & Security** | `/profile/password`       | Manage account password & authentication security.                      | Password reset request card, security requirements list.                             |
| **About Us**            | `/about`                  | Story-driven explanation of mission, vision, values, and founders.      | Mission/vision cards, founder cards (Nistha Leua & Jaydev Arapada), privacy promise. |
| **AI Assistant**        | `/assistant`              | Interactive conversational helper (also available via floating bubble). | Starter prompt chips, speech bubbles, animated 3-dot thinking indicator.             |

---

## 15. UI Design

The IVA design system is built using vanilla CSS with design tokens defined in `apps/web/src/design/tokens.ts`:

- **Primary Color Palette**:
  - `Primary`: `#718355` (Sage Olive Green)
  - `Primary Hover`: `#586741` (Deep Forest Olive)
  - `Secondary`: `#87986a` (Soft Muted Olive)
  - `Border`: `#cfe1b9` (Subtle Olive Green Border)
  - `Background (Light)`: `#f0f7e8` (Soft Cream White)
  - `Background (Dark)`: `#081c15` (Deep Emerald Night)
- **Typography**:
  - Display Headings: `'Outfit', sans-serif`
  - Body Text: `'Inter', sans-serif`
  - Brand Elements: `'Noto Serif', serif`
- **Surface Elevation**: Layered cards (`surface`, `surfaceSubtle`, `surfaceElevated`) with frosted glassmorphism backdrops (`backdrop-filter: blur(16px)`).

---

## 16. Accessibility

> [!NOTE]
> **Inclusive by Design**
> IVA complies with WCAG 2.1 Level AA contrast guidelines across both light and dark modes to remain accessible to senior citizens and low-vision users.

- **Visible Focus Rings**: All interactive buttons, inputs, and selectors feature high-visibility focus indicators (`0 0 0 3px rgba(113,131,85,0.2)`).
- **Keyboard Navigation**: Full keyboard tab order support across forms, drawers, and scheme reader panes.
- **Screen Reader Friendly**: Semantic HTML5 tags (`<nav>`, `<main>`, `<section>`, `<article>`, `<header>`) with explicit `aria-label` attributes.
- **Large Touch Targets**: Minimum 44px x 44px touch targets on mobile viewports for effortless thumb navigation.

---

## 17. Privacy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        IVA PRIVACY PROMISE                             │
├────────────────────────────────────────────────────────────────────────┤
│ 🛡️ NO PHYSICAL DOCUMENT UPLOADS                                        │
│ IVA never asks citizens to upload PDF scans or photos of Aadhaar,     │
│ PAN, or income certificates.                                          │
│                                                                        │
│ 🛡️ LOCAL DOCUMENT CHECKMARKS                                           │
│ We only track boolean availability checkmarks (hasAadhaar: true) to    │
│ evaluate eligibility scoring.                                          │
│                                                                        │
│ 🛡️ ZERO HIDDEN COMMISSIONS                                             │
│ 100% free and open platform without referral fees or middlemen.        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Security

- **Supabase JWT Authentication**: Secure password hashing (bcrypt) and session management handled via Supabase Auth.
- **Row-Level Security (RLS)**: PostgreSQL tables enforce user-isolated data access policies (`auth.uid() = user_id`).
- **Session Timeout Protection**: Automatic session expiration check every 2 minutes for inactive sessions.
- **Environment Isolation**: Sensitive keys (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `TWILIO_AUTH_TOKEN`) are strictly scoped to the backend environment and never exposed to the client bundle.

---

## 19. Project Structure

```
IVA/
├── apps/
│   ├── backend/                     # Node.js REST API Server
│   │   ├── src/
│   │   │   ├── http/                # Server setup & HTTP router
│   │   │   ├── lib/                 # Core logic modules
│   │   │   │   ├── priority/        # Priority Scoring Engine (engine.ts)
│   │   │   │   └── twilio/          # Twilio SMS client
│   │   │   ├── routes/              # API routers (api/v1)
│   │   │   └── services/            # Admin & SMS services (admin-send-sms.ts)
│   │   ├── fly.toml                 # Fly.io deployment config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                         # Next.js 14 Frontend Application
│       ├── public/                  # Static assets (logo.png, homebglight.png, homebgdark.png)
│       ├── src/
│       │   ├── design/              # Design system tokens (tokens.ts)
│       │   ├── lib/                 # API client, Supabase client, session helpers
│       │   ├── pages/               # Application Views & Components
│       │   │   ├── LandingPage.tsx  # Hero, stats, features, 3-step process
│       │   │   ├── WebSchemes.tsx   # Scheme Directory & Document Reader
│       │   │   ├── SchemesForMeView.tsx # Personalized AI recommendations
│       │   │   ├── SavedSchemesView.tsx # Bookmarked schemes list
│       │   │   ├── SmsHistoryView.tsx   # SMS timeline view
│       │   │   ├── WebAssistant.tsx     # Gemini AI chat interface
│       │   │   ├── ProfileDashboardView.tsx # Profile & document checklist editor
│       │   │   ├── PasswordSecurityView.tsx # Password management
│       │   │   ├── AboutUsPage.tsx      # Story-driven mission page
│       │   │   └── SideNavDrawer.tsx    # Slide-over navigation drawer
│       │   ├── App.tsx              # Central state, routing, and shell
│       │   └── main.tsx             # Application entry point
│       ├── package.json
│       └── next.config.js
│
├── packages/
│   └── shared/                      # Shared Monorepo Package
│       ├── constants/               # Theme tokens (theme.ts), India location data
│       ├── contracts/               # TypeScript DTOs (profile, schemes)
│       ├── i18n/                    # Multilingual translation strings (translations.ts)
│       └── types/                   # Shared TypeScript type definitions
│
├── ui_assets/                       # Raw background & design assets
├── .env                             # Root environment variable configuration
├── package.json                     # Root monorepo workspace configuration
├── pnpm-workspace.yaml              # Monorepo workspace setup
├── README.md                        # Project documentation
└── tsconfig.base.json               # Shared TypeScript compiler options
```

---

## 20. Installation

### Prerequisites:

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**: v8.0.0 or higher
- **Git**

### Step-by-Step Local Setup:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/JaydevArapada-26/IVA.git
   cd IVA
   ```

2. **Install Workspace Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env` configuration file in the root directory:

   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase, Gemini AI, and Twilio credentials (see [Section 21](#21-environment-variables)).

4. **Start Development Servers**:
   Run all workspaces concurrently (Backend API + Frontend Web):

   ```bash
   npm run dev
   ```

   Or start frontend independently:

   ```bash
   cd apps/web
   npm run dev
   ```

5. **Open Local Application**:
   Navigate to `http://localhost:3000` in your web browser.

---

## 21. Environment Variables

| Variable Name                  | Required | Description                                                      | Example Value                               |
| :----------------------------- | :------: | :--------------------------------------------------------------- | :------------------------------------------ |
| `DATABASE_URL`                 |   Yes    | Supabase PostgreSQL connection string                            | `postgresql://postgres:[PASSWORD]@aws-1...` |
| `SUPABASE_URL`                 |   Yes    | Supabase project API endpoint URL                                | `https://oqryjwfdlncfyxvonkbh.supabase.co`  |
| `SUPABASE_ANON_KEY`            |   Yes    | Supabase public anonymous API key                                | `eyJhbGciOiJIUzI1NiIsInR5cCI6...`           |
| `SUPABASE_SERVICE_ROLE_KEY`    |   Yes    | Supabase secret service role key                                 | `eyJhbGciOiJIUzI1NiIsInR5cCI6...`           |
| `GEMINI_API_KEY`               |   Yes    | Google Gemini AI API key                                         | `AQ.Ab8RN6ICKTtUjhVzhQctbqMx...`            |
| `GEMINI_MODEL`                 |    No    | Gemini model designation                                         | `gemini-2.5-flash`                          |
| `SMS_PROVIDER`                 |   Yes    | Active SMS gateway (`twilio` \| `msg91` \| `fast2sms` \| `stub`) | `twilio`                                    |
| `TWILIO_ACCOUNT_SID`           |   Yes    | Twilio account SID                                               | `ACb8e83a41edf22c2499bc008a12...`           |
| `TWILIO_AUTH_TOKEN`            |   Yes    | Twilio authentication token                                      | `c27c6647da587cd42c2738775...`              |
| `TWILIO_FROM_NUMBER`           |   Yes    | Twilio phone number                                              | `+19384441326`                              |
| `TWILIO_MESSAGING_SERVICE_SID` |    No    | Twilio messaging service SID                                     | `MG71f4af178d757a5f05ed30aac...`            |
| `ADMIN_SECRET_KEY`             |   Yes    | Secret key for administrative SMS triggers                       | `1234`                                      |

---

## 22. Future Roadmap

```mermaid
timeline
    title IVA Development Roadmap (2026 - 2027)
    section Phase 1 (Completed)
        Deterministic Engine : 4,670+ Schemes DB : SMS Delivery : Next.js Web App : Gemini Multilingual AI
    section Phase 2 (Q3 2026)
        Native Mobile App (React Native/Expo) : WhatsApp Bot : DigiLocker OAuth : IVR Phone Gateway
    section Phase 3 (Q4 2026)
        CSC Kiosk Portal : Real-time Application Tracker : AI Document Reader (OCR)
    section Phase 4 (2027)
        Pan-India State Integrations : Direct Benefit Transfer (DBT) Status API
```

- 🟢 **Native Mobile Application (`@iva/mobile`)**: Cross-platform iOS and Android apps built with React Native & Expo featuring offline scheme caching and push notifications (coming in future releases).
- 🟢 **WhatsApp Conversational Bot**: Extend IVA recommendation dispatches directly to WhatsApp via WhatsApp Business API.
- 🟢 **DigiLocker Integration**: One-click verification of document availability using official DigiLocker OAuth APIs.
- 🟢 **IVR Voice Calls**: Interactive Voice Response (IVR) phone line allowing non-literate citizens to dial a toll-free number and hear scheme recommendations.
- 🟢 **CSC Kiosk Integration**: Dedicated interface tailored for Common Service Centre (CSC) operators across 300,000+ villages.

---

## 23. Challenges

| Challenge Area                            | Difficulty | Problem Encountered                                                                   | Engineering Solution Implemented                                                                               |
| :---------------------------------------- | :--------: | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| **Data Normalization**                    |  🔴 High   | 4,670+ schemes across 28 states used inconsistent criteria formats and labels.        | Pre-processed dataset into `schemes_categorized` table with standardized boolean/numeric columns.              |
| **Deterministic vs. Generative Accuracy** |  🔴 High   | LLMs frequently hallucinated non-existent scheme benefits or incorrect deadlines.     | Decoupled matching from AI: SQL engine matches data deterministically, Gemini AI explains it conversationally. |
| **Feature Phone Reach**                   | 🟡 Medium  | Standard web pages cannot run on basic keypad phones.                                 | Developed an SMS delivery service that trims title lengths and formats messages for 160-char SMS limits.       |
| **Responsive Reading Pane**               | 🟡 Medium  | Scheme detail pane suffered layout shifts and double scrollbars on smaller viewports. | Built a flex column layout with independent reader pane scrolling and fixed sticky header boundaries.          |

---

## 24. What We Learned

1. **Deterministic Logic Builds Trust**: When dealing with government benefits, citizens and government officials demand 100% deterministic accuracy. Combining hard SQL rules with conversational AI bridges trust and usability.
2. **Design for the Last Mile**: True inclusivity in India requires multi-channel delivery (Web, Voice, SMS, and feature phone compatibility).
3. **Monorepo Architecture Speeds Iteration**: Maintaining shared DTO contracts (`packages/shared`) between backend and frontend eliminated contract drift during rapid UI overhauls.

---

## 25. Impact

```
                          IMPACT SPECTRUM
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🌾 RURAL FARMERS │  │ 🎓 STUDENTS      │  │ 👩 WOMEN & ELDERLY│
│ Fast access to   │  │ Instant matching │  │ Zero-middlemen   │
│ PM-Kisan & Soil  │  │ to scholarship & │  │ direct benefit   │
│ Health schemes.  │  │ skill schemes.   │  │ discovery.       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

- **Direct Impact Target**: 100M+ underserved citizens across rural India, tier-2/3 towns, farming households, and low-income demographics.
- **Middlemen Elimination**: Saves citizens up to ₹500–₹2,000 per application by enabling direct self-discovery without paying unauthorized brokers.

---

## 26. Team

<div align="center">

| [<img src="https://github.com/lunewhite.png" width="100" style="border-radius:50%"><br>**Nistha Leua**](https://github.com/JaydevArapada-26) | [<img src="https://github.com/JaydevArapada-26.png" width="100" style="border-radius:50%"><br>**Jaydev Arapada**](https://github.com/JaydevArapada-26) |
| :------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                        **Co-Founder & Product Lead**                                                         |                                                            **Co-Founder & Lead Architect**                                                             |
|                            Multilingual UX design, product strategy, citizen research, and front-end experience.                             |                                    AI eligibility engine, backend systems, database architecture, and SMS pipeline.                                    |

</div>

---

## 27. Contributing

We welcome open-source contributions from developers, designers, data scientists, and language translators!

1. **Fork the Repository**: `https://github.com/JaydevArapada-26/IVA/fork`
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Your Changes**: `git commit -m 'Add amazing feature'`
4. **Push to the Branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

---

## 28. License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 29. Acknowledgements

- **Digital India Initiative**: For inspiring Digital Public Infrastructure.
- **MyScheme Portal**: For benchmark government scheme datasets.
- **Google DeepMind & Gemini**: For AI conversational infrastructure.
- **Supabase**: For database & authentication infrastructure.

---

## 30. Future Vision

<div align="center">

> ### _"No eligible citizen should ever miss a government benefit because they couldn't find it."_

IVA represents a fundamental shift in how citizens interact with public welfare—moving from fragmented, complex bureaucratic portals to proactive, intelligent, and inclusive public infrastructure for every Indian.

> **Note on Mobile App**: The native mobile application (`@iva/mobile` powered by React Native & Expo) will be included in upcoming future releases as part of Phase 2 of our product roadmap.

</div>
