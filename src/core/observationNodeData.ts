// Observation Node Dictionary for Cheese Machine 75
// Replaces emotion-centric nodes with observation-domain nodes

import type { ObservationNodeCategory } from '../types/observation'

export const OBS_CATEGORY_LABEL: Record<ObservationNodeCategory, string> = {
  signal: 'Signal',
  artifact: 'Artifact',
  geometry: 'Geometry',
  context: 'Context',
  hypothesis: 'Hypothesis',
  system: 'System',
}

export type ObsNodeDef = {
  id: string
  label: string
  category: ObservationNodeCategory
  description: string
  triggerHints: string[]           // feature conditions that activate this node
}

export const OBS_NODE_DICT: Record<string, { description: string; triggerHints: string[] }> = {
  linear_trace: {
    description: 'A straight or nearly straight track – classic particle candidate.',
    triggerHints: ['high linearity', 'low curvature', 'significant length'],
  },
  scattered_path: {
    description: 'A path showing multiple scattering – possible heavy particle or compound event.',
    triggerHints: ['high scatter score', 'low linearity'],
  },
  clustered_flash: {
    description: 'A tight cluster of activated pixels – could be delta ray, neutron scatter, or hot pixel group.',
    triggerHints: ['high cluster score', 'low length'],
  },
  hot_pixel_pattern: {
    description: 'Persistent or isolated bright pixels matching known sensor defect patterns.',
    triggerHints: ['high noise score', 'high brightness', 'very low length'],
  },
  thermal_noise_bias: {
    description: 'Elevated background noise consistent with thermal effects.',
    triggerHints: ['high noise score', 'low rarity'],
  },
  low_noise_context: {
    description: 'Observation context shows unusually low noise – increases signal trust.',
    triggerHints: ['very low noise score'],
  },
  unusual_event: {
    description: 'Event characteristics are statistically unusual compared to baseline.',
    triggerHints: ['high rarity score'],
  },
  possible_particle_candidate: {
    description: 'Features suggest a real particle track worth investigating further.',
    triggerHints: ['high linearity', 'low noise', 'moderate-to-high rarity'],
  },
  likely_sensor_artifact: {
    description: 'Multiple artifact indicators present – treat with strong skepticism.',
    triggerHints: ['high noise', 'known hot pixel signature', 'low rarity'],
  },
  worth_recheck: {
    description: 'Ambiguous event that merits a second look or comparison with other frames.',
    triggerHints: ['moderate rarity', 'moderate noise', 'unclear geometry'],
  },
  cross_device_match_needed: {
    description: 'Event should ideally be correlated with another device to confirm.',
    triggerHints: ['high rarity', 'high particle likelihood'],
  },
  geometry_hint: {
    description: 'The spatial geometry of the track provides interpretive information.',
    triggerHints: ['high linearity or curvature', 'meaningful length'],
  },
  multi_origin_possibility: {
    description: 'Track may originate from multiple sources or interaction vertices.',
    triggerHints: ['high scatter', 'high cluster', 'complex geometry'],
  },
  simulation_recommended: {
    description: 'Event is a candidate for comparison against simulation overlays.',
    triggerHints: ['possible particle candidate', 'unusual event'],
  },
  artifact_bias: {
    description: 'General prior bias toward artifact explanation in the absence of strong signal.',
    triggerHints: ['insufficient signal clarity'],
  },
  strong_signal: {
    description: 'High brightness combined with clear geometry – strong raw signal.',
    triggerHints: ['high brightness', 'high linearity', 'low noise'],
  },
  faint_trace: {
    description: 'Low brightness event, potentially real but hard to distinguish from noise.',
    triggerHints: ['low brightness', 'low-moderate noise'],
  },
  curved_track: {
    description: 'Significantly curved track – suggests magnetic field interaction or decay.',
    triggerHints: ['high curvature', 'low linearity', 'meaningful length'],
  },
  double_track_hint: {
    description: 'Possible evidence of two overlapping tracks from a single interaction.',
    triggerHints: ['high width', 'moderate scatter', 'moderate cluster'],
  },
  archive_worthy: {
    description: 'Event meets threshold for archiving as a notable observation.',
    triggerHints: ['low artifact risk', 'interesting features', 'low noise'],
  },
}

export const OBS_CORE_NODES: ObsNodeDef[] = [
  { id: 'linear_trace', label: 'linear_trace', category: 'signal', description: OBS_NODE_DICT.linear_trace.description, triggerHints: OBS_NODE_DICT.linear_trace.triggerHints },
  { id: 'scattered_path', label: 'scattered_path', category: 'signal', description: OBS_NODE_DICT.scattered_path.description, triggerHints: OBS_NODE_DICT.scattered_path.triggerHints },
  { id: 'clustered_flash', label: 'clustered_flash', category: 'signal', description: OBS_NODE_DICT.clustered_flash.description, triggerHints: OBS_NODE_DICT.clustered_flash.triggerHints },
  { id: 'hot_pixel_pattern', label: 'hot_pixel_pattern', category: 'artifact', description: OBS_NODE_DICT.hot_pixel_pattern.description, triggerHints: OBS_NODE_DICT.hot_pixel_pattern.triggerHints },
  { id: 'thermal_noise_bias', label: 'thermal_noise_bias', category: 'artifact', description: OBS_NODE_DICT.thermal_noise_bias.description, triggerHints: OBS_NODE_DICT.thermal_noise_bias.triggerHints },
  { id: 'low_noise_context', label: 'low_noise_context', category: 'context', description: OBS_NODE_DICT.low_noise_context.description, triggerHints: OBS_NODE_DICT.low_noise_context.triggerHints },
  { id: 'unusual_event', label: 'unusual_event', category: 'signal', description: OBS_NODE_DICT.unusual_event.description, triggerHints: OBS_NODE_DICT.unusual_event.triggerHints },
  { id: 'possible_particle_candidate', label: 'possible_particle_candidate', category: 'hypothesis', description: OBS_NODE_DICT.possible_particle_candidate.description, triggerHints: OBS_NODE_DICT.possible_particle_candidate.triggerHints },
  { id: 'likely_sensor_artifact', label: 'likely_sensor_artifact', category: 'artifact', description: OBS_NODE_DICT.likely_sensor_artifact.description, triggerHints: OBS_NODE_DICT.likely_sensor_artifact.triggerHints },
  { id: 'worth_recheck', label: 'worth_recheck', category: 'hypothesis', description: OBS_NODE_DICT.worth_recheck.description, triggerHints: OBS_NODE_DICT.worth_recheck.triggerHints },
  { id: 'cross_device_match_needed', label: 'cross_device_match_needed', category: 'hypothesis', description: OBS_NODE_DICT.cross_device_match_needed.description, triggerHints: OBS_NODE_DICT.cross_device_match_needed.triggerHints },
  { id: 'geometry_hint', label: 'geometry_hint', category: 'geometry', description: OBS_NODE_DICT.geometry_hint.description, triggerHints: OBS_NODE_DICT.geometry_hint.triggerHints },
  { id: 'multi_origin_possibility', label: 'multi_origin_possibility', category: 'geometry', description: OBS_NODE_DICT.multi_origin_possibility.description, triggerHints: OBS_NODE_DICT.multi_origin_possibility.triggerHints },
  { id: 'simulation_recommended', label: 'simulation_recommended', category: 'hypothesis', description: OBS_NODE_DICT.simulation_recommended.description, triggerHints: OBS_NODE_DICT.simulation_recommended.triggerHints },
  { id: 'artifact_bias', label: 'artifact_bias', category: 'artifact', description: OBS_NODE_DICT.artifact_bias.description, triggerHints: OBS_NODE_DICT.artifact_bias.triggerHints },
  { id: 'strong_signal', label: 'strong_signal', category: 'signal', description: OBS_NODE_DICT.strong_signal.description, triggerHints: OBS_NODE_DICT.strong_signal.triggerHints },
  { id: 'faint_trace', label: 'faint_trace', category: 'signal', description: OBS_NODE_DICT.faint_trace.description, triggerHints: OBS_NODE_DICT.faint_trace.triggerHints },
  { id: 'curved_track', label: 'curved_track', category: 'signal', description: OBS_NODE_DICT.curved_track.description, triggerHints: OBS_NODE_DICT.curved_track.triggerHints },
  { id: 'double_track_hint', label: 'double_track_hint', category: 'geometry', description: OBS_NODE_DICT.double_track_hint.description, triggerHints: OBS_NODE_DICT.double_track_hint.triggerHints },
  { id: 'archive_worthy', label: 'archive_worthy', category: 'hypothesis', description: OBS_NODE_DICT.archive_worthy.description, triggerHints: OBS_NODE_DICT.archive_worthy.triggerHints },
]

export const OBS_BINDING_RULES: Array<{ source: string; target: string; type: string }> = [
  { source: 'linear_trace', target: 'possible_particle_candidate', type: 'drives' },
  { source: 'scattered_path', target: 'multi_origin_possibility', type: 'drives' },
  { source: 'clustered_flash', target: 'hot_pixel_pattern', type: 'tension' },
  { source: 'hot_pixel_pattern', target: 'likely_sensor_artifact', type: 'amplified_by' },
  { source: 'thermal_noise_bias', target: 'artifact_bias', type: 'sustains' },
  { source: 'low_noise_context', target: 'possible_particle_candidate', type: 'amplified_by' },
  { source: 'unusual_event', target: 'worth_recheck', type: 'drives' },
  { source: 'possible_particle_candidate', target: 'simulation_recommended', type: 'drives' },
  { source: 'possible_particle_candidate', target: 'cross_device_match_needed', type: 'drives' },
  { source: 'likely_sensor_artifact', target: 'possible_particle_candidate', type: 'conflicts_with' },
  { source: 'curved_track', target: 'geometry_hint', type: 'because_of' },
  { source: 'strong_signal', target: 'archive_worthy', type: 'drives' },
  { source: 'faint_trace', target: 'worth_recheck', type: 'drives' },
  { source: 'double_track_hint', target: 'multi_origin_possibility', type: 'amplified_by' },
]

export const OBS_PATTERN_RULES: Array<{ id: string; label: string; reqNodes: string[]; description: string }> = [
  {
    id: 'clean_particle_track',
    label: 'Clean Particle Track',
    reqNodes: ['linear_trace', 'possible_particle_candidate', 'low_noise_context'],
    description: 'Strong evidence of a real particle track in clean conditions.',
  },
  {
    id: 'ambiguous_candidate',
    label: 'Ambiguous Candidate',
    reqNodes: ['worth_recheck', 'artifact_bias'],
    description: 'Could be real, could be artifact. Needs further investigation.',
  },
  {
    id: 'artifact_cluster',
    label: 'Artifact Cluster',
    reqNodes: ['hot_pixel_pattern', 'thermal_noise_bias'],
    description: 'Multiple artifact indicators – likely not a real particle event.',
  },
  {
    id: 'unusual_geometry',
    label: 'Unusual Geometry',
    reqNodes: ['unusual_event', 'geometry_hint'],
    description: 'Unusual signal with interesting geometric features worth noting.',
  },
  {
    id: 'complex_interaction',
    label: 'Complex Interaction',
    reqNodes: ['multi_origin_possibility', 'simulation_recommended'],
    description: 'Complex event that may involve multiple particles or interaction vertices.',
  },
  {
    id: 'recheck_candidate',
    label: 'Recheck Candidate',
    reqNodes: ['worth_recheck', 'cross_device_match_needed'],
    description: 'Interesting enough to flag for device correlation or second review.',
  },
]
