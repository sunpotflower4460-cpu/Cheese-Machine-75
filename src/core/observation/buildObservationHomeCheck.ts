// Home/caution check for observation pipeline
// Purpose: prevent exciting findings from being over-claimed
// Parallel to homeLayer.ts but for observation domain
//
// 写像 M8: ObservationStateVector + Patterns → ObservationHomeCheck
// このファイルは「パイプラインが出した状態」を受け取り、
// 観測主張をどの程度慎重にすべきかを判定する。
//
// 入力: ObservationStateVector (confidence, artifactRisk, particleLikelihood, ...) + activated nodes
// 出力: ObservationHomeCheck
//   - cautionUp           ... 慎重表示を上げる
//   - softenClaim         ... 主張の言語を和らげる
//   - holdAsInteresting   ... 「興味深いが断定しない」としてフラグを立てる
//   - keepAsStrongCandidate ... 強い候補として許容する
//
// ※ Node-AI-Z の「内面的帰還」の概念を、観測上の主張抑制・慎重化として再解釈している。

import type { ObservationHomeCheck, ObservationPipelineResult } from '../../types/observation'
import { shouldCapClaimStrength, getMeasuredSourceLabel } from './measuredSource'

/**
 * M8: State + Patterns → Home/Caution
 *
 * ObservationPipelineResult の stateVector とノード情報から
 * ObservationHomeCheck を生成する。
 * 出力は Guide 生成 (M10) と Crystal 保存 (M11) で利用される。
 */
export function buildObservationHomeCheck(result: ObservationPipelineResult): ObservationHomeCheck {
  const { stateVector, activatedNodes } = result
  const hasNode = (id: string) => activatedNodes.some((n) => n.id === id)
  const reasons: string[] = []
  const qualityFlags = result.qualityAssessment?.flags ?? []

  let cautionUp = false
  let softenClaim = false
  let holdAsInteresting = false
  let keepAsStrongCandidate = false

  const hasQualityFlag = (flag: typeof qualityFlags[number]) => qualityFlags.includes(flag)
  const hasClaimCapFlag = hasQualityFlag('placeholder-measurement') || hasQualityFlag('baseline-missing')
  const artifactRiskBoost = hasQualityFlag('hot-pixel-overlap-high') ? 0.2 : 0
  const artifactRisk = Math.min(1, stateVector.artifactRisk + artifactRiskBoost)
  const confidenceSupport =
    Number(hasQualityFlag('calibrated-session')) * 0.03 +
    Number(hasQualityFlag('good-dark-frame')) * 0.02

  // If the measured source is placeholder or authored, cap claim strength unconditionally.
  // The current pipeline has no real pixel analyzer; all uploaded-image and camera values
  // are dimension-derived placeholders that must not be presented as sensor measurements.
  const measuredSource = result.input.measuredSource
  if (measuredSource && shouldCapClaimStrength(measuredSource)) {
    cautionUp = true
    softenClaim = true
    reasons.push(`Measurement source is "${getMeasuredSourceLabel(measuredSource)}" — values are not derived from real pixel analysis. Strong claims are not permitted.`)
  }

  if (hasClaimCapFlag) {
    cautionUp = true
    softenClaim = true
    reasons.push('Quality flags indicate placeholder or missing baseline calibration; claim strength is capped.')
  }

  // If noise is too high, raise caution
  if (stateVector.noiseLevel > 0.55) {
    cautionUp = true
    reasons.push(`Noise level ${stateVector.noiseLevel.toFixed(2)} exceeds threshold.`)
  }

  // Rarity alone should not make a strong claim
  if (stateVector.raritySignal > 0.7 && stateVector.confidence < 0.6) {
    softenClaim = true
    holdAsInteresting = true
    reasons.push('High rarity but insufficient confidence to claim strong candidate.')
  }

  // Artifact risk suppresses particle claims
  if (artifactRisk > 0.5 && stateVector.claimStrength > 0.6) {
    softenClaim = true
    cautionUp = true
    reasons.push(`Artifact risk (${artifactRisk.toFixed(2)}) is too high for strong particle claim.`)
  }

  if (hasQualityFlag('hot-pixel-overlap-high')) {
    cautionUp = true
    reasons.push('Hot-pixel overlap quality flag raised artifact caution.')
  }

  // Guide text should not be too assertive if confidence is low
  if (stateVector.claimStrength > 0.7 && stateVector.confidence < 0.55) {
    softenClaim = true
    reasons.push('Claim strength exceeds confidence level – soften language.')
  }

  // Allow strong candidate only if all conditions are favorable AND measurement is not capped
  if (
    !softenClaim &&
    stateVector.particleLikelihood > 0.65 &&
    stateVector.confidence + confidenceSupport > 0.6 &&
    artifactRisk < 0.35 &&
    !hasNode('likely_sensor_artifact')
  ) {
    keepAsStrongCandidate = true
    holdAsInteresting = true
    reasons.push('All indicators favorable for strong particle candidate.')
  } else if (!cautionUp && !softenClaim) {
    holdAsInteresting = true
    reasons.push('Moderately interesting event, no critical cautions.')
  }

  if (confidenceSupport > 0) {
    reasons.push('Calibration/dark-frame quality provides modest confidence support only; it is not proof.')
  }

  return { cautionUp, softenClaim, holdAsInteresting, keepAsStrongCandidate, reasons }
}
