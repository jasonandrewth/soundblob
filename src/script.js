import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

//shaders

const vertex = `
// GLSL textureless classic 3D noise "cnoise",
  // with an RSL-style periodic variant "pnoise".
  // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
  // Version: 2011-10-11
  //
  // Many thanks to Ian McEwan of Ashima Arts for the
  // ideas for permutation and gradient selection.
  //
  // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
  // Distributed under the MIT license. See LICENSE file.
  // https://github.com/ashima/webgl-noise
  //

  vec3 mod289(vec3 x)
  {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x)
  {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x)
  {
    return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r)
  {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
  }

  // Classic Perlin noise, periodic variant
  float pnoise(vec3 P, vec3 rep)
  {
    vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }


//Rotation
mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);

    return mat3(
      c, 0.0, -s,
      0.0, 1.0, 0.0,
      s, 0.0, c
    );
  }
  
  vec3 rotateY(vec3 v, float angle) {
    return rotation3dY(angle) * v;
  } 

varying float vDistort;
varying vec3 vNormal;
varying vec2 vUv;


uniform float uTime;
uniform float frequency;
uniform sampler2D audioData;
// uniform float uSpeed;
// uniform float uNoiseDensity;
// uniform float uNoiseStrength;

void main() {
    float t = uTime * 0.09;
    //float f = texture2D(audioData, uv).x * 1.;
    float f = texture2D( audioData, vec2( uv.y, 0.0 ) ).r ;

    float almost = frequency - frequency * 0.5;

    float distortion = pnoise((normal + t *0.) * 1.03, vec3(10.0)) * f * 4.;

    vec3 pos = position + (normal * distortion);

    //Sine Wave
    float angle = sin(uv.y * 0.3 + t * 0.2) * 2.3 * 4.0;
    pos = rotateY(pos, angle);


    vNormal = normal;
    vDistort = distortion;
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  } 
`

const fragment = `
varying float vDistort;
varying vec3 vNormal;

uniform float uIntensity;

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}  

void main() {

  if (vDistort == 0.) {
    vec3 color = vNormal;
  }
  float distort = vDistort * 2.0;

  vec3 brightness = vec3(0.5, 0.5, 0.5);
  vec3 contrast = vec3(1.5, 1.5, 1.5);
  vec3 oscilation = vec3(0.4, 0.5, 0.);
  vec3 phase = vec3(0.0, 0.1, 0.2);

  vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);

  gl_FragColor = vec4(color, 1.0);
}
`
// set up for Three.js

// Canvas
const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000 );

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minDistance = 1;
controls.maxDistance = 50;

// a texture loader for images
const loader = new THREE.TextureLoader();

// for analysing the music
let analyser
let empty = new Uint8Array(64 * 4)

// pass into the shader
let uniforms = {
  uTime: {value:0},
  textureImg:      { value: loader.load("img/test.png") },
  seed:      { value: Math.random() },
  audioData: { value: new THREE.DataTexture(empty, 64, 1, THREE.RGBAFormat) },
  frequency: {value:0}
}

// load the music on click and play/pause
const button = document.querySelector("button")
const mediaElement = new Audio("sound/shakeit.mp3");

button.addEventListener("click", function () {
  const listener = new THREE.AudioListener()
	const audio = new THREE.Audio( listener )
  
  // pass in audio to shader if not already there
  if (!analyser) {    
		audio.setMediaElementSource(mediaElement)
    analyser = new THREE.AudioAnalyser(audio, 256)
    
    uniforms.audioData = { 
      value: new THREE.DataTexture( analyser.data, 256 / 4, 1, THREE.RGBAFormat )
    }
  }
  
  // play/pause
  if (!mediaElement.paused) {
    mediaElement.pause()
    button.innerHTML = "Play"
  } else {
    mediaElement.play()
    button.innerHTML = "Pause"
  }
})


/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  console.log('resize')
  sizes.width = window.innerWidth,
  sizes.height = window.innerHeight

  //update camera
  camera.aspect = sizes.width / sizes. height
  camera.updateProjectionMatrix()
  
  //update renderer
  renderer.setSize(sizes.width, sizes.height)

  //device pixel ratio, capped at 2
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



// make a grouping
const globe = new THREE.Group()

// make a earth icosahedron
const geometry = new THREE.IcosahedronGeometry(4, 128);
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vertex,
  fragmentShader: fragment,
  // transparent: true,
	blending: THREE.NoBlending
})
const earth = new THREE.Mesh( geometry, material );

// add earth and clouds to globe layer
globe.add(earth)

// rotate the globe
// globe.rotateZ(0.16)

// move the camera
camera.position.z = 25;

scene.add(globe)

// animation loop
const clock = new THREE.Clock()

const animate = () => {

  const elapsedTime = clock.getElapsedTime()
  
  // update audio analysis
  if (analyser) {
		analyser.getFrequencyData();
		uniforms.audioData.value = new THREE.DataTexture( analyser.data, 128 / 3, 1, THREE.RGBFormat )
  }
  
  // keep rotating
  globe.rotation.y = elapsedTime * 0.5

  //update control
  controls.update()
	
  renderer.render( scene, camera );
  window.requestAnimationFrame(animate)
}

// start animating
animate();