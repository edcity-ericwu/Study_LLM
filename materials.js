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

    KIND: {
      ws:{icon:'📝', name:'學生工作紙'},
      pt:{icon:'🖥', name:'課堂簡報'},
      tn:{icon:'💡', name:'教師提示'},
      qz:{icon:'✅', name:'測驗卷'},
      lp:{icon:'📋', name:'教案'}
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

    /* Old records predate ids; give them one on read so a detail view can
     * address them rather than silently failing on the seeded material. */
    ensureIds: function(){
      var list = read(), changed = false;
      list.forEach(function(x){ if(!x.id){ x.id = newId(); changed = true; } });
      if(changed) write(list);
      return list;
    },

    /* ── the in-tool view ────────────────────────────────────────────────
     * One renderer, used by every tool. Four hand-built copies would drift
     * inside a fortnight — the monospace stack, the seed and the class filter
     * each drifted that way this week.
     *
     * Rules it enforces, so no caller has to remember them:
     *   · nothing relevant → renders NOTHING. An empty component is noise,
     *     the same reason a dead filter is disabled rather than shown.
     *   · capped at three, then a link to the library. Uncapped, it becomes
     *     the second library the boundary above exists to prevent.
     *   · open only. No rename, no delete — those live in the library.
     */
    strip: function(opts){
      opts = opts || {};
      var items = Materials.forTopic(opts.topic).slice(0, opts.max || 3);
      if(!items.length) return '';

      var from     = encodeURIComponent(opts.from || location.pathname.split('/').pop());
      var fromName = encodeURIComponent(opts.fromName || '上一頁');
      var total    = Materials.forTopic(opts.topic).length;

      return '<div class="mstrip">' +
        '<div class="mstrip-head">' +
          '<b>' + (opts.title || '你已經為這個課題做過的教材') + '</b>' +
          (total > items.length
            ? '<a href="my-materials.html">查看全部 ' + total + ' 份 →</a>'
            : '<a href="my-materials.html">查看全部 →</a>') +
        '</div>' +
        items.map(function(x){
          var k = Materials.KIND[x.kind] || {icon:'📄', name:'教材'};
          return '<a class="mstrip-row" href="material.html?id=' + encodeURIComponent(x.id) +
            '&from=' + from + '&fromName=' + fromName + '">' +
            '<span class="si">' + k.icon + '</span>' +
            '<span class="st"><b>' + x.title + '</b>' +
            '<small>' + k.name + '・' + (x.toolName || '') + '・' + x.at + '</small></span>' +
            '<span class="sg">開啟 →</span></a>';
        }).join('') +
      '</div>';
    },

    clear: function(){ write([]); }
  };

  window.Materials = Materials;
})();
