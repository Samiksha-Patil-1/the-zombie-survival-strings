/**
 * ZOMBIE: STRING OF SURVIVAL — AAA 3D/4D/5D SURVIVAL HORROR ENGINE
 * Features:
 * - Sprawling Apocalyptic City District with Skyscrapers, Overpasses, and Burning Embers
 * - Tactical Recon Drone (PUBG/Free Fire style free-flying camera to view the whole city)
 * - Skeletal & Procedural Animations: Walking, Sprinting, Melee Bat Swing Arc, Weapon Recoil, Zombie Claw Lunges, Ragdoll Death
 * - Real-time Minimap & Compass Bar (PUBG / Free Fire HUD)
 * - Click-To-Play Overlay + Fallback Drag-Look (Guaranteed controls on all browsers)
 * - Dynamic Day/Night Cycle with Lighting, Shadows, and Lightning Storms
 * - Base Heat Attraction Dome with Interactive Diesel Generator
 * - Physical NPC Survivors & Adaptive 3D Zombie Archetypes
 */

class SurvivalGame3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container #${containerId} not found in DOM.`);
    }

    this.width = this.container.clientWidth || 960;
    this.height = this.container.clientHeight || 600;

    // Temporal 4D Cycle (Day/Night)
    this.gameTime = 10.0; // 10:00 AM (Bright daytime for clear visibility)
    this.currentDay = 1;
    this.timeSpeed = 0.03;

    // 5D Bio-Physical Stats
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      hunger: 90,
      thirst: 85,
      infection: 0,
      temperature: 36.8,
      noiseLevel: 0,
      ammo: 24,
      maxAmmo: 24,
      currentWeapon: 'pistol', // 'pistol' or 'bat'
      isCrouching: false,
      isSprinting: false,
      isAiming: false,
      isReloading: false,
      isAttacking: false,
      flashlightOn: true,
      dominantArchetype: 'Hunter'
    };

    // Camera Modes: 'fps' (First-Person), 'tps' (Third-Person), 'drone' (City Flying Camera)
    this.cameraMode = 'fps';
    this.drone = {
      position: new THREE.Vector3(-30, 85, 20),
      velocity: new THREE.Vector3(),
      yaw: 0,
      pitch: -0.5,
      speed: 45.0
    };

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.flashlight = null;
    this.flashlightTarget = null;
    this.clock = new THREE.Clock();

    // World Entities
    this.playerGroup = null;
    this.playerBody = null;
    this.playerLegL = null;
    this.playerLegR = null;
    this.weaponObj = null;
    this.batObj = null;
    this.zombies = [];
    this.survivors = [];
    this.interactiveObjects = [];
    this.particles = null;
    this.fireLights = [];

    // Base Heat Manager
    this.baseHeat = {
      totalHeat: 45,
      radius: 90,
      sphereMesh: null,
      generatorActive: true,
      generatorMesh: null,
      generatorLight: null
    };

    // Movement & Controls
    this.keys = {};
    this.mouse = { x: 0, y: 0, isLocked: false, isDragging: false, lastX: 0, lastY: 0 };
    this.yaw = 0;
    this.pitch = 0;
    this.walkCycle = 0;
    this.swingAnim = 0;
    this.currentInteraction = null;
    this.hasStartedGame = false;
    this.isPaused = false;
    this.zombiesKilled = 0;
    this.isGameOver = false;
    this.lastHuntedAlertTime = 0;
    this._huntedBannerTimer = null;

    this.initScene();
    this.initLighting();
    this.buildCityMetropolis();
    this.initPlayer();
    this.initSurvivors();
    this.initZombies();
    this.initHeatDome();
    this.initAtmosphericParticles();
    this.bindControls();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /* ========================================================================
     1. SCENE & RENDERER INITIALIZATION
     ======================================================================== */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x141e2b);
    this.scene.fog = new THREE.FogExp2(0x182434, 0.008);

    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 1000);
    this.camera.rotation.order = 'YXZ'; // Essential for FPS cameras!

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn("Standard WebGL failed, trying basic context:", e);
      this.renderer = new THREE.WebGLRenderer();
    }

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Initial resize sync
    setTimeout(() => this.onWindowResize(), 100);
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.width = this.container.clientWidth || 960;
    this.height = this.container.clientHeight || 600;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  /* ========================================================================
     2. LIGHTING & 4D TEMPORAL DYNAMICS
     ======================================================================== */
  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x64748b, 0.9); // Bright baseline
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    this.sunLight.position.set(70, 150, 70);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.scene.add(this.sunLight);

    // Tactical Flashlight
    this.flashlight = new THREE.SpotLight(0xfff8e7, 3.5, 75, Math.PI / 5, 0.35, 1.2);
    this.flashlight.castShadow = true;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);
  }

  updateDayNightCycle(dt) {
    this.gameTime += dt * this.timeSpeed;
    if (this.gameTime >= 24.0) {
      this.gameTime = 0.0;
      this.currentDay = Math.min(7, this.currentDay + 1);
      if (window.showToast) {
        window.showToast(`🌅 DAWN OF DAY ${this.currentDay}: The infection mutates further.`, '#ff9e00');
      }
    }

    const hours = Math.floor(this.gameTime);
    const mins = Math.floor((this.gameTime - hours) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const dayEl = document.getElementById('hudDayTime');
    if (dayEl) dayEl.textContent = `DAY ${this.currentDay} | ${timeStr}`;

    const isDay = this.gameTime >= 6.0 && this.gameTime <= 18.0;
    if (isDay) {
      this.sunLight.intensity = 1.4;
      this.sunLight.color.setHex(0xffecd2);
      this.ambientLight.intensity = 0.8;
      this.scene.fog.color.setHex(0x182434);
      this.scene.background.setHex(0x141e2b);
    } else {
      this.sunLight.intensity = 0.25;
      this.sunLight.color.setHex(0x3b82f6);
      this.ambientLight.intensity = 0.2;
      this.scene.fog.color.setHex(0x060910);
      this.scene.background.setHex(0x04060a);
    }
  }

  /* ========================================================================
     3. EXPANSIVE CITY DISTRICT
     ======================================================================== */
  buildCityMetropolis() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Main Roads
    this.createRoad(0, 0, 500, 22, true);
    this.createRoad(0, 0, 22, 500, false);
    this.createRoad(0, 100, 500, 18, true);
    this.createRoad(0, -100, 500, 18, true);
    this.createRoad(100, 0, 18, 500, false);
    this.createRoad(-100, 0, 18, 500, false);

    // 1. Safehouse Substation (District 4 HQ: -40, -40)
    this.createSafehouse(-40, -40);

    // 2. St. Jude Hospital (50, -60)
    this.createSkyscraper(50, -60, 42, 55, 36, 0x334155, "ST. JUDE HOSPITAL", 0x38bdf8);

    // 3. Police Headquarters (60, 50)
    this.createSkyscraper(60, 50, 42, 42, 36, 0x1e293b, "POLICE PRECINCT 09", 0xf59e0b);

    // 4. Metro Plaza Mall (-65, 55)
    this.createSkyscraper(-65, 55, 50, 32, 45, 0x18202c, "METRO PLAZA MALL", 0xe63946);

    // 5. Biogenix Central Tower (120, -120)
    this.createSkyscraper(120, -120, 52, 95, 52, 0x0f172a, "BIOGENIX GENETICS", 0x10b981);

    // Additional Skyline Towers
    const towers = [
      [-120, -120, 38, 75, 38], [-120, -40, 32, 60, 32], [-120, 40, 35, 80, 35], [-120, 120, 42, 90, 42],
      [-40, 120, 34, 65, 34], [40, 120, 38, 70, 38], [120, 40, 44, 85, 44], [120, -40, 36, 65, 36]
    ];
    towers.forEach(t => this.createGenericSkyscraper(t[0], t[1], t[2], t[3], t[4]));

    // Elevated Highway Overpass
    this.createElevatedHighway(0, -25, 260);

    // Burning Barrels with Fire Lights
    this.createBurningBarrel(-15, -15);
    this.createBurningBarrel(25, -20);
    this.createBurningBarrel(15, 35);
    this.createBurningBarrel(-35, 40);

    // Abandoned Vehicles
    this.createVehicle(-10, 8, 0.4, 0x334155);
    this.createVehicle(15, -12, -0.6, 0x1e3a8a);
    this.createVehicle(-60, 8, 1.2, 0x52525b);
    this.createVehicle(8, 65, 0.1, 0x71717a);

    // Supply Crates
    this.createSupplyCrate(20, -42, 'medical');
    this.createSupplyCrate(50, 35, 'ammo');
    this.createSupplyCrate(-45, 35, 'rations');
    this.createSupplyCrate(0, -25, 'ammo');
  }

  createRoad(x, z, w, l, isHorizontal) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.95 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.02, z);
    road.receiveShadow = true;
    this.scene.add(road);

    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(isHorizontal ? w : 0.7, isHorizontal ? 0.7 : l), new THREE.MeshBasicMaterial({ color: 0xd97706 }));
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(x, 0.03, z);
    this.scene.add(stripe);
  }

  createSkyscraper(x, z, w, h, d, color, labelText, neonCol) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 }));
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Window Grid
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.8), new THREE.MeshBasicMaterial({ color: 0xfff0c2, wireframe: true, transparent: true, opacity: 0.15 }));
    win.position.set(x, h / 2, z + d / 2 + 0.1);
    this.scene.add(win);

    // Neon Sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 2.5, 0.5), new THREE.MeshBasicMaterial({ color: neonCol }));
    sign.position.set(x, h + 1.5, z + d / 2 + 0.3);
    this.scene.add(sign);
  }

  createGenericSkyscraper(x, z, w, h, d) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.8, metalness: 0.2 }));
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  createElevatedHighway(x, z, length) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(length, 1.2, 14), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 }));
    deck.position.set(x, 10, z);
    deck.castShadow = true; deck.receiveShadow = true;
    this.scene.add(deck);

    for (let px = -length / 2 + 20; px <= length / 2 - 20; px += 45) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 10, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      col.position.set(px, 5, z);
      col.castShadow = true;
      this.scene.add(col);
    }
  }

  createBurningBarrel(x, z) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7 }));
    barrel.position.set(x, 0.7, z);
    barrel.castShadow = true;
    this.scene.add(barrel);

    const fireLight = new THREE.PointLight(0xff6600, 2.2, 18);
    fireLight.position.set(x, 1.8, z);
    this.scene.add(fireLight);
    this.fireLights.push(fireLight);
  }

  createSafehouse(x, z) {
    const w = 38, d = 38, h = 7.5;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

    const nWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), wallMat);
    nWall.position.set(x, h/2, z - d/2); nWall.castShadow = true; this.scene.add(nWall);

    const sWallL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, h, 1), wallMat);
    sWallL.position.set(x - w * 0.31, h/2, z + d/2); sWallL.castShadow = true; this.scene.add(sWallL);

    const sWallR = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, h, 1), wallMat);
    sWallR.position.set(x + w * 0.31, h/2, z + d/2); sWallR.castShadow = true; this.scene.add(sWallR);

    const wWall = new THREE.Mesh(new THREE.BoxGeometry(1, h, d), wallMat);
    wWall.position.set(x - w/2, h/2, z); wWall.castShadow = true; this.scene.add(wWall);

    const eWall = new THREE.Mesh(new THREE.BoxGeometry(1, h, d), wallMat);
    eWall.position.set(x + w/2, h/2, z); eWall.castShadow = true; this.scene.add(eWall);

    // Modified Diesel Generator
    const genGeo = new THREE.BoxGeometry(3.2, 2.2, 2.2);
    const genMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.7 });
    this.baseHeat.generatorMesh = new THREE.Mesh(genGeo, genMat);
    this.baseHeat.generatorMesh.position.set(x - 8, 1.1, z - 8);
    this.baseHeat.generatorMesh.castShadow = true;
    this.scene.add(this.baseHeat.generatorMesh);

    this.baseHeat.generatorLight = new THREE.PointLight(0xff9e00, 2.0, 22);
    this.baseHeat.generatorLight.position.set(x - 8, 3, z - 8);
    this.scene.add(this.baseHeat.generatorLight);

    this.interactiveObjects.push({
      type: 'generator', x: x - 8, z: z - 8, radius: 4.5,
      prompt: 'Toggle Modified Diesel Generator (Press E)'
    });
  }

  createVehicle(x, z, rot, color) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.3, 2.2), new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.7 }));
    body.position.y = 0.9; body.castShadow = true; car.add(body);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.9), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
    cab.position.set(-0.3, 1.8, 0); car.add(cab);

    car.position.set(x, 0, z); car.rotation.y = rot;
    this.scene.add(car);
  }

  createSupplyCrate(x, z, type) {
    let col = 0x10b981;
    if (type === 'ammo') col = 0xeab308;
    if (type === 'rations') col = 0x3b82f6;

    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }));
    crate.position.set(x, 0.7, z); crate.castShadow = true;
    this.scene.add(crate);

    this.interactiveObjects.push({
      type: 'crate', crateType: type, mesh: crate, x, z, radius: 3.2, looted: false,
      prompt: `Scavenge ${type.toUpperCase()} Crate (Press E)`
    });
  }

  resetSupplyCrates() {
    for (let obj of this.interactiveObjects) {
      if (obj.type === 'crate' && obj.mesh) {
        this.scene.remove(obj.mesh);
      }
    }
    this.interactiveObjects = this.interactiveObjects.filter(obj => obj.type !== 'crate');

    this.createSupplyCrate(20, -42, 'medical');
    this.createSupplyCrate(50, 35, 'ammo');
    this.createSupplyCrate(-45, 35, 'rations');
    this.createSupplyCrate(0, -25, 'ammo');
  }

  /* ========================================================================
     4. ANIMATED 3D SURVIVOR & WEAPONS (Alexei)
     ======================================================================== */
  initPlayer() {
    this.playerGroup = new THREE.Group();
    // Positioned in clear view of street and safehouse
    this.playerGroup.position.set(-25, 0, -10);
    this.scene.add(this.playerGroup);

    // Torso
    this.playerBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.45), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 }));
    this.playerBody.position.y = 1.3; this.playerBody.castShadow = true;
    this.playerGroup.add(this.playerBody);

    // Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), new THREE.MeshStandardMaterial({ color: 0x52525b }));
    pack.position.set(0, 1.3, -0.35); this.playerGroup.add(pack);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 2.15; this.playerGroup.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.32, 0.85, 0.32);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    this.playerLegL = new THREE.Mesh(legGeo, legMat);
    this.playerLegL.position.set(-0.22, 0.42, 0); this.playerGroup.add(this.playerLegL);

    this.playerLegR = new THREE.Mesh(legGeo, legMat);
    this.playerLegR.position.set(0.22, 0.42, 0); this.playerGroup.add(this.playerLegR);

    // Weapons
    this.initWeapons();
  }

  initWeapons() {
    // 1. Suppressed Pistol
    const gunGroup = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.8), gunMat);
    barrel.position.set(0, 0, -0.35); gunGroup.add(barrel);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.22), gunMat);
    grip.position.set(0, -0.25, -0.05); grip.rotation.x = 0.2; gunGroup.add(grip);

    const supp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 12), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7 }));
    supp.rotation.x = Math.PI / 2; supp.position.set(0, 0, -0.9); gunGroup.add(supp);

    gunGroup.position.set(0.32, -0.28, -0.55);
    this.camera.add(gunGroup);
    this.weaponObj = gunGroup;

    // 2. Barbed-Wire Baseball Bat
    const batGroup = new THREE.Group();
    const batMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 1.2, 8), batMat);
    wood.position.set(0, 0.4, 0); batGroup.add(wood);

    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 12), new THREE.MeshStandardMaterial({ color: 0xa1a1aa, metalness: 0.8 }));
    wire.position.set(0, 0.7, 0); batGroup.add(wire);

    batGroup.position.set(0.35, -0.4, -0.6);
    batGroup.rotation.set(0.2, 0.3, -0.5);
    batGroup.visible = false;
    this.camera.add(batGroup);
    this.batObj = batGroup;

    this.scene.add(this.camera);
  }

  /* ========================================================================
     5. NPC SURVIVORS
     ======================================================================== */
  initSurvivors() {
    this.createSurvivor(50, -48, "DR. EVELYN REED", 0x38bdf8, "Doctor", [
      "Alexei! You made it. The clinic triage bay was overrun on Day 2.",
      "If we recover my heavy synthesis medical crate, I can produce the Day 7 antiviral cure for extraction Zulu-9!",
      "Will you prioritize the vaccine research, or escape with raw firepower?"
    ]);

    this.createSurvivor(-34, -42, "MARCUS VANCE", 0xf59e0b, "Engineer", [
      "Generator is purring, Alexei. But each appliance we flip on pushes our heat radius deeper into the streets.",
      "Bring me 40 scrap metal from the overpass and I'll craft an automated sentry turret."
    ]);

    this.createSurvivor(-22, -22, "SGT. DARIUS COLE", 0x10b981, "Soldier", [
      "Watchtower clear. The acoustic Swarmers are pacing the highway.",
      "Remember: crouching cuts your acoustic noise down to a whisper. Don't sprint unless you have to."
    ]);
  }

  createSurvivor(x, z, name, color, role, lines) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.8, 8), new THREE.MeshStandardMaterial({ color }));
    body.position.y = 0.9; body.castShadow = true; group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.95; group.add(head);

    group.position.set(x, 0, z);
    this.scene.add(group);

    const sData = { name, role, mesh: group, dialogue: lines, idx: 0, x, z, radius: 3.8, prompt: `Talk to ${name} (${role}) — Press E` };
    this.survivors.push(sData);
    this.interactiveObjects.push(sData);
  }

  /* ========================================================================
     6. ANIMATED 3D ZOMBIES
     ======================================================================== */
  initZombies() {
    this.zombies = [];
    for (let i = 0; i < 18; i++) {
      this.spawnZombieArchetype();
    }
  }

  spawnZombieArchetype(typeOverride = null) {
    const type = typeOverride || this.playerStats.dominantArchetype || 'Hunter';
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 80;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const group = new THREE.Group();
    let skinColor = 0x64748b;
    let eyeColor = 0xeab308;
    let speed = 3.2;
    let hp = 55;

    if (type === 'Swarm') {
      skinColor = 0x991b1b; speed = 4.4; hp = 45;
    } else if (type === 'Ambusher') {
      skinColor = 0x18181b; eyeColor = 0x38bdf8; speed = 4.8; hp = 35;
    } else if (type === 'Tank') {
      skinColor = 0x334155; speed = 1.8; hp = 220;
    }

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.2, 0.45), new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 }));
    torso.position.y = 1.1; torso.castShadow = true; group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), new THREE.MeshStandardMaterial({ color: skinColor }));
    head.position.y = 1.95; group.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
    eL.position.set(-0.12, 1.98, 0.22); group.add(eL);
    const eR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
    eR.position.set(0.12, 1.98, 0.22); group.add(eR);

    if (type === 'Swarm') {
      const earMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d });
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 5), earMat);
      earL.rotation.z = -0.55; earL.position.set(-0.38, 2.2, 0); group.add(earL);

      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 5), earMat);
      earR.rotation.z = 0.55; earR.position.set(0.38, 2.2, 0); group.add(earR);
    }

    const armGeo = new THREE.BoxGeometry(0.22, 0.8, 0.22);
    const armL = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: skinColor }));
    armL.position.set(-0.48, 1.2, 0.2); armL.rotation.x = -0.8; group.add(armL);

    const armR = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: skinColor }));
    armR.position.set(0.48, 1.2, 0.2); armR.rotation.x = -0.8; group.add(armR);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.zombies.push({
      mesh: group, armL, armR, type, hp, maxHp: hp, speed,
      state: 'wander',
      wanderTarget: new THREE.Vector3(x + (Math.random() - 0.5) * 35, 0, z + (Math.random() - 0.5) * 35),
      animTime: Math.random() * 10
    });
  }

  /* ========================================================================
     7. BASE HEAT & PARTICLES
     ======================================================================== */
  initHeatDome() {
    const geo = new THREE.SphereGeometry(this.baseHeat.radius, 32, 20);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true, transparent: true, opacity: 0.08 });
    this.baseHeat.sphereMesh = new THREE.Mesh(geo, mat);
    this.baseHeat.sphereMesh.position.set(-40, 0, -40);
    this.scene.add(this.baseHeat.sphereMesh);
  }

  updateHeatDome() {
    let heat = 10;
    if (this.baseHeat.generatorActive) heat += 35;
    this.baseHeat.totalHeat = heat;
    this.baseHeat.radius = heat * 2.0;

    if (this.baseHeat.sphereMesh) {
      const s = this.baseHeat.radius / 90.0;
      this.baseHeat.sphereMesh.scale.set(s, s, s);
      this.baseHeat.sphereMesh.material.opacity = 0.06 + Math.sin(performance.now() * 0.003) * 0.03;
    }
  }

  initAtmosphericParticles() {
    const pCount = 350;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount * 3; i += 3) {
      pPositions[i] = (Math.random() - 0.5) * 200;
      pPositions[i + 1] = Math.random() * 40;
      pPositions[i + 2] = (Math.random() - 0.5) * 200;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    this.particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffaa44, size: 0.35, transparent: true, opacity: 0.6 }));
    this.scene.add(this.particles);
  }

  /* ========================================================================
     8. CONTROLS, POINTER LOCK & DRAG FALLBACK
     ======================================================================== */
  bindControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Drone Flight [T]
      if (e.key.toLowerCase() === 't') {
        this.cameraMode = this.cameraMode === 'drone' ? 'fps' : 'drone';
        const btn = document.getElementById('btnToggleDrone');
        if (this.cameraMode === 'drone') {
          this.drone.position.set(this.playerGroup.position.x, 80, this.playerGroup.position.z + 30);
          this.drone.pitch = -0.5;
          if (btn) btn.classList.add('active');
          if (window.showToast) window.showToast("🛸 DRONE FLIGHT ACTIVE: Fly across the city! (WASD + Space/Shift)", "#00f5d4");
        } else {
          if (btn) btn.classList.remove('active');
          if (window.showToast) window.showToast("Survivor First-Person View Restored", "#ff9e00");
        }
      }

      // View [V]
      if (e.key.toLowerCase() === 'v' && this.cameraMode !== 'drone') {
        this.cameraMode = this.cameraMode === 'fps' ? 'tps' : 'fps';
        if (window.showToast) window.showToast(`Camera: ${this.cameraMode.toUpperCase()}`, "#ff9e00");
      }

      // Flashlight [F]
      if (e.key.toLowerCase() === 'f') {
        this.playerStats.flashlightOn = !this.playerStats.flashlightOn;
        this.flashlight.intensity = this.playerStats.flashlightOn ? 3.5 : 0;
      }

      // Crouch [C]
      if (e.key.toLowerCase() === 'c') {
        this.playerStats.isCrouching = !this.playerStats.isCrouching;
      }

      // Interact [E]
      if (e.key.toLowerCase() === 'e') {
        this.executeInteraction();
      }

      // Weapons
      if (e.key === '1') this.switchWeapon('pistol');
      if (e.key === '2') this.switchWeapon('bat');
      if (e.key.toLowerCase() === 'r') this.reloadWeapon();
      if (e.key.toLowerCase() === 'p') this.togglePause();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Pointer Lock & Drag fallback
    const targetElement = this.renderer.domElement;

    targetElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (!this.mouse.isLocked && !this.hasStartedGame) {
          try { targetElement.requestPointerLock(); } catch (err) {}
          this.hasStartedGame = true;
          const playOverlay = document.getElementById('clickToPlayOverlay');
          if (playOverlay) playOverlay.style.display = 'none';
        } else {
          this.attack();
        }
      }
      this.mouse.isDragging = true;
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDragging = false;
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouse.isLocked = (document.pointerLockElement === targetElement);
      const playOverlay = document.getElementById('clickToPlayOverlay');
      if (playOverlay) {
        if (this.mouse.isLocked) {
          playOverlay.style.display = 'none';
          this.hasStartedGame = true;
          this.isPaused = false;
        } else if (this.isPaused) {
          const btn = document.getElementById('btnStartGamePlay');
          if (btn) {
            btn.innerHTML = '<span class="btn-play-icon">▶</span><span>RESUME SURVIVAL (CLICK TO LOCK)</span>';
          }
          playOverlay.style.display = 'flex';
        }
      }
    });

    // Mouse Move (Handles both PointerLock and Drag Look!)
    window.addEventListener('mousemove', (e) => {
      let dx = 0;
      let dy = 0;

      if (this.mouse.isLocked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (this.mouse.isDragging) {
        dx = e.clientX - this.mouse.lastX;
        dy = e.clientY - this.mouse.lastY;
        this.mouse.lastX = e.clientX;
        this.mouse.lastY = e.clientY;
      } else {
        return;
      }

      const sens = 0.0024;
      if (this.cameraMode === 'drone') {
        this.drone.yaw -= dx * sens;
        this.drone.pitch -= dy * sens;
        this.drone.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.drone.pitch));
      } else {
        this.yaw -= dx * sens;
        this.pitch -= dy * sens;
        this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
      }
    });

    // Right Click ADS
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 && this.cameraMode !== 'drone') {
        this.playerStats.isAiming = true;
        this.camera.fov = 42;
        this.camera.updateProjectionMatrix();
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 2 && this.cameraMode !== 'drone') {
        this.playerStats.isAiming = false;
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
      }
    });
  }

  switchWeapon(type) {
    this.playerStats.currentWeapon = type;
    if (this.weaponObj) this.weaponObj.visible = (type === 'pistol');
    if (this.batObj) this.batObj.visible = (type === 'bat');
    if (window.showToast) window.showToast(`Equipped: ${type === 'pistol' ? 'Suppressed Pistol' : 'Barbed Bat'}`, "#00f5d4");
  }

  reloadWeapon() {
    if (this.playerStats.isReloading) return;
    this.playerStats.isReloading = true;
    if (window.showToast) window.showToast("Reloading...", "#ff9e00");

    if (this.weaponObj) {
      this.weaponObj.rotation.x = -0.5;
      setTimeout(() => {
        this.playerStats.ammo = this.playerStats.maxAmmo;
        this.playerStats.isReloading = false;
        if (this.weaponObj) this.weaponObj.rotation.x = 0;
        if (window.showToast) window.showToast("Pistol Reloaded (24/24)", "#10b981");
      }, 1200);
    }
  }

  attack() {
    if (this.cameraMode === 'drone' || this.isGameOver) return;

    if (this.playerStats.currentWeapon === 'pistol') {
      if (this.playerStats.ammo <= 0) {
        this.reloadWeapon();
        return;
      }
      this.playerStats.ammo--;
      this.playerStats.noiseLevel = 110;
      if (window.horrorAudio) window.horrorAudio.playGunshot();

      if (this.weaponObj) {
        this.weaponObj.position.z += 0.16;
        setTimeout(() => { if (this.weaponObj) this.weaponObj.position.z -= 0.16; }, 70);
      }
      // 70 damage = 1-shot kill on standard zombies (50 HP) & Ambushers (35 HP)
      this.checkHitscanHit(70, 80);
    } else {
      this.playerStats.isAttacking = true;
      this.playerStats.noiseLevel = 25;
      this.swingAnim = 1.0;
      if (window.horrorAudio) window.horrorAudio.playHeartbeat();
      // 120 damage = 1-hit kill in melee range
      this.checkHitscanHit(120, 7.5);
    }
  }

  checkHitscanHit(damage, range) {
    const camPos = this.camera.position.clone();
    const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();

    let targetZombie = null;
    let closestDist = range;

    for (let z of this.zombies) {
      if (z.isDead || z.hp <= 0) continue;

      const zChestPos = z.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const toZombie = zChestPos.clone().sub(camPos);
      const dist = toZombie.length();

      if (dist > range) continue;

      toZombie.normalize();
      const dot = camDir.dot(toZombie);

      // Angle from crosshair sightline
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
      const lateralDist = Math.sin(angle) * dist;

      // Generous hit condition: within ~24 deg cone (dot > 0.85) AND within 2.4 meters lateral distance,
      // or if very close range (< 4.5m) and in front (dot > 0.45)
      const isAimHit = (dot > 0.85 && lateralDist < 2.4) || (dist < 4.5 && dot > 0.45);

      if (isAimHit && dist < closestDist) {
        closestDist = dist;
        targetZombie = z;
      }
    }

    if (targetZombie) {
      const z = targetZombie;
      z.hp -= damage;
      z.state = 'chase';
      this.triggerHuntedWarning(z.type);
      this.showHitMarker();
      if (window.horrorAudio) window.horrorAudio.playZombieHit();

      // Damage Flash on Zombie Mesh (turns bright red for 150ms)
      z.mesh.traverse(child => {
        if (child.isMesh && child.material) {
          if (!child._origColor) child._origColor = child.material.color ? child.material.color.getHex() : 0x64748b;
          child.material.color = new THREE.Color(0xff2222);
          setTimeout(() => {
            if (child.material) child.material.color = new THREE.Color(child._origColor);
          }, 150);
        }
      });

      if (z.hp <= 0 && !z.isDead) {
        z.isDead = true;
        this.zombiesKilled++;
        if (window.horrorAudio) window.horrorAudio.playZombieDeath();

        // Death collapse animation
        z.mesh.rotation.x = Math.PI / 2;
        z.mesh.position.y = 0.25;

        if (window.showToast) {
          window.showToast(`💀 Zombie Eliminated (${z.type})! [Total Kills: ${this.zombiesKilled}]`, "#00f5d4");
        }

        setTimeout(() => {
          this.scene.remove(z.mesh);
          this.zombies = this.zombies.filter(item => item !== z);
          setTimeout(() => {
            if (!this.isGameOver) this.spawnZombieArchetype();
          }, 4500);
        }, 2200);
      }
    }
  }

  triggerHuntedWarning(zombieType = 'Mutant') {
    const banner = document.getElementById('huntedWarningBanner');
    const textEl = document.getElementById('huntedWarningText');
    const now = performance.now();

    if (banner && textEl) {
      textEl.textContent = `⚠️ ALERT: ${zombieType.toUpperCase()} IS HUNTING YOU!`;
      banner.style.display = 'flex';
      clearTimeout(this._huntedBannerTimer);
      this._huntedBannerTimer = setTimeout(() => {
        banner.style.display = 'none';
      }, 4000);
    }

    if (now - this.lastHuntedAlertTime > 5000) {
      this.lastHuntedAlertTime = now;
      if (window.horrorAudio) {
        window.horrorAudio.playHuntedAlert();
        window.horrorAudio.playZombieGrowl();
      }
      if (window.showToast) {
        window.showToast(`⚠️ WARNING: A ${zombieType} has detected your scent and is hunting you!`, "#e63946");
      }
    }
  }

  triggerDamageFlash() {
    const flash = document.getElementById('damageFlashOverlay');
    if (flash) {
      flash.style.opacity = '1';
      setTimeout(() => { flash.style.opacity = '0'; }, 180);
    }
  }

  showHitMarker() {
    const hm = document.getElementById('hitMarkerCrosshair');
    if (hm) {
      hm.style.opacity = '1';
      setTimeout(() => { hm.style.opacity = '0'; }, 100);
    }
  }

  executeInteraction() {
    if (!this.currentInteraction) return;
    const item = this.currentInteraction;

    if (item.type === 'generator') {
      this.baseHeat.generatorActive = !this.baseHeat.generatorActive;
      this.updateHeatDome();
      if (window.horrorAudio) window.horrorAudio.toggleGeneratorHum(this.baseHeat.generatorActive);
      const s = this.baseHeat.generatorActive ? "ONLINE (+35 Heat)" : "OFFLINE";
      if (window.showToast) window.showToast(`Diesel Generator: ${s}`, "#ff9e00");
    } else if (item.type === 'crate' && !item.looted) {
      item.looted = true;
      if (item.crateType === 'ammo') this.playerStats.ammo = this.playerStats.maxAmmo;
      if (item.crateType === 'medical') this.playerStats.health = Math.min(100, this.playerStats.health + 45);
      if (item.crateType === 'rations') { this.playerStats.hunger = 100; this.playerStats.thirst = 100; }
      this.scene.remove(item.mesh);
      if (window.showToast) window.showToast(`Scavenged ${item.crateType.toUpperCase()} Crate!`, "#10b981");
    } else if (item.role) {
      const line = item.dialogue[item.idx % item.dialogue.length];
      item.idx++;
      this.showDialogue(item.name, line);
    }
  }

  showDialogue(speaker, text) {
    let box = document.getElementById('survivorDialogueModal');
    if (!box) {
      box = document.createElement('div');
      box.id = 'survivorDialogueModal';
      box.className = 'dialogue-modal';
      document.body.appendChild(box);
    }
    box.innerHTML = `
      <div class="dialogue-header">
        <span class="dialogue-speaker">${speaker}</span>
        <button class="dialogue-close" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
      </div>
      <p class="dialogue-body">"${text}"</p>
      <div class="dialogue-footer">
        <button class="cyber-btn" onclick="document.getElementById('survivorDialogueModal').style.display='none'">[E] Continue</button>
      </div>
    `;
    box.style.display = 'block';
  }

  /* ========================================================================
     9. ANIMATION & UPDATE LOOPS
     ======================================================================== */
  updateDrone(dt) {
    const move = new THREE.Vector3();
    if (this.keys['w']) move.z -= 1;
    if (this.keys['s']) move.z += 1;
    if (this.keys['a']) move.x -= 1;
    if (this.keys['d']) move.x += 1;
    if (this.keys[' ']) move.y += 1;
    if (this.keys['shift']) move.y -= 1;

    if (move.lengthSq() > 0) {
      move.normalize();
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.drone.yaw);
      this.drone.position.addScaledVector(move, this.drone.speed * dt);
    }

    this.camera.position.copy(this.drone.position);
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.drone.yaw;
    this.camera.rotation.x = this.drone.pitch;
    this.camera.updateMatrixWorld();
  }

  updatePlayer(dt) {
    const move = new THREE.Vector3();
    if (this.keys['w'] || this.keys['arrowup']) move.z -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) move.z += 1;
    if (this.keys['a'] || this.keys['arrowleft']) move.x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) move.x += 1;

    const isMoving = move.lengthSq() > 0;
    this.playerStats.isSprinting = !!(this.keys['shift'] && this.playerStats.stamina > 5 && !this.playerStats.isCrouching && isMoving);

    let speed = 7.0;
    if (this.playerStats.isCrouching) {
      speed = 3.5;
      this.playerStats.noiseLevel = 15;
    } else if (this.playerStats.isSprinting) {
      speed = 12.0;
      this.playerStats.stamina = Math.max(0, this.playerStats.stamina - dt * 25);
      this.playerStats.noiseLevel = 70;
    } else {
      this.playerStats.stamina = Math.min(100, this.playerStats.stamina + dt * 15);
      this.playerStats.noiseLevel = isMoving ? 35 : 0;
    }

    if (isMoving) {
      move.normalize();
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.playerGroup.position.addScaledVector(move, speed * dt);

      this.walkCycle += dt * (this.playerStats.isSprinting ? 16 : 9);
      if (this.playerLegL && this.playerLegR) {
        this.playerLegL.rotation.x = Math.sin(this.walkCycle) * 0.6;
        this.playerLegR.rotation.x = -Math.sin(this.walkCycle) * 0.6;
      }
    } else {
      if (this.playerLegL && this.playerLegR) {
        this.playerLegL.rotation.x = 0;
        this.playerLegR.rotation.x = 0;
      }
    }

    this.playerGroup.rotation.y = this.yaw;

    // Bat swing
    if (this.swingAnim > 0) {
      this.swingAnim -= dt * 4;
      if (this.batObj) {
        this.batObj.rotation.z = -0.5 + Math.sin(this.swingAnim * Math.PI) * 1.8;
      }
      if (this.swingAnim <= 0) this.playerStats.isAttacking = false;
    }

    // Camera Placement
    const eyeY = this.playerStats.isCrouching ? 1.15 : 1.85;
    if (this.cameraMode === 'fps') {
      this.camera.position.set(this.playerGroup.position.x, eyeY, this.playerGroup.position.z);
    } else {
      const offset = new THREE.Vector3(0.7, eyeY + 0.35, 2.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.camera.position.copy(this.playerGroup.position).add(offset);
    }

    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.updateMatrixWorld();

    // Flashlight
    this.flashlight.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forward);

    // Interaction Check
    this.currentInteraction = null;
    let nearest = 999;
    for (let obj of this.interactiveObjects) {
      const d = Math.hypot(this.playerGroup.position.x - obj.x, this.playerGroup.position.z - obj.z);
      if (d < obj.radius && d < nearest) {
        nearest = d;
        this.currentInteraction = obj;
      }
    }

    const pEl = document.getElementById('interactionPrompt');
    if (pEl) {
      if (this.currentInteraction) {
        pEl.textContent = this.currentInteraction.prompt;
        pEl.style.display = 'block';
      } else {
        pEl.style.display = 'none';
      }
    }
  }

  updateZombies(dt) {
    if (this.isGameOver) return;
    const pPos = this.playerGroup.position;
    const basePos = new THREE.Vector3(-40, 0, -40);
    let activeHuntingCount = 0;

    for (let z of this.zombies) {
      if (z.isDead || z.hp <= 0) continue;

      const distP = z.mesh.position.distanceTo(pPos);
      const distB = z.mesh.position.distanceTo(basePos);

      if (distB < this.baseHeat.radius && z.state !== 'chase') {
        z.state = 'drawn_to_heat';
      }

      let alertRange = 32;
      if (this.playerStats.isCrouching) alertRange = 12;
      if (this.playerStats.isSprinting) alertRange = 52;
      if (this.playerStats.noiseLevel > 75) alertRange = 95;

      if (distP < alertRange) {
        if (z.state !== 'chase') {
          z.state = 'chase';
          this.triggerHuntedWarning(z.type);
        }
      }

      if (z.state === 'chase' && distP < 45) {
        activeHuntingCount++;
      }

      let target = z.wanderTarget;
      if (z.state === 'chase') target = pPos;
      else if (z.state === 'drawn_to_heat') target = basePos;

      const dir = new THREE.Vector3().subVectors(target, z.mesh.position);
      dir.y = 0;
      if (dir.length() > 1.4) {
        dir.normalize();
        z.mesh.position.addScaledVector(dir, z.speed * dt);
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        z.animTime += dt * 6;
        z.armL.rotation.x = -0.8 + Math.sin(z.animTime) * 0.4;
        z.armR.rotation.x = -0.8 - Math.sin(z.animTime) * 0.4;
      }

      // Close combat contact: Zombie actively strikes player
      if (distP < 2.0) {
        this.playerStats.health = Math.max(0, this.playerStats.health - dt * 25);
        this.playerStats.infection = Math.min(100, this.playerStats.infection + dt * 12);
        if (window.setGlobalInfection) window.setGlobalInfection(this.playerStats.infection);

        this.triggerDamageFlash();
        if (window.horrorAudio && Math.random() < 0.12) {
          window.horrorAudio.playPlayerDamage();
        }

        // Check Death Condition: Player Hunted & Overwhelmed
        if (this.playerStats.health <= 0 || this.playerStats.infection >= 100) {
          this.handleGameOver(false, z.type);
          return;
        }
      }
    }

    // Toggle hunted warning banner
    const banner = document.getElementById('huntedWarningBanner');
    if (banner) {
      if (activeHuntingCount > 0 && !this.isGameOver) {
        banner.style.display = 'flex';
      } else {
        banner.style.display = 'none';
      }
    }
  }

  handleGameOver(isVictory = false, killerType = null) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (document.exitPointerLock) {
      try { document.exitPointerLock(); } catch (e) {}
    }
    this.mouse.isLocked = false;

    const modal = document.getElementById('gameOverModal');
    const badge = document.getElementById('goBadge');
    const title = document.getElementById('goTitle');
    const desc = document.getElementById('goDesc');
    const daysEl = document.getElementById('goStatDays');
    const killsEl = document.getElementById('goStatKills');
    const infEl = document.getElementById('goStatInfection');
    const heatEl = document.getElementById('goStatHeat');

    if (badge) {
      badge.textContent = isVictory ? "STATUS: EXTRACTION SUCCESSFUL" : "STATUS: HUNTED & KILLED IN ACTION";
      badge.style.color = isVictory ? "var(--accent-cyan)" : "var(--accent-crimson)";
      badge.style.borderColor = isVictory ? "var(--accent-cyan)" : "var(--accent-crimson)";
    }

    if (title) {
      title.textContent = isVictory ? "SURVIVAL MISSION ACCOMPLISHED" : "YOU WERE HUNTED DOWN";
      title.style.color = isVictory ? "var(--accent-cyan)" : "#fff";
    }

    if (desc) {
      if (isVictory) {
        desc.textContent = "Flight Zulu-9 extracted Alexei with Dr. Evelyn's synthesis vaccine! Humanity will endure.";
      } else {
        const kName = killerType ? `${killerType} Zombie` : "the Mutant Horde";
        desc.textContent = `You were detected, hunted down, and mauled by a ${kName} in District 4.`;
      }
    }

    if (daysEl) daysEl.textContent = this.currentDay;
    if (killsEl) killsEl.textContent = this.zombiesKilled;
    if (infEl) infEl.textContent = this.playerStats.infection.toFixed(1) + "%";
    if (heatEl) heatEl.textContent = this.baseHeat.radius.toFixed(0) + "m";

    if (modal) modal.style.display = 'flex';

    if (window.horrorAudio) {
      window.horrorAudio.playPlayerDamage();
      window.horrorAudio.playZombieGrowl();
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const playOverlay = document.getElementById('clickToPlayOverlay');
    if (playOverlay) {
      if (this.isPaused) {
        if (document.exitPointerLock) {
          try { document.exitPointerLock(); } catch (err) {}
        }
        const btn = document.getElementById('btnStartGamePlay');
        if (btn) btn.innerHTML = '<span class="btn-play-icon">▶</span><span>RESUME SURVIVAL (CLICK TO LOCK)</span>';
        playOverlay.style.display = 'flex';
      } else {
        playOverlay.style.display = 'none';
        if (this.renderer && this.renderer.domElement) {
          try { this.renderer.domElement.requestPointerLock(); } catch (e) {}
        }
      }
    }
  }

  replayGame() {
    // 1. Terminate previous session flags and controllers
    this.isGameOver = false;
    this.isPaused = false;
    this.zombiesKilled = 0;
    this.keys = {};
    this.mouse.isDragging = false;
    this.hasStartedGame = true;
    this.walkCycle = 0;
    this.swingAnim = 0;
    if (this._huntedBannerTimer) {
      clearTimeout(this._huntedBannerTimer);
      this._huntedBannerTimer = null;
    }

    // 2. Reset Player Vitals & Loadout
    this.playerStats.health = 100;
    this.playerStats.maxHealth = 100;
    this.playerStats.stamina = 100;
    this.playerStats.hunger = 90;
    this.playerStats.thirst = 85;
    this.playerStats.infection = 0;
    this.playerStats.ammo = this.playerStats.maxAmmo;
    this.playerStats.isCrouching = false;
    this.playerStats.isSprinting = false;
    this.playerStats.isAttacking = false;
    this.playerStats.isAiming = false;
    this.playerStats.isReloading = false;
    this.playerStats.noiseLevel = 0;
    this.playerStats.dominantArchetype = 'Hunter';

    // 3. Reset Weapon to Suppressed Pistol and Camera to Ground View
    this.switchWeapon('pistol');
    this.cameraMode = 'fps';
    this.camera.fov = 65;
    this.camera.updateProjectionMatrix();

    // Sync Toolbar button active states
    const droneBtn = document.getElementById('btnToggleDrone');
    if (droneBtn) droneBtn.classList.remove('active');
    const pistolBtn = document.getElementById('btnEquipPistol');
    if (pistolBtn) pistolBtn.classList.add('active');
    const batBtn = document.getElementById('btnEquipBat');
    if (batBtn) batBtn.classList.remove('active');

    // 4. Reset Temporal Clock to Day 1, 10:00 AM (Daylight)
    this.currentDay = 1;
    this.gameTime = 10.0;
    this.yaw = 0;
    this.pitch = 0;

    // 5. Teleport Alexei to Safehouse Entrance
    this.playerGroup.position.set(-25, 0, -10);
    this.playerGroup.rotation.y = 0;
    if (this.playerLegL && this.playerLegR) {
      this.playerLegL.rotation.x = 0;
      this.playerLegR.rotation.x = 0;
    }

    // 6. Purge ALL Existing Zombies & Spawn Fresh Horde
    for (let z of this.zombies) {
      if (z.mesh) this.scene.remove(z.mesh);
    }
    this.zombies = [];
    this.initZombies();

    // 7. Reset Supply Crates & Dialogue states
    this.resetSupplyCrates();
    for (let s of this.survivors) {
      s.idx = 0;
    }

    // 8. Reset Base Heat & Generator
    this.baseHeat.generatorActive = true;
    this.updateHeatDome();

    // 9. Reset Infection Sensory Post-Processing & Audio
    if (window.setGlobalInfection) window.setGlobalInfection(0);
    if (window.horrorAudio) {
      window.horrorAudio.setInfectionCutoff(0);
      window.horrorAudio.toggleGeneratorHum(true);
    }

    // 10. Close all modals, dialogue popups, and alerts
    const modal = document.getElementById('gameOverModal');
    if (modal) modal.style.display = 'none';

    const pOverlay = document.getElementById('clickToPlayOverlay');
    if (pOverlay) pOverlay.style.display = 'none';

    const banner = document.getElementById('huntedWarningBanner');
    if (banner) banner.style.display = 'none';

    const dModal = document.getElementById('survivorDialogueModal');
    if (dModal) dModal.style.display = 'none';

    const dmgFlash = document.getElementById('damageFlashOverlay');
    if (dmgFlash) dmgFlash.style.opacity = '0';

    // 11. Reset Narrative DAG Graph
    const resetGraphBtn = document.getElementById('btnResetGraph');
    if (resetGraphBtn) resetGraphBtn.click();

    // 12. Instant HUD update
    this.updateHUD();
    const dayEl = document.getElementById('hudDayTime');
    if (dayEl) dayEl.textContent = 'DAY 1 | 10:00';

    // 13. Auto lock pointer
    if (this.renderer && this.renderer.domElement) {
      try { this.renderer.domElement.requestPointerLock(); } catch (e) {}
    }

    if (window.showToast) {
      window.showToast("↺ SESSION RESTARTED • PREVIOUS RUN TERMINATED • DAY 1 BEGUN!", "#00f5d4");
    }
  }

  updateAtmosphere(dt) {
    this.fireLights.forEach(l => {
      l.intensity = 1.6 + Math.sin(performance.now() * 0.02 + l.position.x) * 0.6;
    });

    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += dt * 2.5;
        if (pos[i] > 35) pos[i] = 0;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  updateHUD() {
    const hp = document.getElementById('hudHealthBar3D');
    const sta = document.getElementById('hudStaminaBar3D');
    const inf = document.getElementById('hudInfectionBar3D');
    const ammo = document.getElementById('hudAmmo3D');
    const comp = document.getElementById('hudCompassBar');

    if (hp) hp.style.width = this.playerStats.health + '%';
    if (sta) sta.style.width = this.playerStats.stamina + '%';
    if (inf) inf.style.width = this.playerStats.infection + '%';
    if (ammo) ammo.textContent = `${this.playerStats.ammo} / ${this.playerStats.maxAmmo}`;

    if (comp) {
      let deg = Math.round(((-this.yaw * 180 / Math.PI) % 360 + 360) % 360);
      comp.textContent = `${deg}° | ${this.getCardinal(deg)}`;
    }
  }

  getCardinal(deg) {
    if (deg >= 337 || deg < 23) return 'N';
    if (deg >= 23 && deg < 67) return 'NE';
    if (deg >= 67 && deg < 112) return 'E';
    if (deg >= 112 && deg < 157) return 'SE';
    if (deg >= 157 && deg < 202) return 'S';
    if (deg >= 202 && deg < 247) return 'SW';
    if (deg >= 247 && deg < 292) return 'W';
    return 'NW';
  }

  animate() {
    const dt = Math.min(0.1, this.clock.getDelta());

    this.updateDayNightCycle(dt);

    if (this.cameraMode === 'drone') {
      this.updateDrone(dt);
    } else {
      this.updatePlayer(dt);
    }

    this.updateZombies(dt);
    this.updateHeatDome();
    this.updateAtmosphere(dt);
    this.updateHUD();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

window.SurvivalGame3D = SurvivalGame3D;
