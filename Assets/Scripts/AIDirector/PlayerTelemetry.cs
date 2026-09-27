using System;
using System.Collections;
using UnityEngine;

namespace AIDirector
{
    public enum PlaystyleType
    {
        Balanced,
        Stealth,
        Aggression,
        Looting,
        BaseBuilding
    }

    /// <summary>
    /// Tracks and categorizes player behavioral metrics to mirror playstyle and dictate dynamic AI spawning.
    /// Runs a lightweight coroutine sampling window (every 5 seconds) and calculates normalized percentages.
    /// Fires OnPlaystyleShifted when a specific playstyle dominates by more than 40%.
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerTelemetry : MonoBehaviour
    {
        public static PlayerTelemetry Instance { get; private set; }

        [Header("Telemetry Sampling Window")]
        [Tooltip("Interval in seconds between telemetry evaluation cycles.")]
        [SerializeField] private float sampleInterval = 5f;

        [Tooltip("Dominance threshold (0.40 = 40%) required to trigger an AI Director playstyle shift.")]
        [Range(0.2f, 0.9f)]
        [SerializeField] private float dominanceThreshold = 0.40f;

        [Header("Normalized Scores (0% to 100%)")]
        [SerializeField] [Range(0f, 100f)] private float stealthScore = 25f;
        [SerializeField] [Range(0f, 100f)] private float aggressionScore = 25f;
        [SerializeField] [Range(0f, 100f)] private float lootingScore = 25f;
        [SerializeField] [Range(0f, 100f)] private float baseBuildingScore = 25f;

        [Header("Current Playstyle Classification")]
        [SerializeField] private PlaystyleType dominantPlaystyle = PlaystyleType.Balanced;
        [SerializeField] private float currentDominancePercentage = 25f;

        [Header("Player Tracking References")]
        [Tooltip("Optional reference to player transform. If null, will attempt to find with 'Player' tag.")]
        [SerializeField] private Transform playerTransform;

        // Raw interval counters
        private int _shotsFiredInWindow;
        private float _timeInCrouchInWindow;
        private float _distanceSprintedInWindow;
        private int _lootContainersOpenedInWindow;
        private int _baseBuildingActionsInWindow;

        // State tracking
        private bool _isCurrentlyCrouching;
        private bool _isCurrentlySprinting;
        private Vector3 _lastRecordedPosition;
        private Coroutine _samplingCoroutine;

        // Event dispatched when one playstyle dominates by > 40%
        public event Action<PlaystyleType, float> OnPlaystyleShifted;

        #region Public Properties

        public float StealthScore => stealthScore;
        public float AggressionScore => aggressionScore;
        public float LootingScore => lootingScore;
        public float BaseBuildingScore => baseBuildingScore;
        public PlaystyleType DominantPlaystyle => dominantPlaystyle;
        public float CurrentDominancePercentage => currentDominancePercentage;

        /// <summary>
        /// Normalized 4D vector representing player behavior (values between 0.0 and 1.0).
        /// </summary>
        public Vector4 NormalizedBehaviorVector => new Vector4(
            stealthScore / 100f,
            aggressionScore / 100f,
            lootingScore / 100f,
            baseBuildingScore / 100f
        );

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

            if (playerTransform == null)
            {
                GameObject playerObj = GameObject.FindGameObjectWithTag("Player");
                if (playerObj != null)
                {
                    playerTransform = playerObj.transform;
                }
            }
        }

        private void Start()
        {
            if (playerTransform != null)
            {
                _lastRecordedPosition = playerTransform.position;
            }

            _samplingCoroutine = StartCoroutine(SampleTelemetryRoutine());
        }

        private void Update()
        {
            // Lightweight per-frame state tracking for continuous metrics
            if (playerTransform == null) return;

            float dt = Time.deltaTime;

            if (_isCurrentlyCrouching)
            {
                _timeInCrouchInWindow += dt;
            }

            if (_isCurrentlySprinting)
            {
                float moved = Vector3.Distance(playerTransform.position, _lastRecordedPosition);
                _distanceSprintedInWindow += moved;
            }

            _lastRecordedPosition = playerTransform.position;
        }

        private void OnDestroy()
        {
            if (_samplingCoroutine != null)
            {
                StopCoroutine(_samplingCoroutine);
            }

            if (Instance == this)
            {
                Instance = null;
            }
        }

        #endregion

        #region Sampling & Normalization Math

        /// <summary>
        /// Coroutine that evaluates player activity every sampleInterval seconds.
        /// Converts raw metrics into weighted scores, normalizes to 100%, and checks dominance.
        /// </summary>
        private IEnumerator SampleTelemetryRoutine()
        {
            WaitForSeconds wait = new WaitForSeconds(sampleInterval);

            while (true)
            {
                yield return wait;

                EvaluateTelemetryCycle();
            }
        }

        /// <summary>
        /// Performs the mathematical weighting, normalization, and dominance evaluation.
        /// </summary>
        public void EvaluateTelemetryCycle()
        {
            // Weighting factors
            float rawStealth = (_timeInCrouchInWindow * 3.5f) + 1f; // Baseline idle stealth weight
            float rawAggression = (_shotsFiredInWindow * 5.0f) + (_distanceSprintedInWindow * 0.8f);
            float rawLooting = (_lootContainersOpenedInWindow * 15.0f);
            float rawBaseBuilding = (_baseBuildingActionsInWindow * 20.0f);

            // Decay previous scores into new window (exponential smoothing 70% current, 30% history)
            float totalRaw = rawStealth + rawAggression + rawLooting + rawBaseBuilding;

            if (totalRaw > 0.001f)
            {
                float targetStealth = (rawStealth / totalRaw) * 100f;
                float targetAggression = (rawAggression / totalRaw) * 100f;
                float targetLooting = (rawLooting / totalRaw) * 100f;
                float targetBaseBuilding = (rawBaseBuilding / totalRaw) * 100f;

                // Smooth interpolation to avoid abrupt spastic transitions
                stealthScore = Mathf.Lerp(stealthScore, targetStealth, 0.6f);
                aggressionScore = Mathf.Lerp(aggressionScore, targetAggression, 0.6f);
                lootingScore = Mathf.Lerp(lootingScore, targetLooting, 0.6f);
                baseBuildingScore = Mathf.Lerp(baseBuildingScore, targetBaseBuilding, 0.6f);

                // Renormalize so they strictly sum to 100%
                float sum = stealthScore + aggressionScore + lootingScore + baseBuildingScore;
                if (sum > 0f)
                {
                    stealthScore = (stealthScore / sum) * 100f;
                    aggressionScore = (aggressionScore / sum) * 100f;
                    lootingScore = (lootingScore / sum) * 100f;
                    baseBuildingScore = (baseBuildingScore / sum) * 100f;
                }
            }

            // Determine dominant playstyle
            CheckDominanceAndNotify();

            // Reset raw interval counters
            _shotsFiredInWindow = 0;
            _timeInCrouchInWindow = 0f;
            _distanceSprintedInWindow = 0f;
            _lootContainersOpenedInWindow = 0;
            _baseBuildingActionsInWindow = 0;
        }

        /// <summary>
        /// Verifies if any playstyle exceeds the dominance threshold (e.g. 40%) and fires OnPlaystyleShifted.
        /// </summary>
        private void CheckDominanceAndNotify()
        {
            PlaystyleType newDominant = PlaystyleType.Balanced;
            float maxScore = 0f;

            if (stealthScore > maxScore) { maxScore = stealthScore; newDominant = PlaystyleType.Stealth; }
            if (aggressionScore > maxScore) { maxScore = aggressionScore; newDominant = PlaystyleType.Aggression; }
            if (lootingScore > maxScore) { maxScore = lootingScore; newDominant = PlaystyleType.Looting; }
            if (baseBuildingScore > maxScore) { maxScore = baseBuildingScore; newDominant = PlaystyleType.BaseBuilding; }

            float dominanceRatio = maxScore / 100f;
            currentDominancePercentage = maxScore;

            if (dominanceRatio >= dominanceThreshold)
            {
                if (newDominant != dominantPlaystyle)
                {
                    dominantPlaystyle = newDominant;
                    Debug.Log($"<color=#00E5FF>[PlayerTelemetry] Playstyle Dominance Shifted to:</color> <b>{dominantPlaystyle}</b> ({maxScore:F1}%)");
                    OnPlaystyleShifted?.Invoke(dominantPlaystyle, maxScore);
                }
            }
            else
            {
                if (dominantPlaystyle != PlaystyleType.Balanced)
                {
                    dominantPlaystyle = PlaystyleType.Balanced;
                    Debug.Log($"[PlayerTelemetry] Playstyle returned to Balanced (Max: {maxScore:F1}%).");
                    OnPlaystyleShifted?.Invoke(PlaystyleType.Balanced, maxScore);
                }
            }
        }

        #endregion

        #region Public Ingestion API

        /// <summary>
        /// Call whenever the player fires a weapon.
        /// </summary>
        public void ReportShotFired(int count = 1)
        {
            _shotsFiredInWindow += count;
        }

        /// <summary>
        /// Call whenever the player loots a container, corpse, or supply cache.
        /// </summary>
        public void ReportLootOpened(int count = 1)
        {
            _lootContainersOpenedInWindow += count;
        }

        /// <summary>
        /// Call whenever the player crafts, repairs, reinforces barricades, or interacts with safehouse facilities.
        /// </summary>
        public void ReportBaseBuildingAction(int count = 1)
        {
            _baseBuildingActionsInWindow += count;
        }

        /// <summary>
        /// Toggles crouching state for telemetry duration integration.
        /// </summary>
        public void SetCrouchState(bool isCrouching)
        {
            _isCurrentlyCrouching = isCrouching;
        }

        /// <summary>
        /// Toggles sprinting state for distance sprinted integration.
        /// </summary>
        public void SetSprintingState(bool isSprinting)
        {
            _isCurrentlySprinting = isSprinting;
        }

        /// <summary>
        /// Direct test override for simulated debug environments.
        /// </summary>
        public void SetScoresManually(float stealth, float aggression, float looting, float building)
        {
            float total = stealth + aggression + looting + building;
            if (total <= 0f) return;

            stealthScore = (stealth / total) * 100f;
            aggressionScore = (aggression / total) * 100f;
            lootingScore = (looting / total) * 100f;
            baseBuildingScore = (building / total) * 100f;

            CheckDominanceAndNotify();
        }

        #endregion
    }
}
