export const EQUIPMENT_INFO = {
  weapons: {
    "wooden club": { name: "Wooden Club", stat: "+4 ATK", value: 4 },
    "rusty dagger": { name: "Rusty Dagger", stat: "+8 ATK", value: 8 },
    "iron sword": { name: "Iron Sword", stat: "+12 ATK", value: 12 },
    "steel broadsword": { name: "Steel Broadsword", stat: "+18 ATK", value: 18 },
    "mithril blade": { name: "Mithril Blade", stat: "+26 ATK", value: 26 },
    "master sword": { name: "Master Sword", stat: "+40 ATK", value: 40 }
  },
  armors: {
    "cloth tunic": { name: "Cloth Tunic", stat: "+1 DEF", value: 1 },
    "leather tunic": { name: "Leather Tunic", stat: "+4 DEF", value: 4 },
    "banded tunic": { name: "Banded Tunic", stat: "+8 DEF", value: 8 },
    "iron shield": { name: "Banded Tunic", stat: "+8 DEF", value: 8 },
    "chainmail": { name: "Chainmail", stat: "+10 DEF", value: 10 },
    "steel plate": { name: "Steel Plate", stat: "+14 DEF", value: 14 },
    "dragon armor": { name: "Dragon Armor", stat: "+22 DEF", value: 22 }
  }
};

export function getEquipmentInfo(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (lower.includes("pickaxe")) return null;

  for (const [key, val] of Object.entries(EQUIPMENT_INFO.weapons)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) {
      return { type: 'weapon', ...val };
    }
  }

  for (const [key, val] of Object.entries(EQUIPMENT_INFO.armors)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) {
      return { type: 'armor', ...val };
    }
  }

  if (lower.includes("sword") || lower.includes("blade") || lower.includes("dagger") || lower.includes("club") || lower.includes("axe")) {
    return { type: 'weapon', name, stat: "+5 ATK", value: 5 };
  }
  if (lower.includes("armor") || lower.includes("plate") || lower.includes("chainmail") || lower.includes("tunic") || lower.includes("shield")) {
    return { type: 'armor', name, stat: "+2 DEF", value: 2 };
  }

  return null;
}

export const dungeons = {
  1: {
    name: "Goblin Grotto",
    overworldX: 3, overworldY: 1,
    requires: null,
    rooms: [
      [{ gridNum: 1, name: "Grotto Altar", desc: "A goblin shrine bathed in eerie luminescent mushrooms.", items: ["scroll of firebolt"], enemy: { name: "Goblin Shaman", hp: 30, atk: 7, exp: 20 } },
       { gridNum: 2, name: "Chieftain's Hoard", desc: "A damp cavern piled with looted wreckage and floating timber.", items: ["raft"], enemy: { name: "Goblin King", hp: 45, atk: 10, exp: 50 } },
       { gridNum: 3, name: "Murky Pool", desc: "A dark bubbling pool with a rusty chest wedged between stalagmites.", items: ["leather tunic"], enemy: null }],
      [{ gridNum: 4, name: "Narrow Crevasse", desc: "Sharp stalactites hang low overhead.", items: [], enemy: { name: "Goblin Scout", hp: 20, atk: 5, exp: 10 } },
       { gridNum: 5, name: "Dungeon Hall", desc: "A stone corridor carved deep into the underground bedrock.", items: [], enemy: null },
       { gridNum: 6, name: "Storeroom", desc: "Smashed crates and moldy rations.", items: ["health potion"], enemy: null }],
      [{ gridNum: 7, name: "Guard Post", desc: "A makeshift barricade of bone and timber.", items: [], enemy: { name: "Goblin Guard", hp: 25, atk: 6, exp: 15 } },
       { gridNum: 8, name: "Grotto Entrance", desc: "A stone ladder ascends back to the Overworld.", items: [], isEntry: true },
       { gridNum: 9, name: "Damp Cell", desc: "Rusted iron cages hang from the ceiling.", items: ["rusty dagger"], enemy: null }]
    ]
  },
  2: {
    name: "Sunken Catacombs",
    overworldX: 12, overworldY: 1,
    requires: null,
    rooms: [
      [{ gridNum: 1, name: "Tomb of the Warrior", desc: "A marble sarcophagus glowing with holy light.", items: ["iron sword"], enemy: { name: "Crypt Wight", hp: 50, atk: 11, exp: 60 } },
       { gridNum: 2, name: "Flooded Crypt", desc: "Ankle-deep water ripples with every step.", items: ["scroll of heal"], enemy: null },
       { gridNum: 3, name: "Offering Vault", desc: "Ancient urns inscribed with runic prayers.", items: ["mana potion"], enemy: null }],
      [{ gridNum: 4, name: "Hall of Bones", desc: "Skeletons line the alcoves in solemn vigilance.", items: [], enemy: { name: "Skeleton Warrior", hp: 35, atk: 9, exp: 30 } },
       { gridNum: 5, name: "Waterway Hub", desc: "Arched stone ceiling with dripping lime water.", items: [], enemy: null },
       { gridNum: 6, name: "Sepulcher", desc: "A quiet chamber adorned with faded frescoes.", items: ["banded tunic"], enemy: { name: "Grave Ghoul", hp: 30, atk: 8, exp: 25 } }],
      [{ gridNum: 7, name: "Antechamber", desc: "Echoes of running water reverberate here.", items: [], enemy: null },
       { gridNum: 8, name: "Catacombs Entrance", desc: "A flight of mossy steps leads up to the Overworld.", items: [], isEntry: true },
       { gridNum: 9, name: "Embalming Room", desc: "Stone slabs surrounded by antique jars.", items: [], enemy: null }]
    ]
  },
  3: {
    name: "Ogre's Quarry",
    overworldX: 1, overworldY: 5,
    requires: null,
    rooms: [
      [{ gridNum: 1, name: "Mining Depot", desc: "Carts filled with glistening mineral ore.", items: [], enemy: null },
       { gridNum: 2, name: "Quarry Overlord's Lair", desc: "A colossal cavern littered with broken stone pillars.", items: ["pickaxe"], enemy: { name: "Ogre Chieftain", hp: 70, atk: 14, exp: 90 } },
       { gridNum: 3, name: "Blasting Pit", desc: "Scent of sulfur lingers heavily in the air.", items: ["scroll of frost"], enemy: null }],
      [{ gridNum: 4, name: "Excavation Tunnel", desc: "The rock walls bear heavy chisel marks.", items: [], enemy: { name: "Cave Troll", hp: 45, atk: 12, exp: 40 } },
       { gridNum: 5, name: "Central Mine Shaft", desc: "A deep shaft drops down into the bowels of the earth.", items: [], enemy: null },
       { gridNum: 6, name: "Tool Shed", desc: "Dusty shovels and rusted chains.", items: ["health potion"], enemy: null }],
      [{ gridNum: 7, name: "Rubble Slope", desc: "Loose scree makes footing treacherous.", items: [], enemy: null },
       { gridNum: 8, name: "Quarry Entrance", desc: "Heavy timbers frame the exit back to the Overworld.", items: [], isEntry: true },
       { gridNum: 9, name: "Smelting Nook", desc: "A cold stone furnace and discarded anvils.", items: [], enemy: null }]
    ]
  },
  4: {
    name: "Crypt of Whispers",
    overworldX: 6, overworldY: 6,
    requires: "pickaxe",
    requiresMsg: "Cracked boulders choke the crypt entrance. You need a Pickaxe to break through!",
    rooms: [
      [{ gridNum: 1, name: "Whispering Shrine", desc: "Ghostly voices murmur secrets from the shadowy walls.", items: ["chainmail"], enemy: { name: "Banshee Queen", hp: 65, atk: 15, exp: 110 } },
       { gridNum: 2, name: "Armory of the Fallen", desc: "Racks of gleaming ancient warfare gear.", items: ["steel broadsword"], enemy: null },
       { gridNum: 3, name: "Ritual Chamber", desc: "A pentagram etched into obsidian floor tiles.", items: ["mana potion"], enemy: { name: "Shadow Priest", hp: 50, atk: 13, exp: 70 } }],
      [{ gridNum: 4, name: "Silent Hall", desc: "Not even your footsteps make a sound on the plush dust.", items: [], enemy: null },
       { gridNum: 5, name: "Crossroads of Souls", desc: "Four arched passageways converge beneath a weeping gargoyle.", items: [], enemy: { name: "Wraith", hp: 40, atk: 11, exp: 50 } },
       { gridNum: 6, name: "Mausoleum", desc: "Stone coffins carved with knightly effigies.", items: [], enemy: null }],
      [{ gridNum: 7, name: "Guard Hall", desc: "Suits of rusted plate stand at stiff attention.", items: [], enemy: null },
       { gridNum: 8, name: "Crypt Entrance", desc: "Stone stairway leading up to the surface.", items: [], isEntry: true },
       { gridNum: 9, name: "Chamber of Urns", desc: "Ceramic vessels sealed with pitch.", items: ["health potion"], enemy: null }]
    ]
  },
  5: {
    name: "Spider Queen's Nest",
    overworldX: 14, overworldY: 3,
    requires: "raft",
    requiresMsg: "The island cave is surrounded by deep water rapids! You need a Raft to cross!",
    rooms: [
      [{ gridNum: 1, name: "Webbed Armory", desc: "Previous adventurers cocooned in thick silk.", items: ["steel plate"], enemy: null },
       { gridNum: 2, name: "Broodmother's Spire", desc: "Massive glowing egg sacks hang from the domed ceiling.", items: ["hookshot"], enemy: { name: "Arachne Queen", hp: 90, atk: 17, exp: 160 } },
       { gridNum: 3, name: "Venom Sac Vault", desc: "Puddles of sizzling green venom dissolve the rock floor.", items: ["scroll of lightning"], enemy: null }],
      [{ gridNum: 4, name: "Cocoon Passage", desc: "Sticky silk cobwebs cling stubbornly to your gear.", items: [], enemy: { name: "Giant Tarantula", hp: 55, atk: 13, exp: 60 } },
       { gridNum: 5, name: "Chitin Crossway", desc: "Piles of discarded insect carapaces crunch underfoot.", items: [], enemy: null },
       { gridNum: 6, name: "Egg Nursery", desc: "Soft skittering sounds resonate within the walls.", items: ["mana potion"], enemy: { name: "Swarm Weaver", hp: 45, atk: 11, exp: 45 } }],
      [{ gridNum: 7, name: "Outer Webbing", desc: "Thick ropes of spider silk criss-cross the path.", items: [], enemy: null },
       { gridNum: 8, name: "Nest Entrance", desc: "A hollowed cavern mouth opening back to the island.", items: [], isEntry: true },
       { gridNum: 9, name: "Silk Cavern", desc: "Fine silvery threads catch what little light enters.", items: ["health potion"], enemy: null }]
    ]
  },
  6: {
    name: "Magma Foundry",
    overworldX: 4, overworldY: 0,
    requires: "pickaxe",
    requiresMsg: "Solid volcanic rock seals the foundry door. You need a Pickaxe to excavate!",
    rooms: [
      [{ gridNum: 1, name: "Foundry Anvil", desc: "A legendary forge glowing with primordial heat.", items: ["mithril blade"], enemy: { name: "Magma Golem", hp: 110, atk: 20, exp: 200 } },
       { gridNum: 2, name: "Molten Reservoir", desc: "Lava cascades over black basalt channels.", items: [], enemy: null },
       { gridNum: 3, name: "Slag Dump", desc: "Heaps of glowing molten glass and pumice.", items: ["mana potion"], enemy: { name: "Fire Salamander", hp: 60, atk: 15, exp: 80 } }],
      [{ gridNum: 4, name: "Smelting Trench", desc: "Waves of heat distort the subterranean air.", items: [], enemy: null },
       { gridNum: 5, name: "Boiler Core", desc: "Ancient dwarven steam machinery thuds rhythmically.", items: [], enemy: { name: "Iron Automaton", hp: 70, atk: 16, exp: 95 } },
       { gridNum: 6, name: "Furnace Room", desc: "White-hot flames roar inside iron containment vents.", items: [], enemy: null }],
      [{ gridNum: 7, name: "Cooling Bay", desc: "Pipes drip mineral water onto sizzling iron plates.", items: [], enemy: null },
       { gridNum: 8, name: "Foundry Entrance", desc: "Heavy insulated bronze doors lead out to the mountains.", items: [], isEntry: true },
       { gridNum: 9, name: "Tool Storage", desc: "Heavy smithing tongs and tempering vats.", items: ["health potion"], enemy: null }]
    ]
  },
  7: {
    name: "Sunken Temple",
    overworldX: 10, overworldY: 5,
    requires: "hookshot",
    requiresMsg: "A bottomless oceanic trench separates you from the temple door! You need a Hookshot to cross!",
    rooms: [
      [{ gridNum: 1, name: "Sanctum of the Deep", desc: "Bioluminescent coral illuminates an ancient sunken throne.", items: ["dragon armor"], enemy: { name: "Leviathan Priest", hp: 130, atk: 22, exp: 250 } },
       { gridNum: 2, name: "Hall of Tides", desc: "Water surges through rhythmic carved sea-conduits.", items: ["power bracelet"], enemy: null },
       { gridNum: 3, name: "Coral Treasury", desc: "Shells filled with lustrous pearls and gemstones.", items: [], enemy: { name: "Abyssal Siren", hp: 75, atk: 17, exp: 110 } }],
      [{ gridNum: 4, name: "Algae Gallery", desc: "Emerald kelp drifts lazily in the ambient current.", items: [], enemy: null },
       { gridNum: 5, name: "Central Nave", desc: "Carved depictions of ancient krakens conquering humanity.", items: [], enemy: { name: "Drowned Knight", hp: 80, atk: 18, exp: 120 } },
       { gridNum: 6, name: "Ablution Pool", desc: "Pure spring water bubbles up from marble mosaics.", items: ["full mana potion"], enemy: null }],
      [{ gridNum: 7, name: "Submerged Vestibule", desc: "Barnacles encrust every surface of the temple wall.", items: [], enemy: null },
       { gridNum: 8, name: "Temple Portal", desc: "A grand archway leading back to the ocean shore.", items: [], isEntry: true },
       { gridNum: 9, name: "Outer Atrium", desc: "Carved sea-god statues look down in silent judgment.", items: [], enemy: null }]
    ]
  },
  8: {
    name: "Shadow Citadel",
    overworldX: 2, overworldY: 7,
    requires: "power bracelet",
    requiresMsg: "A massive multi-ton monolith blocks the entrance! You need the Power Bracelet to lift it!",
    rooms: [
      [{ gridNum: 1, name: "Throne of Shadows", desc: "Dark energy coils in vortexes around a jagged obsidian throne.", items: ["boss key of dick"], enemy: { name: "Shadow Overlord", hp: 160, atk: 26, exp: 350 } },
       { gridNum: 2, name: "Void Treasury", desc: "Chests hovering mysteriously above bottomless voids.", items: ["master sword"], enemy: null },
       { gridNum: 3, name: "Dark Library", desc: "Tomes bound in fiend leather whisper dark prophecies.", items: ["ancient elixir"], enemy: { name: "Nether Sorcerer", hp: 90, atk: 21, exp: 160 } }],
      [{ gridNum: 4, name: "Corridor of Dread", desc: "The shadows twist into grasping hands as you pass.", items: [], enemy: { name: "Nightmare Stalker", hp: 95, atk: 20, exp: 140 } },
       { gridNum: 5, name: "Citadel Hub", desc: "Black marble pillars support a cavernous gothic roof.", items: [], enemy: null },
       { gridNum: 6, name: "Executioner's Yard", desc: "Dark iron chains dangle above blood-stained altars.", items: [], enemy: null }],
      [{ gridNum: 7, name: "Outer Bastion", desc: "Arrow slits look out into boundless subterranean void.", items: [], enemy: null },
       { gridNum: 8, name: "Citadel Gates", desc: "Giant spiked iron gates leading out to the Overworld.", items: [], isEntry: true },
       { gridNum: 9, name: "Guard Garrison", desc: "Bunks made of black stone.", items: ["full health potion"], enemy: null }]
    ]
  },
  9: {
    name: "Sanctum of the Master Fluffer",
    overworldX: 8, overworldY: 0,
    requires: "boss key of dick",
    requiresMsg: "The heavy gates of the final Sanctum are sealed with the Crest of Dick! You need the Boss Key of Dick to enter!",
    rooms: [
      [{ gridNum: 1, name: "The Fluffer's Throne Room", desc: "Pure pitch darkness surrounds you. A thousand yellow eyes open in the dark... THE MASTER FLUFFER AWAKENS!", items: ["LIFE FORCE OF DICK"], enemy: { name: "The Master Fluffer", hp: 250, atk: 32, exp: 1000 } },
       { gridNum: 2, name: "The Hall of Kings", desc: "Golden statues of the greatest conquerors of the Great Underground Empire.", items: ["ancient elixir"], enemy: null },
       { gridNum: 3, name: "Sanctum Armory", desc: "The finest weapons ever forged in the ancient world.", items: [], enemy: { name: "Sanctum Warden", hp: 120, atk: 24, exp: 200 } }],
      [{ gridNum: 4, name: "The Bridge of Stars", desc: "A glowing pathway spanning across cosmic void.", items: [], enemy: { name: "Cosmic Sentinel", hp: 110, atk: 23, exp: 190 } },
       { gridNum: 5, name: "The Obsidian Nexus", desc: "The very heart of the underground empire hums with energy.", items: [], enemy: null },
       { gridNum: 6, name: "Chamber of Trials", desc: "Ancient mechanisms test your resolve.", items: [], enemy: null }],
      [{ gridNum: 7, name: "Outer Sanctum", desc: "Majestic platinum doors carved with runes of power.", items: [], enemy: null },
       { gridNum: 8, name: "Sanctum Gates", desc: "A portal shimmering with gold leading back to the Overworld.", items: [], isEntry: true },
       { gridNum: 9, name: "Hall of Echoes", desc: "The epic theme of Dick echoes through eternity.", items: [], enemy: null }]
    ]
  }
};

const overworldBiomes = [
  "^^^^.^^^.^^^^^^^",
  "^.......F...F..~",
  "...F...F...~~..~",
  ".F....F.....~~.~",
  "....F......~~~~~",
  "^...F......~~~~^",
  "^....^....^~~~~^",
  "^^^^^^^^^^^^^^^^"
];

export const OVERWORLD_BIOME_ENEMIES = {
  ".": [
    { name: "Meadow Bandit", hp: 25, maxHp: 25, atk: 6, exp: 15 },
    { name: "Wild Boar", hp: 30, maxHp: 30, atk: 7, exp: 18 },
    { name: "Highland Wolf", hp: 24, maxHp: 24, atk: 8, exp: 20 }
  ],
  "F": [
    { name: "Forest Goblin", hp: 28, maxHp: 28, atk: 8, exp: 22 },
    { name: "Giant Spider", hp: 35, maxHp: 35, atk: 9, exp: 25 },
    { name: "Shadow Stalker", hp: 32, maxHp: 32, atk: 11, exp: 30 }
  ],
  "^": [
    { name: "Mountain Harpy", hp: 35, maxHp: 35, atk: 10, exp: 32 },
    { name: "Rock Basilisk", hp: 44, maxHp: 44, atk: 11, exp: 38 },
    { name: "Cave Bear", hp: 42, maxHp: 42, atk: 12, exp: 36 }
  ],
  "~": [
    { name: "River Siren", hp: 30, maxHp: 30, atk: 8, exp: 24 },
    { name: "Tidal Crab", hp: 38, maxHp: 38, atk: 9, exp: 28 },
    { name: "Drowned Corsair", hp: 36, maxHp: 36, atk: 11, exp: 32 }
  ]
};

export function getRandomOverworldEnemy(biomeType) {
  const pool = OVERWORLD_BIOME_ENEMIES[biomeType] || OVERWORLD_BIOME_ENEMIES["."];
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return { ...choice };
}

// Complete 16x8 table of 128 unique tile names and descriptions
export const overworldTileData = [
  // Row 0 (y=0, northern mountain summits and passes)
  [
    { name: "Frostpeak Summit", desc: "Icy gale winds howl across the highest frozen pinnacle of the northern range." },
    { name: "Dragon's Tooth Crag", desc: "A sharp jagged pillar of granite resembling a dragon's canine thrusts toward the sky." },
    { name: "Ironridge Pass", desc: "A treacherous mountain trail carved between sheer walls of iron-rich slate." },
    { name: "Thunderhead Cliff", desc: "Dark storm clouds gather continuously around this sheer mountain drop." },
    { name: "Magma Foundry Gates", desc: "A massive bronze bulkhead carved into volcanic rock radiates intense subterranean heat. Type 'enter' to explore!" },
    { name: "High Wind Ridge", desc: "A narrow mountain ridge buffeted by unrelenting arctic gusts." },
    { name: "Ashen Bluffs", desc: "Pumice and volcanic ash coat the gray rocky terraces." },
    { name: "Desolation Crevasse", desc: "A gaping fissure in the mountain bedrock plunges into a black abyss." },
    { name: "Gates of the Fluffer", desc: "Colossal obsidian archways marked with the Crest of Dick loom menacingly. Type 'enter' to challenge the Master Fluffer!" },
    { name: "Shadowcrest Pinnacle", desc: "A forbidding mountain crest cast in eternal twilight shadow." },
    { name: "Obsidian Horn", desc: "A monolith of slick volcanic glass towers above the mountain spine." },
    { name: "Howling Precipice", desc: "Winds whistle through narrow rock needles overlooking the eastern sea." },
    { name: "Stormcaller Peak", desc: "Lightning-scarred boulders crown this elevated summit." },
    { name: "Doomgap Canyon", desc: "A narrow gorge flanked by sheer vertical cliffs." },
    { name: "Crown of the North", desc: "A circle of ancient monoliths crowns this snowy plateau." },
    { name: "Bleak Horizon", desc: "A high cliff edge overlooking the cold expanse of the northern sea." }
  ],
  // Row 1 (y=1, northern highlands and foothills)
  [
    { name: "Western Foothills", desc: "The steep mountain slopes level out into rocky rolling hills." },
    { name: "Whispering Steppes", desc: "Tall mountain grasses rustle with the murmur of unseen winds." },
    { name: "Rolling Green Highlands", desc: "Expansive highland meadows blanketed with blooming clover." },
    { name: "Goblin Grotto Entrance", desc: "A damp, mossy cavern mouth adorned with carved goblin totems yawns open. Type 'enter' to explore!" },
    { name: "Muddy Crossroad", desc: "Wagon ruts and horse tracks meet at this muddy highland trail crossing." },
    { name: "Old Shepherd's Meadow", desc: "Abandoned stone sheepfolds stand quietly amid lush hillside grass." },
    { name: "Sunlit Glade", desc: "Gentle sunlight filters down onto warm, sloping grassland." },
    { name: "North Forest Border", desc: "Tall pines begin to encroach upon the open northern grasslands." },
    { name: "Silverleaf Thicket", desc: "Birch and silver leaf trees rustle brightly in the mountain breeze." },
    { name: "Royal Highway (North)", desc: "Ancient cobblestones pave the northern military road of the Empire." },
    { name: "Falcon Ridge", desc: "A rocky outcrop favored by swooping birds of prey." },
    { name: "Briarwood Perimeter", desc: "Thick thorny brambles mark the border of the forest." },
    { name: "Sunken Catacombs Portal", desc: "Weathered crypt steps lead down beneath ancient gravestones. Type 'enter' to explore!" },
    { name: "Weeping Willow Grove", desc: "Graceful willow branches drape down over damp turf near the shore." },
    { name: "Mistveiled Shore", desc: "Pale sea fog rolls in over gray coastal pebbles." },
    { name: "Northern Reefs", desc: "Black jagged rocks jut out from swirling tidal whirlpools." }
  ],
  // Row 2 (y=2, middle plains and coastal inlets)
  [
    { name: "Prairie of the Lost", desc: "An unbroken expanse of golden steppe grasses stretches west as far as the eye can see." },
    { name: "Windmill Hill", desc: "The stone foundation of a long-collapsed empire windmill rests upon this knoll." },
    { name: "Golden Wheatfield", desc: "Wild wheat and amber grain ripple like waves in the sun." },
    { name: "Bramblewood Path", desc: "A wandering footpath bordered by blackberry bushes and creeping ivy." },
    { name: "Lantern Hollow", desc: "A gentle dell where travelers traditionally leave small lanterns to light the way." },
    { name: "Verdant Pasture", desc: "Lush emerald pastures dotted with tranquil grazing wildlife." },
    { name: "Old Stone Bridge", desc: "An arched stone span crosses a dry, pebble-strewn ancient creek." },
    { name: "North Orchard Path", desc: "Sweet fragrance of apple blossoms drifts from the south." },
    { name: "Deep Oak Canopy", desc: "Gnarled centuries-old oaks weave their branches into a dense natural ceiling." },
    { name: "King's Highway", desc: "The great central thoroughfare of the Great Underground Empire." },
    { name: "Tranquil Pond", desc: "Clear spring water reflects the clouds in mirror-like serenity." },
    { name: "Azure Inlet", desc: "A peaceful saltwater inlet where waves lap against white sand." },
    { name: "Coral Shallows", desc: "Vibrant coral heads shimmer beneath crystalline sea water." },
    { name: "Mermaid's Cove", desc: "A secluded cove protected by curving sandstone cliffs." },
    { name: "Cerulean Coastline", desc: "The sandy shore meets the turquoise waves of the Great Cerulean Sea." },
    { name: "Outer Sea Channel", desc: "Deeper oceanic currents sweep toward the eastern horizon." }
  ],
  // Row 3 (y=3, Imperial Grounds & Historic House)
  [
    { name: "Western Wilds", desc: "Untamed plains where the authority of the Empire has never reached." },
    { name: "Evergreen Thicket", desc: "Sturdy spruce and pine trees cluster tightly together." },
    { name: "Mossy Barrow", desc: "An ancient burial mound overgrown with velvety green moss." },
    { name: "Clover Field", desc: "A vast field blanketed with sweet four-leaf clover." },
    { name: "Ancient Waystone", desc: "A carved granite obelisk etched with runic directions for pilgrims." },
    { name: "House Orchard", desc: "Rows of fragrant apple and pear trees heavy with ripe fruit." },
    { name: "White Fence Gate", desc: "A charming picket gate swings gently on rusted brass hinges." },
    { name: "West of House (Imperial Grounds)", desc: "You stand west of the historic white house. A small wooden mailbox stands beside the porch." },
    { name: "East of House (Forest Path)", desc: "A narrow, overgrown path trails into the shadows behind the white house." },
    { name: "Whispering Glade", desc: "Gentle murmuring voices seem to whisper softly among the leaves." },
    { name: "Sandy Shoreline", desc: "Fine white sand stretches along the gentle ocean surf." },
    { name: "Coastal Tidal Basin", desc: "Tide pools harbor starfish, hermit crabs, and colorful sea anemones." },
    { name: "Sunken Sandbar", desc: "A submerged spine of sand where waves break into white foam." },
    { name: "Shipwreck Shoals", desc: "Timbers from forgotten merchant galleons stick up from the shallow water." },
    { name: "Spider Queen's Nest Island", desc: "A dark web-shrouded cavern on an offshore islet hums with ominous skittering. Type 'enter' to explore!" },
    { name: "Tempest Waves", desc: "Fierce whitecap waves toss and spray against the open sea." }
  ],
  // Row 4 (y=4, southern savannah and deep oceans)
  [
    { name: "South Prairie", desc: "Vast open prairie grasslands stretching toward the southern horizon." },
    { name: "Buttercup Meadow", desc: "Bright yellow blossoms carpet the gentle rolling swales." },
    { name: "Traveler's Rest", desc: "A circle of flat hearthstones used by generations of wanderers." },
    { name: "Sunken Ditch", desc: "A natural depression that catches seasonal rainfall and wild reeds." },
    { name: "Whispering Pine Hollow", desc: "Tall pines sigh and sway in the continuous southerly breeze." },
    { name: "Hermit's Clearing", desc: "A small clearing where a long-abandoned mudbrick hut slowly decays." },
    { name: "Forest Edge", desc: "The dense forest thins out into open sunny savanna." },
    { name: "South of House", desc: "You are facing the south side of the white house. The windows here are all boarded shut." },
    { name: "Wildflower Vale", desc: "A sheltered dell vibrant with blooming mountain wildflowers." },
    { name: "Old Riverbed", desc: "Polished river stones mark the course of a dry ancient river." },
    { name: "Saltwater Marsh", desc: "Brackish pools and tall sea reeds sway near the coast." },
    { name: "Cerulean Deep Sea", desc: "Deep royal blue ocean swells lift and fall with immense power." },
    { name: "Kraken's Trench", desc: "The ocean bed plunges into an unfathomable deep-water abyss." },
    { name: "Sunken Reef", desc: "Sprawling submerged coral formations teeming with exotic sea life." },
    { name: "Siren's Rest", desc: "A lone rocky outcropping jutting out of the calm blue sea." },
    { name: "Abyssal Depths", desc: "Open ocean as far as the horizon, where light fades into the deep." }
  ],
  // Row 5 (y=5, quarry, ruins, and atolls)
  [
    { name: "Ogre's Outcrop", desc: "A jagged granite bluff overlooking the western wasteland." },
    { name: "Ogre's Quarry Entrance", desc: "Massive chisel gouges in the cliffside lead down into the stone quarry. Type 'enter' to explore!" },
    { name: "Quarry Rubble Field", desc: "Mounds of discarded limestone rubble and shattered stone blocks." },
    { name: "Stonecutter's Clearing", desc: "Weathered wooden winches and rusted quarry tools lie scattered." },
    { name: "Darkwood Thicket", desc: "Thick, tangled undergrowth makes navigation slow and quiet." },
    { name: "Shaded Vale", desc: "A cool shadowed depression sheltered between low hills." },
    { name: "Forgotten Cemetery", desc: "Tilting tombstones and iron railings overgrown with wild briars." },
    { name: "South Crossroads", desc: "Trails branch toward the southern mountains and eastern coast." },
    { name: "Ruined Watchtower", desc: "Crumbling stone foundation of a sentinel tower built in ancient wars." },
    { name: "Cobblestone Fork", desc: "The cracked southern road splits toward the shore and high peaks." },
    { name: "Sunken Temple Portal", desc: "Submerged marble pillars rise through churning waves. Type 'enter' to explore!" },
    { name: "Emerald Atoll", desc: "A ring-shaped coral reef encircling a sheltered lagoon." },
    { name: "Coral Barrier", desc: "A formidable natural barrier of sharp staghorn coral." },
    { name: "Boiling Sea Vents", desc: "Subterranean volcanic vents release bubbles and steam into the ocean." },
    { name: "Mistbound Atoll", desc: "A secluded islet shrouded in dense maritime mist." },
    { name: "Jagged Sea Spire", desc: "A needle of volcanic basalt erupting straight out of the surging waves." }
  ],
  // Row 6 (y=6, rugged gorges and pirate shoals)
  [
    { name: "Western Ridge", desc: "A rocky crest providing a sweeping vista of the western lands." },
    { name: "Barren Scree", desc: "Shifting gravel and slate slide under every step on this incline." },
    { name: "Ironstone Crag", desc: "Red-tinged metallic rocks rise up sharply from the scrubland." },
    { name: "Dusty Plateau", desc: "A dry, hard-packed earth plateau swept by arid winds." },
    { name: "Basilisk's Roost", desc: "Curiously petrified lizard skeletons dot this high rocky perch." },
    { name: "Weeping Gorge", desc: "Trickles of mineral-tinted water weep down sheer stone cliffs." },
    { name: "Crypt of Whispers Entrance", desc: "A sealed stone archway buried under rubble whispers with voices. Type 'enter' to explore!" },
    { name: "Hollow of the Damned", desc: "A grim, eerie dale where cold fog clings stubbornly to the ground." },
    { name: "Skeletal Ridge", desc: "Bone-white limestone formations resemble gigantic ribcages." },
    { name: "Obsidian Escarpment", desc: "A glossy black cliff wall reflecting the pale sky like dark glass." },
    { name: "Pillar of the Titans", desc: "Colossal natural stone columns supporting nothing but the open sky." },
    { name: "Sea Cliff Lookout", desc: "Dizzying cliff drop directly down into foaming ocean surf." },
    { name: "Foam-Crested Shoals", desc: "White foaming breakers crash violently over hidden reefs." },
    { name: "Sunken Isle", desc: "Remnants of an ancient volcanic island submerged beneath the tides." },
    { name: "Smuggler's Cove", desc: "A concealed sea cavern accessible only by nimble watercraft." },
    { name: "Dragon's Maw Isle", desc: "A forbidding rocky island with caves shaped like an open dragon jaw." }
  ],
  // Row 7 (y=7, southern mountain wall)
  [
    { name: "Southern World's End", desc: "Impassable granite cliffs mark the southwestern edge of the known world." },
    { name: "Titan's Wall", desc: "A continuous barrier of sheer cliff face rising thousands of cubits high." },
    { name: "Shadow Citadel Gates", desc: "Imposing black iron gates set between gargantuan monoliths bar the Citadel entrance. Type 'enter' to explore!" },
    { name: "Dread Bastion Ramparts", desc: "Ancient obsidian battlements carved directly into the mountain bedrock." },
    { name: "Mountain of Sorrow", desc: "Bleak, barren peaks where nothing green can take root." },
    { name: "Iron Peak", desc: "Rich veins of magnetic iron ore disrupt compass needles on this summit." },
    { name: "Doomrock Summit", desc: "A jagged crown of shattered slate overlooking the southern abyss." },
    { name: "Obsidian Needle", desc: "A spire of razor-sharp volcanic glass piercing the cloud layer." },
    { name: "Spire of Eternity", desc: "Ancient monolith carved with glyphs that predate recorded history." },
    { name: "Black Mountain Pass", desc: "A perpetual chill fills this narrow defile between sheer black peaks." },
    { name: "Voidcliff Crag", desc: "A precipice hanging over an endless subterranean chasm." },
    { name: "Crying Mountain", desc: "Streams of ice melt tumble down the rocks like glittering tears." },
    { name: "Dreadmaw Pinnacle", desc: "A fang-like peak that catches low-hanging storm clouds." },
    { name: "Frozen Basalt Spire", desc: "Slick dark basalt coated with permanent sheets of blue ice." },
    { name: "Netherworld Rift", desc: "Sulfurous vapor drifts from cracks in the deepest mountain cleft." },
    { name: "Abyssal Corner", desc: "The southeastern terminus where mountain stone plunges directly into bottomless ocean trench." }
  ]
];

export function createOverworldGrid() {
  const grid = [];
  for (let y = 0; y < 8; y++) {
    const row = [];
    for (let x = 0; x < 16; x++) {
      let char = overworldBiomes[y][x];
      if (x === 7 && y === 3) char = "H";

      let dungeonId = null;
      for (const [id, d] of Object.entries(dungeons)) {
        if (d.overworldX === x && d.overworldY === y) {
          dungeonId = parseInt(id, 10);
          char = "D";
          break;
        }
      }

      const gridNum = y * 16 + x + 1;
      const tileInfo = overworldTileData[y][x];
      const name = tileInfo.name;
      const desc = tileInfo.desc;
      const items = [];

      if (char === "H") {
        items.push("leaflet");
      }

      row.push({
        gridNum,
        x, y,
        type: char,
        dungeonId,
        name,
        desc,
        items
      });
    }
    grid.push(row);
  }

  // Scatter overworld items
  grid[2][4].items.push("brass lantern");
  grid[4][2].items.push("wooden club");
  grid[3][10].items.push("scroll of firebolt");

  return grid;
}
