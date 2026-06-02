import type { DataQualityFlag, MeasuredSource, MorphologyClass, ObservationHomeCheck } from '../../types/observation'
import { shouldCapClaimStrength } from '../observation/measuredSource'

export type CandidateWordingInput = {
  morphology?: MorphologyClass
  qualityFlags: DataQualityFlag[]
  measuredSource: MeasuredSource
  homeCheck: ObservationHomeCheck
  calibrationStatus?: string
}

export type CandidateWordingOutput = {
  shortLabel: string
  summarySentence: string
  cautionSentence: string
  publicShareText: string
}

const HIGH_ARTIFACT_FLAGS: DataQualityFlag[] = [
  'hot-pixel-overlap-high',
  'thermal-noise-high',
  'light-leak-suspected',
  'frame-too-bright',
  'device-moving',
  'compression-risk',
]

function getCandidateLabel(morphology?: MorphologyClass): string {
  switch (morphology) {
    case 'track': return 'track-like candidate'
    case 'worm': return 'worm-like candidate'
    case 'spot': return 'spot-like candidate'
    case 'cluster': return 'cluster-like candidate'
    case 'artifact': return 'artifact-like candidate'
    default: return 'sensor event candidate'
  }
}

function getMeasuredSummary(measuredSource: MeasuredSource): string {
  switch (measuredSource) {
    case 'placeholder-dimension':
      return 'from placeholder values, not real pixel measurements'
    case 'sample-authored':
      return 'from authored sample values, not real pixel measurements'
    case 'pixel-derived':
      return 'from bright pixels in a single frame'
    case 'calibrated-pixel':
      return 'from bright pixels with calibration applied'
    case 'temporal-difference':
      return 'from frame-to-frame bright pixel differences'
    case 'external-agent':
      return 'from an external analysis source'
  }
}

function isCalibrated(input: CandidateWordingInput): boolean {
  return input.measuredSource === 'calibrated-pixel'
    || input.qualityFlags.includes('calibrated-session')
    || input.calibrationStatus === 'applied'
}

function hasHighArtifactRisk(input: CandidateWordingInput): boolean {
  return input.qualityFlags.some((flag) => HIGH_ARTIFACT_FLAGS.includes(flag))
    || input.homeCheck.reasons.some((reason) => reason.toLowerCase().includes('artifact'))
}

export function candidateWording(input: CandidateWordingInput): CandidateWordingOutput {
  const shortLabel = getCandidateLabel(input.morphology)
  const summarySentence = `This frame contains a ${shortLabel} measured ${getMeasuredSummary(input.measuredSource)}.`
  const placeholder = shouldCapClaimStrength(input.measuredSource)
  const artifactRisk = hasHighArtifactRisk(input)
  const calibrated = isCalibrated(input)

  let cautionSentence = 'Treat this as interesting but unconfirmed, and recheck before any strong interpretation.'

  if (placeholder) {
    cautionSentence = 'This is a placeholder observation and not a real pixel measurement.'
  } else if (artifactRisk) {
    cautionSentence = 'Artifact risk is high, so this event requires recheck and should stay unconfirmed.'
  } else if (!calibrated) {
    cautionSentence = 'Because this session was not calibrated, save this as interesting but unconfirmed.'
  } else if (input.homeCheck.softenClaim || input.homeCheck.cautionUp) {
    cautionSentence = 'Calibration helps, but this remains a candidate and needs careful recheck.'
  }

  const publicShareText = `${summarySentence} ${cautionSentence} This is not proof of particle or cosmic-ray detection.`

  return {
    shortLabel,
    summarySentence,
    cautionSentence,
    publicShareText,
  }
}
