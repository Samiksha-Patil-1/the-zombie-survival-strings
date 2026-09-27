Shader "Hidden/Survival/OrganicInfectionScreenEffect"
{
    Properties
    {
        _MainTex ("Main Screen Texture", 2D) = "white" {}
        _InfectionLevel ("Infection Level (0-1)", Range(0, 1)) = 0.0
        _InfectionChromaticAberration ("Chromatic Aberration Strength", Range(0, 1)) = 0.0
        _InfectionVignette ("Vignette Intensity", Range(0, 1)) = 0.0
        _VeinColor ("Vein Blood Color", Color) = (0.7, 0.02, 0.05, 1.0)
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
        LOD 100
        ZTest Always
        ZWrite Off
        Cull Off

        Pass
        {
            Name "InfectionPostProcess"

            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            // Global or local uniform parameters driven by InfectionManager
            float _InfectionLevel;
            float _InfectionChromaticAberration;
            float _InfectionVignette;
            float4 _VeinColor;

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }

            // Pseudo-random hash for procedural vein noise
            float hash(float2 p)
            {
                return frac(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
            }

            // Simple 2D procedural noise for organic creeping tendrils
            float noise(float2 p)
            {
                float2 i = floor(p);
                float2 f = frac(p);
                f = f * f * (3.0 - 2.0 * f);

                float a = hash(i);
                float b = hash(i + float2(1.0, 0.0));
                float c = hash(i + float2(0.0, 1.0));
                float d = hash(i + float2(1.0, 1.0));

                return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
            }

            fixed4 frag (v2f i) : SV_Target
            {
                float2 uv = i.uv;
                float2 centerOffset = uv - 0.5;
                float distFromCenter = length(centerOffset);

                // 1. Chromatic Aberration (RGB channel dispersion towards edges)
                float chromaticStrength = _InfectionChromaticAberration * 0.035 * distFromCenter;
                float2 redUV = uv + (centerOffset * chromaticStrength);
                float2 blueUV = uv - (centerOffset * chromaticStrength);

                float r = tex2D(_MainTex, redUV).r;
                float g = tex2D(_MainTex, uv).g;
                float b = tex2D(_MainTex, blueUV).b;
                float3 baseCol = float3(r, g, b);

                // 2. High Infection Desaturation (Fever pale look)
                float luma = dot(baseCol, float3(0.299, 0.587, 0.114));
                baseCol = lerp(baseCol, float3(luma, luma, luma), _InfectionLevel * 0.45);

                // 3. Bio-Vein Procedural Tendrils creeping from viewport edges
                float veinScale = 14.0;
                float pulse = sin(_Time.y * 3.0 + distFromCenter * 8.0) * 0.5 + 0.5;
                float n = noise(uv * veinScale + float2(_Time.x, _Time.x * 0.5));
                
                // Veins appear progressively deeper into screen as infection rises
                float veinThreshold = 1.0 - (_InfectionVignette * 0.85);
                float veinMask = smoothstep(veinThreshold, 1.15, distFromCenter + (n * 0.22));

                // 4. Darkening Vignette
                float vignetteMask = smoothstep(0.35, 0.95 - (_InfectionVignette * 0.3), distFromCenter);
                baseCol *= (1.0 - (vignetteMask * _InfectionVignette * 0.75));

                // Blend blood veins with heartbeat pulsing
                float3 veinFinal = _VeinColor.rgb * (1.0 + pulse * 0.4);
                float3 finalColor = lerp(baseCol, veinFinal, veinMask * _InfectionLevel * 0.85);

                return fixed4(finalColor, 1.0);
            }
            ENDHLSL
        }
    }
    FallBack "Diffuse"
}
