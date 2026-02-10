# Phase 8: Testing, QA, and Release Prep

[Back to TODO Index](../TODO.md)

---

**Goal**: Ensure stability, quality, and readiness for public release.  
**Duration**: 2 weeks  
**Priority**: 🔴 Critical path

### 8.1 Automated Testing
- [ ] **Unit tests for core modules** 🔴
  - Files: `src/engine/`, `src/io/`, `src/scripting/`
  - Use Jest or Mocha
  - Acceptance: 80%+ code coverage

- [ ] **Integration tests** 🔴
  - Test full map load/save/edit cycle
  - Acceptance: All major flows tested

- [ ] **End-to-end (E2E) tests** 🟡
  - Simulate user actions in UI
  - Use Cypress or Playwright
  - Acceptance: E2E tests pass for all critical flows

### 8.2 Manual QA
- [ ] **QA checklist** 🔴
  - All features tested by hand
  - Acceptance: Checklist completed, bugs filed

- [ ] **Bugfix pass** 🔴
  - Fix all critical and high-priority bugs
  - Acceptance: No showstopper bugs remain

### 8.3 Performance Optimization
- [ ] **Profile and optimize** 🟡
  - Use browser/devtools profilers
  - Acceptance: No major slowdowns with 10k+ objects

- [ ] **Memory leak checks** 🟡
  - Acceptance: No significant leaks after 1hr use

### 8.4 Release Preparation
- [ ] **Prepare release notes** 🔴
  - Summarize features, known issues
  - Acceptance: Release notes ready

- [ ] **Version bump** 🔴
  - Update version in package.json, docs
  - Acceptance: Version is correct

- [ ] **Final documentation pass** 🔴
  - Ensure all docs are up to date
  - Acceptance: Docs match shipped features

---

**End of Phase 8**
