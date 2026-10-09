# Tasks

## 1. Actualizar auto_structure.py

- [x] 1.1 Detectar modo Bedrock mediante `CLAUDE_CODE_USE_BEDROCK` y construir el cliente apropiado: `AnthropicBedrock(aws_region=...)` o `Anthropic(api_key=...)` según corresponda. Verificar que el script importa sin errores en ambas rutas.
- [x] 1.2 Leer el model ID desde `os.environ.get('ANTHROPIC_MODEL', 'claude-opus-4-6')` en lugar del string hardcoded. Verificar que el valor llega correctamente a `client.messages.create`.
- [x] 1.3 Hacer opcional el check de `ANTHROPIC_API_KEY`: solo exigirlo si no está activo el modo Bedrock. Verificar que el script no aborta cuando `ANTHROPIC_API_KEY` está ausente y `CLAUDE_CODE_USE_BEDROCK=1` está presente.
- [x] 1.4 Añadir mensaje de error específico cuando `CLAUDE_CODE_USE_BEDROCK=1` está activo pero `anthropic[bedrock]` no está instalado (capturar `ImportError` de boto3 e imprimir `pip install "anthropic[bedrock]"`). Verificar el mensaje con un entorno sin boto3.
- [x] 1.5 Actualizar el docstring del script para documentar ambos modos (variables de entorno necesarias en cada caso) y el requisito `pip install "anthropic[bedrock]"` para el modo Bedrock. Verificar que `python auto_structure.py --help` (o simplemente leer el docstring) refleja ambas rutas.

## 2. Verificación end-to-end

- [x] 2.1 Ejecutar `python auto_structure.py "Space Marines"` con las variables de Bedrock activas en el entorno y comprobar que genera `data/space-marines/structuring_proposals.json` sin errores.

## Workflow follow-up

- Archivar el change una vez verificada la ejecución en Bedrock.
