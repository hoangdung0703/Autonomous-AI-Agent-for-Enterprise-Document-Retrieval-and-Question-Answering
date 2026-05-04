async function embedText(text, apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } })
    }
  );
  const data = await res.json();
  if (!data.embedding?.values?.length) {
    throw new Error(`Empty embedding returned for text: "${text.slice(0, 50)}..."`);
  }
  return data.embedding.values;
}

module.exports = embedText;
