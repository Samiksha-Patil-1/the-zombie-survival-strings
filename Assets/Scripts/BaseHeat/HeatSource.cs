using System;
using UnityEngine;
using UnityEngine.Events;

namespace BaseHeat
{
    /// <summary>
    /// Attach to items in or around the Safehouse (Generators, Radios, Floodlights, Workbenches).
    /// Emits a heat value when active that expands the Safehouse's zombie attraction radius.
    /// </summary>
    public class HeatSource : MonoBehaviour
    {
        [Header("Heat Configuration")]
        [Tooltip("Descriptive name for diagnostics and UI (e.g., 'Modified Diesel Generator').")]
        [SerializeField] private string sourceName = "Heat Source";

        [Tooltip("Heat value added to the base total when this source is active.")]
        [SerializeField] private float heatValue = 25f;

        [Tooltip("Whether this device is currently running and generating heat.")]
        [SerializeField] private bool isActive = true;

        [Header("Feedback Hooks")]
        [Tooltip("Optional AudioSource that hums/runs when this heat source is active.")]
        [SerializeField] private AudioSource operationalAudio;

        [Tooltip("Optional light or particle systems to activate with heat generation.")]
        [SerializeField] private GameObject activeVFX;

        [Header("Events")]
        public UnityEvent<bool> onStateToggled = new UnityEvent<bool>();

        #region Public Properties

        public string SourceName => sourceName;
        public float HeatValue => heatValue;
        public bool IsActive => isActive;

        /// <summary>
        /// Returns the heat output contributed by this device (0 if turned off).
        /// </summary>
        public float EffectiveHeat => isActive ? Mathf.Max(0f, heatValue) : 0f;

        #endregion

        #region Unity Lifecycle

        private void OnEnable()
        {
            if (BaseHeatManager.Instance != null)
            {
                BaseHeatManager.Instance.RegisterSource(this);
            }
            UpdateVisuals();
        }

        private void Start()
        {
            // Catch late initialization if BaseHeatManager spawned after this
            if (BaseHeatManager.Instance != null)
            {
                BaseHeatManager.Instance.RegisterSource(this);
            }
            UpdateVisuals();
        }

        private void OnDisable()
        {
            if (BaseHeatManager.Instance != null)
            {
                BaseHeatManager.Instance.UnregisterSource(this);
            }
        }

        #endregion

        #region State Modification API

        /// <summary>
        /// Toggles whether this heat source is active.
        /// Recalculates base heat attraction sphere immediately.
        /// </summary>
        public void ToggleHeatSource(bool state)
        {
            if (isActive == state) return;

            isActive = state;
            UpdateVisuals();

            if (BaseHeatManager.Instance != null)
            {
                BaseHeatManager.Instance.RecalculateHeat();
            }

            onStateToggled?.Invoke(isActive);
            Debug.Log($"[HeatSource] '{sourceName}' state changed: Active={isActive} (Heat={EffectiveHeat})");
        }

        /// <summary>
        /// Dynamically alters the heat emission value (e.g. overcharging a generator).
        /// </summary>
        public void SetHeatValue(float value)
        {
            heatValue = Mathf.Max(0f, value);
            if (BaseHeatManager.Instance != null)
            {
                BaseHeatManager.Instance.RecalculateHeat();
            }
        }

        private void UpdateVisuals()
        {
            if (operationalAudio != null)
            {
                if (isActive && !operationalAudio.isPlaying)
                {
                    operationalAudio.Play();
                }
                else if (!isActive && operationalAudio.isPlaying)
                {
                    operationalAudio.Stop();
                }
            }

            if (activeVFX != null)
            {
                activeVFX.SetActive(isActive);
            }
        }

        #endregion
    }
}
