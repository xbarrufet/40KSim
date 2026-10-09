# Proposal

## Why

The `data/auto_structure.py` script currently requires `ANTHROPIC_API_KEY` and calls the Anthropic API directly, making it unusable for developers who access Claude through AWS Bedrock. Adding Bedrock support lets contributors use their existing AWS credentials without managing a separate Anthropic API key.

## What Changes

- Replace `anthropic.Anthropic(api_key=...)` with `anthropic.AnthropicBedrock(aws_region=...)` when Bedrock mode is active.
- Detect Bedrock mode via `CLAUDE_CODE_USE_BEDROCK=1` environment variable (same convention used by Claude Code itself).
- Read the model ID from `ANTHROPIC_MODEL` env var (falling back to `claude-opus-4-6`) instead of hardcoding it, so the Bedrock inference-profile ARN is picked up automatically.
- Make `ANTHROPIC_API_KEY` optional when Bedrock mode is active; still required for the direct API path.
- Update the script's docstring and error messages to document both execution modes and their requirements.
- Document `pip install "anthropic[bedrock]"` as the dependency for the Bedrock path.

## Capabilities

### New Capabilities

_(none — this is a tooling change to a local data-pipeline script with no effect on app runtime behavior)_

### Modified Capabilities

_(none — no spec-level app behavior changes)_

## Impact

- `data/auto_structure.py`: sole file modified.
- Python dependency: `anthropic[bedrock]` (adds `boto3`) required for the Bedrock path; the existing `anthropic` package continues to suffice for the direct API path.
- AWS environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ANTHROPIC_MODEL`, `CLAUDE_CODE_USE_BEDROCK`) must be set for Bedrock mode; no app code or IndexedDB schema is affected.
