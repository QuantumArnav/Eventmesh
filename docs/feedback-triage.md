# Feedback triage

Checked the public GitHub repository on 28 September 2026: no public issues or pull requests were open or closed at the time of inspection. Private messages from friends are not accessible here. Paste them into this document before submission so they can be reproduced and classified.

## Awaiting / externally supplied feedback

No friend or judge reports have been supplied in this workspace. Record each report in the table below after reproducing it; do not treat a feature suggestion as a defect without evidence.

| Issue | Reproduced | Severity | Decision | Fix | Verification |
| --- | --- | --- | --- | --- | --- |
| No public GitHub issue or PR reported at inspection time | N/A | N/A | Await external feedback | N/A | GitHub issue and PR lists checked on 28 September 2026 |

## Internal release findings

These were found in the code audit, not attributed to reviewers.

| Finding | Reproduced? | Severity | Decision | Fix | Verification |
| --- | --- | --- | --- | --- | --- |
| A file with only a valid image signature passed poster validation | Yes, unit test | P1 | Fix | Decode the complete PNG, JPEG, or WebP image with a pixel limit | Invalid and valid image tests; final gate |
| A source status update could race with publication | Yes, code path | P1 | Fix | Conditional `updateMany` prevents moving a published source back to review | Code review and final gate |
| No CI or persistent-volume deployment recipe | Yes | P0 for durable deployment | Fix preparation | Add CI, Docker, health route, deployment steps | Clean local build and [final CI](https://github.com/QuantumArnav/Eventmesh/actions/runs/36462480659) verified write/recreate/read persistence |
| Two natural Smart Search phrases returned no results despite valid filters | Yes, API calls | P1 | Fix | Parse `between 6 and 9 PM`; recognize saved-schedule conflict phrasing as a constraint | Unit tests and final CI |

## Severity rules

- P0: prevents demo, submission, or reliable setup.
- P1: seriously harms correctness or experience.
- P2: useful polish with no release blocker.
- P3: subjective or outside the product scope.
