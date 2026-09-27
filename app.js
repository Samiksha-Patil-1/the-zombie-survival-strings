/**
 * Main Web Application Controller for The Survival String.
 * Handles tab navigation, DAG Graph visualizer, Telemetry Radar, Base Heat Radar,
 * Organic Infection shaders, and audio synthesis integration.
 */

// Toast notification helper
window.showToast = function(message, color = '#ff9e00') {
  const container = document.getElementById('toastNotification');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = color;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Global infection hook
window.setGlobalInfection = function(pct) {
  const el = document.getElementById('sliderInfectionLevel');
  if (el) {
    el.value = pct;
    updateInfectionVisuals(pct);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Audio Button
  const audioBtn = document.getElementById('btnAudioToggle');
  const audioBtnText = document.getElementById('audioBtnText');
  audioBtn.addEventListener('click', () => {
    if (window.horrorAudio) {
      window.horrorAudio.init();
      const active = window.horrorAudio.toggleMute();
      audioBtnText.textContent = active ? 'AUDIO FX: ON' : 'AUDIO FX: MUTED';
      audioBtn.style.borderColor = active ? 'var(--accent-amber)' : 'var(--border-color)';
    }
  });

  // 2. Tab Navigation
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');

      if (window.horrorAudio) window.horrorAudio.init();

      // Trigger redraws on tab switch
      if (targetId === 'stringTab') drawDAG();
      if (targetId === 'directorTab') drawRadar();
      if (targetId === 'heatTab') drawHeatRadar();
    });
  });

  // 3. Initialize 3D Survival Horror Engine
  try {
    if (window.SurvivalGame3D && document.getElementById('game3DContainer')) {
      window.game3D = new window.SurvivalGame3D('game3DContainer');
    }
  } catch (err) {
    console.error("Failed to initialize 3D WebGL engine:", err);
    const container = document.getElementById('game3DContainer');
    if (container) {
      const errBox = document.createElement('div');
      errBox.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(10,14,20,0.92); z-index:90; padding:20px;';
      errBox.innerHTML = `
        <div style="background: rgba(230, 57, 70, 0.15); border: 1px solid var(--accent-crimson); padding: 24px; border-radius: 8px; text-align: center; max-width: 520px;">
          <h3 style="color: var(--accent-crimson); font-family: var(--font-display); margin-bottom: 8px;">3D ENGINE INITIALIZATION NOTICE</h3>
          <p style="color: var(--text-muted); font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
            Hardware WebGL acceleration could not be started in this browser session (${err.message || 'Context Error'}).
            The game simulation is still 100% active in the tabs above!
          </p>
          <button id="btnFallbackToArena" class="cyber-btn" style="border-color:var(--accent-cyan); color:var(--accent-cyan);">🗺️ OPEN 2D TACTICAL RADAR SIMULATOR</button>
        </div>
      `;
      container.appendChild(errBox);
      const fb = document.getElementById('btnFallbackToArena');
      if (fb) fb.addEventListener('click', () => document.querySelector('[data-tab="arenaTab"]')?.click());
    }
  }

  // Hook Start Game & Drone Buttons in Overlay
  const btnStartPlay = document.getElementById('btnStartGamePlay');
  if (btnStartPlay) {
    btnStartPlay.addEventListener('click', () => {
      if (window.horrorAudio) window.horrorAudio.init();
      const playOverlay = document.getElementById('clickToPlayOverlay');
      if (playOverlay) playOverlay.style.display = 'none';

      if (window.game3D) {
        window.game3D.hasStartedGame = true;
        if (window.game3D.renderer && window.game3D.renderer.domElement) {
          try {
            window.game3D.renderer.domElement.requestPointerLock();
          } catch (e) {
            console.warn("Pointer lock request:", e);
          }
        }
      }
      window.showToast("🎮 SURVIVAL ZONE ENGAGED! Move with WASD, Click/Drag to look around.", "#00f5d4");
    });
  }

  const btnQuickDrone = document.getElementById('btnQuickDroneStart');
  if (btnQuickDrone) {
    btnQuickDrone.addEventListener('click', () => {
      if (window.horrorAudio) window.horrorAudio.init();
      const playOverlay = document.getElementById('clickToPlayOverlay');
      if (playOverlay) playOverlay.style.display = 'none';

      if (window.game3D) {
        window.game3D.hasStartedGame = true;
        window.game3D.cameraMode = 'drone';
        window.game3D.drone.position.set(window.game3D.playerGroup.position.x, 80, window.game3D.playerGroup.position.z + 30);
        window.game3D.drone.pitch = -0.5;
        const btnD = document.getElementById('btnToggleDrone');
        if (btnD) btnD.classList.add('active');
        if (window.game3D.renderer && window.game3D.renderer.domElement) {
          try {
            window.game3D.renderer.domElement.requestPointerLock();
          } catch (e) {}
        }
      }
      window.showToast("🛸 DRONE FLIGHT ACTIVE: WASD to fly across the city, Space/Shift for Altitude!", "#00f5d4");
    });
  }

  // Hook Restart & Replay Buttons across all HUD & Modals
  const triggerGameRestart = () => {
    const playOverlay = document.getElementById('clickToPlayOverlay');
    if (playOverlay) playOverlay.style.display = 'none';
    const gModal = document.getElementById('gameOverModal');
    if (gModal) gModal.style.display = 'none';

    if (window.game3D) {
      window.game3D.replayGame();
    }
  };

  const btnRestartHud = document.getElementById('btnRestartGameHud');
  if (btnRestartHud) btnRestartHud.addEventListener('click', triggerGameRestart);

  const btnRestartPause = document.getElementById('btnRestartFromPause');
  if (btnRestartPause) btnRestartPause.addEventListener('click', triggerGameRestart);

  const btnReplay = document.getElementById('btnReplayGame');
  if (btnReplay) btnReplay.addEventListener('click', triggerGameRestart);

  const btnHardReload = document.getElementById('btnHardReloadGameOver');
  if (btnHardReload) {
    btnHardReload.addEventListener('click', () => {
      window.location.reload();
    });
  }

  const btnExploreDeath = document.getElementById('btnExploreGraphFromDeath');
  if (btnExploreDeath) {
    btnExploreDeath.addEventListener('click', () => {
      const gModal = document.getElementById('gameOverModal');
      if (gModal) gModal.style.display = 'none';
      document.querySelector('[data-tab="stringTab"]')?.click();
    });
  }

  // 4. Start 2D Tactical Arena Simulation (if canvas present)
  let arena = null;
  if (window.ArenaSimulation && document.getElementById('arenaCanvas')) {
    arena = new window.ArenaSimulation('arenaCanvas');
    arena.start();
  }

  // Arena Sidebar Toggles (with safe null checks)
  const tGen = document.getElementById('toggleArenaGen');
  if (tGen && arena) {
    tGen.addEventListener('change', (e) => {
      arena.safehouse.generatorActive = e.target.checked;
      arena.recalculateHeat();
      if (window.horrorAudio) window.horrorAudio.toggleGeneratorHum(e.target.checked);
    });
  }
  const tRadio = document.getElementById('toggleArenaRadio');
  if (tRadio && arena) {
    tRadio.addEventListener('change', (e) => {
      arena.safehouse.radioActive = e.target.checked;
      arena.recalculateHeat();
    });
  }
  const tLights = document.getElementById('toggleArenaLights');
  if (tLights && arena) {
    tLights.addEventListener('change', (e) => {
      arena.safehouse.lightsActive = e.target.checked;
      arena.recalculateHeat();
    });
  }
  const bHorde = document.getElementById('btnSpawnHorde');
  if (bHorde) {
    bHorde.addEventListener('click', () => {
      if (arena) for (let i = 0; i < 8; i++) arena.spawnZombie('Swarm');
      if (window.game3D) for (let i = 0; i < 6; i++) window.game3D.spawnZombieArchetype('Swarm');
      window.showToast("⚠️ Aggression Horde Spawned (Sound-Adapted Swarmers)!", "#e63946");
      if (window.horrorAudio) window.horrorAudio.playGunshot();
    });
  }
  const bReset = document.getElementById('btnResetArena');
  if (bReset) {
    bReset.addEventListener('click', () => {
      if (arena) {
        arena.initEntities();
        arena.player.infection = 0;
      }
      const infBar = document.getElementById('hudInfectionBar');
      if (infBar) infBar.style.width = '0%';
      const tickInf = document.getElementById('tickerInfection');
      if (tickInf) tickInf.textContent = '0.0%';
      window.showToast("Simulation Reset", "#00f5d4");
    });
  }

  // Quick 3D Toolbar Button Listeners
  const btnDrone = document.getElementById('btnToggleDrone');
  if (btnDrone) {
    btnDrone.addEventListener('click', () => {
      if (!window.game3D) return;
      window.game3D.cameraMode = window.game3D.cameraMode === 'drone' ? 'fps' : 'drone';
      if (window.game3D.cameraMode === 'drone') {
        window.game3D.drone.position.set(window.game3D.playerGroup.position.x, 85, window.game3D.playerGroup.position.z + 40);
        window.showToast("🛸 DRONE FLIGHT ACTIVE: Fly across the city! (WASD + Space/Shift)", "#00f5d4");
        btnDrone.classList.add('active');
      } else {
        window.showToast("Ground View Restored", "#ff9e00");
        btnDrone.classList.remove('active');
      }
    });
  }

  const btnCam = document.getElementById('btnToggleCamView');
  if (btnCam) {
    btnCam.addEventListener('click', () => {
      if (!window.game3D) return;
      window.game3D.cameraMode = window.game3D.cameraMode === 'fps' ? 'tps' : 'fps';
      window.showToast(`View Mode: ${window.game3D.cameraMode.toUpperCase()}`, "#ff9e00");
    });
  }

  const btnPistol = document.getElementById('btnEquipPistol');
  const btnBat = document.getElementById('btnEquipBat');
  if (btnPistol && btnBat) {
    btnPistol.addEventListener('click', () => {
      if (window.game3D) window.game3D.switchWeapon('pistol');
      btnPistol.classList.add('active');
      btnBat.classList.remove('active');
    });
    btnBat.addEventListener('click', () => {
      if (window.game3D) window.game3D.switchWeapon('bat');
      btnBat.classList.add('active');
      btnPistol.classList.remove('active');
    });
  }

  // ==========================================================================
  // TAB 2: DAG GRAPH VISUALIZER
  // ==========================================================================
  const dagCanvas = document.getElementById('dagCanvas');
  const dagCtx = dagCanvas.getContext('2d');

  const nodes = [
    { id: 'OUTPOST_BREACH', title: 'Day 0: Outpost Breach', x: 80, y: 260, status: 'unlocked', desc: 'The perimeter wall was breached. Survivors scattered into the district.', children: ['SAVE_ENGINEER', 'ABANDON_OUTPOST'] },
    { id: 'SAVE_ENGINEER', title: 'Rescue Chief Engineer', x: 260, y: 150, status: 'unlocked', desc: 'Engineer rescued at Substation 4. Unlocks high-voltage generator repair routes.', children: ['REPAIR_GENERATOR', 'TURRET_BLUEPRINTS'] },
    { id: 'ABANDON_OUTPOST', title: 'Abandon District Outpost', x: 260, y: 370, status: 'blocked', desc: 'Scavenge supply depot instead. Engineer is lost; generator cannot be overhauled.', children: ['CHASM_EXPEDITION'] },
    { id: 'REPAIR_GENERATOR', title: 'Overhaul Substation Generator', x: 480, y: 110, status: 'available', desc: 'Powers floodlights and automated turrets. Generates huge heat attractant.', children: ['FORTIFY_PERIMETER'] },
    { id: 'TURRET_BLUEPRINTS', title: 'Fabricate Defense Turrets', x: 480, y: 200, status: 'available', desc: 'Deploys 360-degree point-defense turrets requiring 30W power.', children: ['FORTIFY_PERIMETER'] },
    { id: 'CHASM_EXPEDITION', title: 'Deep Chasm Expedition', x: 480, y: 370, status: 'locked', desc: 'Navigate high-infection underground chasm looking for medical supplies.', children: ['MILITARY_BARRICADE'] },
    { id: 'FORTIFY_PERIMETER', title: 'Master Safehouse Lockdown', x: 720, y: 150, status: 'locked', desc: 'All defensive systems online. Ready to withstand the Day 7 Super-Horde.', children: [] },
    { id: 'MILITARY_BARRICADE', title: 'Breach Military Barricade', x: 720, y: 370, status: 'locked', desc: 'Break through quarantine wall using improvised C4 charges.', children: [] }
  ];

  let selectedNode = nodes[1];

  function drawDAG() {
    dagCtx.fillStyle = '#070a0e';
    dagCtx.fillRect(0, 0, dagCanvas.width, dagCanvas.height);

    // Draw connecting edges/strings
    for (let node of nodes) {
      for (let childId of node.children) {
        const child = nodes.find(n => n.id === childId);
        if (child) {
          dagCtx.beginPath();
          dagCtx.moveTo(node.x + 60, node.y + 20);
          dagCtx.lineTo(child.x, child.y + 20);

          if (node.status === 'unlocked' && child.status === 'unlocked') {
            dagCtx.strokeStyle = '#ff9e00';
            dagCtx.lineWidth = 3;
            dagCtx.shadowColor = 'rgba(255, 158, 0, 0.5)';
            dagCtx.shadowBlur = 8;
          } else if (child.status === 'available') {
            dagCtx.strokeStyle = '#00f5d4';
            dagCtx.lineWidth = 2;
            dagCtx.shadowBlur = 4;
          } else {
            dagCtx.strokeStyle = '#334155';
            dagCtx.lineWidth = 1.5;
            dagCtx.shadowBlur = 0;
          }
          dagCtx.stroke();
          dagCtx.shadowBlur = 0;
        }
      }
    }

    // Draw nodes
    for (let node of nodes) {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const w = 150;
      const h = 50;

      // Box styling
      dagCtx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
      if (node.status === 'unlocked') {
        dagCtx.strokeStyle = '#ff9e00';
      } else if (node.status === 'available') {
        dagCtx.strokeStyle = '#00f5d4';
      } else if (node.status === 'blocked') {
        dagCtx.strokeStyle = '#e63946';
      } else {
        dagCtx.strokeStyle = '#475569';
      }

      dagCtx.lineWidth = isSelected ? 3 : 1.5;
      dagCtx.fillRect(node.x, node.y, w, h);
      dagCtx.strokeRect(node.x, node.y, w, h);

      // Node label
      dagCtx.fillStyle = node.status === 'unlocked' ? '#ff9e00' : (node.status === 'available' ? '#00f5d4' : '#94a3b8');
      dagCtx.font = 'bold 10px Orbitron';
      dagCtx.fillText(node.id, node.x + 10, node.y + 18);

      dagCtx.fillStyle = '#cbd5e1';
      dagCtx.font = '11px Rajdhani';
      dagCtx.fillText(node.title.length > 20 ? node.title.substring(0, 18) + '...' : node.title, node.x + 10, node.y + 36);
    }
  }

  dagCanvas.addEventListener('click', (e) => {
    const rect = dagCanvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (dagCanvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (dagCanvas.height / rect.height);

    for (let node of nodes) {
      if (clickX >= node.x && clickX <= node.x + 150 && clickY >= node.y && clickY <= node.y + 50) {
        selectedNode = node;
        updateInspector();
        drawDAG();
        return;
      }
    }
  });

  function updateInspector() {
    const el = document.getElementById('inspectorContent');
    if (!selectedNode || !el) return;

    el.innerHTML = `
      <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid var(--border-color);">
        <span style="font-family: var(--font-display); font-size: 11px; color: var(--accent-amber);">${selectedNode.id}</span>
        <h4 style="font-size: 14px; margin: 4px 0 8px 0; color: #fff;">${selectedNode.title}</h4>
        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5;">${selectedNode.desc}</p>
      </div>

      <div style="font-size: 11px; font-family: var(--font-tech); margin-bottom: 12px; color: var(--text-dim);">
        <div>STATUS: <b style="color:${selectedNode.status === 'unlocked' ? '#ff9e00' : '#00f5d4'}">${selectedNode.status.toUpperCase()}</b></div>
        <div>DOWNSTREAM EDGES: <b>${selectedNode.children.length}</b></div>
      </div>

      ${selectedNode.status === 'available' ? `
        <button id="btnCommitNode" class="action-btn-red" style="margin-bottom: 8px;">✔ COMMIT DECISION (MakeDecision)</button>
      ` : ''}
    `;

    const commitBtn = document.getElementById('btnCommitNode');
    if (commitBtn) {
      commitBtn.addEventListener('click', () => {
        selectedNode.status = 'unlocked';
        // Unlock downstream children
        for (let childId of selectedNode.children) {
          const child = nodes.find(n => n.id === childId);
          if (child && child.status === 'locked') {
            child.status = 'available';
          }
        }
        window.showToast(`Decision Committed: ${selectedNode.title}`, '#ff9e00');
        if (window.horrorAudio) window.horrorAudio.playHeartbeat();
        updateInspector();
        drawDAG();
      });
    }
  }

  document.getElementById('btnResetGraph').addEventListener('click', () => {
    nodes.forEach(n => {
      if (n.id === 'OUTPOST_BREACH' || n.id === 'SAVE_ENGINEER') n.status = 'unlocked';
      else if (n.id === 'REPAIR_GENERATOR' || n.id === 'TURRET_BLUEPRINTS') n.status = 'available';
      else if (n.id === 'ABANDON_OUTPOST') n.status = 'blocked';
      else n.status = 'locked';
    });
    selectedNode = nodes[1];
    updateInspector();
    drawDAG();
    window.showToast("Graph State Machine Reset", "#00f5d4");
  });

  document.getElementById('btnExportGraphJson').addEventListener('click', () => {
    const json = JSON.stringify(nodes, null, 2);
    console.log("SURVIVAL STRING DAG JSON EXPORT:\n", json);
    window.showToast("DAG State JSON logged to browser console (F12)", "#ff9e00");
  });

  updateInspector();
  drawDAG();

  // ==========================================================================
  // TAB 3: TELEMETRY 4D RADAR
  // ==========================================================================
  const radarCanvas = document.getElementById('radarCanvas');
  const radarCtx = radarCanvas.getContext('2d');

  let simScores = { stealth: 25, aggression: 25, looting: 25, building: 25 };

  function drawRadar() {
    radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
    const cx = radarCanvas.width / 2;
    const cy = radarCanvas.height / 2;
    const radius = 130;

    // Background concentric diamonds
    radarCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    radarCtx.lineWidth = 1;

    for (let step = 0.25; step <= 1.0; step += 0.25) {
      radarCtx.beginPath();
      radarCtx.moveTo(cx, cy - radius * step);
      radarCtx.lineTo(cx + radius * step, cy);
      radarCtx.lineTo(cx, cy + radius * step);
      radarCtx.lineTo(cx - radius * step, cy);
      radarCtx.closePath();
      radarCtx.stroke();
    }

    // Axes
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy - radius); radarCtx.lineTo(cx, cy + radius);
    radarCtx.moveTo(cx - radius, cy); radarCtx.lineTo(cx + radius, cy);
    radarCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    radarCtx.stroke();

    // Labels
    radarCtx.fillStyle = '#94a3b8';
    radarCtx.font = 'bold 11px Rajdhani';
    radarCtx.fillText("STEALTH", cx - 22, cy - radius - 8);
    radarCtx.fillText("AGGRESSION", cx + radius + 8, cy + 4);
    radarCtx.fillText("LOOTING", cx - 20, cy + radius + 16);
    radarCtx.fillText("BUILDING", cx - radius - 55, cy + 4);

    // Draw Data Polygon
    const sNorm = (simScores.stealth / 100) * radius;
    const aNorm = (simScores.aggression / 100) * radius;
    const lNorm = (simScores.looting / 100) * radius;
    const bNorm = (simScores.building / 100) * radius;

    radarCtx.fillStyle = 'rgba(255, 158, 0, 0.25)';
    radarCtx.strokeStyle = '#ff9e00';
    radarCtx.lineWidth = 2.5;

    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy - sNorm);
    radarCtx.lineTo(cx + aNorm, cy);
    radarCtx.lineTo(cx, cy + lNorm);
    radarCtx.lineTo(cx - bNorm, cy);
    radarCtx.closePath();
    radarCtx.fill();
    radarCtx.stroke();
  }

  function handleSimSliders() {
    const s = parseFloat(document.getElementById('sliderStealth').value);
    const a = parseFloat(document.getElementById('sliderAggression').value);
    const l = parseFloat(document.getElementById('sliderLooting').value);
    const b = parseFloat(document.getElementById('sliderBuilding').value);

    const total = s + a + l + b;
    if (total > 0) {
      simScores.stealth = (s / total) * 100;
      simScores.aggression = (a / total) * 100;
      simScores.looting = (l / total) * 100;
      simScores.building = (b / total) * 100;
    }

    document.getElementById('lblSimStealth').textContent = simScores.stealth.toFixed(0) + '%';
    document.getElementById('lblSimAggression').textContent = simScores.aggression.toFixed(0) + '%';
    document.getElementById('lblSimLooting').textContent = simScores.looting.toFixed(0) + '%';
    document.getElementById('lblSimBuilding').textContent = simScores.building.toFixed(0) + '%';

    // Highlight dominant card
    const cSwarm = document.getElementById('cardSwarm');
    const cAmbusher = document.getElementById('cardAmbusher');
    const cHunter = document.getElementById('cardHunter');

    cSwarm.classList.remove('active');
    cAmbusher.classList.remove('active');
    cHunter.classList.remove('active');

    if (simScores.aggression >= 40) {
      cSwarm.classList.add('active');
    } else if (simScores.stealth >= 40) {
      cAmbusher.classList.add('active');
    } else {
      cHunter.classList.add('active');
    }

    drawRadar();
  }

  ['sliderStealth', 'sliderAggression', 'sliderLooting', 'sliderBuilding'].forEach(id => {
    document.getElementById(id).addEventListener('input', handleSimSliders);
  });

  drawRadar();

  // ==========================================================================
  // TAB 4: BASE HEAT RADAR
  // ==========================================================================
  const heatCanvas = document.getElementById('heatRadarCanvas');
  const heatCtx = heatCanvas.getContext('2d');

  let baseHeatSources = [
    { name: 'Diesel Generator', heat: 35, active: true },
    { name: 'Emergency Radio Array', heat: 15, active: true },
    { name: 'Perimeter Floodlights', heat: 20, active: true },
    { name: 'Machining Workbench', heat: 10, active: false }
  ];

  let heatZombies = [
    { x: 180, y: 140, drawn: false },
    { x: 480, y: 220, drawn: false },
    { x: 380, y: 440, drawn: false },
    { x: 550, y: 380, drawn: false },
    { x: 120, y: 480, drawn: false }
  ];

  function renderHeatSourcesUI() {
    const list = document.getElementById('heatSourceList');
    if (!list) return;

    list.innerHTML = '';
    baseHeatSources.forEach((src, idx) => {
      const item = document.createElement('div');
      item.className = 'heat-source-item';
      item.innerHTML = `
        <div>
          <b style="color:#fff; font-size:13px;">${src.name}</b>
          <div style="font-size:11px; color:var(--text-muted);">Heat Output: +${src.heat} Heat</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${src.active ? 'checked' : ''} data-index="${idx}">
          <span class="slider"></span>
        </label>
      `;

      item.querySelector('input').addEventListener('change', (e) => {
        baseHeatSources[idx].active = e.target.checked;
        drawHeatRadar();
      });

      list.appendChild(item);
    });
  }

  function drawHeatRadar() {
    heatCtx.fillStyle = '#04070a';
    heatCtx.fillRect(0, 0, heatCanvas.width, heatCanvas.height);

    const cx = heatCanvas.width / 2;
    const cy = heatCanvas.height / 2;

    // Calculate total heat & radius
    let totalHeat = 0;
    baseHeatSources.forEach(s => { if (s.active) totalHeat += s.heat; });

    const radius = Math.max(30, totalHeat * 2.2);

    document.getElementById('radarTotalHeatVal').textContent = totalHeat.toFixed(1);
    document.getElementById('radarRadiusVal').textContent = (totalHeat * 2.0).toFixed(1) + ' meters';

    // Draw Radar rings
    heatCtx.strokeStyle = 'rgba(0, 245, 212, 0.1)';
    for (let r = 50; r <= 280; r += 50) {
      heatCtx.beginPath(); heatCtx.arc(cx, cy, r, 0, Math.PI * 2); heatCtx.stroke();
    }

    // Radar sweeping beam
    const beamAngle = (performance.now() * 0.0015) % (Math.PI * 2);
    heatCtx.strokeStyle = 'rgba(0, 245, 212, 0.35)';
    heatCtx.lineWidth = 1.5;
    heatCtx.beginPath();
    heatCtx.moveTo(cx, cy);
    heatCtx.lineTo(cx + Math.cos(beamAngle) * 280, cy + Math.sin(beamAngle) * 280);
    heatCtx.stroke();

    // Draw Heat Attraction Sphere
    heatCtx.fillStyle = 'rgba(255, 100, 0, 0.12)';
    heatCtx.strokeStyle = 'rgba(255, 100, 0, 0.7)';
    heatCtx.lineWidth = 2;
    heatCtx.beginPath();
    heatCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    heatCtx.fill();
    heatCtx.stroke();

    // Center Safehouse
    heatCtx.fillStyle = '#ff9e00';
    heatCtx.fillRect(cx - 10, cy - 10, 20, 20);
    heatCtx.fillStyle = '#fff';
    heatCtx.font = '10px Rajdhani';
    heatCtx.fillText("BASE CORE", cx - 24, cy - 15);

    // Draw Zombies on radar
    let drawnCount = 0;
    heatZombies.forEach(z => {
      const d = Math.hypot(z.x - cx, z.y - cy);
      if (d < radius) {
        z.drawn = true;
        drawnCount++;
        // Move towards center
        const dx = cx - z.x;
        const dy = cy - z.y;
        z.x += (dx / d) * 0.4;
        z.y += (dy / d) * 0.4;
      }

      heatCtx.fillStyle = z.drawn ? '#e63946' : '#64748b';
      heatCtx.beginPath();
      heatCtx.arc(z.x, z.y, z.drawn ? 5 : 3.5, 0, Math.PI * 2);
      heatCtx.fill();

      if (z.drawn) {
        heatCtx.strokeStyle = 'rgba(230, 57, 70, 0.4)';
        heatCtx.beginPath(); heatCtx.moveTo(z.x, z.y); heatCtx.lineTo(cx, cy); heatCtx.stroke();
      }
    });

    document.getElementById('radarZombiesDrawn').textContent = drawnCount;
  }

  renderHeatSourcesUI();
  setInterval(() => {
    if (document.getElementById('heatTab').classList.contains('active')) {
      drawHeatRadar();
    }
  }, 50);

  document.getElementById('btnPulseHeat').addEventListener('click', () => {
    baseHeatSources[0].heat += 40;
    renderHeatSourcesUI();
    drawHeatRadar();
    window.showToast("Generator Overcharged! Heat spiked to Safehouse.", "#ff0055");
  });

  // ==========================================================================
  // TAB 5: ORGANIC INFECTION SYSTEM
  // ==========================================================================
  const sliderInf = document.getElementById('sliderInfectionLevel');
  const veinCanvas = document.getElementById('bioVeinCanvas');
  const veinCtx = veinCanvas.getContext('2d');

  function updateInfectionVisuals(pct) {
    const norm = pct / 100;

    // Update readouts
    document.getElementById('infectionValText').textContent = pct.toFixed(1) + '%';
    document.getElementById('lblAberration').textContent = (norm * 100).toFixed(0) + '%';
    document.getElementById('lblVeins').textContent = (norm * 100).toFixed(0) + '%';

    const hz = Math.round(22000 * Math.pow(1 - norm, 1.8) + 500);
    document.getElementById('lblAudioLPF').textContent = `${hz} Hz (${norm > 0.3 ? 'Muffled' : 'Crisp'})`;

    const whispersActive = pct >= 50;
    const lblW = document.getElementById('lblWhispers');
    lblW.textContent = whispersActive ? 'ACTIVE (HALLUCINATING)' : 'INACTIVE (<50%)';
    lblW.style.color = whispersActive ? '#e63946' : '#64748b';

    // Status dots
    document.getElementById('dotAberration').className = norm > 0.1 ? 'check-dot active' : 'check-dot';
    document.getElementById('dotVeins').className = norm > 0.15 ? 'check-dot active' : 'check-dot';
    document.getElementById('dotAudioLPF').className = norm > 0.25 ? 'check-dot active' : 'check-dot';
    document.getElementById('dotWhispers').className = whispersActive ? 'check-dot active' : 'check-dot';

    // Fullscreen Vignette & Post-process overlay
    const overlay = document.getElementById('infectionOverlay');
    overlay.style.opacity = (norm * 0.85).toString();

    // Viewport image zoom simulating feverish camera FOV warping
    const bgImg = document.getElementById('screenBgImg');
    const fov = (65 - norm * 12).toFixed(1);
    bgImg.style.transform = `scale(${1 + norm * 0.15})`;
    document.getElementById('fovIndicator').textContent = `FOV: ${fov}°`;

    // Audio Mixer LPF sweep
    if (window.horrorAudio) {
      window.horrorAudio.setInfectionCutoff(pct);
      if (whispersActive && Math.random() < 0.2) {
        window.horrorAudio.playWhisper();
      }
    }

    // Procedural Bio-Veins Canvas rendering
    drawBioVeins(norm);
  }

  function drawBioVeins(norm) {
    veinCtx.clearRect(0, 0, veinCanvas.width, veinCanvas.height);
    if (norm <= 0.05) return;

    const w = veinCanvas.width;
    const h = veinCanvas.height;

    veinCtx.strokeStyle = 'rgba(180, 10, 20, ' + (norm * 0.8) + ')';
    veinCtx.lineWidth = 2.5;

    // Draw creeping tendrils from corners
    const corners = [
      { x: 0, y: 0, dx: 1, dy: 1 },
      { x: w, y: 0, dx: -1, dy: 1 },
      { x: 0, y: h, dx: 1, dy: -1 },
      { x: w, y: h, dx: -1, dy: -1 }
    ];

    corners.forEach(c => {
      const length = norm * 160;
      veinCtx.beginPath();
      veinCtx.moveTo(c.x, c.y);

      let curX = c.x;
      let curY = c.y;

      for (let i = 0; i < 6; i++) {
        curX += (c.dx * (length / 6)) + (Math.sin(i * 1.5) * 12);
        curY += (c.dy * (length / 6)) + (Math.cos(i * 1.5) * 12);
        veinCtx.lineTo(curX, curY);
      }
      veinCtx.stroke();
    });
  }

  sliderInf.addEventListener('input', (e) => {
    updateInfectionVisuals(parseFloat(e.target.value));
  });

  document.getElementById('btnInfect25').addEventListener('click', () => {
    sliderInf.value = Math.min(100, parseFloat(sliderInf.value) + 25);
    updateInfectionVisuals(parseFloat(sliderInf.value));
  });

  document.getElementById('btnCure25').addEventListener('click', () => {
    sliderInf.value = Math.max(0, parseFloat(sliderInf.value) - 25);
    updateInfectionVisuals(parseFloat(sliderInf.value));
  });

  document.getElementById('btnResetInfection').addEventListener('click', () => {
    sliderInf.value = 0;
    updateInfectionVisuals(0);
  });
});
