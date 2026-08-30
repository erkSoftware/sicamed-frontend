import { Figura, Planta, Pulso, demora } from "./piezas";

const SIEMBRA = [
  { x: 62, y: 246, escala: 1.24, retardo: 0 },
  { x: 122, y: 258, escala: 1.42, retardo: 180 },
  { x: 188, y: 248, escala: 1.28, retardo: 340 },
  { x: 252, y: 262, escala: 1.5, retardo: 120 },
  { x: 318, y: 250, escala: 1.3, retardo: 420 },
  { x: 372, y: 262, escala: 1.44, retardo: 260 },
];

export const EscenaCultivo = () => (
  <svg viewBox="0 0 420 300" className="telemed__lamina" aria-hidden="true">
    <g className="telemed__capa" data-capa="fondo">
      <path
        className="telemed__cresta"
        d="M-10 118 L74 78 L146 108 L214 66 L292 104 L366 74 L430 100"
      />
      <path className="telemed__cresta" d="M-10 158 L68 126 L152 156 L236 120 L318 152 L430 128" />
      <path className="telemed__horizonte" d="M-10 190 L430 190" />
    </g>
    <g className="telemed__capa" data-capa="medio">
      <path className="telemed__surco" d="M-10 214 Q210 196 430 214" />
      <path className="telemed__surco" d="M-10 236 Q210 216 430 236" />
      <path className="telemed__surco" d="M-10 264 Q210 240 430 264" />
      {SIEMBRA.map((planta) => (
        <Planta key={`${planta.x}`} {...planta} />
      ))}
    </g>
    <g className="telemed__capa" data-capa="frente">
      <Figura x={286} y={244} escala={0.78} sombrero />
      <g transform="translate(316 244)">
        <g className="telemed__cesta">
          <path className="telemed__trazo" d="M-14 -18 L14 -18 L10 0 L-10 0 Z" />
          <path className="telemed__trazo" d="M-14 -18 q14 -12 28 0" />
        </g>
      </g>
      <g transform="translate(74 200)">
        <g className="telemed__ficha" style={demora(900)}>
          <rect className="telemed__ficha-caja" x="0" y="0" width="104" height="38" rx="3" />
          <path className="telemed__ficha-linea" d="M11 14 H62" />
          <path className="telemed__ficha-linea" d="M11 25 H44" />
          <path className="telemed__ficha-marca" d="M78 21 l5 6 l11 -13" />
        </g>
      </g>
    </g>
  </svg>
);

const VIALES = [
  { x: 44, alto: 22 },
  { x: 66, alto: 30 },
  { x: 88, alto: 18 },
];

export const EscenaLaboratorio = () => (
  <svg viewBox="0 0 420 300" className="telemed__lamina" aria-hidden="true">
    <g className="telemed__capa" data-capa="fondo">
      <path className="telemed__horizonte" d="M-10 96 L430 96" />
      <g transform="translate(232 44)">
        <g className="telemed__pantalla">
          <rect className="telemed__ficha-caja" x="0" y="0" width="164" height="104" rx="4" />
          <path
            className="telemed__traza"
            d="M12 82 L34 80 L46 44 L58 78 L74 76 L88 30 L102 74 L120 72 L134 56 L152 70"
          />
          <path className="telemed__ficha-linea" d="M12 94 H152" />
        </g>
      </g>
    </g>
    <g className="telemed__capa" data-capa="medio">
      <path className="telemed__horizonte" d="M-10 244 L430 244" />
      <g transform="translate(150 118)">
        <g className="telemed__molecula">
          <path className="telemed__trazo" d="M0 -26 L22 -13 L22 13 L0 26 L-22 13 L-22 -13 Z" />
          <circle className="telemed__nodo-molecula" cx="0" cy="-26" r="3.4" />
          <circle className="telemed__nodo-molecula" cx="22" cy="13" r="3.4" />
          <circle className="telemed__nodo-molecula" cx="-22" cy="13" r="3.4" />
        </g>
      </g>
      <g transform="translate(60 244)">
        <path className="telemed__vidrio" d="M-6 -54 L-6 -34 L-24 0 L24 0 L6 -34 L6 -54 Z" />
        <path className="telemed__liquido" d="M-17 -12 L17 -12 L24 0 L-24 0 Z" />
        <path className="telemed__trazo" d="M-9 -56 L9 -56" />
      </g>
      <g transform="translate(160 244)">
        {VIALES.map((vial) => (
          <g key={vial.x}>
            <rect className="telemed__vidrio" x={vial.x} y={-34} width="13" height="34" rx="2" />
            <rect
              className="telemed__liquido"
              x={vial.x}
              y={-vial.alto}
              width="13"
              height={vial.alto}
              rx="2"
            />
          </g>
        ))}
      </g>
    </g>
    <g className="telemed__capa" data-capa="frente">
      <Figura x={330} y={244} escala={0.8} bata />
      <g transform="translate(24 262)">
        <g className="telemed__ficha" style={demora(700)}>
          <rect className="telemed__ficha-caja" x="0" y="0" width="120" height="30" rx="3" />
          <path className="telemed__ficha-linea" d="M11 11 H70" />
          <path className="telemed__ficha-linea" d="M11 21 H52" />
          <path className="telemed__ficha-marca" d="M94 17 l5 6 l11 -13" />
        </g>
      </g>
    </g>
  </svg>
);

export const EscenaIps = () => (
  <svg viewBox="0 0 420 300" className="telemed__lamina" aria-hidden="true">
    <g className="telemed__capa" data-capa="fondo">
      <path className="telemed__horizonte" d="M-10 92 L430 92" />
      <path className="telemed__horizonte" d="M-10 252 L430 252" />
      <path className="telemed__cresta" d="M330 92 L330 252" />
    </g>
    <g className="telemed__capa" data-capa="medio">
      <g transform="translate(112 62)">
        <rect className="telemed__ficha-caja" x="0" y="0" width="196" height="126" rx="4" />
        <path className="telemed__ficha-linea" d="M0 24 H196" />
        <g className="telemed__consulta">
          <circle className="telemed__trazo" cx="42" cy="62" r="13" />
          <path className="telemed__trazo" d="M22 92 q20 -20 40 0" />
        </g>
        <path className="telemed__ficha-linea" d="M80 48 H176" />
        <path className="telemed__ficha-linea" d="M80 64 H160" />
        <path className="telemed__ficha-linea" d="M80 80 H172" />
        <path className="telemed__ficha-linea" d="M80 96 H138" />
        <circle className="telemed__testigo" cx="14" cy="12" r="3.4" />
        <path className="telemed__ficha-linea" d="M26 12 H92" />
      </g>
      <path className="telemed__enlace-escena" d="M210 188 L210 214" />
    </g>
    <g className="telemed__capa" data-capa="frente">
      <Figura x={70} y={252} escala={0.74} bata />
      <Figura x={356} y={252} escala={0.74} />
      <g transform="translate(150 218)">
        <g className="telemed__ficha" style={demora(600)}>
          <rect className="telemed__ficha-caja" x="0" y="0" width="122" height="34" rx="3" />
          <path className="telemed__ficha-marca" d="M14 17 l5 6 l11 -13" />
          <path className="telemed__ficha-linea" d="M42 13 H108" />
          <path className="telemed__ficha-linea" d="M42 24 H86" />
        </g>
      </g>
    </g>
  </svg>
);

export const EscenaPaciente = () => (
  <svg viewBox="0 0 420 300" className="telemed__lamina" aria-hidden="true">
    <g className="telemed__capa" data-capa="fondo">
      <Pulso x={210} y={168} radio={62} />
      <Pulso x={210} y={168} radio={62} retardo={1200} />
      <path className="telemed__horizonte" d="M-10 252 L430 252" />
    </g>
    <g className="telemed__capa" data-capa="medio">
      <Figura x={210} y={252} escala={1.05} />
      <g transform="translate(276 214)">
        <rect className="telemed__vidrio" x="0" y="0" width="26" height="40" rx="3" />
        <rect className="telemed__liquido" x="0" y="14" width="26" height="26" rx="3" />
        <path className="telemed__trazo" d="M8 0 L8 -8 L18 -8 L18 0" />
        <path className="telemed__ficha-linea" d="M5 22 H21" />
        <path className="telemed__ficha-linea" d="M5 30 H16" />
      </g>
    </g>
    <g className="telemed__capa" data-capa="frente">
      <g transform="translate(58 200)">
        <g className="telemed__ficha" style={demora(500)}>
          <rect className="telemed__ficha-caja" x="0" y="0" width="112" height="56" rx="3" />
          <path className="telemed__ficha-linea" d="M12 16 H74" />
          <path className="telemed__ficha-linea" d="M12 28 H58" />
          <path className="telemed__ficha-linea" d="M12 40 H88" />
          <path className="telemed__ficha-marca" d="M86 36 l5 6 l11 -13" />
        </g>
      </g>
    </g>
  </svg>
);
