# The Survival String: Deep-Dive Feature Architecture & Implementation

> **Platform**: Unity 6 (URP / Built-in)  
> **Architecture Paradigm**: ScriptableObject Directed Acyclic Graph (DAG), Event-Driven AI Director, Dynamic Spatial NavMesh Attraction, and Diegetic Audio-Visual Post-Processing.

---

## 🎨 Visual Assets & Concept Art

Here are the visual concept art pieces and UI designs generated for **The Survival String**:

![The Survival String Digital String Board UI](C:\Users\Samiksha Patil\.gemini\antigravity-ide\brain\a5381eba-6e20-486d-b375-4ada351bc557\survival_string_menu_1790488388736.jpg)

*UI Concept: The Survival String digital narrative board showing interconnected survivor and mission nodes.*

![Day 7 High-Infection City Street Environment](C:\Users\Samiksha Patil\.gemini\antigravity-ide\brain\a5381eba-6e20-486d-b375-4ada351bc557\day_seven_chaos_1790488413008.jpg)

*Environment Concept: Day 7 Chaos showing organic red bio-veins mutating concrete buildings around quarantine barricades.*

![Behavior Mirror Gameplay Mockup with Blind Sound-Adapted Swarmer](C:\Users\Samiksha Patil\.gemini\antigravity-ide\brain\a5381eba-6e20-486d-b375-4ada351bc557\behavior_mirror_mockup_1790488440893.jpg)

*Gameplay Mockup: First-person survival stealth encounter facing a blind, sound-adapted Swarmer.*

---

## 🏛️ System Architecture Diagrams

### 1. The Survival String (Graph-Based State Machine)

```mermaid
graph TD
    A["Prologue: Outpost Breach"] --> B["Save Engineer"]
    A --> C["Abandon Outpost"]
    B --> D["Repair High-Voltage Generator"]
    B --> E["Unlock Defense Turret Blueprints"]
    C --> F["Scavenge Abandoned Depot"]
    D -.->|Triggers World State| G["WorldStateSwapper: Swaps Broken Prefab for Running Prefab"]
    D -.->|NavMesh Update| H["NavMesh Obstacle Carved / Gate Opened"]
    D --> I["Base Heat Expands: Draws Surrounding Horde"]
    
    style B fill:#1b4332,stroke:#40916c,stroke-width:2px,color:#fff
    style D fill:#2d6a4f,stroke:#52b788,stroke-width:2px,color:#fff
    style G fill:#0077b6,stroke:#00b4d8,stroke-width:2px,color:#fff
    style I fill:#b7094c,stroke:#ff0054,stroke-width:2px,color:#fff
```

### 2. Player Behavior Mirror (AI Director Feedback Loop)

```mermaid
graph LR
    subgraph Ingestion["Input Sampling (Every 5s)"]
        S["Time In Crouch"]
        A["Shots Fired"]
        L["Containers Looted"]
        B["Base Fortifications"]
    end

    subgraph Telemetry["PlayerTelemetry.cs"]
        S & A & L & B --> N["Mathematical Normalization (0% to 100%)"]
        N --> D{"Dominance Check (>40%)"}
    end

    subgraph Director["ZombieDirector.cs"]
        D -->|Stealth Dominates| AMB["Enemy: Ambusher (Ceiling Crawler)"]
        D -->|Aggression Dominates| SWM["Enemy: Swarm (Sound-Adapted)"]
        D -->|Looting Dominates| HNT["Enemy: Hunter (Relentless Tracker)"]
    end

    subgraph Spawner["ZombieSpawnManager.cs"]
        AMB & SWM & HNT --> W["Rebalance Spawn Weight Distribution"]
        W --> SP["NavMesh Spawner Instantiation"]
    end

    style SWM fill:#7209b7,stroke:#b5179e,stroke-width:2px,color:#fff
    style AMB fill:#3a0ca3,stroke:#4361ee,stroke-width:2px,color:#fff
    style HNT fill:#f72585,stroke:#b5179e,stroke-width:2px,color:#fff
```

### 3. Base Heat Attraction System

```mermaid
graph TD
    G["Modified Diesel Generator (+35 Heat)"] --> M["BaseHeatManager.cs"]
    R["Emergency Radio (+15 Heat)"] --> M
    L["Perimeter Floodlights (+20 Heat)"] --> M
    W["Machining Workbench (+10 Heat)"] --> M

    M --> CALC["Total Heat = 80.0"]
    CALC --> RAD["Trigger Radius = Heat * 2.0 = 160 meters"]
    RAD --> SPH["Dynamic Invisible SphereCollider"]

    Z["Wandering Zombie"] -->|Enters Sphere| TRG["OnTriggerEnter()"]
    TRG --> NAV["Fetch NavMeshAgent"]
    NAV --> TARGET["SetDestination(Safehouse Door)"]

    style CALC fill:#d90429,stroke:#ef233c,stroke-width:2px,color:#fff
    style RAD fill:#e85d04,stroke:#f48c06,stroke-width:2px,color:#fff
    style TARGET fill:#6a040f,stroke:#9d0208,stroke-width:2px,color:#fff
```

---

## 💻 Implemented Codebase & File References

All C# scripts, shaders, and inspectors have been generated and structured into the workspace:

| System | Component / Asset | Description |
| :--- | :--- | :--- |
| **Survival String** | [DecisionNode.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/SurvivalString/DecisionNode.cs) | ScriptableObject defining nodes, prerequisites, edges, and UnityEvent world alteration hooks. |
| **Survival String** | [SurvivalStringManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/SurvivalString/SurvivalStringManager.cs) | High-performance Singleton manager with `HashSet<string>` O(1) lookups, zero `Update()` calls, JSON export/import. |
| **Survival String** | [WorldStateSwapper.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/SurvivalString/WorldStateSwapper.cs) | Inspector utility triggered by node activation to swap 3D prefabs and carve/open NavMesh routes. |
| **Survival String** | [SurvivalStringManagerEditor.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/SurvivalString/Editor/SurvivalStringManagerEditor.cs) | Custom Unity Editor Inspector allowing one-click node testing and DAG pathway inspection. |
| **AI Director** | [PlayerTelemetry.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/AIDirector/PlayerTelemetry.cs) | 5-second sampling coroutine tracking Stealth, Aggression, Looting, and BaseBuilding with >40% dominance event. |
| **AI Director** | [ZombieDirector.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/AIDirector/ZombieDirector.cs) | Listens to telemetry shifts and dynamically switches `CurrentEnemyType` (`Swarm`, `Ambusher`, `Hunter`). |
| **AI Director** | [ZombieSpawnManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/AIDirector/ZombieSpawnManager.cs) | Rebalances archetype spawn weight distributions and places enemies onto valid NavMesh coordinates. |
| **Base Heat** | [HeatSource.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/BaseHeat/HeatSource.cs) | Appliance component with heat output and toggle state that registers with `BaseHeatManager`. |
| **Base Heat** | [BaseHeatManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/BaseHeat/BaseHeatManager.cs) | Singleton scaling an invisible trigger `SphereCollider` (`Radius = Heat * 2`) and redirecting zombies to base core. |
| **Infection** | [InfectionManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/Infection/InfectionManager.cs) | Diegetic float (0.0 to 100.0) driving shader chromatic aberration, audio mixer LPF cutoff, and 3D ear whispers. |
| **Infection** | [OrganicInfectionScreenEffect.shader](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Shaders/OrganicInfectionScreenEffect.shader) | Fullscreen post-processing shader with procedural bio-vein creeping tendrils, chromatic dispersion, and vignette. |
| **Infection** | [InfectionPostProcessEffect.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/Infection/InfectionPostProcessEffect.cs) | Screen-space blit component for camera rendering in Built-in RP and URP. |
| **Common** | [ZombieNavMeshController.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/Common/ZombieNavMeshController.cs) | NavMesh agent controller responding to base heat alert destinations and wander states. |
| **Diagnostic** | [GameplayTestHarness.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/Demo/GameplayTestHarness.cs) | Interactive runtime GUI (press `F1`) to simulate all 4 systems live in any Unity scene. |

---

## 🛠️ Step-by-Step Unity 6 Integration Guide

### 1. The Survival String Setup
1. In Unity, select `Assets > Create > Survival String > Decision Node` to create your initial decision nodes:
   - `RESCUE_ENGINEER`
   - `REPAIR_GENERATOR` (Add `RESCUE_ENGINEER` to `Prerequisite Node IDs`)
   - `SABOTAGE_GENERATOR` (Add `REPAIR_GENERATOR` to `Mutually Exclusive Node IDs`)
2. In your scene, add a GameObject named `[Managers]` and attach [SurvivalStringManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/SurvivalString/SurvivalStringManager.cs).
3. Drag your `DecisionNode` assets into the `Node Catalog` list.
4. On scene objects (such as a broken generator), attach [WorldStateSwapper.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/SurvivalString/WorldStateSwapper.cs):
   - Set `Objects To Disable` ➔ `Broken_Generator`
   - Set `Objects To Enable` ➔ `Running_Generator`
   - Connect this method to the `OnNodeActivated` UnityEvent on the `DecisionNode`.

### 2. Player Behavior Mirror & Telemetry Setup
1. Attach [PlayerTelemetry.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/AIDirector/PlayerTelemetry.cs) and [ZombieDirector.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/AIDirector/ZombieDirector.cs) to the manager object.
2. In your player movement / weapon script:
   - Call `PlayerTelemetry.Instance.ReportShotFired()` when firing.
   - Call `PlayerTelemetry.Instance.SetCrouchState(true/false)` when crouching.
   - Call `PlayerTelemetry.Instance.ReportLootOpened()` when opening supply crates.
3. Attach [ZombieSpawnManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/AIDirector/ZombieSpawnManager.cs) to a spawner GameObject and assign your 3 enemy prefabs.

### 3. Base Heat Setup
1. Place a GameObject at the center of the Safehouse (e.g. `Safehouse_Core`) and attach [BaseHeatManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/BaseHeat/BaseHeatManager.cs).
2. Assign `Base Target Point` to the front barricade or door transform.
3. On your Generator, Radio, and Floodlights, attach [HeatSource.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/BaseHeat/HeatSource.cs) with appropriate heat values (e.g. Generator: 40 Heat, Radio: 15 Heat).
4. Watch the orange wireframe trigger sphere scale in the Scene view as appliances turn ON or OFF!

### 4. Organic Infection Setup
1. Attach [InfectionManager.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/Infection/InfectionManager.cs) and [InfectionPostProcessEffect.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/Infection/InfectionPostProcessEffect.cs) to the Main Camera.
2. In Unity's Audio Mixer window, add a Lowpass filter to the Master/Environment audio group, right-click the Cutoff Frequency and select **Expose Parameter to Script**, naming it `EnvironmentLPFCutoff`.
3. Assign the Audio Mixer reference and whisper audio clips in the Inspector.

### 5. Interactive Debugging
- Press **F1** at any time during Play Mode to toggle [GameplayTestHarness.cs](file:///c:/Users/Samiksha%20Patil/OneDrive/Desktop/promptgame/Assets/Scripts/Demo/GameplayTestHarness.cs). You can simulate decisions, slide telemetry scores, toggle appliances, and observe the infection screen distortion.

---

## 🤖 3D-Model Generation Prompts & Workflow

Use the exact prompts below in Text-to-3D AI generators (**Meshy**, **Tripo3D**, or **Luma AI Genie**) to export FBX/OBJ models:

| Asset | Target Model | Generator Prompt | Export Settings |
| :--- | :--- | :--- | :--- |
| **Zombie 1** | Sound-Adapted Swarmer | `A terrifying, mutated zombie adapted to sound. It has no eyes; the top half of its face is covered in hardened, calcified bone. It has massively overgrown, bat-like ears and an open jaw with jagged teeth. Pale, gray, decaying skin, wearing tattered remnants of a hospital gown. Stylized realism, survival horror aesthetic, t-pose, symmetrical, optimized for gaming.` | FBX, T-Pose, Quad Remesh ~25k polys, PBR textures (Albedo, Normal, Roughness) |
| **Zombie 2** | The Ambusher | `A highly mutated, skinny zombie designed for climbing and stealth. Elongated arms with massive, sharp bone-claws on the fingers. Muscular but emaciated body, dark charcoal-colored skin to blend in with shadows. Glowing pale eyes. Wearing ruined tactical pants. Creepy, silent predator aesthetic, t-pose, survival horror 3D game asset.` | FBX, T-Pose, humanoid rig compatible, Emissive eye map |
| **Player** | Survivor Protagonist | `A rugged, exhausted survivor in a post-apocalyptic city. Wearing a taped-up leather jacket, cargo pants, and combat boots. Has a tactical backpack strapped with a flashlight and a rolled-up sleeping bag. Holding a custom modified baseball bat wrapped in barbed wire. Gritty realism, high detail, t-pose, survival horror protagonist.` | FBX, Humanoid bone hierarchy, standard Mixamo compatible |
| **Prop** | Modified Diesel Generator | `A rusted, heavy-duty industrial power generator heavily modified by a survivor. It has car batteries duct-taped to the sides, exposed copper wiring, and a makeshift exhaust pipe. Covered in dirt and oil stains. Post-apocalyptic survival engineering, highly detailed 3D prop, PBR textures.` | Static FBX, Box/Convex Collider, emissive indicator lights |
