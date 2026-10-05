# 40KSim

Aplicación en desarrollo para consultar unidades de Warhammer 40,000 y estimar el resultado de un combate entre dos unidades durante una partida. El objetivo es que pueda usarse desde iOS como una aplicación web progresiva (PWA).

## Estado del proyecto

Actualmente, el repositorio contiene scripts Python que recopilan datos publicados en [40k.app](https://www.40k.app) y los guardan como JSON en `data/`. La aplicación iOS/PWA y el motor de simulación todavía están pendientes de implementar.

## Datos disponibles

- `data/factions.json`: facciones agrupadas por categoría.
- `data/units_<faccion>.json`: unidades de una facción, con categoría, URL, slug y puntos cuando están disponibles.
- `data/datasheets_<faccion>.json`: datasheets de unidades, incluidas características, armas y habilidades extraídas.
- `data/faction_data_<faccion>.json`: reglas de ejército y destacamentos de una facción.

En el repositorio hay listas de unidades para varias facciones, pero los datasheets y los datos de facción solo están descargados para Space Marines por ahora.

## Requisitos

- Python 3
- `requests` y `beautifulsoup4`
- Conexión a Internet para descargar datos desde 40k.app

Instala las dependencias con:

```bash
python3 -m pip install requests beautifulsoup4
```

Los scripts también intentan instalar estas dependencias al ejecutarse si no están disponibles.

## Descargar datos

Ejecuta los comandos desde la raíz del repositorio.

Descargar o actualizar la lista de facciones:

```bash
python3 data/fetch_factions.py
```

Descargar las unidades de una facción (requiere `factions.json`):

```bash
python3 data/fetch_units.py "Space Marines"
```

Descargar los datasheets de una facción (requiere su fichero `units_<faccion>.json`):

```bash
python3 data/fetch_datasheets.py "Space Marines"
```

Descargar los datasheets de todas las facciones:

```bash
python3 data/fetch_datasheets.py --all
```

Descargar reglas de ejército y destacamentos de una facción:

```bash
python3 data/fetch_faction_data.py "Space Marines"
```

Para procesar todas las facciones con `fetch_faction_data.py`, usa `--all`. Estas descargas realizan numerosas peticiones y pueden tardar; los scripts incluyen pausas para limitar su frecuencia.

## Objetivo de la aplicación

La primera versión debería permitir:

1. Elegir una unidad atacante y una defensora a partir de los datos locales.
2. Ajustar el tamaño de las unidades y seleccionar las armas que participan.
3. Introducir modificadores relevantes de la partida, como cobertura o habilidades aplicables.
4. Simular las tiradas de ataque, heridas y salvación, y calcular el daño resultante.
5. Mostrar un resultado comprensible, como daño esperado, modelos eliminados y distribución de resultados en varias simulaciones.

Las reglas y modificadores se irán incorporando de forma explícita: los datos descargados son la fuente de perfiles, no un motor de reglas completo. La simulación deberá indicar qué supuestos aplica para que el resultado sea útil durante una partida.

## iOS y PWA

La interfaz se plantea como una aplicación web adaptable a móvil e instalable desde Safari en iOS. Para ofrecer la instalación PWA en un despliegue real se necesitarán, como mínimo, un manifiesto web, un service worker y alojamiento mediante HTTPS. El uso sin conexión podrá cubrir la consulta de los datos previamente descargados cuando se implemente el almacenamiento local.

## Fuente y atribución

Los scripts obtienen datos de [40k.app](https://www.40k.app). No se garantiza que los datos sean completos, estén actualizados o representen todas las reglas aplicables en una partida. Antes de publicar o redistribuir la aplicación o los datos, revisa las condiciones y derechos correspondientes. Este proyecto no está afiliado ni respaldado por Games Workshop ni por 40k.app.
