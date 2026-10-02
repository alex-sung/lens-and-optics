"use client";

import { useState } from "react";

const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJsz83nLs5EzkRaaG9eBe6fuQ";

const languages = ["English", "Hindi", "Hinglish"] as const;

export default function ReviewAssistant() {
  const [experience, setExperience] = useState("");
  const [language, setLanguage] =
    useState<(typeof languages)[number]>("Hinglish");

  const [reviews, setReviews] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState("");

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

  async function copyReview(
    review: string,
    index: number
  ) {
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

        <div className="brandMark">
          L&O
        </div>

        <p className="eyebrow">
          Lens & Optics Gallery
        </p>

        <h1>
          Apna experience batao.
        </h1>

        <p className="subtitle">
          Long paragraph likhne ki zarurat nahi.
          Sirf kuch words mein batao ki experience
          kaisa raha.
        </p>

        <div className="exampleBox">
          <strong>Example:</strong>

          <div className="examples">
            <span>good staff</span>
            <span>good service</span>
            <span>nice experience</span>
            <span>frames achhe</span>
          </div>
        </div>

        <label
          className="label"
          htmlFor="language"
        >
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
              onClick={() =>
                setLanguage(item)
              }
            >
              {item}
            </button>
          ))}
        </div>

        <label
          className="label"
          htmlFor="experience"
        >
          Your experience
        </label>

        <textarea
          id="experience"
          value={experience}
          onChange={(e) =>
            setExperience(e.target.value)
          }
          maxLength={1200}
          placeholder="Example: good staff, good service"
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
            ? "✨ Gemini is creating your reviews..."
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

                <h2>
                  Review options
                </h2>
              </div>

              <span className="smallNote">
                Tap any review to copy
              </span>
            </div>

            {reviews.map(
              (review, index) => (
                <button
                  key={`${review}-${index}`}
                  type="button"
                  className="reviewOption"
                  onClick={() =>
                    copyReview(
                      review,
                      index
                    )
                  }
                >
                  <span>
                    {review}
                  </span>

                  <span className="copy">
                    {copied === index
                      ? "✓ Copied"
                      : "Copy review"}
                  </span>
                </button>
              )
            )}

            {suggestions.length > 0 && (
              <div className="suggestionBox">

                <p className="eyebrow">
                  Want a more personal review?
                </p>

                <h3>
                  You can add a little more detail
                </h3>

                <p className="suggestionText">
                  These are optional suggestions
                  generated by Gemini. You don't
                  need to answer them.
                </p>

                <div className="suggestions">
                  {suggestions.map(
                    (suggestion, index) => (
                      <div
                        className="suggestion"
                        key={`${suggestion}-${index}`}
                      >
                        <span>
                          {index + 1}
                        </span>

                        <p>
                          {suggestion}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="googleBox">

              <strong>
                Ready to post?
              </strong>

              <p>
                Apni favourite review choose
                karke copy karo. Phir Google par
                jaakar apni honest rating select
                karke manually paste aur submit
                karo.
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
        Your review should reflect your own
        experience.
      </p>
    </main>
  );
}