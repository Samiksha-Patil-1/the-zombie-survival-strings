using UnityEngine;
using UnityEngine.AI;

namespace AIDirector
{
    /// <summary>
    /// Basic NavMesh controller attached to zombie enemy prefabs (Swarmer, Ambusher, Hunter).
    /// Listens for base heat redirection, player aggro, and path updates.
    /// </summary>
    [RequireComponent(typeof(NavMeshAgent))]
    public class ZombieNavMeshController : MonoBehaviour
    {
        [Header("Enemy Attributes")]
        [SerializeField] private EnemyArchetype archetype = EnemyArchetype.Swarm;
        [SerializeField] private float wanderSpeed = 1.8f;
        [SerializeField] private float alertSpeed = 4.2f;

        [Header("Aggro State")]
        [SerializeField] private bool isDrawnToBaseHeat;
        [SerializeField] private Vector3 currentDestination;

        private NavMeshAgent _agent;
        private Transform _playerTransform;

        #region Public Properties

        public EnemyArchetype Archetype => archetype;
        public bool IsDrawnToBaseHeat => isDrawnToBaseHeat;

        #endregion

        private void Awake()
        {
            _agent = GetComponent<NavMeshAgent>();
            if (!CompareTag("Zombie"))
            {
                tag = "Zombie";
            }
        }

        private void Start()
        {
            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (player != null)
            {
                _playerTransform = player.transform;
            }

            _agent.speed = wanderSpeed;
        }

        /// <summary>
        /// Called when BaseHeatManager draws this zombie toward the base core.
        /// </summary>
        public void RedirectToBase(Vector3 basePosition)
        {
            isDrawnToBaseHeat = true;
            currentDestination = basePosition;

            if (_agent != null && _agent.isOnNavMesh)
            {
                _agent.speed = alertSpeed;
                _agent.SetDestination(basePosition);
            }
        }

        /// <summary>
        /// Resets aggro back to local wandering or player hunting.
        /// </summary>
        public void ClearHeatAggro()
        {
            isDrawnToBaseHeat = false;
            _agent.speed = wanderSpeed;
        }
    }
}
