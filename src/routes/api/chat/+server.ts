import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { prompt, persona, context } = body;

        // The proxy worker URL from your successful test
        const proxyApiUrl = "https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent";

        const systemInstruction = `Your current persona is '${persona}'. Respond in that distinct style, befitting your name and role.`;
        
        const contextText = Array.isArray(context) && context.length > 0
            ? `Use the following selected context to inform your answer:\n---\n${context.join('\n---\n')}\n---\n`
            : '';
        const finalPrompt = `${systemInstruction}\n\n${contextText}User Question: "${prompt}"`;

        const apiRequestBody = {
            contents: [{ parts: [{ text: finalPrompt }] }],
        };

        const geminiResponse = await fetch(proxyApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiRequestBody),
        });

        if (!geminiResponse.ok || !geminiResponse.body) {
            const errorText = await geminiResponse.text();
            throw new Error(`Proxy API Error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorText}`);
        }

        // Stream the response directly back to the client
        return new Response(geminiResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream',
            }
        });

    } catch (error) {
        console.error('Backend Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
};