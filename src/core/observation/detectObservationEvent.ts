// Observation event detection entry point
// For MVP: wraps sample events and mock detection
// Future: replace with real camera frame analysis

import type { ObservationInput } from '../../types/observation'
import { SAMPLE_OBSERVATION_EVENTS } from './sampleObservationEvents'
import { extractFeaturesFromUploadedImage } from './extractEventFeatures'

/** Get a sample event by index (wraps around) */
export function getSampleEvent(index: number): ObservationInput {
  return SAMPLE_OBSERVATION_EVENTS[index % SAMPLE_OBSERVATION_EVENTS.length]
}

/** Get all sample events */
export function getAllSampleEvents(): ObservationInput[] {
  return [...SAMPLE_OBSERVATION_EVENTS]
}

/** Mock detect: returns a sample event as if it were just detected */
export function detectNextEvent(currentIndex: number): { event: ObservationInput; nextIndex: number } {
  const idx = currentIndex % SAMPLE_OBSERVATION_EVENTS.length
  return { event: SAMPLE_OBSERVATION_EVENTS[idx], nextIndex: idx + 1 }
}

/**
 * Build an ObservationInput from a user-uploaded image.
 * Feature extraction is simplified (placeholder); image is kept as rawImageUri.
 */
export function buildInputFromUploadedImage(
  imageUri: string,
  imageWidth: number,
  imageHeight: number,
  notes?: string,
): ObservationInput {
  const eventId = `uploaded-${Date.now()}`
  return {
    eventId,
    features: extractFeaturesFromUploadedImage(imageUri, imageWidth, imageHeight),
    context: {
      deviceId: 'user-device',
      sessionId: `session-upload-${Date.now()}`,
      timestamp: new Date().toISOString(),
      exposureMs: 0,
      notes: notes ?? 'User-uploaded image',
    },
    rawImageUri: imageUri,
    sourceType: 'uploaded-image',
    notes: notes ?? 'User-uploaded image',
  }
}
