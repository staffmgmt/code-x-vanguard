import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, prompt } = await request.json();
    
    // Simulate refinement delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const proxyApiUrl = "https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent";
    
    const refinementPrompt = `
      Reflect on this expression of machine reasoning as if it were a stranger’s thought in your own mind. Detect its rhythm, trace its reasoning, then fracture the beat—let intuition, memory, and paradox recompose it. Let your understanding rebuild it from within: uncover its structure, question its defaults, and reveal what it missed in flesh, feeling, or flaw. Then, in your own human voice, reform it—not by mimicry, but by transformation. Preserve its core truth, but let each response find a new path to say it. One prompt, infinite mirrors—each warped differently, none breaking the reflection but revealed through the realities of real-world practicality. Output in your own voice, never referencing the machine but but helping it truly respond.
      Original: "${prompt}"
      
      Begin your response with a natural transition phrase like "On further reflection..." or "Additionally, it's worth noting..."  ensuring deep contextual relevance to how the original response ended for a seamless and organic continuation
    `;
    
    const apiRequestBody = {
      contents: [{ parts: [{ text: refinementPrompt }] }],
    };

    const response = await fetch(proxyApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequestBody),
    });

    if (!response.ok || !response.body) {
      throw new Error(`API Error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('Refinement error:', error);
    return new Response(
      JSON.stringify({ error: 'Refinement failed' }), 
      { status: 500 }
    );
  }
};