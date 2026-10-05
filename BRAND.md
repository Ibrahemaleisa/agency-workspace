# Operra brand: Cadence · Kashida

The rules for Operra's own identity: the marketing site (`site/`), sign-up, preview, the control
center, Operra's emails and the default look of a new workspace. Inside a customer's workspace,
the agency's own brand (Settings → Brand) sits on top, as before.

## The idea

Agency work has a rhythm: brief, production, review, approval, delivery. Operra's mark is those
five stages as bars filling a circle. Like the Arabic **kashida** (ـ), the stroke that stretches a
word along its baseline, the bars grow from the start of the reading direction: right to left in
Arabic, left to right in English. **Things that progress grow in the reader's direction.**

## Logo

- **Mark:** five rounded bars clipped to a circle. Lengths top to bottom: 100%, 100%, 100%, 62%, 30%.
  Bars are 9 units tall with 3.6 units between them in a 64-unit box, with fully rounded ends.
- **Mirroring:** in Arabic the mark is mirrored so it fills from the right. This is the only
  transformation allowed: never rotate, recolour per bar, or animate the mark itself.
- **Wordmarks:** English `operra` in lowercase, Alexandria SemiBold, tracking −4%. Arabic
  `أوبيـــرّا`, Alexandria SemiBold, with the kashida between ب and ي.
- **Colours:** lapis on light grounds, bone on lapis. Mono graphite only where colour is impossible.
- **Code:** `site/src/components/logo.tsx` (site), `src/components/platform/operra-mark.tsx` (product).
  Favicon `site/src/app/icon.svg`; share card `site/src/app/opengraph-image.tsx`.

## Colour

| Token | Hex | Use |
|---|---|---|
| Lapis | `#1F3FBF` | The brand. Primary buttons, links in UI, the mark, proof bands, progress |
| Lapis deep | `#182F8F` | Hover and pressed lapis |
| Lapis tint | `#E3E8FC` | Selection, soft highlights, in-progress fills |
| Bone | `#F7F7F4` | Page ground |
| White | `#FFFFFF` | Cards, tables, inputs |
| Graphite | `#15171C` | Text and icons |
| Steel | `#5B606B` | Secondary text |
| Line | `#E1E2DE` | Hairlines |
| Amber | `#E9A81A` | **Only** work waiting on the client |

Use lapis big and confidently: a full lapis band says more than a lapis outline. Amber never
decorates; if nothing is waiting on a client, there is no amber on the screen.

## Type

**Alexandria** (SIL Open Font License) for everything, Arabic and Latin; it was drawn for both
together. Weights: 400 text, 500 labels, 600 headings and wordmarks, 700 display.
No monospace: data uses Alexandria with tabular figures (`tabular` / `font-mono` classes).
Labels are sentence case; never uppercase, never tracked. Arabic always has 0 tracking.

## Signature graphics

- **Kashida stroke:** a thick lapis bar under the hero headline that stretches once on load, from
  the start edge (`.kashida-bar`). In Arabic the hero stretches the word itself: «يتحـــرك».
  This is the site's one orchestrated moment of motion.
- **Call sheet:** a real agency week, Sunday to Thursday with the weekend hatched, schedule bars
  filling in reading order, amber for the client approval (`site/src/components/call-sheet.tsx`).
- **Stage bars:** workflows are drawn as rounded bars (done = lapis, live = amber when it's the
  client's turn, next = line), never as dots on hairlines.

## Shape and motion

Corners 3 / 6 / 8 / 12px. No gradients, no drop shadows as decoration. Motion only when state
changes, plus the single kashida stretch; everything respects `prefers-reduced-motion`.
