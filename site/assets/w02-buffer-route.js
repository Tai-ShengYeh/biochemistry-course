(() => {
  const slide=document.getElementById('animation');
  const frame=slide.querySelector('.buffer-frame');
  function sync() {
    const active=Reveal.getCurrentSlide()===slide;
    document.body.classList.toggle('w02-buffer-active',active);
    if(!active)frame.contentWindow?.postMessage({type:'w02-buffer-pause'},window.location.origin);
  }
  Reveal.on('ready',sync);Reveal.on('slidechanged',sync);
  if(Reveal.isReady())sync();
  window.addEventListener('message',event=> {
    if(event.origin!==window.location.origin || event.source!==frame.contentWindow)return;
    if(event.data?.type==='w02-buffer-goto' && event.data.target==='blood' && Reveal.getCurrentSlide()===slide)window.location.hash='/blood';
  });
})();
