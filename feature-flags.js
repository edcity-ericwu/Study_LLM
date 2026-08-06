/* Feature flags — a fast, reversible way to hide parts of the prototype from
 * a walkthrough WITHOUT deleting or touching the underlying build. Flip a flag
 * to false and its nav entries + inline UI disappear; flip back to true and
 * everything is exactly as it was. Nothing here removes code or data.
 *
 * Load this file BEFORE demo-nav.js (and before any page's own inline script
 * that checks a flag) on every page — see the <script> order at the bottom of
 * each .html file. featureOn() is the only thing pages/demo-nav.js should call;
 * don't read FEATURE_FLAGS directly, in case this ever needs the fallback
 * default (missing key = on) applied in one place.
 *
 * Granularity note: some features are a whole standalone page (nav-level
 * hide, e.g. records-console.html) — for those, demo-nav.js filters the nav
 * entry AND the page itself shows a "hidden" placeholder if opened directly.
 * Others are a slice embedded inside a page that also covers other, unrelated
 * concerns (e.g. the 🧪試用 buttons living inside 學生工具申請, which is
 * mostly not about trials) — for those, only the specific DOM section is
 * hidden; the rest of that page is unaffected. */
const FEATURE_FLAGS = {
  // 工具試用機制 — 供應商或教師發起試用、資訊科技統籌核實、冷靜期。
  // 涉及頁面：trial-invites.html（整頁）、dept-trial-evaluations.html（整頁）、
  // vendor-portal.html 的「邀請老師試用」分頁、eddata-console.html 的「試用請求」分頁、
  // group-access-requests.html 裏的 🧪 申請試用按鈕。
  toolTrial: false,

  // 跨班學習小組（2026-07-22 新增，Story 1）。
  // 涉及頁面：groups.html 的「學習小組（跨班）」區塊、
  // group-access-requests.html 的「學習小組（跨班）」申請區。
  studyGroups: false,

  // SMS 角色與權限／RBAC（2026-07-22 新增，Story 3）。
  // 涉及頁面：roster.html 的「角色與權限」分頁。
  rolesPermissions: true,

  // 校務紀錄組身份審批（2026-07-22 新增，取代誤植於 EdData 的同一職能）。
  // 涉及頁面：records-console.html（整頁）。
  recordsApproval: false,

  // 科主任視圖 — 科組統計。
  // 涉及頁面：dept.html（整頁）。
  subjectPanelView: true,

  // 內容審核員視圖 — 標籤審核與管理。
  // 涉及頁面：tags.html（整頁）。
  // 暫時關閉（2026-07-30）：這個角色與相關動作的實際定位尚未想清楚，先從
  // 導覽中隱藏，頁面建置內容完全保留。
  contentModeration: false,

  // Reviewer-only meta annotations — build-status ribbons ("🟡 提案中" /
  // "🔴 待決策"), data-source disclosures, and taxonomy-dependency notes.
  // These exist so whoever's walking through the prototype knows what's real
  // vs. proposed; they were never in-fiction UI an end-user persona would see.
  // Default OFF so the suite reads clean, as if it were the real product —
  // flip to true for an internal walkthrough that needs the caveats visible
  // again. See the CSS injection at the bottom of this file for what's hidden.
  protoAnnotations: false,

  // Site-wide "POC v0.1" corner ribbon (see the IIFE near the bottom of this
  // file). Default OFF (2026-07-31): hidden per Eric's request. Flip back to
  // true to reinstate the always-visible "this isn't real" corner disclaimer.
  pocRibbon: false,
};

function featureOn(key){
  return FEATURE_FLAGS[key] !== false; // missing key defaults to on
}

/* Generic auto-hide: any element tagged data-feature="someFlag" is hidden on
 * load if that flag is off — no per-page JS needed. Used for the permanent
 * sidebar nav links (each page's own left-hand .nav, not the floating
 * 🧭示範導覽 panel, which demo-nav.js already filters separately). Safe to
 * apply the same data-feature attribute to any other static link/section later. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-feature]').forEach(el => {
    if (!featureOn(el.dataset.feature)) el.style.display = 'none';
  });
});

/* Whole-page guard — call at the very top of a flagged page's own inline
 * script (before any render calls) if that ENTIRE page is behind one flag.
 * Swaps the page's main content for a placeholder notice, without deleting
 * any of the markup underneath (it's just display:none'd, not removed from
 * the DOM) — flip the flag back and the page is untouched.
 * The notice text itself is gated by protoAnnotations: by default (clean
 * reader mode) it's a neutral "not available" message with no mention of
 * flags, files, or "this demo round" — the detailed builder version (which
 * does name feature-flags.js) only shows when protoAnnotations is on. */
function guardWholePage(flagKey, mainSelector){
  if (featureOn(flagKey)) return;
  document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector(mainSelector);
    if (!main) return;
    main.style.display = 'none';
    const notice = document.createElement('div');
    notice.style.cssText = 'max-width:640px;margin:80px auto;padding:24px 28px;background:#fff;border:1px solid #e6ebf0;border-radius:12px;font-family:"Chiron GoRound TC","PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif;color:#55636f;font-size:.85rem;line-height:1.7;';
    notice.innerHTML = featureOn('protoAnnotations')
      ? '<b style="color:#1e2a35;display:block;margin-bottom:6px;">此畫面目前不在本輪示範範圍內</b>此頁的建置內容完全保留，只是暫時從導覽中隱藏（feature-flags.js 內的設定）。'
      : '<b style="color:#1e2a35;display:block;margin-bottom:6px;">此功能目前未開放</b>請聯絡你的資訊科技統籌了解詳情。';
    main.insertAdjacentElement('afterend', notice);
  });
}

/* Site-wide checkmark glyph.
 * The literal "✓" (U+2713) renders with soft, calligraphic strokes in most
 * CJK families — and especially in Chiron GoRound TC, whose whole design is
 * rounded — which read as hand-drawn next to the suite's geometric UI. This
 * replaces it with a two-segment SVG using square caps and a mitre join, so
 * the tick is built from straight lines at any size and inherits the
 * surrounding text colour.
 * CHECK_SVG is exposed globally because feature-flags.js loads before every
 * page's own script, so pages that build markup in JS can use it too. */
const CHECK_SVG = '<svg class="ck" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.4 5.4 10.8 12 3.2"/></svg>';
(function(){
  const style = document.createElement('style');
  style.textContent = `
    .ck{
      width:1em;height:1em;display:inline-block;vertical-align:-.115em;
      fill:none;stroke:currentColor;stroke-width:2;
      stroke-linecap:square;stroke-linejoin:miter;
    }
  `;
  document.head.appendChild(style);
})();

/* Site-wide <select> standardization — an audit found several dropdowns
 * (e.g. roster.html's 批量轉班 select) with zero styling at all, rendering in
 * raw OS chrome next to custom-styled buttons/inputs right beside them. Most
 * other <select> elements across the suite WERE already styled, but with
 * drifted radii (6px vs 8px) and, in a few places, a `background:#fff`
 * shorthand that silently cancels any background-image — which matters here
 * because this rule adds a custom arrow via background-image now that every
 * select gets appearance:none (removing the inconsistent native arrow too).
 * This is a base layer only (plain `select` selector = lowest specificity):
 * any page's own class-specific rule (`.status-pick`, `.scope-card select`,
 * etc.) still wins for whatever properties it sets, so deliberately compact
 * in-table selects keep their tighter padding/font-size — they just also
 * inherit the same border-radius, arrow, and focus/hover treatment unless
 * they say otherwise. Always on (not gated by protoAnnotations): this is a
 * real visual-consistency fix, not a reviewer-only annotation. */
(function(){
  const style = document.createElement('style');
  style.textContent = `
    select{
      font-family:inherit;color:inherit;cursor:pointer;
      border:1px solid var(--line,#dde3e8);border-radius:8px;
      background-color:#fff;padding:7px 30px 7px 11px;
      appearance:none;-webkit-appearance:none;-moz-appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%2355636f' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat:no-repeat;background-position:right 10px center;background-size:10px 6px;
    }
    select:hover{border-color:var(--ec-blue,#0072ab);}
    select:focus{outline:none;border-color:var(--ec-blue,#0072ab);}
    select:disabled{opacity:.5;cursor:not-allowed;}
  `;
  document.head.appendChild(style);
})();

/* Site-wide POC corner ribbon — a permanent, impossible-to-miss diagonal
 * ribbon pinned to the top-right corner of every page, so nobody who
 * stumbles onto this prototype (a screenshot, a shared link, a stakeholder
 * browsing without context) mistakes it for a real, shipping EdCity product.
 * Always on — NOT gated by protoAnnotations, since this isn't a
 * reviewer/builder note, it's a permanent "this isn't real" disclaimer meant
 * for every audience including end users of the walkthrough. Unlike a
 * top banner, a corner ribbon doesn't consume layout height, so it needs no
 * body-padding/sidebar-height compensation elsewhere. pointer-events:none on
 * the outer wrapper so it never blocks clicks on whatever sits underneath it
 * (e.g. a page's own top-right "guide" button). */
(function(){
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position:fixed;top:0;right:0;width:190px;height:190px;overflow:hidden;
    z-index:99999;pointer-events:none;
  `;
  const ribbon = document.createElement('div');
  ribbon.textContent = 'POC v0.1';
  ribbon.style.cssText = `
    position:absolute;top:28px;right:-50px;width:240px;text-align:center;
    transform:rotate(45deg);
    background:repeating-linear-gradient(45deg,#1e2a35,#1e2a35 12px,#8a5a09 12px,#8a5a09 24px);
    color:#fff;font-weight:800;font-size:.92rem;letter-spacing:.07em;
    padding:11px 0;box-shadow:0 2px 10px rgba(0,0,0,.35);
    text-shadow:0 1px 2px rgba(0,0,0,.65),0 1px 4px rgba(0,0,0,.5);
    font-family:"Chiron GoRound TC","PingFang TC","Microsoft JhengHei","Noto Sans TC",-apple-system,"Segoe UI",sans-serif;
  `;
  wrap.appendChild(ribbon);
  if (!featureOn('pocRibbon')) return;
  function mount(){ document.body.appendChild(wrap); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();

/* Hide reviewer-only meta annotations (see protoAnnotations above) via an
 * injected <style> rather than a one-time querySelectorAll pass — this way it
 * also covers instances of these classes that get written into the DOM by a
 * page's own render()/switchClass() calls after load, not just what's present
 * in the initial HTML. Covers every file, since every file loads this script:
 * ribbons ("提案中"/"待決策" banners), .no-story, .source-note (insights.html's
 * data-source disclosure), .skill-dep/.skill-source (student.html's analogous
 * per-card notes), and .gate-tag/.gatebox (the same "待決策" pattern reused
 * under different names in student.html/vetting.html/chat.html), .reality
 * (vetting.html's "現況：..." disclosure about the beta gap between the
 * intended vetting process and what's actually live today), and .data-note
 * (usage-report.html's disclosure that its usage figures are illustrative
 * since vendor-data.js has no real login/session source yet). */
if (!featureOn('protoAnnotations')) {
  const style = document.createElement('style');
  style.textContent = '.ribbon, .no-story, .source-note, .skill-dep, .skill-source, .gate-tag, .gatebox, .reality, .data-note { display: none !important; }';
  document.head.appendChild(style);
}


/* Latin/digit-ending names run straight into the Chinese that follows when
 * interpolated into a template — 「語音通 AI」 + 「不能就…」 rendered as
 * 「語音通 AI不能就…」. Only 語音通 AI ends in Latin today, but any future
 * vendor, tool or plan name could, so the padding is derived rather than
 * hardcoded into the two strings that happen to trip on it now. Returns the
 * value unchanged when it already ends in a CJK character. */
function cjkPad(v){
  const s = String(v == null ? '' : v);
  return /[A-Za-z0-9)\]]$/.test(s) ? s + ' ' : s;
}
