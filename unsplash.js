/* ── unsplash.js ─────────────────────────────────────────────────────────
 * Photographs for generated worksheets.
 *
 * Why Unsplash: their licence grants "an irrevocable, nonexclusive, worldwide
 * copyright license to download, copy, modify, distribute, perform, and use
 * images … including for commercial purposes, without permission from or
 * attributing the photographer" (unsplash.com/license, checked 2026-08-21).
 * Unsplash holds the licence relationship with its own contributors, so the
 * grant is theirs to make.
 *
 * Openverse was considered first and rejected on its own words: "Openverse does
 * not verify licensing information for individual works … Please independently
 * verify the licensing status before reusing the content." That does not remove
 * the rights problem, it moves it onto a teacher printing 35 copies under
 * EdCity's name. An EdCity-owned source was considered before that and does not
 * exist — EMM is a video library. See the Decision Log, 2026-08-21.
 *
 * These are hot-linked from Unsplash's own CDN rather than copied into the
 * repository: it needs no API key, no build step and no files to keep in sync,
 * and images.unsplash.com is what the CDN is for. The URLs and photographer
 * credits below were read off Unsplash on 2026-08-21, not recalled.
 *
 * Every entry is a FREE Unsplash photo. Nothing from plus.unsplash.com is used
 * anywhere here — that is Unsplash+, a paid catalogue the free licence above
 * does not cover, and mixing the two is exactly how a rights problem gets in.
 *
 * Offline: if the CDN cannot be reached the figure degrades to a labelled note
 * rather than a broken image icon.
 */
(function(){
  'use strict';

  var CDN = 'https://images.unsplash.com/';
  var OPT = '?fm=jpg&q=70&w=900&auto=format&fit=crop';

  var LIBRARY = [
    { id:'photo-1541963463532-d68292c34b19',
      credit:'Kourosh Qaffari',
      link:'https://unsplash.com/photos/person-holding-open-book-viewing-mountain-view-RrhhzitYizg',
      alt:'A person holding an open book, looking out over a mountain view',
      tags:['world','setting','place','travel','culture','explore','exploring','mountain'] },

    { id:'photo-1610116306796-6fea9f4fae38',
      credit:'Gülfer ERGİN',
      link:'https://unsplash.com/photos/pile-of-open-paperback-books-LUGuCtvlk1Q',
      alt:'A pile of open paperback books',
      tags:['story','stories','short story','reading','book','books','literature','narrative'] },

    { id:'photo-1517770413964-df8ca61194a6',
      credit:'Jonas Jacobsson',
      link:'https://unsplash.com/photos/bokeh-photography-of-open-book-0FRJ2SCuY4k',
      alt:'An open book photographed with a soft, blurred background',
      tags:['writing','essay','argument','composition','response','poem','poetry'] },

    { id:'photo-1497633762265-9d179a990aa6',
      credit:'Kimberly Farmer',
      link:'https://unsplash.com/photos/shallow-focus-photography-of-books-lUaaKCUANVI',
      alt:'A shelf of books in shallow focus',
      tags:['conversation','speaking','directions','dialogue','discussion','library'] }
  ];

  function url(item){ return CDN + item.id + OPT; }

  /* A keyword match over the topic. The real version would ask the API; what
   * matters for the prototype is that the image is chosen FROM a cleared set
   * and never from an open-web image search. */
  function pick(topic){
    var t = (topic || '').toLowerCase();
    var best = null, score = 0;
    LIBRARY.forEach(function(item){
      var n = item.tags.filter(function(tag){ return t.indexOf(tag) !== -1; }).length;
      if(n > score){ score = n; best = item; }
    });
    return best || LIBRARY[0];
  }

  /* Attribution is printed although the licence does not require it. Unsplash
   * asks for it, and a worksheet that names its sources is one a teacher can
   * defend if a parent asks where the picture came from. */
  function figure(item, caption){
    if(!item) return '';
    var fallback = 'Image unavailable offline — ' + item.credit + ' on Unsplash';
    return '<div class="figure">' +
      '<img src="' + url(item) + '" alt="' + item.alt + '" loading="lazy" ' +
      'onerror="this.outerHTML=\'<div class=&quot;ph&quot;>' + fallback + '</div>\'">' +
      '<div class="cap">' + (caption ? caption + '<br>' : '') +
      'Photo by ' + item.credit + ' on Unsplash · free to use under the Unsplash licence' +
      '</div></div>';
  }

  window.Unsplash = { LIBRARY: LIBRARY, pick: pick, url: url, figure: figure };
})();
