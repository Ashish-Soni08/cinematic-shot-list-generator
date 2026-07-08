# Shotcaller – Cinematic Shot List Generator

Describe any film scene in plain English and get a complete cinematography breakdown in seconds. Shotcaller generates shot-by-shot breakdowns with framing, lens, camera movement, and lighting—all formatted as copy-ready prompts for AI video tools like Seedance, Kling, Runway, and Veo.

**Live:** [cinematic-shot-list-generator.vercel.app](https://cinematic-shot-list-generator.vercel.app)

## Features

- **Scene-to-Shots in Seconds** – Describe a scene and get a structured breakdown of every shot
- **AI Video Tool Ready** – Prompts formatted for Seedance, Kling, Runway, Veo, and other AI video generators
- **Model Picker** – Choose your speed/quality tradeoff: GPT-5.4 Nano (fast), Mini (balanced), Full (quality), or Claude Sonnet 5 (rich language)
- **Real-Time Metrics** – See actual token usage and USD cost for each generation using live AI Gateway pricing
- **Bring Your Own Key** – No signup, no server-side API key. You control the cost using your own AI Gateway credentials
- **Dark Cinematic UI** – Built with a film-focused aesthetic and smooth interactions
- **Copy-Ready Output** – One-click copy individual shots or all shots at once

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn/bun)
- An [AI Gateway API key](https://ai-gateway.vercel.sh) (get one free at Vercel)

### Development

Clone the repo and install dependencies:

```bash
git clone https://github.com/Ashish-Soni08/cinematic-shot-list-generator.git
cd cinematic-shot-list-generator
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and add your AI Gateway API key in the panel.

## How It Works

1. **Paste your AI Gateway key** in the top panel (saved to localStorage, never sent to server)
2. **Describe your scene** in plain English (up to 2,000 characters)
3. **Pick a model** – balanced by default, but choose Nano for speed or Claude for richer language
4. **Generate** – stream the shot breakdown in real-time
5. **Copy & Use** – grab individual shots or the full list as a prompt for your AI video tool

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 with semantic design tokens
- **AI:** Vercel AI SDK 4 + AI Gateway (OpenAI, Anthropic, Google)
- **Deployment:** Vercel

## Architecture

### Client (`app/page.tsx`)

- React hooks for scene state, generation status, API key management
- Real-time streaming response parsing (newline-delimited JSON)
- Model picker with persistent localStorage
- Metrics display (tokens, cost) after each generation
- Copy handlers with iframe-safe fallback

### API (`app/api/generate/route.ts`)

- Validates API key and model choice
- Fetches live pricing from AI Gateway
- Streams structured shot objects to client
- Appends final summary line with token usage and cost
- Error handling for malformed requests (400), bad credentials (401)

### Models (`lib/models.ts`)

- Whitelisted model roster with names, taglines, and pricing
- Validates user model selection server-side
- Exports `GenerationSummary` type for cost/token reporting

## API Endpoint

### POST `/api/generate`

**Request:**
```json
{
  "scene": "A detective enters a rain-soaked alley...",
  "model": "openai/gpt-5.4-mini"
}
```

**Headers:**
```
x-gateway-api-key: vck_your_key_here
```

**Response:** (streaming newline-delimited JSON)
```
{"shotNumber":1,"framing":"Wide shot","lens":"35mm",...}
{"shotNumber":2,"framing":"Close-up","lens":"50mm",...}
{"__summary":true,"model":"openai/gpt-5.4-mini","inputTokens":120,"outputTokens":450,"totalTokens":570,"costUsd":0.0031}
```

## Security & Privacy

- **Your key stays yours** – API key is stored only in your browser's localStorage, never sent to our server
- **No tracking** – No analytics, no telemetry, no third-party scripts
- **Input validation** – Scene descriptions capped at 2,000 characters server-side
- **Model whitelist** – Only allowed models can be selected; arbitrary model IDs are rejected with a 400 error

## Customization

### Changing Models

Edit `lib/models.ts` to add/remove models or adjust the default:

```typescript
export const DEFAULT_MODEL_ID = 'openai/gpt-5.4-mini'

export const MODEL_OPTIONS = [
  {
    id: 'openai/gpt-5.4-nano',
    name: 'GPT-5.4 Nano',
    tagline: 'Fastest and cheapest',
  },
  // ...add more
]
```

### Adjusting Scene Limits

Change `MAX_SCENE_LENGTH` in `app/api/generate/route.ts` (currently 2,000 characters).

### Theming

Colors and typography are defined in `globals.css` using CSS variables (Tailwind v4):

```css
@theme {
  --color-primary: #fbbf24;
  --color-background: #0f0f0f;
  --font-sans: 'Geist', ...;
}
```

## Deployment

This project is deployed on Vercel and updates automatically on every push to `main`.

**Deploy your own:**

```bash
git push origin main
```

Or click the Vercel "Deploy" button on the GitHub repo.

## Contributing

Contributions are welcome. Fork the repo, make your changes, and open a pull request.

## License

MIT

## Built with v0

This project was scaffolded and developed with [v0](https://v0.app), Vercel's AI-powered assistant for web development.

---

**Questions?** Open an issue or reach out on X [@Ashish_Soni08](https://x.com/Ashish_Soni08).
