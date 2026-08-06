/* vendor-data.js
 * Single source of truth for vendor data-access grants and pending requests.
 * Loaded by eddata-console.html (tier-approval workflow), subscriptions.html
 * (seat-capacity view), groups.html, group-access-requests.html, trial-invites.html,
 * and vendor-portal.html, so all these pages can never show different headcounts or
 * membership for the same class/group — this was a recurring bug in earlier
 * iterations of this prototype, where each file kept its own hand-typed copy of
 * the same numbers.
 *
 * grants  = access already approved (counts toward seat consumption)
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
/* form/formLabel added 2026-07-22 for the SMS bulk-assignment rescope — lets
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
 * that exists", the same gap just fixed in group-access-requests.html's
 * "我的請求" for vendor requests. Matches roster.html's own ASSIGNMENTS array
 * (a1/a2: 陳凱怡→2b/1c, a3: 黃穎詩→1a) — kept in sync by hand since ASSIGNMENTS
 * carries extra fields (subjectId, year) this doesn't need. */
const CLASSES = {
  '2b': {
    className:'中二乙班', subjectLabel:'中文 · 35 人 · 任教中', form:'S2', formLabel:'中二', teacherId:'T1001',
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
    className:'中一丙班', subjectLabel:'中文 · 35 人 · 本學期剛接手', form:'S1', formLabel:'中一', teacherId:'T1001',
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
    className:'中一甲班', subjectLabel:'中文 · 35 人 · 黃穎詩老師任教', form:'S1', formLabel:'中一', teacherId:'T1002',
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

/* Sequential ID generator for students created via 批量編班's intake path —
 * simulates what the school's identity layer (SMS, via 曾主任's approval) would
 * assign in reality. Starts past every seed sid above so nothing collides. */
let STUDENT_SEQ = 2100;
function nextStudentId(){ return 'S' + (STUDENT_SEQ++); }

/* Identity-record requests — added 2026-07-22 to fix a real layering mistake:
 * creating a brand-new student's identity (name + ID) or changing a teacher's
 * actual employment status are identity-layer actions, not SMS-organizational
 * ones. SMS (roster.html) can only REQUEST these; a distinct actor approves and
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
 * SMS's organizational job (class assignment) in the same step as the identity
 * job. That re-created, one layer down, exactly the conflation the
 * request/execute split was built to remove. `suggestedClassId` (renamed from
 * `targetClassId`) is now only context for 曾主任 — non-binding. Approval
 * creates the student in UNASSIGNED_STUDENTS below; assigning them to an actual
 * class is a separate, later SMS action, using the same class-assignment
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
 * SMS-organizational step that was never the identity layer's to do. Seeded
 * with one example so 學生編班 has real content to demonstrate this on a fresh
 * load, without first needing a live approve action on records-console.html
 * (a separate page session anyway). */
const UNASSIGNED_STUDENTS = [
  {n:'黃梓恩', sid:'S2101'},
];

/* Canonical subject list — SMS's job, same reasoning as CLASSES/TEACHERS: without
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

/* Teacher identity/employment record — SMS's job, same reasoning as CLASSES: the
 * status/subject/contact facts here are what everything downstream (任教編配's
 * reassignment picker, vendor invites, tool requests) should be trusting, rather
 * than each teacher-tier page silently assuming every named teacher is still
 * active. Mutate objects' fields in place (never reassign the TEACHERS array
 * itself) — same gotcha as CLASS_LIST, since other code may hold a reference. */
/* `roles` added 2026-07-22 (Story 3, wave-one build): fixes the real gap named
 * in EdCity_SMS_Consolidation_Stories.md Story 3 — the real Account Admin
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
 * Story 2). Fixes the real gap named in EdCity_SMS_Consolidation_Stories.md
 * Story 1: 陳老師 teaches 中二乙班 and 中一丙班, and wants to pull a handful of
 * students from BOTH into one reading circle — but c.groups (增潤組/核心組/支援組
 * above) are pedagogical sub-groups scoped to a SINGLE class, by design (see the
 * comment above CLASSES). A study group is a deliberately DIFFERENT concept:
 * cross-class, teacher-defined, independent of the official class/group
 * structure — never confuse the two, and never let SMS's official
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
      {group:'增潤組（9 人）· 中二乙班', classId:'2b', groupId:'stretch', memberSnapshot:['王思穎','林一心','徐朗','邵浩霖','梁俊熙','邵嘉俐','柯子傲','楊子誠','阮子健'], headcount:9, teacherId:'T1001', tier:'Tier 1 · 基本資料', since:'2026-06-20'},
    ],
    pending:[
      {id:'r1', teacherId:'T1001', group:'支援組（6 人）· 中二乙班', classId:'2b', groupId:'support', memberSnapshot:['李俊希','鄭家朗','何嘉睿','沈詩妍','施詠芝','范俊希'], headcount:6, src:'來自教學分組（groups.html）', status:'pending', _pickedTier:null},
      {id:'r2', teacherId:'T1002', group:'核心組（6 人）· 中二乙班', classId:'2b', groupId:'core', memberSnapshot:['陳嘉欣','何梓晴','黃俊傑','吳詠芝','周天恩','簡愛琳'], headcount:6, src:'來自教學分組（groups.html）', status:'pending', _pickedTier:null},
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
 * inbox), eddata-console.html (IT's confirm/decline queue), group-access-requests.html
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
 *               permanent adoption" problem in EdCity_SMS_Consolidation_Stories.md
 *               Story 2 — vetting/compliance stays mandatory (only certified vendors
 *               are offered), but the grant itself is lighter: Tier 1 only, single
 *               class/group scope (never whole-school), 14-day auto-expiry, one-click
 *               IT sign-off instead of the full tier-picker used for production grants.
 *
 * A decline at either stage sets declinedBy, a reason, and a cooldownUntil date;
 * during the cooldown the same vendor cannot re-pitch the same class+group. */
const TRIALS = [
  {id:'t1', vendor:'點讀教育', vendorId:'diandu', teacherId:'T1001', classId:'2b', groupId:'stretch', group:'增潤組（3 人）· 中二乙班', headcount:3,
   tool:'中文分級閱讀庫 · 進階版試用', status:'pending_it', expiresAt:'2026-08-04', origin:'vendor',
   declineReason:null, cooldownUntil:null, declinedBy:null},
  {id:'t2', vendor:'語音通 AI', vendorId:null, teacherId:'T1002', classId:'2b', groupId:'core', group:'核心組（5 人）· 中二乙班', headcount:5,
   tool:'AI 朗讀評測（試用版）', status:'declined', expiresAt:null, origin:'vendor',
   declineReason:'試用期內評語準確度不足，未能分辨聲調錯誤與地道口音差異。', cooldownUntil:'2026-11-05', declinedBy:'it'},
  {id:'t3', vendor:'智寫科技', vendorId:'zhixie', teacherId:'T1001', classId:'2b', groupId:'support', group:'支援組（2 人）· 中二乙班', headcount:2,
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
const VENDOR_PLANS = {
  zhixie:  {plan:'Basic 方案',    teacherCap:4, studentCap:20,  renewal:'2026-09-30'},
  diandu:  {plan:'Standard 方案', teacherCap:8, studentCap:40,  renewal:'2026-08-15'},
};

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
function capacityCheck(vendorId, addStudents){
  const plan = VENDOR_PLANS[vendorId];
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
