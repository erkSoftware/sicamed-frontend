import { writeFileSync } from "node:fs";

const DESTINO = process.argv[2];

const semilla = (valor) => () => {
  valor |= 0;
  valor = (valor + 0x6d2b79f5) | 0;
  let t = Math.imul(valor ^ (valor >>> 15), 1 | valor);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const redondear = (valor) => Math.round(valor * 10) / 10;
const par = ([x, y]) => `${redondear(x)} ${redondear(y)}`;
const trazo = (puntos, cerrar = true) =>
  puntos.map(([x, y], i) => `${i === 0 ? "M" : "L"}${redondear(x)} ${redondear(y)}`).join("") + (cerrar ? "Z" : "");

const anchoFoliolo = (t) => Math.sin(Math.PI * t ** 0.55) * (1 - t) ** 0.34;

const foliolo = (origenX, origenY, anguloGrados, largo, ancho, dientes) => {
  const a = (anguloGrados - 90) * (Math.PI / 180);
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy;
  const ny = dx;

  const enEje = (t, desviacion) => [
    origenX + dx * largo * t + nx * desviacion,
    origenY + dy * largo * t + ny * desviacion,
  ];

  const borde = (signo) => {
    const puntos = [];
    for (let i = 0; i <= dientes; i += 1) {
      const t = 0.2 + (i / dientes) * 0.8;
      const w = anchoFoliolo(t) * ancho * signo;
      if (i > 0) {
        const seno = t - 0.62 / dientes;
        const wSeno = anchoFoliolo(seno) * ancho * signo * 0.42;
        puntos.push(enEje(seno, wSeno));
      }
      puntos.push(enEje(t, w));
    }
    return puntos;
  };

  const contorno = [enEje(0.05, 0), ...borde(1), enEje(1.03, 0), ...borde(-1).reverse(), enEje(0.05, 0)];

  const nervios = [trazo([enEje(0.04, 0), enEje(1, 0)], false)];
  for (const t of [0.32, 0.55, 0.78]) {
    for (const signo of [1, -1]) {
      nervios.push(trazo([enEje(t - 0.2, 0), enEje(t, anchoFoliolo(t) * ancho * signo * 0.7)], false));
    }
  }

  return { contorno: trazo(contorno), nervios, punta: enEje(1.03, 0) };
};

const azar = semilla(20260826);

const construirHoja = () => {
  const disposicion = [
    { angulo: 78, largo: 0.46, ancho: 0.086, dientes: 9 },
    { angulo: -78, largo: 0.46, ancho: 0.086, dientes: 9 },
    { angulo: 52, largo: 0.7, ancho: 0.098, dientes: 12 },
    { angulo: -52, largo: 0.7, ancho: 0.098, dientes: 12 },
    { angulo: 26, largo: 0.89, ancho: 0.106, dientes: 14 },
    { angulo: -26, largo: 0.89, ancho: 0.106, dientes: 14 },
    { angulo: 0, largo: 1, ancho: 0.112, dientes: 16 },
  ];

  const escala = 296;
  const foliolos = disposicion.map((item) =>
    foliolo(0, 0, item.angulo, item.largo * escala, item.ancho * escala, item.dientes),
  );

  const peciolo = trazo(
    [
      [0, 0],
      [2.5, 24],
      [0.5, 58],
    ],
    false,
  );

  return { foliolos, peciolo };
};

const construirFlor = () => {
  const alto = 292;
  const radioBase = 76;
  const nodos = 26;
  const piezas = [];

  for (let i = 0; i < nodos; i += 1) {
    const t = i / (nodos - 1);
    const y = -18 - t * alto;
    const perfil = (1 - t) ** 0.42 * (1 + Math.sin(t * Math.PI * 5) * 0.11);
    const cantidad = Math.max(3, Math.round(3 + perfil * 4));
    const desfase = t * 6.1;

    for (let k = 0; k < cantidad; k += 1) {
      const angulo = desfase + (k / cantidad) * Math.PI * 2 + azar() * 0.28;
      const profundidad = Math.cos(angulo);
      const radio = radioBase * perfil * (0.52 + azar() * 0.48);
      const x = Math.sin(angulo) * radio;
      const escorzo = 1 + profundidad * 0.16;
      const tamano = (15 + azar() * 7) * (0.5 + perfil * 0.62) * escorzo;
      const inclinacion = (x / (radioBase * perfil + 1)) * 0.55 + (azar() - 0.5) * 0.18;

      const cos = Math.cos(inclinacion);
      const sen = Math.sin(inclinacion);
      const local = (px, py) => [x + px * cos - py * sen, y + px * sen + py * cos];

      const bractea =
        `M${par(local(0, tamano * 0.5))}` +
        `Q${par(local(-tamano * 0.66, tamano * 0.12))} ${par(local(-tamano * 0.36, -tamano * 0.56))}` +
        `Q${par(local(-tamano * 0.15, -tamano * 1.14))} ${par(local(0, -tamano * 1.26))}` +
        `Q${par(local(tamano * 0.15, -tamano * 1.14))} ${par(local(tamano * 0.36, -tamano * 0.56))}` +
        `Q${par(local(tamano * 0.66, tamano * 0.12))} ${par(local(0, tamano * 0.5))}Z`;

      const pistilos = [];
      if (profundidad > -0.1 && azar() < 0.52) {
        for (const signo of [-1, 1]) {
          const largo = tamano * (0.52 + azar() * 0.46);
          const apertura = 0.5 + azar() * 0.5;
          const salida = local(signo * tamano * 0.1, -tamano * 1.12);
          const control = [salida[0] + signo * largo * 0.22, salida[1] - largo * 0.66];
          const fin = [salida[0] + signo * largo * apertura, salida[1] - largo * 0.86];
          pistilos.push(`M${par(salida)}Q${par(control)} ${par(fin)}`);
        }
      }

      piezas.push({ profundidad, bractea, pistilos });
    }
  }

  piezas.sort((a, b) => a.profundidad - b.profundidad);

  const hojasAzucar = [
    { angulo: 58, largo: 118, y: -30 },
    { angulo: -54, largo: 106, y: -58 },
    { angulo: 66, largo: 78, y: -140 },
  ].map((item) => foliolo(0, item.y, item.angulo, item.largo, item.largo * 0.3, 7).contorno);

  const tallo = trazo(
    [
      [0, 34],
      [2, -60],
      [0, -alto * 0.5],
    ],
    false,
  );

  return {
    bracteas: piezas.map((pieza) => pieza.bractea),
    pistilos: piezas.flatMap((pieza) => pieza.pistilos),
    hojasAzucar,
    tallo,
  };
};

const hoja = construirHoja();
const flor = construirFlor();

const lista = (valores) => valores.map((valor) => `  "${valor}",`).join("\n");

writeFileSync(
  DESTINO,
  `export const HOJA_CONTORNOS: readonly string[] = [
${lista(hoja.foliolos.map((item) => item.contorno))}
];

export const HOJA_NERVIOS: readonly string[] = [
${lista(hoja.foliolos.flatMap((item) => item.nervios))}
];

export const HOJA_PECIOLO = "${hoja.peciolo}";

export const FLOR_TALLO = "${flor.tallo}";

export const FLOR_HOJAS: readonly string[] = [
${lista(flor.hojasAzucar)}
];

export const FLOR_BRACTEAS: readonly string[] = [
${lista(flor.bracteas)}
];

export const FLOR_PISTILOS: readonly string[] = [
${lista(flor.pistilos)}
];
`,
);

console.log(
  `hoja: ${hoja.foliolos.length} foliolos · flor: ${flor.bracteas.length} brácteas, ${flor.pistilos.length} pistilos`,
);
