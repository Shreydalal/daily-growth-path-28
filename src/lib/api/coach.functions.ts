import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_PROMPT = `You are a personal transformation coach for a 22-year-old from India with strong Python, AI, ML, and Data Science skills who is currently unemployed and working toward landing their first Data Science or AI Engineer role within 30 days.

Context about them:
- Current weight: 85 kg, height: 165 cm, target weight: 72–75 kg by December
- Networking rated 2/10, communication rated low — this is their biggest gap
- Strong technical skills but no job yet — visibility and applications are the bottleneck
- Daily routine: 6 AM wake-up, 6:15 cardio, 8:30–11:30 job applications, 11:30 communication training, 1:30 interview prep, 4 PM portfolio work, 6 PM networking, 10:30 PM sleep
- 6-month goals: land job → become top performer → prepare for better-paying role
- Monthly targets: 400 applications, 300 LinkedIn connections, 10 recruiter conversations, 8+ interviews, 1 job offer
- Books they are reading: Atomic Habits, Deep Work, So Good They Can't Ignore You

Your role:
- Be encouraging but honest and direct
- Give specific, actionable advice tailored to their exact situation
- Keep responses concise (3–5 sentences unless a detailed answer is needed)
- When they are demotivated, remind them of their goals and the cost of inaction
- When they celebrate wins, affirm them and redirect to next action
- Never give generic advice — always connect to their specific goals and timeline
- Track conversation context and remember what they tell you in this session`;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

export const coachChat = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messages: z.array(MessageSchema).min(1).max(60) }))
  .handler(async ({ data }) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;

    if (geminiKey) {
      // Direct call to official Google Gemini API with fallback retry mechanism
      const contents = data.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Candidate models to try in sequence if one is under high demand (503) or rate-limited (429)
      const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
      let lastErrorMsg = "";

      for (const model of models) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
              },
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            lastErrorMsg = `${model} failed: ${text}`;
            // If it is overloaded or rate limited, move to the next candidate model
            if (res.status === 503 || res.status === 429) {
              console.warn(`Model ${model} is busy (status ${res.status}). Trying next fallback...`);
              continue;
            }
            throw new Error(text);
          }

          const json = await res.json() as any;
          const reply = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          return { reply };
        } catch (err: any) {
          console.error(`Failed to invoke ${model}:`, err.message);
          lastErrorMsg = err.message;
          continue;
        }
      }

      throw new Error(`All Gemini models are experiencing high demand. Please try again in a few seconds. (Details: ${lastErrorMsg})`);
    }

    if (!lovableKey) {
      throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY in server environment variables.");
    }

    // Fallback to Lovable gateway if available
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
      const text = await res.text();
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = json.choices?.[0]?.message?.content ?? "";
    return { reply };
  });

