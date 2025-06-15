import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, persona } = await request.json();

		const systemInstruction = `Your current persona is '${persona}'. Respond in that distinct style, befitting your name and role.`;
		const finalPrompt = `${systemInstruction}\n\nUser Question: "${prompt}"`;

		// CORRECTED: Using the streaming endpoint with the required `alt=sse` parameter.
		// This tells the API to format the response as Server-Sent Events.
		const proxyApiUrl =
			'https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent?alt=sse';

		const apiRequestBody = {
			contents: [{ parts: [{ text: finalPrompt }] }],
			generationConfig: {
				temperature: 0.9,
				topK: 1,
				topP: 1,
				maxOutputTokens: 2048,
				stopSequences: []
			},
			safetySettings: [
				{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
				{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
				{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
				{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
			]
		};

		const proxyResponse = await fetch(proxyApiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(apiRequestBody)
		});

		if (!proxyResponse.ok) {
			const errorBody = await proxyResponse.text();
			throw new Error(`Proxy server failed with status ${proxyResponse.status}: ${errorBody}`);
		}

		if (!proxyResponse.body) {
			throw new Error('Proxy response has no body.');
		}

		// Using the robust stream-pumping logic from Protocol AEGIS.
		const reader = proxyResponse.body.getReader();
		const stream = new ReadableStream({
			async start(controller) {
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							break;
						}
						controller.enqueue(value);
					}
				} catch (err) {
					console.error('Error while pumping stream:', err);
					controller.error(err);
				} finally {
					controller.close();
					reader.releaseLock();
				}
			}
		});

		// Return the SSE stream to the client.
		return new Response(stream, {
			headers: { 'Content-Type': 'text/event-stream' } // Set correct content type for SSE
		});

	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unknown error occurred.';
		console.error('API Endpoint Error:', message);
		throw error(500, `API Error: ${message}`);
	}
};