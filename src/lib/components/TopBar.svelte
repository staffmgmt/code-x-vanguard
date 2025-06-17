<script>
  import { currentProject } from '$lib/stores/workbench';
  
  let editing = false;
  let dropdownOpen = false;
  let projectName = '';
  
  $: if ($currentProject) {
    projectName = $currentProject;
  }
  
  function saveProjectName() {
    if (projectName.trim()) {
      $currentProject = projectName;
    }
    editing = false;
  }
  
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      saveProjectName();
    }
  }
</script>

<header class="topbar">
  <div class="project-title">
    {#if editing}
      <!-- svelte-ignore a11y_autofocus -->
      <input 
        autofocus
        type="text"
        bind:value={projectName}
        on:blur={saveProjectName}
        on:keydown={handleKeydown}
        class="project-input"
        aria-label="Edit project name"
      />
    {:else}
      <button 
        class="title-button"
        on:click={() => editing = true}
        aria-label="Edit project title"
      >
        <h1>{$currentProject}</h1>
      </button>
    {/if}
  </div>
  
  <div class="user-menu">
    <button 
      class="avatar-button"
      on:click={() => dropdownOpen = !dropdownOpen}
      aria-expanded={dropdownOpen}
      aria-label="User menu"
    >
      JD
    </button>
    
    {#if dropdownOpen}
      <div class="dropdown-menu">
        <ul>
          <li><button>Account</button></li>
          <li><button>Billing</button></li>
          <li><button>Theme</button></li>
        </ul>
      </div>
    {/if}
  </div>
</header>

<style>
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    background-color: var(--surface-elevated);
    border-bottom: 1px solid var(--border-default);
  }
  
  .project-title {
    flex: 1;
  }
  
  .title-button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    text-align: left;
  }
  
  h1 {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    margin: 0;
  }
  
  .project-input {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    background-color: var(--surface-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
    width: 100%;
    max-width: 20rem;
  }
  
  .avatar-button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: var(--accent-primary);
    color: var(--surface-primary);
    font-weight: bold;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dropdown-menu {
    position: absolute;
    right: var(--space-4);
    top: 4rem;
    background-color: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    overflow: hidden;
    z-index: 100;
  }
  
  .dropdown-menu ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .dropdown-menu li button {
    width: 100%;
    text-align: left;
    padding: var(--space-3) var(--space-4);
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
  }
  
  .dropdown-menu li button:hover {
    background-color: var(--surface-primary);
  }
</style>