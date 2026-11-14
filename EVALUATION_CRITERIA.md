# Project Evaluation Framework & Full-Score Standard (10/10)

This document establishes the evaluation rubric, acceptance gates, and verification checklists for the **PromptWar** project. 

> **Core Objective: 100% Score Across All Dimensions (60/60 points).**  
> While the parameters have relative weightings representing architectural focus, **no category is optional**. Lower priority does **not** permit lowered standards. Every category must achieve a full 10/10 score to pass project certification.

---

## 1. Scorecard & Acceptance Benchmark

| Dimension | Weight | Target Score | Acceptance Gate (Condition for 10/10) |
| :--- | :---: | :---: | :--- |
| **Problem Statement Alignment** | **30%** | **10 / 10** | 100% of user requirements met; all functional requirements, boundary conditions, and edge cases handled without defects. |
| **Code Quality & Architecture** | **30%** | **10 / 10** | Zero lint errors, zero TypeScript/type warnings, clean modular architecture, strict separation of concerns, readable idiomatic code. |
| **Security & Safety** | **15%** | **10 / 10** | Zero hardcoded secrets, complete input validation and sanitization, robust defensive error handling, zero leaked internal traces. |
| **Efficiency & Performance** | **15%** | **10 / 10** | Optimal $O(n)$ complexity, zero redundant I/O or rendering passes, clean resource lifecycles (no lingering listeners, timers, or leaks). |
| **Testing & Verification** | **5%** | **10 / 10** | Deterministic automated test suite organized under `testscript/`, 100% passing unit and integration tests covering normal and edge cases. |
| **Accessibility (a11y) & UX** | **5%** | **10 / 10** | Semantic HTML5 structure, full keyboard navigability (Tab, Enter, Space, Esc), clean accessible contrast, intuitive visual feedback. |
| **Total Composite Score** | **100%** | **10.0 / 10.0** | **Uncompromising Full Score (60 / 60 Raw Points)** |

---

## 2. Uncompromising 10/10 Checklists by Dimension

### 2.1 Problem Statement Alignment (Target: 10/10)
- [ ] **Specification Completeness**: Every requirement outlined in the prompt/specification is implemented and verified.
- [ ] **Edge Case Mastery**: Graceful handling of empty states, oversized payloads, invalid formats, and boundary inputs.
- [ ] **Accurate Domain Logic**: Business and computational logic strictly match problem formulas and expectations.
- [ ] **Deterministic Behavior**: Identical inputs yield correct, reproducible outcomes every time.

### 2.2 Code Quality & Architecture (Target: 10/10)
- [ ] **Zero Lint / Compiler Warnings**: Clean run across project linters, formatters, and typecheckers.
- [ ] **Layered Separation of Concerns**: Clear demarcation between UI, business/domain logic, and data access.
- [ ] **Modularity & Reusability**: Functions and components adhere strictly to single-responsibility and DRY principles.
- [ ] **Strict Typing**: Explicit types/interfaces for all inputs, outputs, states, and API contracts.
- [ ] **Intentional Self-Documentation**: Explicit naming and purposeful comments explaining architectural decisions.

### 2.3 Security & Safety (Target: 10/10)
- [ ] **Secret Hygiene**: All credentials, tokens, and sensitive configs are strictly managed via environment variables.
- [ ] **Input Sanitization & Escaping**: All external/user inputs are validated before processing (prevention of XSS, SQLi, code injection).
- [ ] **Defensive Error Handling**: Structured error recovery with friendly user messages and sanitized logs (no stack trace leakage).
- [ ] **Least Privilege**: Minimal resource permissions and strict boundary containment.

### 2.4 Efficiency & Performance (Target: 10/10)
- [ ] **Algorithmic Optimality**: Critical paths avoid unnecessary $O(n^2)$ operations or redundant loops.
- [ ] **I/O & Request Optimization**: Batched, cached, or throttled network requests; zero waterfall dependencies.
- [ ] **Memory & Lifecycle Cleanup**: Explicit teardown for all timers, observers, event listeners, and subscriptions.
- [ ] **Bundle & Dependency Leanliness**: Minimal dependencies; no oversized packages for trivial tasks.

### 2.5 Testing & Verification (Target: 10/10)
- [ ] **Dedicated Structure**: All test scripts and harnesses are cleanly maintained under `testscript/`.
- [ ] **Full Path Coverage**: Automated tests verify both happy paths and error/edge cases.
- [ ] **Zero Flakiness**: 100% reproducible test runs independent of external live network dependencies.
- [ ] **Automated Execution**: A single command or script can run and report the entire test suite.

### 2.6 Accessibility (a11y) & UX (Target: 10/10)
- [ ] **Semantic Markup**: Standard semantic elements (`<header>`, `<nav>`, `<main>`, `<button>`, `<input>`) used without role spoofing.
- [ ] **Full Keyboard Navigability**: Every interactive element can be focused and activated via keyboard.
- [ ] **Focus Management & Contrast**: Visible focus rings, WCAG AA compliant contrast ratios, and accessible color palettes.
- [ ] **Clear UX Feedback**: Loading, error, and success states are visually evident and understandable.

---

## 3. Post-Build Verification Execution Record

| Dimension | Raw Score (1–10) | Weighted Score | Verification Evidence / Command Output | Evaluator Sign-off |
| :--- | :---: | :---: | :--- | :---: |
| **Problem Statement** | `[ 10 / 10 ]` | 3.00 / 3.00 | Verified against user specification & edge cases | [ ] |
| **Code Quality** | `[ 10 / 10 ]` | 3.00 / 3.00 | Linters, typecheckers, and architecture review pass clean | [ ] |
| **Security** | `[ 10 / 10 ]` | 1.50 / 1.50 | Security audit, secret hygiene, and input sanitization check | [ ] |
| **Efficiency** | `[ 10 / 10 ]` | 1.50 / 1.50 | Big-O analysis, memory inspection, and latency benchmarks | [ ] |
| **Testing** | `[ 10 / 10 ]` | 0.50 / 0.50 | `testscript/` test suite runs with 100% pass rate | [ ] |
| **Accessibility & UX**| `[ 10 / 10 ]` | 0.50 / 0.50 | Keyboard navigation and semantic HTML inspection verified | [ ] |
| **FINAL TOTAL** | **60 / 60** | **10.0 / 10.0** | **Full 100% Score Achieved** | [ ] |
