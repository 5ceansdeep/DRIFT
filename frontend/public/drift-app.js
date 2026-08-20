
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
   TASTE MAP CANVAS — 우측 GALAXY 패널 배경
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
  if(!mc) return;
  mapR = new THREE.WebGLRenderer({canvas:mc, antialias:true, alpha:true});
  mapR.setClearColor(0xc8f0d8, 1);
  mapR.setPixelRatio(Math.min(devicePixelRatio, 2));
  mapS = new THREE.Scene();

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
  if(!mc) return;
  const p = mc.parentElement;
  const rect = p.getBoundingClientRect();
  mapR.setSize(rect.width, rect.height, false);
  mapCam.aspect = rect.width/rect.height;
  mapCam.updateProjectionMatrix();
}

/* ═══════════════════════════════════
   PANEL SWITCHER — GALAXY/EXPLORE/TWIN 설명 패널
═══════════════════════════════════ */
function switchPanel(name, tabEl) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('on'));
  tabEl.classList.add('on');
  document.getElementById('panel-'+name).classList.add('on');
  if(name === 'galaxy') { setTimeout(() => { initMap(); resizeMap(); }, 50); }
}

/* ═══════════════════════════════════
   MISC — 로그인/회원가입 토글 (랜딩 auth-box)
═══════════════════════════════════ */
function authSwitch(m){
  document.getElementById('at-l').className='auth-t'+(m==='login'?' on':'');
  document.getElementById('at-s').className='auth-t'+(m==='signup'?' on':'');
  document.getElementById('auth-name-row').style.display=m==='signup'?'block':'none';
}
