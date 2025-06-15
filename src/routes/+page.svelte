<!-- +page.svelte -- Vanguard Canvas v3.2 | Da Vinci Visual Excellence -->
<script lang="ts">
  /* IMMUTABLE PRINCIPLES applied inline (4‑pt grid, ≤400 ms motion, AA contrast) */
  import { tick } from 'svelte';
  import { spring } from 'svelte/motion';
  import { fetchEventSource } from '@microsoft/fetch-event-source';

  /* ---------- Types & Config ---------- */
  type Format = 'Chat' | 'Table' | 'Graph' | 'Code' | 'Story';
  type View   = 'focus' | 'dashboard' | 'flow';
  interface Msg { id:number; role:'user'|'assistant'; content:string; persona:string; format:Format; streaming:boolean; ts:Date; }
  interface Tool { id:string; label:string; icon:string; color:string; }
  interface Persona { id:string; name:string; emoji:string; hue:number; }

  const tools:Tool[]=[
    { id:'code',    label:'Code',    icon:'lucide:code-2',      color:'sky'      },
    { id:'data',    label:'Data',    icon:'lucide:bar-chart-3', color:'emerald'  },
    { id:'persona', label:'Persona', icon:'lucide:user-round', color:'violet'   },
    { id:'memory',  label:'Memory',  icon:'lucide:brain',      color:'pink'     },
    { id:'settings',label:'Settings',icon:'lucide:settings',   color:'slate'    }
  ];
  const personas:Persona[]=[
    { id:'sage', name:'Sage', emoji:'🧘', hue:210 },
    { id:'gpt',  name:'GPT',  emoji:'⚡', hue:160 },
    { id:'poet', name:'Poet', emoji:'🎨', hue:275 }
  ];

  /* ---------- Reactive State ---------- */
  let view:View = 'focus';
  let draft = '';
  let msgs:Msg[] = [];
  let historyOpen = false;         // collapsible panel
  let activePersona = 'sage';
  let format:Format = 'Chat';

  /* ---------- Springs ---------- */
  const emotion = spring({ h:220, s:40, l:14, e:.45 }, { stiffness:.05, damping:.85 });
  const zoom    = spring({ x:0, y:0, scale:1 },        { stiffness:.06, damping:.85 });

  /* ---------- Helpers ---------- */
  function push(m:Msg){ msgs = [...msgs, m]; tick().then(()=>document.getElementById('bottom')?.scrollIntoView({behavior:'smooth'})); }
  function switchPersona(p:Persona){ activePersona = p.id; emotion.update(v=>({...v, h:p.hue })); }
  const toggleHistory = () => historyOpen = !historyOpen;

  /* ---------- Send with streaming ---------- */
  async function send(){
    if(!draft.trim()) return;
    const uid = Date.now();
    push({ id:uid, role:'user', content:draft, persona:'user', format, streaming:false, ts:new Date() });
    const ghost = uid+1;
    push({ id:ghost, role:'assistant', content:'', persona:activePersona, format, streaming:true, ts:new Date() });
    const prompt = draft; draft = '';
    try {
      await fetchEventSource('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt, persona:activePersona, format }),
        onmessage(ev){ if(!ev.data) return; try{ const d = JSON.parse(ev.data); const delta = d.candidates?.[0]?.content?.parts?.[0]?.text||''; if(delta){ const i = msgs.findIndex(m=>m.id===ghost); if(i>-1){ msgs[i].content += delta; msgs = [...msgs]; } } }catch{} },
        onclose(){ const i = msgs.findIndex(m=>m.id===ghost); if(i>-1){ msgs[i].streaming = false; msgs = [...msgs]; } },
        onerror(e){ throw e; }
      });
    } catch(err){ const i = msgs.findIndex(m=>m.id===ghost); if(i>-1){ msgs[i].streaming = false; msgs[i].content = '⚠️ '+(err as Error).message; msgs = [...msgs]; } }
  }
</script>

<style>
  /* Design Tokens - Embedded for single file delivery */
  :root {
    /* Typography Scale (1.250 modular) */
    --text-xs: 0.64rem;    /* 10.24px */
    --text-sm: 0.8rem;     /* 12.8px */
    --text-base: 1rem;     /* 16px */
    --text-lg: 1.25rem;    /* 20px */
    --text-xl: 1.563rem;   /* 25px */
    --text-2xl: 1.953rem;  /* 31.25px */
    
    /* Spacing (Golden Ratio) */
    --space-xs: 0.382rem;  /* 6.11px */
    --space-sm: 0.618rem;  /* 9.89px */
    --space-md: 1rem;      /* 16px */
    --space-lg: 1.618rem;  /* 25.89px */
    --space-xl: 2.618rem;  /* 41.89px */
    --space-2xl: 4.236rem; /* 67.78px */
    
    /* Motion */
    --ease-refined: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --duration-swift: 200ms;
    --duration-smooth: 350ms;
  }

  /* Elite Glass Morphism */
  .glass-prime {
    background: color-mix(in oklch, transparent 40%, oklch(from hsl(var(--h) var(--s) var(--l)) l c h / 0.08));
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid color-mix(in oklch, white 8%, transparent);
    box-shadow: 
      0 1px 2px 0 rgb(0 0 0 / 0.05),
      0 8px 32px -4px rgb(0 0 0 / 0.1),
      inset 0 1px 0 0 rgb(255 255 255 / 0.05);
  }

  .glass-secondary {
    background: color-mix(in oklch, transparent 60%, oklch(from hsl(var(--h) var(--s) var(--l)) l c h / 0.04));
    backdrop-filter: blur(12px);
    border: 1px solid color-mix(in oklch, white 5%, transparent);
  }

  /* Premium Button States */
  .btn-premium {
    position: relative;
    overflow: hidden;
    transition: all var(--duration-swift) var(--ease-refined);
  }
  
  .btn-premium::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgb(255 255 255 / 0.1) 50%, transparent 60%);
    transform: translateX(-100%);
    transition: transform var(--duration-smooth) var(--ease-refined);
  }
  
  .btn-premium:hover::before {
    transform: translateX(100%);
  }

  /* Refined Typography */
  .text-refined {
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Emotional Glow */
  @keyframes emotionalPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.05); }
  }
</style>

<!-- Root Grid | Dynamic Layout with Golden Ratio -->
<div class="relative grid h-screen text-refined"
     style="--hist:{historyOpen? '20rem':'0'}; grid-template-columns:4.5rem 1fr var(--hist); grid-template-rows:3.5rem 1fr auto; --h:{$emotion.h}; --s:{$emotion.s}%; --l:{$emotion.l}%; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;">
  
  <!-- Ambient Emotional Glow -->
  <div class="pointer-events-none absolute inset-0 mix-blend-screen opacity-60" 
       style="background: radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklch, hsl(var(--h) var(--s) 35%) 40%, transparent), transparent 70%);
              animation: emotionalPulse 8s ease-in-out infinite;"></div>
  
  <!-- Secondary Glow Layer -->
  <div class="pointer-events-none absolute inset-0 mix-blend-color-dodge opacity-30"
       style="background: conic-gradient(from 180deg at 50% 50%, transparent, hsl(var(--h) var(--s) 40% / 0.2), transparent);"></div>

  <!-- Rail | Vertical Tool Strip -->
  <aside class="row-span-3 glass-secondary relative z-10 flex flex-col items-center gap-var(--space-sm) p-var(--space-sm)">
    <!-- Brand Mark -->
    <button class="w-11 h-11 rounded-xl font-bold text-var(--text-lg) bg-gradient-to-br from-sky-500 to-violet-600 
                   shadow-[0_0_24px_-8px_rgba(56,189,248,0.5)] hover:shadow-[0_0_32px_-8px_rgba(56,189,248,0.7)]
                   transform hover:scale-105 transition-all duration-var(--duration-swift) btn-premium">V</button>
    
    <!-- Tool Navigation -->
    <nav class="flex flex-col mt-var(--space-lg) gap-var(--space-xs)" aria-label="Main tools">
      {#each tools as t, i}
        <button class="group relative w-14 h-14 rounded-xl glass-prime btn-premium
                       hover:border-{t.color}-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-{t.color}-400/50
                       transform hover:scale-105 transition-all duration-var(--duration-swift)"
                style="animation: slideInLeft var(--duration-smooth) var(--ease-elastic) {i * 50}ms backwards"
                aria-label={t.label}>
          <i data-lucide={t.icon} class="w-5 h-5 mx-auto text-{t.color}-300 group-hover:text-{t.color}-200 
                                         transition-all duration-var(--duration-swift)" aria-hidden="true"></i>
          <!-- Hover Glow -->
          <div class="absolute inset-0 rounded-xl bg-{t.color}-400/10 opacity-0 group-hover:opacity-100 
                      blur-xl transition-opacity duration-var(--duration-smooth)"></div>
        </button>
      {/each}
    </nav>
    
    <!-- Persona Switcher -->
    <div class="mt-auto flex flex-col gap-var(--space-xs)">
      {#each personas as p, i}
        <button class="relative w-10 h-10 rounded-full flex items-center justify-center text-var(--text-lg) 
                       transform hover:scale-110 transition-all duration-var(--duration-swift)
                       {activePersona===p.id ? 'ring-2 ring-offset-2 ring-offset-slate-950' : ''}"
                style="--ring-color: hsl({p.hue} 90% 60%); ring-color: var(--ring-color);
                       animation: fadeIn var(--duration-smooth) var(--ease-refined) {600 + i * 100}ms backwards"
                on:click={()=>switchPersona(p)} aria-label={p.name}>
          <span class="relative z-10">{p.emoji}</span>
          {#if activePersona === p.id}
            <div class="absolute inset-0 rounded-full bg-gradient-to-br opacity-20"
                 style="background: conic-gradient(from 0deg, hsl({p.hue} 90% 60%), hsl({p.hue + 30} 90% 60%), hsl({p.hue} 90% 60%));
                        animation: spin 3s linear infinite;"></div>
          {/if}
        </button>
      {/each}
    </div>
  </aside>

  <!-- Top Bar | View Controls -->
  <header class="col-start-2 col-span-2 glass-prime flex items-center justify-between px-var(--space-lg) relative z-10">
    <div class="flex gap-var(--space-xs)" role="tablist" aria-label="View switcher">
      {#each ['focus','dashboard','flow'] as v, i}
        <button class="px-var(--space-md) py-var(--space-sm) rounded-lg text-var(--text-sm) font-medium 
                       transition-all duration-var(--duration-swift) btn-premium
                       {view===v ? 'glass-prime text-white shadow-[0_0_16px_-4px_rgba(255,255,255,0.2)]' : 
                                  'text-slate-400 hover:text-white hover:bg-white/5'}"
                style="animation: slideDown var(--duration-smooth) var(--ease-elastic) {i * 80}ms backwards"
                on:click={()=>view=v} role="tab" aria-selected={view===v}>
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      {/each}
    </div>
    <button class="p-var(--space-sm) rounded-lg glass-prime md:hidden focus:outline-none focus-visible:ring-2 
                   transform hover:scale-105 transition-all duration-var(--duration-swift)"
            on:click={toggleHistory} aria-expanded={historyOpen} aria-controls="history">
      <i data-lucide="menu" class="w-5 h-5"></i>
    </button>
  </header>

  <!-- Canvas | Message Stream -->
  <main class="col-start-2 overflow-y-auto px-var(--space-lg) py-var(--space-xl) space-y-var(--space-lg) relative"
        style="transform: translate({$zoom.x}px,{$zoom.y}px) scale({$zoom.scale});
               transform-origin: center;
               transition: transform var(--duration-smooth) var(--ease-refined);"
        on:wheel={(e)=>{if(e.ctrlKey){e.preventDefault();const s=$zoom.scale*(1-e.deltaY*0.001);zoom.update(z=>({...z,scale:Math.min(2,Math.max(.5,s))}));}}}>
    {#each msgs as m, i (m.id)}
      <article class="flex gap-var(--space-md) max-w-3xl mx-auto group"
               style="animation: messageSlide var(--duration-smooth) var(--ease-elastic) {Math.min(i * 60, 300)}ms backwards">
        <!-- Avatar -->
        <div class="w-10 h-10 rounded-xl glass-prime flex items-center justify-center flex-shrink-0
                    transform group-hover:scale-110 transition-all duration-var(--duration-swift)
                    {m.role === 'assistant' ? 'shadow-[0_0_20px_-8px_hsl(var(--h)_var(--s)_50%)]' : ''}">
          <span class="text-var(--text-lg)">{m.role==='assistant' ? personas.find(p=>p.id===m.persona)?.emoji : '🙋'}</span>
        </div>
        
        <!-- Message Content -->
        <div class="flex-1 rounded-2xl glass-prime px-var(--space-lg) py-var(--space-md) 
                    text-var(--text-sm) leading-relaxed text-slate-100
                    transform group-hover:translate-x-1 transition-all duration-var(--duration-swift)
                    {m.streaming ? 'shadow-[0_0_24px_-12px_hsl(var(--h)_var(--s)_50%)]' : ''}">
          {#if m.streaming}
            <span class="selection:bg-sky-500/20">{m.content}</span>
            <span class="inline-block w-2 h-4 ml-1 bg-current animate-pulse"></span>
          {:else}
            <span class="selection:bg-sky-500/20">{m.content}</span>
          {/if}
        </div>
      </article>
    {/each}
    <div id="bottom"></div>
  </main>

  <!-- History Drawer -->
  <aside id="history" class="row-span-2 overflow-y-auto glass-secondary relative z-10
                             transition-all duration-var(--duration-smooth) var(--ease-refined)
                             {historyOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}">
    <header class="flex items-center justify-between px-var(--space-lg) py-var(--space-md) 
                   border-b border-white/5 glass-prime sticky top-0 z-10">
      <h2 class="text-var(--text-sm) font-semibold text-white">History</h2>
    </header>
    <ul class="divide-y divide-white/5">
      {#each msgs as m, i (m.id)}
        <li style="animation: slideInRight var(--duration-swift) var(--ease-refined) {i * 30}ms backwards">
          <button class="w-full text-left px-var(--space-lg) py-var(--space-md) 
                         hover:bg-white/5 text-var(--text-sm) text-slate-300 hover:text-white
                         transition-all duration-var(--duration-swift) text-ellipsis line-clamp-1">
            {m.content || '…'}
          </button>
        </li>
      {/each}
    </ul>
  </aside>

  <!-- Input Bar -->
  <footer class="col-start-2 col-span-2 flex items-end gap-var(--space-md) glass-prime 
                 px-var(--space-lg) py-var(--space-md) relative z-10">
    <textarea rows="1" 
              bind:value={draft} 
              placeholder="Begin with intent…" 
              class="flex-1 resize-none bg-transparent outline-none text-var(--text-base) text-slate-100 
                     placeholder:text-slate-500 scrollbar-hide selection:bg-violet-500/20" 
              style="line-height: var(--space-lg);"
              on:keydown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}>
    </textarea>
    <button class="px-var(--space-lg) py-var(--space-sm) rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 
                   text-white font-medium text-var(--text-sm) btn-premium
                   shadow-[0_2px_20px_-8px_rgba(139,92,246,0.5)] hover:shadow-[0_2px_28px_-8px_rgba(139,92,246,0.7)]
                   transform hover:scale-105 active:scale-95 transition-all duration-var(--duration-swift)
                   disabled:opacity-50 disabled:cursor-not-allowed"
            on:click={send}
            disabled={!draft.trim()}>
      Send
    </button>
  </footer>
</div>

<!-- Animation Keyframes -->
<style>
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes messageSlide {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>