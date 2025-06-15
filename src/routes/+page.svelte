<!-- +page.svelte – Vanguard Canvas  v2  |  Tailwind Elite Build  -->
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
<div class="relative grid h-screen overflow-hidden grid-cols-[72px_1fr] grid-rows-[56px_1fr_auto] text-slate-100 font-inter bg-gradient-to-b from-[#0c0e12] to-[#050507]" style="--h:{$emotion.h};--s:{$emotion.s}%;--l:{$emotion.l}%;">
  <!-- Ambient Glow -->
  <div class="pointer-events-none absolute inset-0 mix-blend-screen" style="background:radial-gradient(circle_at_50%_15%,hsl(var(--h)_var(--s)_30%_/.35),transparent_70%)"></div>

  <!-- Side drawer -->
  <aside class="row-span-3 bg-[#111318]/80 backdrop-blur-md border-r border-white/5 flex flex-col items-center gap-4 pt-4">
    <button class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 font-bold">V</button>

    <nav class="flex flex-col gap-2 mt-4 text-xs">
      {#each tools as t}
        <button class="group relative flex flex-col items-center gap-1 w-14 h-14 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition" on:click={() => drawerOpen = false} aria-label={t.label}>
          <i data-lucide={t.icon} class="w-5 h-5 text-{t.color}-400 group-hover:scale-110 transition"></i>
          <span class="uppercase tracking-wider text-[10px] text-slate-400">{t.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Personas -->
    <div class="mt-auto mb-4 flex flex-col gap-2">
      {#each personas as p}
        <button class="w-9 h-9 rounded-full text-lg flex items-center justify-center border-2 border-transparent hover:scale-110 transition {activePersona===p.id?'ring-2 ring-[hsl('+p.hue+'_90%_60%)]':''}" on:click={() => switchPersona(p)}>{p.emoji}</button>
      {/each}
    </div>
  </aside>

  <!-- Top Nav -->
  <header class="col-start-2 bg-white/5 backdrop-blur-sm flex items-center gap-4 px-6 border-b border-white/5">
    {#each ['focus','dashboard','flow'] as m}
      <button class="px-3 py-2 rounded-md text-sm font-medium transition {mode===m?'bg-white/10 text-white':'text-slate-400 hover:text-white'}" on:click={()=>mode=m}>{m}</button>
    {/each}
  </header>

  <!-- Canvas -->
  <main class="col-start-2 overflow-y-auto px-6 py-8" on:wheel={(e)=>{if(e.ctrlKey){e.preventDefault();const next=$canvas.scale*(1-e.deltaY*0.001);canvas.update(c=>({...c,scale:Math.min(2,Math.max(0.5,next))}));}}} style="transform:translate({$canvas.x}px,{$canvas.y}px) scale({$canvas.scale})">
    {#each msgs as m (m.id)}
      <article class="max-w-xl mb-6 flex gap-3 animate-[fadeIn_.25s_ease-out]">
        <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg">{m.role==='assistant'?personas.find(pp=>pp.id===m.persona)?.emoji:'🙋'}</div>
        <div class="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm leading-relaxed">
          {#if m.streaming}{m.content}<span class="animate-pulse">▊</span>{:else}{m.content}{/if}
        </div>
      </article>
    {/each}
    <div id="bottom"></div>
  </main>

  <!-- Input Bar -->
  <footer class="col-start-2 flex items-end gap-3 bg-white/5 backdrop-blur-sm p-4 border-t border-white/5">
    <textarea bind:value={draft} rows="1" placeholder="Begin with intent…" class="flex-1 resize-none bg-transparent outline-none text-slate-200 placeholder:text-slate-500 scrollbar-hide" on:keydown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}></textarea>
    <button class="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--h)_90%_45%)] to-[hsl(calc(var(--h)+40)_90%_45%)] disabled:opacity-40 grid place-content-center" on:click={send} disabled={!draft.trim()} aria-label="Send">
      <i data-lucide="send" class="w-5 h-5"></i>
    </button>
  </footer>
</div>

<style global>
  @import "https://unpkg.com/lucide-static@0.252.0/font/Lucide.css";
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  .scrollbar-hide::-webkit-scrollbar{display:none}
  .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
</style>