using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.Events;

namespace BaseHeat
{
    /// <summary>
    /// Tracks total heat emitted by active appliances in the player's base/safehouse.
    /// Dynamically scales an invisible spherical trigger collider (Radius = TotalHeat * multiplier).
    /// Intercepts zombies entering the perimeter and commands their NavMeshAgents to breach the base.
    /// Compatible with Unity 6.
    /// </summary>
    [RequireComponent(typeof(SphereCollider))]
    [DisallowMultipleComponent]
    public class BaseHeatManager : MonoBehaviour
    {
        public static BaseHeatManager Instance { get; private set; }

        [Header("Target & Positioning")]
        [Tooltip("The breach point zombies march toward (e.g. Safehouse Door, Barricade, or Base Core). If null, defaults to this transform.")]
        [SerializeField] private Transform baseTargetPoint;

        [Header("Dynamic Heat Scaling")]
        [Tooltip("Multiplier converting total active heat into trigger sphere radius (Radius = TotalHeat * heatRadiusMultiplier).")]
        [SerializeField] private float heatRadiusMultiplier = 2.0f;

        [Tooltip("Minimum baseline detection radius even when heat is zero.")]
        [SerializeField] private float minRadius = 6.0f;

        [Tooltip("Maximum upper clamp for the attraction sphere radius.")]
        [SerializeField] private float maxRadius = 150.0f;

        [Header("Runtime Heat Statistics")]
        [SerializeField] private float currentTotalHeat;
        [SerializeField] private float currentSphereRadius;
        [SerializeField] private int activeZombieThreatCount;

        [Header("Events")]
        public UnityEvent<float, float> onHeatChanged = new UnityEvent<float, float>(); // (TotalHeat, SphereRadius)
        public UnityEvent<GameObject> onZombieDrawnToBase = new UnityEvent<GameObject>();

        private SphereCollider _sphereCollider;
        private readonly List<HeatSource> _registeredSources = new List<HeatSource>();

        #region Public Properties

        public float CurrentTotalHeat => currentTotalHeat;
        public float CurrentSphereRadius => currentSphereRadius;
        public Transform BaseTargetPoint => baseTargetPoint != null ? baseTargetPoint : transform;

        #endregion

        #region Unity Lifecycle

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            _sphereCollider = GetComponent<SphereCollider>();
            _sphereCollider.isTrigger = true;

            if (baseTargetPoint == null)
            {
                baseTargetPoint = transform;
            }
        }

        private void Start()
        {
            RecalculateHeat();
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
        }

        #endregion

        #region Heat Calculation & Sphere Scaling

        /// <summary>
        /// Registers a heat source (e.g. Generator, Workbench, Lights).
        /// </summary>
        public void RegisterSource(HeatSource source)
        {
            if (source == null || _registeredSources.Contains(source)) return;

            _registeredSources.Add(source);
            RecalculateHeat();
        }

        /// <summary>
        /// Unregisters a heat source upon disabling or destruction.
        /// </summary>
        public void UnregisterSource(HeatSource source)
        {
            if (source == null) return;

            _registeredSources.Remove(source);
            RecalculateHeat();
        }

        /// <summary>
        /// Sums all active heat sources and recalculates the dynamic attraction sphere radius.
        /// </summary>
        public void RecalculateHeat()
        {
            float total = 0f;
            for (int i = _registeredSources.Count - 1; i >= 0; i--)
            {
                if (_registeredSources[i] == null)
                {
                    _registeredSources.RemoveAt(i);
                    continue;
                }

                total += _registeredSources[i].EffectiveHeat;
            }

            currentTotalHeat = total;

            // Mathematical radius scaling: Radius = HeatValue * 2
            float targetRadius = Mathf.Clamp(total * heatRadiusMultiplier, minRadius, maxRadius);
            currentSphereRadius = targetRadius;

            if (_sphereCollider != null)
            {
                _sphereCollider.radius = targetRadius;
            }

            onHeatChanged?.Invoke(currentTotalHeat, currentSphereRadius);
            Debug.Log($"[BaseHeatManager] Heat updated: <b>{currentTotalHeat:F1} Heat</b> -> Radius: <b>{currentSphereRadius:F1}m</b> (Active sources: {_registeredSources.Count})");
        }

        #endregion

        #region Zombie Infiltration Trigger Logic

        /// <summary>
        /// Detects any zombie entering the dynamic heat sphere and sets their destination to the base target point.
        /// </summary>
        private void OnTriggerEnter(Collider other)
        {
            if (!other.CompareTag("Zombie"))
            {
                // Also check parent in case collider is on a ragdoll limb
                if (other.transform.root == null || !other.transform.root.CompareTag("Zombie"))
                {
                    return;
                }
            }

            GameObject zombieObj = other.transform.root.gameObject;
            NavMeshAgent agent = zombieObj.GetComponent<NavMeshAgent>();

            if (agent == null)
            {
                agent = zombieObj.GetComponentInChildren<NavMeshAgent>();
            }

            if (agent != null && agent.isOnNavMesh)
            {
                Vector3 destination = BaseTargetPoint.position;
                agent.SetDestination(destination);

                // Elevate zombie movement speed towards heat
                agent.isStopped = false;

                activeZombieThreatCount++;
                onZombieDrawnToBase?.Invoke(zombieObj);

                Debug.Log($"<color=#FF4500>[BaseHeatManager] Zombie drawn by Heat ({currentTotalHeat:F1}):</color> Redirecting {zombieObj.name} to {BaseTargetPoint.name}.");
            }
        }

        private void OnTriggerExit(Collider other)
        {
            if (other.CompareTag("Zombie") || (other.transform.root != null && other.transform.root.CompareTag("Zombie")))
            {
                if (activeZombieThreatCount > 0)
                {
                    activeZombieThreatCount--;
                }
            }
        }

        #endregion

        #region Debug Scene Visualizer

#if UNITY_EDITOR
        private void OnDrawGizmos()
        {
            // Draw sphere representing heat attraction in Scene View
            float radius = Application.isPlaying ? currentSphereRadius : Mathf.Max(minRadius, currentTotalHeat * heatRadiusMultiplier);
            Vector3 center = transform.position;

            Gizmos.color = new Color(1f, 0.3f, 0f, 0.15f);
            Gizmos.DrawSphere(center, radius);

            Gizmos.color = new Color(1f, 0.45f, 0f, 0.85f);
            Gizmos.DrawWireSphere(center, radius);

            if (baseTargetPoint != null)
            {
                Gizmos.color = Color.red;
                Gizmos.DrawWireCube(baseTargetPoint.position, new Vector3(1.2f, 2f, 1.2f));
                Gizmos.DrawLine(center, baseTargetPoint.position);
            }
        }
#endif

        #endregion
    }
}
