# The Survival String — Complete System Architecture & Setup Guide

This document details the complete Unity 6 C# architecture implemented for **The Survival String**, covering the 4 core gameplay pillars:
1. **The Survival String (DAG State Machine)**
2. **Player Behavior Mirror (AI Director & Telemetry)**
3. **Organic Infection System (Shader & Audio Driven)**
4. **Base "Heat" System (Dynamic NavMesh Trigger Attraction)**

---

## 1. System Overview & Class Structure

### 📁 Directory Layout
```
Assets/
├── Scripts/
│   ├── SurvivalString/
│   │   ├── DecisionNode.cs             # ScriptableObject defining DAG nodes, edges & world UnityEvents
│   │   ├── SurvivalStringManager.cs    # Singleton DAG manager, event-driven, O(1) lookups, zero Update()
│   │   ├── WorldStateSwapper.cs        # Utility for model swapping & NavMesh obstacle carving
│   │   └── Editor/
│   │       └── SurvivalStringManagerEditor.cs # Inspector diagnostic tool for testing nodes
│   ├── AIDirector/
│   │   ├── PlayerTelemetry.cs          # 5-sec coroutine sampling, normalizes 4 playstyles, fires >40% dominance
│   │   ├── ZombieDirector.cs           # Listens to telemetry, sets CurrentEnemyType (Swarm, Ambusher, Hunter)
│   │   └── ZombieSpawnManager.cs       # Spawns weighted prefabs on NavMesh based on active enemy type
│   ├── BaseHeat/
│   │   ├── HeatSource.cs               # Component for Generators, Radios, Floodlights (toggles & heat output)
│   │   └── BaseHeatManager.cs          # Scales trigger SphereCollider (Radius = TotalHeat * 2), pulls NavMesh zombies
│   ├── Infection/
│   │   ├── InfectionManager.cs         # Tracks 0-100 float, drives shader aberration, audio LPF & whispers
│   │   └── InfectionPostProcessEffect.cs # Fullscreen blit runner for post-process shader
│   ├── Common/
│   │   └── ZombieNavMeshController.cs  # Standard NavMeshAgent controller responding to base heat aggro
│   └── Demo/
│       └── GameplayTestHarness.cs      # Interactive F1 runtime GUI to test all 4 systems in real-time
├── Shaders/
│   └── OrganicInfectionScreenEffect.shader # Fullscreen shader with chromatic aberration, vignette, and bio-veins
└── Art/
    └── Concepts/                       # Generated 16:9 concept art & UI mockups
```

---

## 2. Deep-Dive Feature Breakdown

### 🕸️ 1. The Survival String (Graph-Based State Machine)
- **Problem Solved**: Replaces primitive boolean flags (`isEngineerSaved = true`) with a Directed Acyclic Graph (DAG).
- **Core Files**: [`DecisionNode.cs`](../Scripts/SurvivalString/DecisionNode.cs), [`SurvivalStringManager.cs`](../Scripts/SurvivalString/SurvivalStringManager.cs), [`WorldStateSwapper.cs`](../Scripts/SurvivalString/WorldStateSwapper.cs).
- **Mechanism**:
  - Each decision is a `DecisionNode` ScriptableObject containing `childNodeIDs`, `prerequisiteNodeIDs`, and `mutuallyExclusiveNodeIDs`.
  - Committing a decision (`MakeDecision(string nodeID)`) adds it to a `HashSet<string>` and executes `onNodeActivated` UnityEvents.
  - Automatically evaluates which future narrative pathways unlock.
  - Zero `Update()` polling: strictly event-driven.
  - Saves/restores entire playthrough graph state via JSON.

### 🧠 2. Player Behavior Mirror (AI Director)
- **Problem Solved**: Automatically counters player playstyles without artificial difficulty scaling.
- **Core Files**: [`PlayerTelemetry.cs`](../Scripts/AIDirector/PlayerTelemetry.cs), [`ZombieDirector.cs`](../Scripts/AIDirector/ZombieDirector.cs), [`ZombieSpawnManager.cs`](../Scripts/AIDirector/ZombieSpawnManager.cs).
- **Tracked Metrics**:
  - `StealthScore`: crouch duration, silent kills.
  - `AggressionScore`: shots fired, sprint distance.
  - `LootingScore`: containers opened, scrap scavenged.
  - `BaseBuildingScore`: repairs, fortifying, workbench usage.
- **Adaptive Spawning**:
  - When a score dominates by **> 40%**, `OnPlaystyleShifted` fires.
  - **Aggressive Player** ➔ Spawns **Sound-Adapted Swarmers** (blind, massive ears, hypersensitive to loud noise).
  - **Stealthy Player** ➔ Spawns **Ambushers** (dark-skinned, elongated bone-claws, ceiling crawlers).
  - **Scavenging / Balanced** ➔ Spawns **Hunters** (relentless path trackers).

### 🩸 3. Organic Infection System
- **Problem Solved**: UI-free, diegetic horror where infection is perceived through visual and psychoacoustic degradation.
- **Core Files**: [`InfectionManager.cs`](../Scripts/Infection/InfectionManager.cs), [`OrganicInfectionScreenEffect.shader`](../Shaders/OrganicInfectionScreenEffect.shader).
- **Sensory Manifestations**:
  - **0.0 - 100.0 Float**: Invisible to player HUD.
  - **Visuals**: Fullscreen shader scales chromatic aberration, darkens edges, and grows animated red bio-vein tendrils creeping into the screen.
  - **Camera FOV**: Subtly breathes and warps with fever pulses.
  - **Audio Mixer LPF**: Muffles environment sounds by sweeping Low-Pass Filter cutoff from 22,000 Hz down to 600 Hz.
  - **Hallucinatory Whispers**: When `Infection > 50`, randomly spawns spatial 3D audio whispers near the player's ears.

### 🔥 4. Base Heat System
- **Problem Solved**: Balances base convenience vs. survival risk. Running appliances attracts the horde.
- **Core Files**: [`HeatSource.cs`](../Scripts/BaseHeat/HeatSource.cs), [`BaseHeatManager.cs`](../Scripts/BaseHeat/BaseHeatManager.cs).
- **Dynamic Pull Mechanics**:
  - Appliances (Generators, Radios, Workbenches) have a `HeatValue` and active toggle.
  - `BaseHeatManager` calculates `TotalHeat = Sum(ActiveHeatSources)`.
  - Scales an invisible trigger `SphereCollider`: `Radius = TotalHeat * 2.0f`.
  - When any GameObject with tag `"Zombie"` enters this sphere, its `NavMeshAgent` destination is instantly set to the safehouse door/center.

---

## 3. Unity Scene Setup & Verification

1. **Survival String Setup**:
   - Create an empty GameObject named `SurvivalStringManager` and add the [`SurvivalStringManager`](../Scripts/SurvivalString/SurvivalStringManager.cs) component.
   - Right-click in Project view: `Create > Survival String > Decision Node` to create your story nodes (e.g. `SAVE_ENGINEER`, `POWER_GRID`).
   - Populate `Node Catalog` on the manager.

2. **AI Director & Telemetry Setup**:
   - Add [`PlayerTelemetry`](../Scripts/AIDirector/PlayerTelemetry.cs) and [`ZombieDirector`](../Scripts/AIDirector/ZombieDirector.cs) to a manager GameObject.
   - Assign the Player GameObject or ensure it has the `"Player"` tag.
   - Add [`ZombieSpawnManager`](../Scripts/AIDirector/ZombieSpawnManager.cs) with your enemy prefabs and spawn points.

3. **Base Heat Setup**:
   - Place a GameObject at your Safehouse with [`BaseHeatManager`](../Scripts/BaseHeat/BaseHeatManager.cs).
   - Set `Base Target Point` to the entrance door.
   - Add [`HeatSource`](../Scripts/BaseHeat/HeatSource.cs) to generators, workbenches, and radios.

4. **Infection Setup**:
   - Add [`InfectionManager`](../Scripts/Infection/InfectionManager.cs) to a manager or player camera.
   - Add [`InfectionPostProcessEffect`](../Scripts/Infection/InfectionPostProcessEffect.cs) to the Main Camera.
   - Assign an Audio Mixer with an exposed Lowpass parameter named `EnvironmentLPFCutoff`.

5. **Diagnostic Harness**:
   - Add [`GameplayTestHarness`](../Scripts/Demo/GameplayTestHarness.cs) to any GameObject.
   - Press **F1** in Play Mode to open the comprehensive diagnostic GUI!
