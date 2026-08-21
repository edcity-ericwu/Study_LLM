# EdCity — 教學工具平台 prototype

Clickable prototype and supporting artifacts for the HK EdCity teaching-tools
platform. Every page is plain HTML, CSS and JavaScript — no build step, no
framework, no dependencies at runtime.

> **Prototype, not product.** Screens are design proposals. Content is written
> to be plausible, not verified — in particular the curriculum-document
> citations in 課文工房 are illustrative. Do not quote figures or references
> from these screens as fact.

## Running it

Published with GitHub Pages, or locally:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

**Do not open the files by double-clicking them.** On a `file://` URL the
browser treats each page as its own opaque origin and blocks storage, so
anything that spans pages silently stops working — the sidebar forgets it was
collapsed, work in progress disappears on navigation, and tools cannot resume.
The pages still render, which makes it look broken rather than unsupported.
A console warning fires when this happens.

## Where to start

| | |
|---|---|
| [`index.html`](index.html) | 教學工具箱 — the teacher's tool catalog, and the way into everything else |
| [`text-workshop.html`](text-workshop.html) | 課文工房 — turns a text into teaching material |
| [`groups.html`](groups.html) | 課堂與學生 — the class-management portal |
| [`poc-hub.html`](poc-hub.html) | Index of every screen, grouped by who uses it |

Screens are split across two teacher shells — ✨ **EdCity.ai** (making things)
and 🏫 **課堂與學生** (managing students) — plus several system-role shells
(school office, vendor, IT coordinator) in a darker theme.

## Supporting artifacts

Standalone documents, not part of the prototype's navigation:

- **Positioning** — [Vision](EdCity_Positioning_Vision.html) · [Vision (tight)](EdCity_Positioning_Vision_Tight.html) · [Tracks](EdCity_Positioning_Tracks.html) · [Teacher-first](EdCity_Positioning_TeacherFirst.html) · [Enablement layer](EdCity_Positioning_EnablementLayer.html)
- **Journeys** — [Value map](EdCity_Journeys_Value_Map.html) · [Teacher-first](EdCity_Journeys_TeacherFirst.html) · [Enablement layer](EdCity_Journeys_EnablementLayer.html)
- **Ecosystem** — [Maps](EdCity_Ecosystem_Maps.html) · [Teacher-first](EdCity_Ecosystem_TeacherFirst.html) · [Enablement layer](EdCity_Ecosystem_EnablementLayer.html)
- **Other** — [Platform connections diagram](EdCity_Platform_Connections_Diagram.html) · [One-tool storyboard](EdCity_Storyboard_OneTool_OnePager.html)

## Shared files

| File | Purpose |
|---|---|
| `shell-chrome.css` / `.js` | Collapsible sidebar. The CSS is a real stylesheet on purpose — layout must never depend on a script having run. |
| `jobs.js` | Work a tool is still doing after you leave the page. Progress is derived from wall-clock time, so it advances across page loads. |
| `tool-session.js` | Resuming a tool where you left it. Stores only hand-made choices; everything else is re-derived. |
| `demo-state.js` | Cross-page demo state (approvals, releases, subscriptions). |
| `feature-flags.js` | Hides unfinished screens and prototype-only annotations. Loaded in `<head>` so flagged elements never flash in. |
| `vendor-data.js` | The shared model — schools, classes, vendors, plans, seats, agreements. |
| `demo-nav.js` | Walkthrough navigation. Never shown in the product itself. |

## Notes

- `.nojekyll` disables Jekyll processing; the files are served exactly as committed.
- Test dependencies (`node_modules`) live outside this repository and are gitignored, so nothing needed only for verification can be committed.
- Timings in the prototype are compressed. Real generation takes minutes, not seconds.
