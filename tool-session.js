/* ── tool-session.js ─────────────────────────────────────────────────────
 * Resume a tool where you left it.
 *
 * Decision (Decision Log 2026-08-21): a teacher who starts work in 課文工房 and
 * wanders off to look at something else on the platform must be able to come
 * back to the work, not to a blank form. Before this, only the *output*
 * survived — the job records — and the work itself did not. Re-entering the
 * tool meant starting over, which quietly contradicted the "you can walk away"
 * claim the tool is built to make.
 *
 * What is saved is deliberately small: the stage the teacher is on, plus the
 * inputs and choices they made by hand. Anything derivable is re-derived on
 * restore, so this file never becomes a second copy of the tool's model.
 *
 * One namespaced record per tool, so the other two POCs inherit the pattern by
 * calling save()/load() rather than by copying anything.
 */
(function(){
  'use strict';

  var PREFIX = 'edcity:tool:';

  function key(tool){ return PREFIX + tool; }

  var ToolSession = {

    /* state: whatever the tool needs to rebuild itself. Kept small on purpose. */
    save: function(tool, state){
      try {
        localStorage.setItem(key(tool), JSON.stringify({
          at: Date.now(),
          state: state
        }));
      } catch(e){ /* no-op on file:// */ }
    },

    load: function(tool){
      try {
        var raw = localStorage.getItem(key(tool));
        if(!raw) return null;
        var rec = JSON.parse(raw);
        return rec && rec.state ? rec.state : null;
      } catch(e){ return null; }
    },

    savedAt: function(tool){
      try {
        var raw = localStorage.getItem(key(tool));
        return raw ? (JSON.parse(raw).at || 0) : 0;
      } catch(e){ return 0; }
    },

    has: function(tool){ return !!ToolSession.load(tool); },

    clear: function(tool){
      try { localStorage.removeItem(key(tool)); } catch(e){ /* no-op */ }
    },

    /* Rough, teacher-facing age. Used on the toolbox card so 繼續 says how
     * stale the saved work is rather than just asserting it exists. */
    ageLabel: function(tool){
      var at = ToolSession.savedAt(tool);
      if(!at) return '';
      var m = Math.round((Date.now() - at) / 60000);
      if(m < 1) return '剛剛';
      if(m < 60) return m + ' 分鐘前';
      var h = Math.round(m / 60);
      if(h < 24) return h + ' 小時前';
      return Math.round(h / 24) + ' 天前';
    }
  };

  window.ToolSession = ToolSession;
})();
