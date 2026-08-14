(function(){
  var v=document.getElementById('spin'), b=document.getElementById('spinBtn');
  if(!v||!b) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ v.removeAttribute('autoplay'); v.pause(); b.innerHTML='&#9654;'; }
  b.onclick=function(){ if(v.paused){ v.play(); b.innerHTML='&#10074;&#10074;'; b.setAttribute('aria-label','Pause video'); }
                        else { v.pause(); b.innerHTML='&#9654;'; b.setAttribute('aria-label','Play video'); } };
  if(window.IntersectionObserver) new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){ if(b.getAttribute('aria-label')!=='Play video') v.play().catch(function(){}); } else v.pause(); });},
    {threshold:.2}).observe(v);
  document.addEventListener('visibilitychange',function(){ if(document.hidden) v.pause();
    else if(b.getAttribute('aria-label')!=='Play video') v.play().catch(function(){}); });
})();
