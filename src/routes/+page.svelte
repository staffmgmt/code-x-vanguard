<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { spring } from 'svelte/motion';
  import { fetchEventSource, EventSourceMessage } from '@microsoft/fetch-event-source';

  //-----------------------------------------------------------------------
  //  TOOLBAR & PERSONAS CONFIG
  //-----------------------------------------------------------------------
  const tools = [
    { label: 'Code',    icon: '⚡', active: false, glow: '#60A5FA' },
    { label: 'Data',    icon: '📊', active: false, glow: '#34D399' },
    { label: 'Persona', icon: '🧬', active: false, glow: '#A78BFA' },
    { label: 'Memory',  icon: '🧠', active: false, glow: '#F472B6' },
    { label: 'Settings',icon: '⚙️', active: false, glow: '#94A3B8' }
  ];

  interface Persona {
    id: string; name: string; icon: string; description: string; color: string;
  }
  const personas: Persona[] = [
    { id:'sage',   name:'Sage',   icon:'🌊', description:'Thoughtful & nuanced',  color:'#3B82F6' },
    { id:'gpt',    name:'GPT',    icon:'⚡', description:'Direct & efficient',    color:'#10B981' },
    { id:'poet',   name:'Poet',   icon:'🎨', description:'Imaginative & bold',   color:'#8B5CF6' }
  ];

  //-----------------------------------------------------------------------
  //  REACTIVE STATE STORES
  //-----------------------------------------------------------------------
  type Format = 'Chat'|'Table'|'Graph'|'Code'|'Story';
  interface Msg { id:number; role:'user'|'assistant'; content:string; persona:string; format:Format; streaming:boolean; created:Date }

  let messages: Msg[] = [];
  let draft       = '';
  let inputFocused= false;
  let currentFormat:Format = 'Chat';
  let currentPersona = 'sage';
  let workspaceMode  = 'focus';      // focus | dashboard | flow
  let inputMode      = 'text';       // text | code | data | mindmap
  let commandMode    = false;

  //-----------------------------------------------------------------------
  //  SPRINGS (emotion + canvas p/z)
  //-----------------------------------------------------------------------
  const emotionalState = spring({ hue:220,saturation:30,lightness:50,energy:0.6,rhythm:1 },{ stiffness:0.05,damping:0.9});
  

  //-----------------------------------------------------------------------
  //  HELPERS
  //-----------------------------------------------------------------------
  function analyzeEmotion(text:string){
    const exclam = (text.match(/!/g)||[]).length;
    const questions = (text.match(/\?/g)||[]).length;
    const energy = Math.min(1,text.length/200) + exclam*0.05;
    let hue=220,sat=25,rhythm=1;
    if(exclam>2){ hue=0; sat=60; rhythm=1.4; }
    else if(questions>1){ hue=280; sat=45; rhythm=0.8; }
    emotionalState.set({ hue,saturation:sat,lightness:50,energy,rhythm });
  }

  function choosePersona(p:Persona){
    currentPersona=p.id;
    emotionalState.update(s=>({...s,hue:parseInt(p.color.slice(1,3),16)}));
  }

  function detectInputIntent(text:string){
    if(text.startsWith('```')||text.includes('function')) inputMode='code';
    else if(text.includes('table')||text.includes('data')){ inputMode='data'; currentFormat='Table'; }
    else if(text.length>120) inputMode='mindmap';
    else inputMode='text';
  }

  //-----------------------------------------------------------------------
  //  STREAMING SEND LOGIC (Microsoft fetch-event-source)
  //-----------------------------------------------------------------------
  async function send(){
    if(!draft.trim()) return;
    const userMsg:Msg = { id:Date.now(), role:'user', content:draft, persona:'user', format:currentFormat, streaming:false, created:new Date() };
    messages=[...messages,userMsg];

    const placeholderId = Date.now()+1;
    messages=[...messages,{ id:placeholderId, role:'assistant', content:'', persona:currentPersona, format:currentFormat, streaming:true, created:new Date() }];

    const prompt = draft;
    draft='';
    try{
      await fetchEventSource('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ prompt, persona:currentPersona, format:currentFormat }),
        async onmessage(msg:EventSourceMessage){
          if(!msg.data) return;
          try{ const chunk=JSON.parse(msg.data);
            const delta=chunk.candidates?.[0]?.content?.parts?.[0]?.text||'';
            if(delta){
              const idx=messages.findIndex(m=>m.id===placeholderId);
              if(idx!==-1){ messages[idx].content+=delta; messages=[...messages]; }
            }
          }catch(e){ console.error('chunk parse',e); }
        },
        onclose(){
          const idx=messages.findIndex(m=>m.id===placeholderId);
          if(idx!==-1){ messages[idx].streaming=false; messages=[...messages]; }
        },
        onerror(err){ throw err; }
      });
    }catch(e){
      const idx=messages.findIndex(m=>m.id===placeholderId);
      if(idx!==-1){ messages[idx].streaming=false; messages[idx].content=`⚠️ ${(e as Error).message}`; messages=[...messages]; }
    }
  }

  //-----------------------------------------------------------------------
  //  INPUT & COMMAND HANDLING
  //-----------------------------------------------------------------------
  function handleKey(e:KeyboardEvent){
    if(e.key==='/' && !draft) { commandMode=true; return; }
    if(commandMode && e.key==='Enter'){
      processCommand(draft.trim()); draft=''; commandMode=false; return; }
    if(e.key==='Escape'){ commandMode=false; return; }
  }

  function processCommand(cmd:string){
    const [c,...args]=cmd.slice(1).split(' ');
    switch(c){
      case 'mode': workspaceMode=args[0]||'focus'; break;
      case 'clear': messages=[]; break;
    }
  }

  //-----------------------------------------------------------------------
  //  CANVAS WHEEL (zoom)
  //-----------------------------------------------------------------------
  function handleWheel(e:WheelEvent){
    if(e.ctrlKey){ e.preventDefault(); const s=$canvasTransform.scale*(1-e.deltaY*0.001);
      canvasTransform.update(t=>({...t,scale:Math.min(2,Math.max(0.5,s))})); }
  }

  //-----------------------------------------------------------------------
  //  AUTO SCROLL
  //-----------------------------------------------------------------------
  async function scrollBottom(){ await tick(); document.getElementById('chat-end')?.scrollIntoView({behavior:'smooth'}); }
  $: scrollBottom();

  //-----------------------------------------------------------------------
  onMount(()=> emotionalState.set({hue:220,saturation:30,lightness:50,energy:0.7,rhythm:1}));
</script>

<div class="vanguard" style="--emotion-h:{$emotionalState.hue}; --emotion-s:{$emotionalState.saturation}%; --emotion-l:{$emotionalState.lightness}%; --emotion-e:{$emotionalState.energy}; --emotion-r:{$emotionalState.rhythm};">
  <div class="emotion-mirror"></div>
  <aside class="tool-sidebar">
    <div class="vanguard-logo"><div class="logo-pulse"></div><span>V</span></div>
    <nav class="tool-stack">
      {#each tools as t}
        <button class="tool-module {t.active?'active':''}" style="--tool-glow:{t.glow}" on:click={()=>{t.active=!t.active;tools=[...tools]}}>
          <span class="tool-icon">{t.icon}</span><span class="tool-label">{t.label}</span>{#if t.active}<div class="tool-aura"></div>{/if}
        </button>
      {/each}
    </nav>
    <div class="persona-selector">
      {#each personas as p}
        <button class="persona-chip {currentPersona===p.id?'active':''}" title={p.description} style="--persona-color:{p.color}" on:click={()=>choosePersona(p)}>{p.icon}</button>
      {/each}
    </div>
  </aside>

  <header class="top-controls">
    <div class="workspace-modes">
      <button class="mode-btn {workspaceMode==='focus'?'active':''}" on:click={()=>workspaceMode='focus'}>Focus</button>
      <button class="mode-btn {workspaceMode==='dashboard'?'active':''}" on:click={()=>workspaceMode='dashboard'}>Dashboard</button>
      <button class="mode-btn {workspaceMode==='flow'?'active':''}" on:click={()=>workspaceMode='flow'}>Flow</button>
    </div>
  </header>

  <main class="adaptive-canvas {workspaceMode}" on:wheel={handleWheel} style="transform:translate({$canvasTransform.x}px,{$canvasTransform.y}px) scale({$canvasTransform.scale})">
    {#each messages as m,i}
      {#if workspaceMode==='focus'}
        <article class="message-block {m.role}" style="animation-delay:{i*50}ms">
          <div class="message-avatar">{m.role==='assistant'?personas.find(x=>x.id===m.persona)?.icon:'🙋'}</div>
          <div class="message-content"><header class="message-meta">{m.role==='assistant'?personas.find(x=>x.id===m.persona)?.name:'You'}</header><div class="message-body">{#if m.streaming}<div class="streaming-text">{m.content}<span class="cursor-blink">▊</span></div>{:else}{m.content}{/if}</div></div>
        </article>
      {:else if workspaceMode==='dashboard'}
        <div class="dashboard-card"><div class="card-header"><span>{m.role==='assistant'?personas.find(x=>x.id===m.persona)?.name:'You'}</span></div><div class="card-content">{m.content.slice(0,150)}…</div></div>
      {:else}
        <div class="flow-node {m.role}" style="left:{100+(i%3)*300}px; top:{100+Math.floor(i/3)*200}px"><div class="node-header">{m.role==='assistant'?personas.find(x=>x.id===m.persona)?.icon:'🙋'}</div><div class="node-content">{m.content.slice(0,100)}…</div></div>
      {/if}
    {/each}
    <div id="chat-end" style="height:4px"></div>
  </main>

  <footer class="input-zone {inputMode}">
    {#if commandMode}
      <div class="command-palette"><span class="command-prefix">/</span><input bind:value={draft} placeholder="Enter command…" on:keydown={handleKey} autofocus/></div>
    {:else}
      {#if inputFocused||draft}
        <div class="format-selector">
          {#each ['Chat','Table','Graph','Code','Story'] as f}
            <button class="format-chip {currentFormat===f?'active':''}" on:click={()=>currentFormat=f}>{f}</button>
          {/each}
        </div>
      {/if}
      <div class="input-container">
        <textarea class="dynamic-input" bind:value={draft} placeholder="Begin with intent…" rows="1" on:keydown={handleKey} on:input={()=>{
            analyzeEmotion(draft); detectInputIntent(draft);
          }} on:focus={()=>inputFocused=true} on:blur={()=>inputFocused=false}></textarea>
        <button class="send-button" on:click={send} disabled={!draft.trim()}>→</button>
      </div>
    {/if}
  </footer>
</div>

<style>
  /* FULL AESTHETIC KIT */

  :root{
    --golden-ratio:1.618;
    --spacing-xs:.25rem;
    --spacing-sm:.5rem;
    --spacing-md:1rem;
    --spacing-lg:1.618rem;
    --spacing-xl:2.618rem;
  }

  *{box-sizing:border-box;}
  body,html{margin:0;height:100%;background:#050505;overscroll-behavior:none;}

  .vanguard{display:grid;grid-template-columns:80px 1fr;grid-template-rows:60px 1fr auto;height:100vh;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;position:relative}

  /* -------------------------------- emotion mirror */
  .emotion-mirror{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%,hsla(var(--emotion-h),var(--emotion-s),var(--emotion-l),calc(var(--emotion-e) * 0.05)),transparent 70%);border:2px solid hsla(var(--emotion-h),var(--emotion-s),60%,calc(var(--emotion-e) * 0.1));animation:emotionPulse calc(4s/var(--emotion-r)) ease-in-out infinite;}
  @keyframes emotionPulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.6;transform:scale(1.02)}}

  /* -------------------------------- sidebar */
  .tool-sidebar{grid-row:1/-1;background:rgba(0,0,0,.6);backdrop-filter:blur(20px) saturate(180%);border-right:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;padding:var(--spacing-md);gap:var(--spacing-lg);z-index:10}
  .vanguard-logo{width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3B82F6,#8B5CF6);border-radius:12px;font-weight:700;font-size:1.5rem;position:relative;cursor:pointer;transition:transform .3s ease}
  .vanguard-logo:hover{transform:scale(1.05)}
  .logo-pulse{position:absolute;inset:-4px;background:inherit;border-radius:inherit;opacity:.3;filter:blur(8px);animation:logoPulse 2s ease-in-out infinite}
  @keyframes logoPulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(1.1);opacity:.1}}

  .tool-stack{display:flex;flex-direction:column;gap:var(--spacing-sm)}
  .tool-module{width:64px;height:64px;border:none;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;position:relative;transition:.3s cubic-bezier(.4,0,.2,1)}
  .tool-module:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1);transform:translateX(4px)}
  .tool-module.active{background:rgba(255,255,255,.08);border-color:var(--tool-glow);box-shadow:0 0 20px rgba(0,0,0,.2),inset 0 0 20px rgba(255,255,255,.05),0 0 40px -10px var(--tool-glow)}
  .tool-aura{position:absolute;inset:-8px;background:radial-gradient(circle,var(--tool-glow),transparent 70%);opacity:.2;filter:blur(10px);animation:auraGlow 3s ease-in-out infinite}
  @keyframes auraGlow{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:.4;transform:scale(1.1)}}
  .tool-icon{font-size:1.5rem;filter:grayscale(.3);transition:filter .3s ease}
  .tool-module:hover .tool-icon,.tool-module.active .tool-icon{filter:grayscale(0)}
  .tool-label{font-size:.625rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6}

  .persona-selector{display:flex;gap:var(--spacing-xs);margin-top:auto;padding:var(--spacing-sm);background:rgba(255,255,255,.02);border-radius:12px}
  .persona-chip{width:36px;height:36px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.02);border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s}
  .persona-chip:hover{background:rgba(255,255,255,.05);transform:translateY(-2px)}
  .persona-chip.active{background:var(--persona-color);border-color:var(--persona-color);box-shadow:0 4px 12px -2px var(--persona-color)}

  /* -------------------------------- top controls */
  .top-controls{grid-column:2;display:flex;justify-content:space-between;align-items:center;padding:0 var(--spacing-lg);background:rgba(0,0,0,.3);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.05)}
  .workspace-modes{display:flex;gap:var(--spacing-sm);padding:var(--spacing-xs);background:rgba(255,255,255,.02);border-radius:10px}
  .mode-btn{padding:var(--spacing-sm) var(--spacing-md);border:none;background:transparent;color:rgba(255,255,255,.6);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:var(--spacing-xs);font-size:.875rem;transition:.2s}
  .mode-btn:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.9)}
  .mode-btn.active{background:rgba(255,255,255,.1);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}

  /* -------------------------------- adaptive canvas */
  .adaptive-canvas{grid-column:2;overflow-y:auto;overflow-x:hidden;padding:var(--spacing-xl);transition:.6s cubic-bezier(.4,0,.2,1);transform-origin:center}

  /* focus mode */
  .message-block{display:flex;gap:var(--spacing-md);margin-bottom:var(--spacing-lg);animation:messageSlide .3s ease-out forwards;opacity:0}
  @keyframes messageSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .message-avatar{width:40px;height:40px;background:rgba(255,255,255,.05);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0}
  .message-content{flex:1}
  .message-meta{font-size:.875rem;opacity:.6;margin-bottom:var(--spacing-xs)}
  .message-body{line-height:1.6;color:rgba(255,255,255,.9)}
  .streaming-text{position:relative}
  .cursor-blink{animation:blink 1s ease-in-out infinite;color:hsla(var(--emotion-h),var(--emotion-s),60%,.8)}
  @keyframes blink{0%,50%{opacity:1}50.1%,100%{opacity:0}}

  /* dashboard mode */
  .dashboard-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--spacing-lg)}
  .dashboard-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);border-radius:16px;padding:var(--spacing-lg);transition:.3s;cursor:pointer}
  .dashboard-card:hover{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);transform:translateY(-2px);box-shadow:0 10px 30px -10px rgba(0,0,0,.3)}

  /* flow mode */
  .flow-canvas{position:relative;width:100%;min-height:600px}
  .flow-node{position:absolute;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:var(--spacing-md);width:250px;cursor:move;transition:.3s}
  .flow-node:hover{background:rgba(255,255,255,.05);box-shadow:0 8px 24px -8px rgba(0,0,0,.3)}

  /* input zone */
  .input-zone{grid-column:2;background:rgba(0,0,0,.6);backdrop-filter:blur(20px) saturate(150%);border-top:1px solid rgba(255,255,255,.05);padding:var(--spacing-lg)}
  .format-selector{display:flex;gap:var(--spacing-sm);margin-bottom:var(--spacing-md);opacity:0;animation:fadeIn .3s ease-out forwards}
  @keyframes fadeIn{to{opacity:1}}
  .format-chip{padding:var(--spacing-xs) var(--spacing-md);background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.1);border-radius:20px;color:rgba(255,255,255,.6);font-size:.875rem;cursor:pointer;transition:.2s}
  .format-chip:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.9)}
  .format-chip.active{background:hsla(var(--emotion-h),var(--emotion-s),50%,.2);border-color:hsla(var(--emotion-h),var(--emotion-s),60%,.5);color:#fff}
  .input-container{display:flex;gap:var(--spacing-md);align-items:flex-end}
  .dynamic-input{flex:1;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:var(--spacing-md) var(--spacing-lg);color:#fff;font-size:1rem;line-height:1.5;resize:none;transition:.3s}
  .dynamic-input:focus{outline:none;background:rgba(255,255,255,.05);border-color:hsla(var(--emotion-h),var(--emotion-s),60%,.5);box-shadow:0 0 0 4px hsla(var(--emotion-h),var(--emotion-s),50%,.1),inset 0 0 20px rgba(255,255,255,.02)}
  .send-button{width:48px;height:48px;border:none;background:linear-gradient(135deg,hsla(var(--emotion-h),var(--emotion-s),50%,.8),hsla(calc(var(--emotion-h)+30),var(--emotion-s),40%,.8));border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;transition:.3s;position:relative;overflow:hidden}
  .send-button::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,#fff,transparent);opacity:0;transition:.3s}
  .send-button:hover:not(:disabled){transform:scale(1.05);box-shadow:0 8px 24px -8px hsla(var(--emotion-h),var(--emotion-s),50%,.5)}
  .send-button:hover:not(:disabled)::before{opacity:.1}
  .send-button:active:not(:disabled){transform:scale(.95)}
  .send-button:disabled{opacity:.3;cursor:not-allowed}

  /* command palette */
  .command-palette{display:flex;align-items:center;gap:var(--spacing-sm);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:var(--spacing-md)}
  .command-prefix{color:#60A5FA;font-weight:600;font-size:1.125rem}
  .command-palette input{flex:1;background:none;border:none;color:#fff;font-size:1rem;outline:none}

  /* MQ */
  @media(max-width:768px){.vanguard{grid-template-columns:1fr;grid-template-rows:auto 1fr auto}.tool-sidebar{position:fixed;left:-80px;transition:left .3s}.tool-sidebar.open{left:0}.top-controls,.adaptive-canvas,.input-zone{grid-column:1}}
  @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  @media(prefers-contrast:high){.tool-module,.message-block,.dashboard-card{border-width:2px}}
</style>
