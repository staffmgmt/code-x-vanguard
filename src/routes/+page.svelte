<!-- +page.svelte -- Vanguard Canvas v2 Elite | Premium Visual Layer -->
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { spring } from 'svelte/motion';
  import { fetchEventSource } from '@microsoft/fetch-event-source';

  // ---------- Types ----------
  type Format = 'Chat' | 'Table' | 'Graph' | 'Code' | 'Story';
  interface Msg {
    id: number; role: 'user' | 'assistant'; content: string;
    persona: string; format: Format; streaming: boolean; ts: Date;
  }
  interface Tool { id: string; label: string; icon: string; color: string; }
  interface Persona { id: string; name: string; emoji: string; hue: number; }

  // ---------- Config ----------
  const tools: Tool[] = [
    { id: 'code',    label: 'Code',    icon: 'lucide:code',        color: 'sky' },
    { id: 'data',    label: 'Data',    icon: 'lucide:bar-chart-3',  color: 'emerald' },
    { id: 'persona', label: 'Persona', icon: 'lucide:user-round',   color: 'violet' },
    { id: 'memory',  label: 'Memory',  icon: 'lucide:brain',        color: 'pink' },
    { id: 'settings',label: 'Settings',icon: 'lucide:settings-2',   color: 'slate' }
  ];

  const personas: Persona[] = [
    { id: 'sage', name: 'Sage', emoji: '🧘', hue: 210 },
    { id: 'gpt',  name: 'GPT',  emoji: '⚡', hue: 160 },
    { id: 'poet', name: 'Poet', emoji: '🎨', hue: 275 }
  ];

  // ---------- State ----------
  let drawerOpen = false;
  let activePersona = 'sage';
  let format: Format = 'Chat';
  let mode: 'focus' | 'dashboard' | 'flow' = 'focus';
  let msgs: Msg[] = [];
  let draft = '';

  // motion presets
  const emotion = spring({ h: 220, s: 35, l: 14, e: 0.5 }, { stiffness: 0.04, damping: 0.8 });
  const canvas = spring({ x: 0, y: 0, scale: 1 }, { stiffness: 0.06, damping: 0.8 });

  // ---------- Helpers ----------
  function push(m: Msg) {
    msgs = [...msgs, m];
    tick().then(() => document.getElementById('bottom')?.scrollIntoView({ behavior: 'smooth' }));
  }
  function switchPersona(p: Persona) {
    activePersona = p.id;
    emotion.update((v) => ({ ...v, h: p.hue }));
  }

  // ---------- Send ----------
  async function send() {
    if (!draft.trim()) return;
    const uid = Date.now();
    push({ id: uid, role: 'user', content: draft, persona: 'user', format, streaming: false, ts: new Date() });
    const ghost = uid + 1;
    push({ id: ghost, role: 'assistant', content: '', persona: activePersona, format, streaming: true, ts: new Date() });
    const prompt = draft;
    draft = '';

    try {
      await fetchEventSource('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, persona: activePersona, format }),
        onmessage(ev) {
          if (!ev.data) return;
          try {
            const d = JSON.parse(ev.data);
            const delta = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (delta) {
              const i = msgs.findIndex((m) => m.id === ghost);
              if (i > -1) { msgs[i].content += delta; msgs = [...msgs]; }
            }
          } catch (_) { /* ignore */ }
        },
        onclose() {
          const i = msgs.findIndex((m) => m.id === ghost);
          if (i > -1) { msgs[i].streaming = false; msgs = [...msgs]; }
        },
        onerror(err) { throw err; }
      });
    } catch (err) {
      const i = msgs.findIndex((m) => m.id === ghost);
      if (i > -1) { msgs[i].streaming = false; msgs[i].content = '⚠️ ' + (err as Error).message; msgs = [...msgs]; }
    }
  }
</script>

<!-- Root Grid -->
<div class="vanguard-root" style="--h:{$emotion.h};--s:{$emotion.s}%;--l:{$emotion.l}%;">
  <!-- Ambient Layers -->
  <div class="ambient-glow"></div>
  <div class="noise-layer"></div>

  <!-- Side Rail -->
  <aside class="side-rail">
    <!-- Logo -->
    <button class="logo-mark">
      <span class="logo-glyph">V</span>
    </button>

    <!-- Tool Navigation -->
    <nav class="tool-nav">
      {#each tools as t}
        <button 
          class="tool-btn group" 
          on:click={() => drawerOpen = false} 
          aria-label={t.label}
          data-color={t.color}
        >
          <div class="tool-icon-wrap">
            <i data-lucide={t.icon} class="tool-icon"></i>
          </div>
          <span class="tool-label">{t.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Persona Switcher -->
    <div class="persona-stack">
      {#each personas as p}
        <button 
          class="persona-btn {activePersona===p.id?'active':''}" 
          on:click={() => switchPersona(p)}
          style="--hue:{p.hue}"
          aria-label="Switch to {p.name}"
        >
          <span class="persona-emoji">{p.emoji}</span>
          <div class="persona-ring"></div>
        </button>
      {/each}
    </div>
  </aside>

  <!-- Top Bar -->
  <header class="top-bar">
    <div class="mode-switcher">
      {#each ['focus','dashboard','flow'] as m}
        <button 
          class="mode-btn {mode===m?'active':''}" 
          on:click={()=>mode=m}
        >
          {m}
        </button>
      {/each}
    </div>
  </header>

  <!-- Canvas -->
  <main 
    class="chat-canvas" 
    on:wheel={(e)=>{if(e.ctrlKey){e.preventDefault();const next=$canvas.scale*(1-e.deltaY*0.001);canvas.update(c=>({...c,scale:Math.min(2,Math.max(0.5,next))}));}}} 
    style="transform:translate({$canvas.x}px,{$canvas.y}px) scale({$canvas.scale})"
  >
    <div class="messages-flow">
      {#each msgs as m (m.id)}
        <article class="message-card {m.role}">
          <div class="message-avatar">
            {m.role==='assistant'?personas.find(pp=>pp.id===m.persona)?.emoji:'👤'}
          </div>
          <div class="message-bubble">
            <div class="message-content">
              {#if m.streaming}
                {m.content}<span class="streaming-cursor">▊</span>
              {:else}
                {m.content}
              {/if}
            </div>
          </div>
        </article>
      {/each}
      <div id="bottom"></div>
    </div>
  </main>

  <!-- Input Zone -->
  <footer class="input-zone">
    <div class="input-container">
      <textarea 
        bind:value={draft} 
        rows="1" 
        placeholder="Begin with intent…" 
        class="message-input"
        on:keydown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
      ></textarea>
      <button 
        class="send-btn {!draft.trim()?'disabled':''}" 
        on:click={send} 
        disabled={!draft.trim()} 
        aria-label="Send message"
      >
        <i data-lucide="send" class="send-icon"></i>
        <div class="send-pulse"></div>
      </button>
    </div>
  </footer>
</div>

<style>
  @import "https://unpkg.com/lucide-static@0.252.0/font/Lucide.css";
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  /* Design System */
  :root {
    /* Premium Colors */
    --bg-primary: #0A0B0E;
    --bg-secondary: #0F1114;
    --bg-tertiary: #141619;
    
    --surface-glass: rgba(255, 255, 255, 0.03);
    --surface-hover: rgba(255, 255, 255, 0.06);
    --surface-active: rgba(255, 255, 255, 0.09);
    
    --border-subtle: rgba(255, 255, 255, 0.06);
    --border-default: rgba(255, 255, 255, 0.08);
    --border-strong: rgba(255, 255, 255, 0.12);
    
    --text-primary: #F8F9FA;
    --text-secondary: #B8BCC4;
    --text-tertiary: #6B7280;
    
    /* Golden Ratio Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.618rem;
    --space-xl: 2.618rem;
    --space-2xl: 4.236rem;
    
    /* Typography Scale (1.250) */
    --text-xs: 0.64rem;
    --text-sm: 0.8rem;
    --text-base: 1rem;
    --text-lg: 1.25rem;
    --text-xl: 1.563rem;
    
    /* Motion */
    --ease-premium: cubic-bezier(0.23, 1, 0.32, 1);
    --duration-fast: 200ms;
    --duration-base: 300ms;
    --duration-slow: 400ms;
  }

  /* Global Reset */
  * {
    box-sizing: border-box;
  }

  /* Root Container */
  .vanguard-root {
    position: relative;
    display: grid;
    height: 100vh;
    overflow: hidden;
    grid-template-columns: 76px 1fr;
    grid-template-rows: 64px 1fr auto;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: var(--text-base);
    color: var(--text-primary);
    background: var(--bg-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Ambient Effects */
  .ambient-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    mix-blend-mode: screen;
    opacity: 0.4;
    background: 
      radial-gradient(
        circle at 50% 10%, 
        hsl(var(--h) var(--s) 25% / .3) 0%, 
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 80%, 
        hsl(calc(var(--h) + 60) var(--s) 20% / .2) 0%, 
        transparent 50%
      );
  }

  .noise-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
  }

  /* Side Rail */
  .side-rail {
    grid-row: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-lg) 0;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-subtle);
    backdrop-filter: blur(10px);
  }

  /* Logo */
  .logo-mark {
    position: relative;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
    cursor: pointer;
    transition: all var(--duration-base) var(--ease-premium);
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .logo-mark:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.2) inset,
      0 8px 24px rgba(59, 130, 246, 0.25);
  }

  .logo-glyph {
    font-size: var(--text-xl);
    font-weight: 700;
    color: white;
    letter-spacing: -0.02em;
  }

  /* Tool Navigation */
  .tool-nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .tool-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    width: 60px;
    height: 60px;
    padding: var(--space-sm);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    background: var(--surface-glass);
    backdrop-filter: blur(8px);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-premium);
  }

  .tool-btn:hover {
    background: var(--surface-hover);
    border-color: var(--border-default);
    transform: translateY(-1px);
  }

  .tool-icon-wrap {
    position: relative;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
  }

  .tool-icon {
    width: 20px;
    height: 20px;
    transition: all var(--duration-fast) var(--ease-premium);
  }

  .tool-btn[data-color="sky"] .tool-icon { color: #38BDF8; }
  .tool-btn[data-color="emerald"] .tool-icon { color: #34D399; }
  .tool-btn[data-color="violet"] .tool-icon { color: #A78BFA; }
  .tool-btn[data-color="pink"] .tool-icon { color: #F472B6; }
  .tool-btn[data-color="slate"] .tool-icon { color: #94A3B8; }

  .tool-btn:hover .tool-icon {
    transform: scale(1.1);
  }

  .tool-label {
    font-size: var(--text-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    transition: color var(--duration-fast) var(--ease-premium);
  }

  .tool-btn:hover .tool-label {
    color: var(--text-secondary);
  }

  /* Persona Stack */
  .persona-stack {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .persona-btn {
    position: relative;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border: 2px solid transparent;
    border-radius: 50%;
    background: var(--surface-glass);
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-premium);
  }

  .persona-emoji {
    font-size: var(--text-lg);
    transition: transform var(--duration-fast) var(--ease-premium);
  }

  .persona-btn:hover .persona-emoji {
    transform: scale(1.15);
  }

  .persona-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 2px solid transparent;
    transition: all var(--duration-base) var(--ease-premium);
  }

  .persona-btn.active .persona-ring {
    border-color: hsl(var(--hue) 90% 60%);
    box-shadow: 0 0 16px hsl(var(--hue) 90% 60% / 0.4);
  }

  /* Top Bar */
  .top-bar {
    grid-column: 2;
    display: flex;
    align-items: center;
    padding: 0 var(--space-xl);
    background: var(--surface-glass);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .mode-switcher {
    display: flex;
    gap: var(--space-xs);
    padding: var(--space-xs);
    background: var(--bg-primary);
    border-radius: 10px;
  }

  .mode-btn {
    padding: var(--space-sm) var(--space-md);
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    font-weight: 500;
    text-transform: capitalize;
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-premium);
  }

  .mode-btn:hover {
    color: var(--text-secondary);
  }

  .mode-btn.active {
    background: var(--surface-active);
    color: var(--text-primary);
  }

  /* Chat Canvas */
  .chat-canvas {
    grid-column: 2;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: var(--border-subtle) transparent;
  }

  .chat-canvas::-webkit-scrollbar {
    width: 8px;
  }

  .chat-canvas::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-canvas::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 4px;
  }

  .chat-canvas::-webkit-scrollbar-thumb:hover {
    background: var(--border-default);
  }

  .messages-flow {
    max-width: 48rem;
    margin: 0 auto;
    padding: var(--space-xl) var(--space-lg);
  }

  /* Message Cards */
  .message-card {
    display: flex;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
    animation: messageSlide var(--duration-base) var(--ease-premium);
  }

  @keyframes messageSlide {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--surface-glass);
    border: 1px solid var(--border-subtle);
    font-size: var(--text-lg);
  }

  .message-card.assistant .message-avatar {
    background: linear-gradient(135deg, 
      hsl(var(--h) var(--s) 20% / 0.2), 
      hsl(calc(var(--h) + 30) var(--s) 25% / 0.2)
    );
    border-color: hsl(var(--h) var(--s) 30% / 0.3);
  }

  .message-bubble {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    border-radius: 16px;
    background: var(--surface-glass);
    border: 1px solid var(--border-subtle);
    backdrop-filter: blur(8px);
  }

  .message-card.user .message-bubble {
    background: var(--surface-hover);
  }

  .message-content {
    font-size: var(--text-sm);
    line-height: 1.7;
    color: var(--text-secondary);
  }

  .message-card.user .message-content {
    color: var(--text-primary);
  }

  .streaming-cursor {
    display: inline-block;
    animation: pulse 1s ease-in-out infinite;
    color: hsl(var(--h) var(--s) 60%);
    font-weight: 600;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  /* Input Zone */
  .input-zone {
    grid-column: 2;
    padding: var(--space-lg) var(--space-xl);
    background: var(--surface-glass);
    backdrop-filter: blur(10px);
    border-top: 1px solid var(--border-subtle);
  }

  .input-container {
    max-width: 48rem;
    margin: 0 auto;
    display: flex;
    gap: var(--space-md);
    align-items: flex-end;
  }

  .message-input {
    flex: 1;
    padding: var(--space-md) var(--space-lg);
    border: 1px solid var(--border-default);
    border-radius: 14px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--text-sm);
    line-height: 1.5;
    resize: none;
    outline: none;
    transition: all var(--duration-fast) var(--ease-premium);
  }

  .message-input::placeholder {
    color: var(--text-tertiary);
  }

  .message-input:focus {
    border-color: hsl(var(--h) var(--s) 40% / 0.5);
    box-shadow: 0 0 0 3px hsl(var(--h) var(--s) 40% / 0.1);
  }

  .send-btn {
    position: relative;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 14px;
    background: linear-gradient(135deg, 
      hsl(var(--h) 90% 45%), 
      hsl(calc(var(--h) + 40) 90% 45%)
    );
    cursor: pointer;
    transition: all var(--duration-fast) var(--ease-premium);
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 4px 12px hsl(var(--h) 90% 45% / 0.3);
  }

  .send-btn:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 0 0 1px rgba(255, 255, 255, 0.2) inset,
      0 8px 24px hsl(var(--h) 90% 45% / 0.4);
  }

  .send-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .send-icon {
    width: 20px;
    height: 20px;
    color: white;
  }

  .send-pulse {
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    background: inherit;
    opacity: 0;
    z-index: -1;
  }

  .send-btn:active:not(.disabled) .send-pulse {
    animation: sendPulse var(--duration-slow) var(--ease-premium);
  }

  @keyframes sendPulse {
    0% {
      opacity: 0.6;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.3);
    }
  }
</style>