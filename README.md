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

## Mapping / 写像

Cheese Machine 75 では、観測データは一度に完成するのではなく、
**複数の層を経て段階的に変換**される。
この変換の経路を「写像」として明示することで、Guide や Crystal の根拠が追いやすくなる。

「写像」とは、ある情報の世界（例: Raw 画像）を別の情報の世界（例: Measured 特徴量）へ
変換する責務を指す。コード上では関数・型・コメントによってその境界を可視化している。

### 主要写像

| ID | 名前 | 入力 | 出力 | 実装場所 |
|---|---|---|---|---|
| **M2** | EventToMeasured | Event / Raw frame | EventFeatures (Measured) | `extractEventFeatures.ts` |
| **M4** | MeasuredToNodes | EventFeatures + Context | Nodes / Bindings / Patterns | `runObservationPipeline.ts` |
| **M6** | NodesToStateVector | Nodes / Bindings / Patterns / Features | ObservationStateVector | `buildObservationStateVector.ts` |
| **M8** | StateToCaution | StateVector + Nodes | ObservationHomeCheck | `buildObservationHomeCheck.ts` |
| **M10** | PipelineToGuide | Pipeline result + HomeCheck | GuideBundle | `buildGuideText.ts` |
| **M11** | LayersToCrystal | Raw + Measured + Inferred | ObservationCrystal | `buildObservationCrystal.ts` |

これにより、「なぜこの Guide が出たか」「Crystal に何が記録されているか」を
M2 → M4 → M6 → M8 → M10 → M11 の順に遡ることができる。

M2 (EventToMeasured) の出力が Measured 層。
M4 以降（MeasuredToNodes, NodesToStateVector, StateToCaution, PipelineToGuide）の出力は Inferred 層に属する。

特に M6 では、Nodes / Bindings / Patterns / Features を
ObservationStateVector（confidence, artifactRisk, particleLikelihood, caution など）へ写像する。
そのため Guide の根拠は「測定値からノードを立てる」だけでなく、
「そのノード場がどの状態ベクトルを作ったか」まで追える。

写像一覧は `src/core/mappings/mappingCatalog.ts` にも辞書として管理している。


1. **Raw** — raw sensor capture: source image, raw frame, raw log, sourceType, and other unprocessed input data
2. **Measured** — what is directly measured from the raw input: extracted features, detected lines, and numerical analysis results
3. **Inferred** — what the pipeline concludes or constructs from measured data: activated observation nodes, bindings, lifted patterns, state vector, home/caution result, guide bundle, and overlay hypotheses
4. **Revised** — revision history, recheck flags, memory links to similar crystals, reevaluation notes, and later updates

## Studio traceability

- Studio の Current Mapping Flow は M2/M4/M6/M8/M10/M11 の各ステップへジャンプし、対応セクションをハイライトして確認できます。
- 各セクションにはどの layer に属するか（Raw / Measured / Inferred / Revised）を示す badge を表示しています。
- M6 の ObservationStateVector では features / nodes / patterns を contributor として薄く可視化し、confidence や artifactRisk が立ち上がった根拠を追いやすくしました。
- Guide と Home Check も同じ写像の流れで辿れるため、「なぜこの Guide になったか」を Studio 上で確認できます。
- M4 以降 (nodes / bindings / patterns / state vector / caution / guide / overlays) は Inferred 層に属します。Measured (M2 出力) は特徴量や検出線などの直接測定結果のみです。

## Measured feature visibility

- **Event Detail** の Measured タブでは、Raw から直接抽出された特徴量や検出線などの測定結果（geometry / noise / rarity など）を表示します。
- Measured タブはあくまで「測定値」のみを扱います。Nodes / Bindings / Patterns / State Vector / Guide は Inferred 側で扱います。
- uploaded image 由来の観測では、「この画像から抽出された特徴」であることを明示するヒントを表示します。
- **Studio** の Measured セクションでは、特徴量の意味説明を強化し、uploaded image 由来であることを sourceType バッジで示します。
- feature → node → state のつながりを薄く可視化し、どの特徴がどの node / state に寄与したかを追いやすくしました。
- sourceType（sample / uploaded-image）を Event Detail と Studio の両方で表示し、観測の由来を分かりやすくしました。

## What the MVP Can Do

- Load and cycle through sample particle detection events
- **Upload a local image (jpg/png/webp) as a Raw observation input** — use the "Upload image" tab in Live Observe
- **Capture a single frame from the browser camera and use it as a Raw observation input** — open the "Camera" tab in Live Observe and freeze the current frame
- Run the full observation pipeline on each event (sample or uploaded)
- Display activated nodes, bindings, and lifted patterns
- Render a guide bundle (quick/deep/bridge + caution notes)
- Apply a home/caution check (prevents overclaiming)
- Save events as **observation crystals** to localStorage (sourceType is preserved: `sample` or `uploaded-image`)
- View crystal archive with sorting; uploaded-image crystals are marked with a badge
- Full event detail view with raw/measured/inferred/revised layers (Raw tab shows source type)
- Lab view for comparing two events side by side
- Studio view showing the full internal pipeline process
- SVG overlay visualization with measured/predicted/simulated tracks

## Input Sources

Cheese Machine 75 supports three Raw input sources:

| sourceType | Description |
|---|---|
| `sample` | Built-in sample particle detection events (SVG placeholders) |
| `uploaded-image` | User-uploaded image (jpg/png/webp) treated as a Raw observation input |
| `camera` | Single frame captured from the browser camera and frozen as Raw input |

All three sources flow through the same pipeline (M2 → M4 → M6 → M8 → M10 → M11).
Feature extraction for uploaded and camera frames is currently a lightweight placeholder (image-dimension-based);
pixel-level analysis and continuous real-time detection are planned follow-ups.

## Future Plans

- Continuous camera streaming with real-time detection and richer image processing
- Advanced pixel-level image analysis for uploaded images (currently uses lightweight dimension-based features)
- Cross-device correlation via shared session IDs
- Monte Carlo simulation overlay comparison
- Cloud archive with user accounts
- Statistical baseline characterization across many events
- Export to standard particle physics formats (HepMC, ROOT-compatible CSV)
