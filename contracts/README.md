# Contratos OpenAPI

Este directorio guarda los contratos OpenAPI descargados del monorepo del backend, **versionados y fijados**.

`versiones.json` fija la versión exacta de cada contrato. Nunca se usa `latest`.

```
npm run contracts   →  descarga las versiones EXACTAS de versiones.json
                    →  regenera src/shared/api/generado/
                    →  si algo cambió, el diff aparece en el PR
```

Actualizar un contrato es un PR consciente, con su diff visible y su revisión. Nunca una sorpresa en el despliegue.

## Estado actual

El frontend opera hoy en **modo mock** (`VITE_MODO_API=mock`). La capa `src/shared/api/mock/` implementa el mismo contrato de datos que expondrá el backend, con la misma forma de error (RFC 9457 Problem Details con extensión `norma`).

Cuando el backend publique sus OpenAPI:

1. Se colocan aquí los archivos `*-vX.Y.Z.json`.
2. `npm run contracts` genera `src/shared/api/generado/`.
3. Se cambia `VITE_MODO_API=http` y las funciones de `clienteComercial.ts` / `clienteClinico.ts` pasan a delegar en el cliente generado.

El punto de cambio está aislado: los hooks de cada feature no se tocan.
