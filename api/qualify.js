export default async function handler(req, res) {

  // Autoriser les appels depuis les sites clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Agency-Key');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Vérifier que c'est bien un de tes clients
  const agencyKey = req.headers['x-agency-key'];
  if (!agencyKey) return res.status(401).json({ error: 'Clé agence manquante' });

  const { messages, system } = req.body;

  // Appeler Claude avec ta clé cachée côté serveur
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: system,
      messages: messages
    })
  });

  const data = await response.json();
  return res.status(200).json(data);
}
