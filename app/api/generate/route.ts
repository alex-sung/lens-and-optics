
import { NextResponse } from "next/server";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const experience =
      typeof body.experience === "string"
        ? body.experience.trim()
        : "";

    const allowedLanguages = ["English", "Hindi", "Hinglish"];

    const language = allowedLanguages.includes(body.language)
      ? body.language
      : "Hinglish";

    if (experience.length < 2) {
      return NextResponse.json(
        { error: "Apna experience ya kuch keywords likho." },
        { status: 400 }
      );
    }

    if (experience.length > 1200) {
      return NextResponse.json(
        { error: "Please keep your input under 1200 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing." },
        { status: 500 }
      );
    }

    const prompt = `
You write natural, honest Google reviews for Lens & Optics Gallery, an optical store in Jhunjhunu, Rajasthan.

CUSTOMER'S ACTUAL EXPERIENCE:
${JSON.stringify(experience)}

LANGUAGE: ${language}

TASK:
Generate exactly 7 genuinely different review options and exactly 3 optional follow-up suggestions.

REVIEWS:
- Each review should normally be 2-3 complete sentences, around 25-40 words.
- Expand short inputs naturally. Do not simply repeat the customer's keywords.
- Keep every review faithful to the customer's actual experience.
- Preserve positive, negative, mixed, or neutral sentiment.
- Use natural everyday language. Hinglish means Roman Hindi mixed with English.
- Vary sentence openings, wording and structure.
- Avoid repetitive, robotic or advertising-style language.

TRUTH AND GOOGLE RELEVANCE:
- The customer's input is the only source of facts.
- Never invent products, brands, prices, discounts, staff behaviour, facilities, eye tests, warranties, events or services.
- Do not add location or business keywords unless they naturally fit the customer's actual experience.
- Never stuff keywords for SEO.
- Never force 5-star language, recommendations or exaggerated claims.
- Do not turn negative or neutral feedback into positive feedback.
- Do not imply the customer experienced something they did not mention.

SUGGESTIONS:
- Give exactly 3 short, optional questions that help the customer describe their own experience more specifically.
- Do not assume their answers.

Return only valid JSON in this exact structure:
{
  "reviews": [
    "review 1",
    "review 2",
    "review 3",
    "review 4",
    "review 5",
    "review 6",
    "review 7"
  ],
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ]
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        MODEL
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                reviews: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
                suggestions: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                },
              },
              required: ["reviews", "suggestions"],
            },
            maxOutputTokens: 1800,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return NextResponse.json(
        {
          error: "Gemini could not generate the review right now. Please try again.",
        },
        { status: 502 }
      );
    }

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof raw !== "string") {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    let result: {
      reviews?: unknown;
      suggestions?: unknown;
    };

    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned an invalid response." },
        { status: 502 }
      );
    }

    const reviews = Array.isArray(result.reviews)
      ? result.reviews.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
      : [];

    const suggestions = Array.isArray(result.suggestions)
      ? result.suggestions.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
      : [];

    if (reviews.length === 0) {
      return NextResponse.json(
        { error: "Gemini could not create review options. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reviews: reviews.slice(0, 7),
      suggestions: suggestions.slice(0, 3),
    });
  } catch (error) {
    console.error("Review generation error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating your reviews." },
      { status: 500 }
    );
  }
}
