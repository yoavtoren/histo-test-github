# Histo Test

An interactive, browser-only practice platform for **B83006 Histology &amp; General Embryology** (Charles University, 1st Faculty of Medicine, Prague).

The site has three areas:

* **Welcome page** — a short overview with the badges of how many questions / terms / organ systems are loaded.
* **Term Library** — every term used in the lectures, with the same definitions and Latin/Greek nomenclature as the source slides, searchable and filterable by organ system.
* **Mock tests** — **ten different mock papers to choose from**, each containing **30 questions** on a **45-minute timer**. Every paper is a different mix of organ systems (one is GIT-heavy, one is reproductive-heavy, one is a balanced "final"-style paper, etc.) so you can target weak spots or take a full balanced mock. The questions match the printed sample-exam style (multi-select 5 pt, single-best 1 pt, fill-in 10 pt, short-answer 1 pt). On submit you get a score plus, for every option, an explanation of why it is correct, why each distractor is wrong, and what change of wording would flip it.

The whole site is plain HTML/CSS/JS — no build step, no dependencies, no server needed.

## Run it locally

```
# clone or download the folder, then either …
# 1) double-click index.html  (works in Chrome, Safari, Firefox, Edge)
# 2) or serve it with a one-liner:
python3 -m http.server 8080
# then open http://localhost:8080/
```

Mock results, history, and the pause/resume state of an active mock are stored in your browser's `localStorage`. Clearing site data resets them.

## Deploy to GitHub Pages

1. Create a new GitHub repository (public if you want public access).
2. Upload **the entire folder as-is** (the project root must contain `index.html`, `css/`, `js/`, `data/` and the empty `.nojekyll` file).
3. In the repo settings &rarr; **Pages** &rarr; **Build and deployment** &rarr; **Deploy from a branch**, choose `main` (or whichever) and `/ (root)`. Save.
4. Wait a minute for the site to build, then open `https://&lt;your-username&gt;.github.io/&lt;repo-name&gt;/`.

The empty `.nojekyll` file disables GitHub's Jekyll processing so all files (including those starting with `_`) are served as-is.

## Project layout

```
Histo Test/
├── index.html          # single-page entry; loads everything
├── .nojekyll           # disables Jekyll on GitHub Pages
├── LICENSE             # MIT (platform code)
├── README.md           # you are here
├── css/
│   └── styles.css      # full theme, light + dark
├── js/
│   ├── app.js          # router, helpers, welcome &amp; about pages
│   ├── library.js      # term library page
│   └── mock.js         # mock landing, runner, scoring, result
└── data/
    ├── terms.js        # window.HISTO_TERMS — verbatim term library
    └── questions.js    # window.HISTO_QUESTIONS — question bank
```

## Question schema

Each question is an object inside `window.HISTO_QUESTIONS` with these fields:

| field | meaning |
|---|---|
| `id` | stable identifier (`GIT-01`, `CVS-03`, …) |
| `system` | one of `GIT, CVS, Lymphatic, Respiratory, Urinary, MaleGenital, FemaleGenital, Endocrine, Nervous, Integument` |
| `subject` | short topic title shown in the result review |
| `type` | `multi` (5 pt) / `single` (1 pt) / `fill` (10 pt) / `short` (1 pt) |
| `points` | weight contributed by the question |
| `stem` | the question text shown to the student |
| `summary` | a 1–2 sentence "take-home" shown only after submit |
| `options[]` | array of `{letter, text, correct, why, howToMakeRight?}` for non-fill types |
| `template[]` / `blanks[][]` / `blankNotes[]` | only used by `fill` questions |
| `stemTwist` | optional sentence that explains how a small change of stem wording would change the answer pattern |

For every option marked `correct: false`, the `howToMakeRight` field is the rewording that would turn it into a correct statement — exactly the practice-style feedback the user requested.

## Sources

All terminology and figure-level facts are drawn from the lecturers' slide decks of the B83006 course (Mária Hovořáková, Zuzana Pavlíková, et al.) and the textbooks they cite:

* Mescher (2013), *Junqueira's Basic Histology*, 13th ed.
* Ross & Pawlina (2011 / 2015), *Histology — A Text and Atlas*.
* Junqueira & Carneiro, *Basic Histology*.
* Sobotta & Hammerson, *Histology Atlas*.
* Stevens & Lowe, *Human Histology*.
* Eroschenko (2013), *diFiore's Atlas of Histology*.
* Krstič (1984), *Illustrated Encyclopedia of Human Histology*.
* Vacek (1995), *Histologie a histologická technika*.
* Lavický et al. (2021), *Histology and Embryology: An Introduction*.
* Nanci (2008), *Ten Cate's Oral Histology*.
* Sadler (2012), *Langman's Medical Embryology*.
* Gartner & Hiatt (1994), *Color Atlas of Histology*.

The platform code itself is released under the MIT licence (see `LICENSE`).
