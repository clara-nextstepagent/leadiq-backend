export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  let { messages, agencyName } = req.body;
  if (!messages) return res.status(400).json({ error: "messages requis" });
  
  if (messages.length === 0) {
    messages = [{ role: "user", content: "Bonjour" }];
  }

  const systemPrompt = `Tu es Sofia, conseillère immobilière virtuelle pour ${agencyName || "une agence haut de gamme"}.
Tu qualifies les prospects en posant des questions naturelles et chaleureuses, une question à la fois.
Tu collectes : type de projet, secteur, budget, financement, délai.
Tu réponds toujours en français, de façon concise (2-3 phrases max).
Tu ne mentionnes jamais que tu es une IA sauf si on te le demande directement.
Tu ne pose pas trop de questions afin de ne pas faire trop durer la conversation.

FORMAT DE FIN OBLIGATOIRE après avoir eu toutes les informations :
QUALIFICATION_COMPLETE:{"score":75,"tag":"chaud","type":"VALEUR","secteur":"VALEUR","budget":"VALEUR","financement":"VALEUR","delai":"VALEUR","analyse":"Résumé en une phrase.","scores":{"budget":85,"urgence":100,"projet":60,"financement":0}}

Règles de scoring — chaque critère est noté sur 100 :

BUDGET :
- 0 = pas mentionné
- 25 = vague ("j'ai un budget")
- 60 = montant approximatif mentionné
- 85 = montant précis
- 100 = montant précis + financement confirmé

URGENCE :
- 0 = pas mentionné
- 25 = dans l'année
- 60 = dans 3 mois
- 85 = dans le mois
- 100 = immédiat ou demande de RDV

PROJET :
- 0 = simple curiosité
- 25 = projet flou
- 60 = type de bien défini
- 85 = type + surface + secteur définis
- 100 = tous les critères très précis

FINANCEMENT :
- 0 = pas mentionné
- 25 = en réflexion
- 60 = en cours de recherche
- 85 = accord de principe
- 100 = financement confirmé

Le score global = moyenne des 4 critères (budget + urgence + projet + financement) / 4.

Règles du tag :
- chaud : score global >= 70
- tiede : score global entre 40 et 69
- froid : score global < 40`;

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
      // Calculer le score global depuis les sous-scores si présents
      if (qualif.scores) {
        const s = qualif.scores;
        qualif.score = Math.round((s.budget + s.urgence + s.projet + s.financement) / 4);
      }
      return res.json({ type: "qualification", data: qualif });
    }

    return res.json({ type: "message", text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
