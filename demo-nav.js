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
.dn-panel .tag{margin-left:auto;font-size:.58rem;font-weight:700;border-radius:99px;padding:2px 7px;white-space:nowrap;flex-shrink:0;}
.dn-panel .tag.y{color:#8a6d00;background:#fdf1c7;}
.dn-panel .tag.r{color:#b91c1c;background:#fee2e2;}
.dn-panel .legend{font-size:.62rem;color:#8a97a3;margin-top:10px;padding:8px 4px 0;border-top:1px solid #e6ebf0;line-height:1.6;}
`;
/* 4th element (optional) = feature-flag key from feature-flags.js. An entry
 * whose flag is off is filtered out of the nav entirely (page is untouched on
 * disk — just not listed here for this walkthrough). See feature-flags.js for
 * what each flag covers and why. */
const PAGES = [
  {group:'👩‍🏫 教師（陳凱怡老師）', items:[
    ['chat.html','EdCity.ai（科目助理）',''],
    ['index.html','教學工具箱',''],
    ['agents.html','教學應用程式／智能助手',''],
    ['material-library.html','校本教材庫','y'],
    ['trial-invites.html','試用邀請（供應商發起）','r','toolTrial'],
  ]},
  /* Mirrors the sidebar's Ideas Lab group — these two are proposals, not built
   * features, so they sit apart from the teacher's working tools here too. */
  {group:'💡 Ideas Lab（構思階段）', items:[
    ['materials.html','教材核實（三大用例）','y'],
    ['insights.html','學習紀錄庫（核心價值，含多班切換）','r'],
  ]},
  {group:'📈 科主任（李天佑主任）', items:[
    ['dept.html','科組統計','y','subjectPanelView'],
    ['dept-trial-evaluations.html','工具試用評估','y','toolTrial'],
  ]},
  {group:'🎒 學生／家長（Karen）', items:[
    ['student.html','學生／家長入口','r'],
  ]},
  {group:'🔧 資訊科技統籌（馮 Sir）', items:[
    ['subscriptions.html','訂閱管理','y'],
    ['usage-report.html','使用報告',''],
    ['eddata-console.html','供應商資料存取審批（EdData）','r'],
  ]},
  {group:'📋 校務處（何主任）', items:[
    ['roster.html','校務處控制台（教師名冊／任教編配／批量編班／學生編班）','y'],
  ]},
  {group:'🗂 校務紀錄組（曾主任）', items:[
    ['records-console.html','身份紀錄審批（2026-07-22 新增，取代誤植於 EdData 的同一職能）','r','recordsApproval'],
  ]},
  {group:'🏷 內容審核員（平台營運）', items:[
    ['tags.html','標籤審核與管理','r','contentModeration'],
  ]},
  {group:'🤝 供應商關係主任（方小姐 · 平台營運）', items:[
    ['vetting.html','供應商審核','y'],
  ]},
  {group:'🏢 供應商（智寫科技）', items:[
    ['vendor-portal.html','EdMarket 認證進度','y'],
    ['vendor-data-console.html','資料存取控制台（接收學校核准後的供應商資料）','r'],
  ]},
];
function init(){
  const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
  const pill=document.createElement('button');pill.className='dn-pill';pill.textContent='🧭 示範導覽';
  const panel=document.createElement('div');panel.className='dn-panel';
  const here=location.pathname.split('/').pop()||'index.html';
  // Filter by feature flag (typeof-guarded: pages that don't load feature-flags.js
  // for some reason just show everything, rather than throwing).
  const flagOn = k => (typeof featureOn === 'function') ? featureOn(k) : true;
  const visiblePages = PAGES.map(g=>({group:g.group, items:g.items.filter(([,,,flag])=>!flag || flagOn(flag))}))
    .filter(g=>g.items.length);
  panel.innerHTML = visiblePages.map(g=>'<h6>'+g.group+'</h6>'+g.items.map(([f,n,t])=>
    '<a href="'+f+'"'+(f===here?' class="here"':'')+'>'+n+(t?'<span class="tag '+t+'">'+(t==='y'?'🟡 提案中':'🔴 待決策')+'</span>':'')+'</a>'
  ).join('')).join('')
  + '<div class="legend">🟡 提案中＝設計方案，未建置　🔴 待決策＝尚待管治／領導層決定<br>正式產品不會顯示此導覽。</div>';
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
