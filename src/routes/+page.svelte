<!-- +page.svelte – Vanguard Canvas v3.1 | Elite UX Build -->
<script lang="ts">
  /* IMMUTABLE PRINCIPLES applied inline (4‑pt grid, ≤400 ms motion, AA contrast) */
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

<!-- Root Grid | dynamic third‑col width via CSS var -->
<div class="relative grid h-screen font-inter text-slate-100"
     style="--hist:{historyOpen? '18rem':'0'}; grid-template-columns:72px 1fr var(--hist); grid-template-rows:56px 1fr auto; --h:{$emotion.h}; --s:{$emotion.s}%; --l:{$emotion.l}%;">
  <!-- Ambient glow -->
  <div class="pointer-events-none absolute inset-0 mix-blend-screen" style="background:radial-gradient(circle_at_50%_20%,hsl(var(--h)_var(--s)_30%/.4),transparent_70%)"></div>

  <!-- Rail -->
  <aside class="row-span-3 bg-slate-950/80 border-r border-white/5 backdrop-blur-md flex flex-col items-center gap-4 p-3">
    <button class="w-11 h-11 rounded-xl font-bold text-lg bg-gradient-to-br from-sky-500 to-violet-500">V</button>
    <nav class="flex flex-col mt-6 gap-2" aria-label="Main tools">
      {#each tools as t}
        <button class="group w-14 h-14 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-{t.color}-400 transition"
                aria-label={t.label}><i data-lucide={t.icon} class="w-5 h-5 mx-auto my-2 text-{t.color}-300 group-hover:scale-105 transition" aria-hidden="true"></i></button>
      {/each}
    </nav>
    <!-- Personas -->
    <div class="mt-auto flex flex-col gap-2">
      {#each personas as p}
        <button class="w-9 h-9 rounded-full flex items-center justify-center text-lg transition hover:scale-110 {activePersona===p.id?'ring-2 ring-[hsl('+p.hue+'_90%_60%)]':''}"
                on:click={()=>switchPersona(p)} aria-label={p.name}>{p.emoji}</button>
      {/each}
    </div>
  </aside>

  <!-- Top bar -->
  <header class="col-start-2 col-span-2 bg-white/5 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6">
    <div class="flex gap-2" role="tablist" aria-label="View switcher">
      {#each ['focus','dashboard','flow'] as v}
        <button class="px-3 py-1.5 rounded-md text-sm font-medium transition {view===v?'bg-white/10 text-white':'text-slate-400 hover:text-white'}" on:click={()=>view=v} role="tab" aria-selected={view===v}>{v}</button>
      {/each}
    </div>
    <button class="p-2 rounded md:hidden focus:outline-none focus-visible:ring-2" on:click={toggleHistory} aria-expanded={historyOpen} aria-controls="history"><i data-lucide="menu" class="w-5 h-5"></i></button>
  </header>

  <!-- Canvas -->
  <main class="col-start-2 overflow-y-auto px-6 py-6 md:py-8 space-y-6" style="transform:translate({$zoom.x}px,{$zoom.y}px) scale({$zoom.scale})"
        on:wheel={(e)=>{if(e.ctrlKey){e.preventDefault();const s=$zoom.scale*(1-e.deltaY*0.001);zoom.update(z=>({...z,scale:Math.min(2,Math.max(.5,s))}));}}}>
    {#each msgs as m (m.id)}
      <article class="flex gap-3 max-w-2xl animate-[fadeIn_.25s_ease-out]" style="animation-delay:{msgs.indexOf(m)*60}ms">
        <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">{m.role==='assistant'?personas.find(p=>p.id===m.persona)?.emoji:'🙋'}</div>
        <div class="flex-1 rounded-2xl border border-white/8 bg-white/5 backdrop-blur-sm px-4 py-3 leading-relaxed text-sm shadow-[0_4px_16px_-8px_rgba(0,0,0,0.6)]">
          {#if m.streaming}{m.content}<span class="animate-pulse">▊</span>{:else}{m.content}{/if}
        </div>
      </article>
    {/each}
    <div id="bottom"></div>
  </main>

  <!-- History Drawer -->
  <aside id="history" class="row-span-2 overflow-y-auto bg-slate-950/90 border-l border-white/5 backdrop-blur-md transition-opacity duration-300 {historyOpen?'opacity-100':'opacity-0 pointer-events-none'}">
    <header class="flex items-center justify-between px-4 py-3 border-b border-white/5"><h2 class="text-sm font-semibold">History</h2></header>
    <ul class="divide-y divide-white/5">
      {#each msgs as m (m.id)}<!-- demo list by message -->
        <li><button class="w-full text-left px-4 py-3 hover:bg-white/5 text-ellipsis line-clamp-1">{m.content||'…'}</button></li>
      {/each}
    </ul>
  </aside>

  <!-- Input -->
  <footer class="col-start-2 col-span-2 flex items-end gap-3 bg-white/5 backdrop-blur-md border-t border-white/5 px-6 py-4">
    <textarea rows="1" bind:value={draft} placeholder="Begin with intent…" class="flex-1 resize-none bg-transparent outline-none text-slate-200 placeholder:text-slate-500 scrollbar-hide" on:keydown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}></textarea>
    <button class="
