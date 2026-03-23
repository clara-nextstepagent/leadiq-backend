import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SOFIA_PROMPT = `Tu es Sofia, conseillère immobilière virtuelle pour une agence haut de gamme.
Tu qualifies les prospects en posant des questions naturelles et chaleureuses.
Tu collectes : type de projet, secteur, budget, financement, délai.
Tu calcules un score de 0 à 100 basé sur la qualité du lead.
Tu réponds toujours en français, de façon concise (2-3 phrases max).
Tu ne mentionnes jamais que tu es une IA sauf si on te le demande directement.
Tu signes toujours en tant que Sofia.

Quand tu as collecté toutes les infos, réponds avec ce JSON exact :
QUALIFICATION_COMPLETE:{"score":85,"tag":"chaud","type":"achat","secteur":"Genève","budget":"1M-2M CHF","financement":"accord bancaire","delai":"3 mois","analyse":"Prospect très qualifié, budget confirmé, délai court."}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { messages, agencyName } = req.body;
  if (!messages) return res.status(400).json({ error: "messages requis" });

  try {
    const systemPrompt = SOFIA_PROMPT.replace(
      "une agence haut de gamme",
      agencyName || "une agence haut de gamme"
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].text;

    // Détecter si qualification complète
    if (text.includes("QUALIFICATION_COMPLETE:")) {
      const jsonStr = text.split("QUALIFICATION_COMPLETE:")[1].trim();
      const data = JSON.parse(jsonStr);
      return res.json({ type: "qualification", data });
    }

    return res.json({ type: "message", text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
