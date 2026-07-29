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

  // 校務紀錄組身分審批（2026-07-22 新增，取代誤植於 EdData 的同一職能）。
  // 涉及頁面：records-console.html（整頁）。
  recordsApproval: false,

  // 科主任視圖 — 科組統計。
  // 涉及頁面：dept.html（整頁）。
  subjectPanelView: true,

  // 內容審核員視圖 — 標籤審核與管理。
  // 涉及頁面：tags.html（整頁）。
  contentModeration: true,

  // Reviewer-only meta annotations — build-status ribbons ("🟡 提案中" /
  // "🔴 待決策"), data-source disclosures, and taxonomy-dependency notes.
  // These exist so whoever's walking through the prototype knows what's real
  // vs. proposed; they were never in-fiction UI an end-user persona would see.
  // Default OFF so the suite reads clean, as if it were the real product —
  // flip to true for an internal walkthrough that needs the caveats visible
  // again. See the CSS injection at the bottom of this file for what's hidden.
  protoAnnotations: false,
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
 * Swaps the page's main content for a plain "hidden for this walkthrough"
 * notice, without deleting any of the markup underneath (it's just display:none'd,
 * not removed from the DOM) — flip the flag back and the page is untouched. */
function guardWholePage(flagKey, mainSelector){
  if (featureOn(flagKey)) return;
  document.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector(mainSelector);
    if (!main) return;
    main.style.display = 'none';
    const notice = document.createElement('div');
    notice.style.cssText = 'max-width:640px;margin:80px auto;padding:24px 28px;background:#fff;border:1px solid #e6ebf0;border-radius:12px;font-family:"PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif;color:#55636f;font-size:.85rem;line-height:1.7;';
    notice.innerHTML = '<b style="color:#1e2a35;display:block;margin-bottom:6px;">此畫面目前不在本輪示範範圍內</b>此頁的建置內容完全保留，只是暫時從導覽中隱藏（feature-flags.js 內的設定）。';
    main.insertAdjacentElement('afterend', notice);
  });
}

/* Hide reviewer-only meta annotations (see protoAnnotations above) via an
 * injected <style> rather than a one-time querySelectorAll pass — this way it
 * also covers instances of these classes that get written into the DOM by a
 * page's own render()/switchClass() calls after load, not just what's present
 * in the initial HTML. Covers every file, since every file loads this script:
 * ribbons ("提案中"/"待決策" banners), .no-story, .source-note (insights.html's
 * data-source disclosure), .skill-dep/.skill-source (student.html's analogous
 * per-card notes), and .gate-tag/.gatebox (the same "待決策" pattern reused
 * under different names in student.html/vetting.html/chat.html). */
if (!featureOn('protoAnnotations')) {
  const style = document.createElement('style');
  style.textContent = '.ribbon, .no-story, .source-note, .skill-dep, .skill-source, .gate-tag, .gatebox { display: none !important; }';
  document.head.appendChild(style);
}
