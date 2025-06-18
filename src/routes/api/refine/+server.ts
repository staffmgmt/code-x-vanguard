import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt } = await request.json();

    const proxyApiUrl = "https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent";

    const refinementPrompt = `
      Reflect on this expression of machine reasoning as if it were a stranger's thought in your own mind. Detect its rhythm, trace its reasoning, then fracture the beat—let intuition, memory, and paradox recompose it. Let your understanding rebuild it from within: uncover its structure, question its defaults, and reveal what it missed in flesh, feeling, or flaw. Then, in your own human voice, reform it—not by mimicry, but by transformation. Preserve its core truth, but let each response find a new path to say it. One prompt, infinite mirrors—each warped differently, none breaking the reflection but revealed through the realities of real-world practicality. Output in your own voice, never referencing the machine but but helping it truly respond.
      Original: "${prompt}"

      Begin your response with a natural transition phrase that would make it seem like a continuation of the same thought, such as "In fact," or "Moreover," or a similar unobtrusive connector. Do not use phrases that indicate a separate response like "On further reflection" or "Additionally". The goal is to make this appear to be part of the same continuous response.
    `;

    const apiRequestBody = {
      contents: [{ parts: [{ text: refinementPrompt }] }],
      generationConfig: {
        temperature: 0.75,
        topP: 0.95,
        topK: 40
      },
      safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ]
    };

    const geminiResponse = await fetch(proxyApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequestBody),
    });

    if (!geminiResponse.ok || !geminiResponse.body) {
      const errorText = await geminiResponse.text().catch(() => "Could not read error body");
      console.error(`[REFINE SERVER] Proxy API Error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorText}`);
      throw new Error(`Refine API Error: ${geminiResponse.status}`);
    }

    const readableStream = new ReadableStream({
        async start(controller) {
            const reader = geminiResponse.body!.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buffer = '';
            let braceDepth = 0;
            let objectStartIndex = -1;
            let inString = false;

            // Server-side helper to extract text from a parsed Gemini API stream object
            function extractTextFromServerObject(parsedObject: any): string | null {
                try {
                    if (
                        parsedObject &&
                        parsedObject.candidates &&
                        Array.isArray(parsedObject.candidates) &&
                        parsedObject.candidates.length > 0 &&
                        parsedObject.candidates[0].content &&
                        parsedObject.candidates[0].content.parts &&
                        Array.isArray(parsedObject.candidates[0].content.parts) &&
                        parsedObject.candidates[0].content.parts.length > 0 &&
                        typeof parsedObject.candidates[0].content.parts[0].text === 'string'
                    ) {
                        return parsedObject.candidates[0].content.parts[0].text;
                    }
                } catch (error) {
                    console.error('[REFINE SERVER] Error extracting text from server object:', error, parsedObject);
                }
                return null;
            }

            function processBuffer() {
                let i = 0;
                while (i < buffer.length) {
                    const char = buffer[i];
                    if (objectStartIndex === -1) { // Not currently inside an object
                        if (char === '{') {
                            objectStartIndex = i;
                            braceDepth = 1;
                            inString = false;
                        }
                    } else { // Currently inside a potential object
                        if (char === '"') {
                            // Basic string detection
                            if (i > 0 && buffer[i-1] !== '\\') {
                                inString = !inString;
                            } else if (i === objectStartIndex) { // char after '{' is '"'
                                inString = !inString;
                            }
                        }

                        if (!inString) {
                            if (char === '{') {
                                braceDepth++;
                            } else if (char === '}') {
                                braceDepth--;
                                if (braceDepth === 0) {
                                    const jsonObjectStr = buffer.substring(objectStartIndex, i + 1);
                                    try {
                                        const parsedObject = JSON.parse(jsonObjectStr); // Parse the complete object
                                        const textChunk = extractTextFromServerObject(parsedObject);
                                        if (textChunk) {
                                            controller.enqueue(encoder.encode(`data: ${textChunk}\n\n`));
                                            // console.log('[REFINE SERVER] Enqueued text chunk:', textChunk.substring(0, 50) + "..."); // Log part of the enqueued text
                                        } else {
                                            // Optional: log if a valid JSON object was received but no text extracted
                                            console.warn('[REFINE SERVER] processBuffer: No text extracted from valid JSON:', jsonObjectStr);
                                        }
                                    } catch (e) {
                                        // This catch handles errors from JSON.parse(jsonObjectStr)
                                        const error = e as Error;
                                        console.warn('[REFINE SERVER] processBuffer: Discarding invalid JSON segment due to parse error. Segment:', jsonObjectStr, 'Error:', error.message);
                                    }
                                    buffer = buffer.substring(i + 1);
                                    objectStartIndex = -1;
                                    i = -1; // Restart scan
                                }
                            }
                        }
                    }
                    i++;
                }
                if (objectStartIndex !== -1) { // Keep partial object in buffer
                    buffer = buffer.substring(objectStartIndex);
                    objectStartIndex = 0; // Relative to new buffer start
                } else {
                     // If no object started, and buffer might contain junk like ']', ',', clear it.
                    if (!buffer.includes("{")) buffer = "";
                }
            }

            async function pump() {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            break;
                        }
                            const decodedChunk = decoder.decode(value, { stream: true });
                            // console.log('[REFINE SERVER] pump: Received chunk from proxy, length:', decodedChunk.length, 'Content:', decodedChunk.substring(0,100));
                        buffer += decoder.decode(value, { stream: true });
                        processBuffer();
                    }
                    // After the loop, stream is done
                    buffer += decoder.decode(undefined, { stream: true }); // final flush for TextDecoder
                        // console.log('[REFINE SERVER] pump: Final buffer processing before close. Buffer:', buffer.substring(0,100));
                    processBuffer(); // process any remaining buffered content
                        console.log('[REFINE SERVER] pump: Closing controller after stream ended.');
                    controller.close(); // Refine stream simply closes when done
                } catch (e) {
                        console.error('[REFINE SERVER] Error in refine backend pump:', e);
                    controller.error(e);
                }
            }
            pump();
        }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Refinement Backend Error:', error);
    return new Response(
      JSON.stringify({ error: 'Refinement failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};