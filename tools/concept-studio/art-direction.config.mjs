// art-direction.config.mjs
// Single source that distills docs/art-direction.md + docs/world-and-narrative.md
// into image-generation prompt fragments. The web UI composes:
//   finalPrompt = `${fragment}. ${styleBase}${extra ? ", " + extra : ""}`
// Keep this file in sync with the two docs when the direction changes.

export const PALETTE = {
  red: "#E63946",
  blue: "#2B6CB0",
  yellow: "#F6C744",
  green: "#38A169",
  orange: "#F2802E",
  outline: "#1E1A24", // near-black selout (NEVER pure #000000)
  cream: "#FFF4E0",
  textDark: "#2E2622",
};

// Shared "Maple Vivid" look — appended to every concept-art prompt.
export const STYLE_BASE =
  "MapleStory-inspired cute 2D mobile game art in a vivid style: highly saturated lively colors, " +
  "bold dark near-black outlines (avoid harsh pure black), clean cel shading with crisp stepped highlights, " +
  "soft light from the upper-left, cohesive warm-vivid palette (salmon red, sky blue, golden yellow, fresh green, warm orange), " +
  "polished casual mobile game look, high quality, crisp";

// UI-mockup variant of the style (screens look like app screenshots, not characters).
export const STYLE_UI =
  "MapleStory-inspired vivid mobile game UI/UX mockup, app screenshot, rounded panels and buttons, " +
  "bold near-black outlines, glossy game-ui look, clean legible layout, cohesive warm-vivid palette, high quality";

export const NEGATIVE_BASE =
  "photorealistic, 3d render, harsh pure black outlines, muddy desaturated washed-out colors, gradient banding, " +
  "blurry, messy composition, jpeg artifacts, gibberish text, watermark, signature, logo, deformed anatomy, extra limbs, low quality, ugly";

export const NEGATIVE_UI =
  "photorealistic, 3d render, muddy colors, blurry, cluttered, watermark, signature, deformed, low quality";

// Aspect presets → ComfyUI-friendly dimensions (multiples of 64, ~1MP for z-image-turbo).
export const ASPECTS = {
  "1:1":  { w: 1024, h: 1024, label: "1:1 정사각 (아이콘/스프라이트)" },
  "2:3":  { w: 832,  h: 1216, label: "2:3 세로 (캐릭터)" },
  "9:16": { w: 768,  h: 1344, label: "9:16 세로 (화면/배경)" },
  "3:2":  { w: 1216, h: 832,  label: "3:2 가로" },
  "16:9": { w: 1344, h: 768,  label: "16:9 가로 (와이드 배경)" },
};

export const WORKFLOWS = [
  { key: "z-image-turbo",       label: "z-image-turbo (불투명, 기본)" },
  { key: "z-image-turbo-alpha", label: "z-image-turbo-alpha (투명배경, 스프라이트)" },
  { key: "z-image-turbo-lora",  label: "z-image-turbo-lora (LoRA)" },
];

// ---- Concept-art subjects (characters / assets) ----
// group: 머지 몬스터 / 오리지널 / NPC / 배경
export const SUBJECTS = [
  // Merge monster evolution ladder (official-asset style references; tier frame is separate)
  { id: "mob_t1", group: "머지 몬스터", label: "T1 달팽이",
    fragment: "a cute tiny MapleStory-style green snail monster, chibi mascot creature, simple happy face with big round eyes and white eye highlights, glossy rounded green shell, single subject centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },
  { id: "mob_t2", group: "머지 몬스터", label: "T2 파란달팽이",
    fragment: "a cute MapleStory-style blue snail monster, chibi mascot creature slightly larger than a basic snail, cheerful face, glossy deep-blue shell, single subject centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },
  { id: "mob_t3", group: "머지 몬스터", label: "T3 주황버섯",
    fragment: "a cute MapleStory-style orange mushroom monster, chibi mascot with a round orange mushroom cap, big friendly eyes, tiny feet, single subject centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },
  { id: "mob_t4", group: "머지 몬스터", label: "T4 뿔버섯",
    fragment: "a cute MapleStory-style horned mushroom monster, chibi mascot with a blue-purple mushroom cap and little horns, confident proud expression, single subject centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },
  { id: "mob_t5", group: "머지 몬스터", label: "T5 보스급",
    fragment: "a cute but majestic MapleStory-style evolved boss creature, the grandest final-tier mascot monster, larger and more elaborate, golden glowing accents and sparkles, heroic, single subject centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },

  // Original game-specific assets
  { id: "spawner_egg", group: "오리지널", label: "스포너 (생명의 둥지/알)",
    fragment: "a glowing monster egg resting in a cozy nest with a soft magical summoning glow and sparkles, original mobile game spawner icon, warm and inviting, single object centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },
  { id: "tier_frame", group: "오리지널", label: "티어 프레임/뱃지",
    fragment: "a rounded-square glossy game UI item frame / rarity badge with a small empty center slot, vivid bordered icon frame (rarity colors steel, green, blue, purple, gold), bold near-black outline, single UI element centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },
  { id: "icon_energy", group: "오리지널", label: "에너지 아이콘 (생기)",
    fragment: "a glossy lightning energy icon in yellow-orange, cute vivid mobile game currency icon, bold near-black outline, single icon centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },
  { id: "icon_coin", group: "오리지널", label: "코인 아이콘",
    fragment: "a glossy gold coin icon with a cute star or leaf emblem, vivid mobile game currency icon, bronze near-black outline, single icon centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "1:1" },

  // NPC cast (resource-driven roles)
  { id: "npc_mentor", group: "NPC", label: "선임 복원가 (멘토)",
    fragment: "a kind senior ranger mentor NPC, cute MapleStory-style chibi character, warm friendly smile, simple ranger outfit, full body standing pose, single character centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "2:3" },
  { id: "npc_villager", group: "NPC", label: "필드 주민 (의뢰인)",
    fragment: "a friendly field villager NPC who gives restoration requests, cute MapleStory-style chibi character, cheerful, full body standing pose, single character centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "2:3" },
  { id: "npc_researcher", group: "NPC", label: "연구자/학자",
    fragment: "a curious scholar researcher NPC studying the field, cute MapleStory-style chibi character with glasses and a notebook, thoughtful, full body standing pose, single character centered, simple plain background",
    workflow: "z-image-turbo-alpha", aspect: "2:3" },

  // Region backgrounds (official-style scenery; desaturated one notch so foreground pops)
  { id: "bg_henesys", group: "배경", label: "헤네시스 필드",
    fragment: "a bright cheerful MapleStory-style grassland meadow field background, big round trees, blue sky with fluffy clouds, lush restored ecosystem, slightly desaturated so foreground characters pop, vertical mobile game background scenery, no characters",
    workflow: "z-image-turbo", aspect: "9:16" },
  { id: "bg_slimeforest", group: "배경", label: "슬라임 숲",
    fragment: "a cozy mysterious MapleStory-style slime forest background, mossy green woods, soft fog, gentle light shafts, slightly desaturated so foreground pops, vertical mobile game background scenery, no characters",
    workflow: "z-image-turbo", aspect: "9:16" },
  { id: "bg_kerning", group: "배경", label: "커닝시티 외곽",
    fragment: "a MapleStory-style Kerning City outskirts background at dusk, warm orange streetlights, urban edge, slightly melancholic but vivid, slightly desaturated so foreground pops, vertical mobile game background scenery, no characters",
    workflow: "z-image-turbo", aspect: "9:16" },
  { id: "bg_perion", group: "배경", label: "페리온/설원",
    fragment: "a MapleStory-style Perion rocky highland and snowy field background, harsh windswept terrain, cool tones with vivid accents, slightly desaturated so foreground pops, vertical mobile game background scenery, no characters",
    workflow: "z-image-turbo", aspect: "9:16" },
  { id: "bg_boss", group: "배경", label: "보스 던전",
    fragment: "a grand dramatic MapleStory-style boss dungeon chamber background, ancient guardian shrine, golden light beams, epic atmosphere, vivid, vertical mobile game background scenery, no characters",
    workflow: "z-image-turbo", aspect: "9:16" },
];

// ---- Screen mockups (full UI screens to design) ----
export const SCREENS = [
  { id: "scr_board", label: "메인 머지 보드",
    fragment: "a mobile merge-puzzle game MAIN SCREEN, portrait orientation: a 7x7 grid merge board in the center filled with cute monster icons inside rounded rarity item-frames, a top header bar showing a coin counter, an energy bar, and a level indicator, a glowing monster-egg nest spawner button at the bottom center, a restoration order/quest card docked on one side",
    aspect: "9:16" },
  { id: "scr_worldmap", label: "월드맵/지역 선택",
    fragment: "a mobile game WORLD MAP / region-select screen, portrait orientation: a winding path connecting 5 region nodes (grassland field, slime forest, dusk city, snowy highland, boss dungeon), each node an illustrated icon with locked and unlocked states and level-gate labels, a banner header on top",
    aspect: "9:16" },
  { id: "scr_order", label: "복원 의뢰 팝업",
    fragment: "a mobile game ORDER / QUEST popup card, portrait orientation: an NPC portrait giving a monster restoration request, a row of requested monster icons, a coin reward badge, a big accept button, a rounded dark panel with vivid trim, dimmed background behind",
    aspect: "9:16" },
  { id: "scr_codex", label: "몬스터 도감",
    fragment: "a mobile game MONSTER CODEX / collection screen, portrait orientation: a grid of monster entry cards, some discovered with art and some locked as dark silhouettes, completion progress bar on top, rounded vivid cards",
    aspect: "9:16" },
  { id: "scr_energyshop", label: "에너지 상점 팝업",
    fragment: "a mobile game ENERGY SHOP popup, portrait orientation: rows of energy packs for sale each with a lightning energy icon, an amount and a price with buy buttons, a rounded panel with vivid trim, dimmed background behind",
    aspect: "9:16" },
  { id: "scr_merge_fx", label: "진화(머지) 연출 순간",
    fragment: "a mobile merge game EVOLUTION CELEBRATION moment, portrait orientation: two small monsters merging into one bigger evolved monster in a burst of light and sparkles, satisfying juicy effect, dynamic vivid art",
    aspect: "9:16" },
];

export const CONFIG = {
  palette: PALETTE,
  styleBase: STYLE_BASE,
  styleUi: STYLE_UI,
  negativeBase: NEGATIVE_BASE,
  negativeUi: NEGATIVE_UI,
  aspects: ASPECTS,
  workflows: WORKFLOWS,
  subjects: SUBJECTS,
  screens: SCREENS,
};
