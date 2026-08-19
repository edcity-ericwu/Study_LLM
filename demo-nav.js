/* EdCity prototype — floating demo navigator (for walking managers through all surfaces). */
(function(){
const CSS = `
.dn-pill{position:fixed;bottom:22px;right:22px;z-index:90;background:#1e2a35;color:#fff;border:none;
  border-radius:99px;padding:11px 18px;font-size:.8rem;font-weight:600;cursor:pointer;
  font-family:"Chiron GoRound TC","PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif;box-shadow:0 8px 24px rgba(20,30,40,.25);}
.dn-panel{position:fixed;bottom:70px;right:22px;z-index:91;background:#fff;border:1px solid #e6ebf0;
  border-radius:16px;box-shadow:0 18px 48px rgba(20,30,40,.2);width:400px;max-width:calc(100vw - 44px);padding:14px;display:none;
  font-family:"Chiron GoRound TC","PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif;
  max-height:min(70vh,560px);overflow-y:auto;overscroll-behavior:contain;}
.dn-panel.show{display:block;}
.dn-panel h6{font-size:.64rem;letter-spacing:normal;color:#8a97a3;font-weight:700;margin:10px 4px 6px;position:sticky;top:-14px;background:#fff;padding-top:14px;z-index:1;}
.dn-panel h6:first-child{margin-top:0;}
.dn-panel a{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;
  font-size:.8rem;color:#55636f;text-decoration:none;}
.dn-panel a:hover{background:#f2f6f9;}
.dn-panel a.here{background:#e6f4fb;color:#0072ab;font-weight:600;}
.dn-panel .legend{font-size:.62rem;color:#8a97a3;margin-top:10px;padding:8px 4px 0;border-top:1px solid #e6ebf0;line-height:1.6;}
`;
/* Ordered to follow the data-release flow, so a walkthrough reads as one story
 * rather than an org chart: the teacher asks → the coordinator approves → the
 * vendor receives → the student uses. Roles that sit outside that chain follow
 * after it — the roster that feeds it, and the platform-operations roles that
 * gate who may enter it at all.
 *
 * 4th element (optional) = feature-flag key from feature-flags.js. An entry
 * whose flag is off is filtered out of the nav entirely (page is untouched on
 * disk — just not listed here for this walkthrough). See feature-flags.js for
 * what each flag covers and why. */
const PAGES = [
  {group:'🧭 入口', items:[
    ['poc-hub.html','各科 POC 導覽','','pocHub'],
  ]},

  /* ── the release flow, in order ── */
  /* The teacher has two portals, not one list. ✨ EdCity.ai is where she makes
   * things; 🏫 課堂與學生 is where she manages who her students are and what
   * they may use. Split 2026-08-18 because the second carries approvals,
   * statuses and a coordinator, and having it inside the assistant made the
   * assistant look like a governance product. */
  {group:'① ✨ 教師 · EdCity.ai（製作）', items:[
    ['chat.html','科目助理',''],
    ['index.html','教學工具箱',''],
    ['tool-form.html','　└ 工具內頁（示意）',''],
    ['agents.html','EdMarket 應用程式',''],
    ['marking.html','AI 批改','y'],
    ['material-library.html','校本教材庫','y'],
    ['materials.html','教材檢視（三大用例）','y'],
  ]},
  {group:'② 🏫 教師 · 課堂與學生（管理）', items:[
    ['groups.html','教學分組（總覽）',''],
    ['group-detail.html?c=2b&g=support','　└ 分組內頁（支援組）',''],
    ['tool-status.html','工具申請進度',''],
    ['trial-invites.html','試用邀請與邀請碼',''],
    ['insights.html','學習紀錄庫','r'],
  ]},
  {group:'③ 🔧 資訊科技統籌（馮 Sir）· 審批', items:[
    ['eddata-console.html','供應商資料存取審批（EdData）','r'],
    ['subscriptions.html','訂閱管理（含待預算、預算建議書）','y'],
    ['usage-report.html','使用報告',''],
  ]},
  {group:'④ 🏢 供應商（智寫科技）· 接收', items:[
    ['vendor-portal.html','EdMarket 認證進度與邀請碼',''],
    ['vendor-data-console.html','資料存取控制台（含刪除確認）','r'],
  ]},
  {group:'⑤ 🎒 學生／家長（Karen）· 使用', items:[
    ['student.html','學生／家長入口','r'],
  ]},

  /* ── upstream: the roster everything above is measured against ── */
  {group:'📋 校務處（何主任）· 編班', items:[
    ['roster.html','校務處控制台（教師名冊／任教編配／學年升班／學生編班）','y'],
  ]},
  {group:'🗂 校務紀錄組（曾主任）· 身份', items:[
    ['records-console.html','身份紀錄審批與查閱','r','recordsApproval'],
  ]},

  /* ── platform operations: who may enter the ecosystem at all ── */
  {group:'🤝 供應商關係主任（方小姐 · 平台營運）', items:[
    ['vetting.html','供應商審核（含資料需求申報）','y','vendorVetting'],
  ]},
  {group:'🏷 內容審核員（平台營運）', items:[
    ['tags.html','標籤審核與管理','r','contentModeration'],
  ]},

  /* ── outside the release chain ── */
  {group:'📈 科主任（李天佑主任）· 唯讀', items:[
    ['dept.html','科組統計','y','subjectPanelView'],
    ['dept-trial-evaluations.html','工具試用評估（已決定不納入審批鏈）','y','subjectPanelTrialReview'],
  ]},
];
function init(){
  /* Hidden by default: the fixed pill sits on whatever a page puts in its
   * bottom-right corner. Flip demoNav to true in feature-flags.js to bring
   * the walkthrough back — nothing else here changes. */
  if(typeof featureOn === 'function' && !featureOn('demoNav')) return;

  const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
  const pill=document.createElement('button');pill.className='dn-pill';pill.textContent='🧭 示範導覽';
  const panel=document.createElement('div');panel.className='dn-panel';
  const here=location.pathname.split('/').pop()||'index.html';
  // Filter by feature flag (typeof-guarded: pages that don't load feature-flags.js
  // for some reason just show everything, rather than throwing).
  const flagOn = k => (typeof featureOn === 'function') ? featureOn(k) : true;
  const visiblePages = PAGES.map(g=>({group:g.group, items:g.items.filter(([,,,flag])=>!flag || flagOn(flag))}))
    .filter(g=>g.items.length);
  /* Build-status tags removed from this panel 2026-08-18. They answered a
   * question nobody in the room is asking — 「是否已建置」 — while sitting on
   * top of the one this panel exists for, which is 「我現在在誰的畫面」. The
   * third element of each item is kept as a record of that status; it just is
   * not rendered here. Page-level ribbons still carry it when protoAnnotations
   * is on. */
  panel.innerHTML = visiblePages.map(g=>'<h6>'+g.group+'</h6>'+g.items.map(([f,n])=>
    '<a href="'+f+'"'+(f===here?' class="here"':'')+'>'+n+'</a>'
  ).join('')).join('')
  + '<div class="legend">正式產品不會顯示此導覽。</div>';
  // Scroll the current page's entry into view on every open, so the panel
  // doesn't dump you back at the top each time — it stays oriented on where
  // you actually are, not just where the list happens to start.
  pill.onclick=()=>{
    const opening = !panel.classList.contains('show');
    panel.classList.toggle('show');
    if(opening){
      const hereEl = panel.querySelector('.here');
      if(hereEl) hereEl.scrollIntoView({block:'center'});
    }
  };
  document.addEventListener('click',e=>{if(!e.target.closest('.dn-pill')&&!e.target.closest('.dn-panel'))panel.classList.remove('show');});
  document.body.appendChild(pill);document.body.appendChild(panel);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
