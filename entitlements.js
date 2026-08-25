/* ── entitlements.js ─────────────────────────────────────────────────────
 * Who in this school is allowed to use which tool.
 *
 * Built 2026-08-25 for the provisioning workflow: a school buys a tool offline,
 * the IT coordinator enters the licence key, gives seats to named teachers, and
 * those teachers find the tool waiting in EdCity.ai.
 *
 * ── the decision this file encodes ──────────────────────────────────────
 * The prototype already told a story about acquisition — 訂閱管理's budget path
 * (預算建議書 → 已獲批預算 → 轉為訂閱 → 供應商協議). A licence key is a SECOND
 * DOOR INTO THE SAME ROOM, not a parallel system (Eric, 2026-08-25). Two
 * acquisition paths producing two kinds of record would give the demo two
 * answers to "how does a school get a tool?", and the first person to ask would
 * find both.
 *
 * So: one record, `source` is the only field that differs.
 *
 * ── what this is NOT ────────────────────────────────────────────────────
 * Not a replacement for VENDOR_PLANS in vendor-data.js. That models seat
 * CAPACITY per vendor per school, and it is already wired into the seat-usage
 * view, the data-access console and the trial flow. This models ENTITLEMENT:
 * which named people hold a seat for which tool.
 *
 * The two are deliberately different grains, and the difference is real rather
 * than an accident of history:
 *   VENDOR_PLANS  — "墨言科技 sold us 4 teacher seats"      (commercial)
 *   entitlements  — "陳凱怡 can open 寫作歷程分析"           (access)
 * A vendor plan can back several tool entitlements. `seatsFor()` hides which
 * side a number came from, so callers never have to know.
 *
 * ── vetting ─────────────────────────────────────────────────────────────
 * A key bought offline bypasses vetting.html's compliance gate entirely.
 * That is a DELIBERATE story (Eric, 2026-08-25): schools may buy direct and
 * EdCity does not gatekeep it. Recorded here because it will be asked about,
 * and because `source:'key'` is what a future compliance view would filter on.
 */
(function(){
  'use strict';

  var KEY = 'entitlements';

  /* Seeded so the admin's page is not empty on first visit, and so there is a
   * procured record to contrast the keyed one against. Written in ONCE, then
   * appended to — the same shape as materials.js, and for the same reason: as
   * a fallback it would be wiped by the first save. */
  var SEED = [
    /* Arrived through the budget path. No key, because nobody typed one — the
     * subscription was brokered by EdCity. */
    {tool:'diandu-reading', name:'中文分級閱讀庫', vendor:'點讀教育', vendorId:'diandu',
     source:'procured', key:null, seats:8, expires:'2027-08-31',
     assigned:['T1001','T1005'], at:'2026-06-02'}
  ];

  /* Named-annual, expiring 31 August — the seat year every HK school already
   * plans around, and the same expiry vendor-data.js uses. */
  var SEAT_YEAR_END = '2027-08-31';

  function read(){
    if(DemoState.get(KEY, null) === null) DemoState.set(KEY, SEED.slice());
    return DemoState.get(KEY, null) || [];
  }
  function write(list){ DemoState.set(KEY, list); }

  /* ── licence keys ──────────────────────────────────────────────────────
   * A prototype cannot verify a key against anything. It should LOOK like it
   * checks — a teacher's confidence in the flow depends on it behaving like a
   * real field — and it must never claim to have verified. The UI says so; this
   * function only checks shape.
   *
   * Format mirrors trial-invites.html's alphabet, which already excludes
   * I, O, 0 and 1 because these strings get read aloud and typed back. */
  var KEY_RE = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

  /* The keys the demo recognises. A real system would ask the vendor. Kept
   * tiny and obvious rather than random, so a walkthrough can be repeated. */
  /* Both of these must satisfy KEY_RE. The first pair written here did not —
   * 'MYAN-KEJI-2026' contains I and 0, the two characters the alphabet exists
   * to exclude — so every valid key was rejected as malformed. Caught by the
   * test, not by reading. There is now an assertion below that no demo key can
   * fail the format it is meant to demonstrate. */
  var KNOWN_KEYS = {
    'MYAN-TECH-2578': {tool:'writing-analytics', name:'寫作歷程分析', vendor:'墨言科技',
                       vendorId:'zhixie', seats:40, expires:SEAT_YEAR_END},
    'DDUK-BANK-3492': {tool:'qbank-chi',        name:'閱讀理解出題助手', vendor:'點讀教育',
                       vendorId:'diandu',  seats:12, expires:SEAT_YEAR_END}
  };

  /* A demo key that cannot pass the demo's own validator is a walkthrough that
   * dies on stage. Checked at load, loudly, rather than left to be discovered. */
  Object.keys(KNOWN_KEYS).forEach(function(k){
    if(!KEY_RE.test(k) && window.console) console.error('entitlements.js: demo key ' + k + ' fails KEY_RE');
  });

  var Entitlements = {

    SEAT_YEAR_END: SEAT_YEAR_END,
    KNOWN_KEYS: KNOWN_KEYS,

    all: function(){ return read(); },

    get: function(toolId){
      var found = null;
      read().forEach(function(e){ if(e.tool === toolId) found = e; });
      return found;
    },

    /* ── redeeming a key ────────────────────────────────────────────────
     * Returns {ok, reason, entitlement}. Three failures worth telling apart,
     * because the admin's next action differs for each:
     *   malformed  — he mistyped; let him retry
     *   unknown    — the key is not for this platform; contact the vendor
     *   duplicate  — already redeemed; he should be looking at seats, not keys
     */
    redeem: function(raw){
      var k = String(raw || '').trim().toUpperCase();
      if(!KEY_RE.test(k)) return {ok:false, reason:'malformed'};

      var spec = KNOWN_KEYS[k];
      if(!spec) return {ok:false, reason:'unknown'};

      if(Entitlements.get(spec.tool)) return {ok:false, reason:'duplicate'};

      var rec = {
        tool: spec.tool, name: spec.name, vendor: spec.vendor, vendorId: spec.vendorId,
        source: 'key',
        /* Stored masked. A licence key is a bearer credential — there is no
         * reason for a console to print one back in full, and every reason not
         * to once someone screenshots the page. */
        key: k.slice(0, 4) + '-••••-' + k.slice(-4),
        seats: spec.seats, expires: spec.expires,
        /* The state that matters most: owned, and given to nobody. This is
         * where a real admin gets stuck, and where a demo usually cheats. */
        assigned: [],
        at: new Date().toISOString().slice(0, 10)
      };
      var list = read();
      list.unshift(rec);
      write(list);
      return {ok:true, entitlement:rec};
    },

    /* ── seats ──────────────────────────────────────────────────────────
     * Callers ask "how many seats does this tool have" without needing to know
     * whether the answer came from a licence key or from a vendor plan. */
    seatsFor: function(toolId){
      var e = Entitlements.get(toolId);
      if(!e) return 0;
      if(e.seats != null) return e.seats;
      /* Procured tools inherit the cap negotiated with the vendor. */
      var plan = (typeof planFor === 'function') ? planFor(e.vendorId) : null;
      return plan ? plan.teacherCap : 0;
    },

    remaining: function(toolId){
      var e = Entitlements.get(toolId);
      if(!e) return 0;
      return Math.max(0, Entitlements.seatsFor(toolId) - e.assigned.length);
    },

    /* ── assignment ─────────────────────────────────────────────────────
     * Idempotent on purpose: assigning a teacher who already has a seat is not
     * an error and must not consume a second one. The seat-list UI toggles
     * checkboxes, and a double-fire there should never cost the school money.
     */
    assign: function(toolId, teacherIds){
      var list = read(), changed = 0, refused = 0;
      list.forEach(function(e){
        if(e.tool !== toolId) return;
        (teacherIds || []).forEach(function(id){
          if(e.assigned.indexOf(id) >= 0) return;
          if(e.assigned.length >= Entitlements.seatsFor(toolId)){ refused++; return; }
          e.assigned.push(id);
          changed++;
        });
      });
      write(list);
      return {added:changed, refused:refused};
    },

    unassign: function(toolId, teacherIds){
      var list = read(), removed = 0;
      list.forEach(function(e){
        if(e.tool !== toolId) return;
        (teacherIds || []).forEach(function(id){
          var i = e.assigned.indexOf(id);
          if(i >= 0){ e.assigned.splice(i, 1); removed++; }
        });
      });
      write(list);
      return removed;
    },

    /* ── the teacher's question ─────────────────────────────────────────
     * "Can I open this?" — the one thing EdCity.ai needs to know. Everything
     * above exists so that this can be a single honest call rather than a
     * hardcoded label on a catalogue entry. */
    hasAccess: function(toolId, teacherId){
      var e = Entitlements.get(toolId);
      return !!(e && e.assigned.indexOf(teacherId) >= 0);
    },

    /* Which tools a given teacher can open. Drives the assistant's list. */
    forTeacher: function(teacherId){
      return read().filter(function(e){ return e.assigned.indexOf(teacherId) >= 0; });
    },

    /* Owned but given to nobody — surfaced on the admin page, because a
     * licence sitting unassigned is money spent for no effect and nothing else
     * on the platform would ever mention it. */
    unassigned: function(){
      return read().filter(function(e){ return e.assigned.length === 0; });
    },

    clear: function(){ write([]); }
  };

  window.Entitlements = Entitlements;
})();
