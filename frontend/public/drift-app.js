
/* ═══════════════════════════════════
   BG — Explore 스타일 오브젝트 필드클
   (평면 사각형 별 + 십자 마커 + 와이어프레임 정팔면체)
═══════════════════════════════════ */
const bgCanvas = document.getElementById('bg-canvas');
const bgRenderer = new THREE.WebGLRenderer({canvas:bgCanvas, antialias:true, alpha:false});
bgRenderer.setClearColor(0xc8f0d8, 1);
bgRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const bgScene = new THREE.Scene();

const bgCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 120);
bgCamera.position.set(0, 0, 0);

/* ── Explore 스타일 오브젝트 필드클 ── */
const INK = 0x0a0f0c;
const bgObjects = [];

function randZ() { return -80 + Math.random() * 72; }
function randXY(z) {
  const spread = 3.5 + Math.abs(z) * 0.16;
  return [(Math.random()-0.5)*spread*2, (Math.random()-0.5)*spread];
}

/* 1. 평면 사각형 별 (90개) */
for(let i = 0; i < 90; i++) {
  const sz = 0.10 + Math.random()*0.22;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(sz, sz),
    new THREE.MeshBasicMaterial({color:INK, side:THREE.DoubleSide, transparent:true, opacity:0.45+Math.random()*0.4})
  );
  const z = randZ(); const [x,y] = randXY(z);
  m.position.set(x, y, z);
  bgScene.add(m);
  bgObjects.push({mesh:m, speed:0.010+Math.random()*0.018, type:'star'});
}

/* 2. 십자 마커 (50개) */
function makeCross(sz, op) {
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({color:INK, transparent:true, opacity:op});
  [[0,-sz,0,0,sz,0],[-sz,0,0,sz,0,0]].forEach(([x1,y1,z1,x2,y2,z2])=>{
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1,y1,z1),new THREE.Vector3(x2,y2,z2)]);
    g.add(new THREE.Line(geo, mat.clone()));
  });
  return g;
}
for(let i = 0; i < 50; i++) {
  const sz = 0.07+Math.random()*0.13;
  const g = makeCross(sz, 0.20+Math.random()*0.30);
  const z = randZ(); const [x,y] = randXY(z);
  g.position.set(x, y, z);
  bgScene.add(g);
  bgObjects.push({mesh:g, speed:0.008+Math.random()*0.015, type:'cross'});
}

/* 3. 와이어프레임 정팔면체 혜성 (12개) */
for(let i = 0; i < 12; i++) {
  const sz = 0.09+Math.random()*0.16;
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(sz, 0),
    new THREE.MeshBasicMaterial({color:INK, wireframe:true, transparent:true, opacity:0.25+Math.random()*0.28})
  );
  const z = randZ(); const [x,y] = randXY(z);
  m.position.set(x, y, z);
  bgScene.add(m);
  bgObjects.push({mesh:m, speed:0.014+Math.random()*0.022, type:'comet',
    rx:(Math.random()-0.5)*0.010, ry:(Math.random()-0.5)*0.010});
}

function resetObj(obj) {
  const z = -80 - Math.random()*18;
  const [x,y] = randXY(z);
  obj.mesh.position.set(x, y, z);
}

function resizeBg() {
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
  bgCamera.aspect = window.innerWidth / window.innerHeight;
  bgCamera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeBg);
resizeBg();

let mouseX=0, mouseY=0, tgX=0, tgY=0;
window.addEventListener('mousemove', e => {
  mouseX = (e.clientX/window.innerWidth  - 0.5)*0.5;
  mouseY = (e.clientY/window.innerHeight - 0.5)*0.5;
});

let bgT = 0;
function animateBg() {
  requestAnimationFrame(animateBg);
  bgT += 0.003;
  bgObjects.forEach(obj => {
    obj.mesh.position.z += obj.speed;
    if(obj.type==='star')  obj.mesh.lookAt(bgCamera.position);
    if(obj.type==='comet'){ obj.mesh.rotation.x+=obj.rx; obj.mesh.rotation.y+=obj.ry; }
    if(obj.mesh.position.z > 3) resetObj(obj);
  });
  tgX += (mouseX - tgX)*0.04;
  tgY += (mouseY - tgY)*0.04;
  bgCamera.position.x = tgX;
  bgCamera.position.y = -tgY;
  bgRenderer.render(bgScene, bgCamera);
}
animateBg();

/* ═══════════════════════════════════
   TASTE MAP CANVAS (panel C)
═══════════════════════════════════ */
let mapR, mapS, mapCam, mapAnimId;
const genres = {
  indie:     {x:-3,  y:.5,  z:-2,  label:'indie'},
  lofi:      {x:-1,  y:-1,  z:1,   label:'lo-fi'},
  classical: {x:3,   y:1,   z:-1,  label:'classical'},
  altrock:   {x:2,   y:-.5, z:2,   label:'alt-rock'},
  pop:       {x:0,   y:-2,  z:3,   label:'pop'},
  electronic:{x:4,   y:0,   z:0,   label:'electronic'},
  folk:      {x:-3,  y:-1,  z:2,   label:'folk'},
};

function initMap() {
  if(mapR) return;
  const mc = document.getElementById('taste-map-canvas');
  mapR = new THREE.WebGLRenderer({canvas:mc, antialias:true, alpha:true});
  mapR.setClearColor(0xc8f0d8, 1);
  mapR.setPixelRatio(Math.min(devicePixelRatio, 2));
  mapS = new THREE.Scene();
  // map fog removed

  const fr = 7;
  mapCam = new THREE.OrthographicCamera(-fr*1.6, fr*1.6, fr, -fr, .1, 100);
  mapCam.position.set(5, 4, 7); mapCam.lookAt(0,0,0);
  mapS.add(new THREE.AmbientLight(0xffffff, .8));

  function ml(p1,p2,c=0x3a6050,o=.28){
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...p1),new THREE.Vector3(...p2)]);
    return new THREE.Line(g, new THREE.LineBasicMaterial({color:c,transparent:true,opacity:o}));
  }
  /* grid */
  for(let i=-5;i<=5;i++){mapS.add(ml([i,-2,-5],[i,-2,5],0x5a8070,.25));mapS.add(ml([-5,-2,i],[5,-2,i],0x5a8070,.25));}

  /* genre nodes + cluster bubbles */
  const starMeshes = [];
  const tracks=[
    {genre:'indie',coord:[-3.1,.4,-1.8]},{genre:'indie',coord:[-2.9,.8,-2.2]},{genre:'indie',coord:[-3.2,-.2,.3]},
    {genre:'indie',coord:[-2.8,1.2,-1.5]},{genre:'indie',coord:[-2.5,.6,-2.8]},{genre:'indie',coord:[-2.2,.9,-.8]},{genre:'indie',coord:[-3.4,.3,-1.1]},
    {genre:'lofi',coord:[-1.2,-.9,.8]},{genre:'lofi',coord:[-.8,-1.3,1.4]},
    {genre:'classical',coord:[3.1,1.1,-.9]},
    {genre:'altrock',coord:[2.1,-.4,2.1]},
    {genre:'electronic',coord:[4.1,.1,.2]},{genre:'electronic',coord:[3.8,-.3,.8]},
    {genre:'pop',coord:[.1,-2.1,2.9]},
    {genre:'folk',coord:[-3.1,-1.1,2.1]},
  ];
  tracks.forEach(t => {
    const [x,y,z] = t.coord;
    const sz = .18 + Math.random()*.07;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(sz,sz),
      new THREE.MeshBasicMaterial({color:0x0a0f0c, transparent:true, opacity:.8, side:THREE.DoubleSide})
    );
    m.position.set(x,y,z);
    mapS.add(m);
    starMeshes.push(m);
    mapS.add(ml([x,y-0.1,z],[x,y+0.1,z],0x1a3028,.6));
    mapS.add(ml([x-0.1,y,z],[x+0.1,y,z],0x1a3028,.6));
  });

  /* genre sphere clusters */
  const genreGroups = {};
  tracks.forEach((t,i) => {
    if(!genreGroups[t.genre]) genreGroups[t.genre] = [];
    genreGroups[t.genre].push(i);
  });
  Object.entries(genreGroups).forEach(([genre,ids]) => {
    let cx=0,cy=0,cz=0;
    ids.forEach(i=>{cx+=tracks[i].coord[0];cy+=tracks[i].coord[1];cz+=tracks[i].coord[2];});
    cx/=ids.length;cy/=ids.length;cz/=ids.length;
    let maxD=0;
    ids.forEach(i=>{const [x,y,z]=tracks[i].coord;const dx=x-cx,dy=y-cy,dz=z-cz;maxD=Math.max(maxD,Math.sqrt(dx*dx+dy*dy+dz*dz));});
    const r = maxD+.5;
    const wM = new THREE.Mesh(new THREE.SphereGeometry(r,14,10),new THREE.MeshBasicMaterial({color:0x0a0f0c,wireframe:true,transparent:true,opacity:.14}));
    wM.position.set(cx,cy,cz);mapS.add(wM);
    const fM = new THREE.Mesh(new THREE.SphereGeometry(r*.97,20,16),new THREE.MeshBasicMaterial({color:0x0a0f0c,transparent:true,opacity:.04,side:THREE.BackSide}));
    fM.position.set(cx,cy,cz);mapS.add(fM);
  });

  /* MY planet */
  const myP = new THREE.Mesh(new THREE.BoxGeometry(.4,.4,.4),new THREE.MeshBasicMaterial({color:0x0a0f0c}));
  myP.position.set(-1.5,-1.5,.5);mapS.add(myP);
  myP.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.8,.8,.8)),new THREE.LineBasicMaterial({color:0x0a0f0c,transparent:true,opacity:.3})));

  resizeMap();
  let mapT = 0;
  function loopMap(){
    mapAnimId = requestAnimationFrame(loopMap);
    mapT += .003;
    mapCam.position.x = 6 * Math.sin(mapT*.4);
    mapCam.position.z = 6 * Math.cos(mapT*.4);
    mapCam.lookAt(0,0,0);
    starMeshes.forEach(m => m.lookAt(mapCam.position));
    myP.rotation.y += .008;
    mapR.render(mapS, mapCam);
  }
  loopMap();
}

function resizeMap(){
  if(!mapR) return;
  const mc = document.getElementById('taste-map-canvas');
  const p = mc.parentElement;
  const rect = p.getBoundingClientRect();
  mapR.setSize(rect.width, rect.height, false);
  mapCam.aspect = rect.width/rect.height;
  mapCam.updateProjectionMatrix();
}

/* ═══════════════════════════════════
   PANEL SWITCHER
═══════════════════════════════════ */
function switchPanel(name, tabEl) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('on'));
  tabEl.classList.add('on');
  document.getElementById('panel-'+name).classList.add('on');
  if(name === 'map') { setTimeout(() => { initMap(); resizeMap(); }, 50); }
}

/* ═══════════════════════════════════
   REALTIME FEED (시뮬레이션)
═══════════════════════════════════ */
const fakeUsers = ['@jihye_music','@min_wav','@soundwalk','@neon_ears','@drift_user','@lofi_kim','@indie_j','@wavelet','@starmap','@vinyl_oak'];
const fakeTracks = [
  {title:'밤편지',artist:'아이유',emoji:'♩'},
  {title:'Supercut',artist:'Lorde',emoji:'♪'},
  {title:'Rainy Days',artist:'between friends',emoji:'♫'},
  {title:'Clair de Lune',artist:'Debussy',emoji:'♬'},
  {title:'Motion Sickness',artist:'Phoebe Bridgers',emoji:'♩'},
  {title:'Electric Feel',artist:'MGMT',emoji:'♪'},
  {title:'Oblivion',artist:'Grimes',emoji:'♫'},
  {title:'Midnight City',artist:'M83',emoji:'♬'},
  {title:'Driver',artist:'Indigo De Souza',emoji:'♩'},
  {title:'Swim',artist:'Peach Pit',emoji:'♪'},
  {title:'Feel Good Inc.',artist:'Gorillaz',emoji:'♫'},
  {title:'Teen Idle',artist:'Marina',emoji:'♬'},
];
const timeLabels = ['방금','1분 전','2분 전','3분 전','5분 전','7분 전','12분 전','18분 전'];

function randItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function mkCoverCells() {
  let h='';
  for(let i=0;i<4;i++){const op=Math.random()<.4?'1':Math.random()<.5?'.4':'0';h+=`<div class="ft-blk-cell" style="opacity:${op}"></div>`;}
  return h;
}

function addFeedItem(isNew = false) {
  const list = document.getElementById('feed-list');
  if(!list) return;
  const t = randItem(fakeTracks);
  const u = randItem(fakeUsers);
  const tm = timeLabels[Math.floor(Math.random()*3)];
  const el = document.createElement('div');
  el.className = 'feed-track' + (isNew?' new-item':'');
  el.innerHTML = `
    <div class="ft-new-badge"></div>
    <div class="ft-blk">${mkCoverCells()}</div>
    <div class="ft-info">
      <div class="ft-title">${t.title}</div>
      <div class="ft-artist">${t.artist}</div>
    </div>
    <div class="ft-meta">
      <div class="ft-user">${u}</div>
      <div class="ft-time">${tm}</div>
    </div>
    <div class="ft-save" onclick="showToast(event)">저장</div>
  `;
  list.insertBefore(el, list.firstChild);
  /* 8개 이과 시 마지막 제거 */
  while(list.children.length > 8) list.removeChild(list.lastChild);
  /* 뱃지 fade out */
  if(isNew) setTimeout(() => el.classList.remove('new-item'), 2000);
}

/* 초기 피드 채우기 */
for(let i=0;i<7;i++) addFeedItem(false);

/* 실시 추가: 2~6초마다 */
function scheduleNext() {
  const delay = 2000 + Math.random() * 4000;
  setTimeout(() => { addFeedItem(true); scheduleNext(); }, delay);
}
scheduleNext();

/* ═══════════════════════════════════
   SIGNAL PANEL
═══════════════════════════════════ */
const wfData = [4,9,14,8,18,11,22,15,9,7,15,20,11,8,13,15,10,20,13,9,16,12,21,14,10,8];
const wfEl = document.getElementById('sig-wf');
wfData.forEach((h,i) => {
  const d = document.createElement('div');
  d.className = 'sig-wb' + (i<12?' active':'');
  d.style.height = h+'px'; d.style.flex='1';
  wfEl.appendChild(d);
});
setInterval(()=>{
  document.querySelectorAll('.sig-wb.active').forEach(b => {b.style.height=(3+Math.floor(Math.random()*19))+'px';});
},120);

function setSigCard(title,artist,emoji,tags){
  document.getElementById('sig-title').textContent=title;
  document.getElementById('sig-artist').textContent=artist;
  document.getElementById('sig-emoji').textContent=emoji;
}

/* ═══════════════════════════════════
   MISC
═══════════════════════════════════ */

function showToast(e){
  e.stopPropagation();
  const t=document.getElementById('toast');t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1800);
}

/* ── OTHER PAGES JS ── */
/* ── DATA ── */
const tracks=[
  {id:0,title:'밤편지',artist:'아이유',emoji:'♩',genre:'indie',tags:['indie','lo-fi','새벽감성'],coord:[-3.1,.4,-1.8]},
  {id:1,title:'Supercut',artist:'Lorde',emoji:'♪',genre:'indie',tags:['indie pop','nostalgic'],coord:[-2.9,.8,-2.2]},
  {id:2,title:'Rainy Days',artist:'between friends',emoji:'♫',genre:'lofi',tags:['lo-fi','rainy'],coord:[-1.2,-.9,.8]},
  {id:3,title:'Clair de Lune',artist:'Debussy',emoji:'♬',genre:'classical',tags:['classical','ambient'],coord:[3.1,1.1,-.9]},
  {id:4,title:'Feel Good Inc.',artist:'Gorillaz',emoji:'♩',genre:'altrock',tags:['alternative','energetic'],coord:[2.1,-.4,2.1]},
  {id:5,title:'Motion Sickness',artist:'Phoebe Bridgers',emoji:'♪',genre:'indie',tags:['indie folk','sad'],coord:[-3.2,-.2,.3]},
  {id:6,title:'Electric Feel',artist:'MGMT',emoji:'♫',genre:'indie',tags:['indie','psychedelic'],coord:[-2.8,1.2,-1.5]},
  {id:7,title:'Oblivion',artist:'Grimes',emoji:'♬',genre:'electronic',tags:['electronic','dreamy'],coord:[4.1,.1,.2]},
  {id:8,title:'Midnight City',artist:'M83',emoji:'♩',genre:'electronic',tags:['synth','80s'],coord:[3.8,-.3,.8]},
  {id:9,title:'Teen Idle',artist:'Marina',emoji:'♪',genre:'indie',tags:['indie pop','melancholy'],coord:[-2.5,.6,-2.8]},
  {id:10,title:'Peaches',artist:'Justin Bieber',emoji:'♫',genre:'pop',tags:['pop','summer'],coord:[.1,-2.1,2.9]},
  {id:11,title:'Flapper Girl',artist:'The Lumineers',emoji:'♬',genre:'folk',tags:['folk','acoustic'],coord:[-3.1,-1.1,2.1]},
  {id:12,title:'Driver',artist:'Indigo De Souza',emoji:'♩',genre:'indie',tags:['indie','sad'],coord:[-2.2,.9,-.8]},
  {id:13,title:'Dreamer',artist:'Cospe',emoji:'♪',genre:'lofi',tags:['lo-fi','chill'],coord:[-.8,-1.3,1.4]},
  {id:14,title:'Swim',artist:'Peach Pit',emoji:'♫',genre:'indie',tags:['indie pop','dreamy'],coord:[-3.4,.3,-1.1]},
];
const gc={indie:{x:-3,y:.5,z:-2},lofi:{x:-1,y:-1,z:1},classical:{x:3,y:1,z:-1},altrock:{x:2,y:-.5,z:2},pop:{x:0,y:-2,z:3},electronic:{x:4,y:0,z:0},folk:{x:-3,y:-1,z:2}};
const comets=[{orbitR:3.5,phase:0,speed:.25},{orbitR:4.7,phase:2.09,speed:.35},{orbitR:5.9,phase:4.19,speed:.2}];

/* ── MARQUEE ── */
const mqEl=document.getElementById('mq-i');
const mqTxt=tracks.map(t=>`${t.title} — ${t.artist}`).join('<span class="mq-s">·</span>');
mqEl.innerHTML=mqTxt+'<span class="mq-s">·</span>'+mqTxt;

/* ── SCREEN NAV ── */
function go(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('on'));
  document.getElementById('s-'+name).classList.add('on');
  const tab=document.querySelector(`.ntab[data-s="${name}"]`);
  if(tab)tab.classList.add('on');
  if(name==='explore'){setTimeout(()=>{initExp();resizeExp();},50);}
  if(name==='social'){setTimeout(()=>{initSoc();resizeSoc();},50);}
}

/* ── EXPLORE THREE.JS ── */
let expR,expS,expCam,expTMs=[],expCMs=[],expTP=[];
const _clusterLabelEls=[];

function updateClusterLabels(){
  if(!window.expCam||!_clusterLabelEls.length) return;
  const w=window.innerWidth;
  const h=window.innerHeight-44-28-40;
  _clusterLabelEls.forEach(function(item){
    const el=item.el, pos=item.pos;
    const v=pos.clone().project(window.expCam);
    const x=((v.x+1)/2)*w;
    const y=((-v.y+1)/2)*h;
    if(x>20&&x<w-20&&y>10&&y<h-10&&v.z<1){
      el.style.left=x+'px';
      el.style.top=y+'px';
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  });
}
let expDrag=false,expPrev={x:0,y:0},expMD={x:0,y:0};
let thE=.6,phE=.65,tThE=.6,tPhE=.65,zmE=1,tZmE=1;
let expMS,expPlayI=null,expProg=0,expPlay=false;
const rc=new THREE.Raycaster(),m2=new THREE.Vector2();
let hovId=-1;
let _gSpheres={},_activeSphereGenre=null,_tgtSphOp=0;

function initExp(){
  if(expR)return;
  const cv=document.getElementById('exp-c');
  expR=new THREE.WebGLRenderer({canvas:cv,antialias:true});
  expR.setClearColor(0xc8f0d8,1);expR.setPixelRatio(Math.min(devicePixelRatio,2));
  expS=new THREE.Scene();
  expCam=new THREE.OrthographicCamera(-12.8,12.8,8,-8,.1,100);
  window.expCam=expCam;
  expCam.position.set(6,5,8);expCam.lookAt(0,0,0);
  resizeExp();
  expS.add(new THREE.AmbientLight(0xffffff,.85));
  const dl=new THREE.DirectionalLight(0xffffff,.5);dl.position.set(5,8,5);expS.add(dl);
  function ml(p1,p2,c=0x4a7060,o=.3){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...p1),new THREE.Vector3(...p2)]);return new THREE.Line(g,new THREE.LineBasicMaterial({color:c,transparent:true,opacity:o}));}
  Object.values(gc).forEach(c=>{expS.add(ml([c.x,c.y-1.5,c.z],[c.x,c.y+1.5,c.z],0x3a6050,.32));expS.add(ml([c.x-1.5,c.y,c.z],[c.x+1.5,c.y,c.z],0x3a6050,.32));});
  for(let i=-5;i<=5;i++){expS.add(ml([i,-2,-5],[i,-2,5],0x5a8070,.16));expS.add(ml([-5,-2,i],[5,-2,i],0x5a8070,.16));}
  expMS=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshLambertMaterial({color:0x0a0f0c}));
  expMS.position.set(-1.5,-1.5,.5);expS.add(expMS);
  expMS.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:0x0a0f0c,transparent:true,opacity:.25})));
  expTP=tracks.map(t=>{const c=gc[t.genre]||{x:0,y:0,z:0};return{x:c.x+(Math.random()-.5)*2.2,y:c.y+(Math.random()-.5)*1.5,z:c.z+(Math.random()-.5)*2.2};});
  tracks.forEach((t,i)=>{
    const p=expTP[i];const sz=.2+Math.random()*.07;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshLambertMaterial({color:0x0a0f0c,side:THREE.DoubleSide}));
    m.position.set(p.x,p.y,p.z);m.userData={trackId:i};expS.add(m);expTMs.push(m);
    const arm=.13;
    expS.add(ml([p.x,p.y-arm,p.z],[p.x,p.y+arm,p.z],0x1a3028,.6));
    expS.add(ml([p.x-arm,p.y,p.z],[p.x+arm,p.y,p.z],0x1a3028,.6));
    if(i<5)expS.add(ml([-1.5,-1.5,.5],[p.x,p.y,p.z],0x3a6050,.13));
  });
  comets.forEach(c=>{
    const m=new THREE.Mesh(new THREE.OctahedronGeometry(.13,0),new THREE.MeshLambertMaterial({color:0x0a0f0c,wireframe:true}));
    m.userData=c;expS.add(m);expCMs.push(m);
    const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
    m.add(new THREE.Line(tg,new THREE.LineBasicMaterial({color:0x0a0f0c,transparent:true,opacity:.2})));
  });

  /* ── 장르 구 (hover 시 표시) ── */
  const genreGroups={};
  tracks.forEach((t,i)=>{if(!genreGroups[t.genre])genreGroups[t.genre]=[];genreGroups[t.genre].push(i);});
  Object.entries(genreGroups).forEach(([genre,ids])=>{
    let cx=0,cy=0,cz=0;
    ids.forEach(i=>{cx+=expTP[i].x;cy+=expTP[i].y;cz+=expTP[i].z;});
    cx/=ids.length;cy/=ids.length;cz/=ids.length;
    let maxD=0;
    ids.forEach(i=>{const dx=expTP[i].x-cx,dy=expTP[i].y-cy,dz=expTP[i].z-cz;maxD=Math.max(maxD,Math.sqrt(dx*dx+dy*dy+dz*dz));});
    const r=maxD+.55;
    const wM=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),new THREE.MeshBasicMaterial({color:0x0a0f0c,wireframe:true,transparent:true,opacity:0}));
    wM.position.set(cx,cy,cz);expS.add(wM);
    const fM=new THREE.Mesh(new THREE.SphereGeometry(r*.98,24,18),new THREE.MeshBasicMaterial({color:0x0a0f0c,transparent:true,opacity:0,side:THREE.BackSide}));
    fM.position.set(cx,cy,cz);expS.add(fM);
    _gSpheres[genre]={wire:wM,fill:fM};
  });


  /* ── 장르 클러스터 라벨 초기화 (initExp 안에서만) ── */
  const _clusterLabelContainer = document.getElementById('exp-cluster-labels');
  const _gcLabels = {
    indie:'indie', lofi:'lo-fi', classical:'classical',
    altrock:'alt-rock', pop:'pop', electronic:'electronic', folk:'folk'
  };
  Object.entries(gc).forEach(([genre, c]) => {
    const el = document.createElement('div');
    el.className = 'cluster-label';
    el.textContent = _gcLabels[genre] || genre;
    _clusterLabelContainer.appendChild(el);
    _clusterLabelEls.push({ el, pos: new THREE.Vector3(c.x, c.y + 1.9, c.z) });
  });

  /* events */
  const cv2=document.getElementById('exp-c');
  cv2.addEventListener('mousedown',e=>{expDrag=true;expPrev={x:e.clientX,y:e.clientY};expMD={x:e.clientX,y:e.clientY};});
  window.addEventListener('mouseup',()=>{expDrag=false;});
  window.addEventListener('mousemove',e=>{
    if(expDrag){tThE-=(e.clientX-expPrev.x)*.004;tPhE-=(e.clientY-expPrev.y)*.004;tPhE=Math.max(.15,Math.min(1.4,tPhE));expPrev={x:e.clientX,y:e.clientY};return;}
    const rect=cv2.getBoundingClientRect();
    m2.x=((e.clientX-rect.left)/rect.width)*2-1;m2.y=-((e.clientY-rect.top)/rect.height)*2+1;
    rc.setFromCamera(m2,expCam);
    const hits=rc.intersectObjects(expTMs,false);
    const tip=document.getElementById('star-tip');
    if(hits.length>0){
      const tid=hits[0].object.userData.trackId;const t=tracks[tid];
      cv2.style.cursor='pointer';
      tip.textContent=`${t.title} — ${t.artist}`;tip.style.left=(e.clientX+14)+'px';tip.style.top=(e.clientY-12)+'px';tip.classList.add('show');
      document.getElementById('hx').textContent=t.coord[0].toFixed(2);document.getElementById('hy').textContent=t.coord[1].toFixed(2);document.getElementById('hz').textContent=t.coord[2].toFixed(2);
      if(hovId!==tid){
        if(hovId>=0&&expTMs[hovId])expTMs[hovId].scale.set(1,1,1);
        hits[0].object.scale.set(1.7,1.7,1.7);hovId=tid;
        /* 장르 구 활성화 */
        _activeSphereGenre=t.genre;_tgtSphOp=1;
      }
    } else {
      cv2.style.cursor='crosshair';tip.classList.remove('show');
      if(hovId>=0&&expTMs[hovId])expTMs[hovId].scale.set(1,1,1);
      hovId=-1;['hx','hy','hz'].forEach(id=>document.getElementById(id).textContent='─');
      _activeSphereGenre=null;_tgtSphOp=0;
    }
  });
  cv2.addEventListener('wheel',e=>{tZmE=Math.max(.4,Math.min(2.5,tZmE+e.deltaY*.001));},{passive:true});
  cv2.addEventListener('click',e=>{
    if(Math.abs(e.clientX-expMD.x)>5||Math.abs(e.clientY-expMD.y)>5)return;
    const rect=cv2.getBoundingClientRect();m2.x=((e.clientX-rect.left)/rect.width)*2-1;m2.y=-((e.clientY-rect.top)/rect.height)*2+1;
    rc.setFromCamera(m2,expCam);const hits=rc.intersectObjects(expTMs,false);
    if(hits.length>0){openTP(hits[0].object.userData.trackId);const r=document.createElement('div');r.className='ripple';r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),500);}
  });
}
function resizeExp(){
  if(!expR)return;
  const w=window.innerWidth,h=window.innerHeight-44-28;
  expR.setSize(w,h,false);
  const fr=8/zmE,a=w/h;
  expCam.left=-fr*a;expCam.right=fr*a;expCam.top=fr;expCam.bottom=-fr;expCam.updateProjectionMatrix();
}

function openTP(tid){
  const t=tracks[tid];
  document.getElementById('tp-idx').textContent=`TRACK · ${String(tid).padStart(3,'0')} · ${t.genre.toUpperCase()}`;
  document.getElementById('tp-nbg').textContent=String(tid).padStart(2,'0');
  document.getElementById('tp-title').textContent=t.title;document.getElementById('tp-artist').textContent=t.artist;
  document.getElementById('alb-emoji').textContent=t.emoji;document.getElementById('tp-g').textContent=t.genre;
  document.getElementById('tp-c').textContent=`(${t.coord[0].toFixed(1)},${t.coord[1].toFixed(1)},${t.coord[2].toFixed(1)})`;
  document.getElementById('tp-s').textContent=`${12+tid*7}회`;
  document.getElementById('tp-tags').innerHTML=t.tags.map(tg=>`<span class="tp-tag">${tg}</span>`).join('');
  buildWF();startPlay();
  const ag=document.getElementById('alb-grid');ag.innerHTML='';
  for(let i=0;i<16;i++){const c=document.createElement('div');c.className='alb-cell';const v=(i*tid*7+i*13)%100;c.style.opacity=v<35?'0':v<65?'0.3':'0.75';ag.appendChild(c);}
  document.getElementById('tp').classList.add('open');
}
function buildWF(){
  const el=document.getElementById('wf');el.innerHTML='';
  [4,9,14,8,18,11,22,15,9,7,15,20,11,8,13,15,10,20,13,9].forEach((h,i)=>{const d=document.createElement('div');d.className='wb '+(i<14?'':'fut');d.style.height=h+'px';el.appendChild(d);});
}
function startPlay(){clearInterval(expPlayI);expProg=0;expPlay=true;document.getElementById('tp-play').textContent='일시정지';const ph=document.getElementById('wf-ph');expPlayI=setInterval(()=>{if(!expPlay)return;expProg=Math.min(expProg+.5,100);ph.style.left=expProg+'%';const cur=Math.round((expProg/100)*232);document.getElementById('tp-time').textContent=`${Math.floor(cur/60)}:${(cur%60).toString().padStart(2,'0')} / 3:52`;if(expProg>=100)clearInterval(expPlayI);},150);}
function togglePlay(){expPlay=!expPlay;document.getElementById('tp-play').textContent=expPlay?'일시정지':'재생';}
function closeTP(){document.getElementById('tp').classList.remove('open');clearInterval(expPlayI);}
function saveTrack(){const t=document.getElementById('save-toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);}
function setVibe(el,mode){document.querySelectorAll('#exp-bar .vbtn').forEach(b=>b.classList.remove('on'));el.classList.add('on');const c={similar:0x0a0f0c,new:0x4a6050,edge:0x2a3830};expTMs.forEach(m=>m.material.color.setHex(c[mode]));}
function setVibeP(el,mode){document.querySelectorAll('.evp-btn').forEach(b=>b.classList.remove('on'));el.classList.add('on');const c={similar:0x0a0f0c,new:0x4a6050,edge:0x2a3830};expTMs.forEach(m=>m.material.color.setHex(c[mode]));}

/* ── SOC CANVAS ── */
let socR,socS,socCam;
function initSoc(){
  if(socR)return;const sc=document.getElementById('soc-c');if(!sc)return;
  socR=new THREE.WebGLRenderer({canvas:sc,antialias:true,alpha:true});socR.setClearColor(0x0a0f0c,1);
  socS=new THREE.Scene();socCam=new THREE.PerspectiveCamera(60,1,.1,100);socCam.position.set(0,0,8);socS.add(new THREE.AmbientLight(0xffffff,.5));
  const pts=new Float32Array(24),cols=new Float32Array(24);
  for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2,r=1.5+Math.sin(i*1.3);pts[i*3]=Math.cos(a)*r+(Math.random()-.5)*.8;pts[i*3+1]=(Math.random()-.5)*2;pts[i*3+2]=Math.sin(a)*r+(Math.random()-.5)*.8;cols[i*3]=.78;cols[i*3+1]=.94;cols[i*3+2]=.85;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pts,3));g.setAttribute('color',new THREE.BufferAttribute(cols,3));
  socS.add(new THREE.Points(g,new THREE.PointsMaterial({size:.5,vertexColors:true,transparent:true,opacity:.9})));
  resizeSoc();
}
function resizeSoc(){if(!socR)return;const sc=document.getElementById('soc-c');const p=sc.parentElement;const h=Math.floor(p.getBoundingClientRect().height*.6)||200;socR.setSize(300,h,false);socCam.aspect=300/h;socCam.updateProjectionMatrix();}

/* ── TIMELINE ── */
const tlH=document.getElementById('tl-h'),tlF=document.getElementById('tl-f'),tlT=document.getElementById('tl-t');
let tlDrag=false;
tlH.addEventListener('mousedown',e=>{tlDrag=true;e.stopPropagation();});
window.addEventListener('mouseup',()=>{tlDrag=false;});
window.addEventListener('mousemove',e=>{if(!tlDrag)return;const rect=tlT.getBoundingClientRect();const pct=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));tlF.style.width=(pct*100)+'%';tlH.style.left=(pct*100)+'%';const sy=2016+Math.round(pct*6);document.getElementById('tl-cur').textContent=`현재 보기: ${sy} – ${Math.min(sy+2,2024)} · ${Math.round(40+Math.random()*80)} TRACKS`;});

/* ── MISC UI ── */
function authSwitch(m){document.getElementById('at-l').className='auth-t'+(m==='login'?' on':'');document.getElementById('at-s').className='auth-t'+(m==='signup'?' on':'');document.getElementById('auth-name-row').style.display=m==='signup'?'block':'none';}
function filterGenre(el){document.querySelectorAll('.genre-item').forEach(g=>g.classList.remove('on'));el.classList.add('on');}
function selUser(el){document.querySelectorAll('.urow').forEach(r=>r.classList.remove('sel'));el.classList.add('sel');}
function setTab(el){document.querySelectorAll('.set-nav-item').forEach(i=>i.classList.remove('on'));el.classList.add('on');}
function selectTrack(el,title,artist,genre,year){document.getElementById('sel-title').textContent=title;document.getElementById('sel-artist').textContent=`${artist} · ${year}`;document.getElementById('sel-emoji').textContent='♩';}
function addConfirm(){const t=document.getElementById('save-toast');t.classList.add('show');setTimeout(()=>{t.classList.remove('show');go('archive');},1500);}
function fakeSearch(v){}



/* ── ANIMATE ── */
let T=0;
function animate(){
  requestAnimationFrame(animate);T+=.005;
  if(socR&&document.getElementById('s-social').classList.contains('on')){resizeSoc();socCam.position.x=6*Math.sin(T*.2);socCam.position.z=6*Math.cos(T*.2);socCam.lookAt(0,0,0);socR.render(socS,socCam);}
  if(expR&&document.getElementById('s-explore').classList.contains('on')){
    thE+=(tThE-thE)*.07;phE+=(tPhE-phE)*.07;zmE+=(tZmE-zmE)*.07;
    const r=9*zmE,a=window.innerWidth/(window.innerHeight-44)||1.6,fr=8/zmE;
    expCam.position.x=r*Math.sin(phE)*Math.sin(thE);expCam.position.y=r*Math.cos(phE);expCam.position.z=r*Math.sin(phE)*Math.cos(thE);expCam.lookAt(0,0,0);
    expCam.left=-fr*a;expCam.right=fr*a;expCam.top=fr;expCam.bottom=-fr;expCam.updateProjectionMatrix();
    expTMs.forEach(m=>{if(hovId!==m.userData.trackId)m.lookAt(expCam.position);});
    if(!expDrag)tThE+=.0004;
    expCMs.forEach(m=>{const d=m.userData;const px=Math.cos(T*d.speed+d.phase)*d.orbitR,pz=Math.sin(T*d.speed+d.phase)*d.orbitR;m.position.set(px,Math.sin(T*d.speed*.5)*.6,pz);m.rotation.x+=.018;m.rotation.y+=.012;const tail=m.children[0];if(tail){const p=tail.geometry.attributes.position;p.array[0]=0;p.array[1]=0;p.array[2]=0;p.array[3]=Math.cos(T*d.speed+d.phase-.15)*d.orbitR-px;p.array[4]=0;p.array[5]=Math.sin(T*d.speed+d.phase-.15)*d.orbitR-pz;p.needsUpdate=true;}});
    const ps=1+Math.sin(T*1.5)*.05;expMS.scale.set(ps,ps,ps);
    /* 장르 구 애니메이션 */
    Object.entries(_gSpheres).forEach(([genre,s])=>{
      const isActive=genre===_activeSphereGenre;
      const curW=s.wire.material.opacity,curF=s.fill.material.opacity;
      if(isActive){
        const pulse=.12+Math.sin(T*2.5)*.025;
        s.wire.material.opacity+=(pulse-curW)*.08;s.fill.material.opacity+=(.04-curF)*.06;
        const sc=1+Math.sin(T*1.8)*.01;s.wire.scale.set(sc,sc,sc);s.fill.scale.set(sc,sc,sc);
      } else {
        s.wire.material.opacity+=(0-curW)*.1;s.fill.material.opacity+=(0-curF)*.1;
        s.wire.scale.set(1,1,1);s.fill.scale.set(1,1,1);
      }
    });
    updateClusterLabels();
    expR.render(expS,expCam);
  }
}
animate();
setInterval(()=>{if(!expPlay)return;document.querySelectorAll('.wb:not(.fut)').forEach(b=>{b.style.height=(3+Math.floor(Math.random()*19))+'px';});},110);
