(() => {
 const slide=document.getElementById('animation'),frame=slide?.querySelector('.learning-frame');
 if(!frame)return;
 const week=Number(frame.dataset.week);
 function sync(){const active=Reveal.getCurrentSlide()===slide;document.body.classList.toggle('learning-lab-active',active);if(!active)frame.contentWindow?.postMessage({type:'learning-lab-pause'},window.location.origin);}
 Reveal.on('ready',sync);Reveal.on('slidechanged',sync);if(Reveal.isReady())sync();
 window.addEventListener('message',e=>{if(e.origin!==window.location.origin||e.source!==frame.contentWindow||Reveal.getCurrentSlide()!==slide)return;if(e.data?.type==='learning-lab-return'&&e.data.week===week)window.location.hash='/learning-return';});
})();
