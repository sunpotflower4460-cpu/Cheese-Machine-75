// Observation event detection entry point
// For MVP: wraps sample events and mock detection
// Future: replace with real camera frame analysis

import type { ObservationInput } from '../../types/observation'
import { SAMPLE_OBSERVATION_EVENTS } from './sampleObservationEvents'
import { extractFeaturesFromUploadedImage } from './extractEventFeatures'
import { assessDataQuality } from './assessDataQuality'

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
 * Feature extraction uses pixel analysis with placeholder fallback;
 * image is kept as rawImageUri.
 */
export function buildInputFromUploadedImage(
  imageUri: string,
  imageWidth: number,
  imageHeight: number,
  notes?: string,
): Promise<ObservationInput> {
  const eventId = `uploaded-${Date.now()}`
  return extractFeaturesFromUploadedImage(imageUri, imageWidth, imageHeight).then((extracted) => {
    const input: ObservationInput = {
      eventId,
      features: extracted.features,
      thresholdSignal: extracted.thresholdSignal,
      context: {
        deviceId: 'user-device',
        sessionId: `session-upload-${Date.now()}`,
        timestamp: new Date().toISOString(),
        exposureMs: 0,
        notes: notes ?? 'User-uploaded image',
      },
      rawImageUri: imageUri,
      sourceType: 'uploaded-image',
      measuredSource: extracted.measuredSource,
      notes: notes ?? 'User-uploaded image',
    }

    return {
      ...input,
      qualityAssessment: assessDataQuality(input),
    }
  })
}

/**
 * Build an ObservationInput from a captured camera frame.
 * Mirrors uploaded-image handling so the same pipeline path is reused.
 */
export function buildInputFromCameraFrame(
  imageUri: string,
  imageWidth: number,
  imageHeight: number,
): Promise<ObservationInput> {
  const eventId = `camera-${Date.now()}`
  return extractFeaturesFromUploadedImage(imageUri, imageWidth, imageHeight).then((extracted) => {
    const input: ObservationInput = {
      eventId,
      features: extracted.features,
      thresholdSignal: extracted.thresholdSignal,
      context: {
        deviceId: 'browser-camera',
        sessionId: `session-camera-${Date.now()}`,
        timestamp: new Date().toISOString(),
        exposureMs: 0,
        notes: 'Captured via browser camera (single frame)',
      },
      rawImageUri: imageUri,
      sourceType: 'camera',
      measuredSource: extracted.measuredSource,
      notes: 'Captured frame from browser camera',
    }

    return {
      ...input,
      qualityAssessment: assessDataQuality(input),
    }
  })
}
