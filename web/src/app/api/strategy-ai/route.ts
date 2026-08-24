import { NextResponse } from "next/server";

/**
 * Asistente IA para crear estrategias. Recibe una idea en lenguaje natural y
 * devuelve código compatible con el motor (formato fast/slow) + explicación.
 *
 * Usa GROQ_API_KEY desde el entorno del SERVIDOR (nunca expuesta al cliente).
 * Groq es compatible con la API de OpenAI, así que el body es el mismo.
 * Si no hay key configurada, responde 200 con un mensaje claro (no rompe).
 */
export async function POST(request: Request) {
  let body: { prompt?: string; asset_type?: string; symbol?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json(
      { error: "Describe tu idea de estrategia." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      code: "",
      explanation:
        "El asistente IA aún no está configurado. Añade GROQ_API_KEY en las variables de entorno del servidor para activarlo.",
    });
  }

  const system =
    "Eres un asistente de QuantLab que convierte ideas de trading en estrategias " +
    "de cruce de medias móviles (SMA) compatibles con el motor. " +
    "Devuelve SIEMPRE un objeto JSON con dos campos: " +
    '"code" (string, formato "fast=XX,slow=YY", donde XX<YY, enteros entre 2 y 400) ' +
    'y "explanation" (string en español, 1-2 frases explicando la lógica). ' +
    "Si la idea no es un cruce de medias, elige fast/slow razonables que la aproximen. " +
    "No incluyas nada más que el JSON.";

  const user =
    `Activo: ${body.asset_type ?? "crypto"} ${body.symbol ?? ""}. ` +
    `Idea: ${prompt}`;

  try {
    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          // Llama 3.1 8B en Groq: gratis y muy rápido para serverless.
          model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json(
        { error: `El modelo falló: ${resp.status}. ${txt.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { code?: string; explanation?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { code: "", explanation: content };
    }

    return NextResponse.json({
      code: typeof parsed.code === "string" ? parsed.code : "",
      explanation:
        typeof parsed.explanation === "string"
          ? parsed.explanation
          : "Estrategia generada.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo contactar al asistente IA: ${msg}` },
      { status: 502 },
    );
  }
}
