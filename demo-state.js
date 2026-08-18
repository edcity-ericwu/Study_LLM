/* Cross-page demo state.
 *
 * The rest of this suite deliberately has no persistence — each page is a
 * standalone file and in-memory changes die on navigation. That is fine for
 * single-page interactions, but it breaks the one story that spans actors:
 * a teacher changes who is in a group, and the vendor's console should show
 * the change, because in the real system a release and its accounts follow the
 * same object.
 *
 * Storage: localStorage where the origin allows it (http/https — GitHub Pages,
 * python3 -m http.server). On file:// Chrome gives an opaque origin and Safari
 * blocks it outright, so this degrades to a silent no-op: every page still
 * works exactly as before, only the hand-off between actors is lost. Nothing
 * calls this without a fallback.
 *
 * What is deliberately NOT shared: the school's roster. The vendor console
 * reads a released payload — names, class, level — never CLASSES. That mirrors
 * the real boundary, where a vendor receives what was granted rather than
 * querying the school's records.
 */
const DemoState = (function(){
  const NS = 'edcity:';
  let ok = true;
  try {
    const probe = NS + '__probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch (_) {
    ok = false;   // file:// or storage disabled — expected, not an error
  }
  return {
    available: ok,
    get(key, fallback){
      if(!ok) return fallback;
      try {
        const raw = localStorage.getItem(NS + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch(_){ return fallback; }
    },
    set(key, value){
      if(!ok) return false;
      try { localStorage.setItem(NS + key, JSON.stringify(value)); return true; }
      catch(_){ return false; }
    },
    clear(){
      if(!ok) return;
      try {
        Object.keys(localStorage)
          .filter(k => k.startsWith(NS))
          .forEach(k => localStorage.removeItem(k));
      } catch(_){}
    },
  };
})();
