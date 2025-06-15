import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { prompt, persona } = await request.json();

        const systemInstruction = `Your current persona is '${persona}'. Respond in that distinct style, befitting your name and role.`;
        const finalPrompt = `${systemInstruction}\n\nUser Question: "${prompt}"`;

        // The single, correct proxy endpoint provided by the General.
        // NOTE: The model name is adapted from your curl command, but using the 'streamGenerateContent' method 
        // from your original UI code to ensure the streaming works.
        const proxyApiUrl = 'https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent';
        
        const apiRequestBody = {
            contents: [{ parts: [{ text: finalPrompt }] }],
        };

        // This is now the ONLY fetch call made by this endpoint.
        const proxyResponse = await fetch(proxyApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiRequestBody),
        });

        // Check if the proxy itself returned an error.
        if (!proxyResponse.ok) {
            const errorBody = await proxyResponse.text();
            throw new Error(`Proxy server failed with status ${proxyResponse.status}: ${errorBody}`);
        }

        if (!proxyResponse.body) {
            throw new Error('Proxy response has no body.');
        }

        // Stream the response from the proxy directly to the client.
        return new Response(proxyResponse.body, { 
            headers: { 'Content-Type': 'text/plain' } 
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('API Endpoint Error:', message);
        throw error(500, `API Error: ${message}`);
    }
};