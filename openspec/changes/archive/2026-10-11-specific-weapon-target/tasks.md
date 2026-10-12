# Tasks

## 1. Schema

- [x] 1.1 Cambiar `WeaponTarget` en `schema.ts` de `'ALL' | 'RANGE' | 'MELEE'` a `'ALL' | 'RANGE' | 'MELEE' | (string & {})`. Cambiar `DiceModifierEffect.attackType` para usar el mismo tipo. Verificar: `npm run build` pasa sin errores de tipo.

## 2. Helper de nombres de arma

- [x] 2.1 Crear función `getWeaponNames(wargear: WargearEntry[]): { name: string; type: 'ranged' | 'melee' }[]` que extraiga y deduplique nombres de arma del wargear. Ubicación: junto a `preprocessBaseData.ts` o en `schema.ts`. Verificar: la función devuelve las armas correctas para Outrider Squad (Heavy Bolt Pistol, Twin Bolt Rifle, Plasma Pistol como ranged; Chainsword, Power Weapon, Thunder Hammer como melee), sin duplicados.

## 3. Dropdown de arma con opciones específicas

- [x] 3.1 Crear componente `WeaponSelect` que renderice un `<select>` con: opciones genéricas (Todas, Distancia, Cuerpo a Cuerpo), seguidas de optgroups "Distancia" y "Cuerpo a Cuerpo" con los nombres de arma. Props: `value`, `onChange`, `weaponNames`. Verificar: el dropdown muestra las opciones correctas en el navegador.
- [x] 3.2 Pasar `weaponNames` desde `ProcessUnitView` a `StructuringForm` → `EffectFields`. Calcular `weaponNames` con `getWeaponNames(wargear)` en `ProcessUnitView`. Verificar: `npm run build` pasa.
- [x] 3.3 Reemplazar los tres `<select>` de arma fijos en `EffectFields` (en `statModifier`, `diceModifier`, `weaponKeyword`) por el nuevo `WeaponSelect`. Verificar: abrir el formulario de estructuración de una unidad con armas variadas (ej. Outrider Squad) y confirmar que el dropdown muestra las armas específicas agrupadas por tipo.

## 4. Verificación end-to-end

- [x] 4.1 Estructurar "Full-throttle Assault" del Outrider Squad usando armas específicas: Row 1 con weapon=Thunder Hammer (+1 hit, Sustained Hits 1), Row 2 con weapon=Chainsword (+1 D, Sustained Hits 1), Row 3 con weapon=Power Weapon (+1 D, Sustained Hits 1). Guardar y confirmar que los datos se persisten correctamente en IndexedDB. Verificar: recargar la página, editar la habilidad, y confirmar que los valores de arma específica se muestran correctamente en los dropdowns.
- [x] 4.2 Verificar que `npm run build` y `npm run lint` pasan sin errores.
