import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const MEDIAPIPE_VERSION = '0.10.35'

// MediaPipe's WASM binary logs this purely informational line through
// console.error instead of console.info. It appears to bind its error logger
// to console.error at WASM-module-instantiation time (inside
// FilesetResolver.forVisionTasks, before FaceLandmarker even exists), so a
// wrapper scoped around individual calls never catches it. Patch it out
// permanently at module load instead — before any MediaPipe code runs — for
// this exact benign message only; everything else still reaches the console.
const BENIGN_LOG_PATTERN = /^INFO: Created TensorFlow Lite XNNPACK delegate/

if (typeof window !== 'undefined') {
  const originalError = console.error.bind(console)
  if (!(originalError as { __smileScorePatched?: boolean }).__smileScorePatched) {
    const patched = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && BENIGN_LOG_PATTERN.test(args[0])) return
      originalError(...args)
    }
    patched.__smileScorePatched = true
    console.error = patched
  }
}

let landmarkerPromise: Promise<FaceLandmarker> | null = null

// Memoized singleton: the WASM runtime + model (~10MB) should only be
// fetched/initialized once per session, no matter how many photos are analyzed.
export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
      )

      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        outputFaceBlendshapes: true,
        numFaces: 1,
      })
    })().catch((error) => {
      // Allow a later call to retry instead of permanently caching a failure.
      landmarkerPromise = null
      throw error
    })
  }

  return landmarkerPromise
}

// The only blendshapes that feed into the smile score — kept as a single
// source of truth so the score and the "what affected this" breakdown never
// drift apart.
const SMILE_SCORE_FACTORS = ['mouthSmileLeft', 'mouthSmileRight']

// Smile score = average of the mouthSmileLeft/mouthSmileRight blendshape
// scores (0..1 each), scaled to 0-100. Averaging (rather than max) rewards a
// symmetric smile. Returns null when a face wasn't detected.
export function computeSmileScore(
  categories: { categoryName: string; score: number }[] | undefined
): number | null {
  if (!categories?.length) return null

  const left = categories.find((c) => c.categoryName === 'mouthSmileLeft')
  const right = categories.find((c) => c.categoryName === 'mouthSmileRight')
  if (!left || !right) return null

  return Math.round(((left.score + right.score) / 2) * 100)
}

// Filters the full blendshape list down to just the factors that affect the
// smile score, for display under the result.
export function getSmileScoreFactors(
  categories: { categoryName: string; score: number }[] | undefined
): { categoryName: string; score: number }[] {
  if (!categories?.length) return []
  return categories.filter((c) => SMILE_SCORE_FACTORS.includes(c.categoryName))
}
