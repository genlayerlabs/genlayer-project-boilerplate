#!/usr/bin/env bash
set -euo pipefail

failed=0

error() {
  echo "::error::$*"
  failed=1
}

warning() {
  echo "::warning::$*"
}

active_branch_file="support/ci/ACTIVE_DEV_BRANCH"
if [[ ! -f "${active_branch_file}" ]]; then
  error "${active_branch_file} is required."
  active_branch=""
else
  active_branch="$(tr -d '[:space:]' < "${active_branch_file}")"
fi

if [[ -z "${active_branch}" ]]; then
  error "${active_branch_file} must not be empty."
elif [[ "${active_branch}" == "main" ]]; then
  error "${active_branch_file} must point to a dev branch, not main."
elif [[ "${active_branch}" != *-dev ]]; then
  warning "${active_branch_file} should normally point to a -dev branch; got ${active_branch}."
fi

release_branch="${active_branch%-dev}"
default_branch="${GITHUB_DEFAULT_BRANCH:-}"
event_name="${GITHUB_EVENT_NAME:-local}"
base_ref="${GITHUB_BASE_REF:-}"
head_ref="${GITHUB_HEAD_REF:-}"
ref_name="${GITHUB_REF_NAME:-}"
actor="${GITHUB_ACTOR:-}"

if [[ -n "${default_branch}" && "${default_branch}" != "main" ]]; then
  warning "Repository default branch should be main after branch-policy rollout; currently ${default_branch}."
fi

if [[ -n "${base_ref}" && "${base_ref}" == "main" ]]; then
  warning "PR targets main; retarget-main-prs should move it to ${active_branch}."
fi

if [[ -n "${base_ref}" && -n "${active_branch}" ]]; then
  if [[ "${base_ref}" == "${release_branch}" && "${head_ref}" != "${active_branch}" && "${ALLOW_DIRECT_RELEASE_PR:-false}" != "true" ]]; then
    error "PRs into ${release_branch} must come from ${active_branch}. Merge feature work into ${active_branch}, then promote ${active_branch} -> ${release_branch}."
  fi
fi

if [[ "${event_name}" == "push" && "${ref_name}" == "main" ]]; then
  case "${actor}" in
    github-actions[bot]|ci-core-e2e-runner[bot])
      ;;
    *)
      error "main should only move by automation from ${active_branch}; direct push actor was ${actor:-unknown}."
      ;;
  esac
fi

if [[ ! -f ".github/workflows/fast-forward-main.yaml" ]]; then
  error ".github/workflows/fast-forward-main.yaml is required."
fi

if [[ ! -f ".github/workflows/retarget-main-prs.yaml" ]]; then
  error ".github/workflows/retarget-main-prs.yaml is required."
fi

if [[ -f ".github/workflows/release-from-main.yml" ]]; then
  error ".github/workflows/release-from-main.yml is forbidden. Releases must be tag/version-branch driven."
fi

if [[ -f "release.config.js" ]]; then
  error "release.config.js is forbidden in versioned tooling branches; semantic-release-on-main must not be restored."
fi

if [[ -f ".github/workflows/release-from-tag.yml" ]]; then
  if ! grep -Fq 'v*.*.*' .github/workflows/release-from-tag.yml; then
    error "release-from-tag.yml must trigger only from version tags matching v*.*.*."
  fi
  if ! grep -Fq 'refs/remotes/origin/${version_branch}' .github/workflows/release-from-tag.yml || \
     ! grep -Fq 'tag_commit' .github/workflows/release-from-tag.yml || \
     ! grep -Fq 'branch_head' .github/workflows/release-from-tag.yml; then
    error "release-from-tag.yml must verify the tag commit is the current matching version branch head."
  fi
fi

if [[ -f ".github/workflows/manual-docker-release.yml" ]]; then
  if ! grep -Fq 'expected_branch=' .github/workflows/manual-docker-release.yml; then
    error "manual-docker-release.yml must derive and enforce the expected version branch from the tag."
  fi
  if ! grep -Fq './.github/workflows/release-from-tag.yml' .github/workflows/manual-docker-release.yml; then
    error "manual-docker-release.yml must delegate image promotion to release-from-tag.yml."
  fi
fi

if [[ "${failed}" -ne 0 ]]; then
  exit 1
fi

if [[ -n "${base_ref}" ]]; then
  echo "Branch policy ok for PR ${head_ref} -> ${base_ref}; active dev branch is ${active_branch}."
else
  echo "Branch policy ok for ${event_name} on ${ref_name:-detached ref}; active dev branch is ${active_branch}."
fi
