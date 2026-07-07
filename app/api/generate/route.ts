import { streamText, Output, createGateway } from 'ai'
import { z } from 'zod'
import { DEFAULT_MODEL_ID, isAllowedModel, type GenerationSummary } from '@/lib/models'

export const maxDuration = 120

const shotSchema = z.object({
  shotNumber: z.number().describe('Sequential shot number starting at 1'),
  title: z.string().describe('Short evocative title for the shot, e.g. "The Reveal"'),
  framing: z
    .string()
    .describe(
      'Shot size and composition, e.g. "Extreme wide shot, low angle, subject centered in lower third"',
    ),
  lens: z
    .string()
    .describe('Lens choice and look, e.g. "35mm anamorphic, T2.8, shallow depth of field"'),
  movement: z
    .string()
    .describe('Camera movement, e.g. "Slow dolly-in on a gimbal, 10 seconds"'),
  lighting: z
    .string()
    .describe(
      'Lighting setup and mood, e.g. "Single sodium-vapor streetlamp key, heavy haze, deep shadows"',
    ),
  duration: z.string().describe('Suggested clip duration, e.g. "5s" or "8s"'),
  description: z
    .string()
    .describe('One or two sentences describing exactly what happens in the shot'),
  videoPrompt: z
    .string()
    .describe(
      'A single, complete, copy-paste-ready prompt for an AI video tool (Seedance/Kling). Written as one dense paragraph combining subject, action, framing, lens, movement, lighting, color grade, and mood. No headings or lists.',
    ),
})

const MAX_SCENE_LENGTH = 2000
const MAX_KEY_LENGTH = 256

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const scene = (body as { scene?: unknown })?.scene
  if (typeof scene !== 'string' || scene.trim().length === 0) {
    return Response.json({ error: 'Scene description is required.' }, { status: 400 })
  }

  const requestedModel = (body as { model?: unknown })?.model
  const modelId =
    requestedModel === undefined
      ? DEFAULT_MODEL_ID
      : isAllowedModel(requestedModel)
        ? requestedModel
        : null
  if (modelId === null) {
    return Response.json({ error: 'Unknown model.' }, { status: 400 })
  }
  if (scene.length > MAX_SCENE_LENGTH) {
    return Response.json(
      { error: `Scene description must be ${MAX_SCENE_LENGTH} characters or fewer.` },
      { status: 400 },
    )
  }

  const apiKey = req.headers.get('x-gateway-api-key')?.trim()
  if (!apiKey || apiKey.length > MAX_KEY_LENGTH) {
    return Response.json(
      { error: 'Add your AI Gateway API key to generate shot lists.' },
      { status: 401 },
    )
  }

  const gateway = createGateway({ apiKey })

  // Validate the key up front (getCredits requires auth) so bad keys fail
  // with a clear 401 instead of a broken stream mid-generation. In parallel,
  // fetch the model list, which carries per-token pricing for cost reporting.
  const [creditsResult, modelsResult] = await Promise.allSettled([
    gateway.getCredits(),
    gateway.getAvailableModels(),
  ])

  if (creditsResult.status === 'rejected') {
    console.error('Gateway key validation failed:', creditsResult.reason)
    return Response.json(
      { error: 'That API key was rejected by AI Gateway. Check it and try again.' },
      { status: 401 },
    )
  }

  let pricing: { input: number; output: number } | null = null
  if (modelsResult.status === 'fulfilled') {
    const modelInfo = modelsResult.value.models.find((m) => m.id === modelId)
    if (modelInfo?.pricing) {
      pricing = {
        input: Number(modelInfo.pricing.input),
        output: Number(modelInfo.pricing.output),
      }
    }
  }

  const result = streamText({
    model: gateway(modelId),
    output: Output.array({
      name: 'ShotList',
      description: 'A cinematic shot list breaking a scene into individual shots.',
      element: shotSchema,
    }),
    system: `You are a world-class cinematographer and shot-list designer.
Given a scene description, break it into 4-8 distinct shots that together tell the scene cinematically.
Follow real cinematography grammar: establish, coverage, inserts, reaction, and a closing beat.
Vary shot sizes, angles, and movement across the list. Be specific and technical — name real lens focal lengths, real camera moves, and real lighting setups.
For each shot's videoPrompt, write one dense paragraph optimized for AI video generators like Seedance or Kling: lead with the subject and action, then camera framing and movement, then lens/optical character, then lighting, color palette, and mood keywords (e.g. "cinematic, film grain, anamorphic bokeh"). Keep each prompt self-contained — never reference other shots.`,
    prompt: `Scene description:\n\n${scene.trim()}`,
    onError({ error }) {
      console.error('Shot list generation error:', error)
    },
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const shot of result.elementStream) {
          controller.enqueue(encoder.encode(JSON.stringify(shot) + '\n'))
        }

        // Final line: token usage and cost for this generation.
        const usage = await result.usage
        const inputTokens = usage.inputTokens ?? 0
        const outputTokens = usage.outputTokens ?? 0
        const summary: GenerationSummary = {
          __summary: true,
          model: modelId,
          inputTokens,
          outputTokens,
          totalTokens: usage.totalTokens ?? inputTokens + outputTokens,
          costUsd: pricing ? inputTokens * pricing.input + outputTokens * pricing.output : null,
        }
        controller.enqueue(encoder.encode(JSON.stringify(summary) + '\n'))
        controller.close()
      } catch (error) {
        console.error('Shot list stream error:', error)
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
