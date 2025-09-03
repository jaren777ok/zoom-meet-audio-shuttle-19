/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { Color, ShaderMaterial } from 'three';

// Extend ShaderMaterial
extend({ ShaderMaterial });

const hexToNormalizedRGB = (hex: string) => {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  ];
};

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;

uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd = noise(gl_FragCoord.xy);
  vec2 uv = rotateUvs(vUv * uScale, uRotation);
  vec2 tex = uv * uScale;
  float tOffset = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

interface SilkPlaneProps {
  speed: number;
  scale: number;
  color: string;
  noiseIntensity: number;
  rotation: number;
}

function SilkPlane({ speed, scale, color, noiseIntensity, rotation }: SilkPlaneProps) {
  const materialRef = useRef<ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uTime: { value: 0 }
    }),
    [speed, scale, noiseIntensity, color, rotation]
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += 0.1 * delta;
    }
  });

  return (
    <mesh scale={[window.innerWidth / 100, window.innerHeight / 100, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        args={[{
          uniforms,
          vertexShader,
          fragmentShader
        }]}
      />
    </mesh>
  );
}

interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk = ({ speed = 5, scale = 1, color = '#7B7481', noiseIntensity = 1.5, rotation = 0 }: SilkProps) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0, 1], fov: 75 }}>
        <SilkPlane 
          speed={speed}
          scale={scale}
          color={color}
          noiseIntensity={noiseIntensity}
          rotation={rotation}
        />
      </Canvas>
    </div>
  );
};

export default Silk;