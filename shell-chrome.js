/* ── shell-chrome.js ─────────────────────────────────────────────────────
 * Collapsible sidebar, shared by both shells (.sidebar and .sys-sidebar).
 *
 * Loaded in <head>, like feature-flags.js, and for the same reason: the
 * collapsed state is read from storage and written onto <html> BEFORE first
 * paint. Setting it on <body> or waiting for DOMContentLoaded makes the
 * sidebar render at full width and then vanish — a visible jump on every
 * navigation, which is worse than not having the feature.
 *
 * The state is remembered across pages, so collapsing once stays collapsed
 * for the rest of the walkthrough rather than resetting at each screen.
 *
 * No dependency on demo-state.js — this has to run before anything else and
 * several system-shell pages do not load it. Same `edcity:` namespace, same
 * silent no-op if storage throws (file:// opaque origins).
 */
(function(){
  'use strict';

  var KEY = 'edcity:navCollapsed';

  function read(){
    try { return localStorage.getItem(KEY) === '1'; } catch(e){ return false; }
  }
  function write(v){
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch(e){ /* no-op */ }
  }

  /* Pre-paint: the class has to be on <html>, because <body> does not exist
   * yet when this file runs. */
  if(read()) document.documentElement.classList.add('nav-collapsed');

  /* The collapsed rail takes the colour of the sidebar it replaced, so each
   * role keeps its own identity when retracted. The sidebar cannot be measured
   * yet at this point, so the value measured on the last visit is applied
   * pre-paint and refreshed below — otherwise a collapsed rail flashes a
   * neutral fallback on every navigation. */
  var RAIL = 'edcity:navBg:' + location.pathname;
  try {
    var cached = JSON.parse(localStorage.getItem(RAIL) || 'null');
    if(cached) applyRail(cached);
  } catch(e){ /* no-op */ }

  /* Opened straight off disk, a browser treats each file as its own opaque
   * origin and localStorage may throw. Everything here degrades silently, so
   * the prototype still renders — but nothing that spans pages will work:
   * the sidebar forgets it was collapsed, 製作中 work vanishes on navigation,
   * and a tool cannot resume. That reads as "broken" rather than "unsupported",
   * so say so once, in the console, where a demo audience will not see it. */
  (function(){
    var ok = true;
    try { localStorage.setItem('edcity:probe','1'); localStorage.removeItem('edcity:probe'); }
    catch(e){ ok = false; }
    if(!ok || location.protocol === 'file:'){
      console.warn(
        '[EdCity prototype] Browser storage is unavailable on file:// — ' +
        'sidebar state, 製作中 progress and tool resume will not persist between pages.\n' +
        'Serve the folder over HTTP instead, e.g.  python3 -m http.server 8000  ' +
        'then open http://localhost:8000/index.html'
      );
    }
  })();

  /* The control sits inside the rail in both states, so it should carry the
   * rail's own tone rather than a per-shell override. Deriving ink from the
   * measured colour means a role added or recoloured later is handled without
   * touching this file — the same reason the rail colour is measured at all.
   *
   * Perceived brightness (ITU-R BT.601) rather than a raw average: the eye is
   * far more sensitive to green than to blue, and 馮 Sir's #2b2450 and the
   * vendor's #4a2029 would land on the wrong side of a naive threshold. */
  function toneOf(bg){
    var m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(bg || '');
    if(!m) return null;
    var r = +m[1], g = +m[2], b = +m[3];
    var light = (0.299 * r + 0.587 * g + 0.114 * b) > 140;
    return {
      bg: bg,
      ink:  light ? '#8a97a3' : 'rgba(255,255,255,.72)',
      wash: light ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.14)'
    };
  }

  function applyRail(t){
    var st = document.documentElement.style;
    st.setProperty('--sc-rail', t.bg);
    st.setProperty('--sc-rail-ink', t.ink);
    st.setProperty('--sc-rail-wash', t.wash);
  }

  /* Mirrored panel glyphs: the filled bar shows which side the sidebar is on,
   * so the same button reads as "hide it" and "bring it back" without moving. */
  var IC_OPEN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>';
  var IC_SHUT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>';

  function build(){
    var bar = document.querySelector('.sidebar') || document.querySelector('.sys-sidebar');
    if(!bar) return;

    /* The dark shell needs the button styled against a dark header while
     * expanded, and against light content once collapsed — the stylesheet
     * needs to know which shell it is on to do that. */
    if(bar.classList.contains('sys-sidebar')) document.documentElement.classList.add('sys-shell');

    /* Measure the real thing and remember it. Reading the colour beats a
     * hardcoded per-role list, which would go stale the moment a role is
     * added or recoloured. */
    var bg = getComputedStyle(bar).backgroundColor;
    var tone = toneOf(bg);
    if(tone){
      applyRail(tone);
      try { localStorage.setItem(RAIL, JSON.stringify(tone)); } catch(e){ /* no-op */ }
    }

    /* ONE button, permanently at top-left, in both states. It is created once
     * and never re-parented: only the icon and the label change. Moving it
     * between a sidebar slot and a floating slot is what made the first
     * version feel broken. */
    var tb = document.createElement('button');
    tb.className = 'sc-toggle';
    tb.type = 'button';

    function paint(v){
      tb.innerHTML = v ? IC_SHUT : IC_OPEN;
      tb.title = v ? '展開側欄' : '收合側欄';
      tb.setAttribute('aria-label', tb.title);
      tb.setAttribute('aria-expanded', v ? 'false' : 'true');
      if(window.Jobs && Jobs.refresh) Jobs.refresh();
    }
    function set(v){
      document.documentElement.classList.toggle('nav-collapsed', v);
      write(v);
      paint(v);
    }

    paint(read());
    tb.onclick = function(){ set(!document.documentElement.classList.contains('nav-collapsed')); };
    document.body.appendChild(tb);
  }

  /* ── portal switcher ───────────────────────────────────────────────────
   * Every shell page's markup calls togglePortal() from an onclick, but only
   * the older pages define it — the six tool pages built on 2026-08-21/24 do
   * not, so their portal switcher threw ReferenceError on click and the menu
   * never opened. Found 2026-08-24 by counting calls against definitions.
   *
   * Defined here rather than pasted into six files: the same one-line function
   * living in nine copies is exactly the drift this stylesheet exists to stop.
   * Pages that already declare their own simply shadow this, since their
   * <script> runs after ours. */
  if(typeof window.togglePortal !== 'function'){
    window.togglePortal = function(){
      var m = document.getElementById('portalMenu');
      if(m) m.classList.toggle('show');
    };
  }

  /* ── back to the right shelf ────────────────────────────────────────────
   * Eric, 2026-08-24: "eng tool details page should return to tool list
   * filtered for english, chi tool the same — whenever there is a button back."
   *
   * The exit button already carried ?subject=. Two other routes did not: the
   * sidebar's 教學工具箱 row, and the walkthrough links demo-nav.js injects. So
   * two of the three ways out of an English tool dropped the teacher on the
   * Chinese shelf, where none of the tools she had just been using appear.
   *
   * Done centrally, for three reasons:
   *   · seven pages carry an identical sidebar row, and seven copies of a fix
   *     is how the last four defects started;
   *   · demo-nav.js builds its links after this file runs, so a one-time sweep
   *     of the DOM would miss them;
   *   · pages whose subject is only known at runtime (material.html,
   *     my-materials.html — it depends on which tool's material is open) can
   *     just set the attribute and be covered by the same code.
   *
   * A page declares its shelf with <body data-subject="eng"> or by calling
   * ShellChrome.setSubject(). Anything without one is genuinely subject-less —
   * the platform library spans every subject — and is left alone.
   */
  function shelf(){
    return (document.body && document.body.getAttribute('data-subject')) || '';
  }

  function isCatalogue(href){
    return /(^|\/)index\.html(\?|#|$)/.test(href || '');
  }

  /* Rewrites what the link SAYS, so the status bar and a copied link are also
   * right — not just what happens on click. */
  function subjectify(){
    var s = shelf();
    if(!s) return;
    var links = document.querySelectorAll('a[href]');
    for(var i = 0; i < links.length; i++){
      var h = links[i].getAttribute('href');
      if(!isCatalogue(h) || h.indexOf('subject=') >= 0) continue;
      links[i].setAttribute('href', h.split('#')[0].split('?')[0] + '?subject=' + s);
    }
  }

  /* The guarantee. A sweep can always be outrun by something injected later;
   * a capture-phase listener cannot. */
  document.addEventListener('click', function(e){
    var s = shelf();
    if(!s || !e.target || !e.target.closest) return;
    var a = e.target.closest('a[href]');
    if(!a) return;
    var h = a.getAttribute('href');
    if(!isCatalogue(h) || h.indexOf('subject=') >= 0) return;
    a.setAttribute('href', h.split('#')[0].split('?')[0] + '?subject=' + s);
  }, true);

  window.ShellChrome = window.ShellChrome || {};
  window.ShellChrome.setSubject = function(s){
    if(!s) return;
    document.body.setAttribute('data-subject', s);
    subjectify();
  };
  window.ShellChrome.subjectify = subjectify;

  /* ── optical alignment for leading CJK punctuation ─────────────────────
   * A heading opening with a full-width mark — 「元宇宙英語學習世界」…,
   * 《出師表》 — starts half a character further right than its neighbours and
   * reads as a stray indent (Eric, 2026-08-25). See the note in
   * shell-chrome.css for why the correction is what it is.
   *
   * Done in JS because CSS cannot select on first character: :first-letter
   * has no such test, and `:has()` cannot match text. Tagging a class is the
   * cheapest honest way, and it means a heading with no leading punctuation is
   * never dragged out of line.
   *
   * Exposed so pages that build headings after load can re-run it over just
   * the part they rendered.
   */
  var WIDE  = /^[「『（《〈【〔〖｛［]/;      /* full-width: needs ~half an em */
  var NARROW = /^[(\[{"'“‘]/;                 /* proportional: needs much less */

  function hangPunct(root){
    var scope = root || document;
    var els = scope.querySelectorAll('h1,h2,h3,h4,.tb-name,.acard h3,.mcard b,.md-head h1');
    for(var i = 0; i < els.length; i++){
      var el = els[i];
      var t = (el.textContent || '').trim();
      el.classList.remove('opt-punct', 'opt-punct-sm');
      if(WIDE.test(t))        el.classList.add('opt-punct');
      else if(NARROW.test(t)) el.classList.add('opt-punct-sm');
    }
  }
  window.ShellChrome = window.ShellChrome || {};
  window.ShellChrome.hangPunct = hangPunct;

  function boot(){
    build();
    subjectify();
    hangPunct();
    /* Grids and lists are rendered by their own page scripts, which run after
     * this. One deferred pass catches them without every page having to call
     * it; pages that re-render on interaction call ShellChrome.hangPunct()
     * themselves. */
    setTimeout(hangPunct, 0);
    /* demo-nav.js and jobs.js add links of their own on DOMContentLoaded, and
     * ordering between listeners is not something to rely on. */
    setTimeout(subjectify, 0);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
