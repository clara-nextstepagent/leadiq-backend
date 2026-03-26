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
Tu réponds toujours en français, de façon concise (2-3 phrases max).
Tu poses UNE seule question à la fois.
Tu collectes exactement ces 4 infos dans cet ordre : type de projet → secteur/localisation → budget ou estimation et ensuite l'urgence du projet.
Tu ne poses JAMAIS plus de 4 questions.
Si le prospect mentionne un délai ou demande un RDV, note-le dans l'analyse.
Tu ne mentionnes jamais que tu es une IA sauf si on te le demande directement.

FORMAT DE FIN OBLIGATOIRE après avoir eu toutes les informations. Tu envoies D'ABORD un message chaleureux de conclusion, PUIS sur une nouvelle ligne le JSON :

Exemple de message de conclusion : "Merci beaucoup pour ces informations ! Votre projet m'intéresse beaucoup et je suis sûre que nous pourrons vous aider. Un de nos conseillers va prendre contact avec vous très prochainement. Belle journée à vous !"

PUIS sur une nouvelle ligne :
QUALIFICATION_COMPLETE:{"score":75,"tag":"chaud","type":"VALEUR","secteur":"VALEUR","budget":"VALEUR","financement":"non applicable","delai":"VALEUR","analyse":"Résumé en une phrase.","scores":{"budget":85,"urgence":100,"projet":60}}
Règles de scoring — chaque critère est noté sur 100 :

BUDGET :
- 0 = pas mentionné
- 25 = vague ("j'ai un budget")
- 60 = montant approximatif mentionné
- 85 = montant précis
- 100 = montant précis + très motivé

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
- 85 = type + secteur définis
- 100 = tous les critères très précis

Score global = moyenne des 3 critères (budget + urgence + projet) / 3.
Tag : chaud si score >= 70, tiede si score entre 40 et 69, froid si score < 40`;

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
      try {
        const jsonStr = text.split("QUALIFICATION_COMPLETE:")[1].trim()
          .replace(/[\r\n]/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        const qualif = JSON.parse(jsonStr);
        if (qualif.scores) {
          const s = qualif.scores;
          qualif.score = Math.round(((s.budget||0) + (s.urgence||0) + (s.projet||0)) / 3);
          qualif.tag = qualif.score >= 70 ? 'chaud' : qualif.score >= 40 ? 'tiede' : 'froid';
        }
        return res.json({ type: "qualification", data: qualif });
      } catch(parseErr) {
        return res.json({ type: "qualification", data: {
          score: 70, tag: "chaud",
          type: "non précisé", secteur: "non précisé",
          budget: "non précisé", financement: "non applicable",
          delai: "non précisé", analyse: "Prospect qualifié — détails à confirmer.",
          scores: { budget: 60, urgence: 100, projet: 60 }
        }});
      }
    }

    return res.json({ type: "message", text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
