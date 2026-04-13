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

  let cautionUp = false
  let softenClaim = false
  let holdAsInteresting = false
  let keepAsStrongCandidate = false

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
  if (stateVector.artifactRisk > 0.5 && stateVector.claimStrength > 0.6) {
    softenClaim = true
    cautionUp = true
    reasons.push(`Artifact risk (${stateVector.artifactRisk.toFixed(2)}) is too high for strong particle claim.`)
  }

  // Guide text should not be too assertive if confidence is low
  if (stateVector.claimStrength > 0.7 && stateVector.confidence < 0.55) {
    softenClaim = true
    reasons.push('Claim strength exceeds confidence level – soften language.')
  }

  // Allow strong candidate only if all conditions are favorable
  if (
    stateVector.particleLikelihood > 0.65 &&
    stateVector.confidence > 0.6 &&
    stateVector.artifactRisk < 0.35 &&
    !hasNode('likely_sensor_artifact')
  ) {
    keepAsStrongCandidate = true
    holdAsInteresting = true
    reasons.push('All indicators favorable for strong particle candidate.')
  } else if (!cautionUp && !softenClaim) {
    holdAsInteresting = true
    reasons.push('Moderately interesting event, no critical cautions.')
  }

  return { cautionUp, softenClaim, holdAsInteresting, keepAsStrongCandidate, reasons }
}
