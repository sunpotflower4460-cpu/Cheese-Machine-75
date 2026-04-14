// Sample/mock observation events for MVP testing
// Replace with real camera events in future
//
// Test case types covered:
//   sample-001: linear_candidate    — clean straight track, low noise
//   sample-002: artifact_like       — hot pixel cluster suspect, high noise
//   sample-003: scattered_candidate — curved track with moderate scatter
//   sample-004: uncertain_event     — ambiguous signal, worth a second look
//   sample-005: strong_candidate    — very clean long straight track, archive-worthy

import type { ObservationInput } from '../../types/observation'
import { extractEventFeatures } from './extractEventFeatures'

const SAMPLE_CONTEXT = {
  deviceId: 'device-mock-01',
  sessionId: 'session-mock-2026',
  exposureMs: 100,
  temperature: 22,
}

export const SAMPLE_OBSERVATION_EVENTS: ObservationInput[] = [
  {
    // Test case: linear_candidate — clean straight track, low noise
    eventId: 'sample-001',
    features: extractEventFeatures({ brightness: 0.82, length: 0.72, width: 0.12, linearity: 0.91, curvature: 0.06, scatterScore: 0.08, clusterScore: 0.1, rarityScore: 0.75, noiseScore: 0.12 }),
    context: { ...SAMPLE_CONTEXT, timestamp: '2026-04-13T00:00:01Z', notes: 'Clear straight track, low noise environment' },
    rawImageUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzExMSIvPjxsaW5lIHgxPSIxMCIgeTE9IjUwIiB4Mj0iOTAiIHkyPSI0OCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
    notes: 'Sample [linear_candidate]: linear particle track candidate',
  },
  {
    // Test case: artifact_like — hot pixel cluster suspect, high noise
    eventId: 'sample-002',
    features: extractEventFeatures({ brightness: 0.91, length: 0.08, width: 0.09, linearity: 0.3, curvature: 0.1, scatterScore: 0.15, clusterScore: 0.8, rarityScore: 0.2, noiseScore: 0.85 }),
    context: { ...SAMPLE_CONTEXT, timestamp: '2026-04-13T00:01:15Z', notes: 'Isolated bright spot, high noise' },
    rawImageUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzExMSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjMiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
    notes: 'Sample [artifact_like]: hot pixel cluster suspect',
  },
  {
    // Test case: scattered_candidate — curved track with moderate scatter
    eventId: 'sample-003',
    features: extractEventFeatures({ brightness: 0.55, length: 0.58, width: 0.22, linearity: 0.62, curvature: 0.45, scatterScore: 0.38, clusterScore: 0.25, rarityScore: 0.68, noiseScore: 0.28 }),
    context: { ...SAMPLE_CONTEXT, timestamp: '2026-04-13T00:02:40Z', notes: 'Curved track with moderate scatter' },
    rawImageUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzExMSIvPjxwYXRoIGQ9Ik0xMCA3MCBRNTAgMjAgOTAgNjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
    notes: 'Sample [scattered_candidate]: curved track – possibly magnetic field effect',
  },
  {
    // Test case: uncertain_event — ambiguous signal, moderate scatter
    eventId: 'sample-004',
    features: extractEventFeatures({ brightness: 0.4, length: 0.35, width: 0.18, linearity: 0.55, curvature: 0.2, scatterScore: 0.55, clusterScore: 0.48, rarityScore: 0.52, noiseScore: 0.44 }),
    context: { ...SAMPLE_CONTEXT, timestamp: '2026-04-13T00:04:10Z', notes: 'Ambiguous event, moderate scatter' },
    rawImageUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzExMSIvPjxsaW5lIHgxPSIyMCIgeTE9IjYwIiB4Mj0iNzAiIHkyPSI0NSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuNikiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
    notes: 'Sample [uncertain_event]: worth a second look',
  },
  {
    // Test case: strong_candidate — very clean long straight track, archive-worthy
    eventId: 'sample-005',
    features: extractEventFeatures({ brightness: 0.75, length: 0.65, width: 0.15, linearity: 0.88, curvature: 0.08, scatterScore: 0.12, clusterScore: 0.15, rarityScore: 0.82, noiseScore: 0.1 }),
    context: { ...SAMPLE_CONTEXT, timestamp: '2026-04-13T00:06:30Z', notes: 'Very clean long straight track' },
    rawImageUri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzExMSIvPjxsaW5lIHgxPSI4IiB5MT0iNTUiIHgyPSI5MiIgeTI9IjQ1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIvPjwvc3ZnPg==',
    notes: 'Sample [strong_candidate]: strong particle track candidate – archive worthy',
  },
]
