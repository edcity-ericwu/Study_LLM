/* ── unsplash.js ─────────────────────────────────────────────────────────
 * Photographs for generated worksheets.
 *
 * Why Unsplash and not an image search: their licence grants "an irrevocable,
 * nonexclusive, worldwide copyright license to download, copy, modify,
 * distribute, perform, and use images … including for commercial purposes,
 * without permission from or attributing the photographer" (unsplash.com/license,
 * checked 2026-08-21). Unsplash holds the licence relationship with its
 * contributors, so the grant is theirs to make.
 *
 * Openverse was considered first and rejected on its own words: "Openverse does
 * not verify licensing information for individual works … Please independently
 * verify the licensing status before reusing the content." That does not remove
 * the rights problem, it moves it onto a teacher printing 35 copies under
 * EdCity's name. See the Decision Log, 2026-08-21.
 *
 * Files are held locally rather than fetched from the API at render time. The
 * licence permits it, and a demo that depends on a live third-party call is a
 * demo that fails on bad conference wifi. Swapping to api.unsplash.com later is
 * a small change — replace pick() with a fetch and keep figure() as it is.
 *
 * TO POPULATE: drop the files named below into img/ . Until then the worksheet
 * shows a labelled placeholder rather than a broken image, which is an honest
 * state and not a silent failure.
 */
(function(){
  'use strict';

  /* Chosen to suit the demo topics rather than to be a general library.
   * `credit` and `link` are printed under the image on the worksheet. */
  var LIBRARY = [
    { file:'img/reading-window.jpg',  credit:'Photo by Nong V on Unsplash',
      link:'https://unsplash.com/photos/9pw4TKvT3po',
      tags:['story','stories','reading','short story','book','literature','window'] },
    { file:'img/old-town-street.jpg', credit:'Photo by Jack Anstey on Unsplash',
      link:'https://unsplash.com/photos/zS4lUqLEiNA',
      tags:['setting','place','travel','culture','world','city','street'] },
    { file:'img/writing-desk.jpg',    credit:'Photo by Green Chameleon on Unsplash',
      link:'https://unsplash.com/photos/s9CC2SKySJM',
      tags:['writing','essay','argument','composition','response','desk'] },
    { file:'img/conversation.jpg',    credit:'Photo by Priscilla Du Preez on Unsplash',
      link:'https://unsplash.com/photos/nF8xhLMmg0c',
      tags:['conversation','speaking','directions','dialogue','discussion'] }
  ];

  /* Crude on purpose: a keyword match over the topic. The real version asks the
   * API. What matters for the prototype is that the image is chosen FROM a
   * cleared set, never from an open-web search. */
  function pick(topic){
    var t = (topic || '').toLowerCase();
    var best = null, score = 0;
    LIBRARY.forEach(function(item){
      var n = item.tags.filter(function(tag){ return t.indexOf(tag) !== -1; }).length;
      if(n > score){ score = n; best = item; }
    });
    return best || LIBRARY[0];
  }

  /* Attribution is printed even though the licence does not require it —
   * Unsplash asks for it, and a worksheet that names its sources is one a
   * teacher can defend if a parent asks where the picture came from. */
  function figure(item, caption){
    if(!item) return '';
    return '<div class="figure">' +
      '<img src="' + item.file + '" alt="" ' +
      'onerror="this.outerHTML=\'<div class=&quot;ph&quot;>Image not in this build — ' +
      'add ' + item.file + '</div>\'">' +
      '<div class="cap">' + (caption ? caption + '<br>' : '') +
      item.credit + ' · Unsplash licence</div>' +
      '</div>';
  }

  window.Unsplash = { LIBRARY: LIBRARY, pick: pick, figure: figure };
})();
