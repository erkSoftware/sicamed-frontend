import * as THREE from "three";
import type { AccionAurora } from "./acciones";
import type { Articulacion } from "./figura";
import { cargarModelo, personajeProcedural } from "./personaje";
import type { Personaje } from "./personaje";
import { crearRitmoGestos } from "./gestos";
import type { Ajuste } from "./gestos";
import { REPOSO_PROCEDURAL, marcoBase, marcoDe } from "./poses";
import type { Marco, Tripleta } from "./poses";

export type Encuadre = "rostro" | "busto" | "completo" | "cuerpo";

export type Luminosidad = "claro" | "oscuro";

export type Vista = "frente" | "tresCuartos" | "perfilIzq" | "perfilDer" | "tresCuartosTrasero" | "espalda";

export type OpcionesEscena = {
  accion: AccionAurora;
  encuadre: Encuadre;
  luminosidad: Luminosidad;
  movimiento: boolean;
  vista?: Vista;
  suelo?: boolean;
  fondoEstudio?: boolean;
  voz?: () => number;
  onOrigen?: (origen: Personaje["origen"]) => void;
};

export type Escena = {
  fijarAccion: (accion: AccionAurora) => void;
  fijarEncuadre: (encuadre: Encuadre) => void;
  fijarLuminosidad: (luminosidad: Luminosidad) => void;
  fijarMovimiento: (activo: boolean) => void;
  fijarVista: (vista: Vista) => void;
  girar: (delta: number) => void;
  desechar: () => void;
};

type Camara = { posicion: THREE.Vector3; objetivo: THREE.Vector3 };

const ENCUADRES: Record<Encuadre, Camara> = {
  rostro: {
    posicion: new THREE.Vector3(0.09, 1.47, 0.94),
    objetivo: new THREE.Vector3(0, 1.44, 0),
  },
  busto: {
    posicion: new THREE.Vector3(0.28, 1.38, 2.05),
    objetivo: new THREE.Vector3(0, 1.2, 0),
  },
  completo: {
    posicion: new THREE.Vector3(0.58, 1.12, 4.15),
    objetivo: new THREE.Vector3(0, 0.88, 0),
  },
  cuerpo: {
    posicion: new THREE.Vector3(0, 0.92, 4.35),
    objetivo: new THREE.Vector3(0, 0.86, 0),
  },
};

const VISTAS: Record<Vista, number> = {
  frente: 0,
  tresCuartos: -Math.PI / 4,
  perfilIzq: -Math.PI / 2,
  perfilDer: Math.PI / 2,
  tresCuartosTrasero: (-Math.PI * 3) / 4,
  espalda: Math.PI,
};

const TINTES = {
  marca: { color: 0xc97a1c, emisivo: 0xf0a93b },
  atencion: { color: 0xb0301c, emisivo: 0xef6a3c },
};

const URL_MODELO = import.meta.env.VITE_MODELO_AURORA ?? "/modelos/aurora.glb";

const SIN_GIRO: Tripleta = [0, 0, 0];

const MIRADA: Partial<Record<Articulacion, Tripleta>> = {
  pecho: [0.015, 0.05, 0],
  cuello: [0.13, 0.19, 0.04],
  cabeza: [0.19, 0.33, 0.1],
};

const ALTURA_ROSTRO: Record<Encuadre, number> = {
  rostro: 0.5,
  busto: 0.42,
  completo: 0.26,
  cuerpo: 0.22,
};

const suavizar = (actual: number, objetivo: number, factor: number) =>
  actual + (objetivo - actual) * factor;

const texturaSombra = () => {
  const lienzo = document.createElement("canvas");
  lienzo.width = 128;
  lienzo.height = 128;
  const pincel = lienzo.getContext("2d");
  if (pincel) {
    const degradado = pincel.createRadialGradient(64, 64, 4, 64, 64, 62);
    degradado.addColorStop(0, "rgba(19, 26, 22, 0.42)");
    degradado.addColorStop(0.55, "rgba(19, 26, 22, 0.16)");
    degradado.addColorStop(1, "rgba(19, 26, 22, 0)");
    pincel.fillStyle = degradado;
    pincel.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(lienzo);
};

export const montarEscena = (lienzo: HTMLCanvasElement, opciones: OpcionesEscena): Escena => {
  const contenedor = lienzo.parentElement ?? lienzo;
  const renderizador = new THREE.WebGLRenderer({
    canvas: lienzo,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderizador.setClearColor(0x000000, 0);
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = THREE.PCFShadowMap;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.05;

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(26, 1, 0.1, 40);
  const soporte = new THREE.Group();
  escena.add(soporte);

  let personaje: Personaje = personajeProcedural();
  soporte.add(personaje.raiz);

  const cielo = new THREE.HemisphereLight(0xffffff, 0xd9e6dd, 1.05);
  escena.add(cielo);

  const clave = new THREE.DirectionalLight(0xfff6e8, 2.1);
  clave.position.set(1.9, 3.1, 2.4);
  clave.castShadow = true;
  clave.shadow.mapSize.set(1024, 1024);
  clave.shadow.camera.near = 0.5;
  clave.shadow.camera.far = 9;
  clave.shadow.camera.left = -1.4;
  clave.shadow.camera.right = 1.4;
  clave.shadow.camera.top = 2.4;
  clave.shadow.camera.bottom = -0.4;
  clave.shadow.bias = -0.0016;
  escena.add(clave);

  const relleno = new THREE.DirectionalLight(0xdfe7ea, 0.62);
  relleno.position.set(-2.4, 1.6, 1.5);
  escena.add(relleno);

  const contra = new THREE.DirectionalLight(0xf5d9b0, 0.9);
  contra.position.set(-1.2, 2.2, -2.6);
  escena.add(contra);

  const mapaSombra = texturaSombra();
  const materialSombra = new THREE.MeshBasicMaterial({
    map: mapaSombra,
    transparent: true,
    depthWrite: false,
  });
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), materialSombra);
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.002;
  sombra.visible = opciones.suelo !== false;
  escena.add(sombra);

  if (opciones.fondoEstudio) {
    escena.background = new THREE.Color(0x3a3d3f);
    materialSombra.opacity = 0.5;
  }

  let accion = opciones.accion;
  let encuadre = opciones.encuadre;
  let movimiento = opciones.movimiento;
  let luminosidad = opciones.luminosidad;
  let giroUsuario = opciones.vista ? VISTAS[opciones.vista] : 0;
  let visible = true;
  let reloj = 0;
  let animacion = 0;
  let ultimo = performance.now();
  let siguienteParpadeo = 1.4;
  let parpadeo = 0;
  let vivo = true;
  let miradaX = 0;
  let miradaY = 0;
  let giroMirada = 0;
  let cabeceoMirada = 0;
  let ajusteGesto: Ajuste = {};

  const ritmoGestos = crearRitmoGestos();

  const marcoActual: Marco = marcoBase();
  const articulaciones = Object.keys(marcoActual.articulaciones) as Articulacion[];

  void cargarModelo(URL_MODELO).then((externo) => {
    if (!vivo || !externo) return;
    soporte.remove(personaje.raiz);
    personaje.desechar();
    personaje = externo;
    soporte.add(personaje.raiz);
    opciones.onOrigen?.(personaje.origen);
  });

  const aplicarLuz = () => {
    const oscuro = luminosidad === "oscuro" && !opciones.fondoEstudio;
    cielo.intensity = oscuro ? 0.55 : 1.05;
    cielo.groundColor.setHex(oscuro ? 0x0b1a12 : 0xd9e6dd);
    clave.intensity = oscuro ? 1.45 : 2.1;
    relleno.intensity = oscuro ? 0.34 : 0.62;
    contra.intensity = oscuro ? 1.3 : 0.9;
    renderizador.toneMappingExposure = oscuro ? 0.92 : 1.05;
  };

  aplicarLuz();

  const medir = () => {
    const ancho = Math.max(1, contenedor.clientWidth);
    const alto = Math.max(1, contenedor.clientHeight);
    renderizador.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  };

  const observadorTamano = new ResizeObserver(medir);
  observadorTamano.observe(contenedor);
  medir();

  const alApuntar = (evento: PointerEvent) => {
    const marco = contenedor.getBoundingClientRect();
    if (marco.width <= 0 || marco.height <= 0) return;
    const centroX = marco.left + marco.width / 2;
    const centroY = marco.top + marco.height * ALTURA_ROSTRO[encuadre];
    miradaX = Math.max(-1, Math.min(1, (evento.clientX - centroX) / (marco.width * 1.6)));
    miradaY = Math.max(-1, Math.min(1, (evento.clientY - centroY) / (marco.height * 0.9)));
  };

  const soltarMirada = () => {
    miradaX = 0;
    miradaY = 0;
  };

  window.addEventListener("pointermove", alApuntar, { passive: true });
  document.addEventListener("pointerleave", soltarMirada);
  window.addEventListener("blur", soltarMirada);

  camara.position.copy(ENCUADRES[encuadre].posicion);
  const objetivoCamara = ENCUADRES[encuadre].objetivo.clone();
  camara.lookAt(objetivoCamara);

  const mezclar = (destino: Marco, fuente: Marco, factor: number) => {
    articulaciones.forEach((clave) => {
      const a = destino.articulaciones[clave];
      const b = fuente.articulaciones[clave];
      const mezcla: Tripleta = [
        suavizar(a[0], b[0], factor),
        suavizar(a[1], b[1], factor),
        suavizar(a[2], b[2], factor),
      ];
      destino.articulaciones[clave] = mezcla;
    });
    destino.boca = suavizar(destino.boca, fuente.boca, factor);
    destino.alturaRaiz = suavizar(destino.alturaRaiz, fuente.alturaRaiz, factor);
    destino.giroRaiz = suavizar(destino.giroRaiz, fuente.giroRaiz, factor);
    destino.deslizRaiz = suavizar(destino.deslizRaiz, fuente.deslizRaiz, factor);
    destino.pulso = suavizar(destino.pulso, fuente.pulso, factor);
    destino.tinte = fuente.tinte;
  };

  const pintar = () => {
    const propio = personaje.origen === "modelo";
    articulaciones.forEach((clave) => {
      const angulo = marcoActual.articulaciones[clave];
      const reposo = propio ? REPOSO_PROCEDURAL[clave] : SIN_GIRO;
      const gesto = ajusteGesto[clave] ?? SIN_GIRO;
      const ganancia = MIRADA[clave] ?? SIN_GIRO;
      personaje.aplicar(
        clave,
        angulo[0] - reposo[0] + gesto[0] + cabeceoMirada * ganancia[0],
        angulo[1] - reposo[1] + gesto[1] + giroMirada * ganancia[1],
        angulo[2] - reposo[2] + gesto[2] - giroMirada * ganancia[2],
      );
    });

    soporte.position.y = marcoActual.alturaRaiz;
    soporte.position.x = marcoActual.deslizRaiz;
    soporte.rotation.y = marcoActual.giroRaiz + giroUsuario;

    const vocal = opciones.voz?.() ?? 0;
    personaje.fijarBoca(Math.max(marcoActual.boca, Math.min(1, vocal) * 0.62));
    personaje.fijarParpadeo(parpadeo);

    const tinte = TINTES[marcoActual.tinte];
    personaje.acentos.forEach((material) => {
      material.color.setHex(tinte.color);
      material.emissive.setHex(tinte.emisivo);
      material.emissiveIntensity = Math.max(0.12, marcoActual.pulso * 0.7);
    });

    sombra.position.x = marcoActual.deslizRaiz;
    materialSombra.opacity =
      (opciones.fondoEstudio ? 0.5 : luminosidad === "oscuro" ? 0.55 : 1) *
      (1 - Math.min(0.5, marcoActual.alturaRaiz * 6));

    const destino = ENCUADRES[encuadre];
    camara.position.lerp(destino.posicion, 0.08);
    objetivoCamara.lerp(destino.objetivo, 0.08);
    camara.lookAt(objetivoCamara);

    renderizador.render(escena, camara);
  };

  const paso = (ahora: number) => {
    animacion = requestAnimationFrame(paso);
    const delta = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (!visible) return;

    if (movimiento) {
      reloj += delta;
      siguienteParpadeo -= delta;
      if (siguienteParpadeo <= 0) {
        parpadeo = 1;
        siguienteParpadeo = 2.4 + Math.random() * 3.4;
      }
      parpadeo = Math.max(0, parpadeo - delta * 7.5);
    } else {
      parpadeo = 0;
    }

    ajusteGesto = ritmoGestos.avanzar(delta, movimiento && accion === "reposo");

    const seguimiento = 1 - Math.exp(-delta * 4.5);
    giroMirada = suavizar(giroMirada, movimiento ? miradaX : 0, seguimiento);
    cabeceoMirada = suavizar(cabeceoMirada, movimiento ? miradaY : 0, seguimiento);

    const objetivo = marcoDe(accion, movimiento ? reloj : 0);
    mezclar(marcoActual, objetivo, movimiento ? 1 - Math.exp(-delta * 7) : 1);
    pintar();
  };

  animacion = requestAnimationFrame(paso);

  const observadorVista = new IntersectionObserver(
    (entradas) => {
      visible = entradas.some((entrada) => entrada.isIntersecting);
    },
    { threshold: 0.02 },
  );
  observadorVista.observe(contenedor);

  const alCambiarPestana = () => {
    visible = !document.hidden;
  };
  document.addEventListener("visibilitychange", alCambiarPestana);

  return {
    fijarAccion: (nueva) => {
      accion = nueva;
    },
    fijarEncuadre: (nuevo) => {
      encuadre = nuevo;
    },
    fijarLuminosidad: (nueva) => {
      luminosidad = nueva;
      aplicarLuz();
    },
    fijarMovimiento: (activo) => {
      movimiento = activo;
    },
    fijarVista: (vista) => {
      giroUsuario = VISTAS[vista];
    },
    girar: (delta) => {
      giroUsuario = Math.max(-Math.PI * 2, Math.min(Math.PI * 2, giroUsuario + delta));
    },
    desechar: () => {
      vivo = false;
      cancelAnimationFrame(animacion);
      observadorTamano.disconnect();
      observadorVista.disconnect();
      window.removeEventListener("pointermove", alApuntar);
      document.removeEventListener("pointerleave", soltarMirada);
      window.removeEventListener("blur", soltarMirada);
      document.removeEventListener("visibilitychange", alCambiarPestana);
      personaje.desechar();
      mapaSombra.dispose();
      materialSombra.dispose();
      sombra.geometry.dispose();
      renderizador.dispose();
    },
  };
};
