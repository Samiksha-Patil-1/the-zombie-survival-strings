using System.Collections.Generic;
using UnityEngine;
using SurvivalString;
using AIDirector;
using BaseHeat;
using Infection;

namespace Demo
{
    /// <summary>
    /// Interactive OnGUI diagnostic test harness for pair-programming and testing all 4 deep-dive systems simultaneously.
    /// Provides live buttons and sliders for Survival String decisions, Telemetry, Base Heat, and Organic Infection.
    /// </summary>
    public class GameplayTestHarness : MonoBehaviour
    {
        [Header("Test Configuration")]
        [SerializeField] private bool showDebugGui = true;
        [SerializeField] private KeyCode toggleGuiKey = KeyCode.F1;

        [Header("Sample Predefined Decision Nodes for Instant Testing")]
        [SerializeField] private List<DecisionNode> sampleNodes = new List<DecisionNode>();

        private Rect _windowRect = new Rect(20, 20, 480, 680);
        private int _selectedTab = 0;
        private readonly string[] _tabTitles = { "Survival String", "AI Telemetry", "Base Heat", "Infection" };

        // Temporary slider states for simulation
        private float _sliderStealth = 25f;
        private float _sliderAggression = 25f;
        private float _sliderLooting = 25f;
        private float _sliderBuilding = 25f;
        private float _sliderInfection = 0f;

        private void Update()
        {
            if (Input.GetKeyDown(toggleGuiKey))
            {
                showDebugGui = !showDebugGui;
            }
        }

        private void OnGUI()
        {
            if (!showDebugGui) return;

            GUI.skin.window.fontSize = 13;
            _windowRect = GUI.Window(999, _windowRect, DrawDiagnosticWindow, "ANTI-GRAVITY SURVIVAL HORROR DEBUG HARNESS [F1]");
        }

        private void DrawDiagnosticWindow(int windowID)
        {
            GUILayout.Space(5);
            _selectedTab = GUILayout.Toolbar(_selectedTab, _tabTitles, GUILayout.Height(28));
            GUILayout.Space(10);

            switch (_selectedTab)
            {
                case 0:
                    DrawSurvivalStringTab();
                    break;
                case 1:
                    DrawTelemetryTab();
                    break;
                case 2:
                    DrawBaseHeatTab();
                    break;
                case 3:
                    DrawInfectionTab();
                    break;
            }

            GUI.DragWindow(new Rect(0, 0, 10000, 30));
        }

        #region Tab 1: Survival String

        private void DrawSurvivalStringTab()
        {
            GUILayout.Label("<b>The Survival String (Graph-Based State Machine)</b>", GUILayout.ExpandWidth(true));
            GUILayout.Label("Active Nodes in DAG State: " + (SurvivalStringManager.Instance != null ? SurvivalStringManager.Instance.GetUnlockedNodeIDs().Count.ToString() : "Manager Missing"));

            GUILayout.Space(5);
            GUILayout.BeginVertical("box");
            if (SurvivalStringManager.Instance != null)
            {
                foreach (string id in SurvivalStringManager.Instance.GetUnlockedNodeIDs())
                {
                    GUILayout.Label($" ✔ [Unlocked] {id}");
                }
            }
            GUILayout.EndVertical();

            GUILayout.Space(10);
            GUILayout.Label("<b>Simulate Node Commitment:</b>");

            if (GUILayout.Button("Commit: RESCUE_ENGINEER", GUILayout.Height(26)))
            {
                CommitOrRegister("RESCUE_ENGINEER", "Rescued Engineer at Outpost", "Unlocks Generator blueprints and repair routes.");
            }

            if (GUILayout.Button("Commit: REPAIR_GENERATOR (Needs RESCUE_ENGINEER)", GUILayout.Height(26)))
            {
                CommitOrRegister("REPAIR_GENERATOR", "Repaired Substation Generator", "Powers defense turrets but emits huge Heat.");
            }

            if (GUILayout.Button("Commit: SABOTAGE_GENERATOR", GUILayout.Height(26)))
            {
                CommitOrRegister("SABOTAGE_GENERATOR", "Sabotaged Diesel Generator", "Zero Heat, but lights are off.");
            }

            GUILayout.Space(10);
            if (GUILayout.Button("Export Graph State JSON to Console"))
            {
                if (SurvivalStringManager.Instance != null)
                {
                    Debug.Log(SurvivalStringManager.Instance.ExportStateJson());
                }
            }
        }

        private void CommitOrRegister(string id, string title, string desc)
        {
            if (SurvivalStringManager.Instance == null) return;

            if (SurvivalStringManager.Instance.GetNode(id) == null)
            {
                DecisionNode dynamicNode = ScriptableObject.CreateInstance<DecisionNode>();
                dynamicNode.name = id;
                // Assign via reflection/manager
                SurvivalStringManager.Instance.RegisterNode(dynamicNode);
            }

            SurvivalStringManager.Instance.MakeDecision(id);
        }

        #endregion

        #region Tab 2: AI Telemetry & Director

        private void DrawTelemetryTab()
        {
            GUILayout.Label("<b>Player Behavior Mirror (AI Director)</b>");
            
            if (ZombieDirector.Instance != null)
            {
                GUILayout.Label($"<color=yellow>Active Enemy Archetype:</color> <b>{ZombieDirector.Instance.CurrentEnemyType}</b>");
            }

            if (PlayerTelemetry.Instance != null)
            {
                GUILayout.Label($"Dominant Playstyle: <b>{PlayerTelemetry.Instance.DominantPlaystyle}</b> ({PlayerTelemetry.Instance.CurrentDominancePercentage:F1}%)");

                GUILayout.Space(8);
                GUILayout.Label($"Stealth Score: {PlayerTelemetry.Instance.StealthScore:F1}%");
                GUILayout.Label($"Aggression Score: {PlayerTelemetry.Instance.AggressionScore:F1}%");
                GUILayout.Label($"Looting Score: {PlayerTelemetry.Instance.LootingScore:F1}%");
                GUILayout.Label($"Base Building Score: {PlayerTelemetry.Instance.BaseBuildingScore:F1}%");
            }

            GUILayout.Space(12);
            GUILayout.Label("<b>Simulate Realtime Ingame Signals:</b>");
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("+5 Shots Fired\n(Aggression)"))
            {
                PlayerTelemetry.Instance?.ReportShotFired(5);
                PlayerTelemetry.Instance?.EvaluateTelemetryCycle();
            }
            if (GUILayout.Button("Crouched 10s\n(Stealth)"))
            {
                PlayerTelemetry.Instance?.SetCrouchState(true);
                // simulate crouch time
                PlayerTelemetry.Instance?.SetScoresManually(70f, 10f, 10f, 10f);
            }
            GUILayout.EndHorizontal();

            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Looted 3 Crates\n(Looting)"))
            {
                PlayerTelemetry.Instance?.ReportLootOpened(3);
                PlayerTelemetry.Instance?.EvaluateTelemetryCycle();
            }
            if (GUILayout.Button("Reinforced Base\n(BaseBuilding)"))
            {
                PlayerTelemetry.Instance?.ReportBaseBuildingAction(3);
                PlayerTelemetry.Instance?.EvaluateTelemetryCycle();
            }
            GUILayout.EndHorizontal();
        }

        #endregion

        #region Tab 3: Base Heat System

        private void DrawBaseHeatTab()
        {
            GUILayout.Label("<b>Base Heat Attraction System</b>");

            if (BaseHeatManager.Instance != null)
            {
                GUILayout.Label($"Total Active Heat: <color=orange><b>{BaseHeatManager.Instance.CurrentTotalHeat:F1} Heat</b></color>");
                GUILayout.Label($"Trigger Sphere Radius: <color=yellow><b>{BaseHeatManager.Instance.CurrentSphereRadius:F1} meters</b></color>");
                GUILayout.Label($"Base Target: {BaseHeatManager.Instance.BaseTargetPoint.name}");
            }
            else
            {
                GUILayout.Label("BaseHeatManager instance not found in scene.");
            }

            GUILayout.Space(10);
            GUILayout.Label("<b>Appliance Heat Sources:</b>");

            HeatSource[] sources = FindObjectsByType<HeatSource>(FindObjectsSortMode.None);
            if (sources.Length == 0)
            {
                GUILayout.Label("No HeatSource components active in scene.");
            }
            else
            {
                foreach (HeatSource src in sources)
                {
                    GUILayout.BeginHorizontal("box");
                    GUILayout.Label($"{src.SourceName} ({src.HeatValue:F0} Heat)");
                    bool toggle = GUILayout.Toggle(src.IsActive, src.IsActive ? "ONLINE" : "OFFLINE", GUILayout.Width(80));
                    if (toggle != src.IsActive)
                    {
                        src.ToggleHeatSource(toggle);
                    }
                    GUILayout.EndHorizontal();
                }
            }
        }

        #endregion

        #region Tab 4: Organic Infection

        private void DrawInfectionTab()
        {
            GUILayout.Label("<b>Organic Infection System (Shader & Audio Driven)</b>");
            
            if (InfectionManager.Instance != null)
            {
                GUILayout.Label($"Infection Level: <color=red><b>{InfectionManager.Instance.CurrentInfection:F1}%</b></color> (0 to 100)");

                GUILayout.Space(5);
                _sliderInfection = GUILayout.HorizontalSlider(InfectionManager.Instance.CurrentInfection, 0f, 100f);
                if (Mathf.Abs(_sliderInfection - InfectionManager.Instance.CurrentInfection) > 0.1f)
                {
                    InfectionManager.Instance.SetInfection(_sliderInfection);
                }

                GUILayout.Space(10);
                GUILayout.BeginHorizontal();
                if (GUILayout.Button("Infect +25%"))
                {
                    InfectionManager.Instance.AddInfection(25f);
                }
                if (GUILayout.Button("Cure -25%"))
                {
                    InfectionManager.Instance.CureInfection(25f);
                }
                if (GUILayout.Button("Reset to 0%"))
                {
                    InfectionManager.Instance.SetInfection(0f);
                }
                GUILayout.EndHorizontal();

                GUILayout.Space(10);
                GUILayout.Label("<b>Sensory Manifestations:</b>");
                GUILayout.Label($"• Chromatic Aberration: {(InfectionManager.Instance.NormalizedInfection * 100f):F0}%");
                GUILayout.Label($"• Bio-Veins Screen Vignette: {(InfectionManager.Instance.NormalizedInfection * 100f):F0}%");
                GUILayout.Label($"• Audio Lowpass Muffling: {(InfectionManager.Instance.NormalizedInfection > 0.2f ? "Active" : "Normal")}");
                GUILayout.Label($"• Whispers (>50%): {(InfectionManager.Instance.CurrentInfection >= 50f ? "<color=red>WHISPERING ACTIVE</color>" : "Quiet")}");
            }
            else
            {
                GUILayout.Label("InfectionManager instance not found in scene.");
            }
        }

        #endregion
    }
}
