'use strict';
// ═══════════════════════════════════════════════════════
// CURSOR
// ═══════════════════════════════════════════════════════
const curEl=document.getElementById('cur'),cur2El=document.getElementById('cur2');
let mx=innerWidth/2,my=innerHeight/2,tx2=mx,ty2=my;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;curEl.style.left=mx+'px';curEl.style.top=my+'px'});
(function ac(){tx2+=(mx-tx2)*.13;ty2+=(my-ty2)*.13;cur2El.style.left=tx2+'px';cur2El.style.top=ty2+'px';requestAnimationFrame(ac)})();

// ═══════════════════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════════════════
const gc=document.getElementById('gc'), gctx=gc.getContext('2d');
const pc=document.getElementById('pc'), pctx=pc.getContext('2d');
const tc=document.getElementById('tc'), tctx=tc.getContext('2d');

function resize(){
  gc.width=innerWidth; gc.height=innerHeight;
  tc.width=innerWidth; tc.height=innerHeight;
  pc.width=Math.round(innerWidth*.3); pc.height=innerHeight;
}
resize(); window.addEventListener('resize',resize);

// ═══════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeInOut3=(t)=>t<.5?4*t*t*t:(1-(-2*t+2)**3/2);
const easeOut4=(t)=>1-(1-t)**4;
const easeIn2=(t)=>t*t;
const easeOut2=(t)=>1-(1-t)*(1-t);

// ═══════════════════════════════════════════════════════
// STARS (background canvas)
// ═══════════════════════════════════════════════════════
let stars=[];
function initStars(){
  stars=Array.from({length:420},()=>({
    x:Math.random()*gc.width, y:Math.random()*gc.height,
    r:Math.random()*1.5+.1, a:Math.random()*.8+.1,
    sp:Math.random()*.006+.001, ph:Math.random()*Math.PI*2,
  }));
}
initStars(); window.addEventListener('resize',initStars);

// ═══════════════════════════════════════════════════════
// METEORS (background canvas, ambient only)
// ═══════════════════════════════════════════════════════
const meteors=[];
function spawnMeteor(){
  const from01=Math.random()<.5;
  let sx,sy,ang;
  if(from01){sx=Math.random()*gc.width;sy=-10;ang=Math.PI/4+Math.random()*.4-.2;}
  else{sx=-10;sy=Math.random()*gc.height*.7;ang=.25+Math.random()*.35;}
  meteors.push({x:sx,y:sy,vx:Math.cos(ang)*(16+Math.random()*8),vy:Math.sin(ang)*(16+Math.random()*8),
    len:80+Math.random()*130,w:.8+Math.random()*1.2,life:1+Math.random()*.5,
    col:Math.random()<.25?'rgba(200,220,255,':'rgba(255,255,255,'});
}
setInterval(()=>{if(Math.random()<.65)spawnMeteor();},1100);

function drawMeteors(){
  for(let i=meteors.length-1;i>=0;i--){
    const m=meteors[i];
    m.x+=m.vx; m.y+=m.vy; m.life-=.018;
    if(m.life<=0||m.x>gc.width+200||m.y>gc.height+200){meteors.splice(i,1);continue;}
    const tx=m.x-m.vx*(m.len/18),ty=m.y-m.vy*(m.len/18);
    const g=gctx.createLinearGradient(m.x,m.y,tx,ty);
    g.addColorStop(0,m.col+Math.min(m.life,.9)+')');
    g.addColorStop(.4,m.col+(m.life*.4)+')');
    g.addColorStop(1,m.col+'0)');
    gctx.beginPath();gctx.moveTo(m.x,m.y);gctx.lineTo(tx,ty);
    gctx.strokeStyle=g;gctx.lineWidth=m.w;gctx.stroke();
    gctx.beginPath();gctx.arc(m.x,m.y,m.w*1.2,0,Math.PI*2);
    gctx.fillStyle=m.col+Math.min(m.life,.9)+')';gctx.fill();
  }
}

// ═══════════════════════════════════════════════════════
// NOISE helpers (for planet textures)
// ═══════════════════════════════════════════════════════
function hash(x,y,s){return Math.abs(Math.sin(x*127.1+y*311.7+s*74.3)*43758.5453)%1;}
function n2(x,y,s){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return lerp(lerp(hash(ix,iy,s),hash(ix+1,iy,s),u),lerp(hash(ix,iy+1,s),hash(ix+1,iy+1,s),u),v);
}
function fbm(x,y,o,s){let v=0,a=.5,f=1;for(let i=0;i<o;i++){v+=a*n2(x*f,y*f,s+i*17);a*=.5;f*=2.1;}return v;}

// ═══════════════════════════════════════════════════════
// PLANET DRAWERS
// ═══════════════════════════════════════════════════════
function drawSun(ctx,cx,cy,r,t,al){
  ctx.save();ctx.globalAlpha=al;
  // outer corona rings
  for(let i=4;i>=1;i--){
    const rg=ctx.createRadialGradient(cx,cy,r*.5,cx,cy,r*(1+i*.35));
    rg.addColorStop(0,`rgba(255,140,20,${.18/i})`);rg.addColorStop(1,'rgba(255,60,0,0)');
    ctx.beginPath();ctx.arc(cx,cy,r*(1+i*.35),0,Math.PI*2);ctx.fillStyle=rg;ctx.fill();
  }
  // flares
  for(let i=0;i<20;i++){
    const a=(i/20)*Math.PI*2+t*.15;const ln=r*(.14+.18*Math.sin(t*1.1+i*.71));
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
    const lg=ctx.createLinearGradient(r,0,r+ln,0);
    lg.addColorStop(0,`rgba(255,200,60,${.5+.28*Math.sin(t+i)})`);lg.addColorStop(1,'rgba(255,80,0,0)');
    ctx.beginPath();ctx.moveTo(r+2,0);ctx.lineTo(r+ln,0);ctx.strokeStyle=lg;ctx.lineWidth=1.5+Math.sin(t*.9+i)*.5;ctx.stroke();ctx.restore();
  }
  // surface gradient
  const bg=ctx.createRadialGradient(cx-r*.22,cy-r*.2,r*.04,cx,cy,r);
  bg.addColorStop(0,'#FFF9C4');bg.addColorStop(.2,'#FFE066');bg.addColorStop(.5,'#FFA500');bg.addColorStop(.82,'#FF5500');bg.addColorStop(1,'#C84000');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=bg;ctx.fill();
  // surface texture via fbm
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const id=ctx.getImageData(cx-r,cy-r,r*2,r*2);const d=id.data;const sz=r*2;
  for(let px=0;px<sz;px+=2){for(let py=0;py<sz;py+=2){
    const nx2=(px/sz-.5)*3,ny2=(py/sz-.5)*3;
    if(nx2*nx2+ny2*ny2>1.02)continue;
    const nv=fbm(nx2+t*.03,ny2+t*.025,4,0);
    if(nv>.39){const ii=(py*sz+px)*4;d[ii]=255;d[ii+1]=255;d[ii+2]=Math.round(100*nv);d[ii+3]=Math.round(120*nv);}
  }}ctx.putImageData(id,cx-r,cy-r);ctx.restore();
  // sunspots
  for(let i=0;i<5;i++){
    const sa=t*.07+i*1.26,sr=.5+.13*Math.sin(i*2.3);
    const sx2=cx+Math.cos(sa)*r*sr,sy2=cy+Math.sin(sa*.65)*r*.38;
    const sg=ctx.createRadialGradient(sx2,sy2,0,sx2,sy2,r*.085);
    sg.addColorStop(0,'rgba(55,12,0,.88)');sg.addColorStop(.5,'rgba(120,35,0,.5)');sg.addColorStop(1,'rgba(180,65,0,0)');
    ctx.beginPath();ctx.arc(sx2,sy2,r*.085,0,Math.PI*2);ctx.fillStyle=sg;ctx.fill();
  }
  ctx.restore();
}

function drawEarth(ctx,cx,cy,r,t,al){
  ctx.save();ctx.globalAlpha=al;
  const ag=ctx.createRadialGradient(cx,cy,r,cx,cy,r*1.22);
  ag.addColorStop(0,'rgba(85,165,255,.35)');ag.addColorStop(.55,'rgba(45,115,220,.09)');ag.addColorStop(1,'rgba(20,65,175,0)');
  ctx.beginPath();ctx.arc(cx,cy,r*1.22,0,Math.PI*2);ctx.fillStyle=ag;ctx.fill();
  const og=ctx.createRadialGradient(cx-r*.22,cy-r*.2,r*.07,cx,cy,r);
  og.addColorStop(0,'#8EDFFF');og.addColorStop(.3,'#3A9BD5');og.addColorStop(.68,'#1A5FA0');og.addColorStop(1,'#0A2E5C');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=og;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const sp=t*.1;
  [{a:0,d:.55,rx:38,ry:28},{a:1.4,d:.5,rx:32,ry:21},{a:2.8,d:.46,rx:28,ry:17},
   {a:4.2,d:.51,rx:35,ry:23},{a:5.6,d:.44,rx:18,ry:12},{a:3.4,d:.36,rx:16,ry:11}].forEach(l=>{
    const la=l.a+sp,lx=cx+Math.cos(la)*r*l.d,ly=cy+Math.sin(la)*r*l.d*.55;
    ctx.save();ctx.translate(lx,ly);ctx.rotate(la*.5);
    ctx.beginPath();ctx.ellipse(0,0,l.rx*(r/100),l.ry*(r/100),0,0,Math.PI*2);ctx.fillStyle='#2E7D32';ctx.fill();
    ctx.beginPath();ctx.ellipse(-l.rx*(r/100)*.2,-l.ry*(r/100)*.2,l.rx*(r/100)*.5,l.ry*(r/100)*.5,0,0,Math.PI*2);ctx.fillStyle='rgba(80,160,65,.25)';ctx.fill();ctx.restore();
  });
  ctx.beginPath();ctx.ellipse(cx,cy-r+r*.13,r*.28,r*.12,0,0,Math.PI*2);ctx.fillStyle='rgba(238,248,255,.9)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+r-r*.1,r*.2,r*.08,0,0,Math.PI*2);ctx.fillStyle='rgba(238,248,255,.75)';ctx.fill();
  for(let i=0;i<9;i++){
    const ca=i*1.08+t*.045,cd=.28+i*.075,ccx=cx+Math.cos(ca)*r*cd,ccy=cy+Math.sin(ca*.58)*r*.32;
    const cg2=ctx.createRadialGradient(ccx,ccy,0,ccx,ccy,r*.18);
    cg2.addColorStop(0,'rgba(255,255,255,.45)');cg2.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath();ctx.arc(ccx,ccy,r*.18,0,Math.PI*2);ctx.fillStyle=cg2;ctx.fill();
  }ctx.restore();
  const sp2=ctx.createRadialGradient(cx-r*.35,cy-r*.35,0,cx-r*.28,cy-r*.28,r*.5);
  sp2.addColorStop(0,'rgba(255,255,255,.18)');sp2.addColorStop(1,'rgba(255,255,255,0)');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=sp2;ctx.fill();
  ctx.restore();
}

function drawMars(ctx,cx,cy,r,t,al){
  ctx.save();ctx.globalAlpha=al;
  const hz=ctx.createRadialGradient(cx,cy,r*.88,cx,cy,r*1.18);
  hz.addColorStop(0,'rgba(200,70,15,.15)');hz.addColorStop(1,'rgba(200,70,15,0)');
  ctx.beginPath();ctx.arc(cx,cy,r*1.18,0,Math.PI*2);ctx.fillStyle=hz;ctx.fill();
  const bg=ctx.createRadialGradient(cx-r*.25,cy-r*.22,r*.05,cx,cy,r);
  bg.addColorStop(0,'#E8834A');bg.addColorStop(.38,'#C1440E');bg.addColorStop(.75,'#8C2E00');bg.addColorStop(1,'#4A1200');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=bg;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const sp=t*.12;
  for(let px=0;px<r*2;px+=3){for(let py=0;py<r*2;py+=3){
    const dx=(px-r)/r,dy=(py-r)/r;if(dx*dx+dy*dy>1)continue;
    const nv=fbm(dx*2.2+sp*.28,dy*2.2+sp*.18,3,42);
    if(nv>.53){ctx.fillStyle=`rgba(255,148,68,${(nv-.53)*1.2})`;ctx.fillRect(cx-r+px,cy-r+py,3,3);}
  }}
  [[.2,.15,.1],[-.3,-.2,.07],[.1,-.35,.085],[-.15,.3,.065],[.35,.1,.055]].forEach(([ox,oy,cr])=>{
    const bx=cx+Math.cos(sp+ox*5)*r*Math.abs(ox),by=cy+Math.sin(sp*.7+oy*5)*r*Math.abs(oy)*.6;
    const sg=ctx.createRadialGradient(bx,by,0,bx,by,r*cr);
    sg.addColorStop(0,'rgba(72,10,0,.58)');sg.addColorStop(.5,'rgba(128,38,0,.5)');sg.addColorStop(1,'rgba(186,68,0,0)');
    ctx.beginPath();ctx.arc(bx,by,r*cr,0,Math.PI*2);ctx.fillStyle=sg;ctx.fill();
  });
  ctx.beginPath();ctx.ellipse(cx,cy-r+r*.12,r*.2,r*.1,0,0,Math.PI*2);ctx.fillStyle='rgba(255,248,235,.6)';ctx.fill();
  ctx.restore();ctx.restore();
}

function drawSaturn(ctx,cx,cy,r,t,al){
  ctx.save();ctx.globalAlpha=al;
  const rings=[
    {ri:r*1.15,ro:r*1.33,c:'rgba(192,150,60,.52)'},{ri:r*1.34,ro:r*1.57,c:'rgba(215,178,94,.42)'},
    {ri:r*1.58,ro:r*1.8,c:'rgba(178,138,58,.32)'},{ri:r*1.82,ro:r*1.96,c:'rgba(205,168,85,.18)'},
    {ri:r*2.0,ro:r*2.14,c:'rgba(225,195,115,.11)'}
  ];
  ctx.save();ctx.translate(cx,cy);ctx.scale(1,.28);
  rings.forEach(rd=>{ctx.beginPath();ctx.arc(0,0,rd.ro,Math.PI,Math.PI*2);ctx.arc(0,0,rd.ri,Math.PI*2,Math.PI,true);ctx.closePath();ctx.fillStyle=rd.c;ctx.fill();});
  ctx.restore();
  const bg=ctx.createRadialGradient(cx-r*.22,cy-r*.2,r*.07,cx,cy,r);
  bg.addColorStop(0,'#F9E89E');bg.addColorStop(.28,'#E8BE5C');bg.addColorStop(.64,'#C07E1E');bg.addColorStop(1,'#6A3A00');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=bg;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  [-3.5,-2.3,-1.2,0,1.2,2.3,3.5].forEach((by2,i)=>{
    ctx.save();ctx.translate(cx,cy);ctx.scale(1,.28);
    ctx.beginPath();ctx.ellipse(0,by2*r*.19,r*.94,r*.13,0,0,Math.PI*2);
    ctx.fillStyle=i%2===0?'rgba(170,112,35,.24)':'rgba(235,195,84,.18)';ctx.fill();ctx.restore();
  });
  ctx.restore();
  ctx.save();ctx.translate(cx,cy);ctx.scale(1,.28);
  rings.forEach(rd=>{ctx.beginPath();ctx.arc(0,0,rd.ro,0,Math.PI);ctx.arc(0,0,rd.ri,Math.PI,0,true);ctx.closePath();ctx.fillStyle=rd.c;ctx.fill();});
  ctx.restore();
  const sph=ctx.createRadialGradient(cx-r*.3,cy-r*.3,0,cx-r*.24,cy-r*.24,r*.5);
  sph.addColorStop(0,'rgba(255,255,255,.16)');sph.addColorStop(1,'rgba(255,255,255,0)');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=sph;ctx.fill();
  ctx.restore();
}

function drawNeptune(ctx,cx,cy,r,t,al){
  ctx.save();ctx.globalAlpha=al;
  for(let i=3;i>=1;i--){
    const g=ctx.createRadialGradient(cx,cy,r*.65,cx,cy,r*(1+i*.26));
    g.addColorStop(0,`rgba(25,52,170,${.12/i})`);g.addColorStop(1,'rgba(8,22,90,0)');
    ctx.beginPath();ctx.arc(cx,cy,r*(1+i*.26),0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  }
  const bg=ctx.createRadialGradient(cx-r*.2,cy-r*.2,r*.06,cx,cy,r);
  bg.addColorStop(0,'#9DC5F6');bg.addColorStop(.28,'#5585CE');bg.addColorStop(.64,'#2545A5');bg.addColorStop(1,'#0C1C58');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=bg;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const sp=t*.18;
  for(let i=-5;i<=5;i++){
    ctx.save();ctx.translate(cx,cy);ctx.scale(1,.26);
    ctx.beginPath();ctx.ellipse(0,i*r*.19+Math.sin(t*.035+i)*.4*r,r*.95,r*.09,0,0,Math.PI*2);
    ctx.fillStyle=i%2===0?'rgba(70,130,245,.13)':'rgba(35,72,190,.08)';ctx.fill();ctx.restore();
  }
  const gsx=cx+Math.cos(sp*.5)*r*.38,gsy=cy+Math.sin(sp*.38)*r*.17;
  const gsg=ctx.createRadialGradient(gsx,gsy,0,gsx,gsy,r*.18);
  gsg.addColorStop(0,'rgba(6,16,72,.85)');gsg.addColorStop(.5,'rgba(16,35,110,.5)');gsg.addColorStop(1,'rgba(16,35,110,0)');
  ctx.beginPath();ctx.arc(gsx,gsy,r*.18,0,Math.PI*2);ctx.fillStyle=gsg;ctx.fill();
  for(let i=0;i<5;i++){
    const wa=sp*.28+i*1.26,wr=.22+i*.11,wx=cx+Math.cos(wa)*r*wr,wy=cy+Math.sin(wa*.65)*r*.22;
    const wg=ctx.createRadialGradient(wx,wy,0,wx,wy,r*.12);
    wg.addColorStop(0,'rgba(170,205,255,.26)');wg.addColorStop(1,'rgba(170,205,255,0)');
    ctx.beginPath();ctx.arc(wx,wy,r*.12,0,Math.PI*2);ctx.fillStyle=wg;ctx.fill();
  }ctx.restore();
  ctx.save();ctx.translate(cx,cy);ctx.scale(1,.28);
  ctx.beginPath();ctx.arc(0,0,r*1.36,0,Math.PI*2);ctx.arc(0,0,r*1.26,0,Math.PI*2,true);
  ctx.fillStyle='rgba(50,90,190,.16)';ctx.fill();ctx.restore();
  ctx.restore();
}

const DRAWERS=[drawSun,drawEarth,drawMars,drawSaturn,drawNeptune];

// ═══════════════════════════════════════════════════════
// SOLAR SYSTEM LAYOUT
// ═══════════════════════════════════════════════════════
const SYSTEM=[
  {name:'太陽 · Sun',    label:'SUN',      orb:0,   color:'#FFA030', r:42, drawIdx:0},
  {name:'地球 · Earth',  label:'EARTH',    orb:130, color:'#4B9CD3', r:16, drawIdx:1},
  {name:'火星 · Mars',   label:'MARS',     orb:200, color:'#C1440E', r:12, drawIdx:2},
  {name:'土星 · Saturn', label:'SATURN',   orb:305, color:'#E8C060', r:22, drawIdx:3},
  {name:'天王星 · Uranus',label:'URANUS',  orb:375, color:'#7ECEC4', r:15, drawIdx:4},
  {name:'海王星 · Neptune',label:'NEPTUNE',orb:455, color:'#5B8DB8', r:18, drawIdx:4},
];

// returns planet center in "system space" (pixels from system center, unscaled)
function getPlanetPos(idx,t){
  const b=SYSTEM[idx];
  if(b.orb===0) return {x:0,y:0};
  const speed=.032*(1/Math.sqrt(b.orb));
  const angle=t*speed+idx*1.1;
  return {x:b.orb*Math.cos(angle), y:b.orb*Math.sin(angle)*.35};
}

// ═══════════════════════════════════════════════════════
// SCROLL / NAV STATE
// ═══════════════════════════════════════════════════════
const panel=document.getElementById('panel');
const inner=document.getElementById('scroll-inner');
const secs=document.querySelectorAll('.sec');
const dots=document.querySelectorAll('.dot');
const ptag=document.getElementById('ptag');
const shint=document.getElementById('shint');
const transHud=document.getElementById('trans-hud');
const transDestEl=document.getElementById('trans-dest');
const transProgFill=document.getElementById('trans-prog-fill');

let scrollY=0, targetScrollY=0, wheelQ=0;
let curSec=0;
let blockInput=false;
const VH=()=>innerHeight;
const maxSY=()=>(secs.length-1)*VH();

// smooth snap timer
let snapTimer=null;
function schedSnap(){
  clearTimeout(snapTimer);
  snapTimer=setTimeout(()=>{
    const near=Math.round(targetScrollY/VH());
    targetScrollY=clamp(near,0,secs.length-1)*VH();
  },380);
}

window.addEventListener('wheel',e=>{e.preventDefault();if(!blockInput){wheelQ+=e.deltaY*.6;}},{passive:false});
let tsY=0;
window.addEventListener('touchstart',e=>{tsY=e.touches[0].clientY;},{passive:true});
window.addEventListener('touchmove',e=>{if(!blockInput){const dy=tsY-e.touches[0].clientY;tsY=e.touches[0].clientY;wheelQ+=dy*1.1;}},{passive:true});
window.addEventListener('keydown',e=>{
  if(blockInput)return;
  if(e.key==='ArrowDown'||e.key==='PageDown')wheelQ+=VH()*.7;
  if(e.key==='ArrowUp'||e.key==='PageUp')wheelQ-=VH()*.7;
});
dots.forEach(d=>d.addEventListener('click',()=>{
  if(blockInput)return;
  const to=+d.dataset.i;
  if(to!==curSec) beginTransition(curSec,to);
}));

function checkReveals(y){
  secs.forEach((s,i)=>{
    const inView=y>i*VH()-VH()*.6&&y<i*VH()+VH()*.6;
    s.querySelectorAll('.rv').forEach(el=>{
      if(inView)el.classList.add('in'); else el.classList.remove('in');
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  TRANSITION ENGINE
//  Full-screen three-act cinematic on the #tc canvas.
//  The content panel is hidden throughout; only the space scene is visible.
//
//  Act 1 · PULL-OUT  (cam zooms out from planet → solar system overview, ~1.1s)
//  Act 2 · CRUISE    (camera glides across the system to destination, ~1.3s)
//  Act 3 · DIVE-IN   (cam rushes toward destination planet, then snap-reveals, ~0.9s)
// ═══════════════════════════════════════════════════════════════════════════
let TR = {
  active: false,
  phase: 'idle',   // 'pullout' | 'cruise' | 'divein' | 'idle'
  prog:  0,        // 0→1 within current phase
  from:  0,
  to:    0,

  // camera: world-space system coords → screen
  // camCX/camCY = system-world point mapped to screen center
  // camScale = pixels-per-unit
  camCX: 0,
  camCY: 0,
  camScale: 1,

  // at start of each phase we interpolate from/to these camera states
  csFrom: null,
  csTo:   null,

  // accumulated travel progress for the HUD bar (0→1)
  hudProg: 0,
};

// Phase durations in seconds
const PHASE_DUR = {pullout:1.1, cruise:1.4, divein:0.95};

// A "camera state" = {cx, cy, scale} in system-world coords
function makeCamState(worldX, worldY, scale){return {cx:worldX,cy:worldY,scale};}

// Scale to see the full system
function systemOverviewScale(){
  const maxOrb=SYSTEM[SYSTEM.length-1].orb;
  return Math.min(tc.width,tc.height)/(maxOrb*2.8);
}

// Scale for a close-up on a planet of radius r
function planetCloseupScale(r){
  return Math.min(tc.width,tc.height)*.36 / r;
}

function beginTransition(from, to){
  if(TR.active) return;
  TR.active=true; TR.from=from; TR.to=to;
  TR.hudProg=0;
  blockInput=true;

  // Hide content, show transition canvas
  panel.classList.add('hidden');
  shint.style.opacity='0';
  tc.classList.add('visible');
  setTimeout(()=>{transHud.classList.add('visible');},200);
  transDestEl.textContent='— NAVIGATING TO '+SYSTEM[to].label+' —';
  transProgFill.style.width='0%';

  // Initial camera = closeup on FROM planet
  const fromPos=getPlanetPos(from, globalT);
  const closeScale=planetCloseupScale(SYSTEM[from].r);
  TR.camCX=fromPos.x; TR.camCY=fromPos.y; TR.camScale=closeScale;

  TR.phase='pullout'; TR.prog=0;
  const sysScale=systemOverviewScale();
  // Pull out: go from closeup → system view centered on from-planet
  TR.csFrom=makeCamState(fromPos.x, fromPos.y, closeScale);
  TR.csTo  =makeCamState(fromPos.x, fromPos.y, sysScale);
}

function advanceTransition(dt, t){
  if(!TR.active) return;
  TR.prog += dt/PHASE_DUR[TR.phase];
  const p=clamp(TR.prog,0,1);

  if(TR.phase==='pullout'){
    const ep=easeOut2(p);
    TR.camScale=lerp(TR.csFrom.scale, TR.csTo.scale, ep);
    TR.camCX=lerp(TR.csFrom.cx, TR.csTo.cx, ep);
    TR.camCY=lerp(TR.csFrom.cy, TR.csTo.cy, ep);
    TR.hudProg=p*.3;
    if(TR.prog>=1){
      TR.phase='cruise'; TR.prog=0;
      const fromPos=getPlanetPos(TR.from,t);
      const toPos=getPlanetPos(TR.to,t);
      const sysScale=systemOverviewScale();
      TR.csFrom=makeCamState(fromPos.x, fromPos.y, sysScale);
      TR.csTo  =makeCamState(toPos.x, toPos.y, sysScale);
    }
  } else if(TR.phase==='cruise'){
    const ep=easeInOut3(p);
    TR.camCX=lerp(TR.csFrom.cx, TR.csTo.cx, ep);
    TR.camCY=lerp(TR.csFrom.cy, TR.csTo.cy, ep);
    TR.camScale=lerp(TR.csFrom.scale, TR.csTo.scale, ep);
    TR.hudProg=.3+p*.5;
    if(TR.prog>=1){
      TR.phase='divein'; TR.prog=0;
      const toPos=getPlanetPos(TR.to,t);
      const sysScale=systemOverviewScale();
      const closeScale=planetCloseupScale(SYSTEM[TR.to].r);
      TR.csFrom=makeCamState(toPos.x, toPos.y, sysScale);
      TR.csTo  =makeCamState(toPos.x, toPos.y, closeScale);
    }
  } else if(TR.phase==='divein'){
    const ep=easeIn2(p);
    TR.camScale=lerp(TR.csFrom.scale, TR.csTo.scale, ep);
    TR.camCX=lerp(TR.csFrom.cx, TR.csTo.cx, ep);
    TR.camCY=lerp(TR.csFrom.cy, TR.csTo.cy, ep);
    TR.hudProg=.8+p*.2;
    if(TR.prog>=1) finishTransition();
  }

  // Update HUD progress bar
  transProgFill.style.width=(TR.hudProg*100).toFixed(1)+'%';
}

function finishTransition(){
  TR.active=false; TR.phase='idle';
  curSec=TR.to;
  blockInput=false;
  targetScrollY=curSec*VH();
  scrollY=targetScrollY;
  inner.style.transform=`translateY(${-scrollY}px)`;
  checkReveals(scrollY);

  // Update dots & ptag
  dots.forEach((d,i)=>d.classList.toggle('on',i===curSec));
  ptag.textContent=SYSTEM[curSec].name;
  shint.style.opacity=curSec===secs.length-1?'0':'.38';

  // Hide transition canvas, reveal content
  transHud.classList.remove('visible');
  tc.classList.remove('visible');
  setTimeout(()=>{
    panel.classList.remove('hidden');
    // Re-run reveals AFTER panel is visible so animations play correctly
    setTimeout(()=>checkReveals(scrollY), 50);
  },100);
}

// ═══════════════════════════════════════════════════════
// FULL-SCREEN SOLAR SYSTEM SCENE (drawn on #tc)
// ═══════════════════════════════════════════════════════
function drawSystemScene(t){
  const W=tc.width, H=tc.height;
  tctx.clearRect(0,0,W,H);

  // star background on tc too
  stars.forEach(s=>{
    const a=s.a*(.4+.6*Math.sin(t*s.sp+s.ph));
    tctx.beginPath(); tctx.arc(s.x,s.y,s.r*.9,0,Math.PI*2);
    tctx.fillStyle=`rgba(255,255,255,${a})`; tctx.fill();
  });

  // Convert system-world → screen
  // screen = center + (world - cam) * scale
  const SCX=W*.5, SCY=H*.5;
  function wx(wx2){return SCX+(wx2-TR.camCX)*TR.camScale;}
  function wy(wy2){return SCY+(wy2-TR.camCY)*TR.camScale;}

  // orbit ellipses
  SYSTEM.forEach(b=>{
    if(b.orb===0)return;
    tctx.save();
    tctx.strokeStyle='rgba(60,90,150,.4)';
    tctx.lineWidth=.7;
    tctx.setLineDash([5,14]);
    // draw ellipse: save translate to sun screen pos, scale Y by .35
    const sunSX=wx(0), sunSY=wy(0);
    tctx.save();
    tctx.translate(sunSX, sunSY);
    tctx.scale(1,.35);
    tctx.beginPath();
    tctx.arc(0,0,b.orb*TR.camScale,0,Math.PI*2);
    tctx.restore();
    tctx.stroke();
    tctx.setLineDash([]);
    tctx.restore();
  });

  // travel path line (during cruise)
  if(TR.phase==='cruise'){
    const fp=getPlanetPos(TR.from,t), tp=getPlanetPos(TR.to,t);
    const fsx=wx(fp.x), fsy=wy(fp.y*.35+(fp.y*.65)), tsx=wx(tp.x), tsy=wy(tp.y*.35+(tp.y*.65));
    // dashed arc path
    tctx.save();
    tctx.strokeStyle='rgba(100,255,218,.2)';
    tctx.lineWidth=1;
    tctx.setLineDash([8,18]);
    tctx.beginPath();
    // project with .35 Y scale via actual planet screen positions
    const fromSX=wx(fp.x), fromSY=wy(fp.y*.35), toSX=wx(tp.x), toSY=wy(tp.y*.35);
    tctx.moveTo(fromSX, fromSY);
    tctx.lineTo(toSX, toSY);
    tctx.stroke();
    tctx.setLineDash([]);
    tctx.restore();
    // animated dot along path
    const ep=easeInOut3(TR.prog);
    const dotX=lerp(fromSX,toSX,ep), dotY=lerp(fromSY,toSY,ep);
    tctx.beginPath();tctx.arc(dotX,dotY,3.5,0,Math.PI*2);
    tctx.fillStyle='rgba(100,255,218,1)';tctx.fill();
    tctx.beginPath();tctx.arc(dotX,dotY,7,0,Math.PI*2);
    tctx.fillStyle='rgba(100,255,218,.25)';tctx.fill();
    // short comet tail
    const tailX=dotX-Math.cos(Math.atan2(toSY-fromSY,toSX-fromSX))*20;
    const tailY=dotY-Math.sin(Math.atan2(toSY-fromSY,toSX-fromSX))*20;
    const tg=tctx.createLinearGradient(dotX,dotY,tailX,tailY);
    tg.addColorStop(0,'rgba(100,255,218,.6)');tg.addColorStop(1,'rgba(100,255,218,0)');
    tctx.beginPath();tctx.moveTo(dotX,dotY);tctx.lineTo(tailX,tailY);
    tctx.strokeStyle=tg;tctx.lineWidth=2;tctx.stroke();
  }

  // draw each planet
  SYSTEM.forEach((b,i)=>{
    const pos=getPlanetPos(i,t);
    const sx=wx(pos.x), sy=wy(pos.y*.35);   // .35 Y compression = orbital plane tilt
    const pr=Math.max(4, b.r*TR.camScale*.55);

    // destination/source glow
    const isDest=TR.active&&i===TR.to;
    const isSrc=TR.active&&i===TR.from;
    if(isDest){
      const pulse=.5+.5*Math.sin(t*3.5);
      for(let k=3;k>=1;k--){
        tctx.beginPath();tctx.arc(sx,sy,pr*(2+k*.8),0,Math.PI*2);
        tctx.fillStyle=`rgba(100,255,218,${.04*pulse/k})`;tctx.fill();
      }
      tctx.beginPath();tctx.arc(sx,sy,pr*1.9,0,Math.PI*2);
      tctx.fillStyle=`rgba(100,255,218,${.14*pulse})`;tctx.fill();
    } else if(isSrc){
      tctx.beginPath();tctx.arc(sx,sy,pr*2.2,0,Math.PI*2);
      tctx.fillStyle='rgba(100,255,218,.06)';tctx.fill();
    }

    DRAWERS[b.drawIdx](tctx,sx,sy,pr,t,1);

    // label
    if(pr>5){
      tctx.font=`${clamp(pr*.85,8,13)}px 'Space Mono',monospace`;
      tctx.textAlign='center';
      tctx.fillStyle=isDest?'rgba(100,255,218,.9)':'rgba(100,255,218,.45)';
      tctx.fillText(b.label, sx, sy+pr*2.4);
      if(isDest||isSrc){
        tctx.fillStyle='rgba(100,255,218,.25)';
        tctx.fillText(b.name, sx, sy+pr*3.5);
      }
    }
  });

  // distance / speed HUD text (top left corner of tc)
  if(TR.active){
    tctx.save();
    tctx.font="10px 'Space Mono',monospace";
    tctx.fillStyle='rgba(100,255,218,.35)';
    tctx.textAlign='left';
    const dist=Math.round(Math.abs(SYSTEM[TR.to].orb-SYSTEM[TR.from].orb));
    tctx.fillText(`ORIGIN  :  ${SYSTEM[TR.from].label}`, 28, 36);
    tctx.fillText(`DEST    :  ${SYSTEM[TR.to].label}`,   28, 54);
    tctx.fillText(`PHASE   :  ${TR.phase.toUpperCase()}`,28, 72);
    tctx.fillText(`DIST    :  ${dist} AU`,               28, 90);
    tctx.restore();
  }
}

// warp star streaks drawn on #tc during transitions
function drawWarpStreaks(t){
  if(!TR.active) return;
  // intensity ramps up during pullout/cruise, fades on divein
  let intensity=0;
  if(TR.phase==='pullout') intensity=easeOut2(TR.prog)*.7;
  else if(TR.phase==='cruise') intensity=.7;
  else if(TR.phase==='divein') intensity=easeOut2(1-TR.prog)*.5;
  if(intensity<.02) return;
  const cx=tc.width/2, cy=tc.height/2;
  tctx.save();
  stars.forEach(s=>{
    const dx=s.x-cx,dy=s.y-cy;
    const dist=Math.sqrt(dx*dx+dy*dy)||1;
    const stretch=intensity*intensity*clamp(dist/70,1,8)*18;
    const nx=s.x+dx/dist*stretch*1.8, ny=s.y+dy/dist*stretch*1.8;
    const ga=intensity*s.a*(dist/(tc.width)*2+.25);
    if(ga<.02)return;
    const sg=tctx.createLinearGradient(s.x,s.y,nx,ny);
    sg.addColorStop(0,'rgba(255,255,255,0)');
    sg.addColorStop(.25,`rgba(255,255,255,${ga*.55})`);
    sg.addColorStop(1,`rgba(255,255,255,${ga})`);
    tctx.beginPath();tctx.moveTo(s.x,s.y);tctx.lineTo(nx,ny);
    tctx.strokeStyle=sg;tctx.lineWidth=.7+intensity*.6;tctx.stroke();
  });
  tctx.restore();
}

// transition meteors burst pool
const tMeteors=[];
let tMetBurst=0;
function triggerMetBurst(n){
  for(let i=0;i<n;i++) setTimeout(()=>{
    const a=Math.random()*Math.PI*2;
    const spd=14+Math.random()*20;
    tMeteors.push({
      x:tc.width*.5+Math.cos(a)*tc.width*.55,
      y:tc.height*.5+Math.sin(a)*tc.height*.55,
      vx:Math.cos(a+Math.PI)*spd,
      vy:Math.sin(a+Math.PI)*spd,
      len:100+Math.random()*180,w:1+Math.random()*2,life:1,
      col:'rgba(100,255,218,'
    });
  }, i*30);
}

function drawTransMeteors(){
  for(let i=tMeteors.length-1;i>=0;i--){
    const m=tMeteors[i];
    m.x+=m.vx;m.y+=m.vy;m.life-=.022;
    if(m.life<=0){tMeteors.splice(i,1);continue;}
    const tx2=m.x-m.vx*(m.len/18),ty2=m.y-m.vy*(m.len/18);
    const g=tctx.createLinearGradient(m.x,m.y,tx2,ty2);
    g.addColorStop(0,m.col+m.life+')');g.addColorStop(.35,m.col+(m.life*.4)+')');g.addColorStop(1,m.col+'0)');
    tctx.beginPath();tctx.moveTo(m.x,m.y);tctx.lineTo(tx2,ty2);
    tctx.strokeStyle=g;tctx.lineWidth=m.w;tctx.stroke();
    tctx.beginPath();tctx.arc(m.x,m.y,m.w*1.3,0,Math.PI*2);
    tctx.fillStyle=m.col+(m.life*.85)+')';tctx.fill();
  }
}

// ═══════════════════════════════════════════════════════
// MAIN RENDER LOOP
// ═══════════════════════════════════════════════════════
let lastT=0, globalT=0;
function loop(ts){
  const t=ts*.001;
  const dt=Math.min(t-lastT,.05); lastT=t; globalT=t;

  // consume scroll
  if(!blockInput&&wheelQ!==0){
    targetScrollY=clamp(targetScrollY+wheelQ,0,maxSY());
    wheelQ=0; schedSnap();
  } else { wheelQ=0; }

  // detect section crossing
  if(!blockInput){
    const nearSec=clamp(Math.round(targetScrollY/VH()),0,secs.length-1);
    if(nearSec!==curSec){ targetScrollY=nearSec*VH(); beginTransition(curSec,nearSec); }
  }

  // scroll
  if(!blockInput){
    scrollY+=(targetScrollY-scrollY)*(1-Math.pow(.005,dt));
    inner.style.transform=`translateY(${-scrollY}px)`;
    checkReveals(scrollY);
  }

  // advance transition state machine
  if(TR.active){
    const prev=TR.phase;
    advanceTransition(dt,t);
    // fire meteor bursts at phase entrances
    if(prev==='idle'||prev!==TR.phase){
      if(TR.phase==='pullout') triggerMetBurst(12);
      if(TR.phase==='cruise')  triggerMetBurst(22);
      if(TR.phase==='divein')  triggerMetBurst(16);
    }
  }

  // ── BACKGROUND CANVAS (gc) ──
  gctx.clearRect(0,0,gc.width,gc.height);
  if(!TR.active){
    // normal star field
    stars.forEach(s=>{
      const a=s.a*(.45+.55*Math.sin(t*s.sp+s.ph));
      gctx.beginPath();gctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      gctx.fillStyle=`rgba(255,255,255,${a})`;gctx.fill();
    });
    drawMeteors();
  } else {
    // during transit: dim background (tc takes over)
    stars.forEach(s=>{
      gctx.beginPath();gctx.arc(s.x,s.y,s.r*.7,0,Math.PI*2);
      gctx.fillStyle=`rgba(255,255,255,${s.a*.08})`;gctx.fill();
    });
  }

  // ── PLANET CLOSE-UP (pc) ──
  pctx.clearRect(0,0,pc.width,pc.height);
  if(!TR.active){
    const pcx=pc.width*.5, pcy=pc.height*.5;
    const pr=Math.min(pc.width,pc.height)*.285;
    DRAWERS[SYSTEM[curSec].drawIdx](pctx,pcx,pcy,pr,t,1);
  }

  // ── TRANSITION CANVAS (tc) ──
  if(TR.active){
    drawSystemScene(t);
    drawWarpStreaks(t);
    drawTransMeteors();

    // vignette on tc edges
    const vg=tctx.createRadialGradient(tc.width*.5,tc.height*.5,tc.height*.12,tc.width*.5,tc.height*.5,tc.height*.76);
    vg.addColorStop(0,'rgba(2,4,14,0)');vg.addColorStop(.6,'rgba(2,4,14,0)');vg.addColorStop(1,'rgba(2,4,14,.65)');
    tctx.fillStyle=vg;tctx.fillRect(0,0,tc.width,tc.height);
  }

  requestAnimationFrame(loop);
}


// ══════════════════════════════════════════════════════════
// NEURAL GRID LANDING ENGINE
// ══════════════════════════════════════════════════════════
(function(){
  const landingEl = document.getElementById('landing');
  const ngCv      = document.getElementById('ng-canvas');
  const ngCtx     = ngCv.getContext('2d');
  const rktCv     = document.getElementById('rkt-canvas');
  const rktCtx    = rktCv.getContext('2d');
  const nodeCtEl  = document.getElementById('lng-node-ct');

  let W, H, nodes = [], mouse = {x:-999,y:-999};
  let ngT = 0, animating = true, entryStarted = false;

  // ── resize ──
  function resize(){
    W = ngCv.width  = rktCv.width  = innerWidth;
    H = ngCv.height = rktCv.height = innerHeight;
    buildNodes();
  }

  // ── build node grid with organic scatter ──
  function buildNodes(){
    nodes = [];
    const count = Math.max(55, Math.floor(W * H / 10000));
    for(let i = 0; i < count; i++){
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        ox: 0, oy: 0,
        vx: (Math.random() - .5) * .28,
        vy: (Math.random() - .5) * .28,
        r:  Math.random() * 2 + .7,
        pulse: Math.random() * Math.PI * 2,
        pspeed: .025 + Math.random() * .03,
        tier: Math.floor(Math.random() * 3),   // 0=dim 1=mid 2=bright
        active: false,
        pkTimer: Math.random() * 120,          // packet timer
      });
    }
    if(nodeCtEl) nodeCtEl.textContent = count;
  }

  resize();
  window.addEventListener('resize', resize);

  // ── mouse tracking on landing only ──
  landingEl.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  landingEl.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  // ── connection cache (rebuilt each frame for simplicity, short-circuit by distance) ──
  const CONN_DIST = 145;
  const PKT_SPEED = 0.016;

  // active packets: {from, to, t}
  const packets = [];

  // ── main Neural Grid draw ──
  function drawNG(timestamp){
    if(!animating) return;
    requestAnimationFrame(drawNG);
    ngT = timestamp * .001;

    // Background — slight fade trail
    ngCtx.fillStyle = 'rgba(2,4,14,.82)';
    ngCtx.fillRect(0, 0, W, H);

    // Subtle background grid
    ngCtx.strokeStyle = 'rgba(100,255,218,.025)';
    ngCtx.lineWidth = .5;
    const GS = 44;
    for(let x = 0; x < W; x += GS){ ngCtx.beginPath(); ngCtx.moveTo(x,0); ngCtx.lineTo(x,H); ngCtx.stroke(); }
    for(let y = 0; y < H; y += GS){ ngCtx.beginPath(); ngCtx.moveTo(0,y); ngCtx.lineTo(W,y); ngCtx.stroke(); }

    // Update nodes
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if(n.x < 0 || n.x > W) n.vx *= -1;
      if(n.y < 0 || n.y > H) n.vy *= -1;
      n.pulse += n.pspeed;

      // Mouse influence — attract
      const mdx = mouse.x - n.x, mdy = mouse.y - n.y;
      const md = Math.sqrt(mdx*mdx + mdy*mdy);
      if(md < 130 && md > 1){ n.vx += mdx/md * .018; n.vy += mdy/md * .018; }
      // speed cap
      const spd = Math.sqrt(n.vx*n.vx + n.vy*n.vy);
      if(spd > .9){ n.vx = n.vx/spd*.9; n.vy = n.vy/spd*.9; }

      n.active = md < 100;

      // Spawn packets periodically
      n.pkTimer--;
      if(n.pkTimer <= 0){
        n.pkTimer = 80 + Math.random() * 140;
        // find nearest node
        let best = null, bestD = CONN_DIST;
        nodes.forEach(m => {
          if(m === n) return;
          const dx = m.x-n.x, dy = m.y-n.y, d = Math.sqrt(dx*dx+dy*dy);
          if(d < bestD){ bestD = d; best = m; }
        });
        if(best) packets.push({from: n, to: best, t: 0, bright: n.tier===2});
      }
    });

    // Draw connections + data packets
    for(let i = 0; i < nodes.length; i++){
      for(let j = i+1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if(d > CONN_DIST) continue;
        const fade = 1 - d/CONN_DIST;
        const hot  = a.active || b.active;
        const al   = hot ? fade * .75 : fade * .32;
        ngCtx.beginPath();
        ngCtx.moveTo(a.x, a.y);
        ngCtx.lineTo(b.x, b.y);
        ngCtx.strokeStyle = hot
          ? `rgba(100,255,218,${al})`
          : `rgba(80,200,170,${al})`;
        ngCtx.lineWidth = hot ? .9 : .5;
        ngCtx.stroke();
      }
    }

    // Advance & draw packets
    for(let i = packets.length-1; i >= 0; i--){
      const pk = packets[i];
      pk.t += PKT_SPEED;
      if(pk.t >= 1){ packets.splice(i,1); continue; }
      const px = pk.from.x + (pk.to.x - pk.from.x) * pk.t;
      const py = pk.from.y + (pk.to.y - pk.from.y) * pk.t;
      // glow halo
      ngCtx.beginPath(); ngCtx.arc(px, py, pk.bright ? 5 : 3.5, 0, Math.PI*2);
      ngCtx.fillStyle = pk.bright ? 'rgba(100,255,218,.18)' : 'rgba(100,255,218,.08)';
      ngCtx.fill();
      // core dot
      ngCtx.beginPath(); ngCtx.arc(px, py, pk.bright ? 2 : 1.4, 0, Math.PI*2);
      ngCtx.fillStyle = pk.bright ? 'rgba(200,255,240,1)' : 'rgba(100,255,218,.85)';
      ngCtx.fill();
    }

    // Draw nodes
    nodes.forEach(n => {
      const pulse = .5 + .5 * Math.sin(n.pulse);
      const mdx = mouse.x - n.x, mdy = mouse.y - n.y;
      const md  = Math.sqrt(mdx*mdx + mdy*mdy);
      const hot = md < 100;
      const nearish = md < 180;

      const baseR   = n.r * (hot ? 2.6 : 1);
      const baseAl  = n.tier === 2 ? .85 : n.tier === 1 ? .5 : .28;
      const finalAl = (hot ? 1 : nearish ? baseAl*1.4 : baseAl) * (.65 + .35*pulse);

      // outer glow on hot nodes
      if(hot){
        ngCtx.beginPath(); ngCtx.arc(n.x, n.y, baseR * 3.5, 0, Math.PI*2);
        ngCtx.fillStyle = `rgba(100,255,218,${.07*pulse})`; ngCtx.fill();
        ngCtx.beginPath(); ngCtx.arc(n.x, n.y, baseR * 1.9, 0, Math.PI*2);
        ngCtx.fillStyle = `rgba(100,255,218,${.18*pulse})`; ngCtx.fill();
      }

      // node core
      ngCtx.beginPath(); ngCtx.arc(n.x, n.y, baseR, 0, Math.PI*2);
      ngCtx.fillStyle = `rgba(100,255,218,${finalAl})`; ngCtx.fill();

      // bright tier ring
      if(n.tier === 2){
        ngCtx.beginPath(); ngCtx.arc(n.x, n.y, baseR + 2.5, 0, Math.PI*2);
        ngCtx.strokeStyle = `rgba(100,255,218,${.25*pulse})`; ngCtx.lineWidth = .7; ngCtx.stroke();
      }
    });

    // Centre radial glow (always) — draws attention to button area
    const cg = ngCtx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.min(W,H)*.38);
    cg.addColorStop(0, 'rgba(100,255,218,.055)');
    cg.addColorStop(.5, 'rgba(100,255,218,.018)');
    cg.addColorStop(1,  'rgba(100,255,218,0)');
    ngCtx.fillStyle = cg; ngCtx.fillRect(0,0,W,H);
  }

  requestAnimationFrame(drawNG);

  // ══════════════════════════════════════════════════════════
  // ROCKET ENTRY SEQUENCE
  // ══════════════════════════════════════════════════════════
  const trail = [];

  function bezier2(t, p0, p1, p2){ const m=1-t; return m*m*p0 + 2*m*t*p1 + t*t*p2; }

  function addTrailParticle(x, y, vx, vy){
    trail.push({
      x, y,
      vx: vx + (Math.random()-.5)*.8,
      vy: vy + (Math.random()-.5)*.8,
      life: 1,
      r: Math.random()*2.2+.4,
      hue: Math.random() < .3 ? '60,200,255' : '100,255,218'
    });
  }

  function drawRocket(ctx, x, y, angle, scale, t){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Exhaust flame — layered
    const fp = .72 + .28 * Math.sin(t * 22);
    const fl = 22 * fp;
    // outer flame
    const fg1 = ctx.createLinearGradient(0,10,0,10+fl*1.3);
    fg1.addColorStop(0,'rgba(100,255,218,.9)');
    fg1.addColorStop(.3,'rgba(50,180,255,.65)');
    fg1.addColorStop(.65,'rgba(255,140,30,.4)');
    fg1.addColorStop(1,'rgba(255,40,0,0)');
    ctx.beginPath(); ctx.moveTo(-6,10); ctx.quadraticCurveTo(0,10+fl*1.4,6,10);
    ctx.fillStyle=fg1; ctx.fill();
    // inner white core
    const fg2 = ctx.createLinearGradient(0,10,0,10+fl*.7);
    fg2.addColorStop(0,'rgba(255,255,255,.95)');
    fg2.addColorStop(1,'rgba(100,255,218,0)');
    ctx.beginPath(); ctx.moveTo(-2.5,10); ctx.quadraticCurveTo(0,10+fl*.9,2.5,10);
    ctx.fillStyle=fg2; ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0,-22);
    ctx.bezierCurveTo(7,-12, 8,0, 7,10);
    ctx.lineTo(-7,10);
    ctx.bezierCurveTo(-8,0, -7,-12, 0,-22);
    ctx.fillStyle='rgba(215,235,255,.95)'; ctx.fill();
    ctx.strokeStyle='rgba(100,255,218,.55)'; ctx.lineWidth=.9; ctx.stroke();

    // Metallic panel lines
    ctx.strokeStyle='rgba(100,200,220,.3)'; ctx.lineWidth=.5;
    ctx.beginPath(); ctx.moveTo(-5,-2); ctx.lineTo(5,-2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6,4); ctx.lineTo(6,4); ctx.stroke();

    // Nose cone glow
    const ng = ctx.createRadialGradient(0,-19,0,0,-14,10);
    ng.addColorStop(0,'rgba(100,255,218,.7)'); ng.addColorStop(1,'rgba(100,255,218,0)');
    ctx.beginPath(); ctx.arc(0,-17,8,0,Math.PI*2); ctx.fillStyle=ng; ctx.fill();

    // Porthole window
    ctx.beginPath(); ctx.arc(0,-5,4,0,Math.PI*2);
    ctx.fillStyle='rgba(100,255,218,.28)'; ctx.fill();
    ctx.strokeStyle='rgba(100,255,218,.75)'; ctx.lineWidth=.9; ctx.stroke();
    // window glint
    ctx.beginPath(); ctx.arc(-1,-6,1.2,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fill();

    // Left fin
    ctx.beginPath(); ctx.moveTo(-7,3); ctx.lineTo(-15,14); ctx.lineTo(-7,10); ctx.closePath();
    ctx.fillStyle='rgba(80,190,255,.65)'; ctx.fill();
    ctx.strokeStyle='rgba(100,255,218,.35)'; ctx.lineWidth=.6; ctx.stroke();
    // Right fin
    ctx.beginPath(); ctx.moveTo(7,3); ctx.lineTo(15,14); ctx.lineTo(7,10); ctx.closePath();
    ctx.fillStyle='rgba(80,190,255,.65)'; ctx.fill();
    ctx.strokeStyle='rgba(100,255,218,.35)'; ctx.lineWidth=.6; ctx.stroke();

    ctx.restore();
  }

  let rktActive = false;
  let rktProg = 0, rktPhase = 'arc'; // arc → arrive
  let rktSX, rktSY, rktCX, rktCY, rktEX, rktEY;
  let rktX, rktY, rktAngle = 0, rktScale = 1;
  let rktLast = 0, rktT2 = 0;

  window.startEntry = function(){
    if(entryStarted) return;
    entryStarted = true;

    // Fade landing overlay after a beat
    setTimeout(()=>{ landingEl.classList.add('fade-out'); }, 500);

    // Rocket launch origin: screen bottom-centre
    rktSX = W * .5;  rktSY = H * 1.08;
    // Control point: arc up toward top-centre
    rktCX = W * .55; rktCY = -H * .15;
    // End: right-centre (diving into content panel)
    rktEX = W * .88; rktEY = H * .35;

    rktX = rktSX; rktY = rktSY;
    rktActive = true;
    rktCv.classList.add('vis');

    requestAnimationFrame(rktLoop);
  };

  function rktLoop(ts){
    if(!rktActive) return;
    const dt = Math.min((ts*.001 - rktLast), .05);
    rktLast = ts*.001; rktT2 += dt;

    rktCtx.clearRect(0,0,W,H);

    // Draw + advance trail
    trail.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      p.vx*=.93; p.vy*=.93;
      p.life-=.028;
      if(p.life<=0) return;
      rktCtx.beginPath(); rktCtx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);
      rktCtx.fillStyle=`rgba(${p.hue},${p.life*.65})`; rktCtx.fill();
    });
    // cull dead
    for(let i=trail.length-1;i>=0;i--){ if(trail[i].life<=0) trail.splice(i,1); }

    if(rktPhase === 'arc'){
      rktProg = Math.min(rktProg + dt * .48, 1);
      const t2 = rktProg;
      const prevX = rktX, prevY = rktY;
      rktX = bezier2(t2, rktSX, rktCX, rktEX);
      rktY = bezier2(t2, rktSY, rktCY, rktEY);

      // Direction from velocity
      const dx = rktX - prevX, dy = rktY - prevY;
      if(Math.abs(dx)+Math.abs(dy) > .01) rktAngle = Math.atan2(dy, dx) + Math.PI/2;

      // Scale: big at start, normal mid, small as arrives
      rktScale = 1.6 * (1 - rktProg*.45);

      // Trail particles (more at launch)
      const pCount = Math.ceil(4 + (1-rktProg)*3);
      for(let i=0;i<pCount;i++) addTrailParticle(rktX, rktY, -dx*.3, -dy*.3);

      drawRocket(rktCtx, rktX, rktY, rktAngle, rktScale, rktT2);

      if(rktProg >= 1){ rktPhase = 'arrive'; rktProg = 0; }

    } else if(rktPhase === 'arrive'){
      rktProg += dt * 1.6;
      // Rocket zooms forward & fades
      const sc = rktScale * (1 + rktProg * 8);
      rktCtx.globalAlpha = Math.max(0, 1 - rktProg * 1.6);
      drawRocket(rktCtx, rktX, rktY, rktAngle, sc, rktT2);
      rktCtx.globalAlpha = 1;

      if(rktProg >= .65) finishEntry();
      else requestAnimationFrame(rktLoop);
      return;
    }

    requestAnimationFrame(rktLoop);
  }

  function finishEntry(){
    rktActive = false;
    // Flash
    rktCtx.fillStyle='rgba(100,255,218,.14)';
    rktCtx.fillRect(0,0,W,H);
    setTimeout(()=>{
      rktCv.classList.remove('vis');
      rktCtx.clearRect(0,0,W,H);
      // Reveal main UI
      panel.classList.remove('hidden');
      const dotsEl = document.getElementById('dots');
      dotsEl.style.transition='opacity .7s'; dotsEl.style.opacity='1';
      dotsEl.style.pointerEvents='auto';
      ptag.style.transition='opacity .7s'; ptag.style.opacity='1';
      shint.style.transition='opacity .7s'; shint.style.opacity='.38';
      // Remove landing from DOM
      setTimeout(()=>{ animating=false; landingEl.remove(); ngCv.remove(); }, 950);
    }, 200);
  }

})();



// ── 1. Typewriter effect for intro role line ──
(function(){
  const roles = ['數學建模研究者','AI 學習者','隨機過程研究者','科學計算','Python 學習者'];
  let ri=0, ci=0, deleting=false;
  const el=document.getElementById('role-text');
  if(!el) return;
  function tick(){
    const word=roles[ri];
    if(!deleting){
      ci++;
      el.textContent=word.slice(0,ci);
      if(ci===word.length){ deleting=true; setTimeout(tick,1800); return; }
      setTimeout(tick, 90+Math.random()*40);
    } else {
      ci--;
      el.textContent=word.slice(0,ci);
      if(ci===0){ deleting=false; ri=(ri+1)%roles.length; setTimeout(tick,420); return; }
      setTimeout(tick, 48);
    }
  }
  setTimeout(tick,900);
})();

// ── 2. Skill tag toggle highlight ──
document.querySelectorAll('.sk').forEach(sk=>{
  sk.addEventListener('click',()=>{
    sk.classList.toggle('active');
    // ripple effect
    const r=document.createElement('span');
    r.style.cssText='position:absolute;border-radius:50%;background:rgba(100,255,218,.25);width:6px;height:6px;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);transition:transform .4s ease,opacity .4s ease;pointer-events:none;opacity:.7';
    sk.style.position='relative';sk.style.overflow='hidden';
    sk.appendChild(r);
    requestAnimationFrame(()=>{ r.style.transform='translate(-50%,-50%) scale(8)'; r.style.opacity='0'; });
    setTimeout(()=>r.remove(), 450);
  });
});

// ── 2b. Project card hover expand ──
(function(){
  const EXPAND_SCALE = 1.72; // how much bigger the card grows
  let leaveTimer = null;

  document.querySelectorAll('.proj-card').forEach(card=>{
    card.addEventListener('mouseenter', ()=>{
      clearTimeout(leaveTimer);
      const grid = card.closest('.proj-grid');
      const siblings = [...grid.querySelectorAll('.proj-card')];

      // Snapshot natural layout rect BEFORE any mutation
      const gridRect  = grid.getBoundingClientRect();
      const cardRect  = card.getBoundingClientRect();

      // Natural position relative to grid
      const natLeft   = cardRect.left - gridRect.left;
      const natTop    = cardRect.top  - gridRect.top;
      const natW      = cardRect.width;
      const natH      = cardRect.height;

      // Expanded size
      const expW = natW * EXPAND_SCALE;
      const expH = natH * EXPAND_SCALE;

      // Clamp so card doesn't overflow grid box
      let expLeft = natLeft - (expW - natW) / 2;
      let expTop  = natTop  - (expH - natH) / 2;
      expLeft = Math.max(0, Math.min(expLeft, gridRect.width  - expW));
      expTop  = Math.max(0, Math.min(expTop,  gridRect.height - expH));

      // Freeze grid height so layout doesn't jump
      grid.style.height = gridRect.height + 'px';

      // Give each card a placeholder height equal to its natural height
      siblings.forEach(s=>{
        const r = s.getBoundingClientRect();
        s.style.minHeight = r.height + 'px';
      });

      // First: set absolute position at the NATURAL location (no transition yet)
      card.style.transition = 'none';
      card.style.position  = 'absolute';
      card.style.left   = natLeft + 'px';
      card.style.top    = natTop  + 'px';
      card.style.width  = natW + 'px';
      card.style.minHeight = natH + 'px';

      // Force a reflow so the browser registers the starting position
      card.getBoundingClientRect();

      // Now enable transition and animate to expanded size/position
      card.style.transition = 'left .32s ease,top .32s ease,width .32s ease,min-height .32s ease,border-color .32s,box-shadow .32s,opacity .32s,padding .32s';
      card.style.left   = expLeft + 'px';
      card.style.top    = expTop  + 'px';
      card.style.width  = expW + 'px';
      card.style.minHeight = expH + 'px';

      card.classList.add('proj-expanded');
      grid.classList.add('has-expanded');
    });

    card.addEventListener('mouseleave', ()=>{
      leaveTimer = setTimeout(()=>{
        const grid = card.closest('.proj-grid');
        const siblings = [...grid.querySelectorAll('.proj-card')];

        card.classList.remove('proj-expanded');
        grid.classList.remove('has-expanded');

        // Animate back to natural size first, then clear absolute
        card.style.transition = 'left .28s ease,top .28s ease,width .28s ease,min-height .28s ease,border-color .28s,box-shadow .28s,opacity .28s';
        card.style.left = '';
        card.style.top  = '';
        card.style.width = '';
        card.style.minHeight = '';
        setTimeout(()=>{
          card.style.transition = '';
          card.style.position = '';
        }, 300);

        // Unfreeze
        grid.style.height = '';
        siblings.forEach(s=>{ s.style.minHeight=''; });
      }, 60);
    });
  });
})();

// ── 3. Work item expand/collapse ──
document.querySelectorAll('.wk').forEach(wk=>{
  wk.addEventListener('click',()=>{
    const wasOpen=wk.classList.contains('open');
    document.querySelectorAll('.wk.open').forEach(o=>o.classList.remove('open'));
    if(!wasOpen) wk.classList.add('open');
  });
});

// ── 3b. Timeline item click ──
document.querySelectorAll('.tl-item').forEach(item=>{
  item.addEventListener('click',()=>{
    const wasOpen=item.classList.contains('open');
    document.querySelectorAll('.tl-item.open').forEach(o=>o.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
});

// ── 4. Contact copy on click ──
(function(){
  const toast=document.getElementById('copy-toast');
  let toastTimer;
  function showToast(msg){
    if(toast){ toast.textContent=msg||'COPIED TO CLIPBOARD'; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),1800); }
  }
  document.querySelectorAll('.ci').forEach(ci=>{
    ci.addEventListener('click',e=>{
      const val=ci.querySelector('.clv')?.textContent;
      const href=ci.getAttribute('href')||'';
      if(href.startsWith('mailto:')){ navigator.clipboard?.writeText(href.replace('mailto:','')).then(()=>showToast('EMAIL COPIED')); e.preventDefault(); }
      else if(href.startsWith('tel:')){ navigator.clipboard?.writeText(href.replace('tel:','')).then(()=>showToast('PHONE COPIED')); e.preventDefault(); }
      else if(val){ navigator.clipboard?.writeText(val).then(()=>showToast('COPIED')); e.preventDefault(); }
    });
  });
})();

// ── 5. Subtle mouse parallax on content panel ──
(function(){
  let px=0,py=0,tpx=0,tpy=0;
  document.addEventListener('mousemove',e=>{ tpx=(e.clientX/innerWidth-.5)*1.4; tpy=(e.clientY/innerHeight-.5)*1.0; });
  (function parallaxLoop(){
    px+=(tpx-px)*.06; py+=(tpy-py)*.06;
    const inner2=document.getElementById('scroll-inner');
    if(inner2 && !TR.active){
      // subtle tilt without breaking translate Y
      const baseY=parseFloat(inner2.style.transform?.match(/translateY\((.+?)px\)/)?.[1]||0);
      inner2.style.transform=`translateY(${-scrollY}px) translateX(${px*3}px)`;
    }
    requestAnimationFrame(parallaxLoop);
  })();
})();


curSec=0;
targetScrollY=0; scrollY=0;
inner.style.transform='translateY(0)';
secs[0].querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
ptag.textContent=SYSTEM[0].name;
shint.style.opacity='.38';
dots[0].classList.add('on');

// ── Hide main UI until landing completes ──
panel.classList.add('hidden');
document.getElementById('dots').style.cssText='opacity:0;pointer-events:none';
document.getElementById('shint').style.opacity='0';
ptag.style.opacity='0';

requestAnimationFrame(loop);
