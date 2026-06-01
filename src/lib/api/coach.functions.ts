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
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      throw new Error("Missing GROQ_API_KEY in server environment variables.");
    }

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...data.messages,
          ],
        }),
      });

      if (!res.ok) {
        // If the main 70b model experiences rate limits, try the insanely fast llama-3.1-8b-instant
        if (res.status === 429 || res.status === 503) {
          console.warn("Groq llama-3.3-70b is busy. Trying llama-3.1-8b-instant...");
          const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...data.messages,
              ],
            }),
          });
          
          if (fallbackRes.ok) {
            const json = await fallbackRes.json() as any;
            const reply = json.choices?.[0]?.message?.content ?? "";
            return { reply };
          }
        }
        const text = await res.text();
        throw new Error(text);
      }

      const json = await res.json() as any;
      const reply = json.choices?.[0]?.message?.content ?? "";
      return { reply };
    } catch (err: any) {
      console.error("Groq execution failed:", err.message);
      throw new Error(`Groq API error: ${err.message}`);
    }
  });

