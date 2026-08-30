import * as THREE from "three";

type Tramo = { desde: number; hasta: number; centro: number; masa: number };

type Marca = { nombre: string; padre: string | null; punto: THREE.Vector3 };

type Mascara = (x: number, y: number, z: number) => number;

type Tallo = { nombre: string; inicio: THREE.Vector3; fin: THREE.Vector3; mascara: Mascara };

const BINS_X = 128;
const BINS_Y = 192;

const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.min(maximo, Math.max(minimo, valor));

const en = (datos: ArrayLike<number>, indice: number) => datos[indice] ?? 0;

const suave = (borde0: number, borde1: number, valor: number) => {
  if (borde0 === borde1) return valor >= borde1 ? 1 : 0;
  const t = limitar((valor - borde0) / (borde1 - borde0), 0, 1);
  return t * t * (3 - 2 * t);
};

const mallasDe = (raiz: THREE.Object3D) => {
  const salida: THREE.Mesh[] = [];
  raiz.traverse((nodo) => {
    const malla = nodo as THREE.Mesh;
    if (malla.isMesh) salida.push(malla);
  });
  return salida;
};

export const tieneEsqueleto = (raiz: THREE.Object3D) => {
  let hallado = false;
  raiz.traverse((nodo) => {
    if ((nodo as THREE.SkinnedMesh).isSkinnedMesh) hallado = true;
  });
  return hallado;
};

const tramosEn = (
  pos: ArrayLike<number>,
  y0: number,
  y1: number,
  minX: number,
  ancho: number,
): Tramo[] => {
  const cubos = new Float32Array(BINS_X);
  for (let i = 0; i < pos.length; i += 3) {
    const y = en(pos, i + 1);
    if (y < y0 || y > y1) continue;
    const bin = limitar(Math.floor(((en(pos, i) - minX) / ancho) * BINS_X), 0, BINS_X - 1);
    cubos[bin] = en(cubos, bin) + 1;
  }
  let pico = 0;
  let total = 0;
  for (let bin = 0; bin < BINS_X; bin += 1) {
    pico = Math.max(pico, en(cubos, bin));
    total += en(cubos, bin);
  }
  if (total === 0) return [];
  const umbral = pico * 0.06;
  const salida: Tramo[] = [];
  let inicio = -1;
  let ultimo = -1;
  let masa = 0;
  const cerrar = () => {
    if (inicio < 0) return;
    const desde = minX + (inicio / BINS_X) * ancho;
    const hasta = minX + ((ultimo + 1) / BINS_X) * ancho;
    salida.push({ desde, hasta, centro: (desde + hasta) / 2, masa });
    inicio = -1;
    masa = 0;
  };
  for (let bin = 0; bin < BINS_X; bin += 1) {
    if (en(cubos, bin) <= umbral) continue;
    if (inicio >= 0 && bin - ultimo > 3) cerrar();
    if (inicio < 0) inicio = bin;
    ultimo = bin;
    masa += en(cubos, bin);
  }
  cerrar();
  return salida.filter((tramo) => tramo.masa > total * 0.03);
};

const centroDe = (
  pos: ArrayLike<number>,
  y0: number,
  y1: number,
  x0: number,
  x1: number,
): THREE.Vector3 | null => {
  let sx = 0;
  let sy = 0;
  let sz = 0;
  let cuenta = 0;
  for (let i = 0; i < pos.length; i += 3) {
    const y = en(pos, i + 1);
    const x = en(pos, i);
    if (y < y0 || y > y1 || x < x0 || x > x1) continue;
    sx += x;
    sy += y;
    sz += en(pos, i + 2);
    cuenta += 1;
  }
  if (cuenta === 0) return null;
  return new THREE.Vector3(sx / cuenta, sy / cuenta, sz / cuenta);
};

const medir = (pos: ArrayLike<number>) => {
  const caja = new THREE.Box3();
  const punto = new THREE.Vector3();
  for (let i = 0; i < pos.length; i += 3) {
    caja.expandByPoint(punto.set(en(pos, i), en(pos, i + 1), en(pos, i + 2)));
  }
  const suelo = caja.min.y;
  const alto = caja.max.y - caja.min.y;
  const minX = caja.min.x;
  const anchoX = Math.max(caja.max.x - caja.min.x, 1e-6);
  if (alto <= 0) return null;

  const anchos = new Float32Array(BINS_Y);
  const izquierdos = new Float32Array(BINS_Y).fill(Infinity);
  const derechos = new Float32Array(BINS_Y).fill(-Infinity);
  for (let i = 0; i < pos.length; i += 3) {
    const bin = limitar(Math.floor(((en(pos, i + 1) - suelo) / alto) * BINS_Y), 0, BINS_Y - 1);
    izquierdos[bin] = Math.min(en(izquierdos, bin), en(pos, i));
    derechos[bin] = Math.max(en(derechos, bin), en(pos, i));
  }
  for (let bin = 0; bin < BINS_Y; bin += 1) {
    const izquierdo = en(izquierdos, bin);
    const derecho = en(derechos, bin);
    anchos[bin] = derecho > izquierdo ? derecho - izquierdo : 0;
  }
  const alturaDe = (bin: number) => suelo + ((bin + 0.5) / BINS_Y) * alto;
  const binDe = (altura: number) =>
    limitar(Math.round(((altura - suelo) / alto) * BINS_Y - 0.5), 0, BINS_Y - 1);
  const franja = (altura: number) =>
    tramosEn(pos, altura - alto * 0.008, altura + alto * 0.008, minX, anchoX);

  const binBajo = binDe(suelo + alto * 0.72);
  const binAlto = binDe(suelo + alto * 0.94);
  let minimo = Infinity;
  for (let bin = binBajo; bin <= binAlto; bin += 1) {
    if (en(anchos, bin) > 0) minimo = Math.min(minimo, en(anchos, bin));
  }
  let binCuello = binAlto;
  for (let bin = binBajo; bin <= binAlto; bin += 1) {
    if (en(anchos, bin) > 0 && en(anchos, bin) <= minimo * 1.45) {
      binCuello = bin;
      break;
    }
  }
  const cuello = alturaDe(binCuello);
  const anchoCuello = Math.max(en(anchos, binCuello), alto * 0.02);

  let hombro = cuello - alto * 0.05;
  for (let bin = binCuello; bin >= binDe(suelo + alto * 0.62); bin -= 1) {
    if (en(anchos, bin) > anchoCuello * 2) {
      hombro = alturaDe(bin);
      break;
    }
  }
  const binHombro = binDe(hombro);
  let anchoHombro = 0;
  for (let bin = Math.max(0, binHombro - 3); bin <= Math.min(BINS_Y - 1, binHombro + 3); bin += 1) {
    anchoHombro = Math.max(anchoHombro, en(anchos, bin));
  }
  const medioHombro = Math.max(anchoHombro / 2, alto * 0.09);
  const umbralBrazo = medioHombro * 0.6;

  const alturaTorso = suelo + alto * 0.64;
  const centroBruto = (caja.min.x + caja.max.x) / 2;
  const tramosTorso = franja(alturaTorso);
  const nucleo =
    tramosTorso.length > 0
      ? tramosTorso.reduce((mejor, tramo) =>
          Math.abs(tramo.centro - centroBruto) < Math.abs(mejor.centro - centroBruto) ? tramo : mejor,
        )
      : null;
  const centroX = nucleo ? nucleo.centro : centroBruto;
  const medioTorso = nucleo
    ? Math.max((nucleo.hasta - nucleo.desde) / 2, alto * 0.055)
    : alto * 0.1;
  const centro = centroDe(
    pos,
    alturaTorso - alto * 0.03,
    alturaTorso + alto * 0.03,
    centroX - medioTorso,
    centroX + medioTorso,
  );
  const centroZ = centro ? centro.z : 0;

  let entrepierna = suelo + alto * 0.47;
  for (let bin = binDe(suelo + alto * 0.58); bin >= binDe(suelo + alto * 0.38); bin -= 1) {
    const altura = alturaDe(bin);
    const piernas = franja(altura).filter(
      (tramo) =>
        Math.abs(tramo.centro - centroX) < umbralBrazo && tramo.hasta - tramo.desde > alto * 0.045,
    );
    const hayIzquierda = piernas.some((tramo) => tramo.centro > centroX);
    const hayDerecha = piernas.some((tramo) => tramo.centro < centroX);
    if (piernas.length >= 2 && hayIzquierda && hayDerecha) {
      entrepierna = altura;
      break;
    }
  }

  const pisoBrazo = suelo + alto * 0.3;
  const extremoBrazo = (signo: number, altura: number) => {
    if (altura < pisoBrazo) return null;
    const tramos = franja(altura);
    if (altura < entrepierna + alto * 0.04 && tramos.length < 3) return null;
    const candidatos = tramos.filter((tramo) => (tramo.centro - centroX) * signo > umbralBrazo);
    if (candidatos.length === 0) return null;
    const brazo = candidatos.reduce((mejor, tramo) =>
      (tramo.centro - centroX) * signo > (mejor.centro - centroX) * signo ? tramo : mejor,
    );
    return centroDe(pos, altura - alto * 0.02, altura + alto * 0.02, brazo.desde, brazo.hasta);
  };

  let puntaMano = suelo + alto * 0.45;
  for (let bin = binDe(suelo + alto * 0.62); bin >= binDe(pisoBrazo); bin -= 1) {
    const altura = alturaDe(bin);
    if (!extremoBrazo(1, altura) && !extremoBrazo(-1, altura)) {
      puntaMano = alturaDe(Math.min(BINS_Y - 1, bin + 1));
      break;
    }
    puntaMano = altura;
  }

  const extremoPierna = (signo: number, altura: number) => {
    const tramos = franja(altura).filter(
      (tramo) => (tramo.centro - centroX) * signo > -alto * 0.015,
    );
    if (tramos.length === 0) return null;
    const pierna = tramos.reduce((mejor, tramo) =>
      Math.abs(tramo.centro - centroX) < Math.abs(mejor.centro - centroX) ? tramo : mejor,
    );
    return centroDe(pos, altura - alto * 0.02, altura + alto * 0.02, pierna.desde, pierna.hasta);
  };

  return {
    suelo,
    alto,
    techo: caja.max.y,
    centroX,
    centroZ,
    medioTorso,
    medioHombro,
    cuello,
    hombro,
    entrepierna,
    puntaMano,
    extremoBrazo,
    extremoPierna,
  };
};

type Medidas = NonNullable<ReturnType<typeof medir>>;

const marcasDe = (m: Medidas): Marca[] => {
  const { suelo, alto, centroX, centroZ, medioHombro } = m;
  const cadera = Math.max(m.entrepierna + alto * 0.05, suelo + alto * 0.5);
  const muneca = m.puntaMano + alto * 0.055;
  const codo = m.hombro + (muneca - m.hombro) * 0.5;
  const rodilla = suelo + alto * 0.285;
  const tobillo = suelo + alto * 0.06;
  const muslo = m.entrepierna - alto * 0.05;

  const brazo = (signo: number, altura: number, respaldo: number) => {
    const punto = m.extremoBrazo(signo, altura);
    return new THREE.Vector3(
      punto ? punto.x : centroX + respaldo * signo,
      altura,
      punto ? punto.z : centroZ,
    );
  };
  const pierna = (signo: number, altura: number) => {
    const punto = m.extremoPierna(signo, altura);
    return new THREE.Vector3(
      punto ? punto.x : centroX + medioHombro * 0.45 * signo,
      altura,
      punto ? punto.z : centroZ,
    );
  };

  const lado = (signo: number, prefijo: string): Marca[] => [
    {
      nombre: `${prefijo}Arm`,
      padre: "Chest",
      punto: new THREE.Vector3(centroX + medioHombro * 0.62 * signo, m.hombro, centroZ),
    },
    {
      nombre: `${prefijo}ForeArm`,
      padre: `${prefijo}Arm`,
      punto: brazo(signo, codo, medioHombro * 0.95),
    },
    {
      nombre: `${prefijo}Hand`,
      padre: `${prefijo}ForeArm`,
      punto: brazo(signo, muneca, medioHombro * 0.95),
    },
    {
      nombre: `${prefijo}HandEnd`,
      padre: `${prefijo}Hand`,
      punto: brazo(signo, m.puntaMano + alto * 0.012, medioHombro * 0.95),
    },
    {
      nombre: `${prefijo}UpLeg`,
      padre: "Hips",
      punto: new THREE.Vector3(centroX + (pierna(signo, muslo).x - centroX) * 0.85, cadera, centroZ),
    },
    { nombre: `${prefijo}Leg`, padre: `${prefijo}UpLeg`, punto: pierna(signo, rodilla) },
    { nombre: `${prefijo}Foot`, padre: `${prefijo}Leg`, punto: pierna(signo, tobillo) },
    {
      nombre: `${prefijo}Toe`,
      padre: `${prefijo}Foot`,
      punto: new THREE.Vector3(
        pierna(signo, tobillo).x,
        suelo + alto * 0.012,
        centroZ + alto * 0.05,
      ),
    },
  ];

  return [
    { nombre: "Hips", padre: null, punto: new THREE.Vector3(centroX, cadera, centroZ) },
    {
      nombre: "Spine",
      padre: "Hips",
      punto: new THREE.Vector3(centroX, cadera + (m.hombro - cadera) * 0.32, centroZ),
    },
    {
      nombre: "Chest",
      padre: "Spine",
      punto: new THREE.Vector3(centroX, cadera + (m.hombro - cadera) * 0.72, centroZ),
    },
    { nombre: "Neck", padre: "Chest", punto: new THREE.Vector3(centroX, m.cuello, centroZ) },
    { nombre: "Head", padre: "Neck", punto: new THREE.Vector3(centroX, m.cuello + alto * 0.028, centroZ) },
    { nombre: "HeadEnd", padre: "Head", punto: new THREE.Vector3(centroX, m.techo, centroZ) },
    ...lado(1, "Left"),
    ...lado(-1, "Right"),
  ];
};

const distanciaSegmento = (
  x: number,
  y: number,
  z: number,
  a: THREE.Vector3,
  b: THREE.Vector3,
) => {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const ez = b.z - a.z;
  const largo = ex * ex + ey * ey + ez * ez;
  const t = largo > 1e-12 ? limitar(((x - a.x) * ex + (y - a.y) * ey + (z - a.z) * ez) / largo, 0, 1) : 0;
  const dx = x - (a.x + ex * t);
  const dy = y - (a.y + ey * t);
  const dz = z - (a.z + ez * t);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const tallosDe = (m: Medidas, marcas: Map<string, THREE.Vector3>): Tallo[] => {
  const { alto, centroX, medioHombro, entrepierna } = m;
  const libre: Mascara = () => 1;
  const flanco = (signo: number, x: number) => (x - centroX) * signo;
  const juntoAlTorso = (lateral: number) => suave(medioHombro * 0.35, medioHombro * 0.9, lateral);
  const pasadaLaCadera = (lateral: number) => suave(medioHombro * 1.05, medioHombro * 1.32, lateral);
  const mascaraBrazo = (signo: number): Mascara => (x, y) => {
    const lateral = flanco(signo, x);
    const arriba = suave(m.hombro - alto * 0.13, m.hombro - alto * 0.02, y);
    const estrecho = pasadaLaCadera(lateral);
    return estrecho + (juntoAlTorso(lateral) - estrecho) * arriba;
  };
  const mascaraPierna = (signo: number): Mascara => (x, y) =>
    suave(entrepierna + alto * 0.12, entrepierna - alto * 0.01, y) *
    suave(-alto * 0.02, alto * 0.03, flanco(signo, x)) *
    (1 - pasadaLaCadera(flanco(signo, x)));

  const punto = (nombre: string) => marcas.get(nombre) ?? new THREE.Vector3();
  const tramo = (nombre: string, hijo: string, mascara: Mascara): Tallo => ({
    nombre,
    inicio: punto(nombre),
    fin: punto(hijo),
    mascara,
  });

  const lado = (signo: number, prefijo: string): Tallo[] => [
    tramo(`${prefijo}Arm`, `${prefijo}ForeArm`, mascaraBrazo(signo)),
    tramo(`${prefijo}ForeArm`, `${prefijo}Hand`, mascaraBrazo(signo)),
    tramo(`${prefijo}Hand`, `${prefijo}HandEnd`, mascaraBrazo(signo)),
    tramo(`${prefijo}UpLeg`, `${prefijo}Leg`, mascaraPierna(signo)),
    tramo(`${prefijo}Leg`, `${prefijo}Foot`, mascaraPierna(signo)),
    tramo(`${prefijo}Foot`, `${prefijo}Toe`, mascaraPierna(signo)),
  ];

  return [
    tramo("Hips", "Spine", libre),
    tramo("Spine", "Chest", libre),
    tramo("Chest", "Neck", libre),
    tramo("Neck", "Head", libre),
    tramo("Head", "HeadEnd", libre),
    ...lado(1, "Left"),
    ...lado(-1, "Right"),
  ];
};

const INFLUENCIAS = 4;

const ALCANCE = 0.22;

const CORTE = 0.08;

const pesar = (
  pos: ArrayLike<number>,
  tallos: Tallo[],
  indiceDe: Map<string, number>,
  alto: number,
) => {
  const vertices = pos.length / 3;
  const indices = new Uint16Array(vertices * INFLUENCIAS);
  const pesos = new Float32Array(vertices * INFLUENCIAS);
  const mejoresIndices = new Int32Array(INFLUENCIAS);
  const mejoresPesos = new Float32Array(INFLUENCIAS);

  for (let v = 0; v < vertices; v += 1) {
    const x = en(pos, v * 3);
    const y = en(pos, v * 3 + 1);
    const z = en(pos, v * 3 + 2);
    mejoresIndices.fill(0);
    mejoresPesos.fill(0);

    tallos.forEach((tallo) => {
      const filtro = tallo.mascara(x, y, z);
      if (filtro <= 0.001) return;
      const distancia = distanciaSegmento(x, y, z, tallo.inicio, tallo.fin);
      if (distancia > alto * ALCANCE) return;
      const peso = filtro / Math.pow(distancia / alto + 0.02, 3);
      let ranura = -1;
      let menor = peso;
      for (let k = 0; k < INFLUENCIAS; k += 1) {
        if (en(mejoresPesos, k) < menor) {
          menor = en(mejoresPesos, k);
          ranura = k;
        }
      }
      if (ranura < 0) return;
      mejoresPesos[ranura] = peso;
      mejoresIndices[ranura] = indiceDe.get(tallo.nombre) ?? 0;
    });

    let cumbre = 0;
    for (let k = 0; k < INFLUENCIAS; k += 1) cumbre = Math.max(cumbre, en(mejoresPesos, k));
    for (let k = 0; k < INFLUENCIAS; k += 1) {
      if (en(mejoresPesos, k) < cumbre * CORTE) mejoresPesos[k] = 0;
    }

    let suma = 0;
    for (let k = 0; k < INFLUENCIAS; k += 1) suma += en(mejoresPesos, k);
    for (let k = 0; k < INFLUENCIAS; k += 1) {
      indices[v * INFLUENCIAS + k] = en(mejoresIndices, k);
      pesos[v * INFLUENCIAS + k] = suma > 0 ? en(mejoresPesos, k) / suma : k === 0 ? 1 : 0;
    }
  }
  return { indices, pesos };
};

export const autoRiggear = (raiz: THREE.Object3D) => {
  const mallas = mallasDe(raiz);
  const malla = mallas[0];
  if (!malla) return false;

  raiz.updateMatrixWorld(true);
  const relativa = new THREE.Matrix4().copy(raiz.matrixWorld).invert().multiply(malla.matrixWorld);
  const geometria = malla.geometry.clone();
  geometria.applyMatrix4(relativa);

  const atributo = geometria.getAttribute("position");
  const pos = atributo.array as Float32Array;
  const medidas = medir(pos);
  if (!medidas) return false;

  const marcas = marcasDe(medidas);
  const puntos = new Map(marcas.map((marca) => [marca.nombre, marca.punto]));
  const huesos = new Map<string, THREE.Bone>();
  const orden: THREE.Bone[] = [];
  marcas.forEach((marca) => {
    const hueso = new THREE.Bone();
    hueso.name = marca.nombre;
    const nombrePadre = marca.padre;
    const padre = nombrePadre ? huesos.get(nombrePadre) : undefined;
    const anclaje = nombrePadre ? puntos.get(nombrePadre) : undefined;
    if (padre && anclaje) {
      hueso.position.copy(marca.punto).sub(anclaje);
      padre.add(hueso);
    } else {
      hueso.position.copy(marca.punto);
    }
    huesos.set(marca.nombre, hueso);
    orden.push(hueso);
  });

  const indiceDe = new Map(orden.map((hueso, indice) => [hueso.name, indice]));
  const tallos = tallosDe(medidas, puntos);
  const { indices, pesos } = pesar(pos, tallos, indiceDe, medidas.alto);
  geometria.setAttribute("skinIndex", new THREE.BufferAttribute(indices, INFLUENCIAS));
  geometria.setAttribute("skinWeight", new THREE.BufferAttribute(pesos, INFLUENCIAS));

  const piel = new THREE.SkinnedMesh(geometria, malla.material);
  piel.name = malla.name || "aurora";
  piel.castShadow = true;
  piel.receiveShadow = true;
  piel.frustumCulled = false;

  const raizHuesos = orden[0];
  if (!raizHuesos) return false;

  const grupo = new THREE.Group();
  grupo.name = "auroraRig";
  grupo.add(raizHuesos);
  grupo.add(piel);

  malla.removeFromParent();
  raiz.add(grupo);
  raiz.updateMatrixWorld(true);

  const esqueleto = new THREE.Skeleton(orden);
  piel.bind(esqueleto, piel.matrixWorld);
  return true;
};
