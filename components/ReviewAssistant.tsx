
"use client";

import { useState } from "react";

const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJsz83nLs5EzkRaaG9eBe6fuQ";

const languages = ["English", "Hindi", "Hinglish"] as const;

const examples = [
  "good staff",
  "good service",
  "nice experience",
  "frames achhe",
  "friendly behaviour",
  "good collection",
  "stylish frames",
  "good quality",
  "helpful guidance",
  "value for money",
];

export default function ReviewAssistant() {
  const [experience, setExperience] = useState("");
  const [language, setLanguage] =
    useState<(typeof languages)[number]>("Hinglish");

  const [reviews, setReviews] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");

  function addExample(example: string) {
    const currentParts = experience
      .split(",")
      .map((part) => part.trim().toLowerCase());

    if (currentParts.includes(example.toLowerCase())) {
      return;
    }

    const cleanExperience = experience.trim().replace(/,\s*$/, "");

    const updatedExperience = cleanExperience
      ? `${cleanExperience}, ${example}`
      : example;

    if (updatedExperience.length > 1200) {
      setError("Input 1200 characters se zyada nahi ho sakta.");
      return;
    }

    setExperience(updatedExperience);
    setError("");
  }

  async function generateReviews() {
    setError("");
    setReviews([]);
    setSuggestions([]);
    setCopied(null);

    if (experience.trim().length < 2) {
      setError("Bas 2-5 words bhi likh sakte ho. Example: good staff");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experience: experience.trim(),
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Reviews generate nahi ho paye."
        );
      }

      setReviews(
        Array.isArray(data.reviews) ? data.reviews : []
      );

      setSuggestions(
        Array.isArray(data.suggestions)
          ? data.suggestions
          : []
      );

      if (!Array.isArray(data.reviews) || data.reviews.length === 0) {
        setError("Reviews nahi mile. Please dobara try karo.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyReview(review: string, index: number) {
    try {
      await navigator.clipboard.writeText(review);

      setCopied(index);

      window.setTimeout(() => {
        setCopied(null);
      }, 2500);
    } catch {
      setError(
        "Copy nahi ho paya. Review ko manually select karke copy kar sakte ho."
      );
    }
  }

  return (
    <main className="page">
      <section className="card">
        <div className="brandMark">L&O</div>

        <p className="eyebrow">
          Lens & Optics Gallery
        </p>

        <h1>Apna experience batao.</h1>

        <p className="subtitle">
          Long paragraph likhne ki zarurat nahi.
          Sirf kuch words mein batao ki experience
          kaisa raha.
        </p>

        <div className="exampleBox">
          <strong>Example:</strong>

          <div className="examples">
            {examples.map((example) => {
              const isSelected = experience
                .split(",")
                .some(
                  (part) =>
                    part.trim().toLowerCase() ===
                    example.toLowerCase()
                );

              return (
                <button
                  key={example}
                  type="button"
                  className="exampleChip"
                  aria-pressed={isSelected}
                  onClick={() => addExample(example)}
                  disabled={loading}
                  style={{
                    border: "1px solid #dce1e9",
                    borderRadius: "22px",
                    padding: "7px 12px",
                    background: isSelected ? "#111827" : "#ffffff",
                    color: isSelected ? "#ffffff" : "#26364d",
                    fontSize: "12px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {example}
                  {isSelected ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <label className="label" htmlFor="language">
          Review language
        </label>

        <div className="languageRow">
          {languages.map((item) => (
            <button
              key={item}
              type="button"
              className={
                language === item
                  ? "language active"
                  : "language"
              }
              onClick={() => setLanguage(item)}
              disabled={loading}
            >
              {item}
            </button>
          ))}
        </div>

        <label className="label" htmlFor="experience">
          Your experience
        </label>

        <textarea
          id="experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          maxLength={1200}
          placeholder="Example: good staff, good service"
          disabled={loading}
        />

        <div className="counter">
          {experience.length}/1200
        </div>

        <button
          className="generate"
          type="button"
          onClick={generateReviews}
          disabled={loading}
        >
          {loading
            ? "✨ Creating your reviews..."
            : "✨ Generate review options"}
        </button>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="results">
            <div className="resultsHeader">
              <div>
                <p className="eyebrow">
                  Generated for you
                </p>

                <h2>Review options</h2>
              </div>

              <span className="smallNote">
                Tap any review to copy
              </span>
            </div>

            {reviews.map((review, index) => (
              <button
                key={`${review}-${index}`}
                type="button"
                className="reviewOption"
                onClick={() => copyReview(review, index)}
              >
                <span>{review}</span>

                <span className="copy">
                  {copied === index
                    ? "✓ Copied"
                    : "Copy review"}
                </span>
              </button>
            ))}

            {suggestions.length > 0 && (
              <div className="suggestionBox">
                <p className="eyebrow">
                  Want a more personal review?
                </p>

                <h3>
                  You can add a little more detail
                </h3>

                <p className="suggestionText">
                  These are optional suggestions generated
                  by Gemini. You don't need to answer them.
                </p>

                <div className="suggestions">
                  {suggestions.map((suggestion, index) => (
                    <div
                      className="suggestion"
                      key={`${suggestion}-${index}`}
                    >
                      <span>{index + 1}</span>
                      <p>{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="googleBox">
              <strong>Ready to post?</strong>

              <p>
                Apni favourite review choose karke copy karo.
                Phir Google par jaakar apni honest rating select
                karke manually paste aur submit karo.
              </p>

              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noreferrer"
                className="googleButton"
              >
                Continue to Google →
              </a>
            </div>
          </div>
        )}
      </section>

      <p className="footer">
        Your review should reflect your own experience.
      </p>
    </main>
  );
}
