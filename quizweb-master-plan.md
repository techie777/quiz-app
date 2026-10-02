# QuizWeb Master Plan v2 (for Google Antigravity IDE)

Goal: the best quiz platform for India. Free fun quizzes bring traffic, and Pro (more sets, full Arena, mocks, PDFs) brings money. Target: Rs 1 lakh/month.
Excluded: the mascot/character host feature (already in progress elsewhere).
DECISION (final for launch): static GK sets use the 7/7/6 sheet-order rule in Core Rule 4. The earlier level system (Beginner/Intermediate/Advanced/Expert) is NOT being built now. Do not add level tabs, level gates or level-based generation. It may be added later as an optional layer, so keep the data model compatible (difficulty stays on every question).

---

## 0. RULES FOR THE AGENT (read first)
1. Work PHASE by PHASE, TASK by TASK. After each phase, report: what was done, what was tested, what is left.
2. Do NOT rewrite the whole app. Keep existing URLs, data and design. Change only what the task needs.
3. Put new features behind a simple on/off setting where possible.
4. Mobile first (low-end Android, 4G). Every page must work at 360px width and load fast.
5. Show only REAL numbers (question counts, set counts). No hard-coded counts.
6. Everything works in Hindi and English (language switch already exists, keep it).
7. If something is unclear, choose the simplest sensible option, note it in the report, and continue.
8. Tasks marked [PARALLEL] are independent and can be done at the same time.

---

## 1. CORE RULES (non-negotiable, build exactly like this)

### Rule 1: Upload must show on the customer website (CRITICAL BUG)
The new Excel bulk upload says "success" but nothing appears on the customer web. Fix it:
- Find the real cause (typical suspects: questions saved as draft/unpublished, category/topic slug mismatch, customer site reading a different table or cache, sets not auto-created, language filter, missing Subject mapping).
- After every upload, the system must AUTOMATICALLY create the sets (Rule 4) and publish them.
- The upload result screen must show: rows read, rows imported, rows rejected (with reason per row), sets created, and a "View on website" link.
- Add a built-in check: after import, call the same API the customer website uses and confirm the new sets are returned. If not, show a clear error instead of "success".
- Acceptance test: upload a 200-question sheet for one Subject, get 10 sets, and see all 10 on the customer site within a minute.

### Rule 2: Hierarchy (4 levels above the set)
Master category > Sub category > Topic > Subject > Sets > Questions.
Example: GK (Master) > India GK (Sub category) > History (Topic) > Ancient India (Subject) > Set 1, Set 2 ...
Customer journey: Home > GK > India GK > History > Subject tiles (Ancient India...) > paginated set grid > Set (Play or Read).
Every tile shows real set and question counts. Hide a Subject with 0 sets, or show "Coming soon".

### Rule 3: New "Subject" column in the bulk upload template
- Add the column "Subject" immediately AFTER "Topic" in the Excel template.
- Template columns (keep existing headers and wording; only insert Subject): Question, Option A, Option B, Option C, Option D, Correct Answer, Question Type, Master Category, Category (this is the Sub category, e.g. India GK), Topic, Subject, Difficulty, Explanation, Language, Exam Tags.
- The importer must read columns BY HEADER NAME, not by position.
- Update everywhere: downloadable template file, importer, validation, preview table, admin filters, database, customer navigation, and the export.
- Old sheets without a Subject column should still import. Use the Topic name as the Subject and show a warning.
- Auto-create any missing Master category, Sub category, Topic or Subject from the sheet (no manual setup needed).
- Back-fill Subject for existing questions during migration (use Topic if unknown).

### Rule 4: Static GK/Quiz series sets (sheet order, 20 per set)
- Group questions by Master category + Sub category + Topic + Subject + Language.
- Build sets in the EXACT order of the uploaded sheet, top to bottom: rows 1-20 are Set 1, rows 21-40 are Set 2, and so on. Example: 200 questions = 10 sets of 20.
- Do NOT sort or reorder by difficulty. The sheet order is the order of sets.
- Each set is designed as 7 easy + 7 medium + 6 hard/expert (hard and expert count together). The sheet author arranges this. The system checks each set and shows a warning in the upload report if a set does not match (setting: "warn" by default, optional "strict" to reject).
- If the last group has fewer than 20 questions, keep it as a pending remainder. It is not shown as a set. When the next upload for the same Subject arrives, continue filling from the remainder in upload order.
- Append-only: never edit, delete or renumber existing sets when new questions are uploaded. Set numbers are permanent.
- Keep import batch id and source row number on every question so the order can be rebuilt and traced.
- Sets are per language (Hindi and English separate).
- Re-uploading the same file must not create duplicates (use a hash of the normalized question text).
- Optional set difficulty badge: the admin can tag any set as "Easy set", "Standard" or "Challenge set" (editable in the admin panel, default none, no template change). Show the badge on the set card. Quiz Arena keeps its Easy / Medium / Hard / Mixed filter, which covers learners who want an easier or harder quiz.

### Rule 5: Shuffle at play time (the core feature of a set)
- Every time a user plays a set, shuffle BOTH the question order and the option order. Any question can appear at any position in the 20.
- Check answers by option id, not by option position, so shuffling never breaks scoring.
- Challenge a friend: store a seed so both players get the identical shuffle.
- Read mode shows questions in the original sheet order with the correct answer and explanation.
- A resumed set keeps its already-shuffled order for that attempt.

### Rule 6: Two layers (Standard + Arena)
Every Master/Sub category page (starting with GK) has a two-tab switch at the top: **Standard | Arena**. Both layers read the same question bank and both use the Rule 5 shuffle.

**Layer 1: Standard (fixed series)**
- The curated static sets from Rule 4 (7/7/6, sheet order, permanent set numbers).
- Gives progress rings, stars, best score, Continue / Next up, Challenge a friend and SEO pages.
- This is the guided path: "just play the next set".

**Layer 2: Arena (play GK your own way)**
The user builds their own quiz in a simple 2-step setup (Step 1: what, Step 2: how). Opens pre-filtered from each entry point (inside GK only GK topics are shown).
- **What to play:** Master / Sub category / Topic / Subject, multi-select with Select all and Clear. Show the live count of available questions.
- **How many:** 10 / 20 / 30 / 50 questions (Pro: up to 100).
- **Difficulty:** Easy / Medium / Hard / Mixed. Mixed uses the 7/7/6 ratio, scaled to the chosen count.
- **Timer:** off, per question (15 / 30 / 60 sec), or total time.
- **Language:** Hindi / English.
- **Questions from:** all, unseen only (default), or only my wrong answers (revision).
- **Style:** Practice (instant answer and explanation after each question) or Exam (no feedback until the end, optional negative marking, full review at the end).
- **Quick presets** as one-tap chips: "5-minute GK", "Hard challenge", "Revision", "Exam mode". Users can save their own settings as "My presets" (stored on device, synced after login).
- If the pool is too small, relax the filters step by step (difficulty first, then seen questions) and tell the user plainly.
- Results show score, time, accuracy and weak subjects. Arena results count toward streak, XP and weak-topic stats, but NOT toward Standard set stars or completion (keep the two layers' progress separate).
- Challenge a friend works from Arena too (the settings plus a seed are saved in the link).
- Free: 3 Arena plays a day, up to 20 questions, Practice style. Pro: unlimited plays, up to 100 questions, Exam style, negative marking, presets. (Values editable in admin.)

**Other dynamic modes (small, built on the Arena engine):**
- **Daily Quiz:** 20 questions, same for everyone each day (seeded by date), counts for the streak.
- **Mix / Play All:** one tap, random 20 from the current category using the 7/7/6 mix, unseen first.
- **Revision:** one tap, built from the user's wrong answers and weakest subjects.

Dynamic modes always use the 7/7/6 mix by default, then shuffle questions and options like Rule 5.
---

## 2. REQUIREMENTS CHECKLIST

**A. Data and admin**
- A1. One question bank is the source of truth. Static sets and all dynamic modes read from it.
- A2. Rules 1, 3 and 4 above (upload fix, Subject column, auto sets).
- A3. Temporary database with ALL categories first, so the site never looks empty.
- A4. Real, consistent counts everywhere (today the site shows 4,541+, 10,582 and 50,000+ in different places).

**B. Browsing**
- B1. Navigation in Rule 2, with paginated set grids (12 per page, Load more). Never render hundreds of sets at once.
- B2. Subject page: progress bar, Continue button, Next up set, Mix button, Arena button pre-filtered to this Subject.
- B3. Search across subjects and topics.

**C. Tracker and engagement**
- C1. Progress tracker: per set (new, in progress, done, best score, stars), per Subject and Topic (% done), streak, weak subjects.
- C2. Daily Quiz with streak.
- C3. Challenge a friend: highlighted, smooth, same questions for both, WhatsApp share, tested end to end.
- C4. Shareable result card (score image + link).
- C5. Game engine polish: tap/bubble sound effects (tap, correct, wrong, streak) with a mute toggle, themed loading screen with animation.

**D. Content**
- D1. Explorer GK: 15-20 fun categories (list in section 4).
- D2. Image quizzes with working images (fix broken thumbnails and overlapping titles).
- D3. Replace the "Seekho" tab with Fun Facts and True/False.
- D4. Current Affairs: headline, one-liner, short description, 3-5 MCQs, tags and date filter.
- D5. Fix the Read mode error.

**E. Money**
- E1. Unlock a set by watching ONE rewarded ad.
- E2. Show only ONE Pro/subscription banner (merge the two designs).
- E3. "Support us / Donate" button at the end of every set, before the Pro badge. Also a small Support us tab at the top while playing (unobtrusive, never blocks gameplay).
- E4. Free vs Pro rules (section 5). Razorpay payments (UPI first).
- E5. Later: govt-exam mocks with rank, PDF store, exam plans.

**F. Traffic**
- F1. Every Master/Sub/Topic/Subject page and set page is server-rendered with its own URL, title, description and a sitemap.
- F2. Fix meta tags (they currently say Science/Math/History in en_US, but the content is Hindi-first GK and govt exams).
- F3. PWA install, fast load (under 3 seconds on 4G), lazy-loaded WebP images.

---

## 3. HOW A SET LOOKS TO THE USER (simple flow)
Home > GK > India GK > History > Ancient India > Set grid (12 per page) > tap Set > Play (shuffled) or Read (sheet order) > Result: score, stars, Next set, Challenge a friend, Support us button, then the Pro badge.

---

## 4. CONTENT PLAN
**Explorer GK (18 categories):** Ancient India, Medieval India, Modern India and Freedom Struggle, Polity, Geography and Rivers, Economy, Science and Tech, Art and Culture, Sports, Awards, World GK, Bollywood, Cricket, Food, Animals, Space, Mythology, Inventions, Human Body, Brain Teasers.
Create all of them now (skeleton plus temporary sample data). Show only those with sets; others show "Coming soon".

**Image quizzes:** use safe sources only: flags (public domain), self-drawn Indian state map SVGs, monuments/animals/national symbols from licensed or Wikimedia Commons images. Avoid brand logos and people photos unless licensed. Host on a CDN (WebP, lazy-loaded), and show a clean placeholder if an image fails.

**Fun Facts and True/False (replaces Seekho):** swipeable cards, one fact per card, True/False with an instant answer and a one-line explanation, shareable.

**Current Affairs:** headline > one-liner > 60-80 word description > 3-5 MCQs. Tags: Polity, Economy, Sports, Awards, International, Science. Date filter. Monthly PDF later (paid).

---

## 5. FREE vs PRO (all values editable in admin)
- Free: the first 3 sets of every Subject, Daily Quiz, Fun Facts, True/False, 2 free sets per day beyond that, limited Arena plays.
- Unlock more: watch one rewarded ad to unlock exactly one set.
- Pro: all sets, unlimited Arena and Mix, explanations and analytics, ad-free, PDFs and mocks later.
- Starting prices (editable): Rs 49 monthly casual plan, current yearly plan kept, exam plans Rs 299-499 per 3 months (later).
- Only ONE Pro banner on any screen. One ad per unlock. No ads during active questions.
- The free/Pro check happens when the user taps Play.

---

## 6. DATA MODEL (adapt to the existing database)
- master_categories, sub_categories, topics, subjects (each: id, name, slug, parent id, icon, sort order, status)
- questions: id, master/sub/topic/subject ids, question, options (4, each with an id), correct option id, explanation, difficulty (easy/medium/hard/expert), language, question type, exam tags, text hash, status (draft/published/hidden), import_batch_id, source_row.
- sets: id, subject id, set_number, language, title, is_pro, status. Permanent set_number per subject + language.
- set_questions: set id, position (sheet order), question id.
- user_set_progress: user key, set id, status, best score, stars, attempts, last played.
- user_seen_questions, user_wrong_questions (for revision), challenges (id, seed, source, creator).
- import_batches: id, file name, rows read, imported, rejected, sets created, status.
- user key = account id if logged in, otherwise device id (sync to the account after Google login).
- Indexes: questions(subject id, status, language), sets(subject id, language, set_number), user_set_progress(user key, set id).

---

## 7. EXECUTION PLAN

### PHASE 0: Audit (no changes)
- 0.1 Map how questions, categories, topics, sets are stored and served today.
- 0.2 Find exactly why uploaded questions do not appear on the customer site (Rule 1).
- 0.3 Find the cause of the Read mode error.
- 0.4 Find where the inconsistent counts come from.
- 0.5 Read the existing Excel template headers and confirm the mapping (Master Category, Category = Sub category, Topic, Subject).
- Deliver: short report and a migration plan that keeps existing data, URLs and progress.

### PHASE 1: Data foundation and upload fix
- 1.1 Create or adjust tables (section 6), including Subject. Migrate and back-fill safely.
- 1.2 Update the Excel template and importer for the Subject column (Rule 3), with row-level validation and a clear result report.
- 1.3 Build the set generator (Rule 4) with a DRY RUN: sets to be created, per-set 7/7/6 warnings, remainder, duplicates, errors.
- 1.4 Run the generator automatically after every upload and publish the sets (Rule 1). Add the built-in "can the customer API see them" check.
- 1.5 Seed the temporary database with all categories, topics, subjects and sample questions.
- 1.6 One shared count function used everywhere.
- 1.7 Fix Read mode. [PARALLEL]
- Done when: a 200-question sheet gives 10 sets that appear on the customer site with correct counts.

### PHASE 2: Browsing UI
- 2.1 Home: Daily Quiz, Quiz Arena banner, Hot Quizzes, category chips.
- 2.2 Navigation of Rule 2: Master > Sub category > Topic > Subject tiles > paginated set grid > set page.
- 2.3 Subject page: progress bar, Continue, Next up, Mix and Arena buttons.
- 2.4 Merge the two Pro banners into one.
- 2.5 Fix broken image thumbnails and overlapping titles, add placeholders. [PARALLEL]
- 2.6 Hide empty items and show "Coming soon". [PARALLEL]
- Done when: a user goes from Home to playing a set in 4 taps on mobile and no tile shows 0 Qs.

### PHASE 3: Gameplay, tracker and challenge
- 3.1 Play engine with Rule 5 shuffling (questions and options, scoring by option id).
- 3.2 Tracker (section 2, C1). Guests use device storage, then sync after login.
- 3.3 Progress rings, Continue and Next up using the tracker.
- 3.4 Daily Quiz and streak. [PARALLEL]
- 3.5 Sound effects with mute toggle. [PARALLEL]
- 3.6 Themed loading screen with animation. [PARALLEL]
- 3.7 Challenge a friend: highlighted button, seed-based identical shuffle, WhatsApp link, friend sees the challenger's score. Test with two devices.
- 3.8 Shareable result card. [PARALLEL]
- Done when: progress survives refresh and login, and a challenge link opens the same quiz on another phone.

### PHASE 4: Dynamic modes and content modules
- 4.1 Standard | Arena tab switch on every category page, and the full Arena builder from Rule 6 (2-step setup, presets, Practice and Exam style), pre-filtered from every entry point.
- 4.2 Mix/Play All, Revision (from wrong answers). [PARALLEL]
- 4.3 Fun Facts and True/False tab replaces Seekho. [PARALLEL]
- 4.4 Current Affairs new format. [PARALLEL]
- 4.5 Image quiz support (type, image field, CDN). [PARALLEL]
- 4.6 Explorer GK: the 18 categories with a starter set each.
- Done when: every tab has real, well-formatted content.

### PHASE 5: Monetization
- 5.1 Enforce Free/Pro rules when the user taps Play.
- 5.2 Rewarded ad unlocks exactly one set.
- 5.3 Support us button on the result screen before the Pro badge, plus the small tab at the top during play.
- 5.4 Razorpay checkout (UPI first); subscription status stored per user.
- 5.5 Admin controls for free sets, daily limits, is_pro, prices.
- Done when: a test payment unlocks Pro and a rewarded ad unlocks one set.

### PHASE 6: Traffic and speed
- 6.1 Server-render all public pages with unique URLs, titles, descriptions, quiz/FAQ schema, sitemap, robots.
- 6.2 Fix meta and language tags (Hindi and English).
- 6.3 PWA, lazy loading, WebP, small bundles. Target: under 3 seconds on 4G.
- 6.4 Open Graph preview images so WhatsApp links look good.
- Done when: "view source" shows real content and mobile Lighthouse is good.

### PHASE 7: Later (after launch)
- Govt-exam vertical (SSC, Railway, Banking, UPSC Prelims, state exams): previous-year papers, full mocks with timer, All-India rank and percentile.
- PDF store (Rs 49-199) and monthly current-affairs PDF.
- Weekly leaderboard, WhatsApp/Telegram reminders.

---

## 8. FINAL TEST CHECKLIST
- [ ] 200-question sheet with a Subject column imports, makes 10 sets, and all 10 show on the customer site
- [ ] Old sheet without a Subject column still imports with a warning
- [ ] Re-uploading the same file creates no duplicates
- [ ] Sets follow the sheet order exactly (rows 1-20 = Set 1, and so on)
- [ ] 7/7/6 mismatch shows a warning in the upload report
- [ ] Same set played twice shows a different question order and option order; scoring stays correct
- [ ] Read mode works and shows sheet order
- [ ] Counts match everywhere; no empty tiles; no broken images
- [ ] Progress persists (refresh, login, new device after login)
- [ ] Challenge link gives the same questions on a second phone
- [ ] Arena filters work and open pre-filtered from each category
- [ ] Sounds play and can be muted; loading screen is themed
- [ ] Only one Pro banner; Support us appears before the Pro badge
- [ ] Rewarded ad unlocks exactly one set
- [ ] Razorpay test payment unlocks Pro
- [ ] Pages are server-rendered with correct titles; mobile load under 3 seconds

## 9. REPORT FORMAT (after every phase)
Done: ... | Tested: ... | Issues found: ... | Decisions I made: ... | Next phase ready: yes/no
