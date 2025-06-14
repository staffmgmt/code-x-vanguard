import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { prompt, persona } = await request.json();

        const systemInstruction = `Your current persona is '${persona}'. Respond in that distinct style, befitting your name and role.`;
        const finalPrompt = `${systemInstruction}\n\nUser Question: "${prompt}"`;

        const keyResponse = await fetch('https://div3rcity.me/key');
        if (!keyResponse.ok) throw new Error('Failed to fetch rotating API key.');
        const geminiKey = await keyResponse.text();

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-flash:streamGenerateContent?key=${geminiKey}`;
        
        const apiRequestBody = {
            contents: [{ parts: [{ text: finalPrompt }] }],
        };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiRequestBody),
        });

        if (!geminiResponse.body) throw new Error('Gemini API response has no body.');

        return new Response(geminiResponse.body, { headers: { 'Content-Type': 'text/plain' } });

    } catch (error) {
        console.error('Backend Error:', error);
        return new Response('An internal error occurred in the API.', { status: 500 });
    }
};