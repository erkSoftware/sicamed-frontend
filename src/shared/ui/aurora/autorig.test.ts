import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { autoRiggear } from "./autorig";
import { personajeDeModelo, ALTURA_CANONICA } from "./personaje";

type Vista = { byteOffset?: number; byteLength: number };
type Acceso = { bufferView: number; byteOffset?: number; count: number };
type Documento = {
  meshes: { primitives: { attributes: { POSITION: number }; indices: number }[] }[];
  accessors: Acceso[];
  bufferViews: Vista[];
};

const exigir = <T,>(valor: T | undefined): T => {
  if (valor === undefined) throw new Error("glb incompleto");
  return valor;
};

const leerGlb = () => {
  const datos = readFileSync("public/modelos/aurora.glb");
  const vista = new DataView(datos.buffer, datos.byteOffset, datos.byteLength);
  let puntero = 12;
  let json = {} as Documento;
  let binario = new Uint8Array();
  while (puntero < vista.byteLength) {
    const largo = vista.getUint32(puntero, true);
    const tipo = vista.getUint32(puntero + 4, true);
    const cuerpo = new Uint8Array(datos.buffer, datos.byteOffset + puntero + 8, largo);
    if (tipo === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(cuerpo)) as Documento;
    else binario = cuerpo;
    puntero += 8 + largo;
  }
  const doc = json;
  const primitiva = exigir(exigir(doc.meshes[0]).primitives[0]);
  const acc = exigir(doc.accessors[primitiva.attributes.POSITION]);
  const bv = exigir(doc.bufferViews[acc.bufferView]);
  const desde = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const posiciones = new Float32Array(acc.count * 3);
  const origen = new DataView(binario.buffer, binario.byteOffset + desde, acc.count * 12);
  for (let i = 0; i < acc.count * 3; i += 1) posiciones[i] = origen.getFloat32(i * 4, true);
  const indAcc = exigir(doc.accessors[primitiva.indices]);
  const indBv = exigir(doc.bufferViews[indAcc.bufferView]);
  const indDesde = (indBv.byteOffset ?? 0) + (indAcc.byteOffset ?? 0);
  const indices = new Uint32Array(indAcc.count);
  const vistaInd = new DataView(binario.buffer, binario.byteOffset + indDesde, indAcc.count * 4);
  for (let i = 0; i < indAcc.count; i += 1) indices[i] = vistaInd.getUint32(i * 4, true);
  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
  geometria.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometria;
};

describe("autorig de aurora", () => {
  const geometria = leerGlb();
  const malla = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial());
  const raiz = new THREE.Group();
  raiz.add(malla);
  const logrado = autoRiggear(raiz);

  it("riggea la malla suelta", () => {
    expect(logrado).toBe(true);
    let piel: THREE.SkinnedMesh | null = null;
    raiz.traverse((nodo) => {
      if ((nodo as THREE.SkinnedMesh).isSkinnedMesh) piel = nodo as THREE.SkinnedMesh;
    });
    expect(piel).not.toBeNull();
    const huesos = (piel as unknown as THREE.SkinnedMesh).skeleton.bones.map((h) => h.name);
    expect(huesos).toContain("Hips");
    expect(huesos).toContain("LeftHand");
    expect(huesos).toContain("RightUpLeg");
    const pesos = (piel as unknown as THREE.SkinnedMesh).geometry.getAttribute("skinWeight");
    for (let v = 0; v < pesos.count; v += 997) {
      const suma = pesos.getX(v) + pesos.getY(v) + pesos.getZ(v) + pesos.getW(v);
      expect(suma).toBeGreaterThan(0.999);
      expect(suma).toBeLessThan(1.001);
    }
  });

  it("expone las quince articulaciones y normaliza la altura", () => {
    const personaje = personajeDeModelo(raiz);
    expect(personaje).not.toBeNull();
    expect(personaje?.origen).toBe("modelo");
    const caja = new THREE.Box3().setFromObject(raiz);
    expect(caja.max.y - caja.min.y).toBeCloseTo(ALTURA_CANONICA, 2);
    expect(Math.abs(caja.min.y)).toBeLessThan(0.01);
  });

});

describe("deformacion con poses", () => {
  const geometria = leerGlb();
  const malla = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial());
  const raiz = new THREE.Group();
  raiz.add(malla);
  autoRiggear(raiz);
  const personaje = personajeDeModelo(raiz);

  const piel = (() => {
    let hallada: THREE.SkinnedMesh | null = null;
    raiz.traverse((nodo) => {
      if ((nodo as THREE.SkinnedMesh).isSkinnedMesh) hallada = nodo as THREE.SkinnedMesh;
    });
    return hallada as unknown as THREE.SkinnedMesh;
  })();

  const dominante = (nombre: string) => {
    const esqueleto = piel.skeleton;
    const objetivo = esqueleto.bones.findIndex((hueso) => hueso.name === nombre);
    const indices = piel.geometry.getAttribute("skinIndex");
    const pesos = piel.geometry.getAttribute("skinWeight");
    let mejor = -1;
    let valor = 0;
    for (let v = 0; v < indices.count; v += 1) {
      const pares: [number, number][] = [
        [indices.getX(v), pesos.getX(v)],
        [indices.getY(v), pesos.getY(v)],
        [indices.getZ(v), pesos.getZ(v)],
        [indices.getW(v), pesos.getW(v)],
      ];
      pares.forEach(([indice, peso]) => {
        if (indice === objetivo && peso > valor) {
          valor = peso;
          mejor = v;
        }
      });
    }
    return mejor;
  };

  const sitio = (vertice: number) => {
    raiz.updateMatrixWorld(true);
    piel.skeleton.update();
    const punto = new THREE.Vector3().fromBufferAttribute(
      piel.geometry.getAttribute("position") as THREE.BufferAttribute,
      vertice,
    );
    piel.applyBoneTransform(vertice, punto);
    return piel.localToWorld(punto);
  };

  it("mueve el brazo sin arrastrar la cabeza", () => {
    const mano = dominante("LeftHand");
    const craneo = dominante("Head");
    expect(mano).toBeGreaterThanOrEqual(0);
    expect(craneo).toBeGreaterThanOrEqual(0);
    const manoReposo = sitio(mano);
    const craneoReposo = sitio(craneo);

    personaje?.aplicar("hombroIzq", -0.9, 0, 0);
    const manoPose = sitio(mano);
    const craneoPose = sitio(craneo);

    expect(manoPose.distanceTo(manoReposo)).toBeGreaterThan(0.25);
    expect(manoPose.z - manoReposo.z).toBeGreaterThan(0.2);
    expect(manoPose.y).toBeGreaterThan(manoReposo.y);
    expect(craneoPose.distanceTo(craneoReposo)).toBeLessThan(0.005);
  });

  const coronilla = () => {
    const esqueleto = piel.skeleton;
    const objetivo = esqueleto.bones.findIndex((hueso) => hueso.name === "Head");
    const indices = piel.geometry.getAttribute("skinIndex");
    const pesos = piel.geometry.getAttribute("skinWeight");
    const posiciones = piel.geometry.getAttribute("position");
    let mejor = -1;
    let altura = -Infinity;
    for (let v = 0; v < indices.count; v += 1) {
      const pares: [number, number][] = [
        [indices.getX(v), pesos.getX(v)],
        [indices.getY(v), pesos.getY(v)],
        [indices.getZ(v), pesos.getZ(v)],
        [indices.getW(v), pesos.getW(v)],
      ];
      const peso = pares.reduce((suma, [indice, valor]) => (indice === objetivo ? suma + valor : suma), 0);
      if (peso > 0.9 && posiciones.getY(v) > altura) {
        altura = posiciones.getY(v);
        mejor = v;
      }
    }
    return mejor;
  };

  it("inclina la cabeza sin mover los pies", () => {
    const craneo = coronilla();
    const pie = dominante("RightFoot");
    expect(craneo).toBeGreaterThanOrEqual(0);
    const craneoReposo = sitio(craneo);
    const pieReposo = sitio(pie);
    personaje?.aplicar("cabeza", 0.45, 0, 0);
    const craneoPose = sitio(craneo);
    expect(craneoPose.distanceTo(craneoReposo)).toBeGreaterThan(0.05);
    expect(craneoPose.z).toBeGreaterThan(craneoReposo.z);
    expect(sitio(pie).distanceTo(pieReposo)).toBeLessThan(0.001);
  });

  const BRAZOS = new Set([
    "LeftArm",
    "LeftForeArm",
    "LeftHand",
    "LeftHandEnd",
    "RightArm",
    "RightForeArm",
    "RightHand",
    "RightHandEnd",
  ]);

  const pesoDeBrazo = (vertice: number) => {
    const huesos = piel.skeleton.bones;
    const indices = piel.geometry.getAttribute("skinIndex");
    const pesos = piel.geometry.getAttribute("skinWeight");
    const pares: [number, number][] = [
      [indices.getX(vertice), pesos.getX(vertice)],
      [indices.getY(vertice), pesos.getY(vertice)],
      [indices.getZ(vertice), pesos.getZ(vertice)],
      [indices.getW(vertice), pesos.getW(vertice)],
    ];
    return pares.reduce(
      (suma, [indice, peso]) => (BRAZOS.has(huesos[indice]?.name ?? "") ? suma + peso : suma),
      0,
    );
  };

  it("no ata la cadera ni el muslo a los huesos del brazo", () => {
    const posiciones = piel.geometry.getAttribute("position");
    const caja = new THREE.Box3().setFromBufferAttribute(posiciones as THREE.BufferAttribute);
    const alto = caja.max.y - caja.min.y;
    const suelo = caja.min.y;
    const centroX = (caja.max.x + caja.min.x) / 2;

    let contaminados = 0;
    let revisados = 0;
    for (let v = 0; v < posiciones.count; v += 1) {
      const altura = (posiciones.getY(v) - suelo) / alto;
      const lateral = Math.abs(posiciones.getX(v) - centroX) / alto;
      if (altura > 0.53 || lateral > 0.115) continue;
      revisados += 1;
      if (pesoDeBrazo(v) > 0.1) contaminados += 1;
    }

    expect(revisados).toBeGreaterThan(1000);
    expect(contaminados).toBe(0);
  });

  it("deja la mano entera bajo el mando del brazo", () => {
    const posiciones = piel.geometry.getAttribute("position");
    const caja = new THREE.Box3().setFromBufferAttribute(posiciones as THREE.BufferAttribute);
    const alto = caja.max.y - caja.min.y;
    const suelo = caja.min.y;
    const centroX = (caja.max.x + caja.min.x) / 2;

    let huerfanos = 0;
    let revisados = 0;
    for (let v = 0; v < posiciones.count; v += 1) {
      const altura = (posiciones.getY(v) - suelo) / alto;
      const lateral = Math.abs(posiciones.getX(v) - centroX) / alto;
      if (altura < 0.46 || altura > 0.72 || lateral < 0.14) continue;
      revisados += 1;
      if (pesoDeBrazo(v) < 0.8) huerfanos += 1;
    }

    expect(revisados).toBeGreaterThan(500);
    expect(huerfanos).toBe(0);
  });

  it("levanta el brazo sin arrastrar el muslo", () => {
    const posiciones = piel.geometry.getAttribute("position");
    const caja = new THREE.Box3().setFromBufferAttribute(posiciones as THREE.BufferAttribute);
    const alto = caja.max.y - caja.min.y;
    const suelo = caja.min.y;

    let muslo = -1;
    for (let v = 0; v < posiciones.count; v += 1) {
      const altura = (posiciones.getY(v) - suelo) / alto;
      if (altura > 0.44 && altura < 0.46 && posiciones.getX(v) > 0) {
        muslo = v;
        break;
      }
    }
    expect(muslo).toBeGreaterThanOrEqual(0);

    personaje?.aplicar("hombroIzq", 0, 0, 0);
    const reposo = sitio(muslo);
    personaje?.aplicar("hombroIzq", -1.4, 0, 0);
    expect(sitio(muslo).distanceTo(reposo)).toBeLessThan(0.002);
    personaje?.aplicar("hombroIzq", 0, 0, 0);
  });

  it("flexiona la rodilla derecha hacia atras", () => {
    const espinilla = dominante("RightLeg");
    const reposo = sitio(espinilla);
    personaje?.aplicar("rodillaDer", 0.8, 0, 0);
    const pose = sitio(espinilla);
    expect(pose.distanceTo(reposo)).toBeGreaterThan(0.05);
    expect(pose.z).toBeLessThan(reposo.z);
  });
});
