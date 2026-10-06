## SIMULATION UNIT DATA
Este fichero contiene la descripcion de los fichereos de las unidades base de cara a la simulacion

### Origen
Este fichero se crea mediante un proceso semiautomatoca desde los ficheros de data/faction_data_[FACTION],json, contienen una version reducida de los datos, manteniendo los ID's y SLUG para su identifacacion en caso de cambios
Los campos de rules son un proceso de crearion manual, el sistema propone pero es el usuario el que lo define finalmente. Esto permittira durante la simulacion preguntar si se cumplen las condiciones para luego aplicar el/los modificadores
No se usa directamente el fichero de data ya que se deben pasar las reglas a una estrcutura que permita automatizar la simulacion

### Estructura
Los campos y secciones son las siguientes
{
    "id": 47128,
    "slug": "ancient",
    "name": "Ancient",
    "keywords": ["CHARACTER", "INFANTRY", "IMPERIUM", "TACTICUS"],
    "stats": {
        "movement": 6,
        "toughness": 5,
        "save": 3,
        "invulnerableSave": null,
        "wounds": 4,
        "leadership": 6,
        "objectiveControl": 2
    },
    "wargear": [
        {
            "wargearItem": {
                "id": 107454,
                "name": "Ceramite Fists",
                "wargearType": "weapon",
                "count": 1,
                "ruleText": null,
                "profiles": [
                    {
                        "id": 113492,
                        "name": "Ceramite Fists",
                        "type": "melee",
                        "range": "Melee",
                        "attacks": "4",
                        "ballisticSkill": null,
                        "weaponSkill": 3,
                        "strength": "5",
                        "armourPenetration": "0",
                        "damage": "1",
                        "abilities": [
                            {
                                "id": 3383,
                                "name": "HEAVY",
                                "value": null
                            },
                            {
                                "id": 3461,
                                "name": "RAPID FIRE",
                                "value": "1"
                            }
                        ]
                    }
                ]
            }
        }
    ],
    "abilities": [
        {
            "type": "Alone",
            "name": "Honour of the Company",
            "rule": {"condition":"ALWAYS","type":"StatModifier","target":"objectiveControl","value":"+1"}
        },
        {
            "type": "AsLeader",
            "name": "Empower",
            "rule": {"condition":"ALWAYS","type":"ability","target":"LETHAL_HITS","value":null}
        }
    ]
}

### Reglas (`rule`)
`condition` no es un valor de una lista cerrada: es la pregunta, tal cual sale del datasheet, que el sistema le hará al jugador durante la simulación para saber si aplica el modificador. `"ALWAYS"` es el atajo para "no hace falta preguntar, siempre aplica". El sistema puede proponer la pregunta a partir del texto de la habilidad, pero es el usuario quien la redacta/ajusta de forma manual (ver `Origen`).

`type` indica qué clase de efecto aplica el modificador:
- `StatModifier`: cambia el valor de una característica del perfil (ej. `objectiveControl` +1).
- `diceModifier`: modifica el resultado de una tirada sin tocar la característica (ej. +1 a las tiradas de salvación). No es lo mismo que subir el `save` del perfil: a efectos de las reglas de 10ª, un modificador a la tirada y un cambio de característica no siempre se acumulan igual.
- `ability`: concede una habilidad normalizada (de arma o core) al perfil, ej. `LETHAL_HITS`.

`appliesTo` indica quién recibe el efecto. Es opcional y por defecto es `"self"` (la propia unidad) — es el caso mayoritario, así que las reglas que no lo indiquen se interpretan como `"self"`. Valores previstos:
- `self` (default): la propia unidad.
- `enemyInRange`: la unidad enemiga que cumple la `condition` (el rango va dentro del texto de la condición, no en un campo aparte).
- `allyInRange`: unidad aliada que cumple la `condition`.

No se modelan unidades concretas por nombre (ej. "ese Dreadnought en particular"); si una habilidad apunta a una unidad específica y no a "cualquiera en rango", queda fuera de alcance v1.

Ejemplo real, "Unyielding in the Face of the Foe" (Heavy Intercessor Squad), efecto sobre uno mismo:
```json
{
  "type": "Always",
  "name": "Unyielding in the Face of the Foe",
  "rule": {"condition":"Is this unit controlling an objective?","type":"diceModifier","appliesTo":"self","target":"save","value":"+1"}
}
```

Ejemplo real, "Terror Troops" (Aura), efecto sobre otra unidad:
```json
{
  "type": "Always",
  "name": "Terror Troops",
  "rule": {"condition":"Is there an enemy unit within 3\" of this unit?","type":"StatModifier","appliesTo":"enemyInRange","target":"objectiveControl","value":"-1"}
}
```

Los psíquicos (poderes psíquicos, tirada psíquica propia) quedan fuera de alcance en esta primera versión.

## Simulation Data vs Army Data
El fichero de simulacion contiene los datos necesarios para la simulacion pero son genericos, ex: tienen todos los perfiles de armas. Los datos de Army tendran el numero de modelos x unidad, con el wargear seleccionado y quien(es) lideran
### Proceso
El usuario importa una lista de ejercitor en un formato de otra aplicacion (texto, rosz, etc..), el sistema monta el fichero de army basandose en el simulation data + lista ejercito

El montaje de listas (slots, puntos, detachments, opciones de wargear válidas) queda fuera de alcance: se asume que la lista importada ya trae resuelto cuántos modelos hay, con qué wargear y quién lidera a quién. Las variantes internas de un datasheet (ej. el Sargento de una escuadra con un arma distinta a la tropa) no se modelan como sub-perfiles: se tratan como una entrada de wargear más dentro del mismo grupo, ya resuelta por la lista importada.

### Estructura (Army Unit)
Cada unidad desplegada en la partida es una instancia independiente que referencia su "unidad base" (Simulation Unit) por `id`/`slug`, más lo que la lista importada ya resolvió: número de modelos, wargear asignado y enganche de líder/apoyo.

```json
{
  "instanceId": "army-unit-001",
  "name": "Intercessor Squad",
  "points": 170,
  "bodyguard": {
    "baseUnit": { "id": 46861, "slug": "intercessor-squad" },
    "count": 5,
    "wargear": [
      { "wargearItemId": 108237, "count": 4 },
      { "wargearItemId": 109900, "count": 1 }
    ]
  },
  "leader": {
    "baseUnit": { "id": 47128, "slug": "ancient" },
    "wargear": [
      { "wargearItemId": 107454, "count": 1 }
    ]
  },
  "leaderSupport": null
}
```

- `bodyguard`: la unidad base repetida `count` veces; `leader` y `leaderSupport` son `null` o un objeto con la misma forma (sin `count`, siempre 1 modelo).
- `wargear[].wargearItemId` referencia un `wargearItem.id` definido en la Simulation Unit correspondiente (`baseUnit`); los stats, perfiles y habilidades del arma no se duplican aquí, se resuelven en tiempo de simulación contra el catálogo.
- `points` es solo informativo (para mostrarlo en la UI), no se recalcula.

El array `wargear` de la Simulation Unit debe incluir **todo** el wargear posible de la unidad (loadout por defecto + todas las opciones), no solo el loadout por defecto. No se modela qué combinaciones son válidas ni cuántas unidades pueden llevar cada opción (eso lo resuelve la lista importada); el `wargear` de la Simulation Unit actúa como catálogo plano para hacer *matching* por `id` cuando se construye el Army Data.
