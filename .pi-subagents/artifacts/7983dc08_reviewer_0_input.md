# Task for reviewer

[Read from: C:\Users\PC\genlayer-project-boilerplate\plan.md, C:\Users\PC\genlayer-project-boilerplate\progress.md]

You are performing a **Standards axis code review** of the changes in the current dev branch.

**Fixed point**: `e685f1f`
**Diff command**: `git diff e685f1f...HEAD`
**Commit list**:
- 3e3260f test: encapsulate direct VM internals and fix private access smells in reward tests
- ac95c5c refactor: simplify True/False stake branching in FactChecker contract
- cb23f78 test: add multi-winner reward proportional payout test
- 5a5c10f feat: add AI FactChecker prediction market contract with direct tests

**Files changed**: `contracts/fact_checker.py`, `docs/specs/fact_checker_spec.md`, `tests/direct/test_fact_checker.py`.

**Standards sources**:
1. `CLAUDE.md` in the repo root — project-specific guidance for GenLayer contracts and tests.
2. `pyproject.toml` — Python project/test configuration.
3. Baseline smell baseline (always applies unless overridden by repo docs):
- Mysterious Name — function/variable/type name doesn't reveal intent → rename.
- Duplicated Code — same logic shape in more than one hunk/file → extract.
- Feature Envy — method reaches into another object's data more than its own → move it.
- Data Clumps — same few fields/params travel together → bundle into a type.
- Primitive Obsession — primitive/string stands in for a domain concept → give it a type.
- Repeated Switches — same if/switch cascade on same type recurs → replace with polymorphism or shared map.
- Shotgun Surgery — one logical change forces scattered edits across many files → gather.
- Divergent Change — one file edited for several unrelated reasons → split.
- Speculative Generality — abstraction/parameters/hooks added for needs the spec doesn't have → delete.
- Message Chains — long a.b().c().d() navigation → hide behind one method.
- Middle Man — class/function mostly delegates onward → cut it.
- Refused Bequest — subclass ignores most of inherited behavior → drop inheritance.

**Brief**: Report per file/hunk where relevant: (a) every place the diff violates a documented standard — cite the standard file and the rule; and (b) any baseline smell you spot — name it and quote the hunk. Distinguish hard violations from judgement calls. Documented standard breaches can be hard; baseline smells are always judgement calls. Skip anything tooling already enforces (e.g., lint). Keep under 400 words.

## Acceptance Contract
Acceptance level: attested
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Return concrete findings with file paths and severity when applicable

Required evidence: review-findings, residual-risks

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```