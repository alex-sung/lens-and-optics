# Lens & Optics Gallery Review Assistant

Simple MVP for Lens & Optics Gallery, Jhunjhunu.

## Features

- `/` and `/r/lens-optics-gallery` both work.
- Customer writes their real experience.
- English / Hindi / Hinglish selection.
- Gemini generates 7 natural options using only the customer's facts.
- Tap a review to copy it.
- Continue to the business Google review page.
- Customer manually chooses their own rating and submits the review.

## Setup

1. Install Node.js.
2. Open this folder in VS Code.
3. Run:

```cmd
npm install
```

4. Create `.env.local` in the project root:

```env
GEMINI_API_KEY=YOUR_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash
```

5. Start:

```cmd
npm run dev
```

Then open:

http://localhost:3000/r/lens-optics-gallery

The Gemini API key is used only on the server route `/api/generate`.
