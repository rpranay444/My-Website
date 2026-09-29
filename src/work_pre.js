(function(){
'use strict';
var P=window.PR_PROJECTS,C=window.PR_CAPS,S=window.PR_SETS;
var SHAPES={
  role:'<svg class="mk" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.5" fill="currentColor"/></svg>',
  client:'<svg class="mk" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0 10 5 5 10 0 5Z" fill="currentColor"/></svg>',
  comp:'<svg class="mk" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 .5 9.8 9.3H.2Z" fill="currentColor"/></svg>',
  grad:'<svg class="mk" viewBox="0 0 10 10" aria-hidden="true"><rect x=".8" y=".8" width="8.4" height="8.4" fill="currentColor"/></svg>'
};
window.PR_SHAPES=SHAPES;
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function capName(id){for(var i=0;i<C.length;i++)if(C[i].id===id)return C[i].name;return '';}
function setName(id){for(var i=0;i<S.length;i++)if(S[i].id===id)return S[i].name;return '';}

/* ── case files ── */
var list=document.getElementById('cf-grid');
list.innerHTML=P.map(function(p,i){
  var wide=p.fact.length>6?' proof-wide':'';
  return '<article class="project-card reveal" data-id="'+p.id+'" data-cap="'+p.cap+'" data-set="'+p.set+'">'+
   '<div class="project-banner"><div class="card-top"><span class="eyebrow">'+SHAPES[p.set]+esc(p.label)+'</span><span class="index">'+String(i+1).padStart(2,'0')+'</span></div>'+
   '<div class="project-proof'+wide+'"><strong>'+esc(p.fact)+'</strong><span>'+esc(p.unit)+'</span></div></div>'+
   '<div class="project-card-body"><h3>'+esc(p.title)+'</h3><p class="project-xyz">'+esc(p.summary)+'</p>'+
   '<p class="project-use"><span>The brief</span>'+esc(p.question)+'</p>'+
   '<div class="project-methods" aria-label="Methods">'+p.method.map(function(m){return '<span>'+esc(m)+'</span>';}).join('')+'</div>'+
   '<div class="card-bottom"><span class="project-status">'+esc(capName(p.cap))+'</span><button class="case-button" data-project="'+p.id+'" aria-label="View project: '+esc(p.title)+'">View project <span aria-hidden="true">↗</span></button></div></div></article>';
}).join('');

/* ── filtering + rail ── */
var state={cap:'all'};
var cards=[].slice.call(list.children);
var capBtns=[].slice.call(document.querySelectorAll('[data-cf-cap]'));
var pos=document.getElementById('cf-pos'),prev=document.getElementById('cf-prev'),next=document.getElementById('cf-next'),bar=document.getElementById('cf-bar');
var root=document.documentElement;
function shown(){return cards.filter(function(c){return !c.hidden;});}
function step(){var s=shown();if(s.length<2)return list.clientWidth;return s[1].offsetLeft-s[0].offsetLeft;}
function update(){
  var s=shown(),n=s.length,max=list.scrollWidth-list.clientWidth;
  var w=step(),first=w?Math.round(list.scrollLeft/w):0,per=w?Math.max(1,Math.round((list.clientWidth+24)/w)):1;
  first=Math.min(first,Math.max(0,n-per));
  var last=Math.min(n,first+per);
  pos.textContent=n?(String(first+1).padStart(2,'0')+(last>first+1?' to '+String(last).padStart(2,'0'):'')+' of '+String(n).padStart(2,'0')):'None';
  prev.disabled=list.scrollLeft<=2;next.disabled=list.scrollLeft>=max-2||max<=0;
  var vis=max>0?list.clientWidth/list.scrollWidth:1;
  var bw=(vis*100).toFixed(2)+'%';if(bar.style.width!==bw)bar.style.width=bw;
  bar.style.transform='translateX('+(max>0?(list.scrollLeft/max)*(1/vis-1)*100:0)+'%)';
}
function apply(animate){
  cards.forEach(function(el){el.hidden=!(state.cap==='all'||el.dataset.cap===state.cap);el.classList.add('visible');});
  shown().forEach(function(el,i){el.classList.toggle('alt',i%2===1);});
  capBtns.forEach(function(b){var on=b.dataset.cfCap===state.cap;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  list.scrollLeft=0;update();
  if(animate&&window.gsap&&root.classList.contains('gsap-on')){
    gsap.fromTo(shown().slice(0,4),{opacity:0,x:40},{opacity:1,x:0,duration:.6,ease:'expo.out',stagger:.05,overwrite:'auto',clearProps:'opacity,transform'});
  }
  if(window.ScrollTrigger)ScrollTrigger.refresh();
}
capBtns.forEach(function(b){b.addEventListener('click',function(){state.cap=b.dataset.cfCap;apply(true);});});
function go(d){list.scrollBy({left:d*Math.max(step(),list.clientWidth-40),behavior:root.classList.contains('no-motion')?'auto':'smooth'});}
prev.addEventListener('click',function(){go(-1);});next.addEventListener('click',function(){go(1);});
var raf=0;list.addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;update();});},{passive:true});
addEventListener('resize',update);
list.addEventListener('keydown',function(e){if(e.target!==list)return;if(e.key==='ArrowRight'){e.preventDefault();go(1);}if(e.key==='ArrowLeft'){e.preventDefault();go(-1);}});

/* drag to scroll with a mouse */
var drag=null,moved=false;
list.addEventListener('pointerdown',function(e){
  if(e.pointerType!=='mouse'||e.button!==0)return;
  drag={x:e.clientX,left:list.scrollLeft};moved=false;
});
addEventListener('pointermove',function(e){
  if(!drag)return;var dx=e.clientX-drag.x;
  if(!moved&&Math.abs(dx)>6){moved=true;list.classList.add('dragging');}
  if(moved){list.scrollLeft=drag.left-dx;e.preventDefault();}
});
addEventListener('pointerup',function(){
  if(!drag)return;drag=null;
  if(moved){list.classList.remove('dragging');var w=step();if(w)list.scrollTo({left:Math.round(list.scrollLeft/w)*w,behavior:'smooth'});}
});
list.addEventListener('click',function(e){if(moved){e.stopPropagation();e.preventDefault();moved=false;}},true);
list.addEventListener('dragstart',function(e){e.preventDefault();});

apply(false);
})();
