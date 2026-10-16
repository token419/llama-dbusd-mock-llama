<script>
  import { getEquipmentInfo } from '../game/world.js';

  let { gameState } = $props();

  const showInventory = $derived(gameState.player.showInventory);
  const showMap = $derived(gameState.player.showMap);

  const dungeonId = $derived(gameState.player.inDungeon);
  const dungeonInfo = $derived(dungeonId ? gameState.dungeonData[dungeonId] : null);

  const groupedInventory = $derived.by(() => {
    const map = new Map();
    for (const item of gameState.player.inventory) {
      const eq = getEquipmentInfo(item);
      if (eq && (eq.type === 'weapon' || eq.type === 'armor')) {
        continue;
      }
      const count = map.get(item) || 0;
      map.set(item, count + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count
    }));
  });

  const availableWeapons = $derived.by(() => {
    const list = [];
    const equipped = getEquipmentInfo(gameState.player.weapon);
    list.push({
      name: gameState.player.weapon,
      stat: equipped?.stat || `+${gameState.player.atk} ATK`,
      isEquipped: true,
      count: 1
    });

    const packCounts = new Map();
    for (const item of gameState.player.inventory) {
      const info = getEquipmentInfo(item);
      if (info && info.type === 'weapon') {
        const key = info.name || item;
        const entry = packCounts.get(key) || { info, count: 0 };
        entry.count += 1;
        packCounts.set(key, entry);
      }
    }

    for (const [name, { info, count }] of packCounts.entries()) {
      list.push({
        name: info.name || name,
        stat: info.stat,
        isEquipped: false,
        count
      });
    }
    return list;
  });

  const availableArmors = $derived.by(() => {
    const list = [];
    const equipped = getEquipmentInfo(gameState.player.armor);
    list.push({
      name: gameState.player.armor,
      stat: equipped?.stat || `+${gameState.player.def} DEF`,
      isEquipped: true,
      count: 1
    });

    const packCounts = new Map();
    for (const item of gameState.player.inventory) {
      const info = getEquipmentInfo(item);
      if (info && info.type === 'armor') {
        const key = info.name || item;
        const entry = packCounts.get(key) || { info, count: 0 };
        entry.count += 1;
        packCounts.set(key, entry);
      }
    }

    for (const [name, { info, count }] of packCounts.entries()) {
      list.push({
        name: info.name || name,
        stat: info.stat,
        isEquipped: false,
        count
      });
    }
    return list;
  });

  function getItemIcon(item) {
    const l = item.toLowerCase();
    if (l.includes('pickaxe')) return '⛏️';
    if (l.includes('sword') || l.includes('blade') || l.includes('dagger') || l.includes('club')) return '⚔️';
    if (l.includes('armor') || l.includes('tunic') || l.includes('shield') || l.includes('chainmail') || l.includes('plate')) return '🛡️';
    if (l.includes('potion') || l.includes('elixir')) return '🧪';
    if (l.includes('scroll')) return '📜';
    if (l.includes('leaflet')) return '📄';
    if (l.includes('raft')) return '🛶';
    if (l.includes('hookshot')) return '🪝';
    if (l.includes('bracelet')) return '💍';
    if (l.includes('key')) return '🗝️';
    return '📦';
  }

  function getOverworldCell(x, y) {
    const isPlayer = gameState.player.inDungeon === null && gameState.player.x === x && gameState.player.y === y;
    const explored = gameState.exploredOverworld[y] && gameState.exploredOverworld[y][x];
    const cell = gameState.overworld[y][x];

    return {
      gridNum: cell.gridNum || (y * 16 + x + 1),
      x, y,
      isPlayer,
      explored,
      type: cell.type,
      dungeonId: cell.dungeonId,
      name: cell.name
    };
  }

  function getDungeonCell(dx, dy) {
    if (!dungeonId) return null;
    const isPlayer = gameState.player.inDungeon === dungeonId && gameState.player.dungeonX === dx && gameState.player.dungeonY === dy;
    const explored = gameState.exploredDungeons[dungeonId] && gameState.exploredDungeons[dungeonId][dy] && gameState.exploredDungeons[dungeonId][dy][dx];
    const room = dungeonInfo ? dungeonInfo.rooms[dy][dx] : null;

    return {
      gridNum: room?.gridNum || (dy * 3 + dx + 1),
      dx, dy,
      isPlayer,
      explored,
      isEntry: room?.isEntry,
      hasEnemy: room?.enemy && room.enemy.hp > 0,
      hasItems: room?.items && room.items.length > 0,
      name: room?.name || "Room"
    };
  }
</script>

{#if showInventory}
  <!-- INVENTORY VIEW (Takes priority over Map) -->
  <div class="game-aux-box" id="game-inventory-box">
    <div class="aux-header">
      <span class="aux-title">🎒 Equipment & Backpack Inventory</span>
      <span class="aux-hint">Type 'i' to close</span>
    </div>
    <div class="inventory-split-layout">
      <!-- LEFT 2/3: Backpack Items Grid & Spells -->
      <div class="inv-left-pane">
        <div class="inv-subpane">
          <div class="pane-header">📦 Backpack Items</div>
          {#if groupedInventory.length > 0}
            <div class="backpack-grid">
              {#each groupedInventory as item}
                <div class="backpack-card">
                  <span class="backpack-card-icon">{getItemIcon(item.name)}</span>
                  <span class="backpack-card-name">
                    {item.name}
                    {#if item.count > 1}
                      <span class="item-count">x{item.count}</span>
                    {/if}
                  </span>
                </div>
              {/each}
            </div>
          {:else}
            <span class="empty-hint">Backpack is empty</span>
          {/if}
        </div>

        <div class="inv-subpane">
          <div class="pane-header">✨ Known Spells</div>
          {#if gameState.player.spells.length > 0}
            <div class="spells-list">
              {#each gameState.player.spells as spell}
                <span class="spell-chip">⚡ {spell}</span>
              {/each}
            </div>
          {:else}
            <span class="empty-hint">None (find and read scrolls to learn spells)</span>
          {/if}
        </div>
      </div>

      <!-- RIGHT 1/3: Weapons (top) and Armor (bottom) -->
      <div class="inv-right-pane">
        <!-- WEAPONS (TOP) -->
        <div class="equip-col-box" id="weapons-col-box">
          <div class="equip-col-header">⚔️ Weapons</div>
          <table class="equip-table">
            <tbody>
              {#each availableWeapons as item}
                <tr class={item.isEquipped ? 'row-equipped' : ''}>
                  <td class="col-title">
                    <span class="item-name">{item.name}</span>
                    {#if item.count > 1}
                      <span class="item-count">x{item.count}</span>
                    {/if}
                    {#if item.isEquipped}
                      <span class="eq-badge">[EQUIPPED]</span>
                    {/if}
                  </td>
                  <td class="col-stat">{item.stat}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- ARMOR (BOTTOM) -->
        <div class="equip-col-box" id="armors-col-box">
          <div class="equip-col-header">🛡️ Armor</div>
          <table class="equip-table">
            <tbody>
              {#each availableArmors as item}
                <tr class={item.isEquipped ? 'row-equipped' : ''}>
                  <td class="col-title">
                    <span class="item-name">{item.name}</span>
                    {#if item.count > 1}
                      <span class="item-count">x{item.count}</span>
                    {/if}
                    {#if item.isEquipped}
                      <span class="eq-badge">[EQUIPPED]</span>
                    {/if}
                  </td>
                  <td class="col-stat">{item.stat}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
{:else if showMap}
  <!-- MAP VIEW (With Vertical Legend on Right) -->
  <div class="game-aux-box" id="game-map-box">
    <div class="aux-header">
      {#if dungeonInfo}
        <span class="aux-title">Dungeon {dungeonId} Map: {dungeonInfo.name}</span>
      {:else}
        <span class="aux-title">Overworld Map</span>
      {/if}
      <span class="aux-hint">Type 'map' to close</span>
    </div>

    <div class="map-layout">
      <!-- MAP GRID (LEFT) -->
      <div class="map-grid-area">
        {#if dungeonInfo}
          <!-- 3x3 Dungeon Sub-Map -->
          <div class="dungeon-grid">
            {#each [0, 1, 2] as dy}
              <div class="grid-row">
                {#each [0, 1, 2] as dx}
                  {@const cell = getDungeonCell(dx, dy)}
                  <div
                    class="dungeon-cell"
                    class:explored={cell?.explored}
                    class:unexplored={!cell?.explored}
                    class:player-cell={cell?.isPlayer}
                    title={cell?.explored ? `[${cell?.gridNum}] ${cell?.name} (${dx},${dy})` : 'Unexplored Chamber'}
                  >
                    {#if !cell?.explored}
                      <span class="fog"> </span>
                    {:else if cell?.isPlayer}
                      <span class="player-icon">@</span>
                    {:else if cell?.isEntry}
                      <span class="entry-icon">E</span>
                    {:else if cell?.hasEnemy}
                      <span class="enemy-icon">☠</span>
                    {:else if cell?.hasItems}
                      <span class="item-icon">★</span>
                    {:else}
                      <span class="empty-icon">.</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {:else}
          <!-- 16x8 Overworld Grid -->
          <div class="overworld-grid">
            {#each [0, 1, 2, 3, 4, 5, 6, 7] as y}
              <div class="grid-row">
                {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as x}
                  {@const cell = getOverworldCell(x, y)}
                  <div
                    class="map-cell"
                    class:explored={cell.explored}
                    class:unexplored={!cell.explored}
                    class:player-cell={cell.isPlayer}
                    class:cell-house={cell.explored && cell.type === 'H'}
                    class:cell-dungeon={cell.explored && cell.dungeonId !== null}
                    class:cell-mountain={cell.explored && cell.type === '^'}
                    class:cell-ocean={cell.explored && cell.type === '~'}
                    class:cell-forest={cell.explored && cell.type === 'F'}
                    class:cell-plains={cell.explored && cell.type === '.'}
                    title={cell.explored ? `[${cell.gridNum}] ${cell.name} (${x},${y})` : `Fog (${x},${y})`}
                  >
                    {#if !cell.explored}
                      <span class="fog"> </span>
                    {:else if cell.isPlayer}
                      <span class="player-icon">@</span>
                    {:else if cell.dungeonId !== null}
                      <span class="dungeon-num">D{cell.dungeonId}</span>
                    {:else if cell.type === 'H'}
                      <span>H</span>
                    {:else if cell.type === '^'}
                      <span>▲</span>
                    {:else if cell.type === '~'}
                      <span>~</span>
                    {:else if cell.type === 'F'}
                      <span>♣</span>
                    {:else}
                      <span>.</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- VERTICAL LEGEND (RIGHT, TOP-ALIGNED) -->
      <div class="vertical-legend">
        <span class="legend-header">LEGEND</span>
        {#if dungeonInfo}
          <div class="legend-item"><strong class="player-icon">[@]</strong> You</div>
          <div class="legend-item"><strong class="entry-icon">[E]</strong> Ladder</div>
          <div class="legend-item"><strong class="enemy-icon">[☠]</strong> Enemy</div>
          <div class="legend-item"><strong class="item-icon">[★]</strong> Treasure</div>
          <div class="legend-item"><strong class="empty-icon">[.]</strong> Explored</div>
          <div class="legend-item"><strong class="fog">[ ]</strong> Fog of War</div>
        {:else}
          <div class="legend-item"><strong class="player-icon">[@]</strong> You</div>
          <div class="legend-item"><strong class="cell-dungeon">[D]</strong> Dungeon 1-9</div>
          <div class="legend-item"><strong>[H]</strong> House</div>
          <div class="legend-item"><strong>[▲]</strong> Mountain</div>
          <div class="legend-item"><strong>[~]</strong> Ocean</div>
          <div class="legend-item"><strong>[♣]</strong> Forest</div>
          <div class="legend-item"><strong>[.]</strong> Plains</div>
          <div class="legend-item"><strong class="fog">[ ]</strong> Fog of War</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .game-aux-box {
    background: #080d08;
    border: 1px solid #1f501f;
    border-radius: 8px;
    padding: 0.8rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-top: 0.75rem;
    font-family: 'Courier New', Courier, monospace;
    color: #33ff33;
    text-shadow: 0 0 4px rgba(51, 255, 51, 0.6);
  }
  .aux-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 600;
    border-bottom: 1px solid #1f501f;
    padding-bottom: 0.4rem;
  }
  .aux-title {
    color: #33ff33;
    letter-spacing: 0.5px;
  }
  .aux-hint {
    font-size: 0.75rem;
    color: #1f801f;
  }

  /* INVENTORY STYLING (Split Layout: Left 2/3 Grid, Right 1/3 Weapons/Armor Column) */
  .inventory-split-layout {
    display: flex;
    gap: 1rem;
    align-items: stretch;
  }
  @media (max-width: 680px) {
    .inventory-split-layout {
      flex-direction: column;
    }
  }
  .inv-left-pane {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }
  .inv-right-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 210px;
  }
  .inv-subpane {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid #1f501f;
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .pane-header {
    font-size: 0.8rem;
    font-weight: bold;
    color: #88ff88;
    border-bottom: 1px dashed rgba(31, 80, 31, 0.6);
    padding-bottom: 0.25rem;
  }
  .backpack-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
    gap: 0.45rem;
  }
  .backpack-card {
    background: #080d08;
    border: 1px solid #1f501f;
    border-radius: 5px;
    padding: 0.4rem 0.35rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.2rem;
    font-size: 0.75rem;
    color: #88ff88;
    word-break: break-word;
  }
  .backpack-card-icon {
    font-size: 1.1rem;
  }
  .backpack-card-name {
    line-height: 1.15;
  }
  .spells-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .spell-chip {
    background: #0d1a0d;
    border: 1px solid #33ff33;
    color: #33ff33;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }
  .equip-col-box {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid #1f501f;
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .equip-col-header {
    font-size: 0.8rem;
    font-weight: bold;
    color: #33ff33;
    border-bottom: 1px solid #1f501f;
    padding-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .equip-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    font-family: 'Courier New', Courier, monospace;
  }
  .equip-table tr {
    border-bottom: 1px dashed rgba(31, 80, 31, 0.3);
  }
  .equip-table tr:last-child {
    border-bottom: none;
  }
  .equip-table td {
    padding: 0.3rem 0;
    vertical-align: middle;
  }
  .col-title {
    text-align: left;
    color: #88ff88;
  }
  .col-stat {
    text-align: right;
    white-space: nowrap;
    color: #33ff33;
    font-weight: bold;
    padding-left: 0.5rem;
  }
  .row-equipped .item-name {
    color: #33ff33;
    font-weight: bold;
  }
  .eq-badge {
    font-size: 0.65rem;
    background: #0a290a;
    color: #33ff33;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #1f501f;
    margin-left: 4px;
    vertical-align: middle;
  }
  .item-count {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: bold;
    color: #ffcc00;
    background: rgba(255, 204, 0, 0.15);
    border: 1px solid rgba(255, 204, 0, 0.4);
    padding: 0 4px;
    border-radius: 4px;
    margin-left: 4px;
    vertical-align: middle;
  }
  .empty-hint {
    color: #1f801f;
    font-style: italic;
    font-size: 0.8rem;
  }

  /* MAP SIDE-BY-SIDE LAYOUT */
  .map-layout {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
  }
  .map-grid-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0, 0, 0, 0.4);
    padding: 0.6rem;
    border-radius: 6px;
    border: 1px solid #1f501f;
    overflow-x: auto;
  }

  /* OVERWORLD GRID (16x8) */
  .grid-row {
    display: flex;
    gap: 3px;
    margin-bottom: 3px;
  }
  .map-cell {
    width: 22px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-family: 'Courier New', Courier, monospace;
    border-radius: 2px;
    user-select: none;
    background: #050d05;
    color: #1f501f;
    border: 1px solid transparent;
  }
  .map-cell.unexplored {
    background: #050d05;
    color: transparent;
  }
  .map-cell.explored {
    background: #0d1a0d;
    border-color: #163816;
    color: #33ff33;
  }
  .map-cell.player-cell, .dungeon-cell.player-cell {
    background: #33ff33 !important;
    color: #080d08 !important;
    font-weight: bold;
    box-shadow: 0 0 10px #33ff33;
    border-color: #ffffff !important;
    z-index: 2;
  }
  .cell-dungeon {
    color: #ffaa33 !important;
    font-weight: bold;
  }
  .dungeon-num {
    font-size: 0.65rem;
  }
  .cell-house {
    color: #38b6ff !important;
    font-weight: bold;
  }
  .cell-mountain {
    color: #aaaaaa !important;
  }
  .cell-ocean {
    color: #38b6ff !important;
  }
  .cell-forest {
    color: #22cc22 !important;
  }
  .cell-plains {
    color: #88ff88 !important;
  }

  /* DUNGEON GRID (3x3) */
  .dungeon-grid {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
  }
  .dungeon-cell {
    width: 64px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-family: 'Courier New', Courier, monospace;
    border-radius: 4px;
    margin: 3px;
    border: 1px solid #1f501f;
    background: #0d1a0d;
    color: #33ff33;
  }
  .dungeon-cell.unexplored {
    background: #050d05;
    border-color: #0f2b0f;
    color: transparent;
  }
  .entry-icon {
    color: #38b6ff;
    font-weight: bold;
  }
  .enemy-icon {
    color: #ff4444;
    font-weight: bold;
  }
  .item-icon {
    color: #ffdd44;
    font-weight: bold;
  }
  .fog {
    color: transparent;
  }

  /* VERTICAL LEGEND (RIGHT, ALIGNED TO TOP) */
  .vertical-legend {
    align-self: flex-start;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.8rem;
    border-left: 1px dashed #1f501f;
    font-size: 0.75rem;
    color: #88ff88;
    white-space: nowrap;
  }
  .legend-header {
    font-weight: bold;
    color: #33ff33;
    letter-spacing: 1px;
    border-bottom: 1px solid #1f501f;
    padding-bottom: 0.2rem;
    margin-bottom: 0.2rem;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  /* LIGHT MODE THEME OVERRIDES FOR AUXILIARY DISPLAY */
  :global(html[data-theme="light"] body.game-active) .game-aux-box {
    background: #ffffff !important;
    border-color: #16a34a !important;
    color: #14532d !important;
    text-shadow: none !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
  }
  :global(html[data-theme="light"] body.game-active) .aux-header {
    border-bottom-color: #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) .aux-title {
    color: #14532d !important;
  }
  :global(html[data-theme="light"] body.game-active) .aux-hint {
    color: #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) .map-grid-area {
    background: #f8fafc !important;
    border-color: #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) .vertical-legend {
    border-left-color: #16a34a !important;
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) .legend-header {
    border-bottom-color: #16a34a !important;
    color: #14532d !important;
  }
  :global(html[data-theme="light"] body.game-active) .map-cell.explored {
    background: #f0fdf4 !important;
    border-color: #bbf7d0 !important;
    color: #14532d !important;
  }
  :global(html[data-theme="light"] body.game-active) .map-cell.unexplored {
    background: #f8fafc !important;
  }
  :global(html[data-theme="light"] body.game-active) .map-cell.player-cell,
  :global(html[data-theme="light"] body.game-active) .dungeon-cell.player-cell {
    background: #16a34a !important;
    color: #ffffff !important;
    box-shadow: 0 0 8px #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) .dungeon-cell.explored {
    background: #f0fdf4 !important;
    border-color: #86efac !important;
    color: #14532d !important;
  }
  :global(html[data-theme="light"] body.game-active) .dungeon-cell.unexplored {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
  }
  :global(html[data-theme="light"] body.game-active) .inv-subpane,
  :global(html[data-theme="light"] body.game-active) .equip-col-box {
    background: #f8fafc !important;
    border-color: #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) .pane-header,
  :global(html[data-theme="light"] body.game-active) .equip-col-header {
    color: #14532d !important;
    border-bottom-color: #86efac !important;
  }
  :global(html[data-theme="light"] body.game-active) .backpack-card {
    background: #ffffff !important;
    border-color: #16a34a !important;
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) .spell-chip {
    background: #f0fdf4 !important;
    border-color: #16a34a !important;
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) .col-title {
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) .col-stat {
    color: #14532d !important;
  }
  :global(html[data-theme="light"] body.game-active) .row-equipped .item-name {
    color: #14532d !important;
  }
  :global(html[data-theme="light"] body.game-active) .eq-badge {
    background: #dcfce7 !important;
    color: #166534 !important;
    border-color: #86efac !important;
  }
  :global(html[data-theme="light"] body.game-active) .empty-hint {
    color: #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) .item-count,
  :global(html[data-theme="light"] body.dick-active) .item-count {
    color: #b45309 !important;
    background: #fef3c7 !important;
    border-color: #f59e0b !important;
  }
</style>
