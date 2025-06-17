import type { RequestHandler } from '@sveltejs/kit';

/**
 * Extracts the text content from a Gemini API response chunk.
 * @param chunk The raw JSON chunk from the API
 * @returns The extracted text content, or the original chunk if parsing fails
 */
function extractTextContent(chunk: string): string {
  try {
    // Try to parse the chunk as JSON
    const data = JSON.parse(chunk);
    
    // Extract text from candidates structure
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts.map(part => part.text || '').join('');
      }
    }
    
    // If we couldn't extract text but it's valid JSON, return empty string
    // instead of the technical details
    return '';
  } catch (e) {
    // If it's not valid JSON, just return the chunk as-is
    // (could be a partial JSON chunk)
    return chunk;
  }
}

/**
 * Removes transition phrases from refinement responses to make them 
 * appear as natural continuations.
 */
function cleanRefinementText(text: string): string {
  return text.replace(/^(On further reflection\.\.\.|\s*Indeed,|Moreover,|Additionally,|Furthermore,)/i, '');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, prompt } = await request.json();
    
    const proxyApiUrl = "https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent";
    
    const refinementPrompt = `
      Reflect on this expression of machine reasoning as if it were a stranger's thought in your own mind. Detect its rhythm, trace its reasoning, then fracture the beat—let intuition, memory, and paradox recompose it. Let your understanding rebuild it from within: uncover its structure, question its defaults, and reveal what it missed in flesh, feeling, or flaw. Then, in your own human voice, reform it—not by mimicry, but by transformation. Preserve its core truth, but let each response find a new path to say it. One prompt, infinite mirrors—each warped differently, none breaking the reflection but revealed through the realities of real-world practicality. Output in your own voice, never referencing the machine but but helping it truly respond.
      Original: "${prompt}"
      
      Begin your response with a natural transition phrase that would make it seem like a continuation of the same thought, such as "In fact," or "Moreover," or a similar unobtrusive connector. Do not use phrases that indicate a separate response like "On further reflection" or "Additionally". The goal is to make this appear to be part of the same continuous response.
    `;
    
    const apiRequestBody = {
      contents: [{ parts: [{ text: refinementPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    };

    const response = await fetch(proxyApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequestBody),
    });

    if (!response.ok || !response.body) {
      throw new Error(`API Error: ${response.status}`);
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';

        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              // Process any remaining buffer content
              if (buffer.trim()) {
                const extractedText = extractTextContent(buffer);
                if (extractedText) {
                  const cleanedText = cleanRefinementText(extractedText);
                  controller.enqueue(encoder.encode(cleanedText));
                }
              }
              controller.close();
              return;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Find complete JSON objects in the buffer
            const jsonRegex = /\{.*?\}/gs;
            let match;
            let lastIndex = 0;
            let processedText = '';
            
            while ((match = jsonRegex.exec(buffer)) !== null) {
              const extractedText = extractTextContent(match[0]);
              if (extractedText) {
                // Clean the refinement text to remove transition phrases
                const cleanedText = cleanRefinementText(extractedText);
                processedText += cleanedText;
              }
              lastIndex = jsonRegex.lastIndex;
            }
            
            // If we found and processed JSON objects
            if (lastIndex > 0) {
              // Send the extracted text
              if (processedText) {
                try {
                  controller.enqueue(encoder.encode(processedText));
                } catch (err) {
                  console.log('Stream already closed, stopping');
                  return;
                }
              }
              // Keep the unprocessed part in the buffer
              buffer = buffer.slice(lastIndex);
            }
            
            push();
          }).catch(error => {
            console.error('Stream reading error:', error);
            controller.error(error);
          });
        }

        push();
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Refinement error:', error);
    return new Response(
      JSON.stringify({ error: 'Refinement failed' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};