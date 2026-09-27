using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

namespace AIDirector
{
    /// <summary>
    /// Manages the actual instantiation and distribution of zombie archetypes based on
    /// the AI Director's recommendations.
    /// Supports dynamic weighting (Swarm, Ambusher, Hunter).
    /// </summary>
    [DisallowMultipleComponent]
    public class ZombieSpawnManager : MonoBehaviour
    {
        public static ZombieSpawnManager Instance { get; private set; }

        [Header("Archetype Prefab Bindings")]
        [Tooltip("Prefab for the Sound-Adapted Swarmer (Counter to Aggressive play).")]
        [SerializeField] private GameObject swarmerPrefab;

        [Tooltip("Prefab for the Ceiling-Crawling Ambusher (Counter to Stealth play).")]
        [SerializeField] private GameObject ambusherPrefab;

        [Tooltip("Prefab for the Relentless Hunter (Counter to Scavenging/Balanced play).")]
        [SerializeField] private GameObject hunterPrefab;

        [Header("Spawn Points")]
        [SerializeField] private List<Transform> spawnPoints = new List<Transform>();

        [Header("Active Spawn Probability Distribution")]
        [Range(0f, 100f)] [SerializeField] private float swarmerWeight = 33.3f;
        [Range(0f, 100f)] [SerializeField] private float ambusherWeight = 33.3f;
        [Range(0f, 100f)] [SerializeField] private float hunterWeight = 33.4f;

        [Header("Spawn Configuration")]
        [SerializeField] private int maxSimultaneousZombies = 30;
        [SerializeField] private float spawnCooldown = 8f;

        private readonly List<GameObject> _activeZombies = new List<GameObject>();
        private float _lastSpawnTime;

        #region Unity Lifecycle

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            // Clean up destroyed zombies
            _activeZombies.RemoveAll(item => item == null);

            if (Time.time - _lastSpawnTime >= spawnCooldown && _activeZombies.Count < maxSimultaneousZombies)
            {
                SpawnZombieAtRandomPoint();
                _lastSpawnTime = Time.time;
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

        #region Director Dynamic Weighting

        /// <summary>
        /// Reconfigures spawn probabilities when the AI Director identifies a playstyle shift.
        /// </summary>
        public void UpdateArchetypeWeights(EnemyArchetype dominantArchetype)
        {
            switch (dominantArchetype)
            {
                case EnemyArchetype.Swarm:
                    swarmerWeight = 75f;
                    ambusherWeight = 10f;
                    hunterWeight = 15f;
                    break;

                case EnemyArchetype.Ambusher:
                    swarmerWeight = 10f;
                    ambusherWeight = 75f;
                    hunterWeight = 15f;
                    break;

                case EnemyArchetype.Hunter:
                default:
                    swarmerWeight = 20f;
                    ambusherWeight = 20f;
                    hunterWeight = 60f;
                    break;
            }

            Debug.Log($"[ZombieSpawnManager] Updated Archetype Weights: Swarm={swarmerWeight}%, Ambusher={ambusherWeight}%, Hunter={hunterWeight}%");
        }

        #endregion

        #region Spawning Logic

        /// <summary>
        /// Spawns a zombie matching the weighted distribution at an available spawn point.
        /// </summary>
        public GameObject SpawnZombieAtRandomPoint()
        {
            if (spawnPoints == null || spawnPoints.Count == 0) return null;

            Transform chosenPoint = spawnPoints[UnityEngine.Random.Range(0, spawnPoints.Count)];
            if (chosenPoint == null) return null;

            return SpawnZombieAtPosition(chosenPoint.position);
        }

        /// <summary>
        /// Spawns a weighted zombie at a specific world position.
        /// </summary>
        public GameObject SpawnZombieAtPosition(Vector3 position)
        {
            GameObject prefabToSpawn = SelectPrefabByWeight();
            if (prefabToSpawn == null) return null;

            // Ensure placement on NavMesh
            Vector3 spawnPos = position;
            if (NavMesh.SamplePosition(position, out NavMeshHit hit, 5f, NavMesh.AllAreas))
            {
                spawnPos = hit.position;
            }

            GameObject spawned = Instantiate(prefabToSpawn, spawnPos, Quaternion.identity);
            if (!spawned.CompareTag("Zombie"))
            {
                spawned.tag = "Zombie";
            }

            _activeZombies.Add(spawned);
            return spawned;
        }

        private GameObject SelectPrefabByWeight()
        {
            float total = swarmerWeight + ambusherWeight + hunterWeight;
            if (total <= 0f) return hunterPrefab != null ? hunterPrefab : swarmerPrefab;

            float roll = UnityEngine.Random.Range(0f, total);

            if (roll < swarmerWeight)
            {
                return swarmerPrefab != null ? swarmerPrefab : (hunterPrefab != null ? hunterPrefab : ambusherPrefab);
            }
            roll -= swarmerWeight;

            if (roll < ambusherWeight)
            {
                return ambusherPrefab != null ? ambusherPrefab : (hunterPrefab != null ? hunterPrefab : swarmerPrefab);
            }

            return hunterPrefab != null ? hunterPrefab : (swarmerPrefab != null ? swarmerPrefab : ambusherPrefab);
        }

        #endregion
    }
}
