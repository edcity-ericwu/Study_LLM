/* ── materials.js ────────────────────────────────────────────────────────
 * The teacher's material library: one store, several views.
 *
 * Step 1 of the plan agreed 2026-08-21. Before this, four pages read and wrote
 * `edcity:twMaterials` with their own copies of the same code, which is how the
 * SEED defect got in — the seed was a *fallback* in one place and real content
 * in another, so the first save silently erased three materials.
 *
 * The distinction this file exists to protect:
 *   two stores  = two inboxes  → they drift. Ruled out 2026-08-20.
 *   two views of one store = a filter → fine, and what a teacher actually needs.
 *
 * So the store stays single and the *views* multiply. A tool asks a narrow
 * question (what exists for this topic?); the library asks the broad one.
 *
 * BOUNDARY — write this down or it erodes:
 *   The in-tool view ANSWERS A QUESTION. It does not host a workflow.
 *     · continuing work — open, duplicate, start from  → belongs in a tool
 *     · managing material — rename, delete, browse all → belongs in the library
 *   Without the line, the in-tool strip accretes a delete button, then a
 *   rename, and becomes the second library we refused to build.
 */
(function(){
  'use strict';

  var KEY = 'twMaterials';

  /* Seeded so a first-time library is not empty. Written in ONCE, then appended
   * to — as a fallback it was replaced by the first save. */
  var SEED = [
    {tool:'text-workshop', toolName:'課文工房', kind:'ws', text:'岳陽樓記', level:'中四', at:'2026-08-11',
     title:'學生工作紙：比較第三段與第四段的景物描寫，說明情隨景遷'},
    {tool:'text-workshop', toolName:'課文工房', kind:'tn', text:'岳陽樓記', level:'中四', at:'2026-08-11',
     title:'教師提示：比較第三段與第四段的景物描寫，說明情隨景遷'},
    {tool:'text-workshop', toolName:'課文工房', kind:'pt', text:'出師表',   level:'中五', at:'2026-06-24',
     title:'課堂簡報：理解奏表中臣子陳說的語氣與分寸'}
  ];

  function read(){
    if(DemoState.get(KEY, null) === null) DemoState.set(KEY, SEED.slice());
    return DemoState.get(KEY, null) || [];
  }
  function write(list){ DemoState.set(KEY, list); }

  function today(){ return new Date().toISOString().slice(0,10); }

  var Materials = {

    KIND: {
      ws:{icon:'📝', name:'學生工作紙'},
      pt:{icon:'🖥', name:'課堂簡報'},
      tn:{icon:'💡', name:'教師提示'},
      qz:{icon:'✅', name:'測驗卷'},
      lp:{icon:'📋', name:'教案'}
    },

    all: read,

    /* Newest first, so a teacher sees what she just made. */
    add: function(item){
      var list = read();
      list.unshift(Object.assign({at: today()}, item));
      write(list);
      return item;
    },
    addMany: function(items){
      (items || []).forEach(Materials.add);
      return items;
    },

    /* ── views ────────────────────────────────────────────────────────────
     * forTopic is the one a tool should use. The teacher's question mid-task
     * is "did I already make something for this text?", not "what has this
     * tool produced" — she may have made the lesson plan in one tool and the
     * quiz in another, and a per-tool view would hide exactly that. */
    forTopic: function(text){
      var t = (text || '').trim().toLowerCase();
      if(!t) return [];
      return read().filter(function(x){
        var xt = (x.text || '').trim().toLowerCase();
        return xt === t || xt.indexOf(t) !== -1 || t.indexOf(xt) !== -1;
      });
    },

    forTool: function(tool){
      return read().filter(function(x){ return x.tool === tool; });
    },

    recent: function(n){ return read().slice(0, n || 5); },

    /* Which tools have produced anything — drives the library's 工具 filter,
     * so it can never offer a tool with nothing behind it. */
    tools: function(){
      var out = {};
      read().forEach(function(x){ if(x.tool) out[x.tool] = x.toolName || x.tool; });
      return out;
    },

    clear: function(){ write([]); }
  };

  window.Materials = Materials;
})();
