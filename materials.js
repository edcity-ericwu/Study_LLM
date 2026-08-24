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

  /* Stable enough for a prototype and stable across reloads, which is what a
   * detail view needs to address a material at all. */
  function newId(){ return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  var Materials = {

    /* Both names on every kind. A tool's own view speaks the tool's language
     * (Eric, 2026-08-21): if a tool is an application, its sections should not
     * switch language mid-application. The platform library stays Chinese. */
    KIND: {
      ws:{icon:'📝', name:'學生工作紙', en:'Worksheet'},
      pt:{icon:'🖥', name:'課堂簡報',   en:'Slides'},
      tn:{icon:'💡', name:'教師提示',   en:'Teacher notes'},
      qz:{icon:'✅', name:'測驗卷',     en:'Quiz'},
      lp:{icon:'📋', name:'教案',       en:'Lesson plan'}
    },

    /* Resolve a kind's label in the caller's language. */
    kindName: function(kind, lang){
      var k = Materials.KIND[kind];
      if(!k) return lang === 'en' ? 'Material' : '教材';
      return lang === 'en' ? k.en : k.name;
    },

    all: function(){ return Materials.ensureIds(); },

    /* Newest first, so a teacher sees what she just made. */
    /* `body` carries the rendered material. Without it a saved material is a
     * filename with no file — nothing to open, nothing to preview, nothing to
     * take into a classroom. Tools that render real output store it here; the
     * detail view refuses politely for anything that has none. */
    add: function(item){
      var list = read();
      var rec = Object.assign({id: newId(), at: today()}, item);
      list.unshift(rec);
      write(list);
      return rec;
    },

    get: function(id){
      var found = null;
      read().forEach(function(x){ if(x.id === id) found = x; });
      return found;
    },
    addMany: function(items){
      (items || []).forEach(Materials.add);
      return items;
    },

    /* ── views ────────────────────────────────────────────────────────────
     * A tool's own tab shows ONLY that tool's materials (Eric, 2026-08-21). A
     * tab labelled 我的教材 inside 課文工房 promises 課文工房's work; mixing in
     * another tool's output would be a different kind of lie from the one we
     * just removed. The platform-wide view lives in the library.
     *
     * forTopic — cross-tool matching on the topic string — was built, argued
     * for, and then overruled. Removed rather than left in the file: an unused
     * view is an invitation to use it in the wrong place. */
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

    /* Old records predate ids; give them one on read so a detail view can
     * address them rather than silently failing on the seeded material. */
    ensureIds: function(){
      var list = read(), changed = false;
      list.forEach(function(x){ if(!x.id){ x.id = newId(); changed = true; } });
      if(changed) write(list);
      return list;
    },

    clear: function(){ write([]); }
  };

  window.Materials = Materials;
})();
