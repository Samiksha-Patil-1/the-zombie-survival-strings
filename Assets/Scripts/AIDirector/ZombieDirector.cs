using System;
using UnityEngine;
using UnityEngine.Events;

namespace AIDirector
{
    /// <summary>
    /// Supported zombie enemy archetypes mirrored to counter player behavior.
    /// </summary>
    public enum EnemyArchetype
    {
        Swarm,      // Sound-Adapted Swarmer: Blind, hyper-sensitive ears, spawned when player is aggressive/loud
        Ambusher,   // Ceiling-Crawling Ambusher: Dark skinned, bone-claws, spawned when player is stealthy
        Hunter      // Relentless Tracker: Roams loot routes and intercepts scavengers
    }

    /// <summary>
    /// The AI Director listens to PlayerTelemetry shifts and counter-balances the encounter composition.
    /// Switches CurrentEnemyType to punish or exploit the player's dominant habits.
    /// Compatible with Unity 6.
    /// </summary>
    [DisallowMultipleComponent]
    public class ZombieDirector : MonoBehaviour
    {
        public static ZombieDirector Instance { get; private set; }

        [Header("Director State")]
        [Tooltip("Active dominant enemy archetype selected by the director.")]
        [SerializeField] private EnemyArchetype currentEnemyType = EnemyArchetype.Hunter;

        [Header("Spawn Adaptation Multipliers")]
        [Tooltip("Spawn weight assigned to Ambushers when player is stealthy (0 to 1).")]
        [Range(0f, 1f)]
        [SerializeField] private float ambusherStealthWeight = 0.85f;

        [Tooltip("Spawn weight assigned to Swarmers when player is aggressive (0 to 1).")]
        [Range(0f, 1f)]
        [SerializeField] private float swarmerAggressionWeight = 0.90f;

        [Header("Events")]
        public UnityEvent<EnemyArchetype> onEnemyTypeChanged = new UnityEvent<EnemyArchetype>();

        #region Public Properties

        public EnemyArchetype CurrentEnemyType => currentEnemyType;

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
        }

        private void Start()
        {
            if (PlayerTelemetry.Instance != null)
            {
                PlayerTelemetry.Instance.OnPlaystyleShifted += HandlePlaystyleShifted;
            }
            else
            {
                Debug.LogWarning("[ZombieDirector] PlayerTelemetry instance not found in scene on Start.");
            }
        }

        private void OnDestroy()
        {
            if (PlayerTelemetry.Instance != null)
            {
                PlayerTelemetry.Instance.OnPlaystyleShifted -= HandlePlaystyleShifted;
            }

            if (Instance == this)
            {
                Instance = null;
            }
        }

        #endregion

        #region Telemetry Event Handling

        /// <summary>
        /// Responds to playstyle shifts reported by PlayerTelemetry (>40% dominance).
        /// </summary>
        /// <param name="dominantPlaystyle">The dominating playstyle category.</param>
        /// <param name="percentage">Dominance percentage.</param>
        private void HandlePlaystyleShifted(PlaystyleType dominantPlaystyle, float percentage)
        {
            EnemyArchetype previousType = currentEnemyType;

            switch (dominantPlaystyle)
            {
                case PlaystyleType.Stealth:
                    // Player is hiding/crouching -> spawn ceiling-crawling Ambushers that drop from above
                    currentEnemyType = EnemyArchetype.Ambusher;
                    break;

                case PlaystyleType.Aggression:
                    // Player is firing weapons and sprinting -> spawn sound-adapted blind Swarmers
                    currentEnemyType = EnemyArchetype.Swarm;
                    break;

                case PlaystyleType.Looting:
                    // Player is scavenging containers -> spawn persistent roaming Hunters
                    currentEnemyType = EnemyArchetype.Hunter;
                    break;

                case PlaystyleType.BaseBuilding:
                    // Player is fortifying -> spawn Swarm waves to test defenses
                    currentEnemyType = EnemyArchetype.Swarm;
                    break;

                case PlaystyleType.Balanced:
                default:
                    // Default encounter mix
                    currentEnemyType = EnemyArchetype.Hunter;
                    break;
            }

            if (previousType != currentEnemyType)
            {
                Debug.Log($"<color=#FF0055>[ZombieDirector] Encounter Director Shifted:</color> <b>{currentEnemyType}</b> (Countering {dominantPlaystyle} at {percentage:F1}%)");
                onEnemyTypeChanged?.Invoke(currentEnemyType);

                // Notify spawn manager if present
                if (ZombieSpawnManager.Instance != null)
                {
                    ZombieSpawnManager.Instance.UpdateArchetypeWeights(currentEnemyType);
                }
            }
        }

        /// <summary>
        /// Manual override for director testing or narrative scripted setpieces.
        /// </summary>
        public void SetEnemyTypeOverride(EnemyArchetype archetype)
        {
            currentEnemyType = archetype;
            Debug.Log($"[ZombieDirector] Manual override to {archetype}.");
            onEnemyTypeChanged?.Invoke(currentEnemyType);

            if (ZombieSpawnManager.Instance != null)
            {
                ZombieSpawnManager.Instance.UpdateArchetypeWeights(currentEnemyType);
            }
        }

        #endregion
    }
}
