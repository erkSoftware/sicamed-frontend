import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { CampoArea, CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useAuth } from "../../../shared/auth/useAuth";
import { aProblema } from "../../../shared/api/problemDetails";
import { DEPARTAMENTOS, TIPOS_PRODUCTO } from "../../../shared/api/mock/catalogos";
import { usePublicarOferta } from "../hooks/useOfertas";

type Formulario = {
  titulo: string;
  tipoProducto: string;
  departamento: string;
  municipio: string;
  disponibilidad: string;
  descripcion: string;
};

type Errores = Partial<Record<keyof Formulario, string>>;

const INICIAL: Formulario = {
  titulo: "",
  tipoProducto: "",
  departamento: "",
  municipio: "",
  disponibilidad: "INMEDIATA",
  descripcion: "",
};

const validarForma = (valores: Formulario): Errores => {
  const errores: Errores = {};
  if (valores.titulo.trim().length < 8)
    errores.titulo = "El título debe tener al menos 8 caracteres.";
  if (!valores.tipoProducto) errores.tipoProducto = "Selecciona el tipo de producto.";
  if (!valores.departamento) errores.departamento = "Selecciona el departamento.";
  if (valores.municipio.trim().length < 3) errores.municipio = "Indica el municipio.";
  if (valores.descripcion.trim().length < 30)
    errores.descripcion = "Describe la oferta con al menos 30 caracteres.";
  return errores;
};

export const CrearOferta = () => {
  const { sesion } = useAuth();
  const navegar = useNavigate();
  const publicar = usePublicarOferta();
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});
  const referenciaError = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicar.error) return;
    const alerta = referenciaError.current?.querySelector<HTMLElement>('[role="alert"]');
    referenciaError.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    alerta?.setAttribute("tabindex", "-1");
    alerta?.focus();
  }, [publicar.error]);

  const actualizar = (campo: keyof Formulario) => (valor: string) =>
    setValores((previos) => ({ ...previos, [campo]: valor }));

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    const encontrados = validarForma(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    publicar.mutate(
      { ...valores, organizacionId: sesion?.usuario.organizacionId ?? "" },
      { onSuccess: () => navegar("/app/vitrina") },
    );
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Nueva oferta"
        subtitulo="Publicar en la vitrina requiere una atestación de licencia vigente para el tipo de producto. El sistema verifica la habilitación en el servidor antes de publicar."
      />

      <div className="rejilla rejilla--2">
        <Tarjeta titulo="Datos de la oferta" descripcion="Los campos marcados con asterisco son obligatorios">
          <form onSubmit={enviar} noValidate className="pila" style={{ gap: "var(--e4)" }}>
            <CampoTexto
              etiqueta="Título de la oferta"
              requerido
              value={valores.titulo}
              error={errores.titulo}
              ayuda="Describe el producto sin incluir cantidades ni condiciones comerciales."
              onChange={(evento) => actualizar("titulo")(evento.target.value)}
            />

            <CampoSelect
              etiqueta="Tipo de producto"
              requerido
              vacio="Selecciona un tipo"
              value={valores.tipoProducto}
              error={errores.tipoProducto}
              opciones={TIPOS_PRODUCTO.map((tipo) => ({ valor: tipo, etiqueta: tipo }))}
              onChange={(evento) => actualizar("tipoProducto")(evento.target.value)}
            />

            <div className="rejilla rejilla--2">
              <CampoSelect
                etiqueta="Departamento"
                requerido
                vacio="Selecciona un departamento"
                value={valores.departamento}
                error={errores.departamento}
                opciones={DEPARTAMENTOS.map((departamento) => ({
                  valor: departamento.nombre,
                  etiqueta: departamento.nombre,
                }))}
                onChange={(evento) => actualizar("departamento")(evento.target.value)}
              />
              <CampoTexto
                etiqueta="Municipio"
                requerido
                value={valores.municipio}
                error={errores.municipio}
                onChange={(evento) => actualizar("municipio")(evento.target.value)}
              />
            </div>

            <CampoSelect
              etiqueta="Disponibilidad"
              value={valores.disponibilidad}
              opciones={[
                { valor: "INMEDIATA", etiqueta: "Inmediata" },
                { valor: "PROGRAMADA", etiqueta: "Programada" },
                { valor: "POR_CAMPAÑA", etiqueta: "Por campaña" },
              ]}
              onChange={(evento) => actualizar("disponibilidad")(evento.target.value)}
            />

            <CampoArea
              etiqueta="Descripción pública"
              requerido
              rows={5}
              value={valores.descripcion}
              error={errores.descripcion}
              ayuda="Este texto es visible sin autenticación. No incluyas datos reservados de carácter comercial."
              onChange={(evento) => actualizar("descripcion")(evento.target.value)}
            />

            <div ref={referenciaError}>
              {publicar.error ? (
                <ErrorNormativo
                  problema={aProblema(publicar.error)}
                  onReintentar={() => publicar.reset()}
                />
              ) : null}
            </div>

            <div className="fila" style={{ gap: "var(--e3)" }}>
              <Boton type="submit" cargando={publicar.isPending}>
                Publicar
              </Boton>
              <Boton type="button" variante="secundario" onClick={() => navegar("/app/vitrina")}>
                Cancelar
              </Boton>
            </div>
          </form>
        </Tarjeta>

        <div className="pila" style={{ gap: "var(--e4)" }}>
          <Tarjeta titulo="Qué verifica el servidor" descripcion="El frontend oculta; el backend prohíbe">
            <ul className="pila" style={{ gap: "var(--e3)", listStyle: "none", padding: 0 }}>
              {[
                "Que exista una atestación de licencia vigente para el tipo de producto.",
                "Que la organización esté habilitada y no suspendida.",
                "Que el contenido publicado solo exponga campos clasificados como públicos.",
                "Que el hecho quede sellado en la cadena de trazabilidad.",
              ].map((texto) => (
                <li key={texto} className="fila" style={{ gap: "var(--e3)", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--verde-600)", marginTop: 2 }}>
                    <Icono nombre="check" tamano={16} />
                  </span>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta titulo="Qué nunca se publica" descripcion="Información reservada de carácter comercial">
            <ul className="pila" style={{ gap: "var(--e3)", listStyle: "none", padding: 0 }}>
              {[
                "Cantidades exactas y capacidad productiva.",
                "Datos de contacto antes de habilitar el canal.",
                "Condiciones económicas de ningún tipo.",
              ].map((texto) => (
                <li key={texto} className="fila" style={{ gap: "var(--e3)", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--rojo-600)", marginTop: 2 }}>
                    <Icono nombre="cerrar" tamano={16} />
                  </span>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
};
