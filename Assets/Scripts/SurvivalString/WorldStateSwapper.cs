using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

namespace SurvivalString
{
    /// <summary>
    /// Helper component designed to be targeted by DecisionNode.OnNodeActivated UnityEvents.
    /// Handles physical world transformations: prefab model swaps, enabling/disabling GameObjects,
    /// and dynamic NavMesh route reconfiguration (NavMeshObstacle / NavMeshLink toggles).
    /// </summary>
    public class WorldStateSwapper : MonoBehaviour
    {
        [Header("Prefab / Model Swapping")]
        [Tooltip("GameObjects to disable when the decision is triggered (e.g. Broken_Generator).")]
        [SerializeField] private List<GameObject> objectsToDisable = new List<GameObject>();

        [Tooltip("GameObjects to enable when the decision is triggered (e.g. Running_Generator).")]
        [SerializeField] private List<GameObject> objectsToEnable = new List<GameObject>();

        [Tooltip("Optional prefabs to instantiate at this transform's position/rotation upon activation.")]
        [SerializeField] private List<GameObject> prefabsToSpawn = new List<GameObject>();

        [Header("NavMesh Path Reconfiguration")]
        [Tooltip("NavMesh obstacles to carve (block path) upon activation.")]
        [SerializeField] private List<NavMeshObstacle> obstaclesToCarve = new List<NavMeshObstacle>();

        [Tooltip("NavMesh obstacles to disable (open path) upon activation.")]
        [SerializeField] private List<NavMeshObstacle> obstaclesToClear = new List<NavMeshObstacle>();

        [Tooltip("NavMesh links to enable (e.g., ladder deployed, bridge lowered).")]
        [SerializeField] private List<NavMeshLink> linksToEnable = new List<NavMeshLink>();

        [Header("FX / Audio Feedback")]
        [Tooltip("Optional particle systems to play upon state swap.")]
        [SerializeField] private List<ParticleSystem> fxToPlay = new List<ParticleSystem>();

        [Tooltip("Optional audio clip to play at position.")]
        [SerializeField] private AudioClip swapAudioClip;

        /// <summary>
        /// Public target method for DecisionNode.OnNodeActivated.
        /// Executes the atomic transformation of the physical environment.
        /// </summary>
        public void ApplyWorldState()
        {
            // 1. Disable deprecated world objects
            for (int i = 0; i < objectsToDisable.Count; i++)
            {
                if (objectsToDisable[i] != null)
                {
                    objectsToDisable[i].SetActive(false);
                }
            }

            // 2. Enable updated world objects
            for (int i = 0; i < objectsToEnable.Count; i++)
            {
                if (objectsToEnable[i] != null)
                {
                    objectsToEnable[i].SetActive(true);
                }
            }

            // 3. Spawn replacement prefabs if any
            for (int i = 0; i < prefabsToSpawn.Count; i++)
            {
                if (prefabsToSpawn[i] != null)
                {
                    Instantiate(prefabsToSpawn[i], transform.position, transform.rotation);
                }
            }

            // 4. Update NavMesh connectivity (carve obstacles)
            for (int i = 0; i < obstaclesToCarve.Count; i++)
            {
                if (obstaclesToCarve[i] != null)
                {
                    obstaclesToCarve[i].carving = true;
                    obstaclesToCarve[i].enabled = true;
                }
            }

            // 5. Clear blocked obstacles (unblock pathways)
            for (int i = 0; i < obstaclesToClear.Count; i++)
            {
                if (obstaclesToClear[i] != null)
                {
                    obstaclesToClear[i].carving = false;
                    obstaclesToClear[i].enabled = false;
                }
            }

            // 6. Enable traversal links (ladders/bridges)
            for (int i = 0; i < linksToEnable.Count; i++)
            {
                if (linksToEnable[i] != null)
                {
                    linksToEnable[i].enabled = true;
                }
            }

            // 7. Play visual & auditory effects
            for (int i = 0; i < fxToPlay.Count; i++)
            {
                if (fxToPlay[i] != null)
                {
                    fxToPlay[i].Play();
                }
            }

            if (swapAudioClip != null)
            {
                AudioSource.PlayClipAtPoint(swapAudioClip, transform.position);
            }

            Debug.Log($"[WorldStateSwapper] World state transformation applied at {name}.");
        }
    }
}
