#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace SurvivalString.Editor
{
    [CustomEditor(typeof(SurvivalStringManager))]
    public class SurvivalStringManagerEditor : UnityEditor.Editor
    {
        private string _testNodeID = "";

        public override void OnInspectorGUI()
        {
            DrawDefaultInspector();

            SurvivalStringManager manager = (SurvivalStringManager)target;

            EditorGUILayout.Space(15);
            EditorGUILayout.LabelField("Survival String Live Diagnostic", EditorStyles.boldLabel);

            if (!Application.isPlaying)
            {
                EditorGUILayout.HelpBox("Enter Play Mode to test runtime graph evaluation and node commitment.", MessageType.Info);
                return;
            }

            // Status display
            EditorGUILayout.BeginVertical(EditorStyles.helpBox);
            EditorGUILayout.LabelField($"Unlocked Nodes Count: {manager.GetUnlockedNodeIDs().Count}", EditorStyles.boldLabel);
            
            foreach (string id in manager.GetUnlockedNodeIDs())
            {
                DecisionNode node = manager.GetNode(id);
                string title = node != null ? node.NodeTitle : "Unknown";
                EditorGUILayout.LabelField($" ✔ {id} - {title}", EditorStyles.miniLabel);
            }
            EditorGUILayout.EndVertical();

            EditorGUILayout.Space(10);
            EditorGUILayout.LabelField("Simulate Decision Input", EditorStyles.boldLabel);
            _testNodeID = EditorGUILayout.TextField("Node ID to Trigger:", _testNodeID);

            if (GUILayout.Button("Commit Decision (MakeDecision)", GUILayout.Height(28)))
            {
                if (!string.IsNullOrEmpty(_testNodeID))
                {
                    manager.MakeDecision(_testNodeID);
                }
            }

            if (GUILayout.Button("Evaluate Available Downstream Pathways"))
            {
                var pathways = manager.EvaluateUnlockedPathways();
                Debug.Log($"[SurvivalString Diagnostics] Currently available decisions: {pathways.Count}");
                foreach (var p in pathways)
                {
                    Debug.Log($" -> Available: {p.NodeID} ({p.NodeTitle})");
                }
            }

            EditorGUILayout.Space(5);
            if (GUILayout.Button("Log Current State JSON Export"))
            {
                Debug.Log(manager.ExportStateJson());
            }
        }
    }
}
#endif
