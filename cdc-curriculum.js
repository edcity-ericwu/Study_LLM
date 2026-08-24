/* ── cdc-curriculum.js ───────────────────────────────────────────────────
 * The 中國語文 curriculum tree behind 中文科教案設計.
 *
 * ⚠ PROVENANCE — read before trusting anything in this file.
 *
 * The 範疇 names and the four-level shape are FROM THE OFFICIAL CURRICULUM:
 * the CDC 中國語文課程 has nine 學習範疇 — 閱讀、寫作、聆聽、說話、文學、
 * 中華文化、品德情意、思維、語文自學 (中國語文教育學習領域課程指引, 小一至
 * 中六, 2017; checked 2026-08-24).
 *
 * The individual 學習重點 below were TRANSCRIBED OFF SCREENSHOTS of the live
 * EdCity tool (Eric, 2026-08-24). Several chips were truncated in those
 * screenshots, so wording has been completed plausibly. This is a prototype
 * fixture, NOT the curriculum. Anything shown to EDB must be checked against
 * 建議學習重點:
 *   小學 https://www.edb.gov.hk/attachment/tc/curriculum-development/kla/chi-edu/curriculum-documents/Pri_Chin_Lang_LO_2023.pdf
 *   中學 https://www.edb.gov.hk/attachment/tc/curriculum-development/kla/chi-edu/SEC_LO_2021.pdf
 *
 * ── why the shape matters ───────────────────────────────────────────────
 * The live tool renders every 學習重點 as one flat chip carrying its full path:
 *   「閱讀範疇/閱讀能力/1b-理解語段」 + a duplicate sub-line underneath.
 * 49 of those stack to ~1,700px, and because the path is repeated on every
 * chip, the part that actually differs is the last few characters of a long
 * shared string — the hardest possible thing to scan.
 *
 * The path is real; showing it 49 times is not. So it is stored ONCE per
 * group here, and the leaves carry only what distinguishes them.
 *
 * 中華文化 is the sharpest case. Its nine near-identical chips are not nine
 * points at all — they are a 3×3 matrix of 取向 (認識 / 反思 / 認同) against
 * 文化面向 (物質 / 制度 / 精神). Nine chips that differ by two characters is a
 * matrix that has been flattened and lost its axes. It is stored as a matrix
 * and rendered as one, which is why that 範疇 needs no scrolling at all.
 *
 * ── the six unpopulated 範疇 ────────────────────────────────────────────
 * 寫作、聆聽、說話、文學、思維、語文自學 carry ready:false. They are SHOWN,
 * greyed and unclickable, on Eric's instruction (2026-08-24): the team walking
 * through the POC will not click them, and hiding them would misrepresent the
 * curriculum as having three 範疇.
 *
 * This is a deliberate exception to the standing rule against greyed-out
 * controls (Eric, 2026-07: "disabled buttons become noises which slow down or
 * confuse users"). The rule holds where a disabled control hides a capability
 * the product has. Here the greyed cards carry information nothing else on the
 * page can: the true scope of the curriculum this tool covers a third of.
 * Logged in the Decision Log so the exception is not read as the rule.
 */
(function(){
  'use strict';

  /* 學習階段 spans the whole 小一至中六 curriculum. 第一至第三 are 小一至小六
   * and 中一至中三; 第四 is 中四至中六. Named as the curriculum names them, with
   * the year range beside it — teachers think in 年級, the document thinks in
   * 階段, and the picker should not make her translate. */
  var STAGES = [
    {id:'ks1', name:'第一學習階段', years:'小一至小三'},
    {id:'ks2', name:'第二學習階段', years:'小四至小六'},
    {id:'ks3', name:'第三學習階段', years:'中一至中三'},
    {id:'ks4', name:'第四學習階段', years:'中四至中六'}
  ];

  /* ── 閱讀 ────────────────────────────────────────────────────────────
   * Groups follow the 閱讀能力 numbering visible in the screenshots
   * (1a / 1b / 1c / 1d / 2 / 3 / 4 / 5). The path 閱讀範疇 · 閱讀能力 is the
   * group's, not each leaf's. */
  var READING = [
    {code:'1a', name:'認識文字', path:'閱讀範疇 · 閱讀能力',
     items:[
       {id:'r1a1', t:'認識常用字', d:'認識課文中的常用字，能讀出字音。'},
       {id:'r1a2', t:'辨識字形、字音、字義', d:'分辨形近字、多音字，並按上下文判斷字義。'}
     ]},
    {code:'1b', name:'理解', path:'閱讀範疇 · 閱讀能力',
     items:[
       {id:'r1b1', t:'理解常見詞語', d:'理解學習材料中與生活相關的常見詞語。'},
       {id:'r1b2', t:'理解文言詞語', d:'理解閱讀材料中與現代漢語用法不同的文言詞語。'},
       {id:'r1b3', t:'理解句子的意思', d:'掌握句子的字面意思及言外之意。'},
       {id:'r1b4', t:'理解句子的銜接關係', d:'理解句子之間的承接、轉折與因果關係。'},
       {id:'r1b5', t:'理解段落', d:'掌握段落的中心句與支持細節。'},
       {id:'r1b6', t:'理解篇章', d:'理解作品內容大意、主旨、寓意，體會作者表達的思想感情。'},
       {id:'r1b7', t:'辨識不同的表達方法', d:'辨識不同的表達方法，如記敘、抒情、說明、議論。'}
     ]},
    {code:'1c', name:'分析和綜合', path:'閱讀範疇 · 閱讀能力',
     items:[
       {id:'r1c1', t:'分析、綜合內容', d:'概括段落及篇章的重點，作出總結，分辨事實與意見。'},
       {id:'r1c2', t:'分析組織結構', d:'分析篇章的組織與行文脈絡。'}
     ]},
    {code:'1d', name:'評價', path:'閱讀範疇 · 閱讀能力',
     items:[
       {id:'r1d1', t:'評價內容', d:'就作品的內容和人物的行為提出看法，並說明理由。'}
     ]},
    {code:'2', name:'探究和創新', path:'閱讀範疇 · 閱讀能力',
     items:[
       {id:'r21', t:'推斷文本以外的內容', d:'在理解的基礎上，推斷閱讀材料以外的意涵和延伸意義。'},
       {id:'r22', t:'產生新的意念', d:'通過聯想和想像，就閱讀材料產生新的意念。'}
     ]},
    {code:'3', name:'欣賞', path:'閱讀範疇 · 閱讀能力',
     items:[
       {id:'r31', t:'欣賞優秀的語言', d:'欣賞作品中優美的描寫、節奏與生動的形象。'}
     ]},
    {code:'4', name:'掌握視聽資訊', path:'閱讀範疇 · 閱讀能力',
     items:[
       {id:'r41', t:'理解音像材料', d:'理解音像材料（如立體圖、資訊視像、電視節目）所傳遞的信息。'}
     ]}
  ];

  /* ── 品德情意 ─────────────────────────────────────────────────────────
   * The curriculum organises this by the circle of relationship the value sits
   * in — self, those close to you, then society. Kept in that order because it
   * is an order, not a list. */
  var VALUES = [
    {code:'個人', name:'個人', path:'品德情意範疇',
     items:[
       {id:'v11', t:'自我肯定', d:'愛惜生命、知恥、自重、不苟且。'},
       {id:'v12', t:'自我節制', d:'不沉溺物慾，情緒有節。'},
       {id:'v13', t:'實事求是', d:'求真求實，重視證據，勇於探索。'},
       {id:'v14', t:'認真負責', d:'言而有信，不推卸責任，知所補過。'},
       {id:'v15', t:'勤奮堅毅', d:'努力不懈，遇挫折不輕言放棄。'},
       {id:'v16', t:'謙遜有禮', d:'謙心自省，尊重他人。'},
       {id:'v17', t:'知所進退', d:'取捨有度，能辨可為與不可為。'}
     ]},
    {code:'親屬', name:'親屬 · 師友', path:'品德情意範疇',
     items:[
       {id:'v21', t:'孝親尊師', d:'了解親恩師恩，並以行動回應。'},
       {id:'v22', t:'寬大包容', d:'體察他人處境，設身處地為人着想。'},
       {id:'v23', t:'重視信諾', d:'珍惜友誼，言出必行。'}
     ]},
    {code:'群體', name:'群體 · 國家 · 世界', path:'品德情意範疇',
     items:[
       {id:'v31', t:'心繫祖國', d:'認識國家的歷史文化，培養對國家的感情。'},
       {id:'v32', t:'勇於承擔', d:'關心社群，樂於服務，願意承擔責任。'},
       {id:'v33', t:'公正廉潔', d:'重視公平公正，不徇私。'},
       {id:'v34', t:'和平共處', d:'尊重不同文化，願意溝通合作。'},
       {id:'v35', t:'愛護環境', d:'珍惜資源，尊重生命，愛護自然。'}
     ]}
  ];

  /* ── 中華文化 ─────────────────────────────────────────────────────────
   * A matrix, not a list. 取向 × 面向 = the nine chips the live tool shows
   * flattened. Each cell is one 學習重點; the id is composed so a cell is
   * addressable the same way a chip is. */
  var CULTURE_MODES = [
    {id:'know',    t:'認識',  d:'增進對中華文化的認識，提高學習語文的興趣和能力。'},
    {id:'reflect', t:'反思',  d:'對中華文化的內涵作出反思，了解其在現代世界的意義。'},
    {id:'affirm',  t:'認同',  d:'認同優秀的中華文化，培養對國家民族的感情。'}
  ];
  var CULTURE_FACETS = [
    {id:'material',  t:'物質文化', d:'器物、飲食、建築、工藝。'},
    {id:'system',    t:'制度文化', d:'禮俗、節慶、社會規範。'},
    {id:'spirit',    t:'精神文化', d:'思想、價值觀、文學藝術。'}
  ];

  var DOMAINS = [
    {id:'reading', name:'閱讀', icon:'📖', ready:true, kind:'groups',
     desc:'認識文字、理解、分析、評價與欣賞。', groups:READING},

    {id:'culture', name:'中華文化', icon:'🏮', ready:true, kind:'matrix',
     desc:'認識、反思、認同中華文化的三個面向。',
     modes:CULTURE_MODES, facets:CULTURE_FACETS},

    {id:'values', name:'品德情意', icon:'🌱', ready:true, kind:'groups',
     desc:'由個人推及親屬師友，再及群體與國家。', groups:VALUES},

    /* Shown but not clickable — see the header note. `why` is what the card
     * says instead of a bare 「稍後推出」, because a teacher who came looking
     * for 寫作 deserves to know it exists in the curriculum and not here. */
    {id:'writing',   name:'寫作',     icon:'✍️', ready:false, why:'本示範未載入'},
    {id:'listening', name:'聆聽',     icon:'👂', ready:false, why:'本示範未載入'},
    {id:'speaking',  name:'說話',     icon:'🗣',  ready:false, why:'本示範未載入'},
    {id:'literary',  name:'文學',     icon:'📜', ready:false, why:'本示範未載入'},
    {id:'thinking',  name:'思維',     icon:'💭', ready:false, why:'本示範未載入'},
    {id:'selflearn', name:'語文自學', icon:'🔎', ready:false, why:'本示範未載入'}
  ];

  /* ── lookup ──────────────────────────────────────────────────────────
   * Every selected point is stored as an id, so the 教案 and the summary read
   * from one place. A flat index is built once rather than searched each time,
   * because the summary re-renders on every click. */
  var INDEX = {};
  DOMAINS.forEach(function(dm){
    if(dm.kind === 'groups'){
      dm.groups.forEach(function(g){
        g.items.forEach(function(it){
          INDEX[it.id] = {id:it.id, title:it.t, desc:it.d,
                          domain:dm.name, group:g.name, code:g.code, path:g.path};
        });
      });
    } else if(dm.kind === 'matrix'){
      dm.modes.forEach(function(m){
        dm.facets.forEach(function(f){
          var id = 'c-' + m.id + '-' + f.id;
          INDEX[id] = {id:id, title:m.t + f.t, desc:m.d + '（' + f.d + '）',
                       domain:dm.name, group:f.t, code:m.t, path:'中華文化範疇'};
        });
      });
    }
  });

  window.CDC = {
    STAGES: STAGES,
    DOMAINS: DOMAINS,
    get: function(id){ return INDEX[id] || null; },
    domain: function(id){
      var found = null;
      DOMAINS.forEach(function(d){ if(d.id === id) found = d; });
      return found;
    },
    /* How many points a 範疇 actually holds — the card says so, so she can
     * tell a large 範疇 from a small one before opening it. */
    count: function(dm){
      if(dm.kind === 'groups') return dm.groups.reduce(function(a,g){ return a + g.items.length; }, 0);
      if(dm.kind === 'matrix') return dm.modes.length * dm.facets.length;
      return 0;
    }
  };
})();
