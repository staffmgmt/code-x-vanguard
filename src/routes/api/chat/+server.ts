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
                        // Log if text extraction returns null
                        // console.warn('[CHAT SERVER] extractTextFromServerObject returned null for object:', JSON.stringify(parsedObject).substring(0, 200) + "...");

                    } catch (error) {
                        console.error('[CHAT SERVER] Error extracting text from server object:', error, parsedObject);
                    }
                    return null;
                }

                function processBuffer() {
                    let i = 0;
                    while (i < buffer.length) {
                        // Server-side detailed log for each character - UNCOMMENT FOR DEEP DEBUGGING
                        // console.log(`[CHAT SERVER] processBuffer char='${buffer[i]}', i=${i}, braceDepth=${braceDepth}, inString=${inString}, objectStartIndex=${objectStartIndex}, bufferLen=${buffer.length}, bufferSnip='${buffer.substring(0,50)}'`);

                        const char = buffer[i];

                        // Revised inString logic to correctly handle escaped quotes
                        if (char === '"') {
                            let isEscaped = false;
                            if (i > 0 && buffer[i - 1] === '\\') {
                                // Count preceding backslashes to handle cases like \\" (escaped backslash then quote)
                                let backslashCount = 0;
                                for (let k = i - 1; k >= 0; k--) {
                                    if (buffer[k] === '\\') {
                                        backslashCount++;
                                    } else {
                                        break;
                                    }
                                }
                                if (backslashCount % 2 === 1) { // Odd number of backslashes means the quote is escaped
                                    isEscaped = true;
                                }
                            }
                            if (!isEscaped) {
                                inString = !inString;
                            }
                        }

                        if (objectStartIndex === -1) { // Not currently inside an object
                            // Only start a new object if we are not currently inside a string
                            // and we encounter an opening brace.
                            if (!inString && char === '{') {
                                objectStartIndex = i;
                                braceDepth = 1;
                            }
                        } else { // Currently inside a potential object
                            // Only count braces if we are not inside a string.
                            if (!inString) { 
                                if (char === '{') {
                                    braceDepth++;
                                } else if (char === '}') {
                                    if (objectStartIndex === -1) { // Should not be decrementing if not tracking an object
                                        // console.warn(`[CHAT SERVER] processBuffer: Decrementing braceDepth for '}' but not tracking an object. Char: '${char}', i: ${i}, buffer: '${buffer.substring(0,50)}'`);
                                        // This might indicate an issue or just an extra '}' outside any object in the stream
                                        i++; continue; // Skip this char and continue
                                    }
                                    braceDepth--;
                                    if (braceDepth === 0) {
                                        const jsonObjectStr = buffer.substring(objectStartIndex, i + 1);
                                        try {
                                            const parsedObject = JSON.parse(jsonObjectStr); // Parse the complete object
                                            const textChunk = extractTextFromServerObject(parsedObject);
                                            if (textChunk) {
                                                controller.enqueue(encoder.encode(`data: ${textChunk}\n\n`));
                                                console.log('[CHAT SERVER] processBuffer: Enqueued text chunk - snippet:', textChunk.substring(0, 70));
                                            } else {
                                                // Optional: log if a valid JSON object was received but no text extracted
                                                console.warn('[CHAT SERVER] processBuffer: No text extracted from valid JSON - snippet:', jsonObjectStr.substring(0, 200));
                                            }
                                        } catch (e) {
                                            // This catch handles errors from JSON.parse(jsonObjectStr)
                                            const error = e as Error;
                                            console.warn('[CHAT SERVER] processBuffer: Discarding invalid JSON segment due to parse error. Segment snippet:', jsonObjectStr.substring(0,200), 'Error:', error.message);
                                        }
                                        buffer = buffer.substring(i + 1);
                                        objectStartIndex = -1;
                                        // Reset inString as we are now outside the processed object.
                                        // The next iteration will determine if we enter a new string.
                                        inString = false; 
                                        i = -1; // Restart scan from the beginning of the modified buffer
                                    }
                                } else if (braceDepth < 0) { 
                                    console.warn(`[CHAT SERVER] processBuffer: braceDepth became negative (${braceDepth}) at char '${char}', i=${i}. Resetting object search. Buffer: '${buffer.substring(0,50)}'`);
                                    objectStartIndex = -1; // Reset search, something is wrong
                                    braceDepth = 0; // Correct braceDepth
                                }
                            }
                        }
                        i++;
                    }
                    // If an object started but wasn't completed, keep the partial object in buffer
                    if (objectStartIndex !== -1) {
                        buffer = buffer.substring(objectStartIndex);
                        objectStartIndex = 0; // Relative to the new buffer start
                    } else {
                         // If no object started, and buffer might contain junk like ']', ',', clear it.
                        if (!buffer.includes("{")) buffer = "";
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
                            const decodedChunkForLog = decoder.decode(value, { stream: false }); // Decode fully for reliable logging
                            console.log('[CHAT SERVER] pump: Read chunk from proxy, length:', decodedChunkForLog.length, 'Content snippet:', decodedChunkForLog.substring(0,100));
                            buffer += decoder.decode(value, { stream: true });
                            processBuffer();
                        }
                        // After the loop, stream is done
                        buffer += decoder.decode(undefined, { stream: true }); // final flush for TextDecoder
                        console.log('[CHAT SERVER] pump: Final buffer processing before END_TOKEN. Buffer snippet:', buffer.substring(0,100));
                        processBuffer(); // process any remaining buffered content
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
        return new Response(JSON.stringify({ error: 'Chat API failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};