# Design

## Context

`data/auto_structure.py` is a standalone developer script (not part of the app runtime). It instantiates `anthropic.Anthropic(api_key=...)` unconditionally and exits early if `ANTHROPIC_API_KEY` is absent. The Anthropic Python SDK ships with a separate `AnthropicBedrock` client that authenticates via standard AWS credential chain rather than an API key. Claude Code itself uses `CLAUDE_CODE_USE_BEDROCK=1` as the canonical flag to switch between the two paths, so reusing that convention keeps the script consistent with the rest of the developer tooling.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Support Bedrock as a drop-in alternative to the direct Anthropic API with zero code changes for users who set the right env vars.
- Reuse the same env-var convention already in use by Claude Code (`CLAUDE_CODE_USE_BEDROCK`, `ANTHROPIC_MODEL`, `AWS_REGION`).
- Keep the direct-API path unchanged for contributors without AWS credentials.

**Non-Goals:**
- Supporting other cloud providers or proxies.
- Changing the script's output format or processing logic.
- Adding a CLI flag or config file — env vars are sufficient.

## Decisions

### 1. Detection via `CLAUDE_CODE_USE_BEDROCK`

**Decision:** Switch to `AnthropicBedrock` when `CLAUDE_CODE_USE_BEDROCK=1` is set in the environment.

**Rationale:** This is the same flag Claude Code uses, so developers who have already configured their shell for Claude Code get the script working for free. Alternatives considered:
- Detecting the absence of `ANTHROPIC_API_KEY`: fragile — a user might have both set.
- A dedicated `--bedrock` CLI flag: adds friction and diverges from the pattern.

### 2. Region from `AWS_REGION`

**Decision:** Pass `aws_region=os.environ.get('AWS_REGION', 'us-east-1')` to `AnthropicBedrock`.

**Rationale:** `AnthropicBedrock` requires an explicit region. Reading it from `AWS_REGION` is consistent with the rest of the AWS SDK ecosystem. The `AnthropicBedrock` client also reads AWS credentials from the environment automatically (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`), so no extra handling is needed for those.

### 3. Model from `ANTHROPIC_MODEL`

**Decision:** Replace the hardcoded `'claude-opus-4-6'` with `os.environ.get('ANTHROPIC_MODEL', 'claude-opus-4-6')`.

**Rationale:** Bedrock model IDs are inference-profile ARNs (e.g. `arn:aws:bedrock:…`), not the short model names. Reading from the env var that the user already has set avoids duplication. For the direct API path the fallback to `'claude-opus-4-6'` preserves existing behavior.

### 4. Dependency: `anthropic[bedrock]`

**Decision:** Document `pip install "anthropic[bedrock]"` as the Bedrock-path requirement; keep the existing `pip install anthropic` sufficient for the direct path.

**Rationale:** `boto3` (the AWS SDK) is a heavyweight dependency that most contributors don't need. Making it optional via the extras mechanism keeps the baseline install light.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `AnthropicBedrock` constructor signature changes in a future SDK version | Pin or document the minimum `anthropic` version that ships `AnthropicBedrock` (currently available since `anthropic>=0.21`) |
| User has `CLAUDE_CODE_USE_BEDROCK=1` set but not `anthropic[bedrock]` installed | Script will fail at import time with a clear `ImportError`; add a targeted error message that points to `pip install "anthropic[bedrock]"` |
| Inference-profile ARN includes `[1m]` suffix which may not be valid in all contexts | No mitigation needed in the script — the SDK passes the value as-is; the user controls the ARN |
