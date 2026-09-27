# The Survival String 🧟🕸️

A AAA-grade survival horror architecture built for **Unity 6**, featuring dynamic player behavior mirroring, a directed acyclic graph (DAG) state machine, diegetic sensory infection degradation, and a dynamic base heat attraction system.

---

## 🎮 Key Systems

### 1. The Survival String (Graph-Based State Machine)
- **DAG-based state machine** replacing binary boolean flags with narrative & world-state nodes.
- ScriptableObject-driven: [`DecisionNode.cs`](Assets/Scripts/SurvivalString/DecisionNode.cs).
- Zero `Update()` polling: strictly event-driven execution via [`SurvivalStringManager.cs`](Assets/Scripts/SurvivalString/SurvivalStringManager.cs).
- Dynamic 3D model swapping & NavMesh obstacle carving via [`WorldStateSwapper.cs`](Assets/Scripts/SurvivalString/WorldStateSwapper.cs).
- Live Unity Inspector evaluation & testing with [`SurvivalStringManagerEditor.cs`](Assets/Scripts/SurvivalString/Editor/SurvivalStringManagerEditor.cs).

### 2. Player Behavior Mirror (The AI Director)
- **PlayerTelemetry.cs**: 5-second sampling window tracking Stealth, Aggression, Looting, and BaseBuilding.
- Mathematical 4D vector normalization (0% to 100%).
- `OnPlaystyleShifted` event triggers whenever a playstyle dominates by **> 40%**.
- **ZombieDirector.cs** counters player habits:
  - **Aggressive** ➔ **Sound-Adapted Swarmer** (blind, bat-like ears, drawn to gunfire).
  - **Stealthy** ➔ **Ceiling-Crawling Ambusher** (elongated bone-claws, drops from ceilings).
  - **Looting / Balanced** ➔ **Relentless Hunter** (patrols supply routes).
- NavMesh-placed spawning via [`ZombieSpawnManager.cs`](Assets/Scripts/AIDirector/ZombieSpawnManager.cs).

### 3. Base Heat Attraction System
- **HeatSource.cs**: Attach to items (Generators, Radios, Workbenches, Floodlights).
- **BaseHeatManager.cs**: Sums active heat and dynamically scales an invisible trigger `SphereCollider` (`Radius = TotalHeat * 2`).
- `OnTriggerEnter`: Any entity tagged `"Zombie"` entering the sphere has its `NavMeshAgent` destination redirected to the base entrance / safehouse door.

### 4. Organic Infection System (Shader & Audio Driven)
- Diegetic float (`0.0` to `100.0`) with zero UI meters or health bars.
- Fullscreen post-process shader ([`OrganicInfectionScreenEffect.shader`](Assets/Shaders/OrganicInfectionScreenEffect.shader)) rendering procedural bio-vein tendrils creeping inward, chromatic aberration, and edge vignette.
- Dynamic camera FOV warping simulating fever breathing.
- Audio Mixer Low-Pass Filter sweeping environmental cutoff from 22,000 Hz down to 600 Hz.
- Spatial 3D binaural hallucination whispers triggered when `Infection > 50`.

### 5. Runtime Diagnostic Harness
- Attach [`GameplayTestHarness.cs`](Assets/Scripts/Demo/GameplayTestHarness.cs) and press **F1** in Play Mode to interactively simulate all 4 systems in real-time.

---

## 📂 Project Structure

```
Assets/
├── Art/
│   └── Concepts/                         # High-res 16:9 concept art & UI renders
├── Documentation/
│   └── ARCHITECTURE_GUIDE.md             # Detailed architecture and scene setup guide
├── Scripts/
│   ├── AIDirector/                       # Telemetry and dynamic zombie encounter director
│   ├── BaseHeat/                         # Heat sources and dynamic attraction sphere
│   ├── Common/                           # NavMesh controller agents
│   ├── Demo/                             # Interactive F1 diagnostic test harness
│   ├── Infection/                        # Diegetic infection manager and camera blitter
│   └── SurvivalString/                   # Graph-based narrative state machine
└── Shaders/
    └── OrganicInfectionScreenEffect.shader # Screen-space post-processing shader
```

---

## 🚀 Getting Started

1. Open this repository folder in **Unity 6** (or Unity 2022.3+ LTS).
2. Load any scene, attach `GameplayTestHarness` to an empty GameObject, and enter Play Mode.
3. Press **F1** to open the interactive diagnostic window.
4. Refer to [`Assets/Documentation/ARCHITECTURE_GUIDE.md`](Assets/Documentation/ARCHITECTURE_GUIDE.md) for full scene wiring instructions.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
