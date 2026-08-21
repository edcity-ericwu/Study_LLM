/* ── jobs.js ─────────────────────────────────────────────────────────────
 * Work a tool is still doing after the teacher has walked away.
 *
 * Decision (Decision Log 2026-08-20): the tool's own library is the single
 * source of truth — a running job is a 製作中 row that becomes 已完成, not a
 * separate queue. What lives here is only the shared *record*, plus a count
 * in the shell that points into the right library. Deliberately NOT a jobs
 * page: a second inbox would show the same thing twice.
 *
 * Because of that, the word "job" never appears in the interface. The teacher
 * sees a material that is 製作中. Only the code calls it a job.
 *
 * Progress is derived from wall-clock time, never from a tick counter. This is
 * the whole point: a job started before navigating away must be further along
 * when the teacher returns, including after a full page load. A setInterval
 * would reset to zero and the "walk away" story would be a lie.
 *
 * Dependency-free, same `edcity:` namespace as demo-state.js and
 * shell-chrome.js — several pages that need the count do not load DemoState.
 */
(function(){
  'use strict';

  var KEY = 'edcity:jobs';

  /* Demo timings. Real generation takes minutes; compressed here so a job can
   * actually be seen finishing during a walkthrough, while still being long
   * enough that leaving the page is the natural thing to do. */
  var LEAD_MS = 6000;   // before the first material lands
  var GAP_MS  = 5000;   // between materials

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ return []; }
  }
  function write(list){
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch(e){ /* no-op */ }
  }

  var Jobs = {
    LEAD_MS: LEAD_MS,
    GAP_MS: GAP_MS,

    all: read,

    /* items: [{title, kind, text, level}] — one per material being made.
     * They finish in sequence rather than all at once, which is both what
     * actually happens and what lets the library show partial results. */
    start: function(tool, toolName, href, items){
      var now = Date.now();
      var list = read();
      var made = items.map(function(it, i){
        return {
          id: 't' + now + '-' + i,
          tool: tool, toolName: toolName, href: href,
          title: it.title, kind: it.kind, text: it.text, level: it.level,
          startedAt: now,
          doneAt: now + LEAD_MS + (i + 1) * GAP_MS
        };
      });
      write(list.concat(made));
      return made;
    },

    running: function(tool){
      var now = Date.now();
      return read().filter(function(j){
        return j.doneAt > now && (!tool || j.tool === tool);
      });
    },

    /* Finished jobs are handed to the tool's library, which owns them from
     * that point on, and dropped from here. Nothing accumulates. */
    harvest: function(tool){
      var now = Date.now(), keep = [], out = [];
      read().forEach(function(j){
        if(j.doneAt <= now && (!tool || j.tool === tool)) out.push(j); else keep.push(j);
      });
      if(out.length) write(keep);
      return out;
    },

    /* Fraction complete, 0–1, for a 製作中 row. */
    progress: function(j){
      var span = j.doneAt - j.startedAt;
      if(span <= 0) return 1;
      return Math.min(1, Math.max(0, (Date.now() - j.startedAt) / span));
    },

    remainingLabel: function(j){
      var s = Math.max(0, Math.round((j.doneAt - Date.now()) / 1000));
      if(s <= 0) return '快將完成';
      if(s < 60) return '約 ' + s + ' 秒後完成';
      return '約 ' + Math.ceil(s / 60) + ' 分鐘後完成';
    },

    clear: function(){ write([]); }
  };

  window.Jobs = Jobs;

  /* ── the count in the shell ─────────────────────────────────────────────
   * A pointer, not an inbox. One tool running → straight to its library.
   * More than one → a short list of tools, each linking to its own library.
   * It never lists individual materials; that is the library's job. */

  function render(){
    var host = document.getElementById('jbInd');
    var running = Jobs.running();

    var dot = document.querySelector('.sc-toggle .jb-dot');
    if(!dot){
      var tb = document.querySelector('.sc-toggle');
      if(tb){ dot = document.createElement('span'); dot.className = 'jb-dot'; tb.appendChild(dot); }
    }
    if(dot) dot.classList.toggle('on', running.length > 0);

    if(!host) return;
    if(!running.length){ host.classList.remove('on'); host.innerHTML = ''; return; }

    var byTool = {};
    running.forEach(function(j){
      byTool[j.tool] = byTool[j.tool] || {name: j.toolName, href: j.href, n: 0};
      byTool[j.tool].n++;
    });
    var tools = Object.keys(byTool);

    var head = '<span class="jb-spin"></span><span style="flex:1"><b>' +
      running.length + ' 項教材製作中</b><small>' +
      (tools.length === 1 ? byTool[tools[0]].name + '・可離開，完成後回來查看'
                          : tools.length + ' 個工具進行中') + '</small></span>';

    host.classList.add('on');
    if(tools.length === 1){
      host.innerHTML = '<a class="jb-btn" href="' + byTool[tools[0]].href + '">' + head + '</a>';
    } else {
      host.innerHTML = '<button class="jb-btn" type="button" onclick="Jobs._menu()">' + head +
        '<span style="color:var(--ink-3)">▾</span></button>' +
        '<div class="jb-menu" id="jbMenu">' + tools.map(function(t){
          return '<a href="' + byTool[t].href + '"><b>' + byTool[t].name + '</b>' +
                 byTool[t].n + ' 項製作中</a>';
        }).join('') + '</div>';
    }
  }

  Jobs._menu = function(){
    var m = document.getElementById('jbMenu');
    if(m) m.classList.toggle('on');
  };
  Jobs.refresh = render;

  function boot(){
    /* Slot above the nav, under the portal switcher, on whichever shell the
     * page uses. Injected rather than hand-added so it stays in one place. */
    var bar = document.querySelector('.sidebar') || document.querySelector('.sys-sidebar');
    if(bar && !document.getElementById('jbInd')){
      var nav = bar.querySelector('.nav') || bar.querySelector('.sys-nav');
      var slot = document.createElement('div');
      slot.className = 'jb-ind';
      slot.id = 'jbInd';
      if(nav) bar.insertBefore(slot, nav); else bar.appendChild(slot);
    }
    render();
    setInterval(render, 1000);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
