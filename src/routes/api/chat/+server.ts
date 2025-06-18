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
            const errorText = await geminiResponse.text().catch(() => "Could not read error body from proxy");
            console.error(`[CHAT SERVER] Proxy API Error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorText}`);
            throw new Error(`Proxy API Error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorText}`);
        }
        console.log('[CHAT SERVER] Successfully fetched from proxy for chat.');

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
                        // More robust extraction:
                        const candidate = parsedObject?.candidates?.[0] || parsedObject;
                        const text = candidate?.content?.parts?.[0]?.text;

                        if (typeof text === 'string') {
                            return text;
                        }
                        console.warn('[CHAT SERVER] extractTextFromServerObject: Text not found or not a string. Object snippet:', JSON.stringify(parsedObject).substring(0, 200));
                        return null;
                    } catch (error) {
                         const objectSnippet = typeof parsedObject === 'object' ? JSON.stringify(parsedObject).substring(0,200) : String(parsedObject).substring(0,200);
                        console.error('[CHAT SERVER] Error extracting text from server object:', error, 'Object snippet:', objectSnippet);
                    }
                    return null;
                }

                function processBuffer() {
                    let i = 0;
                    while (i < buffer.length) {
                        const char = buffer[i];
                        // Verbose per-character logging (jsonStructureType removed from log):
                        console.log(`[CHAT SERVER DEBUG] char='${char.replace(/\n/g, "\\n")}', i=${i}, braceDepth=${braceDepth}, inString=${inString}, objectStartIndex=${objectStartIndex}, buffer='${buffer.substring(0,50).replace(/\n/g, "\\n")}'`);

                        if (char === '"') {
                            let isEscaped = false;
                            if (i > 0 && buffer[i - 1] === '\\') {
                                let backslashCount = 0;
                                for (let k = i - 1; k >= 0; k--) {
                                    if (buffer[k] === '\\') {
                                        backslashCount++;
                                    } else {
                                        break;
                                    }
                                }
                                if (backslashCount % 2 === 1) {
                                    isEscaped = true;
                                }
                            }
                            if (!isEscaped) {
                                inString = !inString;
                                console.log(`[CHAT SERVER DEBUG] inString toggled to: ${inString} at char '${char}' (i=${i})`);
                            }
                        }

                        if (objectStartIndex === -1) { // Not currently inside an object
                            if (!inString && char === '{') { // Only look for '{' to start an object
                                objectStartIndex = i;
                                braceDepth = 1;
                                console.log(`[CHAT SERVER DEBUG] Object start detected. braceDepth: ${braceDepth}, objectStartIndex: ${objectStartIndex} at char '{' (i=${i})`);
                            }
                        } else { // Currently inside a potential object
                            if (!inString) { 
                                if (char === '{') {
                                    braceDepth++;
                                    console.log(`[CHAT SERVER DEBUG] braceDepth incremented to: ${braceDepth} at char '${char}' (i=${i})`);
                                } else if (char === '}') { 
                                    // Removed the 'if (objectStartIndex === -1)' check here.
                                    // If we are in this branch, an object is being tracked.
                                    braceDepth--;
                                    console.log(`[CHAT SERVER DEBUG] braceDepth decremented to: ${braceDepth} at char '${char}' (i=${i})`);
                                    if (braceDepth === 0) {
                                        // Found the end of an object {}
                                        const jsonObjectStr = buffer.substring(objectStartIndex, i + 1);
                                        console.log(`[CHAT SERVER] processBuffer: Complete JSON object found. Snippet:`, jsonObjectStr.substring(0, 200));
                                        try {
                                            const parsedObject = JSON.parse(jsonObjectStr);
                                            console.log('[CHAT SERVER] processBuffer: Successfully parsed JSON object. Snippet:', JSON.stringify(parsedObject).substring(0,200));
                                            const textChunk = extractTextFromServerObject(parsedObject);
                                            if (textChunk) {
                                                controller.enqueue(encoder.encode(`data: ${textChunk}\n\n`));
                                                console.log('[CHAT SERVER] processBuffer: Enqueued text chunk from object. Snippet:', textChunk.substring(0, 70));
                                            } else {
                                                 console.warn('[CHAT SERVER] processBuffer: extractTextFromServerObject returned null/empty for object. JSON snippet:', jsonObjectStr.substring(0, 200));
                                            }
                                        } catch (e) {
                                            const error = e as Error;
                                            console.warn('[CHAT SERVER] processBuffer: Discarding invalid JSON object due to parse error. Segment snippet:', jsonObjectStr.substring(0,200), 'Error:', error.message);
                                        }
                                        buffer = buffer.substring(i + 1);
                                        console.log(`[CHAT SERVER DEBUG] Buffer after processing object: '${buffer.substring(0,50).replace(/\n/g, "\\n")}'`);
                                        objectStartIndex = -1;
                                        inString = false; 
                                        console.log(`[CHAT SERVER DEBUG] State after object processing: objectStartIndex=${objectStartIndex}, inString=${inString}`);
                                        i = -1; 
                                    }
                                } else if (braceDepth < 0) { 
                                    console.warn(`[CHAT SERVER DEBUG] braceDepth became negative (${braceDepth}) at char '${char}', i=${i}. Resetting. Buffer: '${buffer.substring(0,50).replace(/\n/g, "\\n")}'`);
                                    objectStartIndex = -1; 
                                    braceDepth = 0; 
                                    inString = false; 
                                }
                            }
                        }
                        i++;
                    }
                    
                    if (objectStartIndex !== -1) {
                        buffer = buffer.substring(objectStartIndex);
                        objectStartIndex = 0; 
                        console.log(`[CHAT SERVER DEBUG] Kept partial object in buffer. New buffer: '${buffer.substring(0,50).replace(/\n/g, "\\n")}', objectStartIndex: ${objectStartIndex}`);
                    } else {
                        const trimmedBuffer = buffer.trim();
                        // Only look for '{' as we only care about objects now
                        if (!buffer.includes("{") && (trimmedBuffer.length === 0 || trimmedBuffer === ',' || trimmedBuffer === ']' || trimmedBuffer === ',]')) {
                            // console.log('[CHAT SERVER DEBUG] Clearing residual buffer content:', buffer.replace(/\n/g, "\\n"));
                            buffer = "";
                        }
                    }
                }

                async function pump() {
                    console.log('[CHAT SERVER] pump: Starting to read from proxy stream for chat.');
                    try {
                        let readAnyData = false;
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                console.log('[CHAT SERVER] pump: Proxy stream ended (done=true). Read any data:', readAnyData);
                                break;
                            }
                            readAnyData = true;
                            const decodedChunkForLog = decoder.decode(value, { stream: false }); 
                            console.log('[CHAT SERVER] pump: Read chunk from proxy, length:', decodedChunkForLog.length, 'Content snippet:', decodedChunkForLog.substring(0,100).replace(/\n/g, "\\n"));
                            buffer += decoder.decode(value, { stream: true });
                            console.log(`[CHAT SERVER DEBUG] Buffer after adding chunk: '${buffer.substring(0,100).replace(/\n/g, "\\n")}'`);
                            processBuffer();
                        }
                        
                        buffer += decoder.decode(undefined, { stream: true }); 
                        console.log('[CHAT SERVER DEBUG] Buffer after final decode flush:', buffer.substring(0,100).replace(/\n/g, "\\n"));
                        console.log('[CHAT SERVER] pump: Final buffer processing before END_TOKEN. Buffer snippet:', buffer.substring(0,100).replace(/\n/g, "\\n"));
                        processBuffer(); 
                        
                        console.log('[CHAT SERVER] pump: Enqueuing END_TOKEN.');
                        controller.enqueue(encoder.encode('data: <<STREAM_END>>\n\n'));
                        controller.close();
                    } catch (e) {
                        console.error('[CHAT SERVER] Error in chat backend pump:', e);
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
        console.error('Chat Backend Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chat API failed due to unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
