# Approved brand and foundation tokens

Authority: [Frontend implementation matrix](https://github.com/DigiNodes/truthbounty-protocol/blob/60c66b78cf797d8f821089c99ae1bc461009fecc/docs/ux-authority/FRONTEND_IMPLEMENTATION_MATRIX.md), [Brand Foundation](https://github.com/DigiNodes/truthbounty-protocol/blob/60c66b78cf797d8f821089c99ae1bc461009fecc/docs/ux-authority/BRAND_FOUNDATION.md), and [foundation handoff](https://github.com/DigiNodes/truthbounty-protocol/tree/60c66b78cf797d8f821089c99ae1bc461009fecc/designs/frontend-v2/foundation).

`public/brand/` contains the five approved SVG files, byte-for-byte. `src/lib/brand-assets.ts` embeds those same reviewed bytes for inline rendering: SVG wordmark text can share the loaded Geist font, which external image documents cannot inherit. `BrandMark` scopes DOM identifiers to avoid collisions between repeated gradients/titles. It changes no path geometry, colours, aspect ratios or source files. Never pass user/API markup to this renderer. The asset regression tests verify checksums, source equivalence, paths, internal references and accessible names.

Use `<BrandMark />` for automatic light/dark wordmarks, `variant="glyph"`, `variant="monochrome"`, or `variant="app-icon"`. Use `decorative` when an adjacent accessible name already identifies the brand. The default name is `TruthBounty`. Minimum glyph size is 16px; preserve the intrinsic aspect ratio, clear space at least as wide as the central stem, and use a legible wordmark size. Never separate the diamond, recolour paths, add identity shadows, or introduce Bounty Gold inside the mark. The application sidebar and favicon consume the approved assets.

`src/styles/brand-authority.css` and `.json` are unchanged copies of the pinned protocol handoff. `globals.css` bridges their `--tb-*` values to application/Tailwind roles and supports both `.light/.dark` and `data-theme`. `src/lib/brand-tokens.ts` exposes typed static colours for integrations that require values, such as the wallet chooser. These are approved content, never protocol authority.

| Base token | Value | Meaning |
| --- | --- | --- |
| Signal Cyan | #22D3EE | Evidence input and focus |
| Proof Blue | #4F7CFF | Actions and resolved output |
| Ink Navy | #070A12 | Dark canvas and light text foreground |
| Deep Slate | #101522 | Dark surface |
| Frost White | #F7F9FC | Dark text foreground and light canvas |
| Bounty Gold | #F5B942 | Rewards and staking only |
| Success | #41D39A | Confirmed/finalized success |
| Attention | #F4B860 | Pending, deadlines and projection lag |
| Danger | #FF6B7A | Failure and destructive actions |
| Info | #74A7FF | Information |

Light surfaces use the approved white, raised #EEF3F8, muted #58647A and border #DCE2EB; dark surfaces use raised #151C2B, muted #9AA7BD and border #273149. Light semantic foreground aliases blend success 40%, attention 35%, danger 65%, info 60%, and action text 70% with Ink Navy to retain AA contrast. The canonical base colours above remain unchanged. Proof Blue actions use Ink Navy foreground (5.33:1); hover blends 15% Frost White into Proof Blue. Focus uses Proof Blue on light surfaces and Signal Cyan on dark surfaces. State labels/icons remain necessary; colour alone conveys no authority or finality.

Compatibility names such as `--primary`, `--action`, `--success`, `--sidebar-*` and `--chart-*` remain available and map to this palette. Larger legacy radius names intentionally alias the approved 20px radius. They do not preserve purple/lavender values. Active legacy purple values are migrated to semantic action, information, attention or focus roles without changing capabilities or data sources.

Typography uses Geist Sans: wordmark/display 800; headings 700–800; navigation/controls 600–700; body 400–500. Geist Mono is only for hashes, addresses, identifiers, aligned timestamps, manifests and protocol data. Supported role sizes are display 32, title 28, section 20, body 16, small 14, label 12, code 14 and data 15px. Root layout loads the fonts; Storybook preview loads the same Geist configuration.

Spacing is 4/8/12/16/24/32/48/64px. Radii are 8/12/16/20px and pill. Control visuals are 36/44/52px, with at least a 44×44px interactive target. Sidebar is 256px, topbar 64px, and content maximum 1440px. Elevation uses borders first; the board's restrained raised shadow is 0 12px 36px at 22% black and never conveys state. It is not applied to the identity.

Motion is 120ms feedback, 180ms component, 240ms drawer, with `cubic-bezier(0.2, 0, 0, 1)`. Reduced-motion token durations become 1ms and existing global rules remove non-essential transforms/animations while retaining state labels and focus.

Storybook **Foundation / Brand and tokens** documents both themes, every base colour, type role, spacing, radius, dimensions, elevation and motion. Its theme action is presentation-only; fixtures import no production data/wallet adapters and enable no protocol mutation. Visual checks use approved 1440/768/390px widths plus 200% reflow, keyboard focus and reduced motion. Asset/token installation does not activate the candidate issue or apply `Stellar Wave`; maintainer activation remains separate.
