import * as THREE from "three";
import { crearPaleta } from "./materiales";

export type Articulacion =
  | "cadera"
  | "torso"
  | "pecho"
  | "cuello"
  | "cabeza"
  | "hombroIzq"
  | "codoIzq"
  | "munecaIzq"
  | "hombroDer"
  | "codoDer"
  | "munecaDer"
  | "piernaIzq"
  | "rodillaIzq"
  | "piernaDer"
  | "rodillaDer";

export type Figura = {
  raiz: THREE.Group;
  huesos: Record<Articulacion, THREE.Object3D>;
  boca: THREE.Object3D;
  parpadoIzq: THREE.Object3D;
  parpadoDer: THREE.Object3D;
  acentos: THREE.MeshStandardMaterial[];
  desechar: () => void;
};

const perfil = (puntos: readonly (readonly [number, number])[]) =>
  puntos.map(([radio, altura]) => new THREE.Vector2(radio, altura));

export const crearFigura = (): Figura => {
  const geometrias: THREE.BufferGeometry[] = [];
  const materiales: THREE.Material[] = [];
  const { paleta, desechar: desecharPaleta } = crearPaleta();

  const registrarGeo = <T extends THREE.BufferGeometry>(geo: T): T => {
    geometrias.push(geo);
    return geo;
  };

  const acentos: THREE.MeshStandardMaterial[] = [];
  const acento = () => {
    const material = new THREE.MeshStandardMaterial({
      color: 0xc97a1c,
      roughness: 0.3,
      metalness: 0.5,
      emissive: new THREE.Color(0xf0a93b),
      emissiveIntensity: 0.6,
    });
    materiales.push(material);
    acentos.push(material);
    return material;
  };

  const nodo = (padre: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const grupo = new THREE.Group();
    grupo.position.set(x, y, z);
    padre.add(grupo);
    return grupo;
  };

  const malla = (
    padre: THREE.Object3D,
    geometria: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const objeto = new THREE.Mesh(registrarGeo(geometria), material);
    objeto.position.set(x, y, z);
    objeto.castShadow = true;
    objeto.receiveShadow = true;
    padre.add(objeto);
    return objeto;
  };

  const revolucion = (puntos: readonly (readonly [number, number])[], segmentos = 44) =>
    new THREE.LatheGeometry(perfil(puntos), segmentos);

  const capsula = (radio: number, largo: number) => new THREE.CapsuleGeometry(radio, largo, 5, 20);

  const esferaGeo = (radio: number) => new THREE.SphereGeometry(radio, 28, 22);

  const placa = (ancho: number, alto: number, fondo: number) =>
    new THREE.BoxGeometry(ancho, alto, fondo);

  const raiz = new THREE.Group();

  const cadera = nodo(raiz, 0, 0.9, 0);
  const pelvis = malla(
    cadera,
    revolucion([
      [0.02, -0.14],
      [0.078, -0.128],
      [0.104, -0.086],
      [0.113, -0.03],
      [0.105, 0.014],
      [0.09, 0.046],
      [0.02, 0.055],
    ]),
    paleta.porcelana,
    0,
    0,
    0,
  );
  pelvis.scale.set(1.04, 1, 0.82);
  const entrepierna = malla(cadera, esferaGeo(0.046), paleta.mallaInterna, 0, -0.062, 0.006);
  entrepierna.scale.set(1.85, 0.5, 1.05);
  const placaCaderaIzq = malla(cadera, esferaGeo(0.062), paleta.porcelana, 0.062, -0.05, 0);
  placaCaderaIzq.scale.set(0.7, 0.85, 0.78);
  const placaCaderaDer = malla(cadera, esferaGeo(0.062), paleta.porcelana, -0.062, -0.05, 0);
  placaCaderaDer.scale.set(0.7, 0.85, 0.78);
  const cinturon = malla(cadera, new THREE.TorusGeometry(0.094, 0.008, 12, 40), paleta.acero, 0, 0.024, 0);
  cinturon.rotation.x = Math.PI / 2;
  cinturon.scale.set(1.04, 0.8, 1);
  malla(cadera, placa(0.02, 0.016, 0.01), acento(), 0.052, 0.024, 0.072);
  malla(cadera, placa(0.02, 0.016, 0.01), acento(), -0.052, 0.024, 0.072);

  const torso = nodo(cadera, 0, 0.048, 0);
  const columnaBaja = malla(
    torso,
    revolucion([
      [0.02, -0.012],
      [0.088, -0.004],
      [0.081, 0.05],
      [0.079, 0.1],
      [0.084, 0.142],
      [0.02, 0.15],
    ]),
    paleta.mallaInterna,
    0,
    0,
    0,
  );
  columnaBaja.scale.set(1, 1, 0.8);
  const fajaLumbar = malla(
    torso,
    revolucion([
      [0.02, 0.002],
      [0.092, 0.01],
      [0.086, 0.052],
      [0.02, 0.062],
    ]),
    paleta.porcelanaSombra,
    0,
    0,
    0,
  );
  fajaLumbar.scale.set(1, 1, 0.78);
  const espinazo = malla(torso, capsula(0.02, 0.12), paleta.acero, 0, 0.07, -0.058);
  espinazo.scale.set(1.2, 1, 0.7);

  const pecho = nodo(torso, 0, 0.15, 0);
  const cajaToracica = malla(
    pecho,
    revolucion([
      [0.02, -0.005],
      [0.082, 0.004],
      [0.103, 0.058],
      [0.115, 0.118],
      [0.113, 0.176],
      [0.104, 0.232],
      [0.078, 0.268],
      [0.02, 0.274],
    ]),
    paleta.porcelana,
    0,
    0,
    0,
  );
  cajaToracica.scale.set(1, 1, 0.76);
  const bustoPieza = (x: number) => {
    const pieza = malla(pecho, esferaGeo(0.044), paleta.porcelana, x, 0.113, 0.046);
    pieza.scale.set(1, 0.94, 0.72);
  };
  bustoPieza(0.05);
  bustoPieza(-0.05);
  const surcoCentral = malla(pecho, capsula(0.009, 0.1), paleta.acero, 0, 0.135, 0.078);
  surcoCentral.scale.set(1, 1, 0.6);
  const nucleoPecho = malla(pecho, new THREE.CylinderGeometry(0.017, 0.017, 0.008, 20), acento(), 0, 0.196, 0.072);
  nucleoPecho.rotation.x = Math.PI / 2;
  const pectoralIzq = malla(pecho, esferaGeo(0.058), paleta.porcelana, 0.052, 0.196, 0.03);
  pectoralIzq.scale.set(0.92, 0.5, 0.68);
  const pectoralDer = malla(pecho, esferaGeo(0.058), paleta.porcelana, -0.052, 0.196, 0.03);
  pectoralDer.scale.set(0.92, 0.5, 0.68);
  const collarPecho = malla(
    pecho,
    revolucion([
      [0.058, 0.238],
      [0.082, 0.252],
      [0.086, 0.276],
      [0.062, 0.282],
    ]),
    paleta.porcelana,
    0,
    0,
    0,
  );
  collarPecho.scale.set(1.12, 1, 0.92);
  const respaldo = malla(pecho, revolucion([
    [0.02, 0.02],
    [0.086, 0.03],
    [0.092, 0.12],
    [0.086, 0.22],
    [0.02, 0.25],
  ]), paleta.mallaInterna, 0, 0, -0.03);
  respaldo.scale.set(1, 1, 0.5);
  malla(pecho, placa(0.016, 0.012, 0.008), acento(), 0.072, 0.2, 0.062);
  malla(pecho, placa(0.016, 0.012, 0.008), acento(), -0.072, 0.2, 0.062);

  const cuello = nodo(pecho, 0, 0.272, 0);
  const columnaCuello = malla(
    cuello,
    revolucion([
      [0.02, -0.004],
      [0.05, 0.004],
      [0.043, 0.04],
      [0.041, 0.072],
      [0.045, 0.096],
      [0.02, 0.104],
    ]),
    paleta.mallaInterna,
    0,
    0,
    0,
  );
  columnaCuello.scale.set(1, 1, 0.92);
  const gargantaIzq = malla(cuello, capsula(0.011, 0.07), paleta.porcelana, 0.03, 0.05, 0.022);
  gargantaIzq.rotation.z = 0.12;
  const gargantaDer = malla(cuello, capsula(0.011, 0.07), paleta.porcelana, -0.03, 0.05, 0.022);
  gargantaDer.rotation.z = -0.12;
  const traqueal = malla(cuello, revolucion([
    [0.012, 0.012],
    [0.03, 0.02],
    [0.031, 0.07],
    [0.014, 0.082],
  ]), paleta.porcelana, 0, 0, 0.028);
  traqueal.scale.set(1.1, 1, 0.6);
  const collarInferior = malla(cuello, new THREE.TorusGeometry(0.052, 0.011, 12, 30), paleta.porcelana, 0, 0.006, 0);
  collarInferior.rotation.x = Math.PI / 2;
  collarInferior.scale.set(1.06, 0.9, 1);
  malla(cuello, placa(0.012, 0.01, 0.006), acento(), 0.042, 0.026, 0.03);
  malla(cuello, placa(0.012, 0.01, 0.006), acento(), -0.042, 0.026, 0.03);
  const tendonIzq = malla(cuello, capsula(0.005, 0.06), paleta.cable, 0.024, 0.055, -0.03);
  tendonIzq.rotation.z = 0.16;
  const tendonDer = malla(cuello, capsula(0.005, 0.06), paleta.cable, -0.024, 0.055, -0.03);
  tendonDer.rotation.z = -0.16;

  const cabeza = nodo(cuello, 0, 0.108, 0);
  cabeza.scale.setScalar(0.94);
  const craneo = malla(cabeza, esferaGeo(0.088), paleta.piel, 0, 0.016, -0.006);
  craneo.scale.set(0.9, 1.12, 1.02);
  const mandibula = malla(cabeza, esferaGeo(0.07), paleta.piel, 0, -0.03, 0.01);
  mandibula.scale.set(0.92, 0.9, 0.98);
  const menton = malla(cabeza, esferaGeo(0.03), paleta.piel, 0, -0.074, 0.03);
  menton.scale.set(1, 0.8, 0.96);
  const pomulo = (signo: number) => {
    const pieza = malla(cabeza, esferaGeo(0.023), paleta.pielSombra, 0.049 * signo, -0.012, 0.038);
    pieza.scale.set(0.85, 0.72, 0.66);
  };
  pomulo(1);
  pomulo(-1);
  const frente = malla(cabeza, esferaGeo(0.062), paleta.piel, 0, 0.038, 0.03);
  frente.scale.set(1.05, 0.78, 0.86);

  const casquete = malla(
    cabeza,
    new THREE.SphereGeometry(0.0915, 30, 24, 0, Math.PI * 2, 0, Math.PI * 0.48),
    paleta.cabello,
    0,
    0.024,
    -0.01,
  );
  casquete.scale.set(0.98, 1.06, 1.04);
  casquete.rotation.x = -0.28;
  const nuca = malla(cabeza, esferaGeo(0.076), paleta.cabello, 0, 0.004, -0.038);
  nuca.scale.set(0.98, 1.04, 0.82);
  const raizMono = malla(cabeza, capsula(0.026, 0.02), paleta.cabello, 0, 0.076, -0.062);
  raizMono.rotation.x = -0.6;
  const mono = malla(cabeza, esferaGeo(0.042), paleta.cabello, 0, 0.098, -0.072);
  mono.scale.set(1.04, 0.9, 0.96);
  const trenzaMono = malla(cabeza, new THREE.TorusGeometry(0.034, 0.009, 12, 26), paleta.cabello, 0, 0.098, -0.072);
  trenzaMono.rotation.x = 1.35;
  const mechonIzq = malla(cabeza, capsula(0.006, 0.05), paleta.cabello, 0.062, 0.024, 0.03);
  mechonIzq.rotation.set(0.2, 0, 0.32);
  const mechonDer = malla(cabeza, capsula(0.006, 0.05), paleta.cabello, -0.062, 0.024, 0.03);
  mechonDer.rotation.set(0.2, 0, -0.32);

  const modulo = (signo: number) => {
    const piezas: readonly (readonly [number, number, number, number])[] = [
      [0.22, 0.03, 0.026, 0.018],
      [0.62, 0.026, 0.03, 0.02],
      [1.04, 0.024, 0.026, 0.018],
      [1.44, 0.022, 0.022, 0.016],
    ];
    piezas.forEach(([angulo, largo, alto, fondo], indice) => {
      const y = 0.018 + Math.sin(angulo) * 0.094;
      const z = -0.008 + Math.cos(angulo) * 0.086;
      const bloque = malla(
        cabeza,
        placa(fondo, alto, largo),
        indice % 2 === 0 ? paleta.porcelana : paleta.porcelanaSombra,
        0.077 * signo,
        y,
        z,
      );
      bloque.rotation.set(-angulo + Math.PI / 2, 0, -0.1 * signo);
    });
    const riel = malla(cabeza, capsula(0.005, 0.088), paleta.acero, 0.073 * signo, 0.052, -0.03);
    riel.rotation.set(0.86, 0, -0.12 * signo);
    const sien = malla(cabeza, placa(0.016, 0.018, 0.036), paleta.porcelana, 0.075 * signo, 0.03, 0.038);
    sien.rotation.z = -0.12 * signo;
    malla(cabeza, placa(0.008, 0.008, 0.011), acento(), 0.083 * signo, 0.028, 0.05);
    const cable = malla(cabeza, capsula(0.0032, 0.055), paleta.cable, 0.068 * signo, -0.004, -0.052);
    cable.rotation.set(0.45, 0, 0.28 * signo);
  };
  modulo(1);
  modulo(-1);

  const oreja = (signo: number) => {
    const pieza = malla(cabeza, esferaGeo(0.017), paleta.piel, 0.079 * signo, -0.012, -0.002);
    pieza.scale.set(0.4, 1.16, 0.78);
  };
  oreja(1);
  oreja(-1);

  const cuenca = (signo: number) => {
    const pieza = malla(cabeza, esferaGeo(0.025), paleta.pielSombra, 0.035 * signo, 0.005, 0.053);
    pieza.scale.set(1.04, 0.76, 0.48);
  };
  cuenca(1);
  cuenca(-1);

  const ojoIzq = malla(cabeza, esferaGeo(0.0152), paleta.esclerotica, 0.035, 0.004, 0.0645);
  ojoIzq.scale.set(1.24, 0.92, 0.7);
  const ojoDer = malla(cabeza, esferaGeo(0.0152), paleta.esclerotica, -0.035, 0.004, 0.0645);
  ojoDer.scale.set(1.24, 0.92, 0.7);
  malla(cabeza, esferaGeo(0.008), paleta.iris, 0.0365, 0.003, 0.0722).scale.set(1, 1, 0.68);
  malla(cabeza, esferaGeo(0.008), paleta.iris, -0.0365, 0.003, 0.0722).scale.set(1, 1, 0.68);
  malla(cabeza, esferaGeo(0.0036), paleta.pupila, 0.0368, 0.003, 0.0768);
  malla(cabeza, esferaGeo(0.0036), paleta.pupila, -0.0368, 0.003, 0.0768);

  const parpadoIzq = malla(cabeza, esferaGeo(0.0164), paleta.piel, 0.035, 0.016, 0.063);
  parpadoIzq.scale.set(1.28, 0.22, 0.72);
  const parpadoDer = malla(cabeza, esferaGeo(0.0164), paleta.piel, -0.035, 0.016, 0.063);
  parpadoDer.scale.set(1.28, 0.22, 0.72);

  const pestana = (signo: number) => {
    const pieza = malla(cabeza, placa(0.03, 0.0026, 0.006), paleta.cabello, 0.035 * signo, 0.0125, 0.0705);
    pieza.rotation.z = -0.1 * signo;
  };
  pestana(1);
  pestana(-1);

  const ceja = (signo: number) => {
    const pieza = malla(cabeza, placa(0.03, 0.0042, 0.007), paleta.cabello, 0.036 * signo, 0.028, 0.0672);
    pieza.rotation.z = -0.15 * signo;
  };
  ceja(1);
  ceja(-1);

  const nariz = malla(cabeza, new THREE.ConeGeometry(0.0102, 0.038, 16), paleta.piel, 0, -0.017, 0.0655);
  nariz.rotation.x = Math.PI * 0.54;
  nariz.scale.set(1, 1, 0.56);

  const boca = nodo(cabeza, 0, -0.045, 0.062);
  const labios = malla(boca, esferaGeo(0.0132), paleta.labio, 0, 0, 0);
  labios.scale.set(1.18, 0.44, 0.4);

  const mano = (padre: THREE.Object3D, signo: number) => {
    const palma = malla(padre, capsula(0.021, 0.03), paleta.porcelana, 0, -0.032, 0);
    palma.scale.set(1.05, 1, 0.56);
    const dorso = malla(padre, placa(0.042, 0.042, 0.014), paleta.porcelanaSombra, 0, -0.036, -0.004);
    dorso.rotation.x = 0.04;

    const dedo = (indice: number) => {
      const x = (indice - 1.5) * 0.0118 * signo;
      const largo = indice === 1 || indice === 2 ? 0.028 : 0.024;
      const base = nodo(padre, x, -0.058, 0.002);
      base.rotation.x = -0.12 - indice * 0.02;
      const falangeAlta = malla(base, capsula(0.0052, largo), paleta.porcelana, 0, -largo / 2, 0);
      falangeAlta.scale.set(1, 1, 0.86);
      malla(base, esferaGeo(0.0055), paleta.acero, 0, -largo, 0);
      const media = nodo(base, 0, -largo - 0.002, 0);
      media.rotation.x = -0.22;
      const falangeBaja = malla(media, capsula(0.0045, largo * 0.72), paleta.porcelana, 0, -largo * 0.36, 0);
      falangeBaja.scale.set(1, 1, 0.86);
      malla(media, esferaGeo(0.004), paleta.porcelanaSombra, 0, -largo * 0.74, 0);
    };
    dedo(0);
    dedo(1);
    dedo(2);
    dedo(3);

    const pulgar = nodo(padre, 0.024 * signo, -0.034, 0.008);
    pulgar.rotation.set(-0.3, 0, 0.85 * signo);
    const falangePulgar = malla(pulgar, capsula(0.0058, 0.02), paleta.porcelana, 0, -0.012, 0);
    falangePulgar.scale.set(1, 1, 0.9);
    malla(pulgar, esferaGeo(0.0058), paleta.acero, 0, -0.024, 0);
    const puntaPulgar = nodo(pulgar, 0, -0.026, 0);
    puntaPulgar.rotation.x = -0.25;
    malla(puntaPulgar, capsula(0.005, 0.016), paleta.porcelana, 0, -0.01, 0);
  };

  const brazo = (signo: number) => {
    const hombro = nodo(pecho, 0.126 * signo, 0.216, 0);
    const hombrera = malla(hombro, esferaGeo(0.057), paleta.porcelana, 0.01 * signo, 0.012, 0);
    hombrera.scale.set(0.98, 0.96, 0.94);
    const hombreraBaja = malla(hombro, esferaGeo(0.05), paleta.porcelana, 0.012 * signo, -0.024, 0.004);
    hombreraBaja.scale.set(0.92, 0.72, 0.92);
    malla(hombro, esferaGeo(0.028), paleta.acero, 0, -0.03, 0);
    malla(hombro, placa(0.012, 0.01, 0.008), acento(), 0.05 * signo, -0.014, 0.036);

    const humero = malla(hombro, capsula(0.023, 0.2), paleta.mallaInterna, 0, -0.128, 0);
    humero.scale.set(1, 1, 0.94);
    const placaBrazoAlta = malla(hombro, capsula(0.036, 0.075), paleta.porcelana, 0, -0.088, 0.002);
    placaBrazoAlta.scale.set(1, 1, 0.84);
    const placaBrazoBaja = malla(hombro, capsula(0.031, 0.06), paleta.porcelana, 0, -0.19, 0.002);
    placaBrazoBaja.scale.set(1, 1, 0.84);

    const codo = nodo(hombro, 0, -0.248, 0);
    const juntaCodo = malla(codo, new THREE.CylinderGeometry(0.028, 0.028, 0.05, 22), paleta.acero, 0, 0, 0);
    juntaCodo.rotation.z = Math.PI / 2;
    malla(codo, esferaGeo(0.03), paleta.porcelana, 0, 0.006, 0.012).scale.set(0.84, 1, 0.8);

    const cubito = malla(codo, capsula(0.019, 0.17), paleta.mallaInterna, 0, -0.11, 0);
    cubito.scale.set(1, 1, 0.94);
    const placaAntebrazo = malla(codo, capsula(0.03, 0.085), paleta.porcelana, 0, -0.078, 0.002);
    placaAntebrazo.scale.set(1, 1, 0.82);
    const placaMuneca = malla(codo, capsula(0.025, 0.05), paleta.porcelana, 0, -0.172, 0.002);
    placaMuneca.scale.set(1, 1, 0.82);
    malla(codo, placa(0.01, 0.008, 0.006), acento(), 0.026 * signo, -0.06, 0.024);

    const muneca = nodo(codo, 0, -0.216, 0);
    const juntaMuneca = malla(muneca, new THREE.CylinderGeometry(0.019, 0.019, 0.036, 20), paleta.acero, 0, 0, 0);
    juntaMuneca.rotation.z = Math.PI / 2;
    mano(muneca, signo);

    return { hombro, codo, muneca };
  };

  const brazoIzquierdo = brazo(1);
  const brazoDerecho = brazo(-1);

  const pierna = (signo: number) => {
    const cala = nodo(cadera, 0.072 * signo, -0.1, 0);
    const juntaCadera = malla(cala, esferaGeo(0.048), paleta.porcelana, 0, 0.012, 0);
    juntaCadera.scale.set(1, 0.92, 0.96);
    malla(cala, esferaGeo(0.03), paleta.acero, 0, -0.02, 0);
    const femur = malla(cala, capsula(0.032, 0.32), paleta.mallaInterna, 0, -0.2, 0);
    femur.scale.set(1, 1, 0.96);
    const musloAlto = malla(cala, capsula(0.058, 0.16), paleta.porcelana, 0, -0.13, 0.004);
    musloAlto.scale.set(1, 1, 0.88);
    const musloBajo = malla(cala, capsula(0.046, 0.1), paleta.porcelana, 0, -0.31, 0.004);
    musloBajo.scale.set(1, 1, 0.88);

    const rodilla = nodo(cala, 0, -0.4, 0);
    const juntaRodilla = malla(rodilla, new THREE.CylinderGeometry(0.032, 0.032, 0.052, 22), paleta.acero, 0, 0, 0);
    juntaRodilla.rotation.z = Math.PI / 2;
    const rotula = malla(rodilla, esferaGeo(0.04), paleta.porcelana, 0, 0.004, 0.014);
    rotula.scale.set(0.88, 1, 0.8);

    const tibia = malla(rodilla, capsula(0.024, 0.3), paleta.mallaInterna, 0, -0.19, 0);
    const pantorrilla = malla(rodilla, capsula(0.044, 0.12), paleta.porcelana, 0, -0.12, 0.002);
    pantorrilla.scale.set(1, 1, 0.88);
    const espinilla = malla(rodilla, capsula(0.034, 0.11), paleta.porcelana, 0, -0.28, 0.004);
    espinilla.scale.set(1, 1, 0.86);
    tibia.scale.set(1, 1, 0.94);

    const tobillo = nodo(rodilla, 0, -0.372, 0);
    malla(tobillo, esferaGeo(0.022), paleta.acero, 0, 0, 0);
    const pie = malla(tobillo, placa(0.062, 0.036, 0.148), paleta.porcelana, 0, -0.024, 0.038);
    pie.rotation.x = 0.02;
    const punta = malla(tobillo, capsula(0.026, 0.03), paleta.porcelana, 0, -0.03, 0.104);
    punta.rotation.z = Math.PI / 2;
    punta.scale.set(1, 1, 0.7);
    return { cala, rodilla };
  };

  const piernaIzquierda = pierna(1);
  const piernaDerecha = pierna(-1);

  const huesos: Record<Articulacion, THREE.Object3D> = {
    cadera,
    torso,
    pecho,
    cuello,
    cabeza,
    hombroIzq: brazoIzquierdo.hombro,
    codoIzq: brazoIzquierdo.codo,
    munecaIzq: brazoIzquierdo.muneca,
    hombroDer: brazoDerecho.hombro,
    codoDer: brazoDerecho.codo,
    munecaDer: brazoDerecho.muneca,
    piernaIzq: piernaIzquierda.cala,
    rodillaIzq: piernaIzquierda.rodilla,
    piernaDer: piernaDerecha.cala,
    rodillaDer: piernaDerecha.rodilla,
  };

  return {
    raiz,
    huesos,
    boca,
    parpadoIzq,
    parpadoDer,
    acentos,
    desechar: () => {
      geometrias.forEach((geometria) => geometria.dispose());
      materiales.forEach((material) => material.dispose());
      desecharPaleta();
    },
  };
};
