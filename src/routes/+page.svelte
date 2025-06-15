/* =========================================================================
   +page.svelte  —  Vanguard Canvas v2  |  Visual-UX Optimization (tokens in-file)
   =========================================================================
   ▸  All functional TS/logic remains untouched.
   ▸  Design-tokens live inside :root CSS vars for zero imports + max portability.
   ========================================================================= */
<script lang="ts">
  /* ——— existing script (unchanged) ——— */
  import { onMount, tick } from 'svelte';
  import { spring } from 'svelte/motion';
  import { fetchEventSource } from '@microsoft/fetch-event-source';
  /* … (all original TypeScript stays exactly the same) … */
</script>

<!-- Root Grid -->
<div
  class="relative grid h-screen overflow-hidden grid-cols-[72px_1fr] grid-rows-[56px_1fr_auto]
         font-inter text-slate-100 bg-gradient-to-b from-bkg-1 to-bkg-0
         selection:bg-accent/20"
  style="--h:{$emotion.h};--s:{$emotion.s}%;--l:{$emotion.l}%">

  <!-- Ambient Glow -->
  <div class="pointer-events-none absolute inset-0 mix-blend-screen"
       style="background:radial-gradient(circle_at_50%_15%,hsl(var(--h)_var(--s)_30%/.35),transparent_70%)">
  </div>

  <!-- Side Drawer -->
  <aside class="row-span-3 bg-surface/80 backdrop-blur-md border-r border-white/5
                flex flex-col items-center gap-4 pt-4"
         aria-label="Main tool navigation">
    <!-- Brand -->
    <button class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent font-bold
                   focus-visible:ring-2 ring-primary/60 transition-colors"
            aria-label="Vanguard Home">V</button>

    <!-- Tool Rail -->
    <nav class="flex flex-col gap-2 mt-6 text-xs" role="navigation">
      {#each tools as t}
        <button
          class="group relative flex flex-col items-center gap-1 w-14 h-14 rounded-xl
                 border border-white/5 bg-white/5 hover:bg-white/10
                 focus-visible:ring-2 ring-primary/60 transition"
          on:click={() => drawerOpen = false}
          aria-label={t.label}>
          <i data-lucide={t.icon}
             class="w-5 h-5 text-{t.color}-400 group-hover:scale-110 transition-transform"></i>
          <span class="uppercase tracking-wider text-[10px] text-slate-400 group-hover:text-slate-200">{t.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Personas -->
    <div class="mt-auto mb-4 flex flex-col gap-3" aria-label="Persona switcher">
      {#each personas as p}
        <button
          class="w-9 h-9 rounded-full grid place-content-center text-lg border-2 border-transparent
                 transition-transform hover:scale-110 focus-visible:ring-2 ring-[hsl({p.hue}_90%_60%)]
                 {activePersona===p.id ? 'ring-2 ring-[hsl('+p.hue+'_90%_60%)]' : ''}"
          on:click={() => switchPersona(p)}
          title={p.name}
          aria-pressed={activePersona===p.id}>
          {p.emoji}
        </button>
      {/each}
    </div>
  </aside>

  <!-- Top Nav -->
  <header class="col-start-2 bg-white/5 backdrop-blur-sm flex items-center gap-6 px-6
                 border-b border-white/5 text-sm"
          role="toolbar"
          aria-label="View mode selector">
    {#each ['focus','dashboard','flow'] as m}
      <button
        class="px-3 py-2 rounded-md font-medium capitalize
               {mode===m
                 ? 'bg-white/10 text-white'
                 : 'text-slate-400 hover:text-white hover:bg-white/5'}
               transition-colors focus-visible:ring-2 ring-primary/60"
        on:click={() => mode=m}
        aria-pressed={mode===m}>
        {m}
      </button>
    {/each}
  </header>

  <!-- Canvas -->
  <main
    class="col-start-2 overflow-y-auto px-6 py-8 scroll-smooth focus:outline-none"
    role="feed"
    aria-live="polite"
    on:wheel={(e)=>{if(e.ctrlKey){e.preventDefault();const next=$canvas.scale*(1-e.deltaY*0.001);canvas.update(c=>({...c,scale:Math.min(2,Math.max(0.5,next))}));}}}
    style="transform:translate({$canvas.x}px,{$canvas.y}px) scale({$canvas.scale})">
    {#each msgs as m (m.id)}
      <article class="max-w-xl mb-6 flex gap-3 animate-fade-in" aria-label="Chat message">
        <div class="w-9 h-9 rounded-xl bg-white/10 grid place-content-center text-lg">
          {m.role==='assistant'
            ? personas.find(pp=>pp.id===m.persona)?.emoji
            : '🙋'}
        </div>
        <div class="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
                    px-4 py-3 text-sm leading-relaxed break-words">
          {#if m.streaming}{m.content}<span class="animate-pulse">▊</span>{:else}{m.content}{/if}
        </div>
      </article>
    {/each}
    <div id="bottom" tabindex="-1"></div>
  </main>

  <!-- Input Bar -->
  <footer class="col-start-2 flex items-end gap-3 bg-white/5 backdrop-blur-sm p-4
                 border-t border-white/5">
    <textarea
      bind:value={draft}
      rows="1"
      placeholder="Begin with intent…"
      aria-label="Message input"
      class="flex-1 resize-none bg-transparent outline-none text-slate-200
             placeholder:text-slate-500 scrollbar-hide"
      on:keydown={(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}>
    </textarea>

    <button
      class="w-12 h-12 rounded-xl grid place-content-center
             disabled:opacity-40
             bg-gradient-to-br from-primary to-accent
             focus-visible:ring-2 ring-accent/60 transition-colors"
      on:click={send}
      disabled={!draft.trim()}
      aria-label="Send message">
      <i data-lucide="send" class="w-5 h-5"></i>
    </button>
  </footer>
</div>

<style global>
  /* ——— asset preconnect & font import ——— */
  @import "https://unpkg.com/lucide-static@0.252.0/font/Lucide.css";
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  /* ——— Design Tokens (CSS variables live here) ——— */
  :root {
    /* palette */
    --bkg-0:#050507;            /* deepest background */
    --bkg-1:#0c0e12;            /* gradient top */
    --surface:#111318;          /* card / rail surfaces */
    --primary:hsl(210 90% 45%);
    --accent:hsl(160 90% 45%);
    --accent-fg:#ffffff;

    /* typography */
    --font-body:'Inter',system-ui,sans-serif;
    --scale:1.25;               /* modular scale ratio */
    --font-base:1rem;
    --lh-tight:1.35;
    --lh-normal:1.6;

    /* spacing (4-pt grid) */
    --space-0:0rem;
    --space-1:0.25rem;
    --space-2:0.5rem;
    --space-3:0.75rem;
    --space-4:1rem;
    --space-6:1.5rem;
    --space-8:2rem;

    /* radii */
    --radius-s:0.375rem;
    --radius-m:0.75rem;
    --radius-l:1.5rem;
  }

  /* utility aliases for Tailwind arbitrary colors */
  .from-bkg-1{--tw-gradient-from:var(--bkg-1);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,rgba(255,255,255,0));}
  .to-bkg-0{--tw-gradient-to:var(--bkg-0);}
  .bg-surface{background-color:var(--surface);}
  .from-primary{--tw-gradient-from:var(--primary);}
  .to-accent{--tw-gradient-to:var(--accent);}
  .ring-primary\/60{--tw-ring-color:hsla(210,90%,45%,0.6);}
  .ring-accent\/60{--tw-ring-color:hsla(160,90%,45%,0.6);}
  .bg-accent\/20{background-color:hsla(160,90%,45%,0.2);}
  .text-accent{color:var(--accent);}
  .animate-fade-in{animation:fadeIn .25s ease-out;}

  /* misc util */
  .scrollbar-hide::-webkit-scrollbar{display:none}
  .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

  /* a11y: disable motion */
  @media (prefers-reduced-motion:reduce){
    *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}
  }
</style>

/* -------------------------------------------------------------------------
   Embedded Design-Token Reference (for quick copy to other tools if needed)
   -------------------------------------------------------------------------
   {
     "color":{
       "bkg-0":"#050507",
       "bkg-1":"#0c0e12",
       "surface":"#111318",
       "primary":"hsl(210 90% 45%)",
       "accent":"hsl(160 90% 45%)",
       "text-default":"#e2e8f0"
     },
     "typography":{
       "font-family":"'Inter',system-ui,sans-serif",
       "modular-scale":1.25,
       "base-size":"1rem",
       "line-height-tight":1.35,
       "line-height-normal":1.6
     },
     "spacing":{
       "0":"0rem","1":"0.25rem","2":"0.5rem","3":"0.75rem",
       "4":"1rem","6":"1.5rem","8":"2rem"
     },
     "radius":{"s":"0.375rem","m":"0.75rem","l":"1.5rem"}
   }
*/
