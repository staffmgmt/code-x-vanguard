import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, persona } = await request.json();

		const systemInstruction = `Your current persona is '${persona}'. Respond in that distinct style, befitting your name and role.`;
		const finalPrompt = `${systemInstruction}\n\nUser Question: "${prompt}"`;

		const proxyApiUrl =
			'https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent';

		const apiRequestBody = {
			contents: [{ parts: [{ text: finalPrompt }] }]
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

		// CORRECTED IMPLEMENTATION: Manually pipe the stream.
		// This is more robust in serverless environments than just passing the body.
		const reader = proxyResponse.body.getReader();
		const stream = new ReadableStream({
			async start(controller) {
				// This function will pump data from the proxy to the client.
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							break; // Exit the loop when the stream is finished.
						}
						// SERVER-SIDE LOG: Check your Cloudflare deployment logs for this message.
						console.log('Chunk received from proxy, enqueuing to client.');
						controller.enqueue(value); // Send the chunk to the client.
					}
				} catch (err) {
					console.error('Error while pumping stream:', err);
					controller.error(err);
				} finally {
					controller.close(); // Close the stream when done.
					reader.releaseLock();
				}
			}
		});

		// Return the response with our new, controlled stream.
		return new Response(stream, {
			headers: { 'Content-Type': 'text/plain; charset=utf-8' }
		});
		
	} catch (err) {
		const message = err instanceof Error ? err.message : 'An unknown error occurred.';
		console.error('API Endpoint Error:', message);
		throw error(500, `API Error: ${message}`);
	}
};