<!-- CollapsibleSidebar.svelte -->
<script lang="ts">
  // This component is currently visual only.
  // It needs actual data and logic for:
  // - Loading/displaying projects, workflows, chats
  // Logic for project/workflow management would be added here.
</script>

<aside class="collapsible-sidebar">
  <div class="sidebar-header">
    <h3>Workflows</h3>
  </div>
  <div class="sidebar-sections">
    <section class="sidebar-section">
      <h4>Projects</h4>
      <div class="section-content scrollable">
        <!-- Placeholder for list of projects -->
        <ul>
          <li>Project Alpha</li>
          <li>Project Beta</li>
          <li>Project Gamma</li>
        </ul>
      </div>
    </section>

    <section class="sidebar-section">
      <h4>Workflows</h4>
      <div class="section-content scrollable">
        <!-- Placeholder for list of workflows -->
        <ul>
          <li class="workflow-item">- Workflow 1</li>
          <li class="workflow-item">- Workflow 2</li>
          <li class="workflow-item">- Data Analysis Pipeline</li>
          <li class="workflow-item">- Report Generator</li>
          <li class="workflow-item">- Email Draft</li>
          <li class="workflow-item">- Research Summary</li>
        </ul>
      </div>
    </section>

    <!-- Add a section for "Chats" or "Recent Conversations" if needed -->
  </div>
  <div class="sidebar-footer">
    <button class="new-workflow-button">＋ New Workflow</button>
  </div>
</aside>

<style lang="scss">
  .collapsible-sidebar {
    position: fixed;
    top: var(--top-bar-height);
    left: var(--left-rail-width);
    bottom: 0; /* Takes full height below top bar */
    width: var(--sidebar-width); /* 300px */
    z-index: 10; /* Below TopBar/LeftRail but above main content scrollbar if any */
    
    /* "300px panel, 8px radius, 4% blur" */
    background: rgba(var(--rgb-obsidian), 0.75); /* obsidian with transparency, slightly more opaque for readability */
    backdrop-filter: blur(var(--blur-glass)); /* 4px blur */
    border-right: var(--border-base); /* Titanium border */
    border-top: var(--border-base); /* To make it look "on top" of the workspace scroll area */
    border-top-right-radius: var(--radius-md); /* 8px radius */
    
    display: flex;
    flex-direction: column;
    
    /* The parent #if block handles the show/hide, this provides the animation */
    transition: transform var(--transition-long) var(--ease-out);
  }

  /* Add transition for when sidebar opens/closes */
  /* This should be handled by the parent (.workspace.sidebar-open) */
  /* .collapsible-sidebar {
    transform: translateX(-100%);
  } */

  .sidebar-header {
    padding: var(--space-4);
    border-bottom: var(--border-base);
    h3 {
      font-family: var(--font-heading);
      font-size: var(--font-size-md);
      font-weight: var(--font-medium);
      color: var(--color-text-primary);
      margin: 0; /* Reset heading margin */
    }
  }

  .sidebar-sections {
    flex-grow: 1;
    padding: var(--space-4);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-6); /* Space between sections */
  }

  .sidebar-section {
    display: flex;
    flex-direction: column;
    h4 {
      font-family: var(--font-heading);
      font-size: var(--font-size-base);
      font-weight: var(--font-medium);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-2);
      margin-top: 0; /* Override default heading margin-top */
    }
  }

  .section-content {
    /* This div can become scrollable if its content overflows */
    /* max-height: 200px; */ /* Example: Set a max height to enable scrolling */
    /* overflow-y: auto; */
  }

  .workflow-list {
    list-style: none; /* Remove default list styling */
    padding: 0;
    margin: 0;
    color: var(--color-text-secondary);
    li {
      padding: var(--space-2) 0;
      font-size: var(--font-size-base);
    }
    .workflow-item {
      padding-left: var(--space-4); /* Indent workflow items */
      color: var(--color-text-primary);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: color var(--transition-duration-base), background-color var(--transition-duration-base);
      &:hover {
        color: var(--color-electric-teal);
        background-color: rgba(var(--rgb-electric-teal), 0.1);
      }
    }
  }

  /* Basic list styling for Projects/Chats */
  .sidebar-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
    color: var(--color-text-primary);
    li { padding: var(--space-1) 0; }
  }

  .sidebar-footer {
    padding: var(--space-4);
    border-top: var(--border-base);
  }

  .new-workflow-button {
    width: 100%;
    padding: var(--space-3);
    background-color: var(--color-graphite);
    border: var(--border-base); /* Titanium border */
    color: var(--color-text-primary);
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: border-color var(--transition-duration-base), background-color var(--transition-duration-base);

    &:hover {
      border-color: var(--color-electric-teal);
      background-color: var(--color-obsidian);
    }
    &:focus-visible { // Ensure focus ring is visible on this button
        outline: var(--focus-ring-width) solid var(--color-electric-teal); /* Teal focus ring */
        outline-offset: var(--focus-ring-offset);
    }
  }
</style>