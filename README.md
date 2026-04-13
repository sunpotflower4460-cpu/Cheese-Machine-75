# Cheese Machine 75

**Cheese Machine 75 is an observation, interpretation, and recording app built on Node-AI-Z.**

## Concept

Cheese Machine 75 is not an emotional support tool. It is an observation platform designed for detecting, interpreting, and archiving particle detection events from low-cost camera sensors (e.g., Raspberry Pi cameras acting as makeshift particle detectors).

Where Node-AI-Z maps emotional states to a field of nodes, Cheese Machine 75 maps event features — brightness, linearity, noise, rarity — to an observation node field. The pipeline produces structured interpretations, caution flags, and revision histories for each detected event.

The philosophy: **don't overclaim**. Rare signals are interesting; they are not proof. Every event gets a guide, a home/caution check, and a memory link to similar events.

## Relationship to Node-AI-Z

Cheese Machine 75 is built on the Node-AI-Z pipeline architecture:

| Node-AI-Z Layer | Cheese Machine 75 Layer |
|---|---|
| Text → Emotional nodes | Image features → Observation nodes |
| Node bindings | Observation bindings |
| Pattern lift | Pattern lift (particle / artifact / geometry) |
| State vector | Observation state vector |
| Home return / caution | Home check (artifact risk, claim softening) |
| Guide / utterance | Observation guide bundle |
| Self-revision | Crystal revision history |
| Memory | Archive + similar event links |

## The 4 Layers

1. **Raw** — raw sensor capture: source image, raw frame, raw log (no processing applied)
2. **Measured** — extracted features (brightness, linearity, noise, …), activated observation nodes, bindings, lifted patterns, and state vector derived from the raw image
3. **Inferred** — guide bundle (quick guide, deep guide, bridge guide), overlay hypotheses, pattern interpretations, and caution-annotated interpretations produced by the pipeline
4. **Revised** — revision history, re-evaluation memos, memory links to similar crystals, recheck flags, and post-evaluation updates

## What the MVP Can Do

- Load and cycle through sample particle detection events
- Run the full observation pipeline on each event
- Display activated nodes, bindings, and lifted patterns
- Render a guide bundle (quick/deep/bridge + caution notes)
- Apply a home/caution check (prevents overclaiming)
- Save events as **observation crystals** to localStorage
- View crystal archive with sorting
- Full event detail view with raw/inferred/revised layers
- Lab view for comparing two events side by side
- Studio view showing the full internal pipeline process
- SVG overlay visualization with measured/predicted/simulated tracks

## Future Plans

- Real camera frame capture and image processing
- Cross-device correlation via shared session IDs
- Monte Carlo simulation overlay comparison
- Cloud archive with user accounts
- Statistical baseline characterization across many events
- Export to standard particle physics formats (HepMC, ROOT-compatible CSV)
