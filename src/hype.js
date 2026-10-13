/* The energy layer: a cursor that answers, a name that reacts to the pointer, headings and photos
   that lean with the speed of the scroll, eyebrows that decode as they arrive, dark sections that
   open out of a card, and a film grain over everything. Layout and copy are untouched; with motion
   off or reduced motion asked for, none of it runs. */
(function(){
'use strict';
var root=document.documentElement;
if(!window.gsap||!window.ScrollTrigger)return;
var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
var ctx=null,ac=null,made=[];
function on(){return root.classList.contains('gsap-on');}
function el(tag,cls,parent){var e=document.createElement(tag);e.className=cls;e.setAttribute('aria-hidden','true');(parent||document.body).appendChild(e);made.push(e);return e;}

/* film grain: one noise tile drawn once, shifted a few times a second */
var grainURL=null;
function grain(){
  if(!grainURL){
    var c=document.createElement('canvas');c.width=c.height=160;var g=c.getContext('2d'),d=g.createImageData(160,160);
    for(var i=0;i<d.data.length;i+=4){var v=Math.random()*255|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}
    g.putImageData(d,0,0);grainURL=c.toDataURL('image/png');
  }
  el('div','h-grain').style.backgroundImage='url('+grainURL+')';
}

/* the hero name, split into letters once (text stays readable: the h1 keeps an aria-label) */
function splitName(){
  var h1=document.querySelector('.hero h1');if(!h1)return [];
  if(!h1.dataset.split){
    h1.setAttribute('aria-label',(h1.innerText||h1.textContent).replace(/\s+/g,' ').trim());
    var walk=function(n){
      Array.prototype.slice.call(n.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var f=document.createDocumentFragment();
          c.textContent.split('').forEach(function(ch){
            if(/\s/.test(ch)){f.appendChild(document.createTextNode(ch));return;}
            var s=document.createElement('span');s.className='h-ch';s.setAttribute('aria-hidden','true');s.textContent=ch;f.appendChild(s);
          });
          n.replaceChild(f,c);
        }else if(c.nodeType===1&&c.tagName!=='BR')walk(c);
      });
    };
    walk(h1);h1.dataset.split='1';
  }
  return Array.prototype.slice.call(h1.querySelectorAll('.h-ch'));
}

var SCR='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/';
function scramble(node,dur){
  var target=node.dataset.text||(node.dataset.text=node.textContent);
  if(!node.getAttribute('aria-label'))node.setAttribute('aria-label',target);
  var o={p:0};
  return gsap.to(o,{p:1,duration:dur,ease:'none',onUpdate:function(){
    var n=Math.floor(o.p*target.length),out=target.slice(0,n);
    for(var i=n;i<target.length;i++)out+=(target[i]===' '?' ':SCR[Math.random()*SCR.length|0]);
    node.textContent=out;
  },onComplete:function(){node.textContent=target;}});
}

function build(first){
  if(ctx||!on())return;
  ac=new AbortController();var sig={signal:ac.signal,passive:true};
  var settle=first&&document.querySelector('.m-loader')?(window.__prCurtain||1.15)+2.4:0;
  ctx=gsap.context(function(){
    grain();

    /* ── dark sections open out of a rounded card as they arrive ── */
    var narrow=innerWidth<760;
    document.querySelectorAll('.sport-section, .contact-section').forEach(function(s){
      gsap.fromTo(s,{clipPath:narrow?'inset(2% 3% 0% 3% round 22px)':'inset(5% 4% 0% 4% round 36px)'},
        {clipPath:'inset(0% 0% 0% 0% round 0px)',ease:'none',scrollTrigger:{trigger:s,start:'top bottom',end:'top 25%',scrub:.5}});
    });

    /* ── eyebrows decode as their section arrives ── */
    document.querySelectorAll('.section-head .eyebrow, .contact-grid .eyebrow').forEach(function(e){
      ScrollTrigger.create({trigger:e,start:'top 85%',once:true,onEnter:function(){scramble(e,.9);}});
    });

    /* ── scroll speed bends headings and photos; they straighten as the page slows ── */
    var bend=gsap.utils.toArray('.section-head h2, .photo-pair, .education-grid, .sport-record, .contact-grid h2');
    if(bend.length){
      var setK=gsap.quickSetter(bend,'skewY','deg'),k={v:0},back=null;
      var apply=function(){setK(k.v);};
      ScrollTrigger.create({onUpdate:function(s){
        var t=gsap.utils.clamp(-4.5,4.5,s.getVelocity()/-420);
        if(Math.abs(t)<.15)return;
        gsap.to(k,{v:t,duration:.35,ease:'power3.out',overwrite:true,onUpdate:apply});
        if(back)back.kill();
        back=gsap.delayedCall(.12,function(){gsap.to(k,{v:0,duration:.9,ease:'elastic.out(1,.55)',overwrite:true,onUpdate:apply});});
      }});
    }

    /* ── the hero name answers the pointer: nearby letters lift and tip toward it ── */
    var chars=splitName(),h1=document.querySelector('.hero h1');
    if(fine&&chars.length&&h1){
      var R=260,live=false,qs=chars.map(function(c){return {
        y:gsap.quickTo(c,'y',{duration:.55,ease:'power3'}),
        r:gsap.quickTo(c,'rotation',{duration:.55,ease:'power3'}),
        s:gsap.quickTo(c,'scale',{duration:.55,ease:'power3'})};});
      var pos=[];
      var measure=function(){var hr=h1.getBoundingClientRect();pos=chars.map(function(c){var r=c.getBoundingClientRect();return {x:r.left-hr.left+r.width/2,y:r.top-hr.top+r.height/2};});};
      var calm=function(){qs.forEach(function(q){q.y(0);q.r(0);q.s(1);});};
      gsap.delayedCall(settle,function(){h1.classList.add('h-free');measure();live=true;});
      addEventListener('resize',function(){if(live)measure();},sig);
      var hero=document.querySelector('.hero');
      hero.addEventListener('pointermove',function(e){
        if(!live)return;
        var hr=h1.getBoundingClientRect(),px=e.clientX-hr.left,py=e.clientY-hr.top;
        for(var i=0;i<pos.length;i++){
          var dx=pos[i].x-px,dy=pos[i].y-py,d=Math.sqrt(dx*dx+dy*dy),f=d<R?Math.pow(1-d/R,2):0;
          qs[i].y(-30*f);qs[i].r((dx/R)*-16*f);qs[i].s(1+.16*f);
        }
      },sig);
      hero.addEventListener('pointerleave',calm,sig);
    }

    /* ── cursor: a ring that trails the pointer, swells over anything you can press,
          and steps aside for the photo badge ── */
    if(fine){
      var ring=el('div','h-ring'),dot=el('div','h-dot');
      var rx=gsap.quickTo(ring,'x',{duration:.45,ease:'power3'}),ry=gsap.quickTo(ring,'y',{duration:.45,ease:'power3'});
      var dx_=gsap.quickTo(dot,'x',{duration:.08,ease:'power2'}),dy_=gsap.quickTo(dot,'y',{duration:.08,ease:'power2'});
      var shown=false,state='';
      var setState=function(s){
        if(s===state)return;state=s;
        gsap.to(ring,{scale:s==='press'?1.75:s==='photo'?.4:1,opacity:s==='photo'?0:1,duration:.35,ease:'power3.out',overwrite:'auto'});
        gsap.to(dot,{scale:s==='press'?0:1,opacity:s==='photo'?0:1,duration:.25,ease:'power3.out',overwrite:'auto'});
      };
      addEventListener('pointermove',function(e){
        if(e.pointerType&&e.pointerType!=='mouse')return;
        rx(e.clientX);ry(e.clientY);dx_(e.clientX);dy_(e.clientY);
        if(!shown){shown=true;gsap.set([ring,dot],{x:e.clientX,y:e.clientY});gsap.to([ring,dot],{autoAlpha:1,duration:.3});}
        var t=e.target&&e.target.closest?e.target:null;
        setState(t&&t.closest('.image-frame')?'photo':t&&t.closest('a, button, summary, [role="button"], .project-card')?'press':'');
      },sig);
      document.addEventListener('pointerleave',function(){shown=false;gsap.to([ring,dot],{autoAlpha:0,duration:.25});},sig);
      addEventListener('pointerdown',function(){gsap.to(ring,{scale:'-=.25',duration:.12,ease:'power2.out'});},sig);
      addEventListener('pointerup',function(){var s=state;state='?';setState(s);},sig);
    }
  });
}
function kill(){
  if(ac){ac.abort();ac=null;}
  if(ctx){ctx.revert();ctx=null;}
  made.forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});made=[];
  var h1=document.querySelector('.hero h1');if(h1)h1.classList.remove('h-free');
  document.querySelectorAll('[data-text]').forEach(function(e){e.textContent=e.dataset.text;});
}
var t=document.getElementById('motion-toggle');
if(t)t.addEventListener('click',function(){setTimeout(function(){
  if(root.classList.contains('no-motion')){kill();return;}
  var tries=0;(function wait(){if(on()){build(false);ScrollTrigger.refresh();}else if(tries++<20)setTimeout(wait,50);})();
},30);});
build(true);
})();
