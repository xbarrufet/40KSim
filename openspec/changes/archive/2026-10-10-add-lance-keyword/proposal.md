# Proposal

## Why

La keyword de arma `LANCE` falta en el array `KNOWN_WEAPON_KEYWORDS`. LANCE es una keyword estándar de W40K (las armas con LANCE ganan +1 a la tirada de herida si la unidad ha cargado ese turno). Sin ella, no se puede seleccionar en el formulario de estructuración al crear un efecto `weaponKeyword`.

## What Changes

- Añadir `'LANCE'` al array `KNOWN_WEAPON_KEYWORDS` en `weaponKeywords.ts`, manteniendo el orden alfabético.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

_(ninguna — la lista de keywords de arma es un detalle de implementación, no está enumerada en las specs)_

## Impact

- `app/src/data/weaponKeywords.ts`: Añadir `'LANCE'` al array en orden alfabético (entre `'IGNORES COVER'` y `'LETHAL HITS'`).
- El tipo `KnownAttribute` se actualiza automáticamente por inferencia.
- Sin migración de datos.
