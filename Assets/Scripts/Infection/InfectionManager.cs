using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Audio;

namespace Infection
{
    /// <summary>
    /// Organic, diegetic infection system driving post-processing shaders and psychoacoustic audio distortion.
    /// Infection ranges from 0.0 to 100.0 without any on-screen UI bar.
    /// Drives Chromatic Aberration, Bio-Vein Vignette, Camera FOV Warping, Audio Mixer Low-Pass Filtering,
    /// and spatial hallucinatory whispering when infection exceeds 50%.
    /// Compatible with Unity 6.
    /// </summary>
    [DisallowMultipleComponent]
    public class InfectionManager : MonoBehaviour
    {
        public static InfectionManager Instance { get; private set; }

        [Header("Infection Level (Diegetic 0.0 - 100.0)")]
        [Range(0f, 100f)]
        [SerializeField] private float currentInfection = 0f;

        [Tooltip("Optional passive infection progression rate per second (0 to disable).")]
        [SerializeField] private float passiveInfectionRate = 0.05f;

        [Header("Shader & Post-Processing Driver")]
        [Tooltip("Target camera for lens distortion / FOV warping.")]
        [SerializeField] private Camera playerCamera;

        [Tooltip("Base field of view before infection warping.")]
        [SerializeField] private float baseFOV = 65f;

        [Tooltip("Max FOV deviation caused by feverish infection breathing.")]
        [SerializeField] private float maxFovWarp = 8f;

        [Tooltip("Global shader property names updated in Shader.SetGlobalFloat.")]
        [SerializeField] private string shaderPropInfection = "_InfectionLevel";
        [SerializeField] private string shaderPropChromatic = "_InfectionChromaticAberration";
        [SerializeField] private string shaderPropVignette = "_InfectionVignette";

        [Header("Audio Mixer & Filter Parameters")]
        [Tooltip("Master audio mixer containing a Lowpass filter parameter on the environment group.")]
        [SerializeField] private AudioMixer masterAudioMixer;

        [Tooltip("Exposed parameter name for Lowpass cutoff frequency in Hz.")]
        [SerializeField] private string lpfCutoffParamName = "EnvironmentLPFCutoff";

        [Tooltip("Cutoff frequency at 0% infection (clean audio).")]
        [SerializeField] private float minCutoffHz = 22000f;

        [Tooltip("Cutoff frequency at 100% infection (muffled, suffocating audio).")]
        [SerializeField] private float maxCutoffHz = 600f;

        [Header("Auditory Hallucinations (Infection > 50)")]
        [Tooltip("Whisper audio clips triggered when fever exceeds 50%.")]
        [SerializeField] private List<AudioClip> whisperAudioClips = new List<AudioClip>();

        [Tooltip("Minimum wait time between whispers.")]
        [SerializeField] private float minWhisperInterval = 6f;

        [Tooltip("Maximum wait time between whispers.")]
        [SerializeField] private float maxWhisperInterval = 16f;

        [Tooltip("AudioSource used to play 3D spatialized whispers around player ears.")]
        [SerializeField] private AudioSource whisperAudioSource;

        private int _propIdInfection;
        private int _propIdChromatic;
        private int _propIdVignette;
        private Coroutine _whisperRoutine;

        #region Public Properties

        public float CurrentInfection => currentInfection;
        public float NormalizedInfection => Mathf.Clamp01(currentInfection / 100f);

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

            _propIdInfection = Shader.PropertyToID(shaderPropInfection);
            _propIdChromatic = Shader.PropertyToID(shaderPropChromatic);
            _propIdVignette = Shader.PropertyToID(shaderPropVignette);

            if (playerCamera == null)
            {
                playerCamera = Camera.main;
            }

            if (playerCamera != null)
            {
                baseFOV = playerCamera.fieldOfView;
            }

            if (whisperAudioSource == null)
            {
                whisperAudioSource = gameObject.AddComponent<AudioSource>();
                whisperAudioSource.spatialBlend = 1f; // Full 3D spatialization
                whisperAudioSource.playOnAwake = false;
            }
        }

        private void Start()
        {
            _whisperRoutine = StartCoroutine(WhisperHallucinationRoutine());
        }

        private void Update()
        {
            // Passive progression
            if (passiveInfectionRate > 0f && currentInfection > 0f && currentInfection < 100f)
            {
                currentInfection = Mathf.Clamp(currentInfection + (passiveInfectionRate * Time.deltaTime), 0f, 100f);
            }

            UpdateShaderParameters();
            UpdateCameraFOV();
            UpdateAudioMixer();
        }

        private void OnDestroy()
        {
            if (_whisperRoutine != null)
            {
                StopCoroutine(_whisperRoutine);
            }

            if (Instance == this)
            {
                Instance = null;
            }
        }

        #endregion

        #region Infection Mutation API

        /// <summary>
        /// Adds infection value (e.g., from zombie scratch, toxic spore exposure).
        /// </summary>
        public void AddInfection(float amount)
        {
            currentInfection = Mathf.Clamp(currentInfection + Mathf.Abs(amount), 0f, 100f);
            Debug.Log($"<color=#7CFC00>[Infection] Added {amount:F1}%.</color> Current Organic Infection: {currentInfection:F1}%");
        }

        /// <summary>
        /// Decreases infection using antiviral injectors or clean medical treatment.
        /// </summary>
        public void CureInfection(float amount)
        {
            currentInfection = Mathf.Clamp(currentInfection - Mathf.Abs(amount), 0f, 100f);
            Debug.Log($"[Infection] Cured {amount:F1}%. Current Organic Infection: {currentInfection:F1}%");
        }

        /// <summary>
        /// Directly forces infection level for testing or cinematic sequences.
        /// </summary>
        public void SetInfection(float value)
        {
            currentInfection = Mathf.Clamp(value, 0f, 100f);
        }

        #endregion

        #region Sensory Degradation Drivers

        /// <summary>
        /// Pushes global properties to Unity shaders (used by custom Post-Processing materials & UI shaders).
        /// </summary>
        private void UpdateShaderParameters()
        {
            float norm = NormalizedInfection;

            // Chromatic aberration intensifies exponentially near high infection
            float chromatic = Mathf.Pow(norm, 1.5f);

            // Vignette with organic red bio-vein appearance
            float vignette = norm;

            Shader.SetGlobalFloat(_propIdInfection, norm);
            Shader.SetGlobalFloat(_propIdChromatic, chromatic);
            Shader.SetGlobalFloat(_propIdVignette, vignette);
        }

        /// <summary>
        /// Modulates the Camera FOV with feverish breathing distortion.
        /// </summary>
        private void UpdateCameraFOV()
        {
            if (playerCamera == null) return;

            float norm = NormalizedInfection;
            if (norm <= 0.05f)
            {
                playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, baseFOV, Time.deltaTime * 2f);
                return;
            }

            // Pulsing fever breath distortion
            float pulse = Mathf.Sin(Time.time * (1.2f + (norm * 2.5f))) * (norm * maxFovWarp);
            playerCamera.fieldOfView = baseFOV + pulse;
        }

        /// <summary>
        /// Sweeps the Audio Mixer Low-Pass Filter based on infection depth.
        /// </summary>
        private void UpdateAudioMixer()
        {
            if (masterAudioMixer == null) return;

            float norm = NormalizedInfection;
            // Exponential frequency drop for suffocating audio feel
            float targetCutoff = Mathf.Lerp(minCutoffHz, maxCutoffHz, Mathf.Pow(norm, 1.8f));

            masterAudioMixer.SetFloat(lpfCutoffParamName, targetCutoff);
        }

        /// <summary>
        /// Periodically spawns binaural whisper hallucination audio clips around player ears when infection > 50%.
        /// </summary>
        private IEnumerator WhisperHallucinationRoutine()
        {
            while (true)
            {
                float waitTime = UnityEngine.Random.Range(minWhisperInterval, maxWhisperInterval);
                yield return new WaitForSeconds(waitTime);

                if (currentInfection >= 50f && whisperAudioClips.Count > 0 && whisperAudioSource != null)
                {
                    // Pick random clip
                    AudioClip clip = whisperAudioClips[UnityEngine.Random.Range(0, whisperAudioClips.Count)];
                    if (clip != null)
                    {
                        // Position audio source 3D in a random angle around player head (left/right ear)
                        Vector3 offset = UnityEngine.Random.insideUnitSphere * 1.5f;
                        offset.y = UnityEngine.Random.Range(0.2f, 0.8f);

                        whisperAudioSource.transform.position = (playerCamera != null ? playerCamera.transform.position : transform.position) + offset;
                        whisperAudioSource.volume = Mathf.Lerp(0.3f, 1.0f, (currentInfection - 50f) / 50f);
                        whisperAudioSource.pitch = UnityEngine.Random.Range(0.85f, 1.1f);
                        whisperAudioSource.PlayOneShot(clip);

                        Debug.Log($"<color=#9400D3>[Infection Hallucination]</color> Whisper triggered at offset {offset}. Infection: {currentInfection:F1}%");
                    }
                }
            }
        }

        #endregion
    }
}
