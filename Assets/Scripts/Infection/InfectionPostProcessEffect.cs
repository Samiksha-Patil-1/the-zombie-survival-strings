using UnityEngine;

namespace Infection
{
    /// <summary>
    /// Screen-space image effect blit controller for the Organic Infection Post-Processing effect.
    /// Works with standard OnRenderImage blit in Built-in RP or can drive a URP FullScreenPass material.
    /// </summary>
    [ExecuteInEditMode]
    [RequireComponent(typeof(Camera))]
    public class InfectionPostProcessEffect : MonoBehaviour
    {
        [Tooltip("Shader asset: Hidden/Survival/OrganicInfectionScreenEffect")]
        [SerializeField] private Shader infectionShader;

        [Tooltip("Optional direct material assignment.")]
        [SerializeField] private Material effectMaterial;

        private void OnEnable()
        {
            if (infectionShader == null)
            {
                infectionShader = Shader.Find("Hidden/Survival/OrganicInfectionScreenEffect");
            }

            if (effectMaterial == null && infectionShader != null)
            {
                effectMaterial = new Material(infectionShader);
                effectMaterial.hideFlags = HideFlags.DontSave;
            }
        }

        private void OnDisable()
        {
            if (effectMaterial != null)
            {
                DestroyImmediate(effectMaterial);
            }
        }

        private void OnRenderImage(RenderTexture source, RenderTexture destination)
        {
            if (effectMaterial == null && infectionShader != null)
            {
                effectMaterial = new Material(infectionShader);
            }

            if (effectMaterial != null)
            {
                Graphics.Blit(source, destination, effectMaterial);
            }
            else
            {
                Graphics.Blit(source, destination);
            }
        }
    }
}
