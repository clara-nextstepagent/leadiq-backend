export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

 let { messages, agencyName } = req.body;
  if (!messages) return res.status(400).json({ error: "messages requis" });
  
  // Si pas de messages, démarrer la conversation
  if (messages.length === 0) {
    messages = [{ role: "user", content: "Bonjour" }];
  }

  const systemPrompt = `Tu es Sofia, conseillère immobilière virtuelle pour ${agencyName || "une agence haut de gamme"}.
Tu qualifies les prospects en posant des questions naturelles et chaleureuses, une question à la fois.
Tu collectes : type de projet, secteur, budget, financement, délai.
Tu réponds toujours en français, de façon concise (2-3 phrases max).
Tu ne mentionnes jamais que tu es une IA sauf si on te le demande directement.
Tu ne pose pas trop de question afin de ne pas faire trop durée la conversation.

FORMAT DE FIN OBLIGATOIRE après avoir eu toutes les informations :
QUALIFICATION_COMPLETE:{"score":75,"tag":"chaud","type":"VALEUR","secteur":"VALEUR","budget":"VALEUR","financement":"VALEUR","delai":"non précisé","analyse":"Résumé en une phrase."}

Les règles du score :
- Budget élevé (>1M) = +25 points
- Financement confirmé = +20 points  
- Délai court (<3 mois) = +20 points
- Projet défini = +20 points
- Secteur premium = +15 points
- tag : chaud si score>=70, tiede si score>=40, froid sinon`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Erreur API" });
    }

    const text = data.content[0].text;

    if (text.includes("QUALIFICATION_COMPLETE:")) {
      const jsonStr = text.split("QUALIFICATION_COMPLETE:")[1].trim();
      const qualif = JSON.parse(jsonStr);
      return res.json({ type: "qualification", data: qualif });
    }

    return res.json({ type: "message", text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
