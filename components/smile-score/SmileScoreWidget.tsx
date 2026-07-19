'use client'

import { useEffect, useRef, useState } from 'react'
import { uploadMedia } from '@/lib/actions/media'
import { saveSmileScore } from '@/lib/actions/smileScore'
import { computeSmileScore, getFaceLandmarker, getSmileScoreFactors } from '@/lib/mediapipe/faceLandmarker'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2mb, matches lib/actions/media.ts

type Status = 'idle' | 'analyzing' | 'done' | 'error'
type UploadState = 'idle' | 'uploading' | 'uploaded' | 'error'
type Blendshape = { categoryName: string; score: number }
type SavedSmileScore = {
  id: number
  userId: number
  imageUrl: string
  user: { name: string }
}

type Props = {
  onSaved: (entry: SavedSmileScore) => void
}

export default function SmileScoreWidget({ onSaved }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [score, setScore] = useState<number | null>(null)
  const [blendshapes, setBlendshapes] = useState<Blendshape[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const previewUrlRef = useRef<string | null>(null)
  const savedRef = useRef(false)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  // Once both the score and the uploaded photo URL are available, record the
  // result and hand it to the parent so the gallery updates instantly,
  // without waiting on a server round-trip. Runs once per upload.
  useEffect(() => {
    if (score === null || !uploadedUrl || savedRef.current) return
    savedRef.current = true

    saveSmileScore(uploadedUrl, score).then((result) => {
      if (result.success) {
        onSaved(result.payload)
      } else {
        console.error('Failed to save smile score:', result.message)
      }
    })
  }, [score, uploadedUrl, onSaved])

  async function analyzePhoto(file: File) {
    setStatus('analyzing')
    setErrorMessage(null)
    setScore(null)
    setBlendshapes(null)

    try {
      const landmarker = await getFaceLandmarker()
      const bitmap = await createImageBitmap(file)
      const result = landmarker.detect(bitmap)
      const categories = result.faceBlendshapes[0]?.categories
      const smileScore = computeSmileScore(categories)

      if (smileScore === null) {
        setStatus('error')
        setErrorMessage('No face detected — try a clearer, front-facing photo.')
        return
      }

      setScore(smileScore)
      setBlendshapes(getSmileScoreFactors(categories))
      setStatus('done')
    } catch (error) {
      console.error('Error analyzing photo:', error)
      setStatus('error')
      setErrorMessage('Could not load the face-analysis engine. Please try again.')
    }
  }

  async function uploadPhoto(file: File) {
    setUploadState('uploading')

    try {
      const result = await uploadMedia(file)
      if (result.success) {
        setUploadState('uploaded')
        setUploadedUrl(result.payload.url)
      } else {
        setUploadState('error')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      setUploadState('error')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus('error')
      setErrorMessage('Unsupported file type. Please use JPEG, PNG, or WEBP.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setStatus('error')
      setErrorMessage('File is too large (max 2MB).')
      return
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const objectUrl = URL.createObjectURL(file)
    previewUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setUploadState('idle')
    setUploadedUrl(null)
    savedRef.current = false

    // Analysis and upload are independent: analysis never needs the
    // uploaded blob URL, and a failed upload shouldn't hide a valid score.
    analyzePhoto(file)
    uploadPhoto(file)
  }

  return (
    <div
      className="w-full max-w-sm mx-auto flex flex-col items-center gap-3"
      data-loading={status === 'analyzing'}
    >
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not compatible with next/image
        <img
          src={previewUrl}
          alt="Uploaded preview"
          className="w-40 h-40 rounded-full object-cover"
        />
      )}

      <label
        htmlFor="smile-score-input"
        className="button button--accent cursor-pointer"
      >
        {previewUrl ? 'Try another photo' : 'Upload a photo'}
      </label>
      <input
        id="smile-score-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={status === 'analyzing'}
      />

      {status === 'analyzing' && <p>Analyzing your smile…</p>}

      {status === 'done' && score !== null && (
        <>
          <div className="alert alert--success">Smile Score: {score}/100</div>

          {blendshapes && blendshapes.length > 0 && (
            <div className="w-full text-left text-sm border border-gray-200 rounded">
              <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-200">
                Factors affecting your score
              </div>
              <ul className="divide-y divide-gray-200">
                {blendshapes
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((c) => (
                    <li
                      key={c.categoryName}
                      className="flex justify-between gap-3 px-3 py-1.5"
                    >
                      <span className="text-gray-600">{c.categoryName}</span>
                      <span className="font-medium">
                        {(c.score * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      {status === 'error' && errorMessage && (
        <div className="alert alert--danger">{errorMessage}</div>
      )}

      {uploadState === 'error' && (
        <div className="alert alert--warning">
          Photo upload failed — your score is still valid, but it won&apos;t
          appear in the gallery below.
        </div>
      )}
    </div>
  )
}
