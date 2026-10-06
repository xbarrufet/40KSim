# Technology Stack

## Objetivo

40KSim será una aplicación web progresiva para iOS que permite preparar y
simular un combate entre dos unidades de Warhammer 40,000. La aplicación será
estática y autocontenida: no tendrá backend, API propia ni servicios remotos
necesarios durante una partida.

## Tecnologías

- **React** para construir la interfaz por componentes.
- **TypeScript** para tipar los perfiles de unidad, armas, reglas y resultados.
- **Vite** para desarrollo local, transformación de módulos y generación del
  sitio estático de producción.
- **vite-plugin-pwa** y Workbox para generar el manifiesto y el service worker,
  y precargar la aplicación para su uso sin conexión.
- **JSON compacto local** generado por Python a partir de los datos crudos; la
  PWA no importará directamente los datasheets de `data/`.
- **Python** exclusivamente para descargar, extraer y preparar datos; no se
  ejecutará en la PWA ni prestará servicios a la aplicación.

## Arquitectura

Los scripts Python obtienen datos publicados por 40k.app y guardan las
respuestas crudas en `data/`. Un paso de normalización Python transforma esos
datos en un catálogo pequeño en `app/public/data/units.json`. Ese catálogo usa
valores tipados para características, armas y atributos de reglas en lugar de
frases interpretables por la interfaz, por ejemplo `LETHAL_HITS` en vez de
"add LETHAL HITS to Unit". React consume el catálogo y TypeScript realizará los
cálculos de combate en el dispositivo.

El contrato del catálogo incluirá una versión de esquema, facciones y unidades.
Cada unidad tendrá perfiles numéricos, armas y habilidades; los atributos
normalizados se representarán mediante identificadores estables en arrays. La
definición TypeScript de referencia vive en `app/src/data/schema.ts`. Los datos
originales permanecerán separados para poder regenerar el catálogo compacto.

El service worker almacenará la interfaz y el catálogo compacto para que la
aplicación pueda abrirse sin conexión después de su primera carga. Actualizar
los datos requerirá regenerar el JSON y desplegar una nueva compilación. No se
necesita Node.js en el dispositivo donde se instala la PWA; Node.js y npm solo
son herramientas de desarrollo y compilación.

## Límites del sistema

- No se añade servidor, base de datos, API ni autenticación.
- No se ejecuta Python en el cliente.
- La PWA solo consume el catálogo compacto empaquetado y guardado en el
  dispositivo por el navegador.
- Los datos de perfiles y el motor de reglas son responsabilidades distintas:
  los JSON descargados no bastan por sí solos para resolver todas las reglas de
  una partida.

## Comandos previstos

Desde el directorio `app/`:

```bash
cd app
npm install
npm run dev
npm run build
npm run preview
```

Los scripts de Python de descarga se ejecutan por separado con Python 3 y sus
dependencias indicadas en `README.md`.