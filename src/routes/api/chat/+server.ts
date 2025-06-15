import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { prompt, persona } = await request.json();

        // This instruction set is sent to the AI along with the user's prompt
        const systemInstruction = `Your current persona is '${persona}'. Respond in that distinct style, befitting your name and role.`;
        const finalPrompt = `${systemInstruction}\n\nUser Question: "${prompt}"`;

        // 1. Fetch the rotating API key
        const keyResponse = await fetch('https://div3rcity.me/key');
        if (!keyResponse.ok) {
            throw new Error('Failed to fetch rotating API key.');
        }
        const geminiKey = await keyResponse.text();

        // 2. Construct the proper request to the official Google Gemini API endpoint
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-flash:streamGenerateContent?key=${geminiKey}`;
        
        const apiRequestBody = {
            contents: [{ parts: [{ text: finalPrompt }] }],
        };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiRequestBody),
        });

        if (!geminiResponse.body) {
            throw new Error('Gemini API response has no body.');
        }

        // 3. Stream the response back to the client
        return new Response(geminiResponse.body, { headers: { 'Content-Type': 'text/plain' } });

    } catch (error) {
        console.error('Backend Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
};