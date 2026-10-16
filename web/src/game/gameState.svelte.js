import { dungeons, createOverworldGrid, EQUIPMENT_INFO, getEquipmentInfo, getRandomOverworldEnemy } from './world.js';

export class GameState {
  player = $state({
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    atk: 4,
    def: 1,
    weapon: "Wooden Club",
    armor: "Cloth Tunic",
    inventory: ["leaflet"],
    spells: [],
    x: 7,
    y: 3,
    inDungeon: null, // null or 1..9
    dungeonX: 1,
    dungeonY: 2,
    inCombat: false,
    enemy: null,
    showMap: false,
    showInventory: false,
  });

  // 8 rows x 16 cols explored matrix
  exploredOverworld = $state(
    Array.from({ length: 8 }, () => Array(16).fill(false))
  );

  // Dungeons 1..9 (3x3 explored matrix each)
  exploredDungeons = $state({});

  overworld = $state(createOverworldGrid());
  dungeonData = $state(JSON.parse(JSON.stringify(dungeons)));
  messages = $state([]);

  lastSafeSpace = $state({
    inDungeon: null,
    x: 7,
    y: 3,
    dungeonX: 1,
    dungeonY: 2
  });

  previousSpace = $state({
    inDungeon: null,
    x: 7,
    y: 3,
    dungeonX: 1,
    dungeonY: 2
  });

  hasRestedInCurrentTile = $state(false);
  isGameWon = $state(false);
  isGameOver = $state(false);

  constructor() {
    for (let d = 1; d <= 9; d++) {
      this.exploredDungeons[d] = Array.from({ length: 3 }, () => Array(3).fill(false));
    }
    // Starting room explored
    this.exploredOverworld[this.player.y][this.player.x] = true;
  }

  append(role, text) {
    this.messages.push({ role, text });
  }

  currentRoom() {
    if (this.player.inDungeon !== null) {
      const d = this.dungeonData[this.player.inDungeon];
      return d.rooms[this.player.dungeonY][this.player.dungeonX];
    }
    return this.overworld[this.player.y][this.player.x];
  }

  look() {
    const room = this.currentRoom();
    let out = "";

    if (this.player.inDungeon !== null) {
      const d = this.dungeonData[this.player.inDungeon];
      const gridNum = room.gridNum || (this.player.dungeonY * 3 + this.player.dungeonX + 1);
      out += `\n[Dungeon ${this.player.inDungeon}: ${d.name}] [${gridNum}] ${room.name} (${this.player.dungeonX},${this.player.dungeonY})\n`;
    } else {
      const gridNum = room.gridNum || (this.player.y * 16 + this.player.x + 1);
      out += `\n[OVERWORLD] [${gridNum}] ${room.name} (${this.player.x},${this.player.y})\n`;
    }
    out += `${room.desc}\n`;

    if (room.items && room.items.length > 0) {
      out += `Items lying here: ${room.items.join(', ')}.\n`;
    }

    if (this.player.inDungeon === null && room.dungeonId) {
      out += `👉 DUNGEON DETECTED! Type 'enter' or 'enter dungeon' to explore.\n`;
    }

    if (this.player.inDungeon !== null && room.isEntry) {
      out += `🚪 Dungeon ladder here! Type 'exit' to return to Overworld.\n`;
    }

    if (room.enemy && room.enemy.hp > 0 && !this.player.inCombat) {
      this.previousSpace = { ...this.lastSafeSpace };
      this.player.inCombat = true;
      if (!room.enemy.maxHp) {
        room.enemy.maxHp = room.enemy.hp;
      }
      const maxHp = room.enemy.maxHp;
      this.player.enemy = { ...room.enemy, maxHp };
      out += `\n⚔️ ENEMY ENCOUNTER! A wild ${this.player.enemy.name} (HP: ${this.player.enemy.hp}/${maxHp}) attacks!\n`;
      out += `Combat Options: 'attack (a)', 'cast <spellname>', 'flee (f)'`;
    }

    const exits = [];
    if (this.player.inDungeon !== null) {
      if (this.player.dungeonY > 0) exits.push("North");
      if (this.player.dungeonY < 2) exits.push("South");
      if (this.player.dungeonX < 2) exits.push("East");
      if (this.player.dungeonX > 0) exits.push("West");
    } else {
      if (this.player.y > 0) exits.push("North");
      if (this.player.y < 7) exits.push("South");
      if (this.player.x < 15) exits.push("East");
      if (this.player.x > 0) exits.push("West");
    }
    out += `\nObvious exits: ${exits.join(', ')}.`;

    this.append('assistant', out);
  }

  toggleMap() {
    this.player.showMap = !this.player.showMap;
    if (this.player.showMap) {
      this.append('assistant', "🗺️ Map displayed below stats bars.");
    } else {
      this.append('assistant', "🗺️ Map hidden.");
    }
  }

  toggleInventory() {
    this.player.showInventory = !this.player.showInventory;
    if (this.player.showInventory) {
      this.append('assistant', "🎒 Inventory displayed below stats bars. (Type 'i' again to return to map / close)");
    } else {
      if (this.player.showMap) {
        this.append('assistant', "🎒 Inventory closed. Returning to Map view.");
      } else {
        this.append('assistant', "🎒 Inventory closed.");
      }
    }
  }

  resolveEnemyAttack() {
    if (!this.player.enemy || this.player.enemy.hp <= 0) return;

    const rawDmg = Math.max(1, this.player.enemy.atk - this.player.def);
    this.player.hp = Math.max(0, this.player.hp - rawDmg);
    this.append('assistant', `💥 The ${this.player.enemy.name} retaliates, striking you for ${rawDmg} damage!`);

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.isGameOver = true;
      this.player.inCombat = false;
      this.player.enemy = null;
      this.append('system',
        "\n===========================================================\n" +
        "                         Game Over\n" +
        "===========================================================\n" +
        "💀 You have succumbed to your injuries! Darkness consumes you.\n" +
        "Type 'restart' to reset the game.\n"
      );
    }
  }

  checkVictory() {
    if (this.player.enemy && this.player.enemy.hp <= 0) {
      this.append('assistant', `🏆 VICTORY! You defeated the ${this.player.enemy.name}! Gained ${this.player.enemy.exp} EXP!`);
      const room = this.currentRoom();
      if (room.enemy) room.enemy = null;
      this.player.inCombat = false;
      this.player.enemy = null;
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + 5);
      return true;
    }
    return false;
  }

  melee() {
    if (!this.player.inCombat) {
      this.append('assistant', "You swing your weapon through empty air. There are no enemies here.");
      return;
    }

    const dmg = Math.max(1, this.player.atk + Math.floor(Math.random() * 5));
    this.player.enemy.hp -= dmg;
    const room = this.currentRoom();
    if (room.enemy) room.enemy.hp = this.player.enemy.hp;
    this.append('assistant', `⚔️ You strike the ${this.player.enemy.name} with your ${this.player.weapon} for ${dmg} damage! (${this.player.enemy.hp} HP remaining)`);

    if (!this.checkVictory()) {
      this.resolveEnemyAttack();
    }
  }

  cast(spellName) {
    if (!this.player.spells.includes(spellName)) {
      this.append('assistant', `You do not know the spell '${spellName}'. You must find and read a spell scroll first!`);
      return;
    }

    if (spellName === 'heal') {
      if (this.player.mp < 15) {
        this.append('assistant', "Not enough mana! 'heal' requires 15 MP.");
        return;
      }
      this.player.mp -= 15;
      const healAmt = 40;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      this.append('assistant', `✨ You cast Heal! Restored ${healAmt} HP. (Current HP: ${this.player.hp}/${this.player.maxHp})`);
      if (this.player.inCombat) {
        this.resolveEnemyAttack();
      }
      return;
    }

    if (spellName === 'firebolt') {
      if (!this.player.inCombat) {
        this.append('assistant', "A small burst of sparks flies into the shadows. (Cast offensive spells in combat)");
        return;
      }
      if (this.player.mp < 10) {
        this.append('assistant', "Not enough mana! 'firebolt' requires 10 MP.");
        return;
      }
      this.player.mp -= 10;
      const dmg = 25 + Math.floor(Math.random() * 8);
      this.player.enemy.hp -= dmg;
      const room = this.currentRoom();
      if (room.enemy) room.enemy.hp = this.player.enemy.hp;
      this.append('assistant', `🔥 Firebolt erupts from your fingers, incinerating ${this.player.enemy.name} for ${dmg} magical fire damage!`);
      if (!this.checkVictory()) {
        this.resolveEnemyAttack();
      }
      return;
    }

    if (spellName === 'frost') {
      if (!this.player.inCombat) {
        this.append('assistant', "Ice crystals coat the stones around you.");
        return;
      }
      if (this.player.mp < 12) {
        this.append('assistant', "Not enough mana! 'frost' requires 12 MP.");
        return;
      }
      this.player.mp -= 12;
      const dmg = 18 + Math.floor(Math.random() * 6);
      this.player.enemy.hp -= dmg;
      const room = this.currentRoom();
      if (room.enemy) room.enemy.hp = this.player.enemy.hp;
      this.append('assistant', `❄️ Freezing frost chills the ${this.player.enemy.name} for ${dmg} ice damage! The enemy is FROZEN and misses its turn!`);
      this.checkVictory();
      return;
    }

    if (spellName === 'lightning') {
      if (!this.player.inCombat) {
        this.append('assistant', "Thunder claps overhead.");
        return;
      }
      if (this.player.mp < 20) {
        this.append('assistant', "Not enough mana! 'lightning' requires 20 MP.");
        return;
      }
      this.player.mp -= 20;
      const dmg = 45 + Math.floor(Math.random() * 15);
      this.player.enemy.hp -= dmg;
      const room = this.currentRoom();
      if (room.enemy) room.enemy.hp = this.player.enemy.hp;
      this.append('assistant', `⚡ A blinding bolt of Lightning arcs into ${this.player.enemy.name} for ${dmg} devastating electric damage!`);
      if (!this.checkVictory()) {
        this.resolveEnemyAttack();
      }
      return;
    }

    this.append('assistant', `You attempt to cast '${spellName}', but the magic fizzles.`);
  }

  flee() {
    if (!this.player.inCombat) {
      this.append('assistant', "There is nothing to flee from here.");
      return;
    }

    // 50% chance to succeed, 50% chance to fail
    const fleeSuccess = Math.random() < 0.5;

    if (fleeSuccess) {
      this.append('assistant', "🏃 You successfully scrambled away to safety, retreating to the previous space!");
      const room = this.currentRoom();
      if (this.player.inDungeon === null && room.enemy) {
        room.enemy = null;
      }
      this.player.inCombat = false;
      this.player.enemy = null;
      if (this.previousSpace) {
        this.player.inDungeon = this.previousSpace.inDungeon;
        this.player.x = this.previousSpace.x;
        this.player.y = this.previousSpace.y;
        this.player.dungeonX = this.previousSpace.dungeonX;
        this.player.dungeonY = this.previousSpace.dungeonY;
      }
      this.look();
    } else {
      this.append('assistant', "⚠️ You failed to flee! The enemy cuts off your retreat and retaliates!");
      this.resolveEnemyAttack();
    }
  }

  enterDungeon() {
    if (this.player.inDungeon !== null) {
      this.append('assistant', "You are already inside a dungeon!");
      return;
    }

    const room = this.currentRoom();
    if (!room.dungeonId) {
      this.append('assistant', "There is no dungeon entrance here.");
      return;
    }

    const d = this.dungeonData[room.dungeonId];
    if (d.requires && !this.player.inventory.some(it => it.toLowerCase().includes(d.requires))) {
      this.append('assistant', `⛔ LOCKED! ${d.requiresMsg}`);
      return;
    }

    this.lastSafeSpace = {
      inDungeon: null,
      x: this.player.x,
      y: this.player.y,
      dungeonX: 1,
      dungeonY: 2
    };
    this.player.inDungeon = room.dungeonId;
    this.player.dungeonX = 1;
    this.player.dungeonY = 2;
    this.exploredDungeons[this.player.inDungeon][this.player.dungeonY][this.player.dungeonX] = true;
    this.append('assistant', `\n🚪 You descend into ${d.name}! The stone trapdoor groans behind you.`);
    this.look();
  }

  leaveDungeon() {
    if (this.player.inDungeon === null) {
      this.append('assistant', "You are already on the Overworld! To return to the mock server, click the 'Exit' button in the top right header.");
      return;
    }

    const room = this.currentRoom();
    if (!room.isEntry) {
      this.append('assistant', "You must return to the dungeon entrance ladder (coordinates 1,2) to climb back to the Overworld.");
      return;
    }

    const dName = this.dungeonData[this.player.inDungeon].name;
    this.player.inDungeon = null;
    this.hasRestedInCurrentTile = false;
    this.append('assistant', `\n☀️ You climb the ladder out of ${dName} and emerge back into the Overworld sunshine!`);
    this.look();
  }

  rest() {
    if (this.player.inCombat) {
      this.append('assistant', "⚠️ You cannot rest while locked in combat!");
      return;
    }

    if (this.player.inDungeon !== null) {
      this.append('assistant', "⛺ You cannot rest in the dangerous depths of a dungeon! Find your way to the surface to rest.");
      return;
    }

    if (this.hasRestedInCurrentTile) {
      this.append('assistant', "⛺ You have already rested here. You must explore to another tile before you can rest again.");
      return;
    }

    this.hasRestedInCurrentTile = true;
    const hpBefore = this.player.hp;
    const mpBefore = this.player.mp;
    const hpGain = Math.min(35, this.player.maxHp - hpBefore);
    const mpGain = Math.min(20, this.player.maxMp - mpBefore);
    this.player.hp += hpGain;
    this.player.mp += mpGain;

    this.append('assistant', `⛺ You set up camp and rest peacefully under the open sky.\nRestored ${hpGain} HP and ${mpGain} Mana! (HP: ${this.player.hp}/${this.player.maxHp}, MP: ${this.player.mp}/${this.player.maxMp})`);
  }

  move(dx, dy) {
    if (this.player.inCombat) {
      this.append('assistant', "⚠️ You cannot simply walk away while in combat! Use 'flee' to attempt escape or defeat your foe!");
      return;
    }

    if (this.player.inDungeon !== null) {
      const nx = this.player.dungeonX + dx;
      const ny = this.player.dungeonY + dy;
      if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) {
        this.lastSafeSpace = {
          inDungeon: this.player.inDungeon,
          x: this.player.x,
          y: this.player.y,
          dungeonX: this.player.dungeonX,
          dungeonY: this.player.dungeonY
        };
        this.player.dungeonX = nx;
        this.player.dungeonY = ny;
        this.exploredDungeons[this.player.inDungeon][ny][nx] = true;
        this.look();
      } else {
        this.append('assistant', "Solid bedrock blocks your path.");
      }
    } else {
      const nx = this.player.x + dx;
      const ny = this.player.y + dy;
      if (nx >= 0 && nx < 16 && ny >= 0 && ny < 8) {
        const destCell = this.overworld[ny][nx];

        if (destCell.type === "~" && !this.player.inventory.some(it => it.toLowerCase().includes("raft"))) {
          this.append('assistant', "🌊 DEEP WATER! Raging ocean waves prevent you from swimming. You need a Raft (found in Dungeon 1)!");
          return;
        }

        if (destCell.type === "^" && (nx === 4 && ny === 0) && !this.player.inventory.some(it => it.toLowerCase().includes("pickaxe"))) {
          this.append('assistant', "🪨 CRACKED BOULDERS! The mountain pass to Dungeon 6 is blocked. You need a Pickaxe!");
          return;
        }

        this.lastSafeSpace = {
          inDungeon: null,
          x: this.player.x,
          y: this.player.y,
          dungeonX: this.player.dungeonX,
          dungeonY: this.player.dungeonY
        };
        this.player.x = nx;
        this.player.y = ny;
        this.hasRestedInCurrentTile = false;
        this.exploredOverworld[ny][nx] = true;

        // Overworld random combat encounters (25% chance in non-cottage, non-dungeon tiles)
        if (destCell.type !== "H" && !destCell.dungeonId && !this.player.inCombat) {
          if (Math.random() < 0.25) {
            const enemy = getRandomOverworldEnemy(destCell.type);
            if (enemy) {
              destCell.enemy = { ...enemy };
            }
          }
        }

        this.look();
      } else {
        this.append('assistant', "The edge of the known realm stops you from going further.");
      }
    }
  }

  take(target) {
    const room = this.currentRoom();
    if (!room.items || room.items.length === 0) {
      this.append('assistant', `You see no '${target}' here.`);
      return;
    }

    const itemIdx = room.items.findIndex(it => it.toLowerCase().includes(target));
    if (itemIdx >= 0) {
      const item = room.items.splice(itemIdx, 1)[0];
      this.player.inventory.push(item);

      const lower = item.toLowerCase();
      if (lower.includes("life force") || lower.includes("triforce")) {
        this.isGameWon = true;
        this.append('assistant', `✨ YOU HAVE OBTAINED THE ${item.toUpperCase()}! ✨`);
        this.append('system',
          "\n===========================================================\n" +
          "                         The End\n" +
          "===========================================================\n" +
          "Type 'restart' to reset the game.\n"
        );
        return;
      }

      const eq = getEquipmentInfo(item);
      if (eq) {
        this.append('assistant', `Taken: ${item}. (Type 'equip ${item}' to equip it!)`);
      } else {
        this.append('assistant', `Taken: ${item}.`);
      }
    } else {
      this.append('assistant', `You see no '${target}' here.`);
    }
  }

  equip(target) {
    if (!target) {
      this.append('assistant', "Equip what? Type 'equip <item name>' to equip a weapon or armor from your backpack.");
      return;
    }

    const tLower = target.toLowerCase().trim();

    // Check if already equipped
    if (this.player.weapon.toLowerCase().includes(tLower)) {
      this.append('assistant', `You already have ${this.player.weapon} equipped!`);
      return;
    }
    if (this.player.armor.toLowerCase().includes(tLower)) {
      this.append('assistant', `You already have ${this.player.armor} equipped!`);
      return;
    }

    // Find in inventory
    const itemIdx = this.player.inventory.findIndex(it => it.toLowerCase().includes(tLower));
    if (itemIdx === -1) {
      this.append('assistant', `You don't have '${target}' in your backpack.`);
      return;
    }

    const itemName = this.player.inventory[itemIdx];
    const eq = getEquipmentInfo(itemName);
    if (!eq) {
      this.append('assistant', `'${itemName}' cannot be equipped as a weapon or armor.`);
      return;
    }

    this.player.inventory.splice(itemIdx, 1);

    if (eq.type === 'weapon') {
      const oldWeapon = this.player.weapon;
      if (oldWeapon) {
        this.player.inventory.push(oldWeapon);
      }
      this.player.weapon = eq.name || itemName;
      this.player.atk = eq.value;
      this.append('assistant', `⚔️ You equipped ${this.player.weapon}! Unequipped ${oldWeapon} into backpack. (ATK is now ${this.player.atk})`);
    } else if (eq.type === 'armor') {
      const oldArmor = this.player.armor;
      if (oldArmor) {
        this.player.inventory.push(oldArmor);
      }
      this.player.armor = eq.name || itemName;
      this.player.def = eq.value;
      this.append('assistant', `🛡️ You equipped ${this.player.armor}! Unequipped ${oldArmor} into backpack. (DEF is now ${this.player.def})`);
    }
  }

  drop(target) {
    const itemIdx = this.player.inventory.findIndex(it => it.toLowerCase().includes(target));
    if (itemIdx >= 0) {
      const item = this.player.inventory.splice(itemIdx, 1)[0];
      const room = this.currentRoom();
      if (!room.items) room.items = [];
      room.items.push(item);
      this.append('assistant', `Dropped: ${item}.`);
    } else {
      this.append('assistant', `You do not have '${target}'.`);
    }
  }

  read(target) {
    if (target.includes('leaflet')) {
      this.append('assistant',
        `"WELCOME TO DICK OVERWORLD!\n` +
        `• Explore the vast wilderness and conquer all 9 Dungeons!\n` +
        `• Defeat monsters, uncover spell scrolls, and upgrade your gear!\n` +
        `• Slay the Master Fluffer in Dungeon 9 to claim the Life Force of Dick!"`
      );
      return;
    }

    if (target.includes('scroll') || target.includes('firebolt') || target.includes('heal') || target.includes('frost') || target.includes('lightning')) {
      // Find matching scroll in inventory
      const scrollIdx = this.player.inventory.findIndex(it => {
        const l = it.toLowerCase();
        if (!l.includes('scroll')) return false;
        if (target.includes('firebolt') && l.includes('firebolt')) return true;
        if (target.includes('heal') && l.includes('heal')) return true;
        if (target.includes('frost') && l.includes('frost')) return true;
        if (target.includes('lightning') && l.includes('lightning')) return true;
        if (target.includes('scroll')) return true;
        return l.includes(target);
      });

      if (scrollIdx >= 0) {
        const scrollItem = this.player.inventory[scrollIdx];
        const lower = scrollItem.toLowerCase();
        let learned = null;
        if (lower.includes('firebolt') || target.includes('firebolt')) learned = 'firebolt';
        else if (lower.includes('heal') || target.includes('heal')) learned = 'heal';
        else if (lower.includes('frost') || target.includes('frost')) learned = 'frost';
        else if (lower.includes('lightning') || target.includes('lightning')) learned = 'lightning';

        if (learned) {
          if (!this.player.spells.includes(learned)) {
            this.player.spells.push(learned);
            const consumed = this.player.inventory.splice(scrollIdx, 1)[0];
            this.append('assistant', `✨ You chant the ancient runes on ${consumed}... The scroll dissolves into glowing dust as you learn '${learned}'!`);
            this.append('assistant', `(Cast it anytime during combat with: 'cast ${learned}')`);
          } else {
            this.append('assistant', `You already have mastery over '${learned}'.`);
          }
          return;
        }
      } else {
        this.append('assistant', `You don't have '${target}' in your backpack to read.`);
        return;
      }
    }

    this.append('assistant', `There is nothing written on '${target}'.`);
  }

  use(target) {
    if (!target) {
      this.append('assistant', "Use what? Type 'use <item>' (e.g. 'use health potion').");
      return;
    }

    const tLower = target.toLowerCase().trim();

    // Priority to exact match or specific "full" match
    let itemIdx = -1;
    if (tLower.includes('full')) {
      itemIdx = this.player.inventory.findIndex(it => {
        const l = it.toLowerCase();
        return l.includes('full') && (l.includes(tLower) || tLower.includes(l) || (tLower.includes('health') && l.includes('health')) || (tLower.includes('mana') && l.includes('mana')));
      });
    }

    if (itemIdx === -1) {
      itemIdx = this.player.inventory.findIndex(it => {
        const l = it.toLowerCase();
        return l === tLower || l.includes(tLower) || tLower.includes(l);
      });
    }

    if (itemIdx === -1) {
      this.append('assistant', `You don't have '${target}' in your backpack.`);
      return;
    }

    const item = this.player.inventory[itemIdx];
    const lItem = item.toLowerCase();

    if (lItem.includes('ancient elixir')) {
      this.player.inventory.splice(itemIdx, 1);
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      this.append('assistant', `✨ You consume the ancient elixir! Divine light surges through your body, fully restoring your HP and Mana! (HP: ${this.player.hp}/${this.player.maxHp}, MP: ${this.player.mp}/${this.player.maxMp})`);
      if (this.player.inCombat) {
        this.resolveEnemyAttack();
      }
      return;
    }

    if (lItem.includes('full health potion') || (lItem.includes('health') && lItem.includes('full'))) {
      this.player.inventory.splice(itemIdx, 1);
      this.player.hp = this.player.maxHp;
      this.append('assistant', `🧪 You drink the full health potion! Your health is completely restored! (HP: ${this.player.hp}/${this.player.maxHp})`);
      if (this.player.inCombat) {
        this.resolveEnemyAttack();
      }
      return;
    }

    if (lItem.includes('health potion')) {
      this.player.inventory.splice(itemIdx, 1);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
      this.append('assistant', `🧪 You drink the health potion and recover 40 HP! (HP: ${this.player.hp}/${this.player.maxHp})`);
      if (this.player.inCombat) {
        this.resolveEnemyAttack();
      }
      return;
    }

    if (lItem.includes('full mana potion') || (lItem.includes('mana') && lItem.includes('full'))) {
      this.player.inventory.splice(itemIdx, 1);
      this.player.mp = this.player.maxMp;
      this.append('assistant', `🧪 You drink the full mana potion! Pure mystical energy completely refills your Mana! (MP: ${this.player.mp}/${this.player.maxMp})`);
      if (this.player.inCombat) {
        this.resolveEnemyAttack();
      }
      return;
    }

    if (lItem.includes('mana potion')) {
      this.player.inventory.splice(itemIdx, 1);
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + 20);
      this.append('assistant', `🧪 You drink the mana potion and restore 20 MP! (MP: ${this.player.mp}/${this.player.maxMp})`);
      if (this.player.inCombat) {
        this.resolveEnemyAttack();
      }
      return;
    }

    this.append('assistant', `'${item}' cannot be used that way.`);
  }

  resetGame() {
    this.player = {
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      atk: 4,
      def: 1,
      weapon: "Wooden Club",
      armor: "Cloth Tunic",
      inventory: ["leaflet"],
      spells: [],
      x: 7,
      y: 3,
      inDungeon: null,
      dungeonX: 1,
      dungeonY: 2,
      inCombat: false,
      enemy: null,
      showMap: false,
      showInventory: false,
    };

    this.exploredOverworld = Array.from({ length: 8 }, () => Array(16).fill(false));
    this.exploredOverworld[3][7] = true;

    this.exploredDungeons = {};
    for (let d = 1; d <= 9; d++) {
      this.exploredDungeons[d] = Array.from({ length: 3 }, () => Array(3).fill(false));
    }

    this.overworld = createOverworldGrid();
    this.dungeonData = JSON.parse(JSON.stringify(dungeons));
    this.messages = [];
    this.lastSafeSpace = { inDungeon: null, x: 7, y: 3, dungeonX: 1, dungeonY: 2 };
    this.previousSpace = { inDungeon: null, x: 7, y: 3, dungeonX: 1, dungeonY: 2 };
    this.hasRestedInCurrentTile = false;
    this.isGameWon = false;
    this.isGameOver = false;

    this.append('system',
      "===========================================================\n" +
      "  Dick Sword Adventures I: The Long Hard Knight\n" +
      "===========================================================\n" +
      "Type 'help' for commands, 'rest' (r) to heal, 'map' (m) for map,\n" +
      "'i' for inventory, or click 'Exit' in the header to return to mock server."
    );
    this.look();
  }

  handleCommand(raw) {
    this.append('user', raw);
    const cmd = raw.trim().toLowerCase();

    if (this.isGameWon) {
      if (cmd === 'restart') {
        this.resetGame();
        return;
      }
      this.append('assistant', "The adventure is complete! Type 'restart' to begin anew.");
      return;
    }

    if (this.isGameOver) {
      if (cmd === 'restart') {
        this.resetGame();
        return;
      }
      this.append('assistant', "Game Over! Type 'restart' to begin anew.");
      return;
    }

    if (cmd === 'restart') {
      this.append('assistant', `I don't understand how to 'restart'. Type 'help' for commands.`);
      return;
    }

    if (cmd === 'map' || cmd === 'm') {
      this.toggleMap();
      return;
    }

    if (cmd === 'attack' || cmd === 'a') {
      this.melee();
      return;
    }

    if (cmd.startsWith('cast ')) {
      const spell = cmd.replace(/^cast\s+/, '').trim();
      this.cast(spell);
      return;
    }

    if (cmd === 'flee' || cmd === 'f') {
      this.flee();
      return;
    }

    if (cmd.startsWith('use ') || cmd.startsWith('drink ')) {
      this.use(cmd.replace(/^(use|drink)\s+/, '').trim());
      return;
    }

    if (cmd === 'use' || cmd === 'drink') {
      this.append('assistant', "Use what? Type 'use <item>' (e.g. 'use health potion').");
      return;
    }

    if (this.player.inCombat) {
      this.append('assistant', `⚠️ You are locked in combat with ${this.player.enemy.name}! Use: 'attack' (a), 'cast <spell>', 'use <potion>', or 'flee' (f).`);
      return;
    }

    if (cmd === 'look' || cmd === 'l') {
      this.look();
      return;
    }

    if (cmd === 'rest' || cmd === 'r') {
      this.rest();
      return;
    }

    if (cmd === 'inventory' || cmd === 'i') {
      this.toggleInventory();
      return;
    }

    if (cmd === 'help' || cmd === '?') {
      this.append('assistant',
        "================ COMMANDS AVAILABLE ================\n" +
        " • Movement: north (n), south (s), east (e), west (w)\n" +
        " • Dungeon: enter, exit\n" +
        " • Combat: attack (a), cast <spellname>, flee (f)\n" +
        " • Exploration: look (l), rest (r)\n" +
        " • Items: take <item>, use <item>, drop <item>, equip <item>, read <item>\n" +
        " • UI: inventory (i), map (m)"
      );
      return;
    }

    if (cmd.startsWith('equip ') || cmd.startsWith('equp ')) {
      const item = cmd.replace(/^(equip|equp)\s+/, '').trim();
      this.equip(item);
      return;
    }

    if (cmd === 'equip' || cmd === 'equp') {
      this.append('assistant', "Equip what? Type 'equip <item name>' to equip a weapon or armor from your backpack.");
      return;
    }

    if (cmd === 'enter' || cmd === 'enter dungeon') {
      this.enterDungeon();
      return;
    }

    if (cmd === 'exit' || cmd === 'exit dungeon') {
      this.leaveDungeon();
      return;
    }

    if (cmd === 'n' || cmd === 'north' || cmd === 'go north') { this.move(0, -1); return; }
    if (cmd === 's' || cmd === 'south' || cmd === 'go south') { this.move(0, 1); return; }
    if (cmd === 'e' || cmd === 'east' || cmd === 'go east') { this.move(1, 0); return; }
    if (cmd === 'w' || cmd === 'west' || cmd === 'go west') { this.move(-1, 0); return; }

    if (cmd.startsWith('take ') || cmd.startsWith('get ')) {
      this.take(cmd.replace(/^(take|get)\s+/, '').trim());
      return;
    }

    if (cmd.startsWith('drop ')) {
      this.drop(cmd.replace(/^drop\s+/, '').trim());
      return;
    }

    if (cmd.startsWith('read ')) {
      this.read(cmd.replace(/^read\s+/, '').trim());
      return;
    }

    this.append('assistant', `I don't understand how to '${raw}'. Type 'help' for commands.`);
  }
}
