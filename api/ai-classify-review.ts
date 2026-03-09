export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { review_text, product_name } = req.body;

  if (!review_text || !product_name) {
    return res.status(400).json({ error: "Missing review_text or product_name" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Classify this review for product ${product_name}: ${review_text}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "AI request failed",
      fallback: {
        risk_level: "Unknown",
        issue_category: "Unknown",
        authenticity_score: 0,
        ai_confidence: 0,
        classification: "Low Value Lead"
      }
    });
  }
}