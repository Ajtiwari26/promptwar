# Project Evaluation Framework & Rubric

This document defines the evaluation criteria, inspection checklists, and scorecard for the **PromptWar** project. All completed features, architectures, and implementations will be assessed against these weighted parameters.

---

## 1. Evaluation Hierarchy & Weighting Distribution

| Tier | Evaluation Parameter | Weight | Focus Areas |
| :--- | :--- | :---: | :--- |
| **Tier 1 (Highest)** | **Problem Statement Alignment** | **30%** | Accurate fulfillment of prompt requirements, boundary handling, edge cases, core business logic correctness. |
| **Tier 1 (Highest)** | **Code Quality & Architecture** | **30%** | Modularity, clean code conventions, DRY/SOLID principles, idiomatic patterns, typing, maintainability, zero lint/build errors. |
| **Tier 2 (Medium)**  | **Security & Safety** | **15%** | Input validation, sanitization, secure secret management, zero hardcoded credentials, defensive coding. |
| **Tier 2 (Medium)**  | **Efficiency & Performance** | **15%** | Optimal time/space complexity, resource caching, low latency, minimal unnecessary re-renders or allocations. |
| **Tier 3 (Lowest)**  | **Testing & Verification** | **5%** | Unit / integration / smoke test coverage, determinism, test execution ease. |
| **Tier 3 (Lowest)**  | **Accessibility (a11y) & UX** | **5%** | Keyboard navigability, semantic structure, basic contrast, responsive usability. |
| **Total** | | **100%** | |

---

## 2. Detailed Inspection Criteria

### 2.1 Problem Statement Alignment (Weight: 30%)
- [ ] **Core Requirements**: All specified functional requirements from the prompt/user are fully satisfied.
- [ ] **Edge Cases**: System handles empty, oversized, invalid, or unusual inputs gracefully without unhandled exceptions.
- [ ] **Deterministic Behavior**: The solution produces predictable, reproducible results aligned with user expectations.
- [ ] **Domain Correctness**: Business and mathematical logic accurately model the intended problem domain.

### 2.2 Code Quality & Architecture (Weight: 30%)
- [ ] **Separation of Concerns**: Business logic is separated from UI, transport, and data access layers.
- [ ] **Modularity & Reusability**: Components and functions are concise, cohesive, and have single responsibilities.
- [ ] **Type Safety & Contracts**: Strong typing or explicit schema contracts across inputs, outputs, and internal states.
- [ ] **Readability & Self-Documentation**: Clear naming conventions, minimal cognitive complexity, and contextual comments explaining *why* (not *what*).
- [ ] **Code Hygiene**: Zero lint warnings, zero unused imports/variables, and strict formatter compliance.

### 2.3 Security & Safety (Weight: 15%)
- [ ] **Secrets & Configuration**: Zero plaintext API keys, passwords, or tokens in source code; strict use of environment variables.
- [ ] **Input Sanitization**: Thorough validation and escaping of untrusted external inputs (preventing XSS, command injection, or SQL/NoSQL injection).
- [ ] **Error Exposure**: Error responses and client logs do not leak internal stack traces or environment metadata.
- [ ] **Least Privilege & Boundaries**: Data access and sub-processes are bounded to minimal required permissions.

### 2.4 Efficiency & Performance (Weight: 15%)
- [ ] **Algorithmic Efficiency**: Computations and loops avoid unnecessary $O(n^2)$ or higher complexities.
- [ ] **Network & I/O Optimization**: Requests are batched or throttled where appropriate, avoiding waterfall requests and duplicate fetches.
- [ ] **Memory & Resource Lifecycle**: Cleanup of event listeners, sockets, file handles, or timer tasks (no memory leaks).
- [ ] **Build & Bundle Size**: Minimal dependencies, avoiding oversized or bloated external libraries when standard primitives suffice.

### 2.5 Testing & Verification (Weight: 5%)
- [ ] **Critical Path Coverage**: Automated tests verify the primary success paths and prominent error conditions.
- [ ] **Test Script Organization**: All test scripts and test harnesses reside neatly under a dedicated directory (e.g. `testscript/` or `tests/`).
- [ ] **Execution Reliability**: Tests run reliably without flaky network dependencies or timing-sensitive races.

### 2.6 Accessibility (a11y) & UX Baseline (Weight: 5%)
- [ ] **Semantic Structure**: Proper semantic tags (`<header>`, `<main>`, `<button>`, `<input>`, etc.) rather than clickable `<div>` elements.
- [ ] **Keyboard Interactivity**: Core workflows and interactive elements can be operated using keyboard navigation (`Tab`, `Enter`, `Escape`).
- [ ] **Visual Clarity & Contrast**: Legible typography and clear visual feedback for states (hover, focus, disabled, loading).

---

## 3. Post-Build Evaluation Scorecard

Use this template to score the project upon completion:

| Parameter | Weight | Score (1–10) | Weighted Score | Key Findings & Observations |
| :--- | :---: | :---: | :---: | :--- |
| **Problem Statement Alignment** | 30% | `[  ]` | `0.30 × Score` | |
| **Code Quality & Architecture** | 30% | `[  ]` | `0.30 × Score` | |
| **Security & Safety** | 15% | `[  ]` | `0.15 × Score` | |
| **Efficiency & Performance** | 15% | `[  ]` | `0.15 × Score` | |
| **Testing & Verification** | 5% | `[  ]` | `0.05 × Score` | |
| **Accessibility & UX** | 5% | `[  ]` | `0.05 × Score` | |
| **Final Composite Score** | **100%** | | **`/ 10.0`** | |

### Evaluation Ratings Guide
- **9.0 – 10.0**: Outstanding / Production-Grade
- **7.5 – 8.9**: Strong / Release-Ready with minor notes
- **6.0 – 7.4**: Acceptable / Requires targeted refactoring
- **< 6.0**: Needs Remediation
