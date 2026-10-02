// One uber shader, one branch per project planet. Everything is procedural.

export const planetVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vObjPos;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vObjPos = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const planetFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vObjPos;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform float uType;
  uniform float uHover;
  uniform float uPulse;
  uniform float uFreq;
  uniform float uForm;
  uniform float uMode;
  uniform float uStart;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform vec3 uD;
  uniform vec3 uRim;
  uniform sampler2D uTex;

  float hash31(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  vec3 hash33(vec3 p) {
    return vec3(hash31(p), hash31(p + 17.3), hash31(p + 41.7));
  }
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return s;
  }

  // 0: SurfGambit, wireframe then layout boxes then paint
  vec3 surfgambit(vec2 uv, vec3 p, out vec3 glow) {
    float phase = fract((uTime - uStart) * 0.07);
    float r = 1.3 - 2.6 * smoothstep(0.05, 0.85, phase);
    float d = p.y - r;

    vec2 g = vec2(uv.x * 28.0, uv.y * 14.0);
    vec2 gf = abs(fract(g) - 0.5);
    float wire = smoothstep(0.42, 0.5, max(gf.x, gf.y));
    vec3 wireCol = mix(vec3(0.10, 0.09, 0.22), uD, wire);

    vec2 bg = vec2(uv.x * 14.0, uv.y * 9.0);
    vec2 bc = floor(bg);
    vec2 bf = fract(bg);
    float rnd = hash21(bc);
    vec3 fill = rnd < 0.33 ? uA : (rnd < 0.66 ? uB : uC);
    float edge = 1.0 - smoothstep(0.0, 0.08, min(min(bf.x, 1.0 - bf.x), min(bf.y, 1.0 - bf.y)));
    vec3 boxCol = mix(fill * 0.8 + 0.1, uD, edge);

    float h = fbm(p * 2.4 + 2.0);
    vec3 sea = mix(uC, uB, smoothstep(0.25, 0.5, h));
    vec3 land = mix(uD, uA, smoothstep(0.55, 0.75, h));
    vec3 paint = mix(sea, land, smoothstep(0.5, 0.56, h));

    vec3 c = mix(wireCol, boxCol, smoothstep(-0.31, -0.27, d));
    c = mix(c, paint, smoothstep(-0.02, 0.02, d));
    glow = uD * exp(-abs(d) * 38.0) * 0.9;
    return c;
  }

  // 1: Vynt, Y2K filter modes
  vec3 vyntBase(vec2 uv) {
    float b = sin((uv.y * 9.0 + sin(uv.x * 14.0 + uTime * 0.6) * 0.35 + uTime * 0.15) * 6.2831);
    float b2 = sin((uv.y * 4.0 - uv.x * 6.0 - uTime * 0.2) * 6.2831);
    vec3 c = mix(uA, uB, b * 0.5 + 0.5);
    c = mix(c, uC, smoothstep(0.2, 0.9, b2 * 0.5 + 0.5) * 0.7);
    c += uD * smoothstep(0.88, 1.0, b) * 0.5;
    return c;
  }
  vec3 vynt(vec2 uv0) {
    vec2 uv = uv0;
    float m = mod(floor(uMode), 4.0);
    if (m == 1.0) uv = floor(uv * vec2(60.0, 30.0)) / vec2(60.0, 30.0);
    if (m == 3.0) {
      float row = floor(uv.y * 40.0);
      float gl = step(0.86, hash21(vec2(row, floor(uTime * 6.0))));
      uv.x += gl * (hash21(vec2(row, 2.0)) - 0.5) * 0.2;
    }
    vec2 o = vec2(0.012, 0.0);
    vec3 c = vec3(vyntBase(uv + o).r, vyntBase(uv).g, vyntBase(uv - o).b);
    if (m == 2.0) {
      float l = dot(c, vec3(0.33));
      c = mix(uB * 0.55, uA * 1.1, smoothstep(0.3, 0.9, l));
    }
    c *= 0.92 + 0.08 * sin(uv0.y * 420.0);
    return c;
  }

  // 2: Memoir, paper patchwork
  vec3 memoir(vec2 uv, vec3 p) {
    vec2 g = vec2(uv.x * 16.0, uv.y * 8.0);
    vec2 id = floor(g);
    vec2 f = fract(g);
    float r = hash21(id);
    vec3 paper = r < 0.25 ? uA : (r < 0.5 ? uB : (r < 0.75 ? uC : uD));
    paper = mix(paper, vec3(1.0), 0.3);
    float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    paper *= 0.74 + 0.26 * smoothstep(0.0, 0.14, edge);
    float tape = step(0.8, hash21(id + 7.0)) * step(abs(f.x - 0.5 + (f.y - 0.5) * 0.6), 0.18) * step(f.y, 0.3);
    paper = mix(paper, vec3(1.0, 0.95, 0.68), tape * 0.75);
    paper *= 1.0 - 0.05 * step(0.93, fract(f.y * 5.0));
    paper += (noise(p * 90.0) - 0.5) * 0.06;
    return paper;
  }

  // 3: Veyra, hashed aura
  vec3 veyra(vec3 p, out vec3 glow) {
    float fr = uFreq;
    float t = uTime * 0.25 * fr;
    float n1 = fbm(p * (1.6 + fr * 0.6) + vec3(t, -t * 0.7, t * 0.4));
    float n2 = fbm(p * 3.2 + n1 * 2.5 + vec3(0.0, t, 0.0));
    vec3 c = mix(uA, uB, n1);
    c = mix(c, uC, smoothstep(0.35, 0.8, n2));
    float pat;
    if (uForm > 1.5) pat = sin(atan(p.x, p.z) * (4.0 + fr * 3.0) + n1 * 4.0 + uTime * 0.5);
    else if (uForm > 0.5) pat = sin(p.y * (10.0 + fr * 6.0) + n1 * 5.0 + uTime * fr);
    else pat = sin((n1 + n2) * 8.0 + uTime * fr);
    c += uD * (pat * 0.5 + 0.5) * 0.22;
    float pulse = 0.88 + 0.12 * sin(uTime * fr * 1.6);
    glow = c * 0.35 * pulse;
    return c * pulse;
  }

  // 4: Klar, calm continents
  vec3 klar(vec3 p) {
    float h = fbm(p * 2.1 + vec3(3.0, 1.0, 7.0));
    float land = smoothstep(0.5, 0.535, h);
    float reg = fbm(p * 1.3 + vec3(9.0, 4.0, 2.0));
    vec3 lc = mix(uA, uB, smoothstep(0.38, 0.42, reg));
    lc = mix(lc, uC, smoothstep(0.55, 0.59, reg));
    vec3 ocean = mix(uD, uD * vec3(0.9, 0.93, 1.0), fbm(p * 6.0));
    float coast = smoothstep(0.5, 0.525, h) * (1.0 - smoothstep(0.535, 0.57, h));
    vec3 c = mix(ocean, lc * (0.95 + 0.1 * noise(p * 18.0)), land);
    c += coast * 0.12;
    float cl = smoothstep(0.6, 0.8, fbm(p * 3.0 + vec3(uTime * 0.02, 0.0, 0.0)));
    c = mix(c, vec3(1.0), cl * 0.35);
    return c;
  }

  // 5: RoadSOS, glowing roads and a beacon
  vec3 roadsos(vec3 p, out vec3 glow) {
    vec3 base = mix(uD, uD * 1.6, fbm(p * 3.0));
    float r1 = pow(1.0 - abs(fbm(p * 3.2 + 1.0) * 2.0 - 1.0), 10.0);
    float r2 = pow(1.0 - abs(fbm(p * 6.0 + 5.0) * 2.0 - 1.0), 16.0);
    float roads = clamp(r1 + r2 * 0.7, 0.0, 1.0);
    float ph = 0.5 + 0.5 * sin(uTime * 3.0);
    vec3 beacon = mix(uA, uB, ph);
    float dots = smoothstep(0.86, 0.9, noise(p * 26.0)) * step(0.35, fbm(p * 2.0));
    float sweep = smoothstep(0.9, 1.0, sin(atan(p.x, p.z) - uTime * 1.5));
    glow = roads * beacon * (1.4 + sweep * 1.6) + dots * uC * 1.3;
    return base;
  }

  // 6: Shakespeare GPT, parchment of letters
  vec3 shakespeare(vec2 uv, vec3 p) {
    float m = texture2D(uTex, uv).r;
    float stain = fbm(p * 3.5);
    vec3 parch = mix(uA, uC, stain * 0.8);
    parch *= 0.86 + 0.14 * noise(p * 60.0);
    vec3 c = mix(parch, uB, m * 0.85);
    c *= 0.82 + 0.25 * smoothstep(0.2, 0.7, stain);
    return c;
  }

  // 7: Forge, stamped dabs
  vec3 forge(vec3 p) {
    vec3 q = p * 5.0;
    vec3 b = floor(q - 0.5);
    vec3 acc = vec3(1.0, 0.96, 0.9);
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      vec3 o = vec3(mod(fi, 2.0), mod(floor(fi / 2.0), 2.0), floor(fi / 4.0));
      vec3 cell = b + o;
      vec3 h3 = hash33(cell);
      vec3 ctr = cell + 0.5 + (h3 - 0.5) * 0.7;
      float rad = 0.55 + 0.35 * h3.x;
      float d = length(q - ctr);
      float dab = smoothstep(rad, rad * 0.5, d);
      dab *= 0.75 + 0.25 * noise(q * 7.0 + h3 * 10.0);
      vec3 c = h3.y < 0.25 ? uA : (h3.y < 0.5 ? uB : (h3.y < 0.75 ? uC : uD));
      acc = mix(acc, c, dab * 0.92);
    }
    return acc;
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 p = normalize(vObjPos);
    vec3 col = vec3(0.0);
    vec3 glow = vec3(0.0);
    float shade = 1.0;

    int t = int(uType + 0.5);
    if (t == 0) col = surfgambit(vUv, p, glow);
    else if (t == 1) col = vynt(vUv);
    else if (t == 2) col = memoir(vUv, p);
    else if (t == 3) { col = veyra(p, glow); shade = 0.45; }
    else if (t == 4) col = klar(p);
    else if (t == 5) col = roadsos(p, glow);
    else if (t == 6) col = shakespeare(vUv, p);
    else col = forge(p);

    vec3 L = normalize(vec3(-0.55, 0.45, 0.75));
    float lit = smoothstep(-0.35, 0.9, dot(n, L));
    vec3 shadowTint = vec3(0.5, 0.45, 0.78);
    vec3 shaded = mix(col * shadowTint, col * 1.08, lit);
    col = mix(col, shaded, shade);

    col += glow;

    float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
    col += uRim * fres * (0.5 + uHover * 0.7);
    col += vec3(uHover * 0.05 + uPulse * 0.28);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export const atmoVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const atmoFragment = /* glsl */ `
  precision highp float;
  varying vec3 vN;
  varying vec3 vW;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPow;
  void main() {
    float f = pow(1.0 - max(dot(normalize(vN), normalize(cameraPosition - vW)), 0.0), uPow);
    gl_FragColor = vec4(uColor, f * uIntensity);
    #include <colorspace_fragment>
  }
`;

export const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPx;
  varying vec3 vColor;
  varying float vTw;
  void main() {
    vColor = aColor;
    vTw = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPx * clamp(70.0 / -mv.z, 0.7, 4.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const starFragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vTw;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.6) * vTw;
    gl_FragColor = vec4(vColor, a);
    #include <colorspace_fragment>
  }
`;
