import type { FastifyPluginAsync } from 'fastify'
import { geminiService } from '../services/gemini.service'

export const aiScanRoutes: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] }

  // POST /ai/scan — scan receipt/photo via Gemini Vision
  fastify.post('/scan', auth, async (req, reply) => {
    const { imageBase64, mimeType } = req.body as {
      imageBase64?: string
      mimeType?: string
    }

    if (!imageBase64 || !mimeType) {
      return reply.status(400).send({ error: 'imageBase64 and mimeType are required' })
    }

    // Basic mime validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(mimeType)) {
      return reply.status(400).send({ error: 'Unsupported image format. Use JPEG, PNG, or WebP.' })
    }

    // Rough size check: base64 of 10MB = ~13.6MB string
    if (imageBase64.length > 14_000_000) {
      return reply.status(413).send({ error: 'Image too large. Maximum 10MB.' })
    }

    const result = await geminiService.scanReceipt(imageBase64, mimeType)
    return {
      ...result,
      isDemo: !geminiService.isAvailable(),
    }
  })

  // GET /ai/status — check if AI is available
  fastify.get('/status', async () => ({
    available: geminiService.isAvailable(),
    message: geminiService.isAvailable()
      ? 'Gemini AI aktif'
      : 'Mode demo — tambahkan GEMINI_API_KEY di .env untuk mengaktifkan AI Vision',
  }))
}
