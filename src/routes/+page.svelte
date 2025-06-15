<script lang="ts">
  /* -----------------------------------------------------------
     Vanguard Canvas – Elite UX Revamp
     -----------------------------------------------------------*/
  import { onMount, tick } from 'svelte';
  import { spring } from 'svelte/motion';
  import { fetchEventSource } from '@microsoft/fetch-event-source';

  /* ------------------------------------------------------------------
     TOOL CONFIGURATION & PERSONAS
     ------------------------------------------------------------------*/
  let tools = [
    { label: 'Code',    icon: 'lucide:code',   active:false, glow:'#60A5FA' },
    { label: 'Data',    icon: 'lucide:bar-chart-4',active:false, glow:'#34D399' },
    { label: 'Persona', icon: 'lucide:user-cog',active:false, glow:'#A78BFA' },
    { label: 'Memory',  icon: 'lucide:brain', active:false, glow:'#F472B6' },
    { label: 'Settings',icon: 'lucide:settings',active:false, glow:'#94A3B8' }
  ];

  interface Persona { id:string; name:string; icon:string; desc:string; color:string; }
  const personas:Persona[] = [
    { id:'sage', name:'Sage', icon:'🧘',  desc:'Balanced wisdom',     color:'#3B82F6' },
    { id:'gpt',  name:'GPT',  icon:'⚡',  desc:'Direct & efficient',  color:'#10B981' },
    { id:'poet', name:'Poet', icon:'🎨', desc:'Creative & bold',     color:'#8B5CF6' }
  ];

  /* ------------------------------------------------------------------
     STATE & SPRINGS
     ------------------------------------------------------------------*/
  type Format = 'Chat'|'Table'|'Graph'|'Code'|'Story';
  interface Msg { id:number; role:'user'|'assistant'; content:string; persona:string; format:Format; streaming:boolean; created:Date }

  let messages:Msg[] = [];
  let draft = '';
  let currentPersona = 'sage';
  let currentFormat:Format = 'Chat';
  let inputFocused=false; let commandMode=false;
  let workspaceMode:'focus'|'dashboard'|'flow' = 'focus';

  const emotion = spring({h:220,s:25,l:15,e:.4,r:1},{stiffness:.05,damping:.9});
  const canvas = spring({x:0,y:0,scale:1},{stiffness:.05,damping:.9});

  /* ------------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------------*/
  function pushMsg(m:Msg){ messages=[...messages,m]; tick().then(scrollBottom); }
  function scrollBottom(){ document.getElementById('chat-end')?.scrollIntoView({behavior:'smooth'}); }

  function choosePersona(p:Persona){ currentPersona=p.id; emotion.update(s=>({...s,h:parseInt(p.color.slice(1,3),16)})); }

  /* ------------------------------------------------------------------
     STREAMING SEND
     ------------------------------------------------------------------*/
  async function send(){
    if(!draft.trim()) return;
    const user:Msg={id:Date.now(),role:'user',content:draft,persona:'user',format:currentFormat,streaming:false,created:new Date()};
    pushMsg(user);

    const ghostId=Date.now()+1;
    pushMsg({id:ghostId,role:'assistant',content:'',persona:currentPersona,format:currentFormat,streaming:true,created:new Date()});

    const prompt=draft; draft='';
    try{
      await fetchEventSource('/api/chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prompt,persona:currentPersona,format:currentFormat}),
        onmessage(ev){ if(!ev.data) return; try{ const d=JSON.parse(ev.data); const t=d.candidates?.[0]?.content?.parts?.[0]?.text||''; if(t){ const i=messages.findIndex(m=>m.id===ghostId); if(i>-1){ messages[i].content+=t; messages=[...messages]; } } }catch{}
        },
        onclose(){ const i=messages.findIndex(m=>m.id===ghostId); if(i>-1){ messages[i].streaming=false; messages=[...messages]; } },
        onerror(err){ throw err }
      });
    }catch(err){ const i=messages.findIndex(m=>m.id===ghostId); if(i>-1){ messages[i].streaming=false; messages[i].content='⚠️ '+(err as Error).message; messages=[...messages]; } }
  }

  /* ------------------------------------------------------------------
     INITIAL DEMO CONTENT FOR VISUAL VALIDATION (can be removed)
     ------------------------------------------------------------------*/
  onMount(()=>{
    pushMsg({id:1,role:'assistant',content:'Hello 👋  How can I assist you today?',persona:'sage',format:'Chat',streaming:false,created:new Date()});
    pushMsg({id:2,role:'user',content:'Analyze this data and generate a report.',persona:'user',format:'Chat',streaming:false,created:new Date()});
  });
</script>

<!-- --------------------------------  LAYOUT  -->
<div class="vx-root" style="--eh:{$emotion.h};--es:{$emotion.s}%;--el:{$emotion.l}%;--ee:{$emotion.e};--er:{$emotion.r};">
  <div class="vx-glow"></div>

  <!-- SIDEBAR -->
  <aside class="vx-sidebar">
    <button class="vx-logo">V</button>
    <nav>{#each tools as t}
      <button class="vx-tool {t.active?'is-active':''}" style="--tool:{t.glow}" on:click={()=>{t.active=!t.active;tools=[...tools]}}>
        <i data-lucide={t.icon}></i><span>{t.label}</span>
      </button>{/each}</nav>
    <div class="vx-personas">{#each personas as p}
      <button class="vx-chip {currentPersona===p.id?'is-active':''}" style="--pcol:{p.color}" on:click={()=>choosePersona(p)}>{p.icon}</button>
    {/each}</div>
  </aside>

  <!-- HEADER -->
  <header class="vx-header">
    <div class="vx-modes">{#each ['focus','dashboard','flow'] as m}
      <button class="vx-mode {workspaceMode===m?'is-active':''}" on:click={()=>workspaceMode=m}>{m[0].toUpperCase()+m.slice(1)}</button>
    {/each}</div>
  </header>

  <!-- CANVAS -->
  <main class="vx-canvas {workspaceMode}" on:wheel={(e)=>{ if(e.ctrlKey){e.preventDefault();const s=$canvas.scale*(1-e.deltaY*0.001);canvas.update(c=>({...c,scale:Math.min(2,Math.max(.5,s))})); } }} style="transform:translate({$canvas.x}px,{$canvas.y}px) scale({$canvas.scale})">
    {#each messages as m,i}
      <article class="vx-msg {m.role}" style="--d:{i*40}ms">
        <div class="vx-ava">{m.role==='assistant'?personas.find(pp=>pp.id===m.persona)?.icon:'🙋'}</div>
        <div class="vx-bubble">{#if m.streaming}{m.content}<span class="vx-cursor">▊</span>{:else}{m.content}{/if}</div>
      </article>
    {/each}
    <div id="chat-end" style="height:4px"></div>
  </main>

  <!-- INPUT BAR -->
  <footer class="vx-input">
    <textarea bind:value={draft} placeholder="Begin with intent…" rows="1" on:keydown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}></textarea>
    <button class="vx-send" on:click={send} disabled={!draft.trim()}><i data-lucide="send"></i></button>
  </footer>
</div>

<style>
  /* -----------------------------------------------------------
     Design Tokens – dark luxury palette
     -----------------------------------------------------------*/
  :root{
    --bg-0:#0B0D10;--bg-1:#111318;--bg-glass:rgba(255,255,255,.04);
    --stroke:rgba(255,255,255,.07); --radius:16px;
    --text-1:#F1F5F9; --text-2:#94A3B8;
    --shadow-lg:0 8px 24px -8px rgba(0,0,0,.6);
  }
  *{box-sizing:border-box;padding:0;margin:0}
  body,html{height:100%;background:var(--bg-0);font-family:"Inter",sans-serif;overflow:hidden;color:var(--text-1)}

  /* -------- Root grid */
  .vx-root{display:grid;grid-template-columns:88px 1fr;grid-template-rows:64px 1fr 72px;height:100vh;position:relative;isolation:isolate}

  /* -------- Ambient radial glow */
  .vx-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 20%,hsla(var(--eh),var(--es),25%,calc(var(--ee)*.4)),transparent 70%);mix-blend-mode:screen;animation:glowPulse calc(6s/var(--er)) ease-in-out infinite}
  @keyframes glowPulse{0%,100%{opacity:.5}50%{opacity:.8}}

  /* -------- Sidebar */
  .vx-sidebar{grid-row:1/span 3;background:var(--bg-1);backdrop-filter:blur(18px) saturate(160%);display:flex;flex-direction:column;align-items:center;padding:1rem 0;gap:1.125rem;border-right:1px solid var(--stroke)}
  .vx-logo{width:48px;height:48px;border-radius:var(--radius);background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:#fff;font-weight:700;font-size:1.25rem;border:none;cursor:pointer;box-shadow:var(--shadow-lg);transition:transform .25s}
  .vx-logo:hover{transform:scale(1.08)}
  nav{display:flex;flex-direction:column;gap:.75rem;margin-top:1rem}
  .vx-tool{width:56px;height:56px;border-radius:var(--radius);border:1px solid var(--stroke);background:var(--bg-glass);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-2);position:relative;cursor:pointer;transition:.25s}
  .vx-tool i{width:20px;height:20px}
  .vx-tool span{font-size:.625rem;margin-top:2px}
  .vx-tool:is(:hover,.is-active){color:var(--text-1);background:rgba(255,255,255,.06);border-color:var(--tool);box-shadow:0 0 0 1px var(--tool),0 10px 20px -8px var(--tool)}
  .vx-personas{margin-top:auto;display:flex;flex-direction:column;gap:.5rem}
  .vx-chip{width:34px;height:34px;border-radius:50%;border:2px solid transparent;display:flex;align-items:center;justify-content:center;font-size:1rem;background:var(--bg-glass);cursor:pointer;transition:.3s}
  .vx-chip:is(:hover,.is-active){transform:scale(1.12)}
  .vx-chip.is-active{border-color:var(--pcol);box-shadow:0 0 0 2px var(--pcol),0 6px 16px -6px var(--pcol)}

  /* -------- Header */
  .vx-header{grid-column:2;background:var(--bg-glass);backdrop-filter:blur(14px);display:flex;align-items:center;padding:0 1.375rem;border-bottom:1px solid var(--stroke)}
  .vx-modes{display:flex;gap:.5rem}
  .vx-mode{border:none;padding:.5rem 1rem;border-radius:var(--radius);background:transparent;color:var(--text-2);cursor:pointer}
  .vx-mode:is(:hover,.is-active){background:rgba(255,255,255,.06);color:var(--text-1)}

  /* -------- Canvas */
  .vx-canvas{grid-column:2;overflow:auto;padding:2rem 3rem;background:linear-gradient(180deg,var(--bg-1) 0%,var(--bg-0) 100%)}
  .vx-msg{display:flex;gap:1rem;margin-bottom:2rem;opacity:0;transform:translateY(20px);animation:fadeIn .4s ease forwards;animation-delay:var(--d)}
  @keyframes fadeIn{to{opacity:1;transform:none}}
  .vx-ava{width:40px;height:40px;border-radius:var(--radius);background:var(--bg-glass);display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0}
  .vx-bubble{background:var(--bg-glass);border:1px solid var(--stroke);border-radius:calc(var(--radius)*1.25);padding:1rem 1.25rem;box-shadow:var(--shadow-lg);backdrop-filter:blur(10px)}
  .vx-msg.assistant .vx-bubble{border-color:hsla(var(--eh),var(--es),60%,.45)}
  .vx-cursor{opacity:.8;animation:blink 1s step-end infinite}
  @keyframes blink{50%{opacity:0}}

  /* -------- Input */
  .vx-input{grid-column:2;display:flex;align-items:center;gap:1rem;background:var(--bg-glass);backdrop-filter:blur(18px);padding:1rem 1.5rem;border-top:1px solid var(--stroke)}
  .vx-input textarea{flex:1;min-height:44px;max-height:160px;resize:none;border-radius:var(--radius);background:var(--bg-glass);border:1px solid var(--stroke);padding:.75rem 1rem;color:var(--text-1);font-size:1rem;line-height:1.4}
  .vx-input textarea:focus{outline:none;border-color:hsla(var(--eh),var(--es),60%,.6);box-shadow:0 0 0 3px hsla(var(--eh),var(--es),50%,.25)}
  .vx-send{width:48px;height:48px;border-radius:var(--radius);border:none;background:linear-gradient(135deg,hsla(var(--eh),var(--es),45%,.85),hsla(calc(var(--eh)+30),var(--es),40%,.85));display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;transition:.25s}
  .vx-send i{width:20px;height:20px}
  .vx-send:disabled{opacity:.35;cursor:not-allowed}
  .vx-send:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 20px -6px hsla(var(--eh),var(--es),50%,.6)}

  /* -------- Utilities */
  @media(max-width:820px){.vx-root{grid-template-columns:72px 1fr}.vx-canvas{padding:1.5rem}}
</style>
