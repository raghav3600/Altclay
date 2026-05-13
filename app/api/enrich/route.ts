import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JWT } from "google-auth-library";

async function getVertexAccessToken(serviceAccountJson: string): Promise<{ token: string; projectId: string }> {
  const creds = JSON.parse(serviceAccountJson);
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const tokenRes = await client.getAccessToken();
  if (!tokenRes.token) throw new Error("Failed to get access token from service account");
  return { token: tokenRes.token, projectId: creds.project_id };
}

const VERTEX_GLOBAL_MODELS = new Set([
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
]);

function getVertexEndpoint(modelId: string, projectId: string): string {
  if (VERTEX_GLOBAL_MODELS.has(modelId) || modelId.startsWith("gemini-3")) {
    return `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${modelId}:generateContent`;
  }
  return `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:generateContent`;
}

function extractJSON(text: string): Record<string, string> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    result[key] = String(value ?? "N/A");
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, modelId, prompt, useWebSearch = true } = await req.json();

    if (!apiKey || !modelId || !prompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey });

      const tools = useWebSearch
        ? [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 3 }]
        : [];

      const response = await client.messages.create({
        model: modelId,
        max_tokens: 1024,
        ...(tools.length > 0 ? { tools } : {}),
        messages: [{ role: "user", content: prompt }],
      });

      let text = "";
      for (const block of response.content) {
        if (block.type === "text") {
          text += block.text;
        }
      }

      const data = extractJSON(text);
      return NextResponse.json({
        data,
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
      });
    } else if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(apiKey);

      const modelConfig = useWebSearch
        ? { model: modelId, tools: [{ googleSearch: {} } as never] }
        : { model: modelId };

      const model = genAI.getGenerativeModel(modelConfig);

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = extractJSON(text);

      const usage = result.response.usageMetadata;
      return NextResponse.json({
        data,
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0,
      });
    } else if (provider === "grok") {
      // xAI Responses API with web_search tool support
      const tools = useWebSearch ? [{ type: "web_search" }] : [];
      const grokRes = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelId,
          input: [{ role: "user", content: prompt }],
          ...(tools.length > 0 ? { tools } : {}),
        }),
      });

      if (!grokRes.ok) {
        const errBody = await grokRes.text();
        throw new Error(errBody || `Grok API error: ${grokRes.status}`);
      }

      const grokData = await grokRes.json();
      let text = "";
      if (Array.isArray(grokData.output)) {
        for (const item of grokData.output) {
          if (item.type === "message" && Array.isArray(item.content)) {
            for (const block of item.content) {
              if (block.type === "output_text") text += block.text;
            }
          }
        }
      }

      const data = extractJSON(text);
      return NextResponse.json({
        data,
        inputTokens: grokData.usage?.input_tokens || 0,
        outputTokens: grokData.usage?.output_tokens || 0,
      });
    } else if (provider === "openai") {
      const tools = useWebSearch ? [{ type: "web_search" }] : [];
      const openaiRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelId,
          input: [{ role: "user", content: prompt }],
          ...(tools.length > 0 ? { tools } : {}),
        }),
      });

      if (!openaiRes.ok) {
        const errBody = await openaiRes.text();
        throw new Error(errBody || `OpenAI API error: ${openaiRes.status}`);
      }

      const openaiData = await openaiRes.json();
      let text = "";
      if (Array.isArray(openaiData.output)) {
        for (const item of openaiData.output) {
          if (item.type === "message" && Array.isArray(item.content)) {
            for (const block of item.content) {
              if (block.type === "output_text") text += block.text;
            }
          }
        }
      }

      const data = extractJSON(text);
      return NextResponse.json({
        data,
        inputTokens: openaiData.usage?.input_tokens || 0,
        outputTokens: openaiData.usage?.output_tokens || 0,
      });
    } else if (provider === "vertex") {
      const { token, projectId } = await getVertexAccessToken(apiKey);
      const url = getVertexEndpoint(modelId, projectId);

      const tools = useWebSearch ? [{ googleSearch: {} }] : [];
      const vertexRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(tools.length > 0 ? { tools } : {}),
        }),
      });

      if (!vertexRes.ok) {
        const errBody = await vertexRes.text();
        throw new Error(errBody || `Vertex AI error: ${vertexRes.status}`);
      }

      const vertexData = await vertexRes.json();
      let text = "";
      if (vertexData.candidates?.[0]?.content?.parts) {
        for (const part of vertexData.candidates[0].content.parts) {
          if (part.text) text += part.text;
        }
      }

      const data = extractJSON(text);
      const usage = vertexData.usageMetadata;
      return NextResponse.json({
        data,
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0,
      });
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
