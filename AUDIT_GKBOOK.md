# Phase 0 Read-Only Architecture Audit: "GK Book" Integration

**Document Version:** 1.0.0  
**Target Repository:** QuizWeb (`quiz-app`)  
**Git Branch:** `feat/gk-book`  
**Reference Document:** `gk-book.html`  
**Status:** Audit Complete — Awaiting User Approval before Phase 1  

---

## 1. Stack & System Architecture

| Component | Current Implementation | Details / Path |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2.0 | App Router architecture with custom HTTP + WebSocket server (`server.js`) |
| **Router Type** | Next.js App Router | All routes located in `src/app/` (`page.jsx`, `layout.jsx`, `[...slug]` patterns) |
| **Static Assets** | `public/` directory | Accessible directly at the web root (e.g. `/images`, `/icons`, `/gk-book/`) |
| **Styling System** | Hybrid: Tailwind CSS + CSS Modules + CSS Custom Properties | Tailwind v3 (`tailwind.config.js`), CSS Modules in `src/styles/*.module.css`, tokens in `src/app/globals.css` |
| **Typography** | Google Fonts | `Poppins`, `Inter`, `Noto Sans Devanagari` (loaded via CDN / layout) |
| **ORM & Database** | Dual Driver: Prisma ORM + MongoDB Native Driver | • Prisma Client v6.19.3 (`prisma/schema.prisma`)<br>• Native MongoClient (`src/lib/mongoDb.js`) for aggregation & flexible schemas |
| **Database Engine** | MongoDB Atlas | Cluster: `cluster0.oz8064k.mongodb.net/quizweb` |
| **Auth & Session** | NextAuth.js v4.24.13 | • Users: JWT strategy with Google OAuth + single-device session versioning (`src/lib/auth.js`)<br>• Admins: Dedicated cookie & credentials provider (`src/lib/adminAuth.js`) |

---

## 2. Taxonomy Architecture & Storage

### 2.1 Hierarchy Model
QuizWeb's taxonomy is organized into 4 hierarchical levels:
1. **Level 1 — Main Category (`Master Category`)**: 40 canonical categories defined in `src/lib/mainCategoriesConfig.js` (`MAIN_CATEGORIES`), e.g., `india-gk` ("India GK" / "भारत सामान्य ज्ञान"), `world-gk` ("World GK"). Also backed by the `Category` collection in MongoDB.
2. **Level 2 — Sub-Category (`Category` / `subCategory`)**: Subdivisions within main categories, e.g., `indian-history` ("Indian History"), `indian-geography`.
3. **Level 3 — Topic (`Topic`)**: Canonical subject areas under subcategories, e.g., `"Ancient India"`, `"Medieval India"`, `"Modern India"`. Managed in the `gk_topics` collection and `MAIN_CATEGORIES[].subcategories[].topics`.
4. **Level 4 — Subject / Chapter (`Subject` / `Chapter`)**: Granular units under topics, e.g., `"Indus Valley Civilization"` (`Sindhu Ghati`). Managed in the `gk_subjects` collection and linked to question sets in `gk_sets`.

### 2.2 What `/api/admin/taxonomy-hierarchy` Returns
Located in `src/app/api/admin/taxonomy-hierarchy/route.js`, this endpoint returns:
- **`categories` Array**:
  ```json
  [
    {
      "id": 1,
      "slug": "india-gk",
      "name": "India GK",
      "nameHi": "भारत सामान्य ज्ञान",
      "icon": "🇮🇳",
      "subcategories": [
        {
          "name": "Indian History",
          "slug": "indian-history",
          "topics": [
            {
              "id": "ancient-india",
              "name": "Ancient India",
              "slug": "ancient-india",
              "tags": ["Indus Valley", "Harappa", "Mohenjo-daro", "Vedic Period", "Mauryan Empire"],
              "sets": [
                {
                  "id": "india-gk-indian-history-ancient-india-set-1",
                  "number": 1,
                  "title": "Set 1",
                  "questionCount": 20,
                  "tags": ["Indus Valley", "Harappa", "Mohenjo-daro"],
                  "difficultyBalance": { "easy": 7, "medium": 7, "hard": 6 }
                }
              ],
              "setsCount": 2
            }
          ]
        }
      ],
      "totalSubcategories": 10,
      "totalTopics": 40,
      "totalSets": 80
    }
  ]
  ```
- **`stats` Object**: `totalCategories: 40`, `totalSubcategories: 147`, `totalTopics: 538`, `totalSets: 344`, `totalTags: 1420`.
- **Target Node for Sindhu Ghati**:
  `India GK` (`india-gk`) ➔ `Indian History` (`indian-history`) ➔ `Ancient India` (`ancient-india`).

---

## 3. Question Schema & Quiz Engine Launch

### 3.1 Question Bank Schema (`Question` Collection)
Defined in `prisma/schema.prisma` and MongoDB `Question` collection:
- `id` / `_id`: Unique Identifier (ObjectId or string).
- `text` / `text_hi` / `text_en`: Question stem in Hindi and English.
- `options` / `options_list`: Array of 4 options (strings or JSON `{ id, text, text_hi }`).
- `correctAnswer` / `correct`: String matching the exact text of the correct choice.
- `correct_index` / `correctIndex`: Integer index `0..3`.
- `difficulty`: String enum: `"easy"`, `"medium"`, `"hard"`, `"expert"`.
- `difficulty_level`: Integer: `1` (Easy), `2` (Medium), `3` (Hard), `4` (Expert).
- `type` / `questionType`: String: `"MCQ"`, `"Learn"`, `"Explore"`, `"Rapid Fire"`.
- `tags`: `String[]` — Array of contextual and taxonomy tags.
- `exam` / `examTags`: `String[]` — Targeted exams (`"UPSC"`, `"SSC CGL"`, `"Railway RRB"`).
- `masterCategory`: `"GK"`.
- `category` / `categoryId`: Linked Category ID.
- `topic` / `topicId` / `topic_id`: Linked Topic.
- `subject` / `subjectId` / `subject_id`: Granular subject (e.g., `"Indus Valley Civilization"`).
- `status`: `"published"`, `"draft"`, `"review"`.

### 3.2 Quiz Launch Mechanism (`/quiz/<slug>?set=...`)
Quizzes are launched via two complementary patterns:
1. **Direct URL Navigation (`/quiz/[id]?set=<N>`)**:
   - Handled by `src/app/quiz/[id]/page.jsx`.
   - On initial mount or browser refresh with empty memory state:
     - First tries `/api/gk/topic-sets?setId=[id]&language=[lang]`.
     - Then falls back to `/api/categories/[id]`, slicing questions in chunks of 20 (`(set - 1) * 20` to `set * 20`).
2. **In-Memory Engine Launch (`startQuizSet` / `startMixedQuiz`)**:
   - `QuizContext.jsx` provides:
     - `startQuizSet(quizId, questions, timer, language, setIndex, categoryName, skipTranslation, seed, subjectId, topicId)`
     - `startMixedQuiz(questions, sectionName, timer, difficulty, language, style)`
   - The launching component pre-fetches or passes the questions array and immediately routes to `/quiz/[slug]`.

### 3.3 Can Arena/Quiz Engine Launch from `{tags, count, difficulty mix}`?
- **Finding**:
  - `quizEngine.buildQuiz({ categories, difficulty, count, ... })` currently calls `/api/arena/select`.
  - In `src/lib/arenaHelper.js` (`buildArenaFilter`), the filter accepts: `categories`, `topics`, `difficulties`, `audience`, `language`, `exam`, `state`, `excludeIds`.
  - **Crucial Gap Identified**: `buildArenaFilter` does **NOT** currently filter by `tags`. Furthermore, `quizEngine.buildQuiz` requires `categories.length > 0`.
- **Solution for GK Book**:
  - As required by Hard Rule 2 ("All new code lives in NEW places only: `/api/gk-book/*`"), we will create a dedicated endpoint:
    `GET /api/gk-book/quiz?tags=...&count=10&pageId=...`
  - It queries the database for published questions matching the page's `quiz_tags`, selects 10 with a balanced difficulty mix (e.g. 4 Easy, 4 Medium, 2 Hard), shuffles options, and returns them ready to play.
  - The page then calls `startMixedQuiz` or `startQuizSet` and routes to `/quiz/book?source=book&chapter=<id>&page=<id>`. This keeps existing quiz engine files 100% untouched.

---

## 4. Results Page & Gating Architecture

### 4.1 How `/results` Receives Data
- `src/app/results/page.jsx` is a client component consuming `useQuiz()` from `src/context/QuizContext.jsx`:
  - `score`, `questions`, `answers`, `quizId`, `difficulty`, `timerSetting`, `language`, `selectedSetIndex`, `timeTaken`.
- Currently, `/results` **does not parse query parameters** (`useSearchParams()` is not yet imported).
- It performs:
  - Game layer recording (`recordQuizCompletion`) for XP and badges.
  - Set progress persistence (`/api/gk/progress` and localStorage `quizweb_set_progress`).
  - Score breakdown by difficulty and question review.

### 4.2 Monetization, Free Sets, Pro, and Ads Gating
- Handled by `src/context/EntitlementContext.jsx` and `src/context/MonetizationContext.jsx`:
  - **Free Limit**: Free users/guests have an entitlement quota (`remainingSets`, default 2 per rolling window) verified via `/api/entitlement/check`.
  - **First Question Gate**: When a user begins playing, `recordFirstAnswer({ setId, categoryId, setIndex })` posts to `/api/attempts/record`.
  - **Ad Unlock / AdGate**: When the quota is reached:
    - Guests/free users can unlock additional sets by watching a rewarded ad (`unlockViaAd` / `showRewarded`).
    - Explanations review can be locked behind a rewarded ad for non-Pro explorer users.
  - **Pro Users (`isPro === true`)**: Unlimited set attempts, ad-free experience, PDF export enabled.
  - **Guest Progress & Migration**: Guest device IDs (`x-device-id` / `quizweb_device_id`) are stored in `localStorage`. Upon sign-in, `/api/auth/merge-guest` merges guest attempts into the authenticated user record.
- **GK Book Application**:
  - Reading the book is always 100% free.
  - When the user launches a page quiz card, it consumes an attempt under the standard `EntitlementContext` rules.

---

## 5. Admin GK Hub & Bulk Upload Architecture

### 5.1 GK Hub (`src/app/admin/gk/page.jsx`)
- 6 Existing Tabs:
  1. `overview`: KPI cards (Total Questions, Active Topics, Published Sets, Unassigned Pool) and difficulty breakdown.
  2. `topics`: Topic manager with order rotation and Hindi/English titles.
  3. `rules`: Set generation rules (e.g. 7 Easy + 7 Medium + 6 Hard per set of 20).
  4. `builder`: Automated set generator with dry run & unlock filters.
  5. `sets`: Set inspection, question preview, manual question swapping, and set tags.
  6. `questions`: Paginated question browser with search, topic, and difficulty filters.
- **Target Integration**: Add a 7th tab: `"book"` ("GK Book"), guarded by `NEXT_PUBLIC_GK_BOOK`.

### 5.2 Bulk Upload (`src/app/admin/upload/AdminUploadPage.jsx` & `/api/admin/gk/upload/route.js`)
- Columns recognized by the upload template:
  | Header Key | Recognized Aliases | Purpose in QuizWeb |
  | :--- | :--- | :--- |
  | `Master Category` | `mastercategory`, `main category` | Defaults to `"GK"` |
  | `Category` | `sub category`, `subcategory` | `"India GK"` or `"World GK"` |
  | `Topic` | `topic name`, `topicname` | Topic grouping, e.g. `"History"` |
  | `Subject` | `subject name`, `sub topic`, `subtopic` | Chapter unit, e.g. `"Ancient India"`, `"Indus Valley Civilization"` |
  | `Question` | `text`, `qtext` | Question stem |
  | `Option A`–`Option D` | `option 1`–`4`, `opt a`–`d` | 4 multiple choice options |
  | `Correct Answer` | `answer`, `correct`, `ans` | Normalized to index 0..3 |
  | `Difficulty` | `level`, `diff` | `"Easy"`, `"Medium"`, `"Hard"`, `"Expert"` |
  | `Question Type` | `type` | `"MCQ"`, `"Explore"`, `"Learn"`, `"Rapid Fire"` |
  | `Exam Tags` | `examtags`, `exam`, `tags` | Comma-separated tags (e.g. `"SSC CGL, UPSC, Harappa"`) |
  | `Language` | `lang` | `"hi"` or `"en"` |
  | `Explanation` | `exp`, `solution`, `notes` | Educational breakdown |

---

## 6. Question Bank Tag Audit & Proposed Page-to-Tags Mapping

We conducted a live inspection of the production database (`Question` collection, 6,634 questions).
- **Findings**:
  - Found **47 published questions** directly on Indus Valley / Harappa / Mohenjo-daro / Lothal / Kalibangan / Dholavira / Rakhigarhi.
  - Found **259 questions** under tag `"Ancient India"` and **20 questions** under tag `"Ancient Indian History"`.
  - Found active tags: `'Indus Valley Civilization'`, `'Harappan Civilization'`, `'Harappan Sites'`, `'Lothal'`, `'Ancient India'`, `'Ancient Indian History'`.

### Proposed Page-to-Tags Mapping (5 Pages of Sindhu Ghati):

| Page # | Page Title (Hindi) | Page Topic Focus | Proposed Quiz Tags | Live Question Count in DB |
| :---: | :--- | :--- | :--- | :---: |
| **Page 1** | **रहस्यमयी शुरुआत** | 1856 ब्रंटन बंधु, 1921 दयाराम साहनी (हड़प्पा), 1922 राखालदास बनर्जी (मोहनजोदड़ो), 1924 जॉन मार्शल, C-14 कालक्रम | `["Indus Valley Civilization", "Harappan Sites", "Ancient India"]` | **15+ questions** |
| **Page 2** | **नगर योजना** | ग्रिड पद्धति (90° समकोण), दुर्ग (Citadel पश्चिम) vs निचला नगर (पूर्व), 4:2:1 ईंट अनुपात, भूमिगत जल-निकासी, धोलावीरा 3 भाग | `["Indus Valley Civilization", "Harappan Civilization", "Ancient India"]` | **18+ questions** |
| **Page 3** | **समाज, धर्म और कला** | मातृ-सत्तात्मक समाज, कांस्य नर्तकी (लॉस्ट-वैक्स), चन्हूड़ो शृंगार सामग्री/लिपस्टिक, पशुपति शिव मुहर, भाव-चित्रात्मक लिपि (दाएँ से बाएँ) | `["Indus Valley Civilization", "Ancient India", "Archaeology"]` | **12+ questions** |
| **Page 4** | **कृषि, व्यापार और स्थल** | कपास (सिंडन), वस्तु-विनिमय, मेलुहा, लोथल गोदीवाड़ा/बंदरगाह, कालीबंगन जुते खेत, प्रमुख स्थल तुलनात्मक सारणी | `["Indus Valley Civilization", "Lothal", "Harappan Sites", "Ancient India"]` | **16+ questions** |
| **Page 5** | **पतन और हमारी विरासत** | पतन के कारण (सूखा, जलवायु परिवर्तन, बाढ़), राखीगढ़ी सबसे बड़ा स्थल, आधुनिक भारत को देन (चंडीगढ़ ग्रिड, स्वास्तिक, स्वच्छता) | `["Indus Valley Civilization", "Harappan Civilization", "Ancient India", "Ancient Indian History"]` | **14+ questions** |

*All 5 pages comfortably exceed the 10-question minimum threshold.*

---

## 7. The 4 Whitelisted Edits: Exact Proposed Lines & Diffs

As strictly constrained by **Rule 3**, only these 4 existing files will be touched, each with the minimal possible diff and guarded by `NEXT_PUBLIC_GK_BOOK`:

### 1) Landing Page Banner
- **Target File**: `src/components/UnsetLandingPage.jsx` (and optionally `src/app/page.jsx`)
- **Exact Line Location**:
  - In `src/components/UnsetLandingPage.jsx`, immediately following line 265 (Mobile view) and line 510 (Desktop view, directly under the 4 visual tier cards, before the "Live Taste" section).
- **Proposed Diff**:
  ```jsx
  {process.env.NEXT_PUBLIC_GK_BOOK === "true" && (
    <div className="w-full max-w-7xl mx-auto my-6 px-4">
      <GkBookLandingBanner />
    </div>
  )}
  ```
  *(Component `GkBookLandingBanner` will be imported from a new file `src/components/gk-book/GkBookLandingBanner.jsx`.)*

### 2) Results Page Branch
- **Target File**: `src/app/results/page.jsx`
- **Exact Line Location**:
  - Add `useSearchParams` hook near line 78.
  - In action buttons block (near line 1100 / 1248), add the branch:
- **Proposed Diff**:
  ```jsx
  // Guarded GK Book Attempt & Return Flow
  const searchParams = useSearchParams();
  const source = searchParams?.get("source");

  if (process.env.NEXT_PUBLIC_GK_BOOK === "true" && source === "book") {
    const chapterId = searchParams.get("chapter");
    const pageId = searchParams.get("page");
    // 1. Save attempt via /api/gk-book/attempt (or localStorage for guests)
    // 2. Render "Back to Book" (किताब पर लौटें) linking to /gk-book/${chapterId}?page=${pageId}
    // 3. Render "Play Again" (फिर से खेलें)
  }
  ```

### 3) Admin Sidebar / GK Hub Entry
- **Target Files**:
  - `src/app/admin/layout.jsx` (Sidebar navigation at line 22 under Content & Question Bank).
  - `src/app/admin/gk/page.jsx` (Tab bar at line 454).
- **Proposed Diff in `src/app/admin/layout.jsx`**:
  ```jsx
  ...(process.env.NEXT_PUBLIC_GK_BOOK === "true" ? [
    { href: "/admin/gk?tab=book", label: "GK Book", icon: "📖", perm: "gk" }
  ] : []),
  ```
- **Proposed Diff in `src/app/admin/gk/page.jsx`**:
  ```jsx
  ...(process.env.NEXT_PUBLIC_GK_BOOK === "true" ? [
    { id: "book", label: "GK Book", icon: BookOpen }
  ] : []),
  ```
  And under tab panels, render `<AdminBookTab />` loaded from a new isolated component `src/components/gk-book/admin/AdminBookTab.jsx`.

### 4) Environment Config
- **Target File**: `.env`
- **Exact Line Location**: Line 8 (appended at bottom).
- **Proposed Diff**:
  ```env
  NEXT_PUBLIC_GK_BOOK=true
  ```

---

## 8. Summary of Phase 0 & Next Steps

1. **Non-Negotiables Met**:
   - Zero existing files modified in Phase 0.
   - Clean git branch: `feat/gk-book`.
   - Identified all architectural constraints, schemas, and endpoints.
   - Proposed real tag mapping based directly on the 6,634 live questions.
2. **Readiness for Phase 1**:
   - Build isolated reader + index routes:
     - `src/app/gk-book/page.jsx` (Index: expandable hierarchy, search, reading stats)
     - `src/app/gk-book/[...path]/page.jsx` (Reader: themes, font sizes, Short/Full toggle, progress bar, IntersectionObserver for reading completion, local seed JSON)
   - Store guest progress in localStorage key `"gkbook:v1"` matching the reference format.

---

> **Awaiting User Review**: Please confirm if you approve this audit and the proposed tag mapping so we can proceed to Phase 1.
