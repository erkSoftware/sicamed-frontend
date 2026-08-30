import * as THREE from "three";

export type PaletaAurora = {
  porcelana: THREE.MeshStandardMaterial;
  porcelanaSombra: THREE.MeshStandardMaterial;
  acero: THREE.MeshStandardMaterial;
  grafito: THREE.MeshStandardMaterial;
  mallaInterna: THREE.MeshStandardMaterial;
  piel: THREE.MeshStandardMaterial;
  pielSombra: THREE.MeshStandardMaterial;
  cabello: THREE.MeshStandardMaterial;
  labio: THREE.MeshStandardMaterial;
  iris: THREE.MeshStandardMaterial;
  pupila: THREE.MeshStandardMaterial;
  esclerotica: THREE.MeshStandardMaterial;
  cable: THREE.MeshStandardMaterial;
};

const texturaCelular = (): THREE.CanvasTexture => {
  const lienzo = document.createElement("canvas");
  lienzo.width = 256;
  lienzo.height = 256;
  const pincel = lienzo.getContext("2d");
  if (pincel) {
    pincel.fillStyle = "#8d8b84";
    pincel.fillRect(0, 0, 256, 256);
    pincel.fillStyle = "#222624";
    for (let fila = 0; fila < 18; fila += 1) {
      for (let columna = 0; columna < 18; columna += 1) {
        const desfase = fila % 2 === 0 ? 0 : 7;
        const x = columna * 14 + desfase + (Math.random() - 0.5) * 3;
        const y = fila * 14 + (Math.random() - 0.5) * 3;
        const radio = 3.6 + Math.random() * 1.6;
        pincel.beginPath();
        pincel.ellipse(x, y, radio, radio * 0.82, Math.random(), 0, Math.PI * 2);
        pincel.fill();
      }
    }
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.repeat.set(3, 3);
  return textura;
};

const texturaPiel = (): THREE.CanvasTexture => {
  const lienzo = document.createElement("canvas");
  lienzo.width = 256;
  lienzo.height = 256;
  const pincel = lienzo.getContext("2d");
  if (pincel) {
    pincel.fillStyle = "#f3ded1";
    pincel.fillRect(0, 0, 256, 256);
    for (let punto = 0; punto < 900; punto += 1) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const alfa = 0.05 + Math.random() * 0.09;
      pincel.fillStyle = `rgba(196, 148, 118, ${alfa})`;
      pincel.beginPath();
      pincel.arc(x, y, 0.6 + Math.random() * 1.1, 0, Math.PI * 2);
      pincel.fill();
    }
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  return textura;
};

export const crearPaleta = (): { paleta: PaletaAurora; desechar: () => void } => {
  const mapaCelular = texturaCelular();
  const mapaPiel = texturaPiel();

  const paleta: PaletaAurora = {
    porcelana: new THREE.MeshStandardMaterial({
      color: 0xf0eee8,
      roughness: 0.29,
      metalness: 0.14,
    }),
    porcelanaSombra: new THREE.MeshStandardMaterial({
      color: 0xdad7ce,
      roughness: 0.38,
      metalness: 0.18,
    }),
    acero: new THREE.MeshStandardMaterial({
      color: 0xb9b6ad,
      roughness: 0.28,
      metalness: 0.72,
    }),
    grafito: new THREE.MeshStandardMaterial({
      color: 0x4a4d48,
      roughness: 0.4,
      metalness: 0.62,
    }),
    mallaInterna: new THREE.MeshStandardMaterial({
      map: mapaCelular,
      bumpMap: mapaCelular,
      bumpScale: 0.4,
      color: 0xa8a59c,
      roughness: 0.62,
      metalness: 0.35,
    }),
    piel: new THREE.MeshStandardMaterial({
      map: mapaPiel,
      color: 0xf6e6db,
      roughness: 0.62,
      metalness: 0.01,
    }),
    pielSombra: new THREE.MeshStandardMaterial({
      color: 0xe8cdbc,
      roughness: 0.66,
      metalness: 0.01,
    }),
    cabello: new THREE.MeshStandardMaterial({
      color: 0xbca987,
      roughness: 0.78,
      metalness: 0.06,
    }),
    labio: new THREE.MeshStandardMaterial({
      color: 0xc3877e,
      roughness: 0.48,
      metalness: 0.02,
    }),
    iris: new THREE.MeshStandardMaterial({
      color: 0x6d8f92,
      roughness: 0.12,
      metalness: 0.06,
    }),
    pupila: new THREE.MeshStandardMaterial({ color: 0x11181a, roughness: 0.08, metalness: 0 }),
    esclerotica: new THREE.MeshStandardMaterial({
      color: 0xf7f4ef,
      roughness: 0.18,
      metalness: 0,
    }),
    cable: new THREE.MeshStandardMaterial({ color: 0x6f6a60, roughness: 0.5, metalness: 0.4 }),
  };

  return {
    paleta,
    desechar: () => {
      Object.values(paleta).forEach((material) => material.dispose());
      mapaCelular.dispose();
      mapaPiel.dispose();
    },
  };
};
