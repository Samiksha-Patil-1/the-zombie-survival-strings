using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace SurvivalString
{
    /// <summary>
    /// Central Singleton controller managing the Directed Acyclic Graph (DAG) state of "The Survival String".
    /// High-performance, event-driven, zero Update() loops.
    /// Tracks unlocked decisions, triggers world changes, and evaluates emergent narrative pathways.
    /// Compatible with Unity 6.
    /// </summary>
    [DisallowMultipleComponent]
    public class SurvivalStringManager : MonoBehaviour
    {
        public static SurvivalStringManager Instance { get; private set; }

        [Header("Graph Configuration")]
        [Tooltip("Catalog of all predefined DecisionNode ScriptableObjects available in the game.")]
        [SerializeField] private List<DecisionNode> nodeCatalog = new List<DecisionNode>();

        [Tooltip("Optional list of Node IDs to automatically activate on game start (e.g. Day 0 Prologue).")]
        [SerializeField] private List<string> initialActiveNodeIDs = new List<string>();

        [Header("Runtime Graph State")]
        [Tooltip("Chronological history of decisions made by the player.")]
        [SerializeField] private List<string> decisionHistory = new List<string>();

        [Header("Global Events")]
        [Tooltip("Invoked whenever any decision node is unlocked.")]
        public UnityEvent<DecisionNode> onDecisionCommitted = new UnityEvent<DecisionNode>();

        [Tooltip("Invoked when new downstream pathways/decisions become eligible.")]
        public UnityEvent<List<DecisionNode>> onNewPathwaysAvailable = new UnityEvent<List<DecisionNode>>();

        // O(1) Lookup sets and dictionaries
        private readonly HashSet<string> _unlockedNodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, DecisionNode> _nodeLookup = new Dictionary<string, DecisionNode>(StringComparer.OrdinalIgnoreCase);

        #region Unity Lifecycle

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Debug.LogWarning("[SurvivalStringManager] Multiple instances detected. Destroying duplicate.");
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            InitializeGraphLookup();
        }

        private void Start()
        {
            // Activate prologue/baseline nodes if specified
            if (initialActiveNodeIDs != null && initialActiveNodeIDs.Count > 0)
            {
                for (int i = 0; i < initialActiveNodeIDs.Count; i++)
                {
                    string id = initialActiveNodeIDs[i];
                    if (!string.IsNullOrEmpty(id) && !_unlockedNodes.Contains(id))
                    {
                        MakeDecision(id);
                    }
                }
            }
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
        }

        #endregion

        #region Initialization

        /// <summary>
        /// Builds internal fast-lookup map for all registered ScriptableObject nodes.
        /// </summary>
        private void InitializeGraphLookup()
        {
            _nodeLookup.Clear();
            for (int i = 0; i < nodeCatalog.Count; i++)
            {
                DecisionNode node = nodeCatalog[i];
                if (node == null) continue;

                if (string.IsNullOrWhiteSpace(node.NodeID))
                {
                    Debug.LogWarning($"[SurvivalStringManager] Node asset '{node.name}' has an empty NodeID. Skipping.");
                    continue;
                }

                if (_nodeLookup.ContainsKey(node.NodeID))
                {
                    Debug.LogError($"[SurvivalStringManager] Duplicate NodeID detected: '{node.NodeID}'. Ensure IDs are unique.");
                    continue;
                }

                _nodeLookup.Add(node.NodeID, node);
            }

            Debug.Log($"[SurvivalStringManager] Initialized with {_nodeLookup.Count} registered decision nodes.");
        }

        #endregion

        #region Core Graph API

        /// <summary>
        /// Commits a player decision by Node ID, records it into history, executes world alteration events,
        /// and evaluates newly available narrative edges.
        /// </summary>
        /// <param name="nodeID">Unique ID of the decision to activate.</param>
        public void MakeDecision(string nodeID)
        {
            if (string.IsNullOrEmpty(nodeID))
            {
                Debug.LogError("[SurvivalStringManager] Cannot make decision with null or empty nodeID.");
                return;
            }

            if (!_nodeLookup.TryGetValue(nodeID, out DecisionNode node))
            {
                Debug.LogError($"[SurvivalStringManager] Decision node '{nodeID}' is not registered in the catalog.");
                return;
            }

            if (_unlockedNodes.Contains(nodeID))
            {
                Debug.LogWarning($"[SurvivalStringManager] Decision node '{nodeID}' has already been activated.");
                return;
            }

            // Verify prerequisites unless it's a root node
            if (!node.CanUnlock(_unlockedNodes) && _unlockedNodes.Count > 0)
            {
                Debug.LogWarning($"[SurvivalStringManager] Attempted to unlock '{nodeID}', but prerequisites are not met or path is locked.");
            }

            // 1. Commit node to runtime state
            _unlockedNodes.Add(nodeID);
            decisionHistory.Add(nodeID);

            Debug.Log($"<color=#39FF14>[SurvivalString] Decision Committed:</color> <b>{node.NodeTitle}</b> [{nodeID}]");

            // 2. Trigger World Alterations (Model Swaps, NavMesh Obstacles, Sound FX)
            node.ExecuteActivationEvents();

            // 3. Notify external listeners (UI, journal, telemetry)
            onDecisionCommitted?.Invoke(node);

            // 4. Evaluate new unlocked pathways/edges
            EvaluateUnlockedPathways();
        }

        /// <summary>
        /// Evaluates all downstream nodes to find which decisions have just become available.
        /// </summary>
        public List<DecisionNode> EvaluateUnlockedPathways()
        {
            List<DecisionNode> newlyAvailable = new List<DecisionNode>();

            foreach (var kvp in _nodeLookup)
            {
                DecisionNode candidate = kvp.Value;
                if (_unlockedNodes.Contains(candidate.NodeID))
                {
                    continue; // Already committed
                }

                if (candidate.CanUnlock(_unlockedNodes))
                {
                    newlyAvailable.Add(candidate);
                }
            }

            if (newlyAvailable.Count > 0)
            {
                onNewPathwaysAvailable?.Invoke(newlyAvailable);
            }

            return newlyAvailable;
        }

        /// <summary>
        /// Returns true if the specific node has been committed into the world state.
        /// </summary>
        public bool IsNodeUnlocked(string nodeID)
        {
            if (string.IsNullOrEmpty(nodeID)) return false;
            return _unlockedNodes.Contains(nodeID);
        }

        /// <summary>
        /// Returns true if the player is currently eligible to commit this decision.
        /// </summary>
        public bool CanUnlockNode(string nodeID)
        {
            if (string.IsNullOrEmpty(nodeID) || !_nodeLookup.TryGetValue(nodeID, out DecisionNode node))
            {
                return false;
            }

            return node.CanUnlock(_unlockedNodes);
        }

        /// <summary>
        /// Retrieves the ScriptableObject definition for a node ID.
        /// </summary>
        public DecisionNode GetNode(string nodeID)
        {
            if (string.IsNullOrEmpty(nodeID)) return null;
            _nodeLookup.TryGetValue(nodeID, out DecisionNode node);
            return node;
        }

        /// <summary>
        /// Returns a read-only collection of all unlocked node IDs.
        /// </summary>
        public IReadOnlyCollection<string> GetUnlockedNodeIDs()
        {
            return _unlockedNodes;
        }

        /// <summary>
        /// Returns chronological list of all decisions taken.
        /// </summary>
        public IReadOnlyList<string> GetDecisionHistory()
        {
            return decisionHistory;
        }

        #endregion

        #region Dynamic Registration

        /// <summary>
        /// Registers a dynamically loaded node into the catalog at runtime.
        /// </summary>
        public void RegisterNode(DecisionNode node)
        {
            if (node == null || string.IsNullOrWhiteSpace(node.NodeID)) return;

            if (!_nodeLookup.ContainsKey(node.NodeID))
            {
                _nodeLookup.Add(node.NodeID, node);
                nodeCatalog.Add(node);
            }
        }

        #endregion

        #region Serialization & Persistence

        [Serializable]
        private class SurvivalStringSaveData
        {
            public List<string> unlockedNodeIDs;
            public List<string> history;
        }

        /// <summary>
        /// Serializes the graph's active state to a JSON string for save files.
        /// </summary>
        public string ExportStateJson()
        {
            SurvivalStringSaveData data = new SurvivalStringSaveData
            {
                unlockedNodeIDs = new List<string>(_unlockedNodes),
                history = new List<string>(decisionHistory)
            };
            return JsonUtility.ToJson(data, true);
        }

        /// <summary>
        /// Restores graph state from JSON and replays world alteration events.
        /// </summary>
        public void ImportStateJson(string json, bool replayEvents = true)
        {
            if (string.IsNullOrWhiteSpace(json)) return;

            SurvivalStringSaveData data = JsonUtility.FromJson<SurvivalStringSaveData>(json);
            if (data == null) return;

            _unlockedNodes.Clear();
            decisionHistory.Clear();

            if (data.history != null)
            {
                for (int i = 0; i < data.history.Count; i++)
                {
                    string id = data.history[i];
                    _unlockedNodes.Add(id);
                    decisionHistory.Add(id);

                    if (replayEvents && _nodeLookup.TryGetValue(id, out DecisionNode node))
                    {
                        node.ExecuteActivationEvents();
                    }
                }
            }

            EvaluateUnlockedPathways();
        }

        #endregion
    }
}
