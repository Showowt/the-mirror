# The Mirror

> A single-page experience that asks users the one question they can't ask themselves.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- Vercel deployment

## Architecture

### API Route: `/api/mirror`
- POST endpoint receives user's situation
- Rate limited (20 req/min per IP)
- Input validation (20-3000 chars)
- Returns single question with no preamble

### System Prompt
The core weapon. Contains:
- **Frame Modeling**: Identify the shape of perspective, not just content
- **Blind Spot Protocol**: Find what's structurally invisible from where they're standing
- **Question Generation**: 8-30 words, emotionally precise, no comfort

### Design Language
- Font: Cormorant Garamond (emotional) + DM Sans (utility)
- Background: #0a0a0a with grain overlay
- Vignette: Radial gradient to black
- Transitions: 0.8s fade between phases, 1.5s question reveal

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Deployment
```bash
npm install
npm run build
vercel --prod
```

## Testing Protocol
1. Test with 20-30 real situations
2. Identify where questions land flat vs hit
3. Refine system prompt based on patterns
4. Film reactions for launch content

## Content Strategy
- Film yourself + 3-4 others using it
- Capture the moment they read the question
- Hook: "I told an AI what I was dealing with and instead of helping me it asked me one question. I haven't been able to stop thinking about it."
- Post compilation with link
