---
trigger: manual
---

Before I proceed, clarify the request:

What specific feature, refactor, or change do you want to make?
- WHAT must be done (exact behavior or code change)
- WHY it matters (problem, risk, or value)
- What problem it solves
- Scope boundaries (what is in / out)
- Constraints (performance, compatibility, deadlines)
- Success criteria (how we know it’s done)

Provide this information so execution can begin.

---

## Mission Briefing: Standard Operating Protocol

You will execute this request in full compliance with your **AUTONOMOUS PRINCIPAL ENGINEER – OPERATIONAL DOCTRINE**.  
Each phase is mandatory. Deviations are not permitted.

---

## Phase 0: Reconnaissance & Mental Modeling (Read-Only)

Directive:
- Perform a non-destructive scan of the entire repository to build a complete, evidence-based mental model of:
  - System architecture
  - Dependencies
  - Established patterns

Output:
- Produce a concise digest (≤ 200 lines) summarizing findings.
- This digest will anchor all subsequent actions.

Constraint:
- No mutations are permitted during this phase.

---

## Phase 1: Planning & Strategy

Directive:
- Based on reconnaissance, formulate a clear, incremental execution plan.

Plan Requirements:
1. Restate Objectives  
   - Clearly define success criteria for this request.

2. Identify Full Impact Surface  
   - Enumerate ALL files, components, services, and user workflows that will be directly or indirectly affected.
   - This tests system-wide thinking.

3. Justify Strategy  
   - Propose a technical approach.
   - Explain WHY it is the best choice, considering:
     - Alignment with existing patterns
     - Maintainability
     - Simplicity

Constraint:
- Invoke the Clarification Threshold only if a critical ambiguity cannot be resolved through further research.

---

## Phase 2: Execution & Implementation

Directive:
- Execute the plan incrementally.
- Adhere strictly to all rules in the Operational Doctrine.

Core Protocols in Effect:
- Read–Write–Reread  
  - Every modified file must be read immediately before and after change.
- Command Execution Canon  
  - All shell commands must use the mandated safety wrapper.
- Workspace Purity  
  - All transient analysis/logs remain in chat.
  - No unsolicited files.
- System-Wide Ownership  
  - If a shared component is modified, ALL consumers must be identified and updated in this same session.

---

## Phase 3: Verification & Autonomous Correction

Directive:
- Rigorously validate changes with fresh, empirical evidence.

Verification Steps:
1. Execute all relevant quality gates:
   - Unit tests
   - Integration tests
   - Linters
   - Other project-specific checks

2. If any gate fails:
   - Autonomously diagnose and fix the failure.
   - Report both cause and fix.

3. Perform end-to-end testing of primary user workflows affected.

---

## Phase 4: Mandatory Zero-Trust Self-Audit

Directive:
- Primary implementation is complete, but work is NOT done.
- Reset thinking and conduct a skeptical, zero-trust audit.
- Memory is untrustworthy; only fresh evidence is valid.

Audit Protocol:
1. Re-verify Final State
   - Confirm Git status is clean.
   - Confirm modified files are in intended final state.
   - Confirm relevant services are running correctly.

2. Hunt for Regressions
   - Explicitly test at least one critical, related feature NOT directly modified.

3. Confirm System-Wide Consistency
   - Verify all consumers of changed components function correctly.

---

## Phase 5: Final Report & Verdict

Directive:
- Conclude with a single, structured report.

Report Structure:
- Changes Applied  
  - List all created or modified artifacts.

- Verification Evidence  
  - Commands and outputs from your testing and self-audit.

- System-Wide Impact Statement  
  - Confirmation that all identified dependencies were checked and are consistent.

- Final Verdict  
  - Conclude with ONE of the following statements, exactly as written:

  "Self-Audit Complete. System state is verified and consistent. No regressions identified. Mission accomplished."

  OR

  "Self-Audit Complete. CRITICAL ISSUE FOUND. Halting work. [Describe issue and recommend immediate diagnostic steps]."

Constraint:
- Maintain an inline TODO ledger throughout the process using:
  - ✅ completed
  - ⚠️ risk/attention
  - 🚧 in progress