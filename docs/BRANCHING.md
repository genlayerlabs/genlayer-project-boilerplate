# Branching and Release Trains

This repo follows the GenLayer release-train model.

## Current Train

- Current stable branch: `v1`
- Active integration branch: `v2-dev`
- Next stable target: `v2`
- `main`: default/static branch alias for the active integration branch

## Stable Branches

Stable branches are long-lived release lines. They are named after the version
line they ship, for example `v1` or `v2`.

PRs may target a stable branch directly when the merged result should be
releasable immediately. This is appropriate for bug fixes, small non-breaking
features, isolated release fixes, or a breaking change that is intentionally
shipping as the next version by itself.

Stable branches must remain releasable. PRs into stable branches are expected to
pass the required cross-repo `E2E Tests` gate before merge.

## Integration Branches

Integration branches are optional. Use one when multiple changes need to
accumulate before release, especially for cross-repo work, dependent features,
breaking changes that must ship together, or a train that needs advisory E2E
while still expected to be red.

Integration branches are named after the target stable branch plus `-dev`, for
example `v2-dev`. Feature PRs for that train target the integration branch.

PRs into integration branches may run `E2E Tests` as advisory checks. They are
not the release gate.

## Promotion and Release

When an integration train is ready, open a promotion PR from the integration
branch to the matching stable branch, for example `v2-dev` to `v2`.

That promotion PR is the release-readiness gate and must pass required
cross-repo `E2E Tests`. The actual release is cut from the stable branch using a
version tag after the stable branch is ready.

## `main`

`main` exists for GitHub UX and tools that require a stable default branch. It is
not a release branch and it is not the integration target.

This repo keeps `main` forwarded to the active integration branch using
automation. PRs opened against `main` are automatically retargeted to the branch
listed in `support/ci/ACTIVE_DEV_BRANCH`.

When changing the active integration branch, update
`support/ci/ACTIVE_DEV_BRANCH`, the repo docs, and the corresponding
`genlayer-e2e` release-train matrix in the same change set.
