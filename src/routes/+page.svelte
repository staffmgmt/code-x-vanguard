<!-- +page.svelte – Vanguard Canvas v3  |  Elite UX Build  -->
<script lang="ts">
  /* -------------------------------------------------------------
     IMMUTABLE PRINCIPLES  (applied in code comments)
     -------------------------------------------------------------
     – 4‑pt grid / modular‑scale (1.25)
     – ≤400 ms motion / purposeful asymmetry
     – AA contrast, keyboard nav, perf‑first
  */
  import { onMount, tick } from 'svelte';
  import { spring } from 'svelte/motion';
  import { fetchEventSource } from '@microsoft/fetch-event-source';

  /* ---------- Types & Config ---------- */
  type Format = 'Chat' | 'Table' | 'Graph' | 'Code' | 'Story';
  interface Msg { id:number; role:'user'|'assistant'; content:string; persona:string; format:Format; streaming:boolean; ts:Date; }
  interface Tool { id:string; label:string; icon:string; color:string; }
  interface Persona { id:string; name:string; emoji:string; hue:number; }

  const tools:Tool[]=[
    { id:'code',    label:'Code',    icon:'lucide:code',        color:'sky' },
    { id:'data',    label:'Data',    icon:'lucide:bar-chart-3', color:'emerald' },
    { id:'persona', label:'Persona', icon:'lucide:user-round',  color:'violet' },
    { id:'memory',  label:'Memory',  icon:'lucide:brain',       color:'pink' },
    { id:'settings',label:'Settings',icon:'lucide:settings',    color:'slate' }
  ];
  const personas:Persona[]=[
    { id:'sage', name:'Sage', emoji:'🧘', hue:210 },
    { id:'gpt',  name:'GPT',  emoji:'⚡', hue:160 },
    { id:'poet', name:'Poet', emoji:'🎨', hue:275 }
  ];

  /* ---------- State ---------- */
  let mode:'focus'|'dashboard'|'flow' ='focus';           // workspace modes
  let showHistory=false;                                  // collapsible history panel
  let activePersona='sage';
  let format:Format='Chat';
  let draft='';
  let msgs:Msg[]=[];
  const sessions:{id:number;title:string;msgs:Msg[]}[]=[]; // multi‑chat history

  /* ---------- Motion Springs ---------- */
  const emotion=spring({h:220,s:35,l:15,e:.45},{stiffness:.05,damping:.85});
  const canvas=spring({x:0,y:0,scale:1},{stiffness:.06,damping:.85});

  /* ---------- Helpers ---------- */
  function push(m:Msg){ msgs=[...msgs,m]; tick().then(()=>document.getElementById('bottom')?.scrollIntoView({behavior:'smooth'})); }
  function switchPersona(p:Persona){ activePersona=p.id; emotion.update(v=>({...v,h:p.hue})); }
  function toggleHistory(){ showHistory=!showHistory; }

  /* ---------- Send msg with streaming ---------- */
  async function send(){ if(!draft.trim()) return; const uid=Date.now();
    push({id:uid,role:'user',content:draft,persona:'user',format,streaming:false,ts:new Date()});
    const ghost=uid+1; push({id:ghost,role:'assistant',content:'',persona:activePersona,format,streaming:true,ts:new Date()});
    const prompt=draft; draft='';
    try{ await fetchEventSource('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,persona:activePersona,format}),
      onmessage(ev){ if(!ev.data) return; try{ const d=JSON.parse(ev.data); const delta=d.candidates?.[0]?.content?.parts?.[0]?.text||''; if(delta){ const i=msgs.findIndex(m=>m.id===ghost); if(i>-1){ msgs[i].content+=delta; msgs=[...msgs]; } } }catch{} },
      onclose(){ const i=msgs.findIndex(m=>m.id===ghost); if(i>-1){ msgs[i].streaming=false; msgs=[...msgs]; } }, onerror:e=>{throw e} }); }
    catch(err){ const i=msgs.findIndex(m=>m.id===ghost); if(i>-1){ msgs[i].streaming=false; msgs[i].content='⚠️ '+(err as Error).message; msgs=[...msgs]; } }
  }

  /* ---------- History save on mount ---------- */
  onMount(()=>{ sessions.push({id:1,title:'New Chat',msgs:[]}); });
</script>

<!-- Root Grid (4‑pt grid, CSS vars for colour‑mix) -->
<div class="relative grid h-screen font-inter text-slate-100 grid-cols-[72px_auto_0] md:grid-cols-[72px_1fr_0] grid-rows-[56px_1fr_auto]" style="--h:{$emotion.h};--s:{$emotion.s}%;--l:{$emotion.l}%;">
  <!-- Ambient radial glow -->
  <div class="pointer-events-none absolute inset-0 mix-blend-screen" style="background:radial-gradient(circle_at_50%_20%,hsl(var(--h)_var(--s)_30%/0.4),transparent_70%)"></div>

  <!-- Left Tool Rail ----------------------------------------------------- -->
  <aside class="row-span-3 bg-slate-950/80 backdrop-blur-md border-r border-white/5 flex flex-col items-center gap-4 p-3">
    <button class="w-11 h-11 rounded-xl font-bold text-lg bg-gradient-to-br from-sky-500 to-violet-500">V</button>
    <nav class="flex flex-col gap-2 mt-6" aria-label="Main tools">
      {#each tools as t}
        <button class="group relative w-14 h-14 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-{t.color}-400">
          <i data-lucide={t.icon} class="w-5 h-5 text-{t.color}-300 mx-auto my-2 group-hover:scale-105 transition" aria-hidden="true"></i>
          <span class="sr-only">{t.label}</span>
        </button>
      {/each}
    </nav>
    <!-- Personas -->
    <div class="mt-auto flex flex-col gap-2">
      {#each personas as p}
        <button class="w-9 h-9 rounded-full flex items-center justify-center text-lg transition transform hover:scale-110 {activePersona===p.id?'ring-2 ring-[hsl('+p.hue+'_90%_60%)]':''}" on:click={()=>switchPersona(p)}>{p.emoji}<span class="sr-only">{p.name}</span></button>
      {/each}
    </div>
  </aside>

  <!-- Top‑Bar ------------------------------------------------------------ -->
  <header class="col-start-2 col-span-2 bg-white/5 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6">
    <div class="flex gap-2" role="tablist" aria-label="Workspace mode">
      {#each ['focus','dashboard','flow'] as m}
        <button class="px-3 py-1.5 rounded-md text-sm font-medium transition {mode===m?'bg-white/10 text-white':'text-slate-400 hover:text-white'}" on:click={()=>mode=m} role="tab" aria-selected={mode===m}>{m}</button>
      {/each}
    </div>
    <button class="md:hidden p-2 rounded focus:outline-none focus-visible:ring-2" on:click={toggleHistory}><i data-lucide="history" class="w-5 h-5"></i><span class="sr-only">Toggle history</span></button>
  </header>

  <!-- Chat Canvas -------------------------------------------------------- -->
  <main class="col-start-2 overflow-y-auto px-6 py-6 md:py-8 space-y-6" style="transform:translate({$canvas.x}px,{$canvas.y}px) scale({$canvas.scale})" on:wheel={(e)=>{if(e.ctrlKey){e.preventDefault();const s=$canvas.scale*(1-e.deltaY*0.001);canvas.update(c=>({...c,scale:Math.min(2,Math.max(.5,s))}));}}}>
    {#each msgs as m (m.id)}
      <article class="flex gap-3 max-w-2xl animate-[fadeIn_.3s_ease-out]" style="animation-delay:{(msgs.indexOf(m))*60}ms">
        <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">{m.role==='assistant'?personas.find(pp=>pp.id===m.persona)?.emoji:'🙋'}</div>
        <div class="flex-1 rounded-2xl border border-white/8 bg-white/5 backdrop-blur-sm px-4 py-3 leading-relaxed text-sm shadow-[0_4px_16px_-8px_rgba(0,0,0,0.6)]">
          {#if m.streaming}{m.content}<span class="animate-ping opacity-70">▊</span>{:else}{m.content}{/if}
        </div>
      </article>
    {/each}
    <div id="bottom"></div>
  </main>

  <!-- History Drawer (right) -------------------------------------------- -->
  <aside class="col-start-3 row-span-2 bg-slate-950/90 backdrop-blur-md border-l border-white/5 w-72 shrink-0 transition-transform duration-300 ease-out md:translate-x-0 {showHistory?'translate-x-0':'translate-x-full'}">
    <header class="flex items-center justify-between px-4 py-3 border-b border-white/5">
      <h2 class="text-sm font-semibold">History</h2>
      <button class="p-1 rounded hover:bg-white/10 md:hidden" on:click={toggleHistory}><i data-lucide="x" class="w-4 h-4"></i><span class="sr-only">Close</span></button>
    </header>
    <ul class="divide-y divide-white/5 overflow-y-auto max-h-[calc(100vh-56px)]">
      {#each sessions as s}
        <li><button class="w-full text-left px-4 py-3 hover:bg-white/5 focus:outline-none focus-visible:ring-2">{s.title}</button></li>
      {/each}
    </ul>
  </aside>

  <!-- Input Zone ---------------------------------------------------------- -->
  <footer class="col-start-2 col-span-2 flex items-end gap-3 bg-white/[0.04] backdrop-blur-md border-t border-white/5 px-6 py-4">
    <textarea rows="1" bind:value={draft} placeholder="Begin with intent…" class="flex-1 resize-none bg-transparent outline-none text-slate-200 placeholder:text-slate-500 scrollbar-hide focus:ring-0" on:keydown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}></textarea>
    <button class="w-12 h-12 rounded-xl grid place-content-center disabled:opacity-40 bg-gradient-to-br from-[color-mix(in_srgb,salmon_60%,hsl(var(--h)_90%_50%))] to-[hsl(var(--h)_90%_45%)] transition-transform hover:-translate-y-0.5" on:click={send} disabled={!draft.trim()} aria-label="Send"><i data-lucide="send" class="w-5 h-5"></i></button>
  </footer>
</div>

<style global>
  @import "https://unpkg.com/lucide-static@0.252.0/font/Lucide.css";
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");
  html{scrollbar-gutter:stable;background:#050507;color-scheme:dark}
  *,*:before,*:after{box-sizing:border-box}
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .scrollbar-hide::-webkit-scrollbar{display:none}
  .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
</style>
