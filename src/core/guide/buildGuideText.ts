// Guide text builder for Cheese Machine 75
// Converts pipeline results into human-readable interpretation guides
// Philosophy: do not overclaim; show what is seen, why, alternatives, and what is uncertain
//
// 写像 M10: Pipeline + Home → Guide
// このファイルは ObservationPipelineResult と ObservationHomeCheck を受け取り、
// 人間向けの解釈ガイド (GuideBundle) を生成する。
//
// Guide は「断定」ではなく「測定・仮説・保留」を橋渡しするテキスト。
// Guide の材料 (GuideInput) を明示することで、どこから何が来ているかを追いやすくする。

import type { GuideBundle, ObservationHomeCheck, ObservationPipelineResult } from '../../types/observation'
import { deriveMeasuredSource } from '../observation/measuredSource'
import { classifyMorphology } from '../morphology/classifyMorphology'
import { candidateWording } from '../wording/candidateWording'

/**
 * M10 の入力材料をまとめた内部型。
 * パイプライン結果とホームチェックから、ガイド生成に必要な要素を抽出したもの。
 */
type GuideInput = {
  /** Measured 層由来: 測定された特徴量 */
  features: ObservationPipelineResult['input']['features']
  /** Nodes 層由来: 発火した観測ノード */
  activatedNodes: ObservationPipelineResult['activatedNodes']
  /** Nodes 層由来: 引き上げられたパターン */
  liftedPatterns: ObservationPipelineResult['liftedPatterns']
  /** Inferred 層: 状態ベクトル（信頼度・アーティファクトリスクなど） */
  stateVector: ObservationPipelineResult['stateVector']
  /** M8 由来: 慎重度・主張抑制フラグ */
  homeCheck: ObservationHomeCheck
}

/** pipelineResult と homeCheck から GuideInput を構築するヘルパー */
function buildGuideInput(result: ObservationPipelineResult, homeCheck: ObservationHomeCheck): GuideInput {
  return {
    features: result.input.features,
    activatedNodes: result.activatedNodes,
    liftedPatterns: result.liftedPatterns,
    stateVector: result.stateVector,
    homeCheck,
  }
}

/**
 * M10: Pipeline + Home → Guide
 *
 * ObservationPipelineResult と ObservationHomeCheck を受け取り、
 * quickGuide / deepGuide / bridgeGuide / cautionNotes を含む GuideBundle を返す。
 *
 * @param result - M4 の出力 (ObservationPipelineResult)
 * @param homeCheck - M8 の出力 (ObservationHomeCheck)。省略時は慎重度なしとして扱う。
 */
export function buildGuideText(result: ObservationPipelineResult, homeCheck?: ObservationHomeCheck): GuideBundle {
  // M10 の入力材料を GuideInput として明示する
  const guideInput: GuideInput = buildGuideInput(result, homeCheck ?? {
    cautionUp: false,
    softenClaim: false,
    holdAsInteresting: false,
    keepAsStrongCandidate: false,
    reasons: [],
  })
  const { stateVector, activatedNodes, liftedPatterns, features } = guideInput
  const hasNode = (id: string) => activatedNodes.some((n) => n.id === id)
  const qualityFlags = result.qualityAssessment?.flags ?? []
  const measuredSource = result.input.measuredSource ?? deriveMeasuredSource(result.input.sourceType)
  const wording = candidateWording({
    morphology: classifyMorphology(features).morphologyClass,
    qualityFlags,
    measuredSource,
    homeCheck: guideInput.homeCheck,
    calibrationStatus: qualityFlags.includes('calibrated-session') ? 'applied' : 'none',
  })

  // Quick guide – 1-2 sentences
  let quickGuide = wording.summarySentence
  if (stateVector.artifactRisk > 0.65 || hasNode('worth_recheck')) {
    quickGuide = `${wording.summarySentence} ${wording.cautionSentence}`
  }

  // Deep guide
  const lines: string[] = []
  lines.push(`**What is seen:** ${wording.summarySentence} Brightness ${features.brightness.toFixed(2)}, length ${features.length.toFixed(2)}, linearity ${features.linearity.toFixed(2)}.`)

  if (hasNode('linear_trace')) {
    lines.push(`A high-linearity path is present (${features.linearity.toFixed(2)}), supporting a track-like candidate interpretation.`)
  }
  if (hasNode('curved_track')) {
    lines.push(`The path shows significant curvature (${features.curvature.toFixed(2)}). Keep this as a geometry hint only and recheck against artifacts.`)
  }
  if (hasNode('scattered_path')) {
    lines.push(`Scattering is visible (scatter score: ${features.scatterScore.toFixed(2)}). This can reflect complex signal structure, but also noise accumulation.`)
  }
  if (hasNode('clustered_flash')) {
    lines.push(`A tight cluster of bright pixels is present. This can occur from transient sensor events or hot-pixel groups.`)
  }

  lines.push(`**Why it appears this way:** The node pipeline activated ${activatedNodes.length} nodes. Dominant signals: ${activatedNodes.slice(0, 3).map((n) => n.label).join(', ')}.`)

  if (liftedPatterns.length > 0) {
    lines.push(`Pattern match: ${liftedPatterns[0].label} (score: ${liftedPatterns[0].score.toFixed(2)}).`)
  }

  const deepGuide = lines.join(' ')

  // Bridge guide
  let bridgeGuide = ''
  if (hasNode('simulation_recommended')) {
    bridgeGuide = 'Consider comparing this event against a Monte Carlo simulation to test the particle hypothesis. Overlay comparison is available in the Lab view.'
  } else if (hasNode('cross_device_match_needed')) {
    bridgeGuide = 'This event would benefit from cross-device correlation. Check the Archive for events from other devices with similar timestamps.'
  } else if (hasNode('worth_recheck')) {
    bridgeGuide = 'Save this event and revisit it with a fresh eye. It may connect to a pattern only visible across multiple observations.'
  } else {
    bridgeGuide = 'Archive this observation for future reference. Even ambiguous events contribute to baseline characterization.'
  }

  // Caution notes
  const cautionNotes: string[] = [wording.cautionSentence]

  if (stateVector.artifactRisk > 0.5) {
    cautionNotes.push(`Artifact risk is elevated (${(stateVector.artifactRisk * 100).toFixed(0)}%). Keep this as a candidate and recheck before interpretation.`)
  }
  if (features.noiseScore > 0.5) {
    cautionNotes.push(`Noise level is significant (${features.noiseScore.toFixed(2)}). Signal features may be partially noise-driven.`)
  }
  if (stateVector.claimStrength > 0.7 && stateVector.confidence < 0.6) {
    cautionNotes.push('Claim strength is high but confidence is moderate. Consider softening the interpretation.')
  }
  if (hasNode('likely_sensor_artifact')) {
    cautionNotes.push('Sensor artifact indicators are active. Treat this event with strong skepticism.')
  }
  if (cautionNotes.length === 0) {
    cautionNotes.push('No major cautions. Standard verification still recommended before strong claims.')
  }

  return { quickGuide, deepGuide, bridgeGuide, cautionNotes }
}
