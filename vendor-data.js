/* vendor-data.js
 * Single source of truth for vendor data-access grants and pending requests.
 * Loaded by eddata-console.html (tier-approval workflow), subscriptions.html
 * (seat-capacity view), groups.html, trial-invites.html,
 * and vendor-portal.html, so all these pages can never show different headcounts or
 * membership for the same class/group — this was a recurring bug in earlier
 * iterations of this prototype, where each file kept its own hand-typed copy of
 * the same numbers.
 *
 * grants  = access already approved (counts toward seat consumption)
 *
 * eligible[] / released[] are legacy seed fields, no longer read (2026-08-18).
 * Kept on the seed grants only so older saved DemoState doesn't break. Was:
 * eligible = the students a grant covers, frozen when it was approved. Stored as
 * sids, not names, and stored ON the grant rather than derived from CLASSES at
 * render time — the whole point is that it does NOT move when the teacher's
 * assignment changes mid-year. memberSnapshot is the subset actually released
 * right now; eligible is what she may draw from without going back for approval.
 * Only memberSnapshot ever reaches a vendor.
 *
 * seatsUsed is separate from headcount because seats are named-annual: a student
 * removed from a group frees the slot in memberSnapshot but not the seat, so the
 * two numbers legitimately diverge as the year goes on.
 * pending = requests awaiting a decision (do NOT count toward consumption until approved)
 * headcount is a plain number on every grant/pending entry, kept alongside the
 * human-readable group label, so consumption can be summed exactly instead of
 * parsed out of Chinese text like "（3 人）".
 */
/* Shared teaching-class/group roster. A teacher can teach more than one class
 * (same subject, per Eric's 2026-07-21 scoping call — multi-subject is a later
 * phase, not modeled here). CLASSES is keyed by classId (matching the ids
 * insights.html already uses: '2b' and '1c'), each with its own groups + students —
 * pedagogical groupings are per-class, not shared, since a reading-ability grouping
 * for one class has no reason to match another class's.
 * Every grant/pending/trial entry now carries BOTH classId and groupId, since
 * groupId alone ('stretch'/'core'/'support') is not a stable identity once more
 * than one class exists — 中二乙班's 核心組 and 中一丙班's 核心組 are different
 * students. Group scope in a grant/request is still a snapshot (memberSnapshot,
 * taken when the request was made), not a live-synced number — Eric's call: access
 * shouldn't silently change just because membership did. But we still need ONE
 * ground truth to detect that drift against, which is why the roster lives here
 * rather than staying local to groups.html. */
/* form/formLabel added 2026-07-22 for the School Accounts Administration System bulk-assignment rescope — lets
 * roster.html group/navigate classes by form (中一/中二/…) instead of a flat
 * list, which stops mattering once a school has more than a couple of classes.
 * Existing pages (groups.html, insights.html, trial-invites.html, etc.) only
 * ever read className/subjectLabel/groups/students off CLASS_LIST entries, so
 * adding these fields doesn't touch anything else — verified via grep before
 * making this change. */
/* teacherId added 2026-07-27: which teacher actually teaches this class was
 * previously only encoded as free text inside subjectLabel (e.g. "黃穎詩老師任教")
 * — fine for display, useless for filtering. Pages with a class switcher
 * (groups.html, and potentially others sharing the same CLASS_LIST-driven
 * dropdown) need a real field to filter "classes I teach" from "every class
 * that exists", the same gap just fixed in groups.html's
 * "我的請求" for vendor requests. Matches roster.html's own ASSIGNMENTS array
 * (a1/a2: 陳凱怡→2b/1c, a3: 黃穎詩→1a) — kept in sync by hand since ASSIGNMENTS
 * carries extra fields (subjectId, year) this doesn't need. */
const CLASSES = {
  '2b': {
    className:'中二乙班', subjectLabel:'中文 · 任教中', form:'S2', formLabel:'中二', teacherId:'T1001',
    groups:[
      {id:'stretch', name:'增潤組', color:'var(--ec-purple)', goal:'進度較快，適合延伸閱讀與較深的寫作任務'},
      {id:'core', name:'核心組', color:'var(--ec-blue)', goal:'跟隨主進度，做標準課業與練習'},
      {id:'support', name:'支援組', color:'var(--ec-green)', goal:'需要多些時間，由你親自帶領'},
    ],
    /* sid = eddataId, added 2026-07-22: 批量編班's ambiguous-name problem exists
     * BECAUSE name is the only identity signal available — a real SIS would match
     * on a stable student ID first, falling back to name only when one isn't
     * given. Assigning every seed student an sid here makes that precedence
     * demonstrable, not just theoretical. */
    students:[
      {n:'王思穎', sid:'S2001', no:1, g:'stretch'},{n:'林一心', sid:'S2002', no:13, g:'stretch'},{n:'徐朗', sid:'S2003', no:23, g:'stretch'},{n:'陳嘉欣', sid:'S2004', no:30, g:'core'},{n:'何梓晴', sid:'S2005', no:4, g:'core'},{n:'黃俊傑', sid:'S2006', no:31, g:'core'},{n:'吳詠芝', sid:'S2007', no:7, g:'core'},{n:'周天恩', sid:'S2008', no:12, g:'core'},{n:'李俊希', sid:'S2009', no:8, g:'support'},{n:'鄭家朗', sid:'S2010', no:34, g:'support'},{n:'簡愛琳', sid:'S2011', no:35, g:'core', left:true},{n:'邵浩霖', sid:'S3001', no:15, g:'stretch'},{n:'梁俊熙', sid:'S3002', no:28, g:'stretch'},{n:'邵嘉俐', sid:'S3003', no:16, g:'stretch'},{n:'柯子傲', sid:'S3004', no:19, g:'stretch'},{n:'楊子誠', sid:'S3005', no:32, g:'stretch'},{n:'阮子健', sid:'S3006', no:11, g:'stretch'},{n:'徐浩霖', sid:'S3007', no:24, g:'core'},{n:'何浩然', sid:'S3008', no:3, g:'core'},{n:'施文昊', sid:'S3009', no:17, g:'core'},{n:'梅子頌', sid:'S3010', no:29, g:'core'},{n:'石詠芝', sid:'S3011', no:2, g:'core'},{n:'高梓晴', sid:'S3012', no:27, g:'core'},{n:'柯家朗', sid:'S3013', no:20, g:'core'},{n:'沈子悅', sid:'S3014', no:9, g:'core'},{n:'潘詩妍', sid:'S3015', no:33, g:'core'},{n:'馬雅雯', sid:'S3016', no:25, g:'core'},{n:'余俊賢', sid:'S3017', no:6, g:'core'},{n:'徐俊熙', sid:'S3018', no:22, g:'core'},{n:'馬愛琳', sid:'S3019', no:26, g:'core'},{n:'林子悅', sid:'S3020', no:14, g:'core'},{n:'何嘉睿', sid:'S3021', no:5, g:'support'},{n:'沈詩妍', sid:'S3022', no:10, g:'support'},{n:'施詠芝', sid:'S3023', no:18, g:'support'},{n:'范俊希', sid:'S3024', no:21, g:'support'},
    ],
  },
  /* Thin/sparse on purpose (per insights.html's existing "本學期剛接手" story) — only
   * 2 groups exist so far, not 3, and the roster is small. This is a real second
   * dataset, not a cosmetic label swap, so switching classes actually changes what
   * every 課堂管理 page shows. */
  '1c': {
    className:'中一丙班', subjectLabel:'中文 · 本學期剛接手', form:'S1', formLabel:'中一', teacherId:'T1001',
    groups:[
      {id:'core', name:'核心組', color:'var(--ec-blue)', goal:'跟隨主進度，做標準課業與練習'},
      {id:'support', name:'支援組', color:'var(--ec-green)', goal:'剛接手，仍在觀察哪些學生需要較多支援'},
    ],
    students:[
      {n:'馬顯宗', sid:'S2012', no:15, g:'core'},{n:'蘇文樂', sid:'S2013', no:35, g:'core'},{n:'鄧凱兒', sid:'S2014', no:30, g:'core'},{n:'黎子軒', sid:'S2015', no:33, g:'core'},{n:'方雅晴', sid:'S2016', no:2, g:'support'},{n:'温家豪', sid:'S2017', no:24, g:'support'},{n:'鄭雅涵', sid:'S3025', no:32, g:'core'},{n:'梅子軒', sid:'S3026', no:20, g:'core'},{n:'曾詩喬', sid:'S3027', no:23, g:'core'},{n:'區思穎', sid:'S3028', no:18, g:'core'},{n:'李家朗', sid:'S3029', no:5, g:'core'},{n:'柯一心', sid:'S3030', no:10, g:'core'},{n:'岑雅涵', sid:'S3031', no:4, g:'core'},{n:'高思穎', sid:'S3032', no:16, g:'core'},{n:'阮家豪', sid:'S3033', no:6, g:'core'},{n:'徐俊賢', sid:'S3034', no:13, g:'core'},{n:'龍雅晴', sid:'S3035', no:34, g:'core'},{n:'蔡浩恩', sid:'S3036', no:28, g:'core'},{n:'區愛琳', sid:'S3037', no:19, g:'core'},{n:'梅俊皓', sid:'S3038', no:21, g:'core'},{n:'楊嘉俐', sid:'S3039', no:27, g:'core'},{n:'馬子文', sid:'S3040', no:14, g:'core'},{n:'邱浩澤', sid:'S3041', no:8, g:'core'},{n:'范子悅', sid:'S3042', no:12, g:'core'},{n:'邱浩騫', sid:'S3043', no:9, g:'core'},{n:'尹俊皓', sid:'S3044', no:1, g:'core'},{n:'陳子澄', sid:'S3045', no:22, g:'core'},{n:'鄧浩霖', sid:'S3046', no:29, g:'core'},{n:'黃嘉諾', sid:'S3047', no:25, g:'support'},{n:'洪浩霖', sid:'S3048', no:11, g:'support'},{n:'高詩慈', sid:'S3049', no:17, g:'support'},{n:'何嘉泳', sid:'S3050', no:3, g:'support'},{n:'鄭俊希', sid:'S3051', no:31, g:'support'},{n:'楊詩珩', sid:'S3052', no:26, g:'support'},{n:'林俊傑', sid:'S3053', no:7, g:'support'},
    ],
  },
  /* Materializes 中一甲班/黃老師 — previously only referenced by name in a
   * classId:null vendor grant and in 任教編配's a3 row, never an actual class.
   * Giving Form 1 a second class is also what makes 批量編班's form-then-class
   * navigation demonstrate something real instead of a single-class no-op. */
  '1a': {
    className:'中一甲班', subjectLabel:'中文 · 黃穎詩老師任教', form:'S1', formLabel:'中一', teacherId:'T1002',
    groups:[
      {id:'core', name:'核心組', color:'var(--ec-blue)', goal:'跟隨主進度，做標準課業與練習'},
      {id:'support', name:'支援組', color:'var(--ec-green)', goal:'需要多些時間，由黃穎詩老師親自帶領'},
    ],
    /* Deliberate homonym with 2b's 陳嘉欣 — gives 批量編班's ambiguous-name
     * resolution a genuine case to demonstrate against, instead of a contrived
     * one: two real, differently-enrolled students sharing a name is exactly
     * the scenario that makes name-only matching unsafe at bulk-import scale.
     * Different sid (S2021 vs 2b's S2004) — same name, different student. */
    students:[
      {n:'袁子軒', sid:'S2018', no:15, g:'core'},{n:'區凱琳', sid:'S2019', no:18, g:'core'},{n:'譚文昊', sid:'S2020', no:34, g:'core'},{n:'陳嘉欣', sid:'S2021', no:23, g:'core'},{n:'柯天佑', sid:'S2022', no:11, g:'core'},{n:'尹曉彤', sid:'S2023', no:4, g:'support'},{n:'費俊安', sid:'S2024', no:24, g:'support'},{n:'梁子瑤', sid:'S3054', no:19, g:'core'},{n:'吳嘉樂', sid:'S3055', no:6, g:'core'},{n:'鄭嘉睿', sid:'S3056', no:32, g:'core'},{n:'袁子文', sid:'S3057', no:14, g:'core'},{n:'黃雅晴', sid:'S3058', no:25, g:'core'},{n:'潘雅雯', sid:'S3059', no:27, g:'core'},{n:'孔子傲', sid:'S3060', no:5, g:'core'},{n:'潘曉希', sid:'S3061', no:28, g:'core'},{n:'蔡天佑', sid:'S3062', no:29, g:'core'},{n:'沈子謙', sid:'S3063', no:7, g:'core'},{n:'袁嘉諾', sid:'S3064', no:17, g:'core'},{n:'許俊皓', sid:'S3065', no:22, g:'core'},{n:'鄭文昊', sid:'S3066', no:31, g:'core'},{n:'柯浩澤', sid:'S3067', no:12, g:'core'},{n:'譚詩慧', sid:'S3068', no:35, g:'core'},{n:'尹嘉諾', sid:'S3069', no:3, g:'core'},{n:'梁嘉怡', sid:'S3070', no:20, g:'core'},{n:'徐浩賢', sid:'S3071', no:13, g:'core'},{n:'董浩澤', sid:'S3072', no:26, g:'core'},{n:'譚子傲', sid:'S3073', no:33, g:'core'},{n:'周嘉朗', sid:'S3074', no:9, g:'core'},{n:'許天恩', sid:'S3075', no:21, g:'support'},{n:'邵詩珩', sid:'S3076', no:10, g:'support'},{n:'尹浩軒', sid:'S3077', no:2, g:'support'},{n:'阮俊賢', sid:'S3078', no:8, g:'support'},{n:'尹子謹', sid:'S3079', no:1, g:'support'},{n:'袁詠芝', sid:'S3080', no:16, g:'support'},{n:'蔡嘉怡', sid:'S3081', no:30, g:'support'},
    ],
  },
};
const CLASS_LIST = Object.keys(CLASSES).map(id=>({id, ...CLASSES[id]}));

/* The demo clock.
 *
 * Several things in this design are promises about dates — a trial ends, 待預算
 * lapses on 31 August, sign-in stops authorising — and none of them could be
 * shown, because nothing moved. The screens said 「到期日一過，單一登入即停止
 * 授權」 and then the date never arrived. A promise on screen is not a
 * behaviour, and "release precedes payment but is bounded and dated" is exactly
 * the claim a school or a regulator would want to see enacted rather than
 * asserted.
 *
 * Shared across pages like any other state, so advancing it on one screen is
 * visible on the next. */
const DEFAULT_TODAY = '2026-08-18';
function TODAY(){
  if(typeof DemoState === 'undefined') return DEFAULT_TODAY;
  return DemoState.get('today', DEFAULT_TODAY);
}
function setToday(d){
  if(typeof DemoState !== 'undefined') DemoState.set('today', d);
}
function isPast(dateStr){ return !!dateStr && dateStr < TODAY(); }
/* Everything that expires, in one place, so no screen has to reimplement the
 * rule. Returns what lapsed, so a page can report it rather than silently
 * changing under the user. */
function applyExpiries(){
  const lapsed = [];
  (typeof BUDGET_PENDING !== 'undefined' ? BUDGET_PENDING : []).slice().forEach(b=>{
    if(isPast(b.endsOn)){
      const i = BUDGET_PENDING.indexOf(b);
      if(i>=0) BUDGET_PENDING.splice(i,1);
      lapsed.push({kind:'budget', label:`${b.vendorName} · ${b.group}`, on:b.endsOn});
    }
  });
  if(typeof VENDORS !== 'undefined') VENDORS.forEach(v=>{
    (v.grants||[]).slice().forEach(g=>{
      if(isPast(g.expiresOn)){
        v.grants.splice(v.grants.indexOf(g),1);
        lapsed.push({kind:'grant', label:`${v.name} · ${g.group}`, on:g.expiresOn});
      }
    });
  });
  if(typeof TRIALS !== 'undefined') TRIALS.forEach(t=>{
    if(t.status==='active' && isPast(t.expiresAt)){
      /* A trial that runs out does not vanish — it becomes the school's
       * decision to make, which is what 待預算 is for. */
      if(typeof toBudgetPending === 'function') toBudgetPending(t);
      lapsed.push({kind:'trial', label:`${t.vendor} · ${t.group}`, on:t.expiresAt});
    }
  });
  return lapsed;
}

/* Sequential ID generator for students created via 批量編班's intake path —
 * simulates what the school's identity layer (School Accounts Administration System, via 曾主任's approval) would
 * assign in reality. Starts past every seed sid above so nothing collides. */
let STUDENT_SEQ = 2100;
function nextStudentId(){ return 'S' + (STUDENT_SEQ++); }

/* Identity-record requests — added 2026-07-22 to fix a real layering mistake:
 * creating a brand-new student's identity (name + ID) or changing a teacher's
 * actual employment status are identity-layer actions, not School Accounts Administration System-organizational
 * ones. School Accounts Administration System (roster.html) can only REQUEST these; a distinct actor approves and
 * executes them — the same request/execute split already used for vendor
 * data-access grants.
 *
 * CORRECTED 2026-07-22, same day, second pass: this was originally attributed
 * to EdData (eddata-console.html, 馮 Sir). Real EdData/Account Admin product
 * screens showed real EdData has no identity-approval function at all — it's
 * vendor data-access governance only. This authority is now confirmed as
 * belonging to a distinct new actor, 曾主任 (Ms. Tsang, School Records Officer,
 * records-console.html) — modeled separately on purpose, so a later decision to
 * fold her into an existing role doesn't require re-deriving the scope. Seeded
 * with one pending example each so records-console.html has real content on a
 * fresh load, same convention as VENDORS/TRIALS above.
 *
 * Earlier correction (2026-07-22, first pass, same day): approving an intake
 * request used to ALSO push the new student straight into whatever class
 * 何主任 named in her original request — meaning the approval click was doing
 * School Accounts Administration System's organizational job (class assignment) in the same step as the identity
 * job. That re-created, one layer down, exactly the conflation the
 * request/execute split was built to remove. `suggestedClassId` (renamed from
 * `targetClassId`) is now only context for 曾主任 — non-binding. Approval
 * creates the student in UNASSIGNED_STUDENTS below; assigning them to an actual
 * class is a separate, later School Accounts Administration System action, using the same class-assignment
 * mechanism 學生編班 already has for everyone else. */
const STUDENT_INTAKE_REQUESTS = [
  {id:'sir0', name:'黎曉盈', suggestedClassId:'1a', hkid:'4471', contact:'9821 3345', sen:'', requestedBy:'何主任', status:'pending'},
];
const TEACHER_STATUS_REQUESTS = [
  {id:'tsr0', teacherId:'T1003', newStatus:'departed', requestedBy:'何主任', status:'pending'},
];

/* Students whose identity 曾主任 has approved/created, but who have not yet
 * been organized into a class — the landing spot for a freshly-approved intake
 * request. 學生編班 (roster.html) surfaces this list at the top of its table
 * with its own "編班" action, reusing the exact same class-assignment code path
 * used for ordinary reassignment, so a new student isn't a special case once
 * they reach this list — they're just a student waiting for the one
 * School Accounts Administration System-organizational step that was never the identity layer's to do. Seeded
 * with one example so 學生編班 has real content to demonstrate this on a fresh
 * load, without first needing a live approve action on records-console.html
 * (a separate page session anyway). */
const UNASSIGNED_STUDENTS = [
  {n:'黃梓恩', sid:'S2101'},
];

/* Canonical subject list — School Accounts Administration System's job, same reasoning as CLASSES/TEACHERS: without
 * this, 教師名冊's "部門" and 任教編配's "科目" were two separate hardcoded strings
 * that happened to agree by coincidence ("中文科"), not because they shared a
 * source. Same drift-risk pattern this suite has already been bitten by twice
 * before (headcounts, then class rosters) — smaller in scope, same fix: one list,
 * everything else references it by id. */
const SUBJECTS = [
  {id:'chi', name:'中文科'},
  {id:'ls', name:'通識科'},
  /* Added 2026-07-27 alongside the staff roster scale-up (see TEACHERS below) —
   * a realistic HK secondary school runs a full subject panel structure, not
   * just the two subjects this prototype's core storylines happen to touch. */
  {id:'eng', name:'英文科'},
  {id:'math', name:'數學科'},
  {id:'sci', name:'科學科'},
  {id:'hist', name:'歷史科'},
  {id:'geo', name:'地理科'},
  {id:'econ', name:'經濟科'},
  {id:'bafs', name:'企業會計財務概論科'},
  {id:'ict', name:'資訊及通訊科技科'},
  {id:'art', name:'視覺藝術科'},
  {id:'music', name:'音樂科'},
  {id:'pe', name:'體育科'},
  {id:'putonghua', name:'普通話科'},
  {id:'re', name:'宗教及倫理科'},
];
function subjectName(id){ const s = SUBJECTS.find(x=>x.id===id); return s ? s.name : id; }

/* Shared skill-tag taxonomy (Story 6 · 內容審核／共用分類). marking.html's own
 * copy already claimed tags "採用平台共用分類" before this existed as real
 * data — it was a stub "+" button with no actual list behind it, so nothing
 * stopped a teacher from inventing her own tag name. This is what makes that
 * claim true: one fixed, approved list, referenced by name so every page reads
 * the exact same set instead of each page (marking.html, tags.html,
 * insights.html, student.html) keeping its own copy that can drift.
 *
 * This is also the specific missing piece insights.html's and tags.html's
 * ribbons point at ("依賴共用分類法（尚未存在）") — a unified view of student
 * capability across classes/subjects, or across a student's own subjects, is
 * only possible if the tags feeding it come from one shared vocabulary, not
 * whatever each teacher (or each page) happened to type in.
 *
 * `domain` is the curriculum-area grouping already used in insights.html's
 * and student.html's display ("閱讀理解 · 推論", "寫作 · 段落結構") — kept as
 * real metadata here rather than baked into the display string in 4 places,
 * so a domain rename is one edit instead of a find-and-replace across pages.
 * Reconciled 2026-07-28: before this, marking.html/insights.html/tags.html/
 * student.html each used a DIFFERENT name for the same dimension (e.g.
 * "主旨理解" vs "主旨"; "段落結構"／"論證組織" vs "結構組織"; tags.html's
 * "詞義理解" and insights/student's "文言字詞" didn't exist in this list at
 * all) — the exact drift bug this taxonomy exists to prevent, just not
 * caught yet because nothing referenced it consistently. */
const SKILL_TAGS = [
  {name:'推論', domain:'閱讀理解'},
  {name:'主旨理解', domain:'閱讀理解'},
  {name:'文意理解', domain:'閱讀理解'},
  {name:'引例支持', domain:'閱讀理解'},
  {name:'寫作手法', domain:'寫作'},
  {name:'段落結構', domain:'寫作'},
  {name:'論證組織', domain:'寫作'},
  {name:'詞彙運用', domain:'語文基礎'},
];
function skillDomain(name){ const s = SKILL_TAGS.find(x=>x.name===name); return s ? s.domain : ''; }

/* Teacher identity/employment record — School Accounts Administration System's job, same reasoning as CLASSES: the
 * status/subject/contact facts here are what everything downstream (任教編配's
 * reassignment picker, vendor invites, tool requests) should be trusting, rather
 * than each teacher-tier page silently assuming every named teacher is still
 * active. Mutate objects' fields in place (never reassign the TEACHERS array
 * itself) — same gotcha as CLASS_LIST, since other code may hold a reference. */
/* `roles` added 2026-07-22 (Story 3, wave-one build): fixes the real gap named
 * in EdCity_School Accounts Administration System_Consolidation_Stories.md Story 3 — the real Account Admin
 * system only has one effective tier ("School Administrator"), so 李主任
 * (subject panel head) can't get subject-wide visibility without either being
 * handed full admin rights or being locked out entirely. Each teacher can now
 * hold zero or more of ROLE_DEFS below, defaulting to just classroom_teacher.
 * A person's TEACHERS entry and their role set are deliberately the same
 * record — a "role" is a property of an existing identity, not a separate
 * account type, so this doesn't reopen the identity/organization conflation
 * fixed earlier this session. */
/* Full name + teacherId added 2026-07-27, per Eric: surname+title (陳老師/黃老師/
 * 李老師/李主任/...) was being used as the de facto identity key everywhere
 * (assignments, study groups, vendor grants/pending, trials) — and Chinese
 * surnames collide easily (李老師 vs 李主任 are BOTH surname 李, distinguishable
 * only by title, which breaks down the moment two people share both surname
 * AND role). This is the same fix already applied to students (sid, added
 * 2026-07-22) — `id` is the stable join key everywhere a teacher is
 * referenced; `name` is now a real given name, not surname+title, so it reads
 * unambiguously in prose without needing the id alongside it. teacherLabel()
 * additionally appends the id for admin contexts (教師名冊, 任教編配) where a
 * defendable identifier matters more than natural phrasing. */
const TEACHERS = [
  {id:'T1001', name:'陳凱怡', subjectId:'chi', contact:'chan.teacher@school.edu.hk', status:'active', roles:['classroom_teacher']},
  {id:'T1002', name:'黃穎詩', subjectId:'chi', contact:'wong.teacher@school.edu.hk', status:'active', roles:['classroom_teacher']},
  {id:'T1003', name:'李慧敏', subjectId:'chi', contact:'li.teacher@school.edu.hk', status:'leave', roles:['classroom_teacher']},
  {id:'T1004', name:'馬啟賢', subjectId:'ls', contact:'ma.teacher@school.edu.hk', status:'departed', roles:['classroom_teacher']},
  /* 李主任 previously existed only as a static, unmanaged persona in dept.html's
   * topbar — never an actual roster entry, so there was nowhere to demonstrate
   * that his subject-wide visibility could be a scoped role rather than full
   * admin. Added here so the fix has a real record to point at. Deliberately
   * shares a surname with T1003 (李慧敏) — this is the exact collision case
   * the id/full-name fix above exists to resolve, not an oversight. */
  {id:'T1005', name:'李天佑', subjectId:'chi', contact:'lee.panelhead@school.edu.hk', status:'active', roles:['classroom_teacher','subject_panel_head']},
  /* New example teacher so sen_coordinator has a concrete holder to demonstrate
   * against too, not just a role that exists in name only. */
  {id:'T1006', name:'梁凱晴', subjectId:'ls', contact:'leung.teacher@school.edu.hk', status:'active', roles:['classroom_teacher','sen_coordinator']},
  /* Bulk roster fill added 2026-07-27, per Eric: "reflect a real school", not
   * "wire every teacher into the demo". These 49 exist so 教師名冊/角色與權限 show
   * a realistic HK secondary school's full scale (~55 teaching staff across a
   * full subject panel structure, per EDB staff-establishment norms for a
   * ~24-class school) — NONE of them are referenced by ASSIGNMENTS, VENDORS,
   * TRIALS, or STUDY_GROUPS; the original T1001–T1006 remain the only teachers
   * with a real story elsewhere in the prototype. contact is left blank
   * (not needed for any flow). */
  {id:'T1007', name:'石曉希', subjectId:'eng', contact:'', status:'active', roles:['classroom_teacher','subject_panel_head']},
  {id:'T1008', name:'鄧啟賢', subjectId:'eng', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1009', name:'羅子軒', subjectId:'eng', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1010', name:'溫俊熙', subjectId:'eng', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1011', name:'沈家豪', subjectId:'eng', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1012', name:'施嘉諾', subjectId:'eng', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1013', name:'蔡俊賢', subjectId:'eng', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1014', name:'王浩澤', subjectId:'math', contact:'', status:'active', roles:['classroom_teacher','subject_panel_head']},
  {id:'T1015', name:'龍浩騫', subjectId:'math', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1016', name:'尹詩珩', subjectId:'math', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1017', name:'邱嘉俊', subjectId:'math', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1018', name:'范嘉諾', subjectId:'math', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1019', name:'邵嘉朗', subjectId:'math', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1020', name:'區嘉睿', subjectId:'sci', contact:'', status:'active', roles:['classroom_teacher','subject_panel_head']},
  {id:'T1021', name:'黃嘉俐', subjectId:'sci', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1022', name:'劉嘉文', subjectId:'sci', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1023', name:'溫家豪', subjectId:'sci', contact:'', status:'departed', roles:['classroom_teacher']},
  {id:'T1024', name:'余慧敏', subjectId:'sci', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1025', name:'龍子傲', subjectId:'chi', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1026', name:'林浩霖', subjectId:'chi', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1027', name:'余曉彤', subjectId:'hist', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1028', name:'劉詩妍', subjectId:'hist', contact:'', status:'leave', roles:['classroom_teacher']},
  {id:'T1029', name:'謝浩騫', subjectId:'hist', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1030', name:'許子謹', subjectId:'geo', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1031', name:'吳子誠', subjectId:'geo', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1032', name:'李啟賢', subjectId:'geo', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1033', name:'阮浩然', subjectId:'econ', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1034', name:'曾浩澤', subjectId:'econ', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1035', name:'尹子悅', subjectId:'bafs', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1036', name:'高穎詩', subjectId:'bafs', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1037', name:'馬俊皓', subjectId:'ict', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1038', name:'石家豪', subjectId:'ict', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1039', name:'杜子誠', subjectId:'ict', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1040', name:'梁嘉朗', subjectId:'art', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1041', name:'潘啟賢', subjectId:'art', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1042', name:'沈俊賢', subjectId:'music', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1043', name:'潘子悅', subjectId:'music', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1044', name:'施嘉俊', subjectId:'pe', contact:'', status:'departed', roles:['classroom_teacher']},
  {id:'T1045', name:'邱嘉睿', subjectId:'pe', contact:'', status:'active', roles:['classroom_teacher','subject_panel_head']},
  {id:'T1046', name:'梁詩喬', subjectId:'pe', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1047', name:'洪子瑤', subjectId:'pe', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1048', name:'龍曉希', subjectId:'putonghua', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1049', name:'羅嘉怡', subjectId:'putonghua', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1050', name:'馬家豪', subjectId:'re', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1051', name:'周嘉文', subjectId:'re', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1052', name:'龍詩慧', subjectId:'ls', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1053', name:'董子誠', subjectId:'ls', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1054', name:'鄧天佑', subjectId:'ls', contact:'', status:'active', roles:['classroom_teacher']},
  {id:'T1055', name:'何詩敏', subjectId:'ls', contact:'', status:'active', roles:['classroom_teacher']},
];
function activeTeachers(){ return TEACHERS.filter(t=>t.status==='active'); }

/* Non-teaching staff — added alongside the 2026-07-27 roster fill so 教師名冊
 * reflects a real school's full headcount (a ~800-student secondary school
 * typically also carries library, IT, general office, school social work, and
 * lab-technician staff), not just teaching establishment. Deliberately a
 * SEPARATE array from TEACHERS (not folded in with subjectId:null) — these
 * people aren't teachers-with-a-blank-subject, they're a different job
 * category with no subject panel, no classroom_teacher role, and nothing in
 * ROLE_DEFS describes what they do. Read-only in roster.html: no status
 * dropdown, no role picker — same "don't have to link them to the entire
 * ecosystem" scope Eric gave for the new teaching staff above. */
const SUPPORT_STAFF = [
  {id:'ST001', name:'李詠恩', dept:'圖書館', status:'active'},
  {id:'ST002', name:'陳嘉朗', dept:'圖書館', status:'active'},
  {id:'ST003', name:'黃俊熙', dept:'資訊科技組', status:'active'},
  {id:'ST004', name:'馬浩然', dept:'資訊科技組', status:'active'},
  {id:'ST005', name:'林詩敏', dept:'總務處', status:'active'},
  {id:'ST006', name:'曾嘉俐', dept:'總務處', status:'active'},
  {id:'ST007', name:'蔡浩德', dept:'總務處', status:'active'},
  {id:'ST008', name:'邱雅晴', dept:'社工組', status:'active'},
  {id:'ST009', name:'沈子誠', dept:'實驗室', status:'active'},
  {id:'ST010', name:'許嘉頌', dept:'實驗室', status:'active'},
];
function teacherById(id){ return TEACHERS.find(t=>t.id===id); }
function teacherName(id){ const t = teacherById(id); return t ? t.name : id; }
/* Full name + id, e.g. "陳凱怡（T1001）" — use in admin/record contexts
 * (教師名冊, 任教編配) where a defendable identifier matters; use teacherName()
 * alone in ordinary prose/cards, where the given name is already unambiguous. */
function teacherLabel(id){ const t = teacherById(id); return t ? t.name+'（'+t.id+'）' : id; }

/* Role definitions — the near-term fix confirmed for Story 3: a FIXED set of
 * named roles, not open-ended custom roles (that's explicitly flagged as
 * speculative/deferred in the stories doc). Each role's `scope` is a plain
 * description of what it grants, shown in the roster's roles tab and
 * referenced from the pages the role actually governs — kept as prose here
 * rather than a real permissions engine, since this is still a prototype, not
 * a built access-control system. */
const ROLE_DEFS = [
  {id:'classroom_teacher', label:'任教老師', color:'var(--ec-blue)',
   scope:'預設角色，每位教師都有。只看到自己任教班別的資料，可使用 AI 教學工具、教學分組、學生工具申請等課堂層級功能。'},
  {id:'subject_panel_head', label:'科主任', color:'var(--ec-purple)',
   scope:'可查閱本科所有班別的統計視圖（科組統計視圖），毋須擁有校務處的完整權限。範圍只限本科，不涉及其他科目或校務行政功能。'},
  {id:'sen_coordinator', label:'SEN 統籌', color:'var(--ec-teal)',
   scope:'可查閱全校學生的 SEN 標籤與支援計劃狀態。此類資料比一般學術資料敏感，範圍獨立於科主任之外，亦不等同於校務行政權限。'},
  {id:'ict_coordinator', label:'資訊科技統籌', color:'#7C5CDB',
   scope:'管理 EdMarket 訂閱與供應商資料存取審批。不涉及學生／教師身份紀錄（該職能由校務紀錄組獨立負責）。'},
  {id:'school_admin', label:'校務行政', color:'var(--ec-blue-dark)',
   scope:'管理教師名冊、任教編配、批量編班、學生編班等全校組織性事務。現實系統目前只有此一個角色，正是這次角色拆分想解決的權限過度集中問題。'},
  {id:'principal', label:'校長', color:'#8a5a00',
   scope:'可查閱全校（跨學科）層面的統計與趨勢視圖，不涉及個別學生的日常課堂操作。'},
];
function roleLabel(roleId){ const r = ROLE_DEFS.find(x=>x.id===roleId); return r ? r.label : roleId; }
function roleColor(roleId){ const r = ROLE_DEFS.find(x=>x.id===roleId); return r ? r.color : 'var(--ink-3)'; }
function teachersWithRole(roleId){ return TEACHERS.filter(t=>(t.roles||[]).includes(roleId)); }

function classGroups(classId){ return (CLASSES[classId] && CLASSES[classId].groups) || []; }
function groupMembers(classId, groupId){
  const c = CLASSES[classId]; if(!c) return [];
  return c.students.filter(s=>s.g===groupId && !s.left);
}
function groupHeadcount(classId, groupId){ return groupMembers(classId, groupId).length; }
function wholeClassMembers(classId){
  const c = CLASSES[classId]; if(!c) return [];
  return c.students.filter(s=>!s.left);
}
function groupLabel(classId, groupId){
  const c = CLASSES[classId]; if(!c) return groupId;
  if(groupId==='__whole_class__') return '全班 · '+c.className;
  const g = c.groups.find(x=>x.id===groupId);
  return g ? g.name+'（'+groupHeadcount(classId, groupId)+' 人）· '+c.className : groupId+' · '+c.className;
}

/* Compares a request/grant's memberSnapshot (names at the time it was made) against
 * the group's CURRENT live membership (same class). Returns null if nothing has
 * changed, otherwise {added, removed} name lists — surfaced as a "please reconfirm"
 * nudge, never used to silently change what's already been approved. */
/* Seats are named-annual: seatsUsed does not fall when a student leaves a group,
 * so this is plan capacity minus what has been spent this year, never a live
 * headcount. */
/* ── Cross-page hand-off (see demo-state.js) ───────────────────────────────
 * A teacher moving a student between groups changes what a vendor holds, so
 * the two have to stay in step. Two things are stored, and the split matters:
 *
 *   groupOverrides — {sid: groupId}. The school's own state. Applied to CLASSES
 *     on load so the change survives navigation across the teacher/admin pages.
 *   releases — {vendorId: [{n, cls, level}]}. The payload a vendor receives.
 *     Derived, never the source. The vendor console reads only this, so it can
 *     render what was released without ever touching the roster.
 *
 * Release = the group's current members. The bound is 課室 (one class, from
 * 任教編配), so every member is inside it by construction. */
function applyGroupOverrides(){
  if(typeof DemoState === 'undefined') return;
  const ov = DemoState.get('groupOverrides', null);
  if(!ov) return;
  Object.values(CLASSES).forEach(c =>
    (c.students||[]).forEach(s => { if(ov[s.sid]) s.g = ov[s.sid]; }));
}
function recordGroupOverride(sid, groupId){
  if(typeof DemoState === 'undefined') return;
  const ov = DemoState.get('groupOverrides', {});
  ov[sid] = groupId;
  DemoState.set('groupOverrides', ov);
}

/* No ability band travels to the vendor (decided 2026-08-18). The previous
 * design sent a "neutral scale" — 支援組→程度 2, 核心組→程度 3, 增潤組→程度 4 —
 * which was a 1:1 re-encoding of the group name. Withholding the label 支援組
 * while transmitting a number that means exactly 支援組 protected nothing, and
 * on a 全班 grant it handed over the school's full banding of the class.
 * A vendor whose tool needs an entry level now assesses for it in-product. */

/* Release follows live group membership — deliberately.
 *
 * The previous version kept a frozen released[] list the teacher curated by
 * hand, on the reasoning that regrouping must not silently move a child's data
 * or spend a seat. Half of that reasoning was wrong. 課室 is derived from
 * 任教編配 and is single-class, so a student moved between two groups of the
 * same class never crosses the approved bound — there is nothing new to
 * authorise. And seats are metered at first EdConnect authentication, not at
 * assignment, so moving her costs nothing until she actually opens the tool.
 *
 * What that removes: the eligible/released split, the curated cohort, the drift
 * banner, and the teacher-side reconciliation work all of it generated. */
function releasedFor(vendorId){
  const v = VENDORS.find(x => x.id === vendorId);
  if(!v) return [];
  const out = [];
  (v.grants||[]).forEach(g => {
    if(!g.classId) return;
    const roster = CLASSES[g.classId];
    const members = g.groupId && g.groupId !== '__whole_class__'
      ? groupMembers(g.classId, g.groupId)
      : wholeClassMembers(g.classId);
    members.forEach(st => {
      if(st.left) return;                                   // left the school
      out.push({ n:st.n, cls:roster.className });
    });
  });
  return out;
}
function publishReleases(){
  if(typeof DemoState === 'undefined') return;
  const map = {};
  VENDORS.forEach(v => { map[v.id] = releasedFor(v.id); });
  DemoState.set('releases', map);
}

function seatsLeft(vendorId, schoolId){
  const p = planFor(vendorId, schoolId);
  return p ? Math.max(0, p.studentCap - p.seatsUsed) : null;
}

function membershipDrift(entry){
  if(!entry.classId || !entry.groupId || !entry.memberSnapshot) return null;
  const current = entry.groupId==='__whole_class__'
    ? wholeClassMembers(entry.classId).map(s=>s.n)
    : groupMembers(entry.classId, entry.groupId).map(s=>s.n);
  const before = entry.memberSnapshot;
  const added = current.filter(n=>!before.includes(n));
  const removed = before.filter(n=>!current.includes(n));
  if(!added.length && !removed.length) return null;
  return {added, removed};
}

/* Study groups — added 2026-07-22 (Story 1, wave-one build, parallel track to
 * Story 2). Fixes the real gap named in EdCity_School Accounts Administration System_Consolidation_Stories.md
 * Story 1: 陳老師 teaches 中二乙班 and 中一丙班, and wants to pull a handful of
 * students from BOTH into one reading circle — but c.groups (增潤組/核心組/支援組
 * above) are pedagogical sub-groups scoped to a SINGLE class, by design (see the
 * comment above CLASSES). A study group is a deliberately DIFFERENT concept:
 * cross-class, teacher-defined, independent of the official class/group
 * structure — never confuse the two, and never let School Accounts Administration System's official
 * organizational layer or 何主任's roster read/write this data (see 🔒
 * ownership note already on groups.html for the same reasoning applied to
 * ordinary teaching groups).
 *
 * Scope, confirmed by Eric: WITHIN this school only. Cross-school study groups
 * are a real future need but explicitly deferred, not modeled here.
 *
 * memberRefs stores {classId, name} pairs rather than a flat name list, since
 * the whole point is members can come from different classes — a plain name
 * isn't even guaranteed unique across classes (see 陳嘉欣 in 2b vs 1a). expiresAt
 * is optional (Eric's stories doc: "with an optional expiry") — null means
 * open-ended. */
const STUDY_GROUPS = [
  {id:'sg1', name:'跨班閱讀圈', goal:'從兩班中挑選閱讀能力相近的學生，六星期的共讀單元，不跟班別走。',
   teacherId:'T1001', color:'var(--ec-teal)', expiresAt:'2026-09-05',
   memberRefs:[
     {classId:'2b', name:'王思穎'}, {classId:'2b', name:'林一心'}, {classId:'2b', name:'徐朗'},
     {classId:'1c', name:'馬顯宗'}, {classId:'1c', name:'蘇文樂'},
   ]},
];

/* Resolves memberRefs to live student objects, dropping any whose class no
 * longer has them (e.g. a student who has since transferred out) — same
 * "drop silently rather than error" convention as groupMembers() above, but
 * cross-class lookups mean this ALSO has to tolerate a memberRef pointing at
 * a classId that's been removed entirely, not just a student within it. */
function studyGroupMembers(sgId){
  const sg = STUDY_GROUPS.find(x=>x.id===sgId);
  if(!sg) return [];
  return sg.memberRefs
    .map(ref=>{
      const c = CLASSES[ref.classId];
      if(!c) return null;
      const s = c.students.find(x=>x.n===ref.name && !x.left);
      return s ? {...s, classId:ref.classId, className:c.className} : null;
    })
    .filter(Boolean);
}
function studyGroupHeadcount(sgId){ return studyGroupMembers(sgId).length; }
function studyGroupLabel(sgId){
  const sg = STUDY_GROUPS.find(x=>x.id===sgId);
  if(!sg) return sgId;
  return sg.name+'（'+studyGroupHeadcount(sgId)+' 人 · 跨班）';
}
/* Scope-key convention for grant/pending/trial entries: groupId becomes
 * '__study_group__'+sgId, classId stays null (there isn't one — that's the
 * whole point). Existing generic rendering (eddata-console.html's pendingHtml,
 * req cards, etc.) reads .group/.headcount/.memberSnapshot as plain
 * strings/numbers and doesn't care where they came from, so no changes were
 * needed there. membershipDrift() already guards on `!entry.classId` and
 * returns null — meaning study-group-scoped entries deliberately skip live
 * drift-detection in this first build (a known, honest limitation, not an
 * oversight: recomputing "who's currently in this cross-class group" against
 * a snapshot needs its own comparison logic, not the class+group one above —
 * left for a later pass rather than half-building it here). */
function isStudyGroupScope(groupId){ return typeof groupId === 'string' && groupId.startsWith('__study_group__'); }
function studyGroupIdFromScope(groupId){ return groupId.replace('__study_group__', ''); }

const VENDORS = [
  {
    id:'zhixie', name:'智寫科技', product:'寫作回饋工具',
    vetting:{status:'certified', label:'<svg class="ck" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.4 5.4 10.8 12 3.2"/></svg> 已通過基準認證', note:'合規閘 5/5 通過（見供應商審核 vetting.html）'},
    grants:[
      {group:'增潤組（9 人）· 中二乙班', classId:'2b', groupId:'stretch', memberSnapshot:['王思穎','林一心','徐朗','邵浩霖','梁俊熙','邵嘉俐','柯子傲','楊子誠','阮子健'], headcount:9, teacherId:'T1001', tier:'Tier 1 · 基本資料', since:'2026-06-20', eligible:['S2001','S2002','S2003','S2004','S2005','S2006','S2007','S2008','S2009','S2010','S3001','S3002','S3003','S3004','S3005','S3006','S3007','S3008','S3009','S3010','S3011','S3012','S3013','S3014','S3015','S3016','S3017','S3018','S3019','S3020','S3021','S3022','S3023','S3024'], released:['S2001','S2002','S2003','S3001','S3002','S3003','S3004','S3005','S3006']},
    ],
    pending:[
      {id:'r1', teacherId:'T1001', group:'支援組（6 人）· 中二乙班', classId:'2b', groupId:'support', memberSnapshot:['李俊希','鄭家朗','何嘉睿','沈詩妍','施詠芝','范俊希'], headcount:6, src:'來自教學分組（groups.html）', status:'pending', _pickedTier:null, eligible:['S2001','S2002','S2003','S2004','S2005','S2006','S2007','S2008','S2009','S2010','S3001','S3002','S3003','S3004','S3005','S3006','S3007','S3008','S3009','S3010','S3011','S3012','S3013','S3014','S3015','S3016','S3017','S3018','S3019','S3020','S3021','S3022','S3023','S3024']},
      {id:'r2', teacherId:'T1002', group:'核心組（6 人）· 中二乙班', classId:'2b', groupId:'core', memberSnapshot:['陳嘉欣','何梓晴','黃俊傑','吳詠芝','周天恩','簡愛琳'], headcount:6, src:'來自教學分組（groups.html）', status:'pending', _pickedTier:null, eligible:['S2001','S2002','S2003','S2004','S2005','S2006','S2007','S2008','S2009','S2010','S3001','S3002','S3003','S3004','S3005','S3006','S3007','S3008','S3009','S3010','S3011','S3012','S3013','S3014','S3015','S3016','S3017','S3018','S3019','S3020','S3021','S3022','S3023','S3024']},
    ],
  },
  {
    id:'diandu', name:'點讀教育', product:'中文分級閱讀庫',
    vetting:{status:'certified', label:'<svg class="ck" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.4 5.4 10.8 12 3.2"/></svg> 已通過基準認證', note:'合規閘 5/5 通過'},
    grants:[
      {group:'全班 · 中一甲班', classId:null, groupId:null, memberSnapshot:null, headcount:35, teacherId:'T1002', tier:'Tier 1 · 基本資料', since:'2026-07-15'},
    ],
    /* Second-class example: 陳凱怡老師 also teaches 中一丙班, and has a request pending
     * there — this is what makes multi-class support real rather than cosmetic. */
    pending:[
      {id:'r4', teacherId:'T1001', group:'核心組（4 人）· 中一丙班', classId:'1c', groupId:'core', memberSnapshot:['馬顯宗','蘇文樂','鄧凱兒','黎子軒'], headcount:4, src:'來自教學分組（groups.html）', status:'pending', _pickedTier:null},
    ],
  },
  {
    id:'unknownvendor', name:'字詞通 AI（新供應商）', product:'AI 詞彙診斷工具',
    vetting:{status:'none', label:'⚠ 尚未提交供應商審核', note:'未見於供應商審核佇列（vetting.html），按管治規則，任何層級都不應在此核准，須先完成合規閘'},
    grants:[],
    pending:[
      {id:'r3', teacherId:'T1002', group:'核心組（6 人）· 中二乙班', classId:'2b', groupId:'core', memberSnapshot:['陳嘉欣','何梓晴','黃俊傑','吳詠芝','周天恩','簡愛琳'], headcount:6, src:'來自教學分組（groups.html）', status:'pending', _pickedTier:null},
    ],
  },
];

/* Trial requests — shared between trial-invites.html (teacher's confirm/decline
 * inbox), eddata-console.html (IT's confirm/decline queue), groups.html
 * (where a teacher can now START a trial directly), and vendor-portal.html (where
 * a vendor can also send an invite), so all these pages show the same trial at the
 * same stage instead of each assuming a different state.
 *
 * `origin` distinguishes who started the trial:
 *   'vendor'  — vendor pitches first; lifecycle: awaiting_teacher → pending_it → active → graduated
 *                                                              ↘ declined              ↗ (graduate button)
 *                                                                          pending_it ↗
 *   'teacher' — added 2026-07-22 (Story 2, wave-one build): a teacher, already looking
 *               at an already-CERTIFIED vendor, starts the trial directly — skips
 *               awaiting_teacher entirely (the teacher IS the initiator, nothing to
 *               confirm) and starts straight at pending_it. This is the concrete fix
 *               for the "tool trial requires the same full production-scale grant as
 *               permanent adoption" problem in EdCity_School Accounts Administration System_Consolidation_Stories.md
 *               Story 2 — vetting/compliance stays mandatory (only certified vendors
 *               are offered), but the grant itself is lighter: Tier 1 only, single
 *               class/group scope (never whole-school), 14-day auto-expiry, one-click
 *               IT sign-off instead of the full tier-picker used for production grants.
 *
 * A decline at either stage sets declinedBy, a reason, and a cooldownUntil date;
 * during the cooldown the same vendor cannot re-pitch the same class+group. */
const TRIALS = [
  {id:'t1', vendor:'點讀教育', vendorId:'diandu', teacherId:'T1001', classId:'2b', groupId:'stretch', group:'增潤組（3 人）· 中二乙班', headcount:3,
   tool:'中文分級閱讀庫 · 進階版試用', status:'pending_it', expiresAt:'2026-08-04', origin:'teacher',
   declineReason:null, cooldownUntil:null, declinedBy:null},
  {id:'t2', vendor:'語音通 AI', vendorId:null, teacherId:'T1002', classId:'2b', groupId:'core', group:'核心組（5 人）· 中二乙班', headcount:5,
   tool:'AI 朗讀評測（試用版）', status:'declined', expiresAt:null, origin:'vendor',
   declineReason:'試用期內評語準確度不足，未能分辨聲調錯誤與地道口音差異。', cooldownUntil:'2026-11-05', declinedBy:'it'},
  /* Vendor-initiated and deliberately UNSCOPED: classId/groupId stay null until
   * 陳凱怡老師 accepts and picks the group herself. A vendor never proposes a
   * cohort — see §4.1 of the scoping document. */
  {id:'t3', vendor:'智寫科技', vendorId:'zhixie', teacherId:'T1001', classId:null, groupId:null, group:null, headcount:null,
   tool:'AI 詞彙診斷追蹤（試用版）', status:'awaiting_teacher', expiresAt:null, origin:'vendor',
   declineReason:null, cooldownUntil:null, declinedBy:null},
  /* Second-class example, so trial-invites.html's class-switcher has something
   * real to show under 中一丙班 too. */
  {id:'t4', vendor:'點讀教育', vendorId:'diandu', teacherId:'T1001', classId:'1c', groupId:'support', group:'支援組（2 人）· 中一丙班', headcount:2,
   tool:'中文分級閱讀庫 · 入門版試用', status:'awaiting_teacher', expiresAt:null, origin:'vendor',
   declineReason:null, cooldownUntil:null, declinedBy:null},
];

/* Does requesting `groupId` in `classId` for `vendorId` overlap with access that
 * vendor already has (granted or pending) for THIS class? Whole-class vs.
 * per-group is the one overlap this prototype checks, and it's scoped to a single
 * class — a whole-class request in 中一丙班 has nothing to do with per-group grants
 * in 中二乙班. Returns a human note to show the requester and (via the pending
 * entry's overlapNote field) the approver, or null if no overlap. */
function scopeOverlapNote(vendorId, classId, groupId){
  const v = VENDORS.find(x=>x.id===vendorId);
  if(!v) return null;
  const subGroupIds = classGroups(classId).map(g=>g.id);
  const inClass = e => e.classId===classId;
  const covered = new Set([
    ...v.grants.filter(inClass).map(g=>g.groupId).filter(Boolean),
    ...v.pending.filter(p=>p.status==='pending' && inClass(p)).map(p=>p.groupId).filter(Boolean),
  ]);
  if(groupId==='__whole_class__'){
    const already = subGroupIds.filter(id=>covered.has(id));
    if(already.length){
      const names = already.map(id=>classGroups(classId).find(g=>g.id===id).name).join('、');
      return '此供應商已就 '+names+' 持有存取或待審批請求，全班申請會與此重疊，建議由資訊科技統籌一併檢視。';
    }
  } else if(covered.has('__whole_class__')){
    return '此供應商已持有全班存取或待審批請求，這個分組申請可能重疊，建議由資訊科技統籌一併檢視。';
  }
  return null;
}

/* Commercial plan caps — a separate fact from the data-tier grants above.
 * Owned conceptually by subscriptions.html (this is a contract/seat fact, not
 * a data-access fact), but kept in this shared file so the same VENDORS ids
 * can be joined against it from either page. Seat caps are school-wide (a
 * commercial contract with the school), not per-class, so usage sums grants
 * across ALL classes for that vendor — no classId parameter needed here. */
/* Schools (added 2026-08-18).
 *
 * Everything school-side in this prototype is one school, and that is fine —
 * 何主任 and 馮 Sir each work at exactly one. The vendor does not. A vendor
 * holds relationships with many schools at once, and four models below were
 * keyed by vendorId alone while actually describing a SCHOOL ↔ VENDOR
 * relationship. The agreement gate was the sharpest case: a governance control
 * that did not know which school it protected, so signing with one school would
 * have unlocked releases at every school.
 *
 * TIER_DECLARATIONS is deliberately NOT re-keyed — what a tool needs is a
 * property of the tool, identical at every school. */
const SCHOOLS = {
  'sch001': {name:'順德聯誼總會李兆基中學', shortName:'李兆基中學', district:'荃灣'},
  'sch002': {name:'保良局陳守仁小學',       shortName:'陳守仁小學', district:'油尖旺'},
  'sch003': {name:'香港真光書院',           shortName:'真光書院',   district:'南區'},
};
/* The school these school-side screens belong to. CLASSES, TEACHERS and the
 * roster all belong to it implicitly — they are not re-keyed, because a school
 * admin never sees another school's roster and pretending otherwise would add a
 * dimension to every screen for no one's benefit. */
const MY_SCHOOL_ID = 'sch001';
function schoolName(id){ const s = SCHOOLS[id]; return s ? s.shortName : id; }

/* Teacher-issued invite codes (decided 2026-08-18).
 *
 * The vendor portal used to offer a dropdown of every teacher in the table, so a
 * vendor could browse a directory of named teachers. That contradicted the rule
 * printed directly above the form — 「你必須已經和該老師接觸過」 — and adding a
 * school selector in front of it would have made the browsing more structured,
 * not less objectionable. It would also have made EdCity a teacher directory
 * for vendors, which is a larger governance claim than anything else here.
 *
 * Instead the teacher issues a short code and hands it over herself, at the
 * conference or in the email exchange where the contact actually happened. The
 * code resolves to a school AND a teacher, so the multi-school problem is
 * answered by the same mechanism rather than by a second picker.
 *
 * Deliberately NOT the Sayo room code this resembles: that let a *student*
 * self-enrol into a teacher's room. This lets a *teacher* authorise a vendor to
 * address her. No student data moves, and 馮 Sir still approves any release. */
const INVITE_CODES = [
  {code:'CHAN-7K2Q', teacherId:'T1001', schoolId:'sch001', issuedOn:'2026-08-12',
   label:'教育科技展 · 智寫科技', uses:0, maxUses:1, revoked:false},
  {code:'WONG-4M8P', teacherId:'T1002', schoolId:'sch001', issuedOn:'2026-08-15',
   label:'電郵查詢後發出', uses:0, maxUses:1, revoked:false},
];
function resolveInviteCode(raw){
  const code = String(raw||'').trim().toUpperCase();
  const c = INVITE_CODES.find(x=>x.code===code);
  if(!c) return {ok:false, reason:'unknown'};
  if(c.revoked) return {ok:false, reason:'revoked'};
  if(c.uses >= c.maxUses) return {ok:false, reason:'used'};
  return {ok:true, code:c, teacherId:c.teacherId, schoolId:c.schoolId};
}
function spendInviteCode(code){
  const c = INVITE_CODES.find(x=>x.code===code);
  if(c) c.uses += 1;
  return c;
}
function issueInviteCode(teacherId, schoolId, label){
  /* Latin-only, and no characters that get misheard or misread when a teacher
   * reads this out at a conference: no O/0, I/1, or CJK. */
  const rnd = () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)];
  const c = {code:('EC-'+rnd()+rnd()+rnd()+rnd()+rnd()).toUpperCase(),
    teacherId, schoolId:schoolId||MY_SCHOOL_ID, issuedOn:'2026-08-18',
    label:label||'（未註明用途）', uses:0, maxUses:1, revoked:false};
  INVITE_CODES.unshift(c);
  return c;
}
function codesForTeacher(teacherId){ return INVITE_CODES.filter(c=>c.teacherId===teacherId); }
const svKey = (schoolId, vendorId) => schoolId + '::' + vendorId;

/* Keyed school × vendor: each school buys its own seats, and one school's usage
 * must not eat another's. */
const VENDOR_PLANS = {
  'sch001::zhixie':  {plan:'Basic 方案',    teacherCap:4, studentCap:20,  seatsUsed:9,  renewal:'2026-09-30'},
  'sch001::diandu':  {plan:'Standard 方案', teacherCap:8, studentCap:40,  seatsUsed:12, renewal:'2026-08-15'},
  'sch002::zhixie':  {plan:'Basic 方案',    teacherCap:4, studentCap:20,  seatsUsed:3,  renewal:'2027-01-31'},
};
/* Accessors default to MY_SCHOOL_ID so school-side screens read exactly as
 * before; the vendor side passes a school explicitly. */
function planFor(vendorId, schoolId){ return VENDOR_PLANS[svKey(schoolId||MY_SCHOOL_ID, vendorId)] || null; }
function plansForSchool(schoolId){
  const id = schoolId || MY_SCHOOL_ID, out = {};
  Object.keys(VENDOR_PLANS).forEach(k=>{
    const [s, v] = k.split('::');
    if(s === id) out[v] = VENDOR_PLANS[k];
  });
  return out;
}
function schoolsForVendor(vendorId){
  const ids = new Set();
  Object.keys(VENDOR_PLANS).forEach(k=>{ const [s,v]=k.split('::'); if(v===vendorId) ids.add(s); });
  Object.keys(AGREEMENTS).forEach(k=>{ const [s,v]=k.split('::'); if(v===vendorId) ids.add(s); });
  return [...ids];
}

/* The agreement gate (decided 2026-08-18).
 *
 * Nothing is released until an agreement between this school and this vendor is
 * in force. The bar is a CONTRACT, not a PAYMENT — a zero-cost trial agreement
 * qualifies, so a teacher can still try a tool before procurement concludes.
 * What it removes is the case where a vendor holds student data with no
 * contractual relationship to the school at all.
 *
 * kind: 'trial' — zero-cost, dated, covers trials only
 *       'service' — the paid subscription agreement
 *       null / absent — nothing signed; release is blocked. */
const AGREEMENTS = {
  'sch001::zhixie': {kind:'service', signedOn:'2026-06-18', expiresOn:'2027-08-31', ref:'AGR-2026-0118'},
  'sch001::diandu': {kind:'trial',   signedOn:'2026-07-14', expiresOn:'2026-09-30', ref:'AGR-2026-0233'},
  /* Same vendor, different school, different contract — the case the old
   * vendor-only key could not express at all. */
  'sch002::zhixie': {kind:'service', signedOn:'2026-05-02', expiresOn:'2027-08-31', ref:'AGR-2026-0077'},
  // 字詞通 AI: nothing signed anywhere — approval is blocked until it is.
};
function agreementFor(vendorId, schoolId){
  return AGREEMENTS[svKey(schoolId||MY_SCHOOL_ID, vendorId)] || null;
}
function agreementCovers(vendorId, isTrial, schoolId){
  const a = agreementFor(vendorId, schoolId);
  if(!a) return false;
  return a.kind === 'service' || (a.kind === 'trial' && isTrial);
}
const AGREEMENT_LABEL = {trial:'零費用試用協議', service:'服務協議'};

/* Who records an agreement — settled in §4.5 of the scoping document.
 *
 * Not the school: a school declaring it holds a service agreement is
 * self-declaring an entitlement. The VENDOR confirms it, in their own portal —
 * they know what they sold, and it makes the handshake two-party. No
 * verification required, because confirming a sale that did not happen is
 * against the vendor's own interest.
 *
 * EdCity records that an agreement exists and what kind. It never sees the
 * price, the terms, or the document. That is between the school and the vendor,
 * off-platform, and staying out of it is the whole neutrality position. */
let AGREEMENT_SEQ = 300;
function confirmAgreement(schoolId, vendorId, kind, expiresOn){
  const k = svKey(schoolId, vendorId);
  const existing = AGREEMENTS[k];
  /* An upgrade replaces a trial agreement; it does not stack. */
  AGREEMENTS[k] = {
    kind, signedOn: TODAY(),
    expiresOn: expiresOn || BUDGET_PENDING_END,
    ref: existing && existing.kind === kind ? existing.ref : 'AGR-2026-0' + (AGREEMENT_SEQ++),
  };
  publishAgreements();
  return AGREEMENTS[k];
}
/* A school cannot create an agreement, but it can ask for one. The request is
 * the only agreement-shaped thing 馮 Sir can produce on his own. */
const AGREEMENT_REQUESTS = [];
function requestAgreement(schoolId, vendorId, kind){
  const k = svKey(schoolId, vendorId);
  if(AGREEMENT_REQUESTS.some(r=>r.key===k && r.kind===kind && r.status==='open')) return null;
  const r = {key:k, schoolId, vendorId, kind, askedOn:TODAY(), status:'open'};
  AGREEMENT_REQUESTS.push(r);
  publishAgreements();
  return r;
}
function openAgreementRequests(vendorId, schoolId){
  return AGREEMENT_REQUESTS.filter(r=>r.status==='open'
    && (!vendorId || r.vendorId===vendorId) && (!schoolId || r.schoolId===schoolId));
}
function closeAgreementRequest(key, kind){
  AGREEMENT_REQUESTS.forEach(r=>{ if(r.key===key && r.kind===kind) r.status='closed'; });
}
function publishAgreements(){
  if(typeof DemoState === 'undefined') return;
  DemoState.set('agreements', AGREEMENTS);
  DemoState.set('agreementRequests', AGREEMENT_REQUESTS);
}
function applyPublishedAgreements(){
  if(typeof DemoState === 'undefined') return;
  const a = DemoState.get('agreements', null);
  if(a){ Object.keys(a).forEach(k=>{ AGREEMENTS[k] = a[k]; }); }
  const r = DemoState.get('agreementRequests', null);
  if(r){ AGREEMENT_REQUESTS.length = 0; r.forEach(x=>AGREEMENT_REQUESTS.push(x)); }
}

/* Data-tier declaration — step 1.
 *
 * The vendor states what its tool needs, at vetting, before any school sees it.
 * Previously the tier first appeared on 馮 Sir's approval screen already
 * decided, by nobody, from nowhere — which made it look like his choice when it
 * is really a property of the tool that he either accepts or declines.
 *
 * declaredTier is the CEILING, not the value: 馮 Sir may release less than the
 * vendor asked for, never more. */
const DATA_TIERS = {
  1:{label:'Tier 1 · 基本資料',      fields:'姓名、班別'},
  2:{label:'Tier 2 · 敏感個人資料',  fields:'加上聯絡方式、特殊教育需要標記'},
  3:{label:'Tier 3 · 表現數據',      fields:'加上評估結果與學習紀錄'},
};
const TIER_DECLARATIONS = {
  zhixie:       {tier:1, declaredOn:'2026-06-28', why:'只需辨識學生身分以配對其作文與回饋紀錄。', verified:true},
  diandu:       {tier:1, declaredOn:'2026-07-02', why:'只需辨識學生身分以記錄閱讀進度。', verified:true},
  unknownvendor:{tier:2, declaredOn:null, why:'聲稱需要特殊教育需要標記以調整題目難度，未提供說明文件。', verified:false},
};
function declaredTier(vendorId){
  const d = TIER_DECLARATIONS[vendorId];
  return d ? DATA_TIERS[d.tier] : null;
}
/* True when 馮 Sir is about to release more than the vendor declared it needs.
 * Not blocked — a school may have its own reason — but it should never happen
 * silently. */
function exceedsDeclared(vendorId, tierLabel){
  const d = TIER_DECLARATIONS[vendorId];
  if(!d) return false;
  const n = Number(String(tierLabel).match(/Tier\s*(\d)/)?.[1] || 0);
  return n > d.tier;
}

/* 待預算 — steps 12–14 of the release flow.
 *
 * When a trial ends and the school has not decided, the release does not simply
 * vanish and does not silently continue. It enters 待預算: scope FROZEN at what
 * it was, dated, non-renewable. 馮 Sir holds approval authority but not budget
 * authority, so this is the state that exists precisely because the money
 * decision belongs to someone else and happens offline, on the school's cycle.
 *
 * Decided 2026-08-18:
 *   expiry — 31 August, the seat year and the date every school already plans
 *            around. Accepted cost: something entering in September sits frozen
 *            for eleven months.
 *   cap    — none. A school-level cap was considered and deliberately not set;
 *            there is no basis for a number yet. Uncapped and instrumented,
 *            so pilot data can set it. `budgetPendingCount()` is the instrument. */
const BUDGET_PENDING_END = '2027-08-31';
const BUDGET_PENDING = [
  {id:'bp1', vendorId:'diandu', vendorName:'點讀教育', product:'中文分級閱讀庫',
   teacherId:'T1001', classId:'2b', groupId:'stretch', group:'增潤組（9 人）· 中二乙班', headcount:9,
   frozenOn:'2026-08-04', endsOn:BUDGET_PENDING_END, trialRef:'t1',
   note:'試用期完結，學校未就採購作決定。'},
];
function budgetPendingCount(){ return BUDGET_PENDING.length; }

/* Seat metering — step 11.
 *
 * A seat is consumed at FIRST EdConnect authentication, and only the first
 * time. This is the load-bearing detail behind several other decisions: it is
 * why a teacher can regroup freely without spending anything, why the frozen
 * cohort could be deleted, and why an unused release costs the school nothing
 * (which is most of why seat reclamation stopped being a problem).
 *
 * Named-annual: the seat stays spent for the school year even if the student
 * later leaves the group. It is a seat for a named child, not a concurrent
 * licence, so releasing it on regrouping would let a school cycle one seat
 * through thirty children. */
/* Deletion receipts — step 15.
 *
 * Revoking access used to end the story: the grant disappeared and an audit line
 * said it had been revoked. But step 15 promises more than "we stopped sending
 * data" — it promises the released data is DELETED, while tagged historical
 * records are retained so longitudinal views survive. Nothing showed that ever
 * happened, and proof of destruction is precisely the artefact a school or a
 * regulator asks for. An audit line saying "revoked" is not that proof.
 *
 * Two-party by design: the school raises it, the vendor confirms it. A receipt
 * the school writes alone is a school asserting something about someone else's
 * systems. */
const DELETION_RECEIPTS = [];
function requestDeletion({vendorId, vendorName, group, tier, headcount, reason, schoolId}){
  const sch = schoolId || MY_SCHOOL_ID;
  const r = {
    id:'del'+(DELETION_RECEIPTS.length+1)+'-'+Date.now(),
    /* A receipt has to name whose data was deleted — otherwise it proves
     * nothing to the school that asked for it. */
    schoolId:sch, schoolName:schoolName(sch),
    vendorId, vendorName, group, tier, headcount, reason,
    requestedOn:'2026-08-18', status:'awaiting_vendor', confirmedOn:null,
    /* What survives, stated explicitly so nobody has to infer it: aggregate,
     * de-identified records stay, because a lapsed subscription should not
     * silently erase a student's learning history from the school's own views. */
    retained:'已去識別化的彙總紀錄（不含姓名、班別）',
  };
  DELETION_RECEIPTS.unshift(r);
  return r;
}
function confirmDeletion(id, on){
  const r = DELETION_RECEIPTS.find(x=>x.id===id);
  if(!r || r.status==='confirmed') return null;
  r.status='confirmed'; r.confirmedOn = on || '2026-08-19';
  return r;
}
function pendingDeletions(vendorId, schoolId){
  return DELETION_RECEIPTS.filter(r=>r.status==='awaiting_vendor'
    && (!vendorId || r.vendorId===vendorId) && (!schoolId || r.schoolId===schoolId));
}
/* Published to the vendor console the same way releases are: a payload, not a
 * shared model. The vendor console must not gain access to CLASSES just to show
 * a deletion queue — that boundary is the point. */
/* The teacher → 馮 Sir handoff.
 *
 * Releases and deletion receipts were already published; grants and pending
 * requests were not, so a tool a teacher assigned existed only in that page's
 * memory and vanished on navigation. That made the one link the whole flow
 * turns on — she asks, he sees it — the only link that could not be
 * demonstrated.
 *
 * Only the mutable parts travel (pending + grants per vendor). The vendor
 * catalogue itself is static seed data and stays in the file. */
function publishRequests(){
  if(typeof DemoState === 'undefined') return;
  const map = {};
  VENDORS.forEach(v => { map[v.id] = {pending: v.pending || [], grants: v.grants || []}; });
  DemoState.set('requests', map);
  /* Published alongside, because they change together and a half-restored state
   * is worse than none: buying seats raises a cap, deferring creates a 待預算
   * item, and a student signing in spends a seat. Leaving these in the file
   * meant 馮 Sir could buy capacity, navigate, and find he hadn't. */
  DemoState.set('plans', VENDOR_PLANS);
  DemoState.set('budgetPending', BUDGET_PENDING);
}
function applyPublishedRequests(){
  if(typeof DemoState === 'undefined') return;
  const map = DemoState.get('requests', null);
  if(map) VENDORS.forEach(v => {
    const m = map[v.id];
    if(!m) return;
    v.pending = m.pending || [];
    v.grants  = m.grants  || [];
  });
  const plans = DemoState.get('plans', null);
  if(plans) Object.keys(plans).forEach(k => { if(VENDOR_PLANS[k]) Object.assign(VENDOR_PLANS[k], plans[k]); });
  const bp = DemoState.get('budgetPending', null);
  if(bp){ BUDGET_PENDING.length = 0; bp.forEach(x => BUDGET_PENDING.push(x)); }
}

function publishDeletions(){
  if(typeof DemoState === 'undefined') return;
  DemoState.set('deletions', DELETION_RECEIPTS);
}
function loadPublishedDeletions(){
  if(typeof DemoState === 'undefined') return [];
  return DemoState.get('deletions', []);
}

/* The school's trial pool — step 8, outcome 2.
 *
 * "Trial from the school's pool" was in the flow from the start, but trials
 * appeared from nowhere and were limited by nothing, which made the second
 * outcome indistinguishable from a free-for-all. The pool is what makes a trial
 * a decision: it is finite, it is the school's, and spending it on one tool
 * means not spending it on another.
 *
 * Counted in CONCURRENT trials, not in students. A trial is a commitment of
 * 馮 Sir's attention and of the school's willingness to have another vendor
 * holding data — neither scales with cohort size, and counting students would
 * push a teacher back toward trialling with fewer children than she needs. */
const TRIAL_POOL = {
  capacity: 4,
  periodLabel: '2026／27 學年',
  note: '同一時間最多可進行的試用數目。試用結束或轉為訂閱後名額即時釋出。',
};
function trialsInFlight(){
  if(typeof TRIALS === 'undefined') return [];
  return TRIALS.filter(t=>['pending_it','active'].includes(t.status));
}
function trialPoolLeft(){ return Math.max(0, TRIAL_POOL.capacity - trialsInFlight().length); }
function trialPoolFull(){ return trialPoolLeft() <= 0; }

const SEAT_LEDGER = {};            // "schoolId::vendorId" -> Set of sids
function hasSeat(vendorId, sid, schoolId){
  const k = svKey(schoolId||MY_SCHOOL_ID, vendorId);
  return !!(SEAT_LEDGER[k] && SEAT_LEDGER[k].has(sid));
}
/* Returns {consumed:true} the first time, {consumed:false, reason} thereafter or
 * when there is nothing left to consume. */
function consumeSeat(vendorId, sid, schoolId){
  const sch = schoolId || MY_SCHOOL_ID;
  const plan = planFor(vendorId, sch);
  if(!plan) return {consumed:false, reason:'no-plan'};
  if(hasSeat(vendorId, sid, sch)) return {consumed:false, reason:'already', seatsUsed:plan.seatsUsed};
  if(plan.seatsUsed >= plan.studentCap) return {consumed:false, reason:'exhausted', seatsUsed:plan.seatsUsed};
  const k = svKey(sch, vendorId);
  (SEAT_LEDGER[k] = SEAT_LEDGER[k] || new Set()).add(sid);
  plan.seatsUsed += 1;
  return {consumed:true, seatsUsed:plan.seatsUsed, cap:plan.studentCap};
}
/* A trial that runs out moves here rather than lapsing silently — the school
 * keeps the option, the vendor keeps the boundary, and nothing renews itself. */
function toBudgetPending(trial){
  if(BUDGET_PENDING.some(b=>b.trialRef===trial.id)) return null;
  const v = VENDORS.find(x=>x.id===trial.vendorId);
  const entry = {
    id:'bp'+Date.now(), vendorId:trial.vendorId, vendorName:trial.vendor,
    product:(v && v.product) || trial.tool,
    teacherId:trial.teacherId, classId:trial.classId, groupId:trial.groupId,
    group:trial.group, headcount:trial.headcount,
    frozenOn:trial.expiresAt || '2026-08-18', endsOn:BUDGET_PENDING_END, trialRef:trial.id,
    note:'試用期完結，學校未就採購作決定。',
  };
  BUDGET_PENDING.push(entry);
  trial.status = 'budget_pending';
  return entry;
}
function resolveBudgetPending(id, outcome){   // 'subscribed' | 'declined'
  const i = BUDGET_PENDING.findIndex(b=>b.id===id);
  if(i<0) return null;
  const [b] = BUDGET_PENDING.splice(i,1);
  b.outcome = outcome;
  return b;
}

/* Sums approved grants only — pending requests are not consumption until approved. */
function vendorUsage(vendorId){
  const v = VENDORS.find(x=>x.id===vendorId);
  if(!v) return {teachers:0, students:0};
  const teacherSet = new Set(v.grants.map(g=>g.teacherId));
  const students = v.grants.reduce((sum,g)=>sum+g.headcount, 0);
  return {teachers:teacherSet.size, students};
}

/* Given a vendor's usage and its plan cap, is a would-be addition (e.g. approving
 * a pending request) going to exceed the student seat cap? Returns null if the
 * vendor has no seat-capped plan (e.g. unlimited full-school licences). */
/* Outcome 3 of the authorisation step: subscribed, but out of seats.
 *
 * This existed as a label and not a path. approve() checked vetting and the
 * agreement but never seats, so 馮 Sir could approve straight past the cap; the
 * over-capacity cards on 訂閱管理 had buttons that only raised a toast; and
 * 已納入下年度預算建議 was reachable only from trial expiry. Two routes that
 * should converge on 待預算 did not meet.
 *
 * A queued request stays in v.pending with status 'queued' — visible to the
 * teacher as 「名額不足，已通知馮 Sir」 and never as a decision she has to make. */
function queueForCapacity(vendorId, reqId, shortBy){
  const v = VENDORS.find(x=>x.id===vendorId);
  const r = (v.pending||[]).find(p=>p.id===reqId);
  if(!r) return null;
  r.status = 'queued';
  r.queuedOn = TODAY();
  r.shortBy = shortBy;
  return r;
}
/* The three closures. Buy raises the cap and grants; decline ends it; defer
 * moves it into 待預算, the same place a lapsed trial lands — so both routes
 * end in one queue with one expiry rule. */
function closeQueued(vendorId, reqId, outcome, addSeats){
  const v = VENDORS.find(x=>x.id===vendorId);
  const r = (v.pending||[]).find(p=>p.id===reqId);
  if(!r || r.status!=='queued') return null;
  const plan = planFor(vendorId);
  if(outcome==='buy'){
    if(plan) plan.studentCap += (addSeats || r.shortBy || 0);
    r.status='approved'; r.tier = r.tier || 'Tier 1 · 基本資料';
    v.grants.push({group:r.group, classId:r.classId, groupId:r.groupId,
      headcount:r.headcount, teacherId:r.teacherId, tier:r.tier, since:TODAY()});
    return {outcome, plan};
  }
  if(outcome==='decline'){ r.status='denied'; return {outcome}; }
  if(outcome==='defer'){
    r.status='deferred';
    BUDGET_PENDING.push({
      id:'bp'+Date.now(), vendorId, vendorName:v.name, product:v.product,
      teacherId:r.teacherId, classId:r.classId, groupId:r.groupId,
      group:r.group, headcount:r.headcount,
      frozenOn:TODAY(), endsOn:BUDGET_PENDING_END, trialRef:null,
      note:'名額不足，未獲本學年預算增購。',
    });
    return {outcome};
  }
  return null;
}
function queuedRequests(){
  const out=[];
  VENDORS.forEach(v=>(v.pending||[]).forEach(r=>{ if(r.status==='queued') out.push({v,r}); }));
  return out;
}

function capacityCheck(vendorId, addStudents){
  const plan = planFor(vendorId);
  if(!plan) return null;
  const usage = vendorUsage(vendorId);
  const projected = usage.students + addStudents;
  return {
    plan, usage, projected,
    overBy: Math.max(0, projected - plan.studentCap),
    pctStudents: Math.round((usage.students/plan.studentCap)*100),
    pctTeachers: Math.round((usage.teachers/plan.teacherCap)*100),
  };
}

applyGroupOverrides();
/* Applied at load, before any page renders, so every screen starts from the
 * same state the last screen left. */
applyPublishedRequests();
/* After state is restored, before anything renders: the clock is part of the
 * state, so a page opened after time was advanced starts already expired. */
applyPublishedAgreements();
applyExpiries();
