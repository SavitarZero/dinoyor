const API_USER   = process.env.SIGHTENGINE_API_USER!
const API_SECRET = process.env.SIGHTENGINE_API_SECRET!

interface SightengineResponse {
  status: string
  error?: { message: string }
  nudity?: {
    sexual_activity: number
    sexual_display: number
    erotica: number
  }
}

// Returns an error message if the image is flagged, null if clean
export async function moderateImage(file: File): Promise<string | null> {
  const fd = new FormData()
  fd.append('media', file)
  fd.append('models', 'nudity-2.0')
  fd.append('api_user', API_USER)
  fd.append('api_secret', API_SECRET)

  let res: SightengineResponse
  try {
    const r = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: fd,
    })
    res = await r.json()
  } catch {
    // Network error — allow upload (don't block users on API outage)
    return null
  }

  if (res.status !== 'success') return null

  const n = res.nudity
  if (!n) return null

  // Flag if any explicit score exceeds threshold
  if (n.sexual_activity > 0.7 || n.sexual_display > 0.7 || n.erotica > 0.75) {
    return 'Image contains inappropriate content and cannot be uploaded'
  }

  return null
}
