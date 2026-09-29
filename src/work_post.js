(function(){
'use strict';
if(!window.gsap||!window.ScrollTrigger)return;
var root=document.documentElement,ctx=null;
function on(){return root.classList.contains('gsap-on');}
function build(){
  if(ctx||!on())return;
  ctx=gsap.context(function(){
    gsap.fromTo('.cf-toolbar > *',{opacity:0,y:18},{opacity:1,y:0,duration:1,ease:'expo.out',stagger:.1,scrollTrigger:{trigger:'.cf-toolbar',start:'top 88%',toggleActions:'play none none none'}});
  });
}
function kill(){if(ctx){ctx.revert();ctx=null;}}
var t=document.getElementById('motion-toggle');
if(t)t.addEventListener('click',function(){setTimeout(function(){
  if(root.classList.contains('no-motion')){kill();return;}
  var tries=0;(function wait(){if(on()){build();ScrollTrigger.refresh();}else if(tries++<20)setTimeout(wait,50);})();
},30);});
build();
})();
