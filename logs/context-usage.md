═══════════════════════════════════════════════════════════════════════════
Token Analysis: Session ses_0ec7a1625ffetJrXltKTZ0dAq3
Model: mimo-v2.5-free
═══════════════════════════════════════════════════════════════════════════

WARNINGS
───────────────────────────────────────────────────
- Model 'opencode/mimo-v2.5-free' is not currently supported by a model-specific tokenizer. Token counts use an approximate character-based fallback.
- Could not fetch the OpenCode skill catalog. Available-skill system-prompt estimates were skipped.

TOKEN BREAKDOWN BY CATEGORY
─────────────────────────────────────────────────────────────────────────
Locally tokenized retained message content (estimate):
This is a content inventory, not billable usage or an exact active-context snapshot.
Generated system prompts, provider framing, tool-call arguments, and media are not included.

Input Categories:
  USER      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      3.5% (2,286)
  TOOLS     █████████████████████████████░    96.5% (63,050)

  Subtotal: 65,336 estimated input tokens

Output Categories:
  ASSISTANT ███░░░░░░░░░░░░░░░░░░░░░░░░░░░     11.1% (1,797)
  REASONING ███████████████████████████░░░    88.9% (14,375)

  Subtotal: 16,172 estimated output tokens

Local Content Total: 81,508 tokens (estimated)

TOOL USAGE BREAKDOWN
─────────────────────────────────────────────────────────────────────────
read                 █████████████████████░░░░░░░░░    69.2% (43,662)   36x
bash                 ███████░░░░░░░░░░░░░░░░░░░░░░░    23.4% (14,729)   41x
tokenscope           █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      4.3% (2,729)   15x
skill                █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      3.0% (1,910)    3x
glob                 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         0.0% (16)    4x
task                 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          0.0% (4)    1x

TOP CONTRIBUTORS
─────────────────────────────────────────────────────────────────────────
• read                         43,662 tokens (53.6%)
• bash                         14,729 tokens (18.1%)
• tokenscope                   2,729 tokens (3.3%)
• skill                        1,910 tokens (2.3%)
• User#1                       1,307 tokens (1.6%)

═══════════════════════════════════════════════════════════════════════════
MOST RECENT RECORDED PROVIDER STEP
─────────────────────────────────────────────────────────────────────────

Raw telemetry from last API response:
  Input (fresh):            955 tokens
  Cache read:           126,272 tokens
  Output:                   474 tokens
  Reasoning:                 38 tokens
  Provider total:       127,739 tokens
  ─────────────────────────────────────
  Total:                127,739 tokens

═══════════════════════════════════════════════════════════════════════════
RECORDED USAGE SNAPSHOT (70 completed provider steps)
─────────────────────────────────────────────────────────────────────────

Assistant messages observed: 75 (structural count)

Recoverable usage recorded before this TokenScope tool invocation completes:

  Input tokens:       3,064,304 (fresh tokens across all calls)
  Cache read:           128,064 (cached tokens across all calls)
  Cache write:                0 (tokens written to cache)
  Output tokens:          3,406 (all model responses)
  Reasoning tokens:      14,281 (thinking/reasoning)
  ─────────────────────────────────────
  Recorded Total:     3,210,055 tokens (non-overlapping usage buckets)
  Cache read calls:           2 / 70
  Cache write calls:          0 / 70

═══════════════════════════════════════════════════════════════════════════
ESTIMATED API-RATE COST (OpenCode recorded $0)
─────────────────────────────────────────────────────────────────────────

A zero OpenCode-recorded cost can mean subscription, free/local usage, or zero/missing pricing metadata.
The public API-rate estimate is shown separately; it is not an invoice.

  opencode/north-mini-code-free (68 calls): $0.0000
    Input tokens:       2,938,839 × $0.00/M  = $0.0000
    Output tokens:         16,529 × $0.00/M  = $0.0000
  opencode/mimo-v2.5-free (2 calls): $0.0000
    Input tokens:         125,465 × $0.00/M  = $0.0000
    Output tokens:          1,158 × $0.00/M  = $0.0000
    Cache read:           128,064 × $0.00/M  = $0.0000

  Blended input:      $0.0000
  Blended output:     $0.0000
  Blended cache read: $0.0000
─────────────────────────────────────────────────────────────────────────
ESTIMATED TOTAL: $0.0000

Note: This estimate uses live OpenCode model metadata when available, then bundled models.json pricing.
Actual API costs may vary based on provider and context size.

═══════════════════════════════════════════════════════════════════════════
AVAILABLE SUBAGENTS (in task tool definition)
─────────────────────────────────────────────────────────────────────────

These subagents are embedded in the task tool description whenever that tool is enabled for a provider request.

  Subagent               Description                                        Tokens
  ───────────────────────────────────────────────────────────────────────
  explore                Fast agent specialized for exploring codebases. U…    ~124
  general                General-purpose agent for researching complex que…     ~40
  ───────────────────────────────────────────────────────────────────────
  Total: ~164 tokens (2 subagents available)

  Note: Full task tool description is ~755 tokens (includes instructions/examples).

═══════════════════════════════════════════════════════════════════════════
LOADED SKILLS (on-demand content)
─────────────────────────────────────────────────────────────────────────

Skills loaded during this session via the skill tool.

  Skill                  Message #     Tokens     Calls
  ─────────────────────────────────────────────────────
  improve-codebase-arch…        #41      1,416        1x
  ─────────────────────────────────────────────────────
  Total: 1,416 tokens (1 skill loaded)

  Note: Skill results are protected from tool-output pruning; full session compaction can still remove older loads from active context.

═══════════════════════════════════════════════════════════════════════════
TOOL DEFINITION COSTS (Tokenized from OpenCode tool metadata)
─────────────────────────────────────────────────────────────────────────

  Tool                Est. Tokens   Args   Complexity
  ───────────────────────────────────────────────────────────────────
  bash                     ~1,491       3   simple
  task                       ~998       5   simple
  todowrite                  ~734       1   complex (arrays/objects)
  question                   ~536       1   complex (arrays/objects)
  websearch                  ~536       5   simple
  edit                       ~523       4   simple
  read                       ~464       3   simple
  webfetch                   ~358       3   simple
  grep                       ~319       3   simple
  glob                       ~297       2   simple
  write                      ~276       2   simple
  tokenscope                 ~205       3   simple
  skill                      ~182       1   simple
  invalid                     ~82       2   simple
  ───────────────────────────────────────────────────────────────────
  Total:             ~      7,001 tokens (14 tools returned by metadata)

  Note: Tokenized from the current OpenCode tool descriptions and JSON schemas.
        Active-agent permissions, MCP tools, and provider schema transforms may differ.

═══════════════════════════════════════════════════════════════════════════
CACHE EFFICIENCY
─────────────────────────────────────────────────────────────────────────

  Token Distribution:
    Cache Read:           128,064 tokens   █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  4.0%
    Fresh Input:        3,064,304 tokens   █████████████████████████████░  96.0%
  ───────────────────────────────────────────────────────────────────
  Cache Hit Rate:      4.0% (cache read / (cache read + fresh input))

  Cost Analysis (per-model pricing across 2 models):
    Without caching:   $0.0000
    With caching:      $0.0000
  ───────────────────────────────────────────────────────────────────
  Cost Savings:        $0.0000  (0.0% reduction)
  Effective Rate:      $0.00/M tokens  (vs. $0.00/M standard)

═══════════════════════════════════════════════════════════════════════════
SUBAGENT COSTS (1 child sessions, 17 completed provider steps)
─────────────────────────────────────────────────────────────────────────

Displayed subagent costs use estimated API-rate cost.

  explore                      $0.0000  (293,238 tokens, 17 steps)
─────────────────────────────────────────────────────────────────────────
Subagent Total:            $0.0000  (293,238 tokens, 17 steps)

═══════════════════════════════════════════════════════════════════════════
SUMMARY
─────────────────────────────────────────────────────────────────────────

  Cost basis: OpenCode-recorded where nonzero; otherwise estimated API-rate cost.

                          Cost        Tokens      Provider Steps
  Main session:      $    0.0000     3,210,055            70
  Subagents:         $    0.0000       293,238            17
─────────────────────────────────────────────────────────────────────────
  TOTAL:             $    0.0000     3,503,293            87

═══════════════════════════════════════════════════════════════════════════