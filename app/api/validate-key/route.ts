import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ valid: false, error: "Missing API key" }, { status: 400 });
    }

    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      });
      return NextResponse.json({ valid: true });
    } else if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      await model.generateContent("Hi");
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false, error: "Unknown provider" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";

    // Rate limit / quota errors mean the key IS valid — just temporarily limited
    if (
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("rate") ||
      message.includes("Too Many Requests") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("overloaded")
    ) {
      return NextResponse.json({ valid: true, warning: "Key is valid but you may be near your rate limit. Enrichment will retry automatically." });
    }

    // Auth errors mean the key is genuinely invalid
    if (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("invalid") ||
      message.includes("API_KEY") ||
      message.includes("authentication") ||
      message.includes("PERMISSION_DENIED") ||
      message.includes("Incorrect API key")
    ) {
      return NextResponse.json({ valid: false, error: "Invalid API key. Please check and try again." });
    }

    // Network / unknown errors — don't block the user, let them try
    return NextResponse.json({ valid: true, warning: "Could not fully verify key, but it looks correctly formatted. Proceed with caution." });
  }
}
