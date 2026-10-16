<script>
  let { loadDelay = $bindable(1), unloadDelay = $bindable(1), onUpdate = null } = $props();
  let statusMessage = $state("");
  let statusVisible = $state(false);
  let statusTimeout = null;

  function setStatus(msg) {
    statusMessage = msg;
    statusVisible = true;
    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      statusVisible = false;
      setTimeout(() => {
        if (!statusVisible) statusMessage = "";
      }, 400);
    }, 2000);
  }

  async function updateLoadDelay(e) {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) return;
    loadDelay = val;
    try {
      const res = await fetch("/mock/loaddelay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delay: val })
      });
      if (res.ok) {
        setStatus(`Load delay set to ${val}s`);
        if (onUpdate) onUpdate(loadDelay, unloadDelay);
      } else {
        setStatus("Error updating load delay");
      }
    } catch (err) {
      setStatus("Network error updating load delay");
    }
  }

  async function updateUnloadDelay(e) {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) return;
    unloadDelay = val;
    try {
      const res = await fetch("/mock/unloaddelay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delay: val })
      });
      if (res.ok) {
        setStatus(`Unload delay set to ${val}s`);
        if (onUpdate) onUpdate(loadDelay, unloadDelay);
      } else {
        setStatus("Error updating unload delay");
      }
    } catch (err) {
      setStatus("Network error updating unload delay");
    }
  }
</script>

<div class="delay-panel" id="delay-panel">
  <div class="delay-panel-header">
    <span>⏱️ Simulated Latency Settings</span>
    <span
      id="delay-status"
      class="delay-status"
      class:visible={statusVisible}
    >
      {statusMessage}
    </span>
  </div>
  <div class="delay-inputs-row">
    <div class="delay-group">
      <label for="load-delay-input">Model Load Delay (sec):</label>
      <div class="spinner-wrapper">
        <input
          type="number"
          id="load-delay-input"
          min="0"
          max="600"
          value={loadDelay}
          onchange={updateLoadDelay}
        />
      </div>
    </div>
    <div class="delay-group">
      <label for="unload-delay-input">Model Unload Delay (sec):</label>
      <div class="spinner-wrapper">
        <input
          type="number"
          id="unload-delay-input"
          min="0"
          max="600"
          value={unloadDelay}
          onchange={updateUnloadDelay}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .delay-panel {
    margin-top: 1rem;
    padding: 0.9rem 1rem;
    background: var(--input-bg, #1c1c1c);
    border: 1px solid var(--border, #3e3e3e);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .delay-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--subtext, #a0a0a0);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .delay-status {
    font-size: 0.8rem;
    color: var(--green, #81c784);
    font-weight: 500;
    min-height: 1.2em;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .delay-status.visible {
    opacity: 1;
  }
  .delay-inputs-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .delay-group {
    flex: 1;
    min-width: 150px;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .delay-group label {
    font-size: 0.85rem;
    color: var(--text, #ececec);
  }
  .spinner-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .spinner-wrapper input[type="number"] {
    width: 100%;
    background: var(--card-bg, #2d2d2d);
    border: 1px solid var(--border, #3e3e3e);
    color: var(--text, #ececec);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.95rem;
    outline: none;
  }
  .spinner-wrapper input[type="number"]:focus {
    border-color: var(--accent, #d4d4d4);
  }
</style>
