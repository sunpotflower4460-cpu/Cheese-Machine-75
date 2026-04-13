// Feature extraction from observation events
// For MVP: rule-based extraction from mock/sample data
// Future: replace with real image processing
//
// 写像 M2: Event (Raw) → Measured
// このファイルは Raw 層（カメラフレーム・検出イベントの生データ）から
// Measured 層（EventFeatures）を作る責務を担う。
// Raw と Measured は別の層であり、混同しないこと。

import type { EventFeatures } from '../../types/observation'

/** Clamp a value between 0 and 1 */
const clamp = (v: number): number => Math.max(0, Math.min(1, v))

/**
 * M2: Event (Raw) → Measured
 *
 * 生のイベントデータ（フレーム画像・ピクセル値など）から
 * 正規化された測定値 (EventFeatures) を生成する。
 *
 * @param raw - Raw 層の入力値（部分的でもよい）。実装上は Partial<EventFeatures> だが、
 *              将来は画像バッファやフレームオブジェクトになる。
 * @returns EventFeatures - Measured 層の値。すべて 0–1 に正規化されている。
 */
export function extractEventFeatures(raw: Partial<EventFeatures>): EventFeatures {
  return {
    brightness: clamp(raw.brightness ?? 0.5),
    length: clamp(raw.length ?? 0.3),
    width: clamp(raw.width ?? 0.15),
    linearity: clamp(raw.linearity ?? 0.5),
    curvature: clamp(raw.curvature ?? 0.2),
    scatterScore: clamp(raw.scatterScore ?? 0.2),
    clusterScore: clamp(raw.clusterScore ?? 0.2),
    rarityScore: clamp(raw.rarityScore ?? 0.3),
    noiseScore: clamp(raw.noiseScore ?? 0.3),
  }
}

/**
 * M2 (テスト用): ランダムな EventFeatures を生成する。
 * 本番では Raw フレームから extractEventFeatures を呼び出すこと。
 */
export function randomEventFeatures(seed?: number): EventFeatures {
  let s = seed ?? Math.random() * 1000
  const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff }
  return extractEventFeatures({
    brightness: r(),
    length: r(),
    width: r() * 0.3,
    linearity: r(),
    curvature: r() * 0.5,
    scatterScore: r() * 0.6,
    clusterScore: r() * 0.6,
    rarityScore: r(),
    noiseScore: r() * 0.7,
  })
}
