'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Aperture,
  Check,
  Clapperboard,
  Copy,
  Film,
  KeyRound,
  Lightbulb,
  Loader2,
  Move3D,
  Scan,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Shot = {
  shotNumber: number
  title: string
  framing: string
  lens: string
  movement: string
  lighting: string
  duration: string
  description: string
  videoPrompt: string
}

const API_KEY_STORAGE = 'shotcaller-gateway-key'

const EXAMPLE_SCENES = [
  'A lone astronaut discovers an abandoned greenhouse on Mars, sunrise breaking through dusty glass panels',
  'A jazz singer performs her final song in a smoky 1950s Harlem club as the crowd slowly empties',
  'Two rival chefs face off during a chaotic dinner rush in a cramped Tokyo alley kitchen',
]

function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <span className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="text-sm leading-relaxed text-card-foreground">{value}</span>
      </div>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="pressable gap-1.5 border-border bg-transparent font-mono text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-primary" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? 'Copied' : label}
    </Button>
  )
}

function ApiKeyPanel({
  apiKey,
  onSave,
  onClear,
  open,
  onOpenChange,
}: {
  apiKey: string
  onSave: (key: string) => void
  onClear: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [draft, setDraft] = useState('')
  const hasKey = apiKey.length > 0

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length === 0) return
    onSave(trimmed)
    setDraft('')
    onOpenChange(false)
  }

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls="api-key-panel"
        className="pressable flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40"
      >
        <span className="flex items-center gap-2 text-sm text-card-foreground">
          <KeyRound
            className={hasKey ? 'size-4 text-primary' : 'size-4 text-muted-foreground'}
            aria-hidden="true"
          />
          {hasKey ? 'API key saved' : 'Add your AI Gateway API key'}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {open ? 'Close' : hasKey ? 'Manage' : 'Required'}
        </span>
      </button>

      {open && (
        <div id="api-key-panel" className="mt-2 rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            Your key is stored only in this browser and sent directly with each request. Get one
            free at{' '}
            <a
              href="https://vercel.com/ai-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              vercel.com/ai-gateway
            </a>
            .
          </p>
          <form onSubmit={handleSave} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="gateway-key" className="sr-only">
              AI Gateway API key
            </label>
            <input
              id="gateway-key"
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={hasKey ? 'Replace saved key' : 'vck_...'}
              autoComplete="off"
              className="h-9 w-full flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={draft.trim().length === 0}
                className="pressable h-9 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Save key
              </Button>
              {hasKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClear()
                    onOpenChange(false)
                  }}
                  className="pressable h-9 gap-1.5 border-border bg-transparent text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Remove
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function ShotCard({ shot, index }: { shot: Shot; index: number }) {
  return (
    <article
      className="shot-enter rounded-xl border border-border bg-card p-5 md:p-6"
      style={{ animationDelay: `${Math.min(index, 3) * 50}ms` }}
    >
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">
            {String(shot.shotNumber).padStart(2, '0')}
          </span>
          <div>
            <h3 className="text-base font-semibold text-card-foreground text-balance">
              {shot.title}
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {'DUR '}
              {shot.duration}
            </span>
          </div>
        </div>
        <CopyButton text={shot.videoPrompt} label="Copy prompt" />
      </header>

      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{shot.description}</p>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <SpecRow icon={Scan} label="Framing" value={shot.framing} />
        <SpecRow icon={Aperture} label="Lens" value={shot.lens} />
        <SpecRow icon={Move3D} label="Movement" value={shot.movement} />
        <SpecRow icon={Lightbulb} label="Lighting" value={shot.lighting} />
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <span className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-primary">
          {'AI Video Prompt // Seedance · Kling'}
        </span>
        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
          {shot.videoPrompt}
        </p>
      </div>
    </article>
  )
}

export default function Page() {
  const [scene, setScene] = useState('')
  const [shots, setShots] = useState<Shot[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [keyPanelOpen, setKeyPanelOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(API_KEY_STORAGE)
    if (stored) {
      setApiKey(stored)
    } else {
      setKeyPanelOpen(true)
    }
  }, [])

  const saveKey = useCallback((key: string) => {
    window.localStorage.setItem(API_KEY_STORAGE, key)
    setApiKey(key)
    setError(null)
  }, [])

  const clearKey = useCallback(() => {
    window.localStorage.removeItem(API_KEY_STORAGE)
    setApiKey('')
  }, [])

  const generate = useCallback(
    async (sceneText: string) => {
      if (isGenerating || sceneText.trim().length === 0) return

      if (apiKey.length === 0) {
        setError('Add your AI Gateway API key first. It only takes a minute.')
        setKeyPanelOpen(true)
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsGenerating(true)
      setError(null)
      setShots([])

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gateway-api-key': apiKey,
          },
          body: JSON.stringify({ scene: sceneText }),
          signal: controller.signal,
        })

        if (res.status === 401) {
          setKeyPanelOpen(true)
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(data?.error ?? 'Your API key was rejected. Check it and save it again.')
        }

        if (!res.ok || !res.body) {
          throw new Error('Generation failed. Please try again.')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (line.trim().length === 0) continue
            const shot = JSON.parse(line) as Shot
            setShots((prev) => [...prev, shot])
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[v0] generation error:', err)
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setIsGenerating(false)
      }
    },
    [isGenerating, apiKey],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generate(scene)
  }

  const allPrompts = shots
    .map((s) => `SHOT ${String(s.shotNumber).padStart(2, '0')} - ${s.title}\n${s.videoPrompt}`)
    .join('\n\n')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-10 md:py-16">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clapperboard className="size-5 text-primary" aria-hidden="true" />
            <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
              SHOTCALLER
            </span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {isGenerating ? 'Rolling…' : 'System Ready'}
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground text-balance md:text-4xl">
          Scene in. Shot list out.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Describe your scene in plain English and get a full cinematic breakdown: framing, lens,
          movement, and lighting, formatted as copy-ready prompts for Seedance, Kling, and other
          AI video tools.
        </p>
      </header>

      {/* API key */}
      <ApiKeyPanel
        apiKey={apiKey}
        onSave={saveKey}
        onClear={clearKey}
        open={keyPanelOpen}
        onOpenChange={setKeyPanelOpen}
      />

      {/* Scene input */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="rounded-xl border border-border bg-card p-4 focus-within:ring-2 focus-within:ring-ring">
          <label htmlFor="scene" className="sr-only">
            Scene description
          </label>
          <textarea
            id="scene"
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                (e.metaKey || e.ctrlKey) &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                generate(scene)
              }
            }}
            placeholder="A detective enters a rain-soaked alley at midnight, neon signs flickering overhead, and finds a single red umbrella lying on the ground…"
            rows={4}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-card-foreground placeholder:text-muted-foreground focus:outline-none md:text-base"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
              {'⌘ + Enter to generate'}
            </span>
            <Button
              type="submit"
              disabled={isGenerating || scene.trim().length === 0}
              className="pressable gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {isGenerating ? 'Generating…' : 'Generate shot list'}
            </Button>
          </div>
        </div>
      </form>

      {/* Example scenes */}
      {shots.length === 0 && !isGenerating && (
        <section aria-label="Example scenes" className="mb-8">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Try a scene
          </span>
          <div className="flex flex-col gap-2">
            {EXAMPLE_SCENES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setScene(example)
                  generate(example)
                }}
                className="pressable rounded-lg border border-border bg-card px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-8 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Shot list */}
      {(shots.length > 0 || isGenerating) && (
        <section aria-label="Shot list" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-widest text-foreground">
              <Film className="size-4 text-primary" aria-hidden="true" />
              {'Shot Breakdown'}
              {shots.length > 0 && (
                <span className="text-muted-foreground">
                  {'// '}
                  {shots.length}
                  {isGenerating ? '+' : ''}
                </span>
              )}
            </h2>
            {shots.length > 0 && !isGenerating && (
              <CopyButton text={allPrompts} label="Copy all prompts" />
            )}
          </div>

          {shots.map((shot, index) => (
            <ShotCard key={shot.shotNumber} shot={shot} index={index} />
          ))}

          {isGenerating && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-6">
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {shots.length === 0 ? 'Breaking down your scene…' : 'Next shot incoming…'}
              </span>
            </div>
          )}
        </section>
      )}

      <footer className="mt-auto pt-12">
        <p className="text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {'Prompts formatted for Seedance · Kling · Runway · Veo'}
        </p>
      </footer>
    </main>
  )
}
