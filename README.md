# Node-AI-Z

結晶思考モデルを観察・体験・自己修正していくための実験アプリです。Node / Home / Revision / Memory を通じて、育つ知性の構造を見ていきます。

## コンセプト

Node-AI-Z は、固定人格の AI を完成品として置くためのアプリではありません。
入力に対して、場の判断 → 反応 → 姿勢 → Home への帰還 → 発話 → Self-Revision という流れを通し、応答がその都度「結晶化」することを観察するための環境です。

目指しているのは、ただ正しく返す AI ではなく、反応し、戻り、少しずつ育つ AI です。
そのためにアプリは二層構造になっています。

- **観察研究モード**: 内部プロセスを見て、構造・修正候補・変化を研究する
- **体験モード**: 表面では自然に話しつつ、裏側では同じ pipeline / home / revision / memory を動かして記録する

「分析 UI」そのものが目的ではなく、**育つ知性を観察する実験場**であることが、このリポジトリの中心です。

## 現在の構成

### Node Pipeline
入力テキストから Node を活性化し、Binding / Pattern / State Vector を立ち上げる基礎層です。反応の材料を決めます。

### Home Layer
過剰反応や断定をそのまま返さないための帰還層です。homeCheck と return adjustment によって、返答前に一度「戻る」処理をかけます。

### Studio ViewModel
Pipeline の結果を観察 UI 向けに整形する層です。Reply / Home / Pattern / Internal Process / Guide Observe など、研究表示に必要な情報をまとめます。

### Self-Revision / Memory Layer
返答ごとに revision entry と変更候補を生成し、memory に蓄積します。ユーザーが keep / soften / revert / lock を選べる形で、可視な自己修正を支えます。

### Observe Mode
既存の Node Studio UI をベースにした研究ビューです。Node / Relation / Pattern / Home / Revision を横断的に観察できます。

### Experience Mode
自然に話すための入口です。表面はチャット風でも、返答生成には既存の pipeline / home / revision を使い、結果は研究モードへ戻せます。

## モード説明

### 観察研究モード
内部構造を見るためのモードです。Node Studio として、反応・構造・修正・帰還を観察し、実験や比較に使います。

### 体験モード
AI と自然に話すためのモードです。ただし裏では各発話ごとに pipeline が走り、homeCheck / revision candidate / memory が記録されます。必要になったら「観察で見る」から研究ビューに戻れます。

## 現在実装済み

- Node Pipeline による node retrieval / relation binding / pattern lifting / state analysis
- Home Layer による return 判定と返答トーン調整
- Studio ViewModel による研究 UI 向け表示整形
- Reply / States / Relations / Patterns / Home / History / Revision タブ
- Self-Revision entry の生成、memory 蓄積、tuning アクション
- **観察研究モード / 体験モードの切り替え**
- 体験モードの疑似対話（`runNodePipeline` + `buildStudioViewModel` + `adjustedReplyPreview`）
- 体験モード会話のセッション保持と localStorage 保存
- 体験モードから観察研究モードへ戻る導線

## 今後の予定

- SRM-2 への進行
- plasticity の本格反映
- memory の昇格と整理ロジック強化
- tuning UI の強化
- より自然な体験会話と対話継続性の向上

## 開発メモ / 哲学

このアプリは、分析して終わるためのものではありません。変化を観察しながら、戻したり、比べたり、一緒に育てるためのものです。

AI が勝手に不可視な形で変わるのではなく、**変化が見えること・戻せること・共同で育てられること**を重視しています。

## セットアップ

```bash
npm ci
npm run dev
```

## 検証コマンド

```bash
npm run build
npm run lint
```
