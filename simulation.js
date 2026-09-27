/**
 * Top-down 2D Survival Horror Arena Simulation.
 * Real-time player movement, flashlight cone, zombies, safehouse generator,
 * dynamic heat attraction sphere, and telemetry integration.
 */
class ArenaSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Player state
    this.player = {
      x: 180,
      y: 300,
      radius: 12,
      speed: 2.8,
      stamina: 100,
      maxStamina: 100,
      angle: 0,
      isCrouching: false,
      isSprinting: false,
      infection: 0,
      ammo: 24
    };

    // Safehouse & Heat Manager
    this.safehouse = {
      x: 140,
      y: 300,
      w: 160,
      h: 220,
      doorX: 220,
      doorY: 300,
      totalHeat: 45,
      multiplier: 2.0,
      generatorActive: true,
      radioActive: true,
      lightsActive: true
    };

    // Entities
    this.zombies = [];
    this.bullets = [];
    this.lootCaches = [];
    this.particles = [];

    // Controls
    this.keys = {};
    this.mouse = { x: 0, y: 0 };

    // Telemetry sampling window (5 seconds)
    this.telemetryWindow = {
      timeInCrouch: 0,
      shotsFired: 0,
      distanceSprinted: 0,
      containersLooted: 0,
      lastSampleTime: performance.now()
    };

    this.scores = {
      stealth: 25,
      aggression: 25,
      looting: 25,
      building: 25,
      dominant: 'Hunter'
    };

    this.initEntities();
    this.bindEvents();
    this.lastTime = performance.now();
  }

  initEntities() {
    this.zombies = [];
    this.lootCaches = [
      { x: 450, y: 120, looted: false, radius: 14 },
      { x: 720, y: 220, looted: false, radius: 14 },
      { x: 580, y: 480, looted: false, radius: 14 },
      { x: 840, y: 400, looted: false, radius: 14 }
    ];

    // Spawn initial wandering horde
    for (let i = 0; i < 14; i++) {
      this.spawnZombie();
    }
  }

  spawnZombie(typeOverride = null) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 380 + Math.random() * 250;
    const x = Math.max(340, Math.min(this.width - 40, this.safehouse.x + Math.cos(angle) * dist));
    const y = Math.max(40, Math.min(this.height - 40, this.safehouse.y + Math.sin(angle) * dist));

    const type = typeOverride || this.scores.dominant || 'Hunter';

    this.zombies.push({
      x,
      y,
      radius: 11,
      speed: type === 'Swarm' ? 2.2 : (type === 'Ambusher' ? 2.6 : 1.6),
      hp: type === 'Swarm' ? 40 : (type === 'Ambusher' ? 30 : 60),
      type: type,
      state: 'wander',
      targetX: x,
      targetY: y,
      wanderTimer: Math.random() * 3
    });
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 'c') {
        this.player.isCrouching = !this.player.isCrouching;
        document.getElementById('hudPosture').textContent = this.player.isCrouching ? 'CROUCHING (STEALTH)' : 'STANDING';
        document.getElementById('hudPosture').style.color = this.player.isCrouching ? '#3b82f6' : '#00f5d4';
      }

      if (e.key.toLowerCase() === 'e') {
        this.interact();
      }

      if (e.key === ' ' || e.code === 'Space') {
        this.shoot();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (window.horrorAudio) window.horrorAudio.init();
        this.shoot();
      }
    });
  }

  interact() {
    // Check loot caches
    for (let cache of this.lootCaches) {
      if (!cache.looted) {
        const d = Math.hypot(this.player.x - cache.x, this.player.y - cache.y);
        if (d < 35) {
          cache.looted = true;
          this.player.ammo += 12;
          this.telemetryWindow.containersLooted++;
          if (window.showToast) window.showToast("Supply Crate Looted (+12 Ammo)", "#10b981");
          return;
        }
      }
    }

    // Check safehouse generator interaction (Generator at x:110, y:280)
    const genDist = Math.hypot(this.player.x - 110, this.player.y - 280);
    if (genDist < 45) {
      this.safehouse.generatorActive = !this.safehouse.generatorActive;
      this.recalculateHeat();
      if (window.horrorAudio) window.horrorAudio.toggleGeneratorHum(this.safehouse.generatorActive);
      const stateTxt = this.safehouse.generatorActive ? "ONLINE (+35 Heat)" : "OFFLINE";
      if (window.showToast) window.showToast(`Modified Generator Toggled: ${stateTxt}`, "#ff9e00");
    }
  }

  shoot() {
    if (this.player.ammo <= 0) return;
    this.player.ammo--;
    this.telemetryWindow.shotsFired++;

    if (window.horrorAudio) {
      window.horrorAudio.playGunshot();
    }

    const angle = this.player.angle;
    this.bullets.push({
      x: this.player.x + Math.cos(angle) * 16,
      y: this.player.y + Math.sin(angle) * 16,
      vx: Math.cos(angle) * 14,
      vy: Math.sin(angle) * 14,
      life: 50
    });

    // Gunshot sound alerts nearby zombies
    for (let z of this.zombies) {
      const d = Math.hypot(z.x - this.player.x, z.y - this.player.y);
      if (d < (this.player.isCrouching ? 160 : 360)) {
        z.state = 'chase';
      }
    }
  }

  recalculateHeat() {
    let heat = 10; // Baseline
    if (this.safehouse.generatorActive) heat += 35;
    if (this.safehouse.radioActive) heat += 15;
    if (this.safehouse.lightsActive) heat += 20;

    this.safehouse.totalHeat = heat;
    const radius = heat * this.safehouse.multiplier;

    // Update HUD elements
    const elHeat = document.getElementById('arenaTotalHeat');
    const elRad = document.getElementById('arenaPullRadius');
    const elTickerHeat = document.getElementById('tickerHeat');
    if (elHeat) elHeat.textContent = heat.toFixed(1);
    if (elRad) elRad.textContent = radius.toFixed(1) + 'm';
    if (elTickerHeat) elTickerHeat.textContent = `${heat.toFixed(1)} (RAD: ${radius.toFixed(0)}m)`;
  }

  update(dt) {
    // 1. Player Movement & Posture
    this.player.isSprinting = !!(this.keys['shift'] && this.player.stamina > 5 && !this.player.isCrouching);

    let moveX = 0;
    let moveY = 0;
    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    let currentSpeed = this.player.speed;
    if (this.player.isCrouching) {
      currentSpeed *= 0.55;
      this.telemetryWindow.timeInCrouch += dt;
    } else if (this.player.isSprinting) {
      currentSpeed *= 1.7;
      this.player.stamina = Math.max(0, this.player.stamina - dt * 25);
      this.telemetryWindow.distanceSprinted += currentSpeed * dt * 10;
    } else {
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + dt * 15);
    }

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      this.player.x = Math.max(20, Math.min(this.width - 20, this.player.x + (moveX / len) * currentSpeed));
      this.player.y = Math.max(20, Math.min(this.height - 20, this.player.y + (moveY / len) * currentSpeed));
    }

    // Aim angle
    this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);

    // Update HUD stamina
    const staminaBar = document.getElementById('hudStaminaBar');
    if (staminaBar) staminaBar.style.width = (this.player.stamina / this.player.maxStamina * 100) + '%';

    // 2. Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Hit check against zombies
      for (let j = this.zombies.length - 1; j >= 0; j--) {
        const z = this.zombies[j];
        if (Math.hypot(b.x - z.x, b.y - z.y) < z.radius + 4) {
          z.hp -= 25;
          b.life = 0;
          if (z.hp <= 0) {
            this.zombies.splice(j, 1);
            setTimeout(() => this.spawnZombie(), 4000);
          }
          break;
        }
      }

      if (b.life <= 0 || b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
        this.bullets.splice(i, 1);
      }
    }

    // 3. Base Heat Attraction Sphere Check
    const heatRadius = this.safehouse.totalHeat * this.safehouse.multiplier;
    const baseCenterX = this.safehouse.x;
    const baseCenterY = this.safehouse.y;

    // 4. Zombie AI
    for (let z of this.zombies) {
      const distToPlayer = Math.hypot(z.x - this.player.x, z.y - this.player.y);
      const distToBase = Math.hypot(z.x - baseCenterX, z.y - baseCenterY);

      // Check heat pull
      if (distToBase < heatRadius && z.state !== 'chase') {
        z.state = 'drawn_to_heat';
      }

      // Check player detection
      const detectDist = this.player.isCrouching ? 80 : (this.player.isSprinting ? 280 : 150);
      if (distToPlayer < detectDist) {
        z.state = 'chase';
      }

      // Movement logic
      let targetX = z.targetX;
      let targetY = z.targetY;

      if (z.state === 'chase') {
        targetX = this.player.x;
        targetY = this.player.y;
      } else if (z.state === 'drawn_to_heat') {
        targetX = this.safehouse.doorX;
        targetY = this.safehouse.doorY;
      } else {
        z.wanderTimer -= dt;
        if (z.wanderTimer <= 0) {
          z.targetX = z.x + (Math.random() - 0.5) * 120;
          z.targetY = z.y + (Math.random() - 0.5) * 120;
          z.wanderTimer = 3 + Math.random() * 3;
        }
      }

      const dx = targetX - z.x;
      const dy = targetY - z.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        z.x += (dx / dist) * z.speed;
        z.y += (dy / dist) * z.speed;
      }

      // Player scratch damage & infection
      if (distToPlayer < z.radius + this.player.radius) {
        this.player.infection = Math.min(100, this.player.infection + dt * 12);
        const infBar = document.getElementById('hudInfectionBar');
        if (infBar) infBar.style.width = this.player.infection + '%';
        const tickerInf = document.getElementById('tickerInfection');
        if (tickerInf) tickerInf.textContent = this.player.infection.toFixed(1) + '%';
        if (window.setGlobalInfection) window.setGlobalInfection(this.player.infection);
      }
    }

    // 5. Evaluate Telemetry Cycle every 5 seconds
    if (performance.now() - this.telemetryWindow.lastSampleTime >= 5000) {
      this.evaluateTelemetry();
      this.telemetryWindow.lastSampleTime = performance.now();
    }
  }

  evaluateTelemetry() {
    const rawStealth = (this.telemetryWindow.timeInCrouch * 3.5) + 1.0;
    const rawAggression = (this.telemetryWindow.shotsFired * 6.0) + (this.telemetryWindow.distanceSprinted * 0.05);
    const rawLooting = (this.telemetryWindow.containersLooted * 18.0);
    const rawBuilding = (this.safehouse.generatorActive ? 12 : 2);

    const totalRaw = rawStealth + rawAggression + rawLooting + rawBuilding;

    if (totalRaw > 0) {
      this.scores.stealth = (rawStealth / totalRaw) * 100;
      this.scores.aggression = (rawAggression / totalRaw) * 100;
      this.scores.looting = (rawLooting / totalRaw) * 100;
      this.scores.building = (rawBuilding / totalRaw) * 100;
    }

    // Find dominant playstyle (>40%)
    let maxScore = Math.max(this.scores.stealth, this.scores.aggression, this.scores.looting, this.scores.building);
    let newArchetype = 'Hunter';
    let detail = 'Counters scavenging habits along supply routes.';

    if (this.scores.aggression >= 40) {
      newArchetype = 'Swarm';
      detail = 'Sound-Adapted Swarmer spawned to punish loud gunfire.';
    } else if (this.scores.stealth >= 40) {
      newArchetype = 'Ambusher';
      detail = 'Ceiling-Crawling Ambusher spawned to punish crouching stealth.';
    }

    if (newArchetype !== this.scores.dominant) {
      this.scores.dominant = newArchetype;
      if (window.showToast) window.showToast(`AI Director Shifted: ${newArchetype.toUpperCase()}`, '#ff0055');
      this.spawnZombie(newArchetype);
    }

    // Update UI elements
    this.updateSidebarUI(maxScore, detail);

    // Reset raw counters
    this.telemetryWindow.timeInCrouch = 0;
    this.telemetryWindow.shotsFired = 0;
    this.telemetryWindow.distanceSprinted = 0;
    this.telemetryWindow.containersLooted = 0;
  }

  updateSidebarUI(dominancePct, detail) {
    const s = document.getElementById('barStealth');
    const a = document.getElementById('barAggression');
    const l = document.getElementById('barLooting');
    const b = document.getElementById('barBuilding');

    if (s) { s.style.width = this.scores.stealth + '%'; document.getElementById('valStealth').textContent = this.scores.stealth.toFixed(0) + '%'; }
    if (a) { a.style.width = this.scores.aggression + '%'; document.getElementById('valAggression').textContent = this.scores.aggression.toFixed(0) + '%'; }
    if (l) { l.style.width = this.scores.looting + '%'; document.getElementById('valLooting').textContent = this.scores.looting.toFixed(0) + '%'; }
    if (b) { b.style.width = this.scores.building + '%'; document.getElementById('valBuilding').textContent = this.scores.building.toFixed(0) + '%'; }

    const archEl = document.getElementById('arenaActiveArchetype');
    const descEl = document.getElementById('arenaArchetypeDesc');
    const tickEl = document.getElementById('tickerDirector');

    if (archEl) archEl.textContent = this.scores.dominant.toUpperCase();
    if (descEl) descEl.textContent = detail;
    if (tickEl) {
      tickEl.textContent = `${this.scores.dominant.toUpperCase()} MATRIX`;
      tickEl.className = 'ticker-val archetype-' + this.scores.dominant.toLowerCase();
    }
  }

  draw() {
    this.ctx.fillStyle = '#07090c';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw floor grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
    }

    // Draw Dynamic Base Heat Attraction Sphere
    const heatRadius = this.safehouse.totalHeat * this.safehouse.multiplier;
    const pulse = Math.sin(performance.now() * 0.003) * 6;

    const heatGrad = this.ctx.createRadialGradient(this.safehouse.x, this.safehouse.y, 10, this.safehouse.x, this.safehouse.y, heatRadius + pulse);
    heatGrad.addColorStop(0, 'rgba(255, 120, 0, 0.18)');
    heatGrad.addColorStop(0.85, 'rgba(255, 60, 0, 0.08)');
    heatGrad.addColorStop(1, 'rgba(255, 30, 0, 0)');

    this.ctx.fillStyle = heatGrad;
    this.ctx.beginPath();
    this.ctx.arc(this.safehouse.x, this.safehouse.y, heatRadius + pulse, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 120, 0, 0.4)';
    this.ctx.setLineDash([6, 6]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw Safehouse
    this.ctx.fillStyle = 'rgba(20, 30, 45, 0.9)';
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(this.safehouse.x - 70, this.safehouse.y - 100, 140, 200);
    this.ctx.strokeRect(this.safehouse.x - 70, this.safehouse.y - 100, 140, 200);

    // Safehouse Door
    this.ctx.fillStyle = '#ff9e00';
    this.ctx.fillRect(this.safehouse.doorX - 150, this.safehouse.doorY - 15, 6, 30);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '10px Rajdhani';
    this.ctx.fillText("SAFEHOUSE CORE", this.safehouse.x - 48, this.safehouse.y - 80);

    // Generator Object inside safehouse
    this.ctx.fillStyle = this.safehouse.generatorActive ? '#ff9e00' : '#475569';
    this.ctx.fillRect(100, 270, 20, 20);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '8px Rajdhani';
    this.ctx.fillText("GEN", 102, 283);

    // Draw Loot Caches
    for (let cache of this.lootCaches) {
      this.ctx.fillStyle = cache.looted ? '#334155' : '#10b981';
      this.ctx.fillRect(cache.x - 10, cache.y - 10, 20, 20);
      this.ctx.strokeStyle = cache.looted ? '#475569' : '#34d399';
      this.ctx.strokeRect(cache.x - 10, cache.y - 10, 20, 20);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '9px Rajdhani';
      this.ctx.fillText(cache.looted ? "EMPTY" : "CACHE", cache.x - 12, cache.y + 22);
    }

    // Draw Bullets
    this.ctx.fillStyle = '#fef08a';
    for (let b of this.bullets) {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw Zombies
    for (let z of this.zombies) {
      this.ctx.save();
      this.ctx.translate(z.x, z.y);

      // Color by archetype
      if (z.type === 'Swarm') {
        this.ctx.fillStyle = '#e63946'; // Red
      } else if (z.type === 'Ambusher') {
        this.ctx.fillStyle = '#a855f7'; // Purple
      } else {
        this.ctx.fillStyle = '#eab308'; // Amber/Yellow
      }

      this.ctx.beginPath();
      this.ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // State indicator ring
      if (z.state === 'drawn_to_heat') {
        this.ctx.strokeStyle = 'rgba(255, 120, 0, 0.8)';
        this.ctx.stroke();
      } else if (z.state === 'chase') {
        this.ctx.strokeStyle = 'rgba(230, 57, 70, 0.9)';
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    // Draw Player & Flashlight Cone
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.rotate(this.player.angle);

    // Flashlight cone
    const coneDist = this.player.isCrouching ? 160 : 260;
    const coneAngle = 0.55;

    const flashGrad = this.ctx.createRadialGradient(0, 0, 10, 0, 0, coneDist);
    flashGrad.addColorStop(0, 'rgba(255, 255, 230, 0.45)');
    flashGrad.addColorStop(0.7, 'rgba(255, 240, 200, 0.15)');
    flashGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');

    this.ctx.fillStyle = flashGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.arc(0, 0, coneDist, -coneAngle, coneAngle);
    this.ctx.closePath();
    this.ctx.fill();

    // Player body
    this.ctx.fillStyle = this.player.isCrouching ? '#3b82f6' : '#00f5d4';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Weapon barrel
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 4);
    this.ctx.lineTo(16, 4);
    this.ctx.stroke();

    this.ctx.restore();
  }

  loop() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.draw();

    requestAnimationFrame(() => this.loop());
  }

  start() {
    this.recalculateHeat();
    this.loop();
  }
}

window.ArenaSimulation = ArenaSimulation;
