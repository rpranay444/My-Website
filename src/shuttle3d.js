/* A real shuttlecock, built in Three.js: cork, wine band, sixteen feathers, two threads.
   Used twice: the serve that crosses the intro screen, and the flight path in the badminton section. */
(function(){
'use strict';
var T=window.THREE;
if(!T)return;
var ok=null;
function supported(){
  if(ok!==null)return ok;
  try{var c=document.createElement('canvas');ok=!!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));}catch(e){ok=false;}
  return ok;
}
var tex=null;
function featherTexture(){
  if(tex)return tex;
  var c=document.createElement('canvas');c.width=128;c.height=512;
  var g=c.getContext('2d');
  var vane=new Path2D();
  vane.moveTo(64,336);
  vane.bezierCurveTo(56,300,9,214,10,112);
  vane.bezierCurveTo(12,42,40,8,64,6);
  vane.bezierCurveTo(88,8,116,42,118,112);
  vane.bezierCurveTo(119,214,72,300,64,336);
  vane.closePath();
  var grd=g.createLinearGradient(0,0,0,336);
  grd.addColorStop(0,'#fbf9f5');grd.addColorStop(.65,'#efe9df');grd.addColorStop(1,'#d8cebf');
  g.fillStyle=grd;g.fill(vane);
  g.save();g.clip(vane);
  g.strokeStyle='rgba(110,96,84,.11)';g.lineWidth=1;
  for(var y=14;y<340;y+=6){g.beginPath();g.moveTo(64,y+16);g.lineTo(2,y);g.moveTo(64,y+16);g.lineTo(126,y);g.stroke();}
  g.restore();
  g.lineCap='round';
  g.strokeStyle='#d6cdbd';g.lineWidth=5;g.beginPath();g.moveTo(64,26);g.lineTo(64,506);g.stroke();
  g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1.6;g.beginPath();g.moveTo(63,34);g.lineTo(63,500);g.stroke();
  tex=new T.CanvasTexture(c);
  tex.encoding=T.sRGBEncoding;tex.anisotropy=4;
  return tex;
}
/* cork points along +X; the skirt opens toward -X */
function model(){
  var root=new T.Group(),bin=[];
  function keep(o){bin.push(o);return o;}
  var corkMat=keep(new T.MeshStandardMaterial({color:0xf1ece3,roughness:.55,metalness:0}));
  var dome=new T.Mesh(keep(new T.SphereGeometry(1,40,20,0,Math.PI*2,0,Math.PI/2)),corkMat);
  dome.rotation.z=-Math.PI/2;dome.position.x=.55;root.add(dome);
  var base=new T.Mesh(keep(new T.CylinderGeometry(1,.96,.55,40,1,false)),corkMat);
  base.rotation.z=-Math.PI/2;base.position.x=.275;root.add(base);
  var band=new T.Mesh(keep(new T.TorusGeometry(1,.075,10,56)),keep(new T.MeshStandardMaterial({color:0x582d3d,roughness:.45,metalness:.05})));
  band.rotation.y=Math.PI/2;band.position.x=.12;root.add(band);
  var r0=.78,r1=2.7,dx=3.5,dr=r1-r0,L=Math.sqrt(dx*dx+dr*dr),phi=Math.atan2(dx,dr);
  var fGeo=keep(new T.PlaneGeometry(1.62,L));fGeo.translate(0,L/2,0);
  var fMat=keep(new T.MeshStandardMaterial({map:featherTexture(),alphaTest:.42,side:T.DoubleSide,roughness:.9,metalness:0}));
  for(var i=0;i<16;i++){
    var pivot=new T.Group();pivot.rotation.x=i/16*Math.PI*2;
    var arm=new T.Group();arm.position.y=r0;arm.rotation.z=phi;
    var f=new T.Mesh(fGeo,fMat);f.rotation.y=Math.PI/2+.13;
    arm.add(f);pivot.add(arm);root.add(pivot);
  }
  var thread=keep(new T.MeshStandardMaterial({color:0x7d7268,roughness:.95}));
  [1.15,1.95].forEach(function(t){
    var ring=new T.Mesh(keep(new T.TorusGeometry(r0+dr*t/dx,.032,6,72)),thread);
    ring.rotation.y=Math.PI/2;ring.position.x=-t;root.add(ring);
  });
  root.userData.bin=bin;
  return root;
}
function stage(canvas){
  var r=new T.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  r.outputEncoding=T.sRGBEncoding;r.setClearColor(0x000000,0);
  var s=new T.Scene();
  s.add(new T.HemisphereLight(0xffffff,0x3b2a31,.8));
  var key=new T.DirectionalLight(0xffffff,1.15);key.position.set(3,6,8);s.add(key);
  var rim=new T.DirectionalLight(0xc59caf,1);rim.position.set(-7,-3,-4);s.add(rim);
  return {r:r,s:s};
}
function drop(st,m,canvas){
  try{(m.userData.bin||[]).forEach(function(o){o.dispose();});st.r.dispose();st.r.forceContextLoss();}catch(e){}
  if(canvas&&canvas.parentNode)canvas.parentNode.removeChild(canvas);
}

/* flight path in the badminton section: an orthographic view that matches the SVG arc's viewBox */
function arc(canvas,view){
  if(!supported())return null;
  var st;try{st=stage(canvas);}catch(e){return null;}
  var cam=new T.OrthographicCamera(view.x,view.x+view.w,-view.y,-(view.y+view.h),-400,400);cam.position.z=200;
  var holder=new T.Group(),tilt=new T.Group(),spin=new T.Group(),m=model();
  tilt.rotation.y=.55;
  spin.add(m);tilt.add(spin);holder.add(tilt);holder.scale.setScalar(view.scale||6.4);st.s.add(holder);
  function resize(){var w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h)st.r.setSize(w,h,false);}
  resize();
  /* draw it once now, off screen at load, so the first frame of the scroll-driven flight doesn't stall */
  try{holder.position.set(view.x+view.w/2,-(view.y+view.h/2),0);st.r.compile(st.s,cam);st.r.render(st.s,cam);holder.visible=false;st.r.render(st.s,cam);}catch(e){}
  return {
    set:function(x,y,angle,turn,visible){holder.position.set(x,-y,0);holder.rotation.z=angle;spin.rotation.x=turn;holder.visible=visible;},
    render:function(){st.r.render(st.s,cam);},
    resize:resize,
    dispose:function(){drop(st,m,canvas);}
  };
}

/* the serve across the intro screen: comes out of the distance, arcs over the wordmark, leaves past the viewer.
   seek(ms) draws one frame, so the page timeline can drive it on the same clock as the wordmark. */
function flight(host,opts){
  if(!supported()||!host)return null;
  opts=opts||{};
  var canvas=document.createElement('canvas');canvas.className='m-fly';canvas.setAttribute('aria-hidden','true');
  host.appendChild(canvas);
  var st;try{st=stage(canvas);}catch(e){canvas.remove();return null;}
  var w=host.clientWidth,h=host.clientHeight;st.r.setSize(w,h,false);
  var cam=new T.PerspectiveCamera(35,w/h,.1,300);cam.position.set(0,0,30);
  var holder=new T.Group(),orient=new T.Group(),spin=new T.Group(),m=model();
  orient.rotation.y=-Math.PI/2;spin.add(m);orient.add(spin);holder.add(orient);st.s.add(holder);
  var narrow=w<700,s=narrow?.7:1;
  holder.scale.setScalar(narrow?.62:.82);
  var P0=new T.Vector3(-12*s,-12,-50),P1=new T.Vector3(-2*s,16,-18),P2=new T.Vector3(18*s,2,10);
  var D01=P1.clone().sub(P0),D12=P2.clone().sub(P1);
  var pos=new T.Vector3(),tan=new T.Vector3(),look=new T.Vector3();
  function at(t){var u=1-t;pos.set(0,0,0).addScaledVector(P0,u*u).addScaledVector(P1,2*u*t).addScaledVector(P2,t*t);
    tan.set(0,0,0).addScaledVector(D01,2*u).addScaledVector(D12,2*t);}
  var dur=(opts.duration||1.25)*1000,done=false;
  /* never fully 0: a layer at opacity 0 is skipped by the compositor, and setting it up later costs a frame mid-serve */
  canvas.style.opacity='0.001';
  /* compile the shaders now, while the curtain is still, instead of on the first frame of the serve */
  /* one frame with the shuttle in view uploads its feather texture too; the canvas is still transparent */
  try{st.r.compile(st.s,cam);at(.5);holder.position.copy(pos);st.r.render(st.s,cam);at(0);holder.position.copy(pos);st.r.render(st.s,cam);}catch(e){}
  function seek(e){
    if(done)return;
    e=Math.max(0,e);
    var t=Math.min(1,e/dur),k=1-Math.pow(1-t,1.6);/* leaves the racket fast and sheds speed, like a real shuttle */
    at(k);holder.position.copy(pos);look.copy(pos).add(tan);holder.lookAt(look);
    spin.rotation.x=e/1000*15;
    canvas.style.opacity=String(Math.max(.001,Math.min(1,t*7)));
    st.r.render(st.s,cam);
  }
  function stop(){if(done)return;done=true;drop(st,m,canvas);}
  return {seek:seek,stop:stop,duration:dur/1000};
}

window.PRShuttle={supported:supported,arc:arc,flight:flight,model:model};
})();
