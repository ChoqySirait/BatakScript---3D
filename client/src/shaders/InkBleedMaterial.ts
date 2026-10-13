import * as THREE from 'three';

export const InkBleedShader = {
  uniforms: {
    uInkMap: { value: null as THREE.Texture | null },
    uParchmentMap: { value: null as THREE.Texture | null },
    uInkColor: { value: new THREE.Color('#141418') },
    uInkBleed: { value: 0.004 },
    uTime: { value: 0.0 },
    uLanternPos: { value: new THREE.Vector3(-2.8, 1.6, 1.2) },
    uLanternColor: { value: new THREE.Color('#FFA834') },
    uLanternIntensity: { value: 3.2 },
    uRoughness: { value: 0.86 },
    uIsGoldInk: { value: 0.0 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: `
    uniform sampler2D uInkMap;
    uniform sampler2D uParchmentMap;
    uniform vec3 uInkColor;
    uniform float uInkBleed;
    uniform float uTime;
    uniform vec3 uLanternPos;
    uniform vec3 uLanternColor;
    uniform float uLanternIntensity;
    uniform float uRoughness;
    uniform float uIsGoldInk;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // Pseudo-random noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      // 1. Base parchment color
      vec4 parchTex = texture2D(uParchmentMap, vUv);
      vec3 baseColor = parchTex.rgb;

      // 2. Procedural bark fiber micro-structure (horizontal grain)
      float fiber = sin(vUv.y * 360.0) * cos(vUv.x * 40.0);
      float micro = hash(vUv * 240.0 + sin(uTime * 0.05));
      vec3 normalPerturb = vec3(fiber * 0.06, micro * 0.03, 0.0);
      vec3 N = normalize(vNormal + normalPerturb);

      // 3. Capillary Ink Bleed Diffusion along bark grain (dominant X axis)
      vec2 bleedOffset = vec2(
        uInkBleed * (1.6 + fiber * 0.6),
        uInkBleed * (0.35 + micro * 0.25)
      );

      float inkCenter = texture2D(uInkMap, vUv).r;
      float inkLeft   = texture2D(uInkMap, vUv - bleedOffset).r;
      float inkRight  = texture2D(uInkMap, vUv + bleedOffset).r;
      float inkUp     = texture2D(uInkMap, vUv + vec2(0.0, bleedOffset.y)).r;
      float inkDown   = texture2D(uInkMap, vUv - vec2(0.0, bleedOffset.y)).r;

      // Weighted capillary blur
      float diffusedInk = (inkCenter * 2.6 + inkLeft * 1.2 + inkRight * 1.2 + inkUp * 0.5 + inkDown * 0.5) / 6.0;

      // Edge capillary feathering
      float inkAlpha = smoothstep(0.04, 0.48, diffusedInk);

      // 4. Dynamic Lighting (Lantern Point Light + Ambient)
      vec3 lightVec = uLanternPos - vWorldPosition;
      float lightDist = length(lightVec);
      vec3 lightDir = normalize(lightVec);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);

      // Distance attenuation
      float atten = uLanternIntensity / (1.0 + 0.12 * lightDist + 0.05 * lightDist * lightDist);

      // Diffuse Lambert
      float NdotL = max(dot(N, lightDir), 0.0);
      vec3 diffuse = uLanternColor * (NdotL * atten);
      vec3 ambient = vec3(0.18, 0.16, 0.15); // Ritual room ambient

      // Specular Blinn-Phong (Metallic sheen for Gold ink)
      vec3 H = normalize(lightDir + viewDir);
      float NdotH = max(dot(N, H), 0.0);
      float specPower = uIsGoldInk > 0.5 ? 42.0 : 8.0;
      float specStrength = uIsGoldInk > 0.5 ? 1.6 : 0.06;
      vec3 specular = uLanternColor * (pow(NdotH, specPower) * specStrength * atten);

      // 5. Ink vs Paper Composition
      vec3 finalInkColor = uInkColor;
      if (uIsGoldInk > 0.5) {
        // Mystic gold luminescence
        finalInkColor = mix(uInkColor, vec3(1.0, 0.95, 0.65), 0.35 + micro * 0.2);
      }

      vec3 litParchment = baseColor * (ambient + diffuse * 0.9);
      vec3 litInk = finalInkColor * (ambient * 0.6 + diffuse * 0.8) + specular * inkAlpha;

      vec3 finalColor = mix(litParchment, litInk, inkAlpha);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export function createInkBleedMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(InkBleedShader.uniforms),
    vertexShader: InkBleedShader.vertexShader,
    fragmentShader: InkBleedShader.fragmentShader,
  });
}
