// varying vec4 kri;
varying vec2 vUv;
varying vec3 vNormal;

uniform sampler2D audioData;
uniform sampler2D textureImg;

  
  
void main() {
  vec3 color = vec3(1.0);
  vec2 newUV = vUv;

  vec4 oceanView = texture2D(textureImg,newUV);
    
  gl_FragColor = vec4(vNormal, 1.0);
  gl_FragColor = oceanView;
}  