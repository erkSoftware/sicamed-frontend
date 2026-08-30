import * as THREE from "three";
import { autoRiggear, tieneEsqueleto } from "./autorig";
import { crearFigura } from "./figura";
import type { Articulacion } from "./figura";

export type Personaje = {
  raiz: THREE.Object3D;
  origen: "procedural" | "modelo";
  acentos: THREE.MeshStandardMaterial[];
  aplicar: (articulacion: Articulacion, x: number, y: number, z: number) => void;
  fijarBoca: (apertura: number) => void;
  fijarParpadeo: (cierre: number) => void;
  desechar: () => void;
};

export const ALTURA_CANONICA = 1.72;

export const personajeProcedural = (): Personaje => {
  const figura = crearFigura();
  const bocaBase = figura.boca.position.y;
  const parpadoIzqBase = figura.parpadoIzq.position.y;
  const parpadoDerBase = figura.parpadoDer.position.y;

  return {
    raiz: figura.raiz,
    origen: "procedural",
    acentos: figura.acentos,
    aplicar: (articulacion, x, y, z) => figura.huesos[articulacion].rotation.set(x, y, z),
    fijarBoca: (apertura) => {
      figura.boca.scale.set(1 + apertura * 0.32, 1 + apertura * 2.3, 1);
      figura.boca.position.y = bocaBase - apertura * 0.008;
    },
    fijarParpadeo: (cierre) => {
      figura.parpadoIzq.scale.y = 0.22 + cierre * 1.05;
      figura.parpadoDer.scale.y = 0.22 + cierre * 1.05;
      figura.parpadoIzq.position.y = parpadoIzqBase - cierre * 0.013;
      figura.parpadoDer.position.y = parpadoDerBase - cierre * 0.013;
    },
    desechar: figura.desechar,
  };
};

const NOMBRES: Record<Articulacion, readonly string[]> = {
  cadera: ["hips", "pelvis", "bip01pelvis", "jbipchips", "root"],
  torso: ["spine", "spine1", "jbipcspine", "abdomen"],
  pecho: ["chest", "spine2", "spine3", "upperchest", "jbipcchest", "jbipcupperchest"],
  cuello: ["neck", "jbipcneck"],
  cabeza: ["head", "jbipchead"],
  hombroIzq: ["leftarm", "lupperarm", "upperarml", "jbiplupperarm", "armleft", "larm"],
  codoIzq: ["leftforearm", "llowerarm", "lowerarml", "jbipllowerarm", "forearmleft"],
  munecaIzq: ["lefthand", "handl", "jbiplhand"],
  hombroDer: ["rightarm", "rupperarm", "upperarmr", "jbiprupperarm", "armright", "rarm"],
  codoDer: ["rightforearm", "rlowerarm", "lowerarmr", "jbiprlowerarm", "forearmright"],
  munecaDer: ["righthand", "handr", "jbiprhand"],
  piernaIzq: ["leftupleg", "lupperleg", "upperlegl", "jbiplupperleg", "thighleft"],
  rodillaIzq: ["leftleg", "llowerleg", "lowerlegl", "jbipllowerleg", "shinleft"],
  piernaDer: ["rightupleg", "rupperleg", "upperlegr", "jbiprupperleg", "thighright"],
  rodillaDer: ["rightleg", "rlowerleg", "lowerlegr", "jbiprlowerleg", "shinright"],
};

const MORFOS_BOCA = ["mouthopen", "jawopen", "vrcvvaa", "visemeaa", "aa", "fclmtha", "moutha"];
const MORFOS_OJOS = ["blink", "eyesclosed", "eyeblink", "fcleyeclose", "blinkleft", "eyeblinkleft"];

const normalizar = (texto: string) => texto.toLowerCase().replace(/[^a-z]/g, "");

const ARTICULACIONES = Object.keys(NOMBRES) as Articulacion[];

type Enlace = {
  hueso: THREE.Object3D;
  reposo: THREE.Quaternion;
  correccion: THREE.Quaternion;
  inversa: THREE.Quaternion;
};

const ARRIBA = new THREE.Vector3(0, 1, 0);
const ABAJO = new THREE.Vector3(0, -1, 0);

const CANONICAS: Record<Articulacion, THREE.Vector3> = {
  cadera: ARRIBA,
  torso: ARRIBA,
  pecho: ARRIBA,
  cuello: ARRIBA,
  cabeza: ARRIBA,
  hombroIzq: ABAJO,
  codoIzq: ABAJO,
  munecaIzq: ABAJO,
  hombroDer: ABAJO,
  codoDer: ABAJO,
  munecaDer: ABAJO,
  piernaIzq: ABAJO,
  rodillaIzq: ABAJO,
  piernaDer: ABAJO,
  rodillaDer: ABAJO,
};

const direccionDe = (hueso: THREE.Object3D, canonica: THREE.Vector3) => {
  const huesos = hueso.children.filter((nodo) => (nodo as THREE.Bone).isBone);
  const hijos = huesos.length > 0 ? huesos : hueso.children;
  const opciones = hijos
    .filter((nodo) => nodo.position.lengthSq() > 1e-8)
    .map((nodo) => nodo.position.clone().normalize());
  const mejor = opciones.reduce<THREE.Vector3 | null>(
    (previo, direccion) =>
      !previo || direccion.dot(canonica) > previo.dot(canonica) ? direccion : previo,
    null,
  );
  return mejor ?? canonica.clone();
};

const enlazar = (hueso: THREE.Object3D, canonica: THREE.Vector3): Enlace => {
  const reposo = hueso.quaternion.clone();
  const correccion = new THREE.Quaternion().setFromUnitVectors(
    direccionDe(hueso, canonica),
    canonica,
  );
  return { hueso, reposo, correccion, inversa: correccion.clone().invert() };
};

export const personajeDeModelo = (raizModelo: THREE.Object3D): Personaje | null => {
  const candidatos = new Map<string, THREE.Object3D>();
  raizModelo.traverse((nodo) => {
    if (!nodo.name) return;
    const clave = normalizar(nodo.name);
    if (!candidatos.has(clave)) candidatos.set(clave, nodo);
  });

  const buscar = (alias: readonly string[]) => {
    for (const nombre of alias) {
      const exacto = candidatos.get(nombre);
      if (exacto) return exacto;
    }
    for (const [clave, nodo] of candidatos) {
      if (alias.some((nombre) => clave.endsWith(nombre))) return nodo;
    }
    for (const [clave, nodo] of candidatos) {
      if (alias.some((nombre) => clave.includes(nombre))) return nodo;
    }
    return undefined;
  };

  const enlaces = new Map<Articulacion, Enlace>();
  ARTICULACIONES.forEach((articulacion) => {
    const hueso = buscar(NOMBRES[articulacion]);
    if (hueso) enlaces.set(articulacion, enlazar(hueso, CANONICAS[articulacion]));
  });

  if (!enlaces.has("cabeza") || !enlaces.has("cadera")) return null;

  const mallasConMorfos: THREE.Mesh[] = [];
  const acentos: THREE.MeshStandardMaterial[] = [];
  raizModelo.traverse((nodo) => {
    const objeto = nodo as THREE.Mesh;
    if (!objeto.isMesh) return;
    objeto.castShadow = true;
    objeto.receiveShadow = true;
    if (objeto.morphTargetDictionary) mallasConMorfos.push(objeto);
  });

  const indicesDe = (nombres: readonly string[]) =>
    mallasConMorfos.flatMap((malla) => {
      const diccionario = malla.morphTargetDictionary ?? {};
      return Object.keys(diccionario)
        .filter((clave) => nombres.includes(normalizar(clave)))
        .map((clave) => ({ malla, indice: diccionario[clave] as number }));
    });

  const morfosBoca = indicesDe(MORFOS_BOCA);
  const morfosOjos = indicesDe(MORFOS_OJOS);

  const caja = new THREE.Box3().setFromObject(raizModelo);
  const alto = caja.max.y - caja.min.y;
  if (alto > 0) {
    const escala = ALTURA_CANONICA / alto;
    raizModelo.scale.multiplyScalar(escala);
  }
  const cajaEscalada = new THREE.Box3().setFromObject(raizModelo);
  raizModelo.position.y -= cajaEscalada.min.y;

  const temporal = new THREE.Quaternion();
  const euler = new THREE.Euler();

  return {
    raiz: raizModelo,
    origen: "modelo",
    acentos,
    aplicar: (articulacion, x, y, z) => {
      const enlace = enlaces.get(articulacion);
      if (!enlace) return;
      euler.set(x, y, z);
      temporal.setFromEuler(euler);
      enlace.hueso.quaternion
        .copy(enlace.reposo)
        .multiply(enlace.inversa)
        .multiply(temporal)
        .multiply(enlace.correccion);
    },
    fijarBoca: (apertura) => {
      morfosBoca.forEach(({ malla, indice }) => {
        if (malla.morphTargetInfluences) malla.morphTargetInfluences[indice] = apertura;
      });
    },
    fijarParpadeo: (cierre) => {
      morfosOjos.forEach(({ malla, indice }) => {
        if (malla.morphTargetInfluences) malla.morphTargetInfluences[indice] = cierre;
      });
    },
    desechar: () => {
      raizModelo.traverse((nodo) => {
        const objeto = nodo as THREE.Mesh;
        if (!objeto.isMesh) return;
        objeto.geometry.dispose();
        const material = objeto.material;
        if (Array.isArray(material)) material.forEach((uno) => uno.dispose());
        else material.dispose();
      });
    },
  };
};

export const cargarModelo = async (url: string): Promise<Personaje | null> => {
  try {
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const cargador = new GLTFLoader();
    const gltf = await cargador.loadAsync(url);
    if (!tieneEsqueleto(gltf.scene)) autoRiggear(gltf.scene);
    return personajeDeModelo(gltf.scene);
  } catch {
    return null;
  }
};
