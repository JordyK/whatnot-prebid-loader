# Whatnot Prebid Loader

A single-purpose web tool for reviewing AI-generated sports card listings before they go live on Whatnot. Built as a clean, extensible foundation for future multi-tenant SaaS capabilities.

## Tech Stack

- **Vite + React + TypeScript** - Fast build tool with modern React
- **Plain CSS** - Custom trading card aesthetic (no component libraries)
- **Cloudflare Pages** - Static site deployment target

## Features

- Review one trading card at a time with AI-generated title and description
- Edit text fields before confirming
- Progress tracking with serial-number-style counter
- Warning banners for cards needing special attention
- Mobile-first design optimized for one-handed use
- Connection error handling with retry functionality
- All cards must be confirmed (no skip/reject)

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

3. Edit `.env` with your actual webhook URLs:
```
VITE_GET_CARD_URL=https://your-n8n-webhook-url.com/get-card
VITE_CONFIRM_CARD_URL=https://your-n8n-webhook-url.com/confirm-card
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## API Integration

The app integrates with two HTTP endpoints (typically n8n webhooks):

### GET Card Endpoint

**URL:** `VITE_GET_CARD_URL`

**Response (card available):**
```json
{
  "done": false,
  "row_id": "unique-id",
  "file_name": "card.jpg",
  "image_url": "https://...",
  "ai_title": "2023 Bowman Chrome...",
  "ai_description": "Rookie card...",
  "needs_review": true,
  "review_reason": "Low confidence on player name",
  "remaining": 47
}
```

**Response (no cards):**
```json
{ "done": true }
```

### POST Confirm Endpoint

**URL:** `VITE_CONFIRM_CARD_URL`

**Request body:**
```json
{
  "row_id": "unique-id",
  "title": "Edited title",
  "description": "Edited description",
  "image_url": "https://...",
  "file_name": "card.jpg"
}
```

**Response:**
```json
{ "success": true }
```

## Deployment to Cloudflare Pages

### Build Configuration

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** 18+

### Environment Variables

In the Cloudflare Pages dashboard, set these environment variables:

- `VITE_GET_CARD_URL` - Your GET card webhook URL
- `VITE_CONFIRM_CARD_URL` - Your confirm card webhook URL

### Deployment Steps

1. Connect your Git repository to Cloudflare Pages
2. Configure build settings as above
3. Add environment variables in Pages dashboard
4. Deploy

## Project Structure

```
src/
├── components/       # React components
│   ├── CardView.tsx     # Main card review interface
│   ├── Loading.tsx      # Loading skeleton state
│   ├── AllDone.tsx      # Empty state when no cards
│   └── ConnectionError.tsx  # Error state with retry
├── services/        # API layer
│   ├── api.ts           # getNextCard, confirmCard functions
│   └── config.ts        # Environment variable configuration
├── types/           # TypeScript types
│   └── index.ts         # API request/response types
├── App.tsx          # Main app with state management
├── main.tsx         # React entry point
└── index.css        # Global styles
```

## Design System

- **Colors:** Deep turf green background (#0F2818 → #0A1D11), warm chalk-white text (#F7F5F0), gold accents (#C9A227)
- **Typography:** Oswald (display/headings), Inter (body/inputs)
- **Aesthetic:** Trading card material world with slab-style image frames
- **Responsive:** Mobile-first, max-width 430px centered on desktop

## Future Extensibility

The codebase is structured to support future enhancements:

- **API layer isolation:** Easy to swap n8n webhooks for direct API calls or a real backend
- **No auth assumptions:** State management doesn't assume single-user sessions
- **Component modularity:** UI components are reusable and can be enhanced
- **Type safety:** Full TypeScript coverage for maintainability

## License

Internal tool - all rights reserved
