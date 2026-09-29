(function(){
'use strict';
var root=document.documentElement;

/* ── DOM (static, present with motion on or off) ── */
var strip=document.querySelector('.credentials-strip');
if(strip&&!document.querySelector('.m-ticker')){
  var items=['<em>MBA Olympics</em> Gold Medalist, 2026','National finalist, <em>AJIO</em> case competition','Competed in <em>L’Oréal Brandstorm</em>','<em>S$4.5M</em> partner sales pipeline','National Championship <em>gold</em>, 2020','<em>₹70 lakh+</em> annual revenue as a founder','GMAT <em>750</em>','Career Ambassador, <em>ESSEC</em>'];
  var set='<div class="m-ticker-set">'+items.map(function(t){return '<span><b>'+t+'</b></span>';}).join('')+'</div>';
  var wrap=document.createElement('div');wrap.className='container';
  wrap.innerHTML='<div class="m-ticker" role="region" aria-label="Highlights"><div class="m-ticker-track">'+set+set.replace('class="m-ticker-set"','class="m-ticker-set" aria-hidden="true"')+'</div></div>';
  strip.parentNode.parentNode.insertBefore(wrap,strip.parentNode.nextSibling);
}
if(!window.gsap||!window.ScrollTrigger)return;
var ctx=null,ac=null;
function on(){return root.classList.contains('gsap-on');}

function build(first){
  if(ctx||!on())return;
  ac=new AbortController();var sig={signal:ac.signal,passive:true};
  var delay=first&&document.querySelector('.m-loader')?(window.__prCurtain||1.15)+.45:.2;
  ctx=gsap.context(function(){
    /* proof ticker: endless, speeds up with scroll, eases off on hover */
    var track=document.querySelector('.m-ticker-track');
    if(track){
      gsap.from('.m-ticker',{opacity:0,y:16,duration:1.2,ease:'expo.out',delay:delay+.9});
      var loop=gsap.to(track,{xPercent:-50,ease:'none',duration:46,repeat:-1});
      var base=1,settle=null,tk=document.querySelector('.m-ticker');
      /* one speed tween at a time: scroll nudges it faster, then it eases back to its own pace */
      ScrollTrigger.create({onUpdate:function(s){
        var v=Math.abs(gsap.utils.clamp(-5,5,s.getVelocity()/260));if(v<.05)return;
        gsap.to(loop,{timeScale:base*(1+v),duration:.25,ease:'power2.out',overwrite:true});
        if(settle)settle.kill();
        settle=gsap.delayedCall(.3,function(){gsap.to(loop,{timeScale:base,duration:1.2,ease:'power2.out',overwrite:true});});
      }});
      /* the loop only runs while it can be seen */
      ScrollTrigger.create({trigger:tk,start:'top bottom',end:'bottom top',onToggle:function(s){s.isActive?loop.resume():loop.pause();}});
      tk.addEventListener('pointerenter',function(){base=.25;if(settle)settle.kill();gsap.to(loop,{timeScale:.25,duration:.6,ease:'power2.out',overwrite:true});},sig);
      tk.addEventListener('pointerleave',function(){base=1;gsap.to(loop,{timeScale:1,duration:.8,ease:'power2.out',overwrite:true});},sig);
    }

  });
}
function kill(){if(ac){ac.abort();ac=null;}if(ctx){ctx.revert();ctx=null;}}
var t=document.getElementById('motion-toggle');
if(t)t.addEventListener('click',function(){setTimeout(function(){
  if(root.classList.contains('no-motion')){kill();return;}
  var tries=0;(function wait(){if(on()){build(false);ScrollTrigger.refresh();}else if(tries++<20)setTimeout(wait,50);})();
},30);});
build(true);
if(window.ScrollTrigger)ScrollTrigger.refresh();
})();
