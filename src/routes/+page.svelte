<script lang="ts">
  import { onMount, tick } from 'svelte';
  // -------------------------------------------------------------------------
  //  TYPES & INITIAL STATE
  // -------------------------------------------------------------------------
  type Format = 'Chat' | 'Table' | 'Graph' | 'Code' | 'Story';

  interface Persona {
    id: string;
    name: string;
    icon: string;
    mood: string;            // short tone tag (e.g. "Calm analytic")
    description: string;     // longer tool‑tip / hover description
  }

  interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    format: Format;
    persona: string;   // persona.id that generated this message
    created: Date;
  }

  const personas: Persona[] = [
    { id: 'sage',      name: 'Sage',      icon: '🧘', mood: 'Calm',    description: 'Balanced wisdom & reflection.' },
    { id: 'architect', name: 'Architect', icon: '🏛️', mood: 'System', description: 'Structured, precise systems thinker.' },
    { id: 'poet',      name: 'Poet',      icon: '🎭', mood: 'Evoc.',  description: 'Creative & metaphor‑rich storyteller.' },
    { id: 'analyst',   name: 'Analyst',   icon: '📈', mood: 'Data',   description: 'Evidence‑driven analyst.' }
  ];

  // reactive state
  let currentPersona: Persona = personas[0];
  let outputFormat: Format   = 'Chat';
  let draft                  = '';
  let inputFocused           = false;
  let messages: Message[]    = [];

  // -------------------------------------------------------------------------
  //  HANDLERS
  // -------------------------------------------------------------------------
  function send() {
    if (!draft.trim()) return;

    // push user message
    messages = [
      ...messages,
      { id: Date.now(), role: 'user', content: draft, format: outputFormat, persona: 'user', created: new Date() }
    ];

    // placeholder assistant message for streaming UX
    const placeholderId = Date.now() + 1;
    messages = [
      ...messages,
      { id: placeholderId, role: 'assistant', content: '', format: outputFormat, persona: currentPersona.id, created: new Date() }
    ];

    const userPrompt = draft;
    draft = '';

    // TODO: connect to backend / stream API
    // Example: fetch('/api/chat', { ... })
  }

  function choosePersona(p: Persona) {
    currentPersona = p;
  }

  function chooseFormat(f: Format) {
    outputFormat = f;
  }

  async function scrollToBottom() {
    await tick();
    document.getElementById('chat-end')?.scrollIntoView({ behavior: 'smooth' });
  }
  $: scrollToBottom();
</script>

<style>
  :global(html) { @apply bg-slate-950; }
  .glass         { @apply bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/40; }
  .btn           { @apply px-3 py-1.5 rounded-lg border border-slate-600/60 hover:bg-slate-700/40 transition-colors; }
  .btn-active    { @apply bg-slate-600/80 text-slate-100; }
</style>

<div class="h-screen w-screen flex text-slate-100 select-none">
  <!-- LEFT TOOLBAR -------------------------------------------------------- -->
  <nav class="w-16 sm:w-20 shrink-0 flex flex-col items-center py-6 gap-6 border-r border-slate-700/60">
    {#each [
      { label: 'Code',    icon: '</>' },
      { label: 'Data',    icon: '📊'  },
      { label: 'Persona', icon: '🧬'  },
      { label: 'Memory',  icon: '🧠'  },
      { label: 'Settings',icon: '⚙️'  }
    ] as tool}
      <button class="flex flex-col items-center gap-1 focus:outline-none">
        <span class="text-xl">{tool.icon}</span>
        <span class="text-[10px] sm:text-xs text-slate-400">{tool.label}</span>
      </button>
    {/each}
  </nav>

  <!-- MAIN CANVAS -------------------------------------------------------- -->
  <section class="flex-1 flex flex-col px-4 py-6 overflow-hidden">
    <!-- Top Persona Switcher --------------------------------------------- -->
    <header class="flex justify-end items-center gap-2 mb-4">
      {#each personas as p}
        <button
          class="btn {currentPersona.id === p.id ? 'btn-active' : ''} flex items-center gap-1"
          on:click={() => choosePersona(p)}
          title={p.description}
        >
          <span>{p.icon}</span>
          <span class="hidden sm:inline">{p.name}</span>
        </button>
      {/each}
    </header>

    <!-- Conversation Thread --------------------------------------------- -->
    <div class="flex-1 overflow-y-auto pr-2 space-y-6">
      {#each messages as m}
        <div class="max-w-xl" class:ml-auto={m.role === 'user'}>
          <div class="glass p-4 leading-relaxed break-words">
            <div class="mb-1 text-sm text-slate-400" >{m.role === 'assistant' ? personas.find(x => x.id === m.persona)?.icon : '🙋'}
              {m.role === 'assistant' ? personas.find(x => x.id === m.persona)?.name : 'You'}</div>
            {m.content || '…'}
          </div>
        </div>
      {/each}
      <div id="chat-end" class="h-4"></div>
    </div>

    <!-- Output format picker --------------------------------------------- -->
    {#if inputFocused || draft.length > 0}
      <div class="flex gap-2 justify-center mt-2 mb-1 text-sm">
        {#each ['Chat','Table','Graph','Code','Story'] as f}
          <button class="btn {outputFormat === f ? 'btn-active' : ''}" on:click={() => chooseFormat(f)}>{f}</button>
        {/each}
      </div>
    {/if}

    <!-- Input Zone ------------------------------------------------------- -->
    <form class="mt-auto flex items-end gap-3 py-4" on:submit|preventDefault={send}>
      <textarea
        bind:value={draft}
        rows={inputFocused ? 3 : 1}
        placeholder="Enter a message…"
        class="flex-1 resize-none bg-slate-700/40 rounded-xl p-3 focus:ring-2 focus:ring-cyan-400/70 outline-none placeholder:text-slate-400"
        on:focus={() => inputFocused = true}
        on:blur={() => inputFocused = false}
      ></textarea>
      <button type="submit" class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:brightness-110 flex items-center justify-center shadow-lg">→</button>
    </form>
  </section>
</div>
