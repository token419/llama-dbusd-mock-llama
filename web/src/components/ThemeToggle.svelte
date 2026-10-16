<script>
  let theme = $state(document.documentElement.getAttribute('data-theme') || 'dark');

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    theme = next;
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (_) {}
  }
</script>

<button
  type="button"
  id="theme-toggle"
  class="theme-toggle-btn"
  onclick={toggle}
  aria-label="Toggle dark/light mode"
  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
  <!-- Sun icon -->
  <svg
    id="theme-icon-sun"
    style="display: {theme === 'dark' ? 'block' : 'none'};"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>

  <!-- Moon icon -->
  <svg
    id="theme-icon-moon"
    style="display: {theme === 'light' ? 'block' : 'none'};"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
</button>

<style>
  .theme-toggle-btn {
    background: var(--card-bg, #2d2d2d);
    border: 1px solid var(--border, #3e3e3e);
    color: var(--text, #ececec);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 8px;
    font-size: 0.85rem;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  }
  .theme-toggle-btn:hover {
    background: var(--btn-hover, #525252);
    border-color: var(--accent, #d4d4d4);
  }
  .theme-toggle-btn:active {
    transform: scale(0.95);
  }
  .theme-toggle-btn svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
  }
  :global(body.game-active) .theme-toggle-btn {
    background: #112211 !important;
    border-color: #33ff33 !important;
    color: #33ff33 !important;
  }
  :global(html[data-theme="light"] body.game-active) .theme-toggle-btn {
    background: #f0fdf4 !important;
    border-color: #16a34a !important;
    color: #15803d !important;
  }
</style>
