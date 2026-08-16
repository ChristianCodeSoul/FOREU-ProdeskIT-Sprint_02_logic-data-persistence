# Sprint 02 — Logic & Data Persistence

This workspace implements the Sprint 2 requirements (Phase 1–3). Review below for evidence and how to test.

## Phase Coverage

- **Phase 1: State Injection & DOM Manipulation**
  - The landing page is hydrated from the `SITE_DATA` constant in `js/main.js`. Elements are updated using `textContent` and `src` assignments in `hydrateContent()`.
  - State mutations happen through `ForeuApp` methods and the `EventBus` (`hero:change`, `theme:change`, `toast:show`).

- **Phase 2: Local Storage & Session Persistence**
  - Application state is serialized to `localStorage` under the `foreu-site-state` key via `persistState()`.
  - The pre-paint theme script in `index.html` applies the saved theme before the stylesheet loads to prevent flicker.
  - A `beforeunload` handler persists state as an additional safeguard.

- **Phase 3: Memory Leak Prevention & Custom Event Emitters**
  - A custom `EventBus` (PubSub) is implemented in `js/pubsub.js` and exposed as `window.EventBus` / `window.PubSub`.
  - DOM listeners are registered via `ForeuApp.listen()`, which records cleanup closures. `destroy()` runs these cleanup functions and calls `events.clear()` to remove subscriptions.
  - Heap Snapshots can be taken using Chrome DevTools → Memory → Heap Snapshot before and after exercising the UI to compare memory usage and retained objects.

## How to Run / Test Quickly

1. Open `index.html` in a browser (Chrome is recommended for DevTools heap snapshots).
2. Verify theme persistence:
   - Toggle themes in the header.
   - Reload the page — the selected theme should persist without visual flicker.
3. Check hero rotation: the dynamic word and SVG diagram rotate every ~3.2 seconds.
4. Verify feature cards are rendered from `SITE_DATA` and display in a single horizontal row on desktop; resize the screen to check the responsive layout.
5. Move the pointer to test the cursor trailing ring and interactive enlargement.
6. Check `localStorage` in DevTools → Application → `foreu-site-state` to confirm persisted state.

## Heap Snapshot Instructions

1. Open the deployed page in Chrome.
2. Open DevTools (F12) → **Memory**.
3. Select **Heap Snapshot** and take the first snapshot.
4. Interact with the app for around 30 seconds:
   - Toggle themes.
   - Open and close the navigation menu.
   - Trigger UI interactions.
   - Submit the contact form.
5. Take a second heap snapshot.
6. Compare the snapshots for detached DOM nodes, retained objects, or significant unexplained memory growth.

## Files Changed / Added

- `css/style.css` — layout and responsiveness fixes, features heading centering, 3-column grid on desktop.
- `js/pubsub.js` — PubSub/EventBus implementation (Phase 3).
- `js/main.js` — PubSub integration, theme handling, cursor robustness, persistence safeguards, and code cleanups.
- `index.html` — pre-paint theme script hardening, navigation updates, and footer contact updates.
- `README.md` — Sprint 02 documentation.

## Live Deployment

**Vercel:**  
https://foreu-prodesk-it-sprint-02-logic-da.vercel.app/
