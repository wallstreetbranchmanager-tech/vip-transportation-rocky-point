(function(){
  const canvas = document.getElementById('globe-canvas');
  if(!canvas) return;
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.25, 6.2);

  function sizeCanvas(){
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const GOLD = 0xD4AF37;
  const IVORY = 0xF0E6D2;
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);
  const R = 2;
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = 'anonymous';
  const TEX_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/';
  function loadTex(name){
    return texLoader.load(TEX_BASE + name, undefined, undefined, function(err){ console.warn('Texture failed:', name); });
  }
  const dayTex   = loadTex('earth_atmos_2048.jpg');
  const specTex  = loadTex('earth_specular_2048.jpg');
  const cloudTex = loadTex('earth_clouds_1024.png');
  if('colorSpace' in dayTex) dayTex.colorSpace = THREE.SRGBColorSpace;
  const earthGeo = new THREE.SphereGeometry(R, 96, 96);
  const earthMat = new THREE.MeshPhongMaterial({ color: 0x2f6b78, map: dayTex, specularMap: specTex, specular: new THREE.Color(0x556570), shininess: 9 });
  globeGroup.add(new THREE.Mesh(earthGeo, earthMat));
  const cloudGroup = new THREE.Group();
  const cloudGeo = new THREE.SphereGeometry(R * 1.012, 64, 64);
  const cloudMat = new THREE.MeshLambertMaterial({map: cloudTex, transparent:true, opacity:0.4, depthWrite:false});
  cloudGroup.add(new THREE.Mesh(cloudGeo, cloudMat));
  globeGroup.add(cloudGroup);
  globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.001, 48, 48), new THREE.MeshBasicMaterial({color:GOLD, wireframe:true, transparent:true, opacity:0.06})));
  globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 48, 48), new THREE.MeshBasicMaterial({color:0x9fd8ff, transparent:true, opacity:0.1, side:THREE.BackSide})));
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sunLight = new THREE.DirectionalLight(0xfff2da, 1.15);
  sunLight.position.set(-4, 2.2, 3.5);
  scene.add(sunLight);
  function latLonToVec3(lat, lon, radius){
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
  }
  const HOME = {lat: 40.95, lon: -72.92};
  const markets = [
    {lat: 40.95, lon: -72.92, label: 'Rocky Point', core: true},
    {lat: 40.64, lon: -73.78, label: 'JFK', core: true},
    {lat: 40.78, lon: -73.87, label: 'LGA', core: true},
    {lat: 40.80, lon: -73.10, label: 'ISP', core: true},
    {lat: 40.71, lon: -74.01, label: 'NYC', core: false},
    {lat: 40.78, lon: -73.97, label: 'Manhattan', core: false}
  ];
  const markerGroup = new THREE.Group();
  globeGroup.add(markerGroup);
  markets.forEach(function(m){
    const pos = latLonToVec3(m.lat, m.lon, R * 1.012);
    const size = m.core ? 0.055 : 0.032;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), new THREE.MeshBasicMaterial({color: m.core ? GOLD : IVORY, transparent:true, opacity: m.core ? 1 : 0.55}));
    dot.position.copy(pos);
    dot.userData = {pulseOffset: Math.random() * Math.PI * 2, core: m.core};
    markerGroup.add(dot);
    if(m.core){
      const halo = new THREE.Mesh(new THREE.SphereGeometry(size * 2.4, 12, 12), new THREE.MeshBasicMaterial({color:GOLD, transparent:true, opacity:0.18, depthWrite:false}));
      halo.position.copy(pos);
      markerGroup.add(halo);
    }
  });
  const home3 = latLonToVec3(HOME.lat, HOME.lon, R * 1.012);
  markets.filter(function(m){ return m.core && !(m.lat === HOME.lat && m.lon === HOME.lon); }).forEach(function(m){
    const end3 = latLonToVec3(m.lat, m.lon, R * 1.012);
    const mid = home3.clone().add(end3).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(R * 1.32);
    const curve = new THREE.QuadraticBezierCurve3(home3, mid, end3);
    const pts = curve.getPoints(48);
    globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:GOLD, transparent:true, opacity:0.45})));
  });
  const starCount = 380;
  const starPos = new Float32Array(starCount * 3);
  for(let i = 0; i < starCount; i++){
    const r = 14 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i*3+2] = r * Math.cos(phi);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color:IVORY, size:0.03, transparent:true, opacity:0.45})));
  globeGroup.rotation.y = 1.15;
  globeGroup.rotation.x = 0.28;
  let dragging = false, lastX = 0, lastY = 0;
  let autoRotate = !reduceMotion;
  const velX = 0.00085;
  function pointerDown(e){ dragging = true; autoRotate = false; const p = e.touches ? e.touches[0] : e; lastX = p.clientX; lastY = p.clientY; }
  function pointerMove(e){ if(!dragging) return; const p = e.touches ? e.touches[0] : e; const dx = p.clientX - lastX, dy = p.clientY - lastY; globeGroup.rotation.y += dx * 0.005; globeGroup.rotation.x += dy * 0.003; globeGroup.rotation.x = Math.max(-0.9, Math.min(0.9, globeGroup.rotation.x)); lastX = p.clientX; lastY = p.clientY; }
  function pointerUp(){ dragging = false; }
  canvas.addEventListener('mousedown', pointerDown);
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup', pointerUp);
  canvas.addEventListener('touchstart', pointerDown, {passive:true});
  window.addEventListener('touchmove', pointerMove, {passive:true});
  window.addEventListener('touchend', pointerUp);
  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if(autoRotate) globeGroup.rotation.y += velX * 16;
    cloudGroup.rotation.y += 0.00025 * 16;
    markerGroup.children.forEach(function(dot){
      if(!reduceMotion && dot.userData.core){
        const s = 1 + Math.sin(t * 2 + (dot.userData.pulseOffset || 0)) * 0.18;
        dot.scale.setScalar(s);
      }
    });
    try { renderer.render(scene, camera); } catch(e) {}
  }
  if(renderer.getContext()) animate();
})();
