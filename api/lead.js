import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const {
    agencyId,
    branchId,
    // Qualification IA
    score, tag, type, secteur, budget, financement, delai, analyse,
    // Coordonnées prospect
    prenom, email, telephone,
    // Conversation
    conversation
  } = req.body;

  if (!agencyId) return res.status(400).json({ error: "agencyId requis" });

  try {
    const { data, error } = await sb.from("leads").insert({
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
        budget: score ? Math.round(score * 0.3) : 0,
        urgence: score ? Math.round(score * 0.25) : 0,
        projet: score ? Math.round(score * 0.25) : 0,
        financement: score ? Math.round(score * 0.2) : 0
      }),
      conversation: conversation || null
    }).select().single();

    if (error) throw error;

    return res.json({ success: true, leadId: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
