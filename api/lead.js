export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const {
    agencyId, branchId,
    score, tag, type, secteur, budget, financement, delai, analyse,
    prenom, email, telephone, conversation, scores
  } = req.body;

  if (!agencyId) return res.status(400).json({ error: "agencyId requis" });

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/leads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          agency_id: agencyId,
          branch_id: branchId || null,
          source: "widget",
          name: prenom || null,
          email: email || null,
          phone: telephone || null,
          score: score || 0,
          tag: tag || "froid",
          status: "nouveau",
          lead_analyse: analyse || null,
          data: JSON.stringify({ type, secteur, budget, financement, delai }),
          scores: JSON.stringify({
            budget: scores?.budget ?? (score ? Math.round(score * 0.3) : 0),
            urgence: scores?.urgence ?? (score ? Math.round(score * 0.25) : 0),
            projet: scores?.projet ?? (score ? Math.round(score * 0.25) : 0),
            financement: scores?.financement ?? (score ? Math.round(score * 0.2) : 0)
          }),
          conversation: conversation || null
        })
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    return res.json({ success: true, leadId: data[0]?.id });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
