Sprint 02 — Logic & Data Persistence

This workspace implements the Sprint 2 requirements (Phase 1—3). Review below for evidence and how to test.

Phase coverage

- Phase 1: State Injection & DOM Manipulation
  - The landing page is hydrated from `js/main.js` `SITE_DATA` constant. Elements updated via `textContent` and `src` assignments in `hydrateContent()`.
  - State mutations happen through the `ForeuApp` methods and the `EventBus` (`hero:change`, `theme:change`, `toast:show`).

- Phase 2: Local Storage & Session Persistence
  - Application state is serialized to `localStorage` under key `foreu-site-state` via `persistState()`.
  - Theme pre-paint script in `index.html` applies the saved theme before stylesheet loads to prevent flicker.
  - `beforeunload` handler persists state as a safeguard.

- Phase 3: Memory Leak Prevention & Custom Event Emitters
  - A custom `EventBus` (PubSub) is implemented in `js/pubsub.js` and exposed as `window.EventBus` / `window.PubSub`.
  - All DOM listeners are registered via `ForeuApp.listen()` which records cleanup closures; `destroy()` runs these cleanup functions and calls `events.clear()` to remove subscriptions.
  - To produce a Heap Snapshot: open Chrome DevTools → Memory tab → Take snapshot before and after exercising the UI and compare allocations. See instructions below.

How to run / test quickly

1. Open `index.html` in a browser (prefer Chrome for DevTools heap snapshots).
2. Verify theme persistence:
   - Toggle themes in header.
   - Reload the page — the selected theme should persist with no visual flicker.
3. Check hero rotation: the dynamic word and SVG diagram rotate every ~3.2s.
4. Verify features cards are rendered from `SITE_DATA` and display in a single horizontal row on desktop; shrink screen to see responsive layout.
5. Cursor: move pointer to see smooth trailing ring and interactive enlargement over interactive elements.
6. Check `localStorage` in DevTools Application tab -> `foreu-site-state` key to confirm persisted state.

Heap snapshot instructions

1. Open Chrome and the page.
2. Open DevTools (F12) → Memory tab.
3. Click "Take snapshot" before interacting with the page.
4. Interact with the app (toggle themes, open menu, submit contact form, navigate) for ~30s.
5. Take another snapshot and compare — look for detached nodes or growing retained sizes for repeated actions.

Files changed / added

- css/style.css — layout and responsiveness fixes, features heading centering, 3-column grid on desktop.
- js/pubsub.js — PubSub/EventBus implementation (Phase 3).
- js/main.js — use PubSub, theme handling, cursor robustness, persistence safeguards, code cleanups.
- index.html — pre-paint theme script hardened, nav updated with Services link, footer contact updated.
- README.md — this file.

If you want, I can now:
- Run a step-by-step test script (headless browser harness) to verify behaviors automatically.
- Add a small `test/` harness and a reproducible script to capture heap snapshots programmatically.

