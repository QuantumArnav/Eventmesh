# EventMesh evaluation

Run `npm run evaluate` to reproduce these numbers. The script uses a small, synthetic fixture set committed in [`evaluation/run.ts`](../evaluation/run.ts). Results below are from the run on 27 September 2026. They describe these fixtures only; they are **not** evidence of accuracy on real IITH announcements, posters, or bookings.

| Component | Fixture size | Measured result |
| --- | ---: | --- |
| Duplicate detector | 8 labeled pairs (4 duplicate, 4 distinct) | Precision 1.00, recall 1.00, F1 1.00; TP 4, FP 0, FN 0 |
| Offline announcement parser: title | 15 text samples | 12/15 exact |
| Offline announcement parser: date | 15 text samples | 15/15 exact, including null for an undated “tomorrow” |
| Offline announcement parser: venue | 15 text samples | 13/15 exact |
| Offline announcement parser: start time | 15 text samples | 15/15 exact |
| Offline announcement parser: organizer | 15 text samples | 14/15 exact |
| Conflict engine | 6 labeled overlap/type cases | 6/6 matched expected type or no conflict |
| Venue matcher | 5 ranking cases | 5/5 top venue matched fixture expectation |
| Schedule optimizer | 1 constructed greedy failure | Selected the two compatible events (`early`, `late`) over one long must-attend event |

## What the evaluation checks

The duplicate benchmark includes exact listings, a title suffix, a misspelling, a room change, a next-month listing, an unrelated sports event, and a next-day listing. The conflict cases include full and partial venue overlaps, similar and different audiences, a back-to-back boundary, and another day. Venue cases cover an ideal room, too-small and oversized rooms, a missing projector, and an occupied room.

The announcement cases include repeated clear templates and three differently worded notices. The local parser missed titles outside its phrase patterns, two unfamiliar venue names, and the `E-Cell` organizer form. Organizers must review all extracted fields; no extracted draft is published automatically. The numbers cover the **offline parser only**. The optional OpenAI vision/text path was not measured because this run used no external API key or real posters.

## Limits and next experiment

- Fixtures are hand-written and tiny. A score of 1.00 here does not imply production precision or recall.
- Venue capacities, facilities, and booking status are illustrative demo values. A collision check only sees events in the local EventMesh database.
- A useful next evaluation would collect consented, real announcements and posters with independently labeled fields, then run the AI path and local fallback separately. The current report makes no claim about that data.
