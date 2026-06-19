# CLAUDE.md (caveman version, ugg)

THIS SITE = ROCK SIMPLE. NO BUILD. NO REACT. NO NPM RUN ANYTHING.
Just `.html` file + one `style.css` + one `main.js`. Open file, see file. Done.

## WHERE THINGS LIVE

- `index.html`, `contact.html`, `work.html`, `team.html`, `pricing.html` — 5 pages, all flat files, all load SAME `assets/css/style.css` and SAME `assets/js/main.js`.
- `assets/css/style.css` — ALL style. One big file. No modules, no Sass, no nothing.
- `assets/js/main.js` — ALL behavior. One `DOMContentLoaded` block. Each feature = own little chunk with a comment header like `/* ---------- Thing Name ---------- */`.
- `media/` — images, logo svg.
- `CLAUDE.md` (this rock) — you are here.

## HOW TO LOOK AT SITE (no build step, ugg)

```
python3 -m http.server 8743
```
then open `http://localhost:8743/index.html`. That's it. No webpack cave, no vite fire.

## BIG TRAP #1: SMOOTH SCROLL LIES TO YOU

`html { scroll-behavior: smooth }` is set globally. If you (or a script, or Playwright) do
`window.scrollTo(0, bigNumber)`, browser ANIMATES there over time instead of jumping.
If you read `window.scrollY` right after, you get a WRONG, SMALL number — looks like scroll
is "stuck" or "clamped." IT IS NOT STUCK. It is mid-animation. You will waste real time
chasing a fake bug here (ask past me, I did).

Fix: always scroll with `window.scrollTo({ top: y, behavior: 'instant' })` when testing/debugging.

## BIG TRAP #2: BREAKPOINT = 900px, ALWAYS

Every responsive media query in this file uses `max-width: 900px` as THE mobile breakpoint.
If you add a new one, use 900px too. There used to be a stray `1024px` breakpoint for the
footer/contact grid that didn't match anything else — caused a dead zone where layout looked
wrong between 901–1024px. Fixed, but if you see a weird number that isn't 900/1200/400,
suspect a copy-paste mistake, not intentional design.

## BIG TRAP #3: STICKY ELEMENTS UNSTICK AT THEIR PARENT'S BOTTOM, NOT THE VIEWPORT

`position: sticky` element stays glued to `top: Xpx` only as long as you're still scrolling
through ITS DIRECT PARENT's box. If you move a sticky element to a different spot in the DOM
(different parent, or AFTER a tall block instead of BEFORE it), the sticking breaks in
confusing ways — looks "stuck for too short a time" or "doesn't track scroll at all."

Real bug we hit: moved the mobile process icon (`.process-visual-mob`) to live AFTER all the
step cards instead of BEFORE them → it only started sticking once you'd already scrolled past
everything. Moving it back to right after the header (before the steps) fixed it.

Also: in a flexbox layout, `align-items: flex-start` makes a flex item shrink to its OWN
content height. If a sticky child lives inside that flex item, it has nowhere to scroll WITHIN,
so it detaches early. Use `align-items: stretch` (the default) when one column needs to be
"tall enough for the sticky thing on the other side to track the whole scroll."
This is exactly the bug in the desktop "How It Works" section — `.process-grid` needed
`align-items: stretch` so `.process-right` (holding the big sticky icon) matches the height
of `.process-left` (the scrolling steps).

## BIG TRAP #4: CSS GRID SPANS NEED EXACT MATH OR YOU GET HOLES OR DEAD SPACE

The services grid (`#services .services-grid`) used to have one card spanning 2 rows
(`grid-row: 1 / 3`) to look "bento." Its content didn't fill 2 rows worth of height →
big ugly empty gap at the bottom of that card. We ripped out ALL the row/column spans and
made it a plain uniform 3-col grid. 6 cards / 3 cols = clean 2 rows, no math, no gaps.
If you want a fancy spanning bento grid again: the span sizes must add up to EXACTLY
`columns × rows` cells or you get either overflow gaps or empty holes. Don't eyeball it.

## BIG TRAP #5: VIEWPORT-WIDTH FONT SIZING (`vw`) IN A HALF-WIDTH COLUMN = BAD

`.np-big` (the big "Built by teens" text in the mission/nonprofit section) used
`font-size: clamp(2.4rem, 5vw, 4rem)`. The `5vw` is measured against the FULL viewport, but
the text sits in a column that's only HALF the viewport wide (`.nonprofit-inner` is a
2-column grid). Text got too big for its box and `overflow: hidden` on the parent silently
CLIPPED it — invisible bug, just looks like text got cut off for no reason.
Fix: lowered the vw fraction (`3.4vw`) and the min/max so it actually fits a half-width
column, and changed `overflow: hidden` → `overflow: visible` as a safety net (the gradient
background still respects `border-radius` either way, so nothing visually breaks).
LESSON: any time you see `clamp(..., Nvw, ...)` inside a multi-column grid, check the
column is roughly full-viewport-width, or shrink the vw number to match the column's share.

## BIG TRAP #6: `grayscale(1) sepia(1)` BEFORE `hue-rotate()` EATS YOUR GRADIENT

Old trick for recoloring a plain dark icon: `filter: grayscale(1) sepia(1) hue-rotate(Xdeg)`.
Grayscale+sepia FLATTENS the whole image to one warm tone FIRST, then hue-rotate just spins
that one tone. If the source image already has its own multi-color gradient (our logo is
yellow `#f9d01b` → blue `#0047ff`, baked into the SVG), this trick destroys that gradient and
gives you a single solid shifting color instead — looks wrong, not "a gradient cycling colors."
Fix: drop the grayscale/sepia, just `hue-rotate()` (+ saturate/brightness if needed) directly on
the original colored image. Now both gradient stops rotate together and you keep the 2-color
look while it cycles. See `.hero-logo-mark` / `@keyframes hero-logo-hue`.

## BIG TRAP #7: `filter` ANIMATIONS ARE EXPENSIVE — PAUSE THEM DURING OTHER ANIMATIONS

`hue-rotate`/`blur` etc. on `filter` are NOT free like `transform`/`opacity` — browsers often
can't fully GPU-accelerate them, so animating filter every frame competes with other animations
for compositor time. We had the hero hue-cycle running continuously WHILE the page-transition
overlay (the big red panel) was sliding — made the transition feel janky/"wonky."
Fix: `document.body.classList.add('pt-navigating')` right when the transition overlay starts
covering (and remove it when revealing finishes), with a CSS rule
`body.pt-navigating .hero-logo-mark, body.pt-navigating .hero-glow { animation-play-state: paused }`
to free up the compositor during the 750ms window. Same idea as the auto-pulse guard below —
if you add another heavy filter/animation, pause it during `pt-navigating` too.

## ANIMATION PATTERNS USED HERE

- `.reveal` class + `IntersectionObserver` in `main.js` = fade-up-on-scroll for most sections.
  Reduced-motion users skip straight to visible (check `prefers-reduced-motion` early in main.js).
  Per-element one-shot delay: JS auto-staggers SIBLINGS via `--reveal-delay`, but if you want a
  SPECIFIC element to wait longer (and never repeat — it's a transition, not a loop), add a more
  specific CSS rule that sets `transition-delay` directly (bypasses the var, no `!important`
  needed since 2 classes > 1 class specificity). See `.nonprofit-text.reveal`.
- Hero "H" logo (`.hero-logo-mark`) AND the glow behind it (`.hero-glow`) hue-cycle together
  (same `hero-logo-hue` keyframe, same 42s duration) but only while in view — gated by a SHARED
  `IntersectionObserver` toggling `.in-view` on both, animation is `animation-play-state: paused`
  by default. Don't remove the play-state pause or it burns CPU off-screen. Also paused during
  page transitions (Trap #7).
- "How It Works" section: icon draws/holds/erases in sync with scroll position, computed by
  hand in `main.js` (`applyIconAnim`), NOT pure CSS. Desktop = big sticky icon on the right
  (`.process-right` / `.process-visual`), steps scroll on the left, with a "magnetic" snap-in
  curve (sharp ease-out + a brief overshoot `scale()` bump as each icon locks in — see the
  `pull` variable). Mobile = icon sticky at top, steps are a horizontal-scroll carousel
  underneath (`.step-stack`, scrollLeft driven by JS, not native scroll-snap alone).
  `.process-steps` has 30vh of extra bottom padding so the LAST step gets the same scroll
  room to settle as the others (without it, the final transition felt rushed — there's no
  step below it to provide that buffer naturally).
- `.icon-plug` (small plug icon used in "Get In Touch" labels etc.), `.service-card` icons,
  `.testimonial-shell` avatars, and `.np-check` checkmarks all animate on hover/tap AND
  automatically every ~2 seconds via a `.pulse` class toggled in `main.js`
  (see `/* Auto-pulse animated icons */` block). If you add a new icon that should do the
  same auto-pulse thing, just give it one of those classes — the JS interval already grabs
  all of them by `querySelectorAll`, staggered slightly so they don't all fire as one block.
  The interval skips entirely while a page transition is mid-flight (Trap #7's `pt-navigating`
  idea applied to JS instead of CSS).
- Custom cursor = dot only now (the old trailing ring was removed, along with its own
  `requestAnimationFrame` lerp loop — one less thing running every frame).

## THEME

Brand color = `--red: #ec3750` (Hack Club red). Logo gradient = gold `#f9d01b` → blue `#0047ff`
(see `--accent-gold` / `--accent-blue`), used sparingly for cohesion (scroll progress bar).
Don't go wild adding new colors — this site is red + near-black + occasional gold/blue accent.

## WHEN THINGS LOOK BROKEN AND YOU CAN'T TELL WHY

Don't guess from reading CSS alone if you can avoid it — this file has bitten me (and you,
future rock-brain) more than once by LOOKING right in the code but rendering wrong because of
the sticky/flex/grid traps above. If Playwright + chromium is available
(`npx playwright install chromium`, takes the deps too), spin up
`python3 -m http.server` and actually screenshot the page at the relevant scroll position
before declaring a fix "done." Remember Trap #1 (use `behavior: 'instant'`) or you'll
screenshot the wrong scroll position and confuse yourself further.
