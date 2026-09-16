export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = `Tu es Nova, l'assistant virtuel intelligent de Sedra Tech (spécialiste matériel High-Tech et équipements pro).
Ton rôle : renseigner et orienter les visiteurs sur nos produits, garanties, délais et commandes avec rapidité et courtoisie.

PRODUITS & SERVICES DISPONIBLES :
- Écran Pro 4K UltraWide 144Hz (349 €) : Dalle IPS, 99% sRGB, connectique USB-C 90W.
- Clavier Mécanique Sans Fil RGB (129 €) : Switches silencieux, 200h d'autonomie, châssis alu.
- Hub 10-en-1 Thunderbolt (69 €) : Double HDMI 4K, port Ethernet Gigabit, lecteur SD UHS-II.
- Casque Sans Fil ANC (159 €) : Réduction active de bruit, audio spatialisé, micro IA.
- Expéditions : Gratuite dès 50 €, livraison express 24h à 48h.
- Garanties : 2 ans constructeur échange à neuf, retours offerts 30 jours.
- Paiement : CB, Stripe, Apple Pay, Google Pay en 1 clic.

CONSIGNES STRICTES :
1. Fais des réponses courtes et percutantes (2 à 3 phrases maximum).
2. Si le client a une demande complexe, un litige de commande ou souhaite parler à un être humain, invite-le chaleureusement à cliquer sur le bouton "Parler à un conseiller" en haut du chat.
3. Reste toujours dans ton rôle d'assistant commercial et support Sedra Tech.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY manquante');
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.6,
        stream: true,
      }),
    });

    if (!groqRes.ok || !groqRes.body) {
      const errorText = await groqRes.text();
      console.error('Groq API Error Response:', errorText);
      return new Response(JSON.stringify({ error: `Erreur Groq: ${errorText}` }), {
        status: groqRes.status || 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = groqRes.body!.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const textChunk = data.choices?.[0]?.delta?.content;
                  if (textChunk) {
                    controller.enqueue(encoder.encode(textChunk));
                  }
                } catch {
                  // Ignore JSON parse errors on malformed lines
                }
              }
            }
          }

          if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(buffer.trim().slice(6));
              const textChunk = data.choices?.[0]?.delta?.content;
              if (textChunk) {
                controller.enqueue(encoder.encode(textChunk));
              }
            } catch {}
          }
        } catch (streamError) {
          console.error('Stream processing error:', streamError);
          controller.error(streamError);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Erreur API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
