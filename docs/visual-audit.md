# Frame visual and responsive audit

Reference: https://www.tapnow.ai/ (inspected September 14, 2026).

## Animation coverage

| Reference behavior | Frame implementation | Notes |
| --- | --- | --- |
| Hero text and canvas entrance | Fade and vertical reveal | Original wording is adapted to Frame. |
| Connected hero media canvas | Animated WebP, node drift, moving connection highlights, pan/zoom | Phone layout now fits the whole composition; desktop retains exploration controls. |
| Continuous logo strip | Seamless creative-format marquee | Frame does not claim TapNow's customers. |
| Pinned agent narrative | Prompt, response, and storyboard reveal in four scroll phases | Compact layouts show the readable composition without long pinned scrolling. |
| Lens selector motion | Automatically cycling focal lengths and animated selector reveals | User interaction stops automatic changes. |
| Camera angle demo | Automatic perspective tour, draggable cube, and keyboard-accessible sliders | CSS perspective illustration, not the reference's 3D engine. |
| Lighting demo | Cycling brightness, temperature, light direction, and beam | Manual interaction takes over. |
| Object replacement demo | Automatic source/result swaps using reference animated media | Visual concept, not a connected object-replacement service. |
| Model strip | Continuous workflow pills over a zooming image | Links open Frame's four actual workflows. |
| Community reveal | Scroll zoom, floating image tiles, project CTA | Adapted creative-space presentation. |
| Hover and focus | Button, card, and navigation feedback | Visible monochrome focus treatment. |

The animation types are recreated, not certified frame-for-frame replicas. Timings, content, and complex 3D demonstrations differ from the reference. No third-party scripts or analytics are included.

## Motion behavior

- Preview timers run only when their demo intersects the viewport, the document is visible, and animations are enabled.
- User interaction stops the relevant automatic preview.
- The animation pause control stops CSS loops, automatic tours, and animated hero/replacement media.
- Reduced-motion preferences disable loops and transitions and leave readable static content.

## Theme

Shared original F geometry on the landing page, studio navigation, and favicon. Charcoal background, grey surfaces/borders, off-white text and primary actions. Uploaded and promotional media retain their colors. Error messages retain a restrained red semantic treatment.

Workspace, project list, upload modal, editor settings, transcript/history panels, progress states, inputs, and buttons share the palette. The editor grid allows intrinsic video/input widths to shrink on phones.

## Verification results

- Browser checks at 320, 390, 768, 1280, and 1440 CSS pixels across the landing, workspace, modal, and editor views.
- No document-level horizontal overflow in the inspected layouts; the phone editor's intrinsic grid overflow was fixed.
- Observed automatic cinematic preset advancement, then confirmed the selected preset held after manual interaction.
- Verified the pause control removes animated hero/replacement media and pauses CSS marquee loops.
- Checked mobile menu navigation, studio routing, upload modal, project navigation, and editor history controls.
- ESLint for the new/modified brand and landing components, TypeScript, and the complete production build passed.
- Reduced-motion behavior was reviewed in implementation; an OS-level reduced-motion emulation was not available in the browser tool.
