/* EdCity prototype — shared usage & top-up modal.
   Injected into every page; opens from the profile button (bottom-left). */
(function(){

const CSS = `
.um-overlay{position:fixed;inset:0;background:rgba(20,30,40,.45);display:none;align-items:center;justify-content:center;z-index:100;}
.um-overlay.show{display:flex;}
.um-modal{
  background:#fff;border-radius:20px;width:min(880px,94vw);max-height:88vh;display:flex;overflow:hidden;
  box-shadow:0 28px 70px rgba(20,30,40,.3);position:relative;
  font-family:"Chiron GoRound TC","PingFang TC","Microsoft JhengHei","Noto Sans TC",-apple-system,"Segoe UI",sans-serif;color:var(--ink,#1e2a35);
}
.um-close{position:absolute;top:14px;right:16px;border:none;background:transparent;font-size:1.05rem;color:var(--ink-3,#8a97a3);cursor:pointer;padding:6px;z-index:2;}
.um-nav{width:200px;flex-shrink:0;background:#f7fafc;border-right:1px solid var(--line,#e6ebf0);padding:22px 12px;}
.um-nav h6{font-size:.66rem;font-weight:600;color:var(--ink-3,#8a97a3);letter-spacing:normal;padding:0 10px 10px;}
.um-nav button{
  display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:none;background:transparent;
  padding:9px 10px;border-radius:9px;font-size:.84rem;color:var(--ink-2,#55636f);cursor:pointer;font-family:inherit;margin-bottom:2px;
}
.um-nav button:hover{background:#eef3f7;}
.um-nav button.on{background:#e6f4fb;color:var(--ec-blue-dark,#0072ab);font-weight:600;}
.um-body{flex:1;overflow-y:auto;padding:28px 32px 30px;}
.um-body h2{font-size:1.05rem;font-weight:700;margin-bottom:2px;display:flex;align-items:center;gap:10px;}
.um-body h2 .plan{
  font-size:.62rem;font-weight:700;color:var(--ec-blue-dark,#0072ab);background:#e6f4fb;
  border-radius:99px;padding:3px 10px;letter-spacing:normal;
}
.um-sect{margin-top:26px;}
.um-sect h3{font-size:.92rem;font-weight:700;margin-bottom:14px;}
.um-row{display:flex;align-items:center;gap:16px;margin-bottom:18px;}
.um-row .lbl{width:190px;flex-shrink:0;}
.um-row .lbl b{font-size:.85rem;font-weight:600;display:block;}
.um-row .lbl small{font-size:.72rem;color:var(--ink-3,#8a97a3);}
.um-bar{flex:1;height:8px;border-radius:99px;background:#dcedf8;overflow:hidden;}
.um-bar i{display:block;height:100%;border-radius:99px;background:var(--ec-blue,#008BD1);transition:width .4s ease;}
.um-bar i.warn{background:var(--ec-amber,#F5A623);}
.um-pct{width:74px;text-align:right;font-size:.8rem;color:var(--ink-2,#55636f);flex-shrink:0;}
.um-updated{font-size:.72rem;color:var(--ink-3,#8a97a3);margin-top:4px;display:flex;align-items:center;gap:8px;}
.um-updated button{border:none;background:transparent;cursor:pointer;color:var(--ink-2,#55636f);font-size:.85rem;padding:2px;}
.um-hr{border:none;border-top:1px solid var(--line,#e6ebf0);margin:24px 0;}
.um-balance{
  display:flex;align-items:baseline;gap:10px;margin-bottom:10px;
}
.um-balance b{font-size:1.6rem;font-weight:800;}
.um-balance span{font-size:.78rem;color:var(--ink-3,#8a97a3);}
.um-note{font-size:.74rem;color:var(--ink-2,#55636f);line-height:1.6;margin-top:10px;
  background:#f7fafc;border:1px solid var(--line,#e6ebf0);border-radius:10px;padding:10px 14px;}
.um-topup{display:flex;flex-direction:column;gap:14px;margin-top:16px;}
.um-card{
  border:1px solid var(--line,#e6ebf0);border-radius:14px;padding:16px 18px;
  display:flex;align-items:center;gap:14px;flex-wrap:wrap;
}
.um-card .t{flex:1;min-width:200px;}
.um-card .t b{font-size:.85rem;font-weight:700;display:block;}
.um-card .t small{font-size:.73rem;color:var(--ink-3,#8a97a3);line-height:1.5;display:block;margin-top:3px;}
.um-btn{
  border:none;border-radius:10px;padding:10px 18px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;
  background:var(--ec-blue,#008BD1);color:#fff;flex-shrink:0;
}
.um-btn:hover{background:var(--ec-blue-dark,#0072ab);}
.um-btn.ghost{background:#fff;border:1px solid var(--line,#e6ebf0);color:var(--ink-2,#55636f);font-weight:600;}
.um-btn.ghost:hover{border-color:var(--ec-blue,#008BD1);color:var(--ec-blue-dark,#0072ab);}
.um-btn:disabled{background:#e6ebf0;color:#8a97a3;cursor:default;}
.um-redeem{display:flex;gap:8px;flex:1;min-width:240px;}
.um-redeem input{
  flex:1;border:1px solid var(--line,#e6ebf0);border-radius:10px;padding:9px 13px;font-size:.82rem;
  font-family:inherit;outline:none;text-transform:uppercase;letter-spacing:.06em;
}
.um-redeem input:focus{border-color:var(--ec-blue,#008BD1);}
.um-switch{width:38px;height:21px;border-radius:99px;background:#d6dee5;position:relative;cursor:pointer;flex-shrink:0;transition:background .15s;}
.um-switch::after{content:"";position:absolute;top:2.5px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.um-switch.on{background:var(--ec-green,#00AC6C);}
.um-switch.on::after{left:19px;}
.um-toast{
  position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:#1e2a35;color:#fff;
  font-size:.78rem;padding:9px 18px;border-radius:99px;opacity:0;pointer-events:none;transition:opacity .25s;z-index:200;
}
.um-toast.show{opacity:.94;}
.um-stub{padding:40px 0;text-align:center;color:var(--ink-3,#8a97a3);font-size:.84rem;}
.sidebar .user{cursor:pointer;}
.sidebar .user:hover{background:#f7fafc;}
`;

const HTML = `
<div class="um-modal" role="dialog" aria-label="用量與代幣">
  <button class="um-close" onclick="closeUsage()">✕</button>
  <nav class="um-nav">
    <h6>設定</h6>
    <button data-p="general" onclick="umPane(this)">⚙️ 一般</button>
    <button data-p="account" onclick="umPane(this)">👤 帳戶</button>
    <button class="on" data-p="usage" onclick="umPane(this)">📊 用量與代幣</button>
    <button data-p="school" onclick="umPane(this)">🏫 學校方案</button>
  </nav>
  <div class="um-body">
    <div id="um-pane-usage">
      <h2>方案用量 <span class="plan">學校方案 · 政府資助</span></h2>

      <div class="um-sect">
        <div class="um-row">
          <div class="lbl"><b>本節用量</b><small>由傳送首則訊息起計</small></div>
          <div class="um-bar"><i style="width:12%"></i></div>
          <div class="um-pct">12%</div>
        </div>
      </div>

      <div class="um-sect">
        <h3>每週限額</h3>
        <div class="um-row">
          <div class="lbl"><b>所有模型</b><small>7 小時 45 分鐘後重置</small></div>
          <div class="um-bar"><i style="width:58%"></i></div>
          <div class="um-pct">已用 58%</div>
        </div>
        <div class="um-row">
          <div class="lbl"><b>智能模型</b><small>7 小時 45 分鐘後重置</small></div>
          <div class="um-bar"><i style="width:42%"></i></div>
          <div class="um-pct">已用 42%</div>
        </div>
        <div class="um-updated">最後更新：少於 1 分鐘前 <button onclick="umToast('已重新整理用量數據')" aria-label="重新整理">⟳</button></div>
      </div>

      <hr class="um-hr">

      <div class="um-sect" style="margin-top:0">
        <h3>學習代幣</h3>
        <div class="um-balance"><b id="umTokens">12,500</b><span>／ <span id="umQuota">20,000</span> 代幣 · 8 月 1 日重置</span></div>
        <div class="um-row" style="margin-bottom:6px">
          <div class="um-bar"><i id="umTokenBar" style="width:62.5%"></i></div>
          <div class="um-pct" id="umTokenPct">餘 62%</div>
        </div>
        <div class="um-note">代幣由學校按政府資助計劃統一分配，<b>不設現金或信用卡增值</b>。用完可向學校申請增配，或以活動兌換碼補充。</div>

        <div class="um-topup">
          <div class="um-card">
            <div class="t"><b>向學校申請增配</b><small>申請將送交學校管理員審批，一般於一個工作天內處理。</small></div>
            <button class="um-btn" id="umReqBtn" onclick="umRequest()">送出申請</button>
          </div>
          <div class="um-card">
            <div class="t"><b>兌換碼</b><small>輸入教育城活動或工作坊派發的兌換碼以補充代幣。</small></div>
            <div class="um-redeem">
              <input id="umCode" placeholder="例如 EDCITY-2026" aria-label="兌換碼">
              <button class="um-btn ghost" onclick="umRedeem()">兌換</button>
            </div>
          </div>
          <div class="um-card">
            <div class="t"><b>自動增配</b><small>餘額低於 10% 時，自動向學校配額申請補充。</small></div>
            <div class="um-switch" id="umAuto" role="switch" aria-checked="false" onclick="umAutoToggle()"></div>
          </div>
        </div>
      </div>
    </div>
    <div id="um-pane-stub" style="display:none"><div class="um-stub">此分頁暫未有內容。</div></div>
  </div>
</div>`;

/* state */
let tokens = 12500;
const quota = 20000;
let requested = false;

function fmt(n){ return n.toLocaleString('en-US'); }

function refreshTokens(){
  document.getElementById('umTokens').textContent = fmt(tokens);
  const pct = Math.min(100, Math.round(tokens/quota*100));
  const bar = document.getElementById('umTokenBar');
  bar.style.width = pct + '%';
  bar.classList.toggle('warn', pct < 25);
  document.getElementById('umTokenPct').textContent = '餘 ' + pct + '%';
}

window.openUsage = function(){
  document.getElementById('umOverlay').classList.add('show');
};
window.closeUsage = function(){
  document.getElementById('umOverlay').classList.remove('show');
};
window.umPane = function(btn){
  document.querySelectorAll('.um-nav button').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const isUsage = btn.dataset.p === 'usage';
  document.getElementById('um-pane-usage').style.display = isUsage ? '' : 'none';
  document.getElementById('um-pane-stub').style.display = isUsage ? 'none' : '';
};
window.umRequest = function(){
  if(requested) return;
  requested = true;
  const b = document.getElementById('umReqBtn');
  b.innerHTML = '已送出申請 '+CHECK_SVG;
  b.disabled = true;
  umToast('增配申請已送交學校管理員');
};
window.umRedeem = function(){
  const inp = document.getElementById('umCode');
  const code = inp.value.trim();
  if(!code){ umToast('請輸入兌換碼'); return; }
  if(!/^[A-Za-z]+-?\w+$/.test(code)){ umToast('兌換碼格式不正確'); return; }
  tokens = Math.min(quota, tokens + 2000);
  refreshTokens();
  inp.value = '';
  umToast('兌換成功：已補充 2,000 代幣');
};
window.umAutoToggle = function(){
  const s = document.getElementById('umAuto');
  s.classList.toggle('on');
  s.setAttribute('aria-checked', s.classList.contains('on'));
  umToast(s.classList.contains('on') ? '已啟用自動增配' : '已停用自動增配');
};
let umToastTimer;
window.umToast = function(msg){
  const t = document.getElementById('umToast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(umToastTimer);
  umToastTimer = setTimeout(()=>t.classList.remove('show'), 1700);
};

/* inject */
function init(){
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'um-overlay';
  overlay.id = 'umOverlay';
  overlay.innerHTML = HTML;
  overlay.addEventListener('click', e=>{ if(e.target===overlay) closeUsage(); });
  document.body.appendChild(overlay);

  const toast = document.createElement('div');
  toast.className = 'um-toast'; toast.id = 'umToast';
  document.body.appendChild(toast);

  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeUsage(); });

  const user = document.querySelector('.sidebar .user');
  if(user){
    user.addEventListener('click', openUsage);
    user.setAttribute('title','用量與代幣');
  }
  refreshTokens();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
