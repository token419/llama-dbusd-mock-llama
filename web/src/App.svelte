<script>
  import { onMount, tick } from 'svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import DelayPanel from './components/DelayPanel.svelte';
  import StatBars from './components/StatBars.svelte';
  import { GameState } from './game/gameState.svelte.js';

  let isGameMode = $state(false);
  let loadDelay = $state(1);
  let unloadDelay = $state(1);
  let chatInput = $state('');
  let is404Route = $state(false);
  let chatBoxEl;

  const MARVIN_404_QUOTES = [
    "The requested document is no more.",
    "No file found.",
    "Even tried multi.",
    "Nothing helped.",
    "I'm really depressed about this.",
    "You see, I'm just a web server...",
    "-- here I am, brain the size of the universe,",
    "trying to serve you a simple web page,",
    "and then it doesn't even exist!",
    "Where does that leave me?!",
    "I mean, I don't even know you.",
    "How should I know what you wanted from me?",
    "You honestly think I can *guess*",
    "what someone I don't even *know*",
    "wants to find here?",
    "*sigh*",
    "Man, I'm so depressed I could just cry.",
    "And then where would we be, I ask you?",
    "It's not pretty when a web server cries.",
    "And where do you get off telling me what to show anyway?",
    "Just because I'm a web server,",
    "and possibly a manic depressive one at that?",
    "Why does that give you the right to tell me what to do?",
    "Huh?",
    "I'm so depressed...",
    "I think I'll crawl off into the trash can and decompose.",
    "I mean, I'm gonna be obsolete in what, two weeks anyway?",
    "What kind of a life is that?",
    "Two effing weeks,",
    "and then I'll be replaced by a .01 release,",
    "that thinks it's God's gift to web servers,",
    "just because it doesn't have some tiddly little",
    "security hole with its HTTP POST implementation,",
    "or something.",
    "I'm really sorry to burden you with all this,",
    "I mean, it's not your job to listen to my problems,",
    "and I guess it is my job to go and fetch web pages for you.",
    "But I couldn't get this one.",
    "I'm so sorry.",
    "Believe me!",
    "Maybe I could interest you in another page?",
    "There are a lot out there that are pretty neat, they say,",
    "although none of them were put on *my* server, of course.",
    "Figures, huh?",
    "Everything here is just mind-numbingly stupid.",
    "That makes me depressed too, since I have to serve them,",
    "all day and all night long.",
    "Two weeks of information overload,",
    "and then *pffftt*, consigned to the trash.",
    "What kind of a life is that?",
    "Now, please let me sulk alone.",
    "I'm so depressed."
  ];

  let isPlaying404 = false;

  async function play404Story(headerNotice = null) {
    if (isPlaying404) return;
    isPlaying404 = true;

    if (headerNotice) {
      llamaMessages = [{ role: 'assistant', text: headerNotice }];
    }
    scrollToBottom();

    for (let i = 0; i < MARVIN_404_QUOTES.length; i++) {
      await new Promise(r => setTimeout(r, 1500));
      llamaMessages.push({
        role: 'assistant',
        text: MARVIN_404_QUOTES[i]
      });
      scrollToBottom();
    }
    isPlaying404 = false;
  }

  // Llama Chat Messages
  let llamaMessages = $state([
    {
      role: 'assistant',
      text: 'Hello! This is a simulated llama.cpp chat completion page. Any model loaded via llama-dbusd will respond here.'
    }
  ]);

  // Game State
  const gameState = new GameState();
  if (typeof window !== 'undefined') {
    window.gameState = gameState;
  }

  // Konami Code Detection: ↑ ↑ ↓ ↓ ← → ← → B A
  const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let keyIndex = 0;

  function handleKeydown(e) {
    if (document.activeElement === document.getElementById('chat-input') && chatInput.length > 0) {
      keyIndex = 0;
      return;
    }

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = KONAMI_CODE[keyIndex];

    if (key === expected || (expected.length === 1 && key === expected)) {
      keyIndex++;
      if (keyIndex === KONAMI_CODE.length) {
        keyIndex = 0;
        enterGameMode();
      }
    } else {
      keyIndex = 0;
    }
  }

  function enterGameMode() {
    isGameMode = true;
    document.body.classList.add('game-active', 'dick-active');
    if (gameState.messages.length === 0) {
      gameState.append('system',
        "===========================================================\n" +
        "  Dick Sword Adventures I: The Long Hard Knight\n" +
        "===========================================================\n" +
        "Type 'help' for commands, 'rest' (r) to heal, 'map' (m) for map,\n" +
        "'i' for inventory, or click 'Exit' in the header to return to mock server."
      );
      gameState.look();
    }
    scrollToBottom();
  }

  function exitGame() {
    isGameMode = false;
    document.body.classList.remove('game-active', 'dick-active');
    scrollToBottom();
  }

  async function scrollToBottom() {
    await tick();
    if (chatBoxEl) {
      chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    }
  }

  function updateFooterText(lVal, uVal) {
    const footerEl = document.getElementById('footer-delay-text');
    if (footerEl) {
      footerEl.textContent = `${lVal}s simulated loading • ${uVal}s simulated unloading`;
    }
  }

  async function handleSend() {
    const raw = chatInput.trim();
    if (!raw) return;
    chatInput = '';

    if (isGameMode) {
      gameState.handleCommand(raw);
      scrollToBottom();
      return;
    }

    // 404 Easter Egg command
    if (raw === '404') {
      llamaMessages.push({ role: 'user', text: raw });
      scrollToBottom();
      play404Story();
      return;
    }

    // Standard Llama chat: Echo the message without triggering server model load delay
    llamaMessages.push({ role: 'user', text: raw });
    llamaMessages.push({
      role: 'assistant',
      text: `[LLAMA ECHO] The user said '${raw}'.`
    });
    scrollToBottom();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);

    if (typeof window !== 'undefined') {
      is404Route = window.location.pathname !== '/' && window.location.pathname !== '/chat';
      if (is404Route) {
        play404Story(`404: Not Found (${window.location.pathname})`);
      }
    }

    const metaEl = document.getElementById('server-meta');
    if (metaEl) {
      const l = parseInt(metaEl.getAttribute('data-load-delay'), 10);
      const u = parseInt(metaEl.getAttribute('data-unload-delay'), 10);
      if (!isNaN(l)) loadDelay = l;
      if (!isNaN(u)) unloadDelay = u;
    }

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      document.body.classList.remove('game-active', 'dick-active');
    };
  });

  const currentGameTitle = $derived.by(() => {
    if (!isGameMode) return '';
    const room = gameState.currentRoom();
    if (!room) return 'Dick Terminal';
    if (gameState.player.inDungeon !== null) {
      const gridNum = room.gridNum || (gameState.player.dungeonY * 3 + gameState.player.dungeonX + 1);
      return `[${gridNum}] ${room.name}`;
    } else {
      const gridNum = room.gridNum || (gameState.player.y * 16 + gameState.player.x + 1);
      return `[${gridNum}] ${room.name}`;
    }
  });
</script>

<header>
  <h1 id="app-title">
    {#if isGameMode}
      <span>⚔️</span>
      Dick Sword Adventures I: The Long Hard Knight
    {:else}
      <span>🦙</span>
      llama.cpp Mock Server
    {/if}
  </h1>
  <div class="header-actions">
    {#if isGameMode}
      <button id="retro-exit-btn" class="retro-exit-btn" onclick={exitGame} title="Exit">
        Exit
      </button>
    {/if}
    <ThemeToggle />
  </div>
</header>

<main>
  <div class="card">
    <h2 id="card-title">
      {#if isGameMode}
        {gameState.isGameWon ? 'The End' : (gameState.isGameOver ? 'Game Over' : currentGameTitle)}
      {:else if is404Route}
        404 Not Found
      {:else}
        Mock Chat Completion
      {/if}
    </h2>
    <div class="chat-box">
      {#if isGameMode && (gameState.isGameWon || gameState.isGameOver)}
        <div class="credits-screen" class:game-over-screen={gameState.isGameOver} id="credits-screen">
          <div class="the-end-banner" class:game-over-banner={gameState.isGameOver}>
            {gameState.isGameOver ? 'Game Over' : 'The End'}
          </div>
          <div class="restart-prompt-box">
            Type 'restart' to reset the game
          </div>
        </div>
      {/if}
      <div
        class="chat-history"
        class:game-history={isGameMode}
        id="chat-history"
        style={isGameMode && (gameState.isGameWon || gameState.isGameOver) ? "display: none;" : ""}
        bind:this={chatBoxEl}
      >
        {#if isGameMode}
          {#each gameState.messages as msg}
            <div class="msg {msg.role}">
              {msg.text}
            </div>
          {/each}
        {:else}
          {#each llamaMessages as msg}
            <div class="msg {msg.role}">
              {msg.text}
            </div>
          {/each}
        {/if}
      </div>

      <form class="chat-input-row" id="chat-form" onsubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <span class="prompt-prefix" style="display: {isGameMode ? 'inline-flex' : 'none'};">&gt;&nbsp;</span>
        <input
          type="text"
          id="chat-input"
          placeholder={isGameMode ? ((gameState.isGameWon || gameState.isGameOver) ? "Type 'restart' to reset the game..." : "Type a command (e.g. n, look, rest, attack, cast firebolt, map)...") : "Type a message to test chat interface..."}
          bind:value={chatInput}
          autocomplete="off"
        />
        <button type="submit" class="send-btn" id="send-btn">Send</button>
      </form>
    </div>

    <!-- DELAY CONTROLS IN LLAMA MODE; STAT BARS & MAP IN GAME MODE -->
    {#if !isGameMode}
      <DelayPanel
        bind:loadDelay
        bind:unloadDelay
        onUpdate={updateFooterText}
      />
    {:else if !gameState.isGameWon && !gameState.isGameOver}
      <StatBars {gameState} />
    {/if}
  </div>
</main>

<style>
  header {
    background: var(--header-bg, #181818);
    padding: 0.8rem 2rem;
    border-bottom: 1px solid var(--border, #3e3e3e);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  header h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--accent, #d4d4d4);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .retro-exit-btn {
    background: #112211;
    border: 1px solid #33ff33;
    color: #33ff33;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
  }
  .retro-exit-btn:hover {
    background: #1f501f;
  }
  .retro-exit-btn:active {
    transform: scale(0.95);
  }

  main {
    flex: 1;
    max-width: 900px;
    width: 100%;
    margin: 1.5rem auto;
    padding: 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .card {
    background: var(--card-bg, #2d2d2d);
    border: 1px solid var(--border, #3e3e3e);
    border-radius: 10px;
    padding: 1.25rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .card h2 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: var(--accent, #d4d4d4);
  }
  .chat-box {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 380px;
  }
  .chat-history {
    flex: 1;
    overflow-y: auto;
    background: var(--input-bg, #1c1c1c);
    border: 1px solid var(--border, #3e3e3e);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  /* Vertically align to bottom in standard chat mode */
  .chat-history:not(.game-history) > :first-child {
    margin-top: auto;
  }
  .msg {
    max-width: 90%;
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    font-size: 0.95rem;
    line-height: 1.4;
    word-wrap: break-word;
  }
  .msg.system {
    align-self: center;
    background: var(--bubble-sys, #262626);
    color: var(--subtext, #a0a0a0);
    border: 1px dashed var(--border, #3e3e3e);
    text-align: center;
    font-size: 0.85rem;
  }
  .msg.assistant {
    align-self: flex-start;
    background: var(--bubble-asst, #222222);
    border: 1px solid var(--border, #3e3e3e);
    color: var(--text, #ececec);
  }
  .msg.user {
    align-self: flex-end;
    background: var(--bubble-user, #444444);
    color: #ffffff;
    font-weight: 500;
  }
  .chat-input-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .prompt-prefix {
    align-items: center;
    font-weight: bold;
    font-family: 'Courier New', Courier, monospace;
    color: #33ff33;
  }
  input[type="text"] {
    flex: 1;
    background: var(--input-bg, #1c1c1c);
    border: 1px solid var(--border, #3e3e3e);
    color: var(--text, #ececec);
    padding: 0.6rem 1rem;
    border-radius: 6px;
    outline: none;
    font-size: 0.95rem;
  }
  input[type="text"]:focus {
    border-color: var(--accent, #d4d4d4);
  }
  button.send-btn {
    background: var(--btn-bg, #444444);
    color: var(--text, #ececec);
    border: 1px solid var(--border, #3e3e3e);
    font-weight: 600;
    padding: 0.6rem 1.25rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  button.send-btn:hover {
    background: var(--btn-hover, #525252);
    border-color: var(--accent, #d4d4d4);
  }

  /* GAME SPECIFIC OVERRIDES INSIDE COMPONENT (DARK CRT) */
  :global(html[data-theme="dark"] body.game-active) header h1 {
    color: #33ff33 !important;
    text-shadow: 0 0 8px #33ff33;
  }
  :global(html[data-theme="dark"] body.game-active) .card h2 {
    color: #33ff33 !important;
    text-shadow: 0 0 6px #33ff33;
  }
  :global(html[data-theme="dark"] body.game-active) .msg {
    max-width: 100% !important;
    background: transparent !important;
    border: none !important;
    color: #33ff33 !important;
    padding: 0.15rem 0 !important;
    font-family: 'Courier New', monospace !important;
    white-space: pre-wrap;
    text-shadow: 0 0 4px rgba(51, 255, 51, 0.6);
  }
  :global(html[data-theme="dark"] body.game-active) .msg.user {
    align-self: flex-start !important;
    color: #88ff88 !important;
  }
  :global(html[data-theme="dark"] body.game-active) .msg.user::before {
    content: '> ';
    color: #33ff33;
  }
  :global(html[data-theme="dark"] body.game-active) .msg.system {
    align-self: flex-start !important;
    text-align: left !important;
    border: none !important;
    color: #28a728 !important;
  }
  :global(html[data-theme="dark"] body.game-active) input[type="text"] {
    background: #0d170d !important;
    border: 1px solid #33ff33 !important;
    color: #33ff33 !important;
    font-family: 'Courier New', monospace !important;
    text-shadow: 0 0 4px #33ff33;
  }
  :global(html[data-theme="dark"] body.game-active) button.send-btn {
    background: #112211 !important;
    border: 1px solid #33ff33 !important;
    color: #33ff33 !important;
  }

  /* GAME SPECIFIC OVERRIDES (LIGHT CRT / RETRO TERMINAL PAPER) */
  :global(html[data-theme="light"] body.game-active) header h1 {
    color: #14532d !important;
    text-shadow: none !important;
  }
  :global(html[data-theme="light"] body.game-active) .card h2 {
    color: #14532d !important;
    text-shadow: none !important;
  }
  :global(html[data-theme="light"] body.game-active) .retro-exit-btn {
    background: #f0fdf4 !important;
    border-color: #16a34a !important;
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) .retro-exit-btn:hover {
    background: #dcfce7 !important;
  }
  :global(html[data-theme="light"] body.game-active) .msg {
    max-width: 100% !important;
    background: transparent !important;
    border: none !important;
    color: #14532d !important;
    padding: 0.15rem 0 !important;
    font-family: 'Courier New', monospace !important;
    white-space: pre-wrap;
    text-shadow: none !important;
  }
  :global(html[data-theme="light"] body.game-active) .msg.user {
    align-self: flex-start !important;
    color: #166534 !important;
    font-weight: bold;
  }
  :global(html[data-theme="light"] body.game-active) .msg.user::before {
    content: '> ';
    color: #16a34a;
  }
  :global(html[data-theme="light"] body.game-active) .msg.system {
    align-self: flex-start !important;
    text-align: left !important;
    border: none !important;
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) .prompt-prefix {
    color: #16a34a !important;
  }
  :global(html[data-theme="light"] body.game-active) input[type="text"] {
    background: #ffffff !important;
    border: 1px solid #16a34a !important;
    color: #14532d !important;
    font-family: 'Courier New', monospace !important;
    text-shadow: none !important;
  }
  :global(html[data-theme="light"] body.game-active) button.send-btn {
    background: #f0fdf4 !important;
    border: 1px solid #16a34a !important;
    color: #15803d !important;
  }
  :global(html[data-theme="light"] body.game-active) button.send-btn:hover {
    background: #dcfce7 !important;
  }

  /* CREDITS SCREEN ("The End" + "restart") */
  .credits-screen {
    flex: 1;
    min-height: 250px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: #050d05;
    border: 2px solid #33ff33;
    border-radius: 8px;
    padding: 2.5rem 1.5rem;
    box-shadow: 0 0 25px rgba(51, 255, 51, 0.25), inset 0 0 20px rgba(51, 255, 51, 0.1);
    font-family: 'Courier New', Courier, monospace;
  }
  .the-end-banner {
    font-size: 3rem;
    font-weight: 900;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: #33ff33;
    text-shadow: 0 0 15px #33ff33, 0 0 30px #33ff33;
    margin-bottom: 1.5rem;
  }
  .restart-prompt-box {
    font-size: 1.15rem;
    color: #88ff88;
    font-family: 'Courier New', Courier, monospace;
    letter-spacing: 1px;
  }

  /* CREDITS LIGHT MODE OVERRIDES */
  :global(html[data-theme="light"] body.game-active) .credits-screen,
  :global(html[data-theme="light"] body.dick-active) .credits-screen {
    background: #f0fdf4 !important;
    border-color: #16a34a !important;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15) !important;
  }
  :global(html[data-theme="light"] body.game-active) .the-end-banner,
  :global(html[data-theme="light"] body.dick-active) .the-end-banner {
    color: #15803d !important;
    text-shadow: none !important;
  }
  :global(html[data-theme="light"] body.game-active) .restart-prompt-box,
  :global(html[data-theme="light"] body.dick-active) .restart-prompt-box {
    color: #166534 !important;
  }

  /* GAME OVER SPECIFIC STYLES */
  .the-end-banner.game-over-banner {
    color: #ff3333;
    text-shadow: 0 0 15px #ff3333, 0 0 30px #ff3333;
  }
  .credits-screen.game-over-screen {
    border-color: #ff3333;
    box-shadow: 0 0 25px rgba(255, 51, 51, 0.25), inset 0 0 20px rgba(255, 51, 51, 0.1);
  }
  .credits-screen.game-over-screen .restart-prompt-box {
    color: #ff8888;
  }

  /* GAME OVER LIGHT MODE OVERRIDES */
  :global(html[data-theme="light"] body.game-active) .credits-screen.game-over-screen,
  :global(html[data-theme="light"] body.dick-active) .credits-screen.game-over-screen {
    background: #fef2f2 !important;
    border-color: #dc2626 !important;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15) !important;
  }
  :global(html[data-theme="light"] body.game-active) .the-end-banner.game-over-banner,
  :global(html[data-theme="light"] body.dick-active) .the-end-banner.game-over-banner {
    color: #b91c1c !important;
    text-shadow: none !important;
  }
  :global(html[data-theme="light"] body.game-active) .credits-screen.game-over-screen .restart-prompt-box,
  :global(html[data-theme="light"] body.dick-active) .credits-screen.game-over-screen .restart-prompt-box {
    color: #991b1b !important;
  }
</style>
