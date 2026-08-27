const FOLIOLO = "M0 0C-10 -16 -8 -40 0 -58C8 -40 10 -16 0 0Z";
const ANGULOS = [-78, -52, -26, 0, 26, 52, 78] as const;
const ESCALAS = [0.56, 0.74, 0.92, 1, 0.92, 0.74, 0.56] as const;

type Colocacion = {
  x: number;
  y: number;
  escala?: number;
  giro?: number;
};

const Encuadre = ({ escala, children }: { escala: number; children: React.ReactNode }) => (
  <g transform={`translate(${360 - 360 * escala} ${300 - 300 * escala}) scale(${escala})`}>{children}</g>
);

const Hoja = ({ x, y, escala = 1, giro = 0 }: Colocacion) => (
  <g className="relato__hoja" transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
    <path className="relato__peciolo" d="M0 -2V18" />
    {ANGULOS.map((angulo, indice) => (
      <path
        key={angulo}
        className="relato__folio"
        d={FOLIOLO}
        transform={`rotate(${angulo}) scale(1 ${ESCALAS[indice]})`}
      />
    ))}
  </g>
);

const Cogollo = ({ x, y, escala = 1, giro = 0 }: Colocacion) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
    <path
      className="relato__bractea"
      d="M0 0C-15 -5 -18 -20 -13 -30C-18 -40 -10 -50 0 -58C10 -50 18 -40 13 -30C18 -20 15 -5 0 0Z"
    />
    <path className="relato__vena" d="M-13 -30q13 9 26 0M-10 -44q10 7 20 0" />
    <path
      className="relato__pistilo"
      d="M-9 -18c-8 -4 -11 -12 -9 -19M9 -26c8 -3 11 -11 10 -18M-6 -36c-6 -3 -9 -10 -7 -15M7 -44c6 -2 9 -8 8 -13"
    />
  </g>
);

const Bulto = ({ x, y, escala = 1, giro = 0 }: Colocacion) => (
  <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`}>
    <path
      className="relato__masa"
      d="M-34 0q-6 -46 6 -66q-8 -12 4 -14q10 8 24 8q14 0 24 -8q12 2 4 14q12 20 6 66z"
    />
    <path className="relato__linea" d="M-27 -73q27 11 54 0" />
    <rect className="relato__papeleta" x="-17" y="-48" width="34" height="22" rx="3" />
    <path className="relato__linea-fina" d="M-11 -40h22M-11 -34h15" />
  </g>
);

type PropsCampesino = Colocacion & { carga?: boolean };

const Campesino = ({ x, y, escala = 1, carga = false }: PropsCampesino) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    <g className="relato__campesino">
      <path className="relato__masa" d="M-25 0l2 -14h14l3 14z" />
      <path className="relato__masa" d="M6 0l2 -14h14l3 14z" />
      <path className="relato__miembro" d="M-15 -14L-11 -54M17 -14L13 -54" />
      <path className="relato__ruana" d="M-31 -116Q0 -126 31 -116L41 -46Q0 -37 -41 -46Z" />
      <path className="relato__linea" d="M-11 -120L0 -101L11 -120" />
      <path
        className="relato__fleco"
        d="M-37 -46v10M-27 -44v10M-17 -43v10M-6 -42v10M4 -43v10M14 -44v10M25 -45v10M35 -47v10"
      />
      {carga ? (
        <path className="relato__miembro" d="M-33 -112Q-46 -94 -42 -74" />
      ) : (
        <>
          <path className="relato__miembro" d="M-33 -112Q-49 -96 -47 -78" />
          <rect className="relato__masa" x="-68" y="-78" width="28" height="28" rx="8" />
          <path className="relato__linea-fina" d="M-62 -70h16" />
        </>
      )}
      <circle className="relato__piel" cx="2" cy="-130" r="13" />
      <path className="relato__masa" d="M-14 -141q3 -26 17 -26q15 0 16 26z" />
      <ellipse className="relato__masa" cx="3" cy="-141" rx="34" ry="8" />
      <path className="relato__linea-fina" d="M-13 -147q16 7 32 0" />
      {carga ? (
        <>
          <path className="relato__miembro" d="M32 -108Q54 -122 46 -136" />
          <Bulto x={48} y={-130} escala={0.5} giro={-16} />
        </>
      ) : (
        <>
          <path className="relato__mango" d="M88 -120L57 -6" />
          <path className="relato__masa" d="M60 -12l-22 7l7 19l22 -7z" />
          <path className="relato__miembro" d="M33 -110Q58 -98 74 -76" />
        </>
      )}
    </g>
  </g>
);

const Estaca = ({ x, y, texto }: { x: number; y: number; texto: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path className="relato__miembro-fino" d="M0 0V-58" />
    <rect className="relato__papeleta" x="-54" y="-90" width="108" height="30" rx="4" />
    <text className="relato__rotulo" x="0" y="-70" textAnchor="middle">
      {texto}
    </text>
  </g>
);

const Cordillera = () => (
  <g>
    <path
      className="relato__lejano"
      d="M-20 300L60 228L132 266L214 202L288 252L354 212L432 260L500 222L580 266L650 232L740 278L740 300Z"
    />
    <path
      className="relato__cercano"
      d="M-20 300L84 258L168 290L250 246L326 282L412 248L490 288L570 252L652 288L740 258L740 300Z"
    />
    <path
      className="relato__lejano-borde"
      d="M-20 300L84 258L168 290L250 246L326 282L412 248L490 288L570 252L652 288L740 258"
    />
  </g>
);

const Suelo = ({ surcos = false }: { surcos?: boolean }) => (
  <g>
    <path className="relato__horizonte" d="M-20 300H740" />
    {surcos ? (
      <path
        className="relato__surco"
        d="M-10 328q184 -14 368 0t368 0M-14 358q188 -16 376 0t376 0M-18 392q192 -18 384 0t384 0"
      />
    ) : null}
  </g>
);

export const EscenaSiembra = () => (
  <Encuadre escala={1.24}>
    <circle className="relato__astro" cx="586" cy="112" r="34" />
    <Cordillera />
    <Suelo surcos />
    <Estaca x={548} y={300} texto="LOTE-8A9304" />
    <g className="relato__brote">
      <path className="relato__tallo" d="M462 300v-20" />
      <Hoja x={462} y={272} escala={0.34} />
    </g>
    <g className="relato__brote relato__brote--tarde">
      <path className="relato__tallo" d="M604 312v-16" />
      <Hoja x={604} y={290} escala={0.26} />
    </g>
    <Campesino x={312} y={300} />
    <g className="relato__semillas" transform="translate(266 300)">
      <circle cx="0" cy="0" r="3.4" />
      <circle cx="-9" cy="0" r="3.4" />
      <circle cx="7" cy="0" r="3.4" />
    </g>
  </Encuadre>
);

export const EscenaFloracion = () => (
  <Encuadre escala={1.12}>
    <circle className="relato__astro" cx="128" cy="110" r="30" />
    <Cordillera />
    <Suelo surcos />
    <Estaca x={144} y={300} texto="LOTE-8A9304" />
    <g className="relato__planta">
      <path className="relato__tallo-grueso" d="M330 300c-4 -44 4 -78 2 -110" />
      <path className="relato__tallo" d="M330 264c-22 -6 -38 -18 -50 -36M331 232c22 -8 38 -20 48 -38" />
      <path className="relato__tallo" d="M330 288c-16 -4 -28 -10 -38 -20M331 276c16 -4 28 -10 38 -20" />
      <Hoja x={280} y={228} escala={0.92} giro={-42} />
      <Hoja x={379} y={194} escala={0.86} giro={40} />
      <Hoja x={292} y={268} escala={0.62} giro={-26} />
      <Hoja x={369} y={256} escala={0.58} giro={28} />
      <Cogollo x={332} y={190} escala={1.2} />
      <Cogollo x={286} y={214} escala={0.66} giro={-26} />
      <Cogollo x={374} y={180} escala={0.7} giro={22} />
    </g>
    <g className="relato__planta relato__planta--menor">
      <path className="relato__tallo" d="M566 300c-2 -22 2 -38 0 -52" />
      <Hoja x={544} y={264} escala={0.4} giro={-30} />
      <Hoja x={590} y={258} escala={0.38} giro={28} />
      <Cogollo x={566} y={248} escala={0.58} />
    </g>
    <g className="relato__lupa">
      <circle className="relato__cristal" cx="392" cy="146" r="32" />
      <circle className="relato__aro" cx="392" cy="146" r="32" />
      <path className="relato__mango-lupa" d="M415 169L444 198" />
      <path className="relato__brillo" d="M375 132a22 22 0 0 1 14 -8" />
    </g>
  </Encuadre>
);

export const EscenaAcopio = () => (
  <Encuadre escala={1.16}>
    <Cordillera />
    <Suelo />
    <g className="relato__camion">
      <path className="relato__masa" d="M420 276h118v-92h-118z" />
      <path className="relato__linea" d="M456 276v-92M496 276v-92" />
      <rect className="relato__papeleta" x="440" y="204" width="76" height="30" rx="4" />
      <text className="relato__rotulo" x="478" y="224" textAnchor="middle">
        REMISION
      </text>
      <path className="relato__masa" d="M538 276V214h30l22 32h10v30z" />
      <path className="relato__papeleta" d="M546 246V222h18l16 24z" />
      <circle className="relato__rueda" cx="452" cy="280" r="20" />
      <circle className="relato__rueda" cx="566" cy="280" r="20" />
      <circle className="relato__buje" cx="452" cy="280" r="7" />
      <circle className="relato__buje" cx="566" cy="280" r="7" />
      <path className="relato__estela" d="M382 214h30M372 240h26M386 266h24" />
    </g>
    <Bulto x={112} y={300} escala={0.84} />
    <Bulto x={182} y={300} escala={0.96} />
    <Bulto x={252} y={300} escala={0.88} giro={4} />
    <Campesino x={340} y={300} carga />
  </Encuadre>
);

export const EscenaBodega = () => (
  <Encuadre escala={1.04}>
    <path className="relato__nave" d="M52 300V128L360 44l308 84v172" />
    <path className="relato__viga" d="M52 128h616M110 128L360 60M610 128L360 60M236 128V96M484 128V96M360 128V60" />
    <Suelo />
    <g className="relato__estante">
      <path className="relato__linea-gruesa" d="M78 300V150M300 300V150M78 150h222M78 216h222M78 262h222" />
      <rect className="relato__masa" x="94" y="172" width="60" height="44" rx="2" />
      <rect className="relato__masa" x="166" y="180" width="52" height="36" rx="2" />
      <rect className="relato__masa" x="230" y="168" width="58" height="48" rx="2" />
      <rect className="relato__masa" x="96" y="228" width="56" height="34" rx="2" />
      <rect className="relato__masa" x="164" y="222" width="62" height="40" rx="2" />
      <path className="relato__linea-fina" d="M124 172v44M192 180v36M259 168v48M124 228v34M195 222v40" />
      <rect className="relato__papeleta relato__ficha" x="230" y="230" width="58" height="32" rx="3" />
      <path className="relato__linea-fina" d="M240 240h38M240 248h26" />
    </g>
    <g className="relato__estiba">
      <path className="relato__masa" d="M338 300h96l-8 -14h-80z" />
      <rect className="relato__masa" x="348" y="240" width="76" height="46" rx="2" />
      <rect className="relato__masa" x="356" y="204" width="60" height="36" rx="2" />
      <path className="relato__linea-fina" d="M386 240v46M386 204v36" />
    </g>
    <g className="relato__bascula">
      <path className="relato__masa" d="M452 300h132l-12 -22h-108z" />
      <path className="relato__linea-gruesa" d="M570 278V208" />
      <rect className="relato__papeleta" x="534" y="164" width="80" height="46" rx="6" />
      <text className="relato__rotulo relato__rotulo--dato" x="574" y="194" textAnchor="middle">
        148,6 kg
      </text>
      <Bulto x={498} y={278} escala={0.66} />
    </g>
    <g className="relato__medidor">
      <circle className="relato__papeleta" cx="386" cy="124" r="30" />
      <path className="relato__linea-fina" d="M386 104v6M406 124h-6M386 144v-6M366 124h6" />
      <path className="relato__aguja" d="M386 124l14 -12" />
      <text className="relato__rotulo" x="386" y="176" textAnchor="middle">
        18 °C · 55 %
      </text>
    </g>
  </Encuadre>
);

export const EscenaRegistro = () => (
  <Encuadre escala={1}>
    <rect className="relato__ventana" x="428" y="46" width="212" height="142" rx="6" />
    <path className="relato__paisaje" d="M436 180l52 -44l40 30l52 -46l52 60h-196z" />
    <path className="relato__tallo" d="M578 180v-30" />
    <Hoja x={578} y={150} escala={0.34} />
    <path className="relato__linea-fina" d="M534 46v142M428 118h212" />
    <path className="relato__horizonte" d="M-20 386H740" />
    <g className="relato__operario">
      <path className="relato__ruana" d="M180 296q2 -60 44 -60t44 60z" />
      <circle className="relato__piel" cx="226" cy="208" r="21" />
      <path className="relato__cabello" d="M203 209a23 23 0 0 1 46 0z" />
      <path className="relato__miembro" d="M262 250q54 10 92 38" />
    </g>
    <path className="relato__masa" d="M132 296h472v16H132z" />
    <path className="relato__miembro-fino" d="M168 312v74M566 312v74" />
    <g className="relato__portatil">
      <path className="relato__masa" d="M350 296h208l-14 -14H364z" />
      <path className="relato__linea-fina" d="M430 290h48" />
      <path className="relato__pantalla" d="M364 282h180l10 -114H354z" />
      <g className="relato__interfaz">
        <text className="relato__texto-pantalla" x="374" y="196">
          SICAMED
        </text>
        <path className="relato__riel-pantalla" d="M376 230h152" />
        <circle className="relato__nodo-pantalla" cx="380" cy="230" r="6" />
        <circle className="relato__nodo-pantalla" cx="428" cy="230" r="6" />
        <circle className="relato__nodo-pantalla" cx="476" cy="230" r="6" />
        <circle className="relato__nodo-pantalla" cx="524" cy="230" r="6" />
        <path className="relato__linea-pantalla" d="M376 254h122M376 266h84" />
      </g>
    </g>
    <circle className="relato__piel" cx="358" cy="288" r="7" />
    <g className="relato__sello-flotante">
      <rect className="relato__papeleta" x="584" y="232" width="126" height="56" rx="8" />
      <path className="relato__marca-check" d="M600 260l10 10l18 -22" />
      <text className="relato__rotulo relato__rotulo--dato" x="672" y="258" textAnchor="middle">
        8a9304c1
      </text>
      <text className="relato__rotulo" x="672" y="278" textAnchor="middle">
        SELLADO
      </text>
    </g>
  </Encuadre>
);

type PropsDestino = {
  x: number;
  y: number;
  etiqueta: string;
  orden: number;
  children: React.ReactNode;
};

const Destino = ({ x, y, etiqueta, orden, children }: PropsDestino) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="relato__destino" style={{ animationDelay: `${260 + orden * 170}ms` }}>
      {children}
      <text className="relato__rotulo relato__rotulo--destino" x="66" y="6">
        {etiqueta}
      </text>
    </g>
  </g>
);

export const EscenaDestinos = () => (
  <Encuadre escala={1}>
    <g className="relato__nucleo">
      <circle className="relato__nucleo-disco" cx="140" cy="200" r="62" />
      <circle className="relato__nucleo-aro" cx="140" cy="200" r="78" />
      <text className="relato__nucleo-texto" x="140" y="194" textAnchor="middle">
        SICAMED
      </text>
      <text className="relato__nucleo-glosa" x="140" y="216" textAnchor="middle">
        LOTE-8A9304
      </text>
    </g>
    <path className="relato__vinculo" d="M204 178Q280 76 352 72" />
    <path className="relato__vinculo" d="M204 190Q280 146 352 158" />
    <path className="relato__vinculo" d="M204 212Q280 240 352 244" />
    <path className="relato__vinculo" d="M204 224Q280 322 352 330" />
    <circle className="relato__llegada" cx="352" cy="72" r="4.5" />
    <circle className="relato__llegada" cx="352" cy="158" r="4.5" />
    <circle className="relato__llegada" cx="352" cy="244" r="4.5" />
    <circle className="relato__llegada" cx="352" cy="330" r="4.5" />

    <Destino x={404} y={72} etiqueta="DROGUERÍAS Y CADENAS" orden={0}>
      <path className="relato__masa" d="M-38 16h76v-38h-76z" />
      <path className="relato__toldo" d="M-46 -22h92l-12 -18h-68z" />
      <path className="relato__linea-fina" d="M-26 16v-22h22v22" />
      <path className="relato__cruz" d="M14 -14h12v-9h9v9h12v9h-12v9h-9v-9h-12z" />
    </Destino>

    <Destino x={404} y={158} etiqueta="IPS Y HOSPITALES" orden={1}>
      <path className="relato__masa" d="M-38 16v-50h76v50z" />
      <path className="relato__cruz" d="M-6 -34h12v-13h-12z" />
      <path className="relato__linea-fina" d="M-26 -22h16v14h-16zM10 -22h16v14h-16zM-26 0h16v16h-16zM10 0h16v16h-16z" />
    </Destino>

    <Destino x={404} y={244} etiqueta="LABORATORIOS Y EXPORTACIÓN" orden={2}>
      <path className="relato__masa" d="M-34 -36h18v18l18 34h-54l18 -34z" />
      <path className="relato__linea-fina" d="M-38 0h28" />
      <path className="relato__masa" d="M10 16v-30h30v30z" />
      <path className="relato__linea-fina" d="M10 -14l30 30M40 -14l-30 30" />
    </Destino>

    <Destino x={404} y={330} etiqueta="PACIENTE CON FÓRMULA" orden={3}>
      <circle className="relato__piel" cx="-16" cy="-22" r="14" />
      <path className="relato__ruana" d="M-44 16q0 -30 28 -30t28 30z" />
      <path className="relato__masa" d="M20 16v-26h20v26z" />
      <path className="relato__linea-fina" d="M24 -10v-8h12v8" />
    </Destino>
  </Encuadre>
);
