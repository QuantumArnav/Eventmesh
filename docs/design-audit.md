# EventMesh visual design audit

## Existing system

- A single dark dashboard shell serves students and organizers. Navigation, event discovery, planning, forms, and analytics share the same density.
- Most styling lives in a compressed `app/globals.css`; Tailwind is installed but the product uses class-based custom CSS. There is no shadcn layer or externally loaded font.
- The original tokens use navy surfaces, teal glow, many hard-coded dark colors, rounded panels, pills, gradients, and elevated cards.

## Problems to solve

1. Discover repeats one large card for every event, so time, title, organizer, and venue are difficult to scan.
2. The student pages read like analytics screens. The dark sidebar consumes space and makes a campus guide feel operational.
3. Organizer metrics, forms, and the venue/scheduling tools use nested cards where rules and tables would communicate structure more clearly.
4. Icons, decorative marks, gradients, shadows, and bright category treatments compete with the actual event information.
5. Repeated hard-coded colors weaken consistency and make future maintenance harder.

## Preserve

All routes, data loading, saved-event state, forms, filters, source review, graph interactions, heatmap interactions, API calls, and the pure intelligence engines. Keep semantic HTML and the existing accessible labels.

## Replace or restyle

- One-size-fits-all shell → role-aware student navigation and compact organizer workspace.
- Event card grid → one featured treatment plus date/time-led event rows.
- Gradient landing visual → an editorial upcoming-event index generated from local listings.
- Rounded statistic cards → compact metric strip and section rules.
- Venue cards and scheduling tiles → ranked rows with clear score semantics.
- Neon graph and heatmap colors → neutral surfaces and a single sequential scale.

## Design foundation

- **Font:** system Inter-style sans; use weight, width, and spacing for hierarchy rather than importing several faces.
- **Student:** warm paper `#F7F5EF`, ink `#202722`, muted `#646C65`.
- **Organizer:** cool neutral workspace `#F1F3F0`, deep green-charcoal sidebar `#202A25`.
- **Shared accent:** forest green `#255740`; semantic danger, warning, and success appear only on actual status.
- **Rules and controls:** light borders, 4–8px control radius, minimal shadow, no glass or gradient surfaces.
- **Spacing:** 4px base, 8/12/16/24/32/48px steps. Student composition is airy; organizer screens are compact.

## Route plan

| Route | Design treatment |
| --- | --- |
| `/` | Editorial headline and real upcoming-event index |
| `/discover` | Featured event, row-based browse list, text filters, integrated Smart Search |
| `/events/[id]` | Publication-style title, dateline, facts, actions, relevance, related events |
| `/my-schedule` | Personal timeline, subdued clash notation, plan comparison |
| `/organizer` | Compact metrics, attention-oriented table, analytical sections |
| `/organizer/create`, `/organizer/inbox` | Grouped form, source review, precise pipeline and status text |
| `/organizer/events/[id]/conflicts`, `/organizer/scheduling` | Scannable conflict rows, ranked alternatives, one-scale heatmap |
| `/event-mesh`, `/demo` | Neutral graph, readable evidence and judge explanation |

The new visual rules live in `app/redesign.css` after the legacy stylesheet so existing functional layouts retain their base rules while each major product surface is explicitly restyled.
