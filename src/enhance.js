(function(){
'use strict';
if(!window.gsap||!window.ScrollTrigger){var l=document.querySelector('.m-loader');if(l)l.remove();return;}
gsap.registerPlugin(ScrollTrigger);
window.__mLoaded=true;

var root=document.documentElement;
var EASE='expo.out';
var PAR=1.05;/* hero portrait rests slightly enlarged so drift and parallax never show an edge */
var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
var ctx=null,lenis=null,ac=null,tickFn=null,booted=false,sh3=null,fly=null;
function motionOn(){return !root.classList.contains('no-motion')&&!matchMedia('(prefers-reduced-motion: reduce)').matches;}

/* ── one-time DOM prep (harmless if motion is later turned off) ── */
function splitLines(el){
  if(!el||el.dataset.mSplit)return;
  var parts=el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML=parts.map(function(p){return '<span class="m-line"><span>'+p.trim()+'</span></span>';}).join('');
  el.dataset.mSplit='1';
}
document.querySelectorAll('.hero h1, .section-head h2, .contact-grid h2').forEach(splitLines);
document.querySelectorAll('.image-frame > img').forEach(function(img){
  var w=document.createElement('span');w.className='m-par';img.parentNode.insertBefore(w,img);w.appendChild(img);
});
/* pointer light: a real element moved with transforms, so the section's children never restyle */
['.sport-section','.contact-section'].forEach(function(s){var e=document.querySelector(s);if(e&&!e.querySelector(':scope > .m-glow')){e.classList.add('m-spot');e.insertAdjacentHTML('afterbegin','<span class="m-glow" aria-hidden="true"></span>');}});
document.querySelectorAll('.project-banner, .sport-record > div').forEach(function(b){if(!b.querySelector('.m-glare'))b.insertAdjacentHTML('afterbegin','<span class="m-glare" aria-hidden="true"></span>');});
/* experience rule that draws in */
document.querySelectorAll('.career-row').forEach(function(r){if(!r.querySelector('.m-rule'))r.insertAdjacentHTML('afterbegin','<span class="m-rule" aria-hidden="true"></span>');});

/* flight path in the sport section */
var sport=document.querySelector('.sport-section');
if(sport&&!sport.querySelector('.m-arc')){
  sport.insertAdjacentHTML('afterbegin',
  '<svg class="m-arc" viewBox="0 -20 820 150" aria-hidden="true" fill="none">'+
  '<path class="m-arc-ghost" d="M-10 118 C 240 -26, 560 -26, 830 96" stroke="rgba(197,156,175,.2)" stroke-width="1" stroke-dasharray="2 7"/>'+
  '<path class="m-arc-line" d="M-10 118 C 240 -26, 560 -26, 830 96" stroke="#c59caf" stroke-width="1.4" stroke-linecap="round"/>'+
  '<g class="m-sh"><path d="M0 0 L-22 -9 L-22 9 Z" fill="rgba(241,237,234,.9)"/><circle cx="2" cy="0" r="5.5" fill="#f1edea"/><circle cx="2" cy="0" r="5.5" stroke="#c59caf" stroke-width="1.4"/></g>'+
  '</svg>');
}

/* journey progress line */
var panel=document.querySelector('.milestone-panel');
var mprog=null;
if(panel&&!document.querySelector('.m-mprog')){
  panel.insertAdjacentHTML('afterend','<div class="m-mprog" aria-hidden="true"><i></i></div>');
  mprog=document.querySelector('.m-mprog i');
}else mprog=document.querySelector('.m-mprog i');

/* number parsing for count-ups */
function countable(el){
  var t=el.textContent.trim();
  var m=t.match(/^([^0-9]*?)(\d+(?:\.\d+)?)([^0-9]*)$/);
  if(!m)return null;
  var n=parseFloat(m[2]);
  if(/to|No\./.test(t))return null;
  return {pre:m[1],num:n,dec:(m[2].split('.')[1]||'').length,suf:m[3],orig:t};
}

/* photo badge */
var badge=document.createElement('div');badge.className='m-view';badge.setAttribute('aria-hidden','true');badge.textContent='View';document.body.appendChild(badge);

/* ═════════ init ═════════ */
function init(withIntro){
  if(booted||!motionOn())return;
  booted=true;
  root.classList.add('gsap-on');
  ac=new AbortController();var sig={signal:ac.signal,passive:true};

  if(window.Lenis){
    lenis=new Lenis({lerp:0.1,smoothWheel:true});
    lenis.on('scroll',ScrollTrigger.update);
    tickFn=function(t){lenis.raf(t*1000);};
    gsap.ticker.add(tickFn);gsap.ticker.lagSmoothing(0);
  }

  ctx=gsap.context(function(){
    var header=document.querySelector('.site-header');

    /* ── intro ── */
    var loader=document.querySelector('.m-loader'),R=0;
    var intro=gsap.timeline({defaults:{ease:EASE}});
    if(withIntro&&loader){
      if(lenis)lenis.stop();
      /* the serve: a 3D shuttle comes out of the distance, arcs over the wordmark and leaves past the viewer.
         With no WebGL the curtain runs the same, without the shuttle. */
      var wm=loader.querySelectorAll('.m-wm span');
      if(window.PRShuttle)fly=PRShuttle.flight(loader,{duration:1.42});
      if(fly){var clock={t:0};intro.to(clock,{t:fly.duration*1000,duration:fly.duration,ease:'none',onUpdate:function(){if(fly)fly.seek(clock.t);},onComplete:function(){if(fly)fly.stop();fly=null;}},.12);}
      R=1.15;
      intro.from(wm,{yPercent:110,duration:.85,stagger:.07},0)
        .from(loader.querySelectorAll('.m-meta span'),{opacity:0,y:10,duration:.7,stagger:.08},.15)
        .to(loader.querySelector('.m-bar'),{scaleX:1,duration:.9,ease:'power2.inOut'},.1)
        .to(wm,{yPercent:-110,duration:.55,ease:'power3.inOut',stagger:.04},1)
        .to(loader,{clipPath:'inset(0 0 100% 0)',duration:1,ease:'expo.inOut',onComplete:function(){if(fly)fly.stop();fly=null;loader.remove();if(lenis)lenis.start();}},R);
      window.__prCurtain=R;
      /* the page is still setting up (scroll triggers, layout) when this runs, and the first frames would
         stall and skip the wordmark's rise. Hold the intro, then start it two frames later on a quiet thread. */
      intro.set([loader.querySelector('.m-wm'),loader.querySelector('.m-meta')],{opacity:1},0).pause();
      requestAnimationFrame(function(){requestAnimationFrame(function(){if(ctx)intro.play();});});
    }else if(loader){loader.remove();}
    var t0=withIntro&&loader?R+.35:0;
    var hpar=document.querySelector('.hero-portrait .m-par');
    if(hpar)gsap.set(hpar,{scale:PAR});
    if(withIntro){
      intro.from(header,{yPercent:-100,duration:1},t0)
        .from('.hero .eyebrow',{opacity:0,x:-20,duration:1},t0+.1)
        .from('.hero h1 .m-line>span',{yPercent:100,rotationX:55,transformOrigin:'50% 100%',transformPerspective:1000,duration:1.4,stagger:.13},t0+.05)
        .from('.hero-intro, .hero-note',{opacity:0,y:24,duration:1.2,stagger:.1},t0+.45)
        .from('.hero-actions > *',{opacity:0,y:18,duration:1,stagger:.08},t0+.65)
        .fromTo('.hero-portrait .image-frame',{clipPath:'inset(100% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.6,ease:'expo.inOut'},t0-.2)
        .from('.hero-portrait .m-par',{scale:1.35,duration:2.2},t0-.2)
        .from('.hero-portrait figcaption > *',{opacity:0,y:12,duration:.9,stagger:.08},t0+1)
        .fromTo('.credentials-strip',{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.4,ease:'expo.inOut'},t0+.6)
        .from('.credentials-strip > div',{opacity:0,y:14,duration:1,stagger:.1},t0+.9);
    }

    /* ── header: hides on the way down, returns on the way up ── */
    var shown=true;
    ScrollTrigger.create({start:0,end:'max',onUpdate:function(s){
      var want=s.direction<0||s.scroll()<240;
      if(want!==shown){shown=want;gsap.to(header,want?{yPercent:0,duration:.5,ease:'expo.out',overwrite:true}:{yPercent:-100,duration:.3,ease:'power2.out',overwrite:true});}
    }});

    /* ── hero depth: portrait tilts toward the pointer, drifts on scroll ── */
    var frame=document.querySelector('.hero-portrait .image-frame'),par=frame&&frame.querySelector('.m-par');
    if(frame){
      /* 2% drift + 5px pointer travel stays inside the 2.5% of bleed that the resting scale leaves */
      gsap.to(par,{yPercent:2,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
      gsap.to('.hero-copy',{yPercent:-6,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
      /* as the hero leaves, the portrait leans back into the page */
      gsap.to('.hero-portrait',{rotationX:9,scale:.95,transformPerspective:1400,transformOrigin:'50% 0%',ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
      if(fine){
        var rx=gsap.quickTo(frame,'rotationX',{duration:.8,ease:'power3'}),ry=gsap.quickTo(frame,'rotationY',{duration:.8,ease:'power3'});
        var px=gsap.quickTo(par,'x',{duration:.9,ease:'power3'}),py=gsap.quickTo(par,'y',{duration:.9,ease:'power3'});
        gsap.set(frame,{transformPerspective:1100});
        var hp=document.querySelector('.hero-portrait');
        hp.addEventListener('pointermove',function(e){var r=frame.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;ry(x*7);rx(-y*6);px(-x*14);py(-y*10);},sig);
        hp.addEventListener('pointerleave',function(){rx(0);ry(0);px(0);py(0);},sig);
      }
    }

    /* ── headings rise line by line; eyebrows wipe in ── */
    document.querySelectorAll('.section-head, .contact-grid > div:first-child').forEach(function(h){
      var tl=gsap.timeline({scrollTrigger:{trigger:h,start:'top 82%',toggleActions:'play none none none'},defaults:{ease:EASE}});
      tl.fromTo(h.querySelector('.eyebrow'),{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.1,ease:'expo.inOut'},0)
        .from(h.querySelectorAll('h2 .m-line>span'),{yPercent:100,rotationX:55,transformOrigin:'50% 100%',transformPerspective:1000,duration:1.3,stagger:.12},.1)
        .from(h.querySelectorAll('.heading-row > p, .contact-grid > div > p:last-child'),{opacity:0,y:22,duration:1.1},.35);
    });

    /* ── project cards: only the cards you can see rise in; the rest of the rail is already in place ── */
    var cards=gsap.utils.toArray('.project-card'),rail=document.getElementById('cf-grid');
    ScrollTrigger.batch(cards,{start:'top 88%',onEnter:function(b){
      b=b.filter(function(c){if(c.dataset.mIn||c.hidden)return false;c.dataset.mIn='1';return true;});if(!b.length)return;
      var edge=rail?rail.getBoundingClientRect().right:innerWidth;
      var seen=b.filter(function(c){return c.getBoundingClientRect().left<edge-8;});
      gsap.from(seen,{y:48,opacity:0,rotationX:-12,z:-40,transformOrigin:'50% 0%',duration:1.1,ease:EASE,stagger:.08});
      seen.forEach(function(card){
        var s=card.querySelector('.project-proof strong'),c=s&&countable(s);
        if(c&&!s.dataset.mCounted){
          s.dataset.mCounted='1';var o={v:0};
          gsap.set(s,{minWidth:s.offsetWidth});/* hold the final width so the label beside it never shifts */
          gsap.to(o,{v:c.num,duration:1.6,delay:.2,ease:'power3.out',onUpdate:function(){s.textContent=c.pre+o.v.toFixed(c.dec)+c.suf;},onComplete:function(){s.textContent=c.orig;gsap.set(s,{clearProps:'minWidth'});}});
        }else if(s){gsap.from(s,{yPercent:40,opacity:0,duration:1,delay:.15,ease:EASE});}
      });
    }});
    if(fine){
      cards.forEach(function(card){
        var glare=card.querySelector('.m-glare'),banner=card.querySelector('.project-banner');
        var trx=gsap.quickTo(card,'rotationX',{duration:.6,ease:'power3'}),tr=gsap.quickTo(card,'rotationY',{duration:.6,ease:'power3'}),ty=gsap.quickTo(card,'y',{duration:.6,ease:'power3'});
        var gx=glare&&gsap.quickTo(glare,'x',{duration:.45,ease:'power3'}),gy=glare&&gsap.quickTo(glare,'y',{duration:.45,ease:'power3'});
        function light(e,jump){if(!glare)return;var br=banner.getBoundingClientRect(),lx=e.clientX-br.left,ly=e.clientY-br.top;if(jump){gx(lx,lx);gy(ly,ly);}else{gx(lx);gy(ly);}}
        card.addEventListener('pointerenter',function(e){light(e,true);},sig);
        card.addEventListener('pointermove',function(e){
          var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
          tr((x-.5)*5);trx(-(y-.5)*4);ty(-6);light(e,false);
        },sig);
        card.addEventListener('pointerleave',function(){tr(0);trx(0);ty(0);},sig);
      });
    }

    /* ── photos: curtain reveal + inner drift ── */
    document.querySelectorAll('.moment').forEach(function(m){
      if(m.closest('.hero-portrait'))return;
      var f=m.querySelector('.image-frame'),p=f&&f.querySelector('.m-par');if(!f)return;
      gsap.timeline({scrollTrigger:{trigger:m,start:'top 86%',toggleActions:'play none none none'}})
        .fromTo(f,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:1.4,ease:'expo.inOut'})
        .fromTo(f,{rotationX:14,transformPerspective:1400,transformOrigin:'50% 100%'},{rotationX:0,duration:1.8,ease:EASE},0)
        .from(m.querySelectorAll('figcaption > *'),{opacity:0,y:16,duration:1,stagger:.08,ease:EASE},.6);
      var pr=m.closest('#court .photo-pair'),dy=pr?2.5:2,sc=pr?1.05:1.045;gsap.fromTo(p,{yPercent:-dy,scale:sc},{yPercent:dy,scale:sc,ease:'none',scrollTrigger:{trigger:f,start:'top bottom',end:'bottom top',scrub:true}});
    });

    /* photo badge follows the pointer over photos */
    if(fine){
      var bx=gsap.quickTo(badge,'x',{duration:.35,ease:'power3'}),by=gsap.quickTo(badge,'y',{duration:.35,ease:'power3'});
      window.addEventListener('pointermove',function(e){bx(e.clientX);by(e.clientY);},sig);
      document.querySelectorAll('.image-frame').forEach(function(f){
        /* grows from 0.8 with a fade, never from nothing; leaves faster than it arrives */
        f.addEventListener('pointerenter',function(e){bx(e.clientX,e.clientX);by(e.clientY,e.clientY);gsap.to(badge,{scale:1,opacity:1,duration:.3,ease:EASE,overwrite:'auto'});},sig);
        f.addEventListener('pointerleave',function(){gsap.to(badge,{scale:.8,opacity:0,duration:.18,ease:'power2.out',overwrite:'auto'});},sig);
        f.addEventListener('click',function(){gsap.set(badge,{scale:.8,opacity:0});},sig);
      });
    }

    /* ── experience: wine rule draws, results count up ── */
    document.querySelectorAll('.career-row').forEach(function(row){
      var tl=gsap.timeline({scrollTrigger:{trigger:row,start:'top 84%',toggleActions:'play none none none'},defaults:{ease:EASE}});
      tl.fromTo(row.querySelector('.m-rule'),{scaleX:0},{scaleX:1,duration:1.4,ease:'expo.inOut'},0)
        .from(row.querySelectorAll('.career-meta > *'),{opacity:0,x:-16,duration:1,stagger:.08},.2)
        .from(row.querySelectorAll('.career-body > h3, .career-body > .role, .career-body > p:not(.role)'),{opacity:0,y:20,duration:1.1,stagger:.08},.25)
        .from(row.querySelectorAll('.role-results > span'),{opacity:0,y:18,scale:.96,duration:1,stagger:.08},.5)
        .from(row.querySelector('details'),{opacity:0,duration:.8},.7);
      row.querySelectorAll('.role-results strong').forEach(function(s){
        var c=countable(s);if(!c)return;var o={v:0};
        tl.set(s,{minWidth:function(){return s.offsetWidth;}},.55)
          .to(o,{v:c.num,duration:1.6,ease:'power3.out',onUpdate:function(){s.textContent=c.pre+o.v.toFixed(c.dec)+c.suf;},onComplete:function(){s.textContent=c.orig;gsap.set(s,{clearProps:'minWidth'});}},.55);
      });
    });

    /* "Responsibilities": short, interruptible open and close; a second click mid-way reverses it */
    document.querySelectorAll('details').forEach(function(d){
      var sum=d.querySelector('summary'),ul=d.querySelector('ul');if(!sum||!ul)return;
      var tw=null,isOpen=d.open;
      sum.addEventListener('click',function(e){
        e.preventDefault();
        if(tw){tw.kill();tw=null;}
        gsap.killTweensOf(ul.children);gsap.set(ul.children,{clearProps:'transform,opacity'});
        if(isOpen){
          isOpen=false;d.classList.add('m-closing');
          tw=gsap.to(ul,{height:0,opacity:0,marginTop:0,duration:.28,ease:'power3.out',onComplete:function(){d.open=false;d.classList.remove('m-closing');gsap.set(ul,{clearProps:'height,opacity,marginTop,overflow'});tw=null;}});
        }else{
          isOpen=true;d.classList.remove('m-closing');
          var from=d.open?null:{height:0,opacity:0,marginTop:0};
          d.open=true;
          var h=ul.scrollHeight,mt=parseFloat(getComputedStyle(ul).marginTop)||16;
          if(from){gsap.set(ul,from);}else{mt=16;}
          tw=gsap.to(ul,{height:h,opacity:1,marginTop:mt,duration:.4,ease:EASE,onComplete:function(){gsap.set(ul,{clearProps:'height,opacity,marginTop,overflow'});tw=null;}});
          if(from)gsap.from(ul.children,{x:-8,opacity:0,duration:.4,stagger:.04,ease:EASE,delay:.06,clearProps:'transform,opacity'});
        }
      },{signal:ac.signal});/* not passive: it must be able to stop the native toggle */
    });

    /* ── education cards ── */
    gsap.from('.education-grid article',{y:40,rotationX:12,transformOrigin:'50% 100%',transformPerspective:1200,opacity:0,duration:1.2,ease:EASE,stagger:.12,scrollTrigger:{trigger:'.education-grid',start:'top 86%',toggleActions:'play none none none'}});

    /* ── sport: record cards rise, the flight path draws as you scroll ── */
    /* record cards stand up off the court, then lean toward the pointer */
    var recs=gsap.utils.toArray('.sport-record > div');
    gsap.from(recs,{y:40,rotationX:65,transformOrigin:'50% 100%',transformPerspective:1000,opacity:0,duration:1.3,ease:EASE,stagger:.12,
      onComplete:function(){recs.forEach(function(c){c.dataset.mReady='1';});},
      scrollTrigger:{trigger:'.sport-record',start:'top 85%',toggleActions:'play none none none'}});
    if(fine){
      recs.forEach(function(card){
        var g=card.querySelector('.m-glare');
        var rx=gsap.quickTo(card,'rotationX',{duration:.6,ease:'power3'}),ry=gsap.quickTo(card,'rotationY',{duration:.6,ease:'power3'});
        var gx=g&&gsap.quickTo(g,'x',{duration:.45,ease:'power3'}),gy=g&&gsap.quickTo(g,'y',{duration:.45,ease:'power3'});
        card.addEventListener('pointerenter',function(e){if(!g)return;var r=card.getBoundingClientRect();gx(e.clientX-r.left,e.clientX-r.left);gy(e.clientY-r.top,e.clientY-r.top);},sig);
        card.addEventListener('pointermove',function(e){
          var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
          if(g){gx(e.clientX-r.left);gy(e.clientY-r.top);}
          if(!card.dataset.mReady)return;
          gsap.set(card,{transformPerspective:900});ry(x*8);rx(-y*7);
        },sig);
        card.addEventListener('pointerleave',function(){if(card.dataset.mReady){rx(0);ry(0);}},sig);
      });
    }
    gsap.from('.sport-record strong',{yPercent:60,opacity:0,duration:1.3,ease:EASE,stagger:.12,delay:.15,scrollTrigger:{trigger:'.sport-record',start:'top 85%',toggleActions:'play none none none'}});
    var arc=document.querySelector('.m-arc-line'),sh=document.querySelector('.m-sh');
    if(arc&&sh){
      var L=arc.getTotalLength();arc.style.strokeDasharray=L;arc.style.strokeDashoffset=L;
      var st={p:0};
      /* the 2D glyph stays as the fallback; with WebGL a real shuttlecock flies the path, spinning as it goes */
      if(window.PRShuttle&&!sh3){
        var cv=document.createElement('canvas');cv.className='m-arc3d';cv.setAttribute('aria-hidden','true');
        var svgEl=document.querySelector('.m-arc');svgEl.parentNode.insertBefore(cv,svgEl.nextSibling);
        sh3=PRShuttle.arc(cv,{x:0,y:-20,w:820,h:150,scale:7.6});
        if(sh3){sh.style.display='none';window.addEventListener('resize',function(){if(sh3){sh3.resize();place();}},sig);}else cv.remove();
      }
      var place=function(){var len=L*st.p,a=arc.getPointAtLength(len),b=arc.getPointAtLength(Math.max(0,len-1.5)),ang=Math.atan2(a.y-b.y,a.x-b.x);arc.style.strokeDashoffset=L-len;
        if(sh3){sh3.set(a.x,a.y,-ang,st.p*38,st.p>.01);sh3.render();return;}
        sh.setAttribute('transform','translate('+a.x+' '+a.y+') rotate('+(ang*180/Math.PI)+')');sh.style.opacity=st.p<.01?0:1;};
      place();
      gsap.to(st,{p:1,ease:'none',onUpdate:place,scrollTrigger:{trigger:'.sport-section',start:'top 75%',end:'center 35%',scrub:.6}});
    }

    /* ── journey: every milestone change animates; progress line tracks position ── */
    var title=document.getElementById('milestone-title');
    if(title){
      var year=document.getElementById('milestone-year');
      /* people step through years quickly, so the swap is short and the button itself does not bounce */
      var animMilestone=function(){
        gsap.fromTo(year,{rotationX:-95,opacity:0,transformPerspective:500,transformOrigin:'50% 60%'},{rotationX:0,opacity:1,duration:.45,ease:EASE,overwrite:true});
        gsap.fromTo(['#milestone-kind','#milestone-title','#milestone-copy'],{y:12,opacity:0},{y:0,opacity:1,duration:.5,ease:EASE,stagger:.04,overwrite:true});
        var bs=[].slice.call(document.querySelectorAll('.timeline-years button')),i=bs.findIndex(function(b){return b.getAttribute('aria-pressed')==='true';});
        if(mprog&&bs.length)gsap.to(mprog,{scaleX:bs.length>1?i/(bs.length-1):1,duration:.5,ease:EASE,overwrite:true});
      };
      var mo=new MutationObserver(animMilestone);mo.observe(title,{childList:true,characterData:true,subtree:true});
      ac.signal.addEventListener('abort',function(){mo.disconnect();});
      var bs0=[].slice.call(document.querySelectorAll('.timeline-years button')),i0=bs0.findIndex(function(b){return b.getAttribute('aria-pressed')==='true';});
      if(mprog&&bs0.length)gsap.set(mprog,{scaleX:bs0.length>1?i0/(bs0.length-1):1});
      gsap.timeline({scrollTrigger:{trigger:'.timeline-toolbar',start:'top 86%',toggleActions:'play none none none'}})
        .from('.timeline-toolbar > *',{opacity:0,y:16,duration:1,stagger:.1,ease:EASE})
        .from('.timeline-years button',{opacity:0,y:14,duration:.8,stagger:.04,ease:EASE},.1)
        .fromTo('.milestone-panel',{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:1.3,ease:'expo.inOut'},.2)
        .from('.m-mprog',{opacity:0,duration:.6},.9);
    }
    gsap.from('.skills-grid > div',{opacity:0,y:30,duration:1.1,ease:EASE,stagger:.1,scrollTrigger:{trigger:'.skills-grid',start:'top 88%',toggleActions:'play none none none'}});

    /* ── contact ── */
    gsap.from('.contact-links a',{opacity:0,x:30,duration:1.1,ease:EASE,stagger:.08,scrollTrigger:{trigger:'.contact-links',start:'top 85%',toggleActions:'play none none none'}});

    /* ── spotlight on dark panels: the light trails the pointer instead of snapping to it ── */
    if(fine){
      document.querySelectorAll('.m-spot').forEach(function(el){
        var g=el.querySelector(':scope > .m-glow');if(!g)return;
        var sx=gsap.quickTo(g,'x',{duration:.6,ease:'power3'}),sy=gsap.quickTo(g,'y',{duration:.6,ease:'power3'});
        el.addEventListener('pointerenter',function(e){var r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;sx(x,x);sy(y,y);},sig);
        el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();sx(e.clientX-r.left);sy(e.clientY-r.top);},sig);
      });
      /* magnetic primary actions, with a press that answers the click */
      document.querySelectorAll('.button.primary, .nav-contact').forEach(function(b){
        var mx=gsap.quickTo(b,'x',{duration:.5,ease:'power3'}),my=gsap.quickTo(b,'y',{duration:.5,ease:'power3'});
        b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();mx((e.clientX-r.left-r.width/2)*.22);my((e.clientY-r.top-r.height/2)*.3);},sig);
        b.addEventListener('pointerleave',function(){mx(0);my(0);gsap.to(b,{scale:1,duration:.2,ease:EASE,overwrite:'auto'});},sig);
        b.addEventListener('pointerdown',function(){gsap.to(b,{scale:.97,duration:.12,ease:'power2.out',overwrite:'auto'});},sig);
        b.addEventListener('pointerup',function(){gsap.to(b,{scale:1,duration:.25,ease:EASE,overwrite:'auto'});},sig);
      });
    }
  });

  /* anchors glide with the page instead of jumping */
  document.querySelectorAll('a[href^="#"]:not(.skip)').forEach(function(a){
    a.addEventListener('click',function(e){
      var id=a.getAttribute('href'),t=id.length>1&&document.querySelector(id);if(!t||!lenis)return;
      e.preventDefault();lenis.scrollTo(id==='#top'?0:t,{offset:-90,duration:1.2});
    },{signal:ac.signal});
  });

  /* pause smooth scrolling while a dialog is open */
  document.querySelectorAll('dialog').forEach(function(d){
    var mo=new MutationObserver(function(){if(!lenis)return;d.open?lenis.stop():lenis.start();});
    mo.observe(d,{attributes:true,attributeFilter:['open']});
    ac.signal.addEventListener('abort',function(){mo.disconnect();});
  });

  window.addEventListener('load',function(){ScrollTrigger.refresh();},{signal:ac.signal});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){ScrollTrigger.refresh();});
}

/* ═════════ teardown (Motion off) ═════════ */
function teardown(){
  if(!booted)return;booted=false;
  if(ac)ac.abort();
  gsap.killTweensOf('.project-card');gsap.set('.project-card',{clearProps:'all'});
  if(ctx)ctx.revert();
  ScrollTrigger.getAll().forEach(function(t){t.kill();});
  if(lenis){lenis.destroy();lenis=null;}
  if(tickFn){gsap.ticker.remove(tickFn);tickFn=null;}
  gsap.set(badge,{scale:.8,opacity:0});
  if(fly){fly.stop();fly=null;}
  if(sh3){sh3.dispose();sh3=null;}
  var g2d=document.querySelector('.m-sh');if(g2d)g2d.style.display='';
  var l=document.querySelector('.m-loader');if(l)l.remove();
  root.classList.remove('gsap-on');
  document.querySelectorAll('.project-proof strong,.role-results strong').forEach(function(s){if(s.dataset.mCounted)delete s.dataset.mCounted;s.style.minWidth='';});
  document.querySelectorAll('details').forEach(function(d){d.classList.remove('m-closing');var u=d.querySelector('ul');if(u){gsap.killTweensOf(u);gsap.set(u,{clearProps:'height,opacity,marginTop,overflow'});}});
  if(mprog)gsap.set(mprog,{scaleX:1});
  document.querySelectorAll('.project-card').forEach(function(c){delete c.dataset.mIn;});
}

/* respect the footer Motion toggle */
var toggle=document.getElementById('motion-toggle');
if(toggle)toggle.addEventListener('click',function(){setTimeout(function(){if(motionOn()){requestAnimationFrame(function(){requestAnimationFrame(function(){init(false);ScrollTrigger.refresh();});});}else teardown();},0);});

if(motionOn())init(true);else{var l0=document.querySelector('.m-loader');if(l0)l0.remove();}
})();
