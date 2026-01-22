# Requirements Sanity Checklist: UX & Performance

**Purpose**: This checklist serves as a lightweight requirements quality audit for the Opencode Client Interface, focusing on UX interaction, performance targets, and API contract clarity.
**Created**: 2025-01-22
**Focus**: UX/Interaction, Performance/Background, API Contracts
**Status**: Pending

## Requirement Completeness

- [ ] CHK001 - Are the specific Markdown features (e.g., tables, code blocks, math) supported by the chat renderer explicitly defined? [Gap]
- [ ] CHK002 - Does the spec define the exact content structure for "Contextual Snippets" in note citations? [Completeness, Spec §FR-005]
- [ ] CHK003 - Are the specific HTTP status codes that trigger the 3x exponential back-off retry logic defined? [Completeness, Spec §EC-007]
- [ ] CHK004 - Is the behavior for the "loading bar" specified for partial indexing failures? [Gap, Spec §FR-003]

## Requirement Clarity

- [ ] CHK005 - Is the "pulsing typing indicator" quantified with specific timing or visual properties to ensure consistency? [Clarity, Spec §FR-003]
- [ ] CHK006 - Is the distinction between "Network Error" and "Intelligence Service Error" defined with measurable criteria? [Clarity, Spec §EC-008]
- [ ] CHK007 - Are "Helpful Errors" specified with concrete actionable examples for each primary failure mode? [Clarity, Spec §FR-008]
- [ ] CHK008 - Is the "Debug Mode" log format (verbosity, sensitive data masking) explicitly defined? [Clarity, Spec §FR-012]

## Requirement Consistency

- [ ] CHK009 - Do the `QueryResponse` interfaces in the data model align perfectly with the `QueryResponse` schema in the API contract? [Consistency, DataModel vs API §QueryResponse]
- [ ] CHK010 - Are the timeout values in the Ky service implementation plan consistent with the 5s query response success criteria? [Consistency, Plan vs Spec §SC-001]

## Performance & Background Quality

- [ ] CHK011 - Are the priority and execution rules for `requestIdleCallback` defined to ensure the UI thread is never blocked during indexing? [Clarity, Plan]
- [ ] CHK012 - Does the spec define fallback requirements if vault indexing fails to meet the 30s/1k-note target? [Gap, Spec §SC-003]
- [ ] CHK013 - Are the chunking requirements (4KB) for large notes defined for both the local retrieval and the server transmission? [Clarity, Spec §EC-004]

## API Contract Quality

- [ ] CHK014 - Is the streaming protocol (e.g., Server-Sent Events or Chunked Encoding) explicitly specified for the `/message` endpoint? [Gap, API §session.prompt]
- [ ] CHK015 - Does the API contract define maximum size limits for `FilePartInput` payloads to prevent memory exhaustion? [Gap, API §FilePartInput]
- [ ] CHK016 - Are the authentication failure modes (expired token vs invalid key) specified for the `bearerAuth` security scheme? [Completeness, API §bearerAuth]

## Scenario & Edge Case Coverage

- [ ] CHK017 - Are requirements defined for UI behavior when the vault path is valid but contains zero markdown files? [Coverage, Spec §EC-001]
- [ ] CHK018 - Does the spec define how the UI handles responses that arrive while a "Clarification Required" pattern is active? [Gap, Spec §EC-003]
- [ ] CHK019 - Are recovery requirements specified for session state if `plugin.saveData()` fails due to disk errors? [Gap, Spec §EC-009]
