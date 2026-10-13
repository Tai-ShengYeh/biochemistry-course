(() => {
 document.querySelectorAll('.teaching-animation video').forEach(video => {
  ['keydown','click','pointerdown'].forEach(type => video.addEventListener(type, e => e.stopPropagation()));
 });
 if (window.Reveal) Reveal.on('slidechanged', event => {
  document.querySelectorAll('.teaching-animation video').forEach(v => {if (!event.currentSlide.contains(v)) v.pause();});
 });
})();
