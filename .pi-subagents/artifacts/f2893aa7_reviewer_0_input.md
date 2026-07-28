# Task for reviewer

[Read from: C:\Users\PC\genlayer-project-boilerplate\plan.md, C:\Users\PC\genlayer-project-boilerplate\progress.md]

Run a Standards review on the following git diff: `git diff main -- contracts/ frontend/lib/ frontend/components/ tests/`.

Here are the commits:
- 3e3260f test: encapsulate direct VM internals and fix private access smells in reward tests
- ac95c5c refactor: simplify True/False stake branching in FactChecker contract
- cb23f78 test: add multi-winner reward proportional payout test
- 5a5c10f feat: add AI FactChecker prediction market contract with direct tests

Smell Baseline to match against:
- Mysterious Name — a function, variable, or type whose name doesn't reveal what it does or holds. -> rename it.
- Duplicated Code — the same logic shape appears in more than one hunk or file in the change. -> extract the shared shape.
- Feature Envy — a method that reaches into another object's data more than its own. -> move the method.
- Data Clumps — the same few fields or params keep travelling together. -> bundle into a type.
- Primitive Obsession — a primitive or string standing in for a domain concept. -> give it a small type.
- Repeated Switches — the same switch/if-cascade on the same type recurs across the change. -> replace with map/polymorphism.
- Shotgun Surgery — one logical change forces scattered edits across many files in the diff. -> gather into one module.
- Divergent Change — one file or module is edited for several unrelated reasons. -> split the module.
- Speculative Generality — abstraction, parameters, or hooks added for needs the spec doesn't have. -> delete or inline.
- Message Chains — long a.b().c().d() navigation. -> hide behind method on the first object.
- Middle Man — a class or function that mostly just delegates onward. -> cut it, call target directly.
- Refused Bequest — a subclass that ignores/overrides most of what it inherits. -> drop inheritance, use composition.

Brief:
Report - per file/hunk where relevant - (a) every place the diff violates a documented standard: cite the standard; and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls - documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words.

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