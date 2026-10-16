<script>
  import MapView from './MapView.svelte';

  let { gameState } = $props();

  const hpPct = $derived(
    Math.max(0, Math.min(100, (gameState.player.hp / gameState.player.maxHp) * 100))
  );
  const mpPct = $derived(
    Math.max(0, Math.min(100, (gameState.player.mp / gameState.player.maxMp) * 100))
  );

  const enemyMaxHp = $derived(
    gameState.player.enemy?.maxHp || gameState.player.enemy?.hp || 1
  );
  const enemyHpPct = $derived(
    gameState.player.enemy
      ? Math.max(0, Math.min(100, (gameState.player.enemy.hp / enemyMaxHp) * 100))
      : 0
  );
</script>

<div class="game-stats-panel" id="game-stats-panel">
  <!-- HP & MP BARS SIDE BY SIDE -->
  <div class="bars-row">
    <div class="stat-bar-card">
      <div class="stat-bar-header">
        <span>❤️ Health</span>
        <span id="hp-text">{gameState.player.hp} / {gameState.player.maxHp}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill hp-fill" id="hp-bar-fill" style="width: {hpPct}%;"></div>
      </div>
    </div>

    <div class="stat-bar-card">
      <div class="stat-bar-header">
        <span>💧 Mana</span>
        <span id="mp-text">{gameState.player.mp} / {gameState.player.maxMp}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill mp-fill" id="mp-bar-fill" style="width: {mpPct}%;"></div>
      </div>
    </div>
  </div>

  <!-- ENEMY COMBAT BAR IF ACTIVE -->
  {#if gameState.player.inCombat && gameState.player.enemy}
    <div class="enemy-combat-box">
      <div class="stat-bar-header">
        <span class="enemy-name">⚔️ ENEMY: {gameState.player.enemy.name}</span>
        <span class="enemy-hp">{gameState.player.enemy.hp} / {enemyMaxHp}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill enemy-fill" style="width: {enemyHpPct}%;"></div>
      </div>
    </div>
  {/if}

  <!-- EQUIPMENT SUMMARY -->
  <div class="equip-summary">
    <span>⚔️ Weapon: <strong id="stat-weapon">{gameState.player.weapon}</strong> (+{gameState.player.atk} ATK)</span>
    <span>🛡️ Armor: <strong id="stat-armor">{gameState.player.armor}</strong> (+{gameState.player.def} DEF)</span>
    <span>✨ Spells: <strong id="stat-spells">{gameState.player.spells.length > 0 ? gameState.player.spells.join(', ') : 'None'}</strong></span>
  </div>

  <!-- AUXILIARY DISPLAY (INVENTORY OR MAP) -->
  {#if gameState.player.showInventory || gameState.player.showMap}
    <MapView {gameState} />
  {/if}
</div>

<style>
  .game-stats-panel {
    display: flex;
    margin-top: 1rem;
    flex-direction: column;
    gap: 0.75rem;
    font-family: 'Courier New', Courier, monospace;
  }
  .bars-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .stat-bar-card {
    flex: 1;
    min-width: 160px;
    background: #080d08;
    border: 1px solid #1f501f;
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .stat-bar-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #33ff33;
  }
  .bar-track {
    width: 100%;
    height: 12px;
    background: #051005;
    border: 1px solid #33ff33;
    border-radius: 9999px;
    overflow: hidden;
    position: relative;
  }
  .bar-fill {
    height: 100%;
    width: 100%;
    border-radius: 9999px;
    transition: width 0.25s ease;
  }
  .hp-fill {
    background: #33ff33;
    box-shadow: 0 0 8px #33ff33;
  }
  .mp-fill {
    background: #38b6ff;
    box-shadow: 0 0 8px #38b6ff;
  }
  .enemy-combat-box {
    background: #120808;
    border: 1px solid #882222;
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .enemy-name {
    color: #ff5555;
  }
  .enemy-hp {
    color: #ff5555;
  }
  .enemy-fill {
    background: #ff4444;
    box-shadow: 0 0 8px #ff4444;
  }
  .equip-summary {
    font-size: 0.8rem;
    color: #88ff88;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: #080d08;
    border-radius: 6px;
    border: 1px solid #1f501f;
  }
  .equip-summary strong {
    color: #33ff33;
  }

  /* LIGHT MODE THEME OVERRIDES FOR STAT BARS */
  :global(html[data-theme="light"] body.game-active) .stat-bar-card,
  :global(html[data-theme="light"] body.game-active) .equip-summary {
    background: #ffffff !important;
    border-color: #16a34a !important;
    color: #14532d !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
  }
  :global(html[data-theme="light"] body.game-active) .stat-bar-header {
    color: #14532d !important;
  }
  :global(html[data-theme="light"] body.game-active) .bar-track {
    background: #e2e8f0 !important;
    border-color: #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) .hp-fill {
    background: #dc2626 !important;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.4) !important;
  }
  :global(html[data-theme="light"] body.game-active) .mp-fill {
    background: #2563eb !important;
    box-shadow: 0 0 8px rgba(37, 99, 235, 0.4) !important;
  }
  :global(html[data-theme="light"] body.game-active) .equip-summary {
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) .equip-summary strong {
    color: #14532d !important;
  }
</style>
