import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();
        const { prompt, persona, context } = body;

        const proxyApiUrl = "https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent";

        const systemInstruction = `Your current persona is '${persona}'. Respond in that distinct style, befitting your name and role.`;
        
        const contextText = Array.isArray(context) && context.length > 0
            ? `Use the following selected context to inform your answer:\n---\n${context.join('\n---\n')}\n---\n`
            : '';
        const finalPrompt = `${systemInstruction}\n\n${contextText}User Question: "${prompt}"`;

        const apiRequestBody = {
            contents: [{ parts: [{ text: finalPrompt }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40
            }
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

        // Transform stream to extract only the text content from JSON responses
        const transformedStream = new ReadableStream({
            async start(controller) {
                const reader = geminiResponse.body.getReader();
                const decoder = new TextDecoder();
                const encoder = new TextEncoder();
                let buffer = '';
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    // Add new chunk to buffer
                    buffer += decoder.decode(value, { stream: true });
                    
                    try {
                        // Extract any complete JSON objects
                        const jsonRegex = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
                        let match;
                        let lastIndex = 0;
                        let textContent = '';
                        
                        while ((match = jsonRegex.exec(buffer)) !== null) {
                            try {
                                const data = JSON.parse(match[0]);
                                if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                                    textContent += data.candidates[0].content.parts[0].text;
                                }
                                lastIndex = match.index + match[0].length;
                            } catch (e) {
                                // Skip invalid JSON
                                console.error('JSON parse error:', e);
                            }
                        }
                        
                        if (textContent) {
                            controller.enqueue(encoder.encode(textContent));
                        }
                        
                        // Keep unprocessed part of buffer
                        if (lastIndex > 0) {
                            buffer = buffer.substring(lastIndex);
                        }
                    } catch (e) {
                        console.error('Stream processing error:', e);
                    }
                }
                
                controller.close();
            }
        });

        return new Response(transformedStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });
    } catch (error) {
        console.error('Backend Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return new Response(JSON.stringify({ error: errorMessage }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};