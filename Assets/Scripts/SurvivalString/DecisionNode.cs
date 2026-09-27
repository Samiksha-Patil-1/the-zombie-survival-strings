using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace SurvivalString
{
    /// <summary>
    /// Represents an atomic narrative and world-state decision node in the Directed Acyclic Graph (DAG).
    /// Each node contains its prerequisites, unlocked children, and UnityEvents that alter the world.
    /// Optimized for Unity 6 ScriptableObject architecture.
    /// </summary>
    [CreateAssetMenu(fileName = "NewDecisionNode", menuName = "Survival String/Decision Node", order = 10)]
    public class DecisionNode : ScriptableObject
    {
        [Header("Node Identification")]
        [Tooltip("Unique programmatic identifier for this decision node (e.g., 'SAVE_ENGINEER', 'SABOTAGE_GENERATOR').")]
        [SerializeField] private string nodeID = "NODE_DEFAULT_ID";

        [Tooltip("User-friendly display title for debug viewers or diegetic journal menus.")]
        [SerializeField] private string nodeTitle = "New Decision";

        [TextArea(3, 6)]
        [Tooltip("Detailed narrative context or outcome description.")]
        [SerializeField] private string description = "Decision description and lore ramifications.";

        [Header("Graph Connections (Edges)")]
        [Tooltip("List of Node IDs that are revealed or unlocked as potential future paths when this node is committed.")]
        [SerializeField] private List<string> childNodeIDs = new List<string>();

        [Tooltip("List of Node IDs that MUST be activated before this decision can ever become available.")]
        [SerializeField] private List<string> prerequisiteNodeIDs = new List<string>();

        [Tooltip("Optional list of Node IDs that are permanently blocked if this decision is committed (branch divergence).")]
        [SerializeField] private List<string> mutuallyExclusiveNodeIDs = new List<string>();

        [Header("World Alteration Hooks")]
        [Tooltip("UnityEvents invoked the instant this decision is made. Hook up prefab swappers, NavMesh link changers, quest triggers, or audio cues here.")]
        [SerializeField] private UnityEvent onNodeActivated = new UnityEvent();

        [Tooltip("Optional UnityEvents invoked if the world state is rolled back or inspected in editor preview.")]
        [SerializeField] private UnityEvent onNodeDeactivated = new UnityEvent();

        #region Public Properties

        public string NodeID => nodeID;
        public string NodeTitle => nodeTitle;
        public string Description => description;
        public IReadOnlyList<string> ChildNodeIDs => childNodeIDs;
        public IReadOnlyList<string> PrerequisiteNodeIDs => prerequisiteNodeIDs;
        public IReadOnlyList<string> MutuallyExclusiveNodeIDs => mutuallyExclusiveNodeIDs;
        public UnityEvent OnNodeActivated => onNodeActivated;
        public UnityEvent OnNodeDeactivated => onNodeDeactivated;

        #endregion

        #region Graph Evaluation Logic

        /// <summary>
        /// Evaluates whether this node's prerequisites are fully met given a set of activated nodes.
        /// Also verifies that no mutually exclusive decisions have locked this pathway.
        /// </summary>
        /// <param name="unlockedNodeIDs">Set of currently unlocked/activated node IDs.</param>
        /// <returns>True if the player is eligible to commit this decision.</returns>
        public bool CanUnlock(HashSet<string> unlockedNodeIDs)
        {
            if (unlockedNodeIDs == null) return false;

            // Check if already unlocked
            if (unlockedNodeIDs.Contains(nodeID))
            {
                return false;
            }

            // Check mutually exclusive locks
            if (mutuallyExclusiveNodeIDs != null)
            {
                for (int i = 0; i < mutuallyExclusiveNodeIDs.Count; i++)
                {
                    if (unlockedNodeIDs.Contains(mutuallyExclusiveNodeIDs[i]))
                    {
                        return false;
                    }
                }
            }

            // Check prerequisites
            if (prerequisiteNodeIDs != null && prerequisiteNodeIDs.Count > 0)
            {
                for (int i = 0; i < prerequisiteNodeIDs.Count; i++)
                {
                    if (!unlockedNodeIDs.Contains(prerequisiteNodeIDs[i]))
                    {
                        return false; // Missing at least one prerequisite
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Executes the associated UnityEvents to alter the 3D world state, NavMesh, and GameObjects.
        /// </summary>
        public void ExecuteActivationEvents()
        {
            try
            {
                onNodeActivated?.Invoke();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SurvivalString] Exception executing world alterations for node '{nodeID}': {ex.Message}\n{ex.StackTrace}");
            }
        }

        /// <summary>
        /// Executes deactivation events if resetting or rolling back states.
        /// </summary>
        public void ExecuteDeactivationEvents()
        {
            try
            {
                onNodeDeactivated?.Invoke();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SurvivalString] Exception deactivating node '{nodeID}': {ex.Message}\n{ex.StackTrace}");
            }
        }

        #endregion

#if UNITY_EDITOR
        private void OnValidate()
        {
            if (string.IsNullOrWhiteSpace(nodeID))
            {
                nodeID = name.ToUpper().Replace(" ", "_");
            }
        }
#endif
    }
}
