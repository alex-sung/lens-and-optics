import { NextResponse } from "next/server";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const experience =
      typeof body.experience === "string"
        ? body.experience.trim()
        : "";

    const language =
      typeof body.language === "string"
        ? body.language
        : "Hinglish";

    if (!experience) {
      return NextResponse.json(
        {
          error: "Apna experience ya kuch keywords likho.",
        },
        { status: 400 }
      );
    }

    if (experience.length > 1200) {
      return NextResponse.json(
        {
          error: "Please keep your input under 1200 characters.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Gemini API key is missing.",
        },
        { status: 500 }
      );
    }

 const prompt = `
You are an expert Google Review writing assistant for:

Lens & Optics Gallery
Jhunjhunu, Rajasthan, India

CUSTOMER INPUT:
"${experience}"

REQUESTED LANGUAGE:
${language}

CORE TASK:

The customer may intentionally provide only 2-5 words such as:

"good staff"
"good service"
"nice experience"
"frames achhe"
"staff helpful"
"price reasonable"
"long wait"
"bad service"

Your job is to understand the customer's meaning and expand that SAME idea into a natural, complete Google review.

The customer input is the SOURCE OF TRUTH.

Do not merely repeat or translate the input.
Expand the expression and sentence structure while staying completely faithful to the meaning.

REVIEW LENGTH:

Generate exactly 7 reviews.

IMPORTANT:
Every review MUST be 2-3 complete sentences.

Aim for approximately 30-50 words per review.

Do NOT give one-line reviews.

Do NOT make a review longer by inventing new facts.

If the customer's input is very short, create length by expressing the SAME idea naturally in different ways.

For example, if the customer says:

"good staff"

A suitable review could be:

"The staff were good and I had a positive experience interacting with them. Their behaviour left a good impression on me, and overall I was happy with my experience."

Notice that this expands the customer's idea without inventing specific events, qualifications, products or services.

FACT RULE:

You may improve:
- grammar
- sentence structure
- vocabulary
- natural expression
- flow
- emotional wording that is directly supported by the customer's input

You MUST NOT invent specific facts.

NEVER invent:
- staff names
- exact prices
- discounts
- products
- lens brands
- frame brands
- waiting time
- store facilities
- parking
- home delivery
- eye testing
- warranty
- specific staff behaviour
- specific conversations
- medical claims
- specific events
- services not mentioned by the customer
- any other detail not supported by the customer's input

Do not automatically add:
"best"
"number one"
"highly recommended"
"5 star"
"must visit"
"perfect"
"cheapest"

unless the customer explicitly communicates that idea.

SENTIMENT:

Preserve the customer's original sentiment.

Positive input = positive review.

Negative input = negative review.

Mixed input = mixed review.

Neutral input = neutral review.

Never convert a negative or neutral experience into a positive review.

VARIETY:

All 7 reviews must communicate the SAME underlying experience, but they must be genuinely different.

Vary:
- opening sentence
- sentence structure
- vocabulary
- rhythm
- length within the 30-50 word target
- natural writing style

Do NOT produce seven versions that are basically the same sentence.

Do NOT start every review with:
"I had a great experience..."

Do not make the reviews sound like advertisements.

They should feel like different real customers naturally expressing the same basic experience.

LANGUAGE:

If language is English:
Use natural everyday Indian English.

If language is Hindi:
Use natural everyday Hindi.

If language is Hinglish:
Use natural Roman Hindi + English, like a real Indian customer typing a Google review.

IMPORTANT QUALITY CHECK BEFORE OUTPUT:

Before returning the answer, verify internally:

1. There are exactly 7 reviews.
2. Every review has 2-3 complete sentences.
3. Reviews are approximately 30-50 words where possible.
4. No review is only one short sentence.
5. All reviews express the same customer idea.
6. No unsupported specific facts were added.
7. Sentiment is preserved.
8. The seven reviews are meaningfully different.
9. The writing sounds natural, not robotic or promotional.

SUGGESTIONS:

After the reviews, generate exactly 3 short optional suggestions.

Suggestions should help the customer add more personal information if they want.

Suggestions must be based on the customer's input.

For example, if the customer wrote:
"good staff"

possible suggestions:

"Staff ke behaviour ke baare mein kya achha laga?"
"Staff ke saath interaction kaisa raha?"
"Overall experience kaisa raha?"

Suggestions are OPTIONAL.

Do not force the customer to answer them.

OUTPUT FORMAT:

Return ONLY valid JSON.

Use exactly this structure:

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

No markdown.
No explanation.
No numbering outside the JSON.
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
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                reviews: {
                  type: "ARRAY",
                  items: {
                    type: "STRING",
                  },
                },
                suggestions: {
                  type: "ARRAY",
                  items: {
                    type: "STRING",
                  },
                },
              },
              required: ["reviews", "suggestions"],
            },
            maxOutputTokens: 2200,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return NextResponse.json(
        {
          error:
            "Gemini could not generate the review right now.",
        },
        { status: 502 }
      );
    }

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof raw !== "string") {
      return NextResponse.json(
        {
          error:
            "Gemini returned an empty response.",
        },
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
        {
          error:
            "Gemini returned an invalid response.",
        },
        { status: 502 }
      );
    }

    const reviews = Array.isArray(result.reviews)
      ? result.reviews.filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0
        )
      : [];

    const suggestions = Array.isArray(result.suggestions)
      ? result.suggestions.filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0
        )
      : [];

    if (reviews.length === 0) {
      return NextResponse.json(
        {
          error:
            "Gemini could not create review options. Please try again.",
        },
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
      {
        error:
          "Something went wrong while generating your reviews.",
      },
      { status: 500 }
    );
  }
}