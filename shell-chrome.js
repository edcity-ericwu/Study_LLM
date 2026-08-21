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

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
