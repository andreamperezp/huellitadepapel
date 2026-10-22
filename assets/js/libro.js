/* Huellita de papel · el diario en 3D.
   Un único libro que acompaña el scroll: flota en la portada, se abre en
   "Por dentro", pasa una hoja en "Semana a semana" y se cierra para que
   la mamá diseñe su tapa en vivo. */
import * as THREE from "three";

const HT = window.HuellitaTapa;
const root = document.documentElement;
const canvas = document.getElementById("escena3d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mqMovil = matchMedia("(max-width: 819px), (max-aspect-ratio: 4/5)");

// Medidas del libro (unidades de escena)
const W = 3, H = 4, T = 0.46, CT = 0.07;
const PW = W - 0.1, PH = H - 0.12, PT = T - 2 * CT - 0.02;

// Estados del libro por sección. fx/fy son fracciones del medio ancho/alto visible.
const ESTADOS = {
  escritorio: {
    hero:    { fx: 0.47, fy: 0.0,   rx: 0.14,  ry: -0.52, rz: 0.06,  open: 0, leaf: 0, s: 1 },
    abrir:   { fx: 0.47, fy: -0.03, rx: -0.28, ry: 0.10,  rz: -0.02, open: 1, leaf: 0, s: 0.74 },
    paginas: { fx: -0.47, fy: -0.03, rx: -0.28, ry: -0.10, rz: 0.02, open: 1, leaf: 1, s: 0.74 },
    disena:  { fx: 0.46, fy: 0.0,   rx: 0.06,  ry: -0.34, rz: -0.03, open: 0, leaf: 0, s: 0.92 }
  },
  movil: {
    hero:    { fx: 0, fy: 0.37, rx: 0.12,  ry: -0.48, rz: 0.05,  open: 0, leaf: 0, s: 0.56 },
    abrir:   { fx: 0, fy: 0.44, rx: -0.24, ry: 0.06,  rz: 0,     open: 1, leaf: 0, s: 0.4 },
    paginas: { fx: 0, fy: 0.44, rx: -0.24, ry: -0.06, rz: 0,     open: 1, leaf: 1, s: 0.4 },
    disena:  { fx: 0, fy: 0.45, rx: 0.06,  ry: -0.32, rz: -0.03, open: 0, leaf: 0, s: 0.5 }
  }
};
const CLAVES = ["x", "y", "rx", "ry", "rz", "open", "leaf", "s"];

function iniciar() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    return false;
  }
  if (!renderer.getContext()) return false;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe6e0e8, 2.1));
  const sol = new THREE.DirectionalLight(0xffffff, 1.5);
  sol.position.set(4, 6, 8);
  scene.add(sol);
  const contra = new THREE.DirectionalLight(0xa8bdd6, 0.6);
  contra.position.set(-6, -2, 3);
  scene.add(contra);

  /* ---------- texturas ---------- */
  function textura(dibujar) {
    const c = document.createElement("canvas");
    dibujar(c);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  }

  const tapaCanvas = document.createElement("canvas");
  const lomoCanvas = document.createElement("canvas");
  const texTapa = textura(() => {});
  texTapa.image = tapaCanvas;
  const texLomo = textura(() => {});
  texLomo.image = lomoCanvas;

  const paginas = {};
  ["dedicatoria", "ecografia", "mes", "semana"].forEach((n) => {
    paginas[n] = textura((c) => HT.drawPage(c, n));
  });
  const cantoV = textura((c) => HT.drawEdges(c, true));
  const cantoH = textura((c) => HT.drawEdges(c, false));

  /* ---------- materiales ---------- */
  const mat = (opts) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.82, metalness: 0 }, opts));
  const matTela = mat({ color: "#E6E0E8", roughness: 0.72 });
  const matPapel = mat({ color: "#FBF8F3" });
  const matTapa = mat({ map: texTapa, roughness: 0.7 });
  const matLomo = mat({ map: texLomo, roughness: 0.72 });

  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z
  const libro = new THREE.Group();
  scene.add(libro);

  const contratapa = new THREE.Mesh(new THREE.BoxGeometry(W, H, CT),
    [matTela, matTela, matTela, matTela, matPapel, matTela]);
  contratapa.position.set(0, 0, -T / 2 + CT / 2);
  libro.add(contratapa);

  const lomo = new THREE.Mesh(new THREE.BoxGeometry(CT, H, T),
    [matTela, matLomo, matTela, matTela, matTela, matTela]);
  lomo.position.set(-W / 2 - CT / 2, 0, 0);
  libro.add(lomo);

  const bloque = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, PT), [
    mat({ map: cantoV }), matPapel, mat({ map: cantoH }), mat({ map: cantoH }),
    mat({ map: paginas.semana }), matPapel
  ]);
  bloque.position.set(-W / 2 + PW / 2, 0, 0);
  libro.add(bloque);

  // Tapa y hoja giran sobre la misma bisagra, así al abrirse quedan bien apiladas
  const bisagraTapa = new THREE.Group();
  bisagraTapa.position.set(-W / 2, 0, T / 2);
  libro.add(bisagraTapa);
  const tapa = new THREE.Mesh(new THREE.BoxGeometry(W, H, CT),
    [matTela, matTela, matTela, matTela, matTapa, mat({ map: paginas.dedicatoria })]);
  tapa.position.set(W / 2, 0, -CT / 2);
  bisagraTapa.add(tapa);

  const bisagraHoja = new THREE.Group();
  bisagraHoja.position.copy(bisagraTapa.position);
  libro.add(bisagraHoja);
  const LW = PW - 0.02, LH = PH - 0.02, LT = 0.006;
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(LW, LH, LT), [
    matPapel, matPapel, matPapel, matPapel,
    mat({ map: paginas.ecografia }), mat({ map: paginas.mes })
  ]);
  hoja.position.set(LW / 2 + 0.01, 0, -CT - LT / 2 - 0.002);
  bisagraHoja.add(hoja);

  // Sombra suave detrás del libro, como si flotara sobre el papel
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: textura(HT.drawShadow), transparent: true, depthWrite: false })
  );
  scene.add(sombra);

  /* ---------- destellos flotando ---------- */
  const N = reduce ? 0 : 60;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const vel = new Float32Array(N);
  const tonos = [new THREE.Color("#A8BDD6"), new THREE.Color("#6F7590"), new THREE.Color("#C9BFD0")];
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 2] = -3 + Math.random() * 4.5;
    const c = tonos[i % 3];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    vel[i] = 0.08 + Math.random() * 0.18;
  }
  const geoDest = new THREE.BufferGeometry();
  geoDest.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geoDest.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const destellos = new THREE.Points(geoDest, new THREE.PointsMaterial({
    size: 0.16, map: textura(HT.drawSparkle), transparent: true, opacity: 0.75,
    depthWrite: false, vertexColors: true, sizeAttenuation: true
  }));
  scene.add(destellos);

  /* ---------- tapa en vivo ---------- */
  function pintarTapa(st) {
    HT.drawCover(tapaCanvas, st);
    HT.drawSpine(lomoCanvas, st.tapa);
    texTapa.needsUpdate = true;
    texLomo.needsUpdate = true;
    matTela.color.set((HT.TAPAS[st.tapa] || HT.TAPAS.lavanda).bg);
  }
  // La portada muestra el diario sin nombre; el nombre de ejemplo (o el que escriba
  // la mamá) aparece recién al llegar a "Diseñá el tuyo".
  const PORTADA = { version: "personalizado", nombre: "", frase: "esperándote", tapa: "lavanda" };
  let tapaUsuario = window.huellitaTapa || { version: "personalizado", nombre: "Noah", frase: "esperándote", tapa: "lavanda" };
  let enDisena = false;
  const tapaVisible = () => (enDisena ? tapaUsuario : PORTADA);

  pintarTapa(tapaVisible());
  HT.ready.then(() => {
    pintarTapa(tapaVisible());
    Object.keys(paginas).forEach((n) => {
      HT.drawPage(paginas[n].image, n);
      paginas[n].needsUpdate = true;
    });
    medir();
  });

  // Resorte: el libro hace un pequeño giro cada vez que cambia la tapa
  const resorte = { x: 0, v: 0 };
  const girar = () => { if (!reduce) resorte.v += 2.4; };
  window.addEventListener("tapa:cambio", (e) => {
    tapaUsuario = e.detail;
    if (!enDisena) return;
    pintarTapa(tapaUsuario);
    girar();
  });

  /* ---------- scroll → estado ---------- */
  let medioAlto = 1, medioAncho = 1, movil = mqMovil.matches;
  let anclas = [];
  const escenas = Array.from(document.querySelectorAll("[data-libro]"));
  const ultima = escenas[escenas.length - 1];

  function resolver(nombre) {
    const e = ESTADOS[movil ? "movil" : "escritorio"][nombre];
    return { x: e.fx * medioAncho, y: e.fy * medioAlto, rx: e.rx, ry: e.ry, rz: e.rz, open: e.open, leaf: e.leaf, s: e.s };
  }

  function medir() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    medioAlto = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    medioAncho = medioAlto * camera.aspect;
    movil = mqMovil.matches;
    anclas = escenas.map((el) => {
      const r = el.getBoundingClientRect();
      return { a: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2, st: resolver(el.dataset.libro) };
    });
  }

  function objetivo() {
    const y = window.scrollY;
    if (y <= anclas[0].a) return anclas[0].st;
    for (let i = 0; i < anclas.length - 1; i++) {
      const A = anclas[i], B = anclas[i + 1];
      if (y < B.a) {
        const tramo = B.a - A.a;
        const pausa = Math.min(window.innerHeight * 0.18, tramo * 0.3);
        let t = (y - A.a - pausa) / (tramo - 2 * pausa);
        t = Math.min(1, Math.max(0, t));
        t = t * t * (3 - 2 * t);
        const o = {};
        CLAVES.forEach((k) => { o[k] = A.st[k] + (B.st[k] - A.st[k]) * t; });
        return o;
      }
    }
    return anclas[anclas.length - 1].st;
  }

  medir();
  window.addEventListener("resize", medir);
  if ("ResizeObserver" in window) new ResizeObserver(medir).observe(document.body);

  const actual = Object.assign({}, objetivo());
  if (!reduce) {
    actual.y -= 4.5;
    actual.ry -= 2.2;
    actual.rx += 0.5;
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- loop ---------- */
  const reloj = new THREE.Clock();
  let tiempo = 0;
  function cuadro() {
    requestAnimationFrame(cuadro);
    const dt = Math.min(reloj.getDelta(), 0.05);
    tiempo += dt;

    const visible = ultima.getBoundingClientRect().bottom > 0;
    canvas.style.visibility = visible ? "visible" : "hidden";
    if (!visible) return;

    // Cambia a la tapa personalizable a mitad de camino hacia "Diseñá el tuyo"
    const n = anclas.length;
    const ahoraEnDisena = window.scrollY > (anclas[n - 2].a + anclas[n - 1].a) / 2;
    if (ahoraEnDisena !== enDisena) {
      enDisena = ahoraEnDisena;
      pintarTapa(tapaVisible());
      girar();
    }

    const obj = objetivo();
    const k = reduce ? 1 : 1 - Math.exp(-dt * 4.5);
    CLAVES.forEach((c) => { actual[c] += (obj[c] - actual[c]) * k; });

    resorte.v += (-22 * resorte.x - 6 * resorte.v) * dt;
    resorte.x += resorte.v * dt;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    const flota = reduce ? 0 : 1;
    const s = actual.s;
    libro.scale.setScalar(s);
    libro.position.set(
      actual.x + actual.open * (W / 2) * s * Math.cos(actual.ry),
      actual.y + Math.sin(tiempo * 1.1) * 0.07 * flota * (1 - actual.open * 0.6),
      0
    );
    libro.rotation.set(
      actual.rx + mouse.y * 0.08,
      actual.ry + mouse.x * 0.14 + resorte.x,
      actual.rz + Math.sin(tiempo * 0.7) * 0.018 * flota
    );
    bisagraTapa.rotation.y = -actual.open * Math.PI * 0.97;
    bisagraHoja.rotation.y = -actual.leaf * Math.PI * 0.95;

    sombra.position.set(libro.position.x + 0.3 * s, libro.position.y - 0.45 * s, -1.6);
    sombra.scale.set(W * 1.6 * s * (1 + actual.open * 0.95), H * 1.5 * s, 1);

    for (let i = 0; i < N; i++) {
      let y = pos[i * 3 + 1] + vel[i] * dt;
      if (y > 5.5) y = -5.5;
      pos[i * 3 + 1] = y;
      pos[i * 3] += Math.sin(tiempo * 0.5 + i) * 0.0015;
    }
    if (N) geoDest.attributes.position.needsUpdate = true;

    camera.position.x = mouse.x * 0.25;
    camera.position.y = -mouse.y * 0.15;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  cuadro();
  return true;
}

if (HT && iniciar()) root.classList.add("con-3d");
else root.classList.add("sin-3d");
