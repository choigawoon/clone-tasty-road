// Builds the merge-game UI into ui/DefaultGroup.ui (portrait, 1080x1920 reference).
// Run from project root:  node .builder-work/build_merge_ui.cjs
const { UIBuilder } = require("/Users/choigawoon/clone-tasty-road/.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const SPRITE = "MOD.Core.SpriteGUIRendererComponent";

// RUIDs (from msw-search)
const COIN = "02a489cccff24a139a6c3582a5871f58";
const ENERGY = "4564eabe4d6e422fabe7104c08308b25";
const SPAWNER = "e3aaa0ed27d24d6faf044b648b58cd2b";
const T1 = "263b7db3067545a7acf7bbe5c3b61a4c"; // 사과

const COLS = 7, ROWS = 7, CELL = 132;
const SPAWNER_R = 6, SPAWNER_C = 3;

const b = UIBuilder.load("ui/DefaultGroup.ui");

// ---- Background (covers the world map behind the UI) ----
b.sprite("Bg", { anchor: "stretch", color: "#241b2e", raycast: true });

// ---- Safe area container ----
b.panel("Safe", { anchor: "stretch" });

// ============ Header (coins left, energy right) ============
b.sprite("Safe/Header", { anchor: "top-center", pos: [0, -95], rect_size: [1000, 150], color: "#3b3047", alpha: 0.95, raycast: false, pivot: [0.5, 0.5] });

b.sprite("Safe/Header/CoinIcon", { anchor: "middle-left", pos: [48, 0], rect_size: [52, 52], image_ruid: COIN, raycast: false, pivot: [0.5, 0.5] });
b.patchComponent("Safe/Header/CoinIcon", SPRITE, { Type: 0, PreserveSprite: 1 });
b.text("Safe/Header/CoinText", "0", { anchor: "middle-left", pos: [185, 0], rect_size: [200, 60], size: 32, color: "#ffe08a", alignment: 3, pivot: [0.5, 0.5] });

b.sprite("Safe/Header/EnergyIcon", { anchor: "middle-right", pos: [-345, -4], rect_size: [44, 44], image_ruid: ENERGY, raycast: false, pivot: [0.5, 0.5] });
b.patchComponent("Safe/Header/EnergyIcon", SPRITE, { Type: 0, PreserveSprite: 1 });
b.sprite("Safe/Header/EnergyBarBg", { anchor: "middle-right", pos: [-170, -4], rect_size: [300, 44], color: "#15101c", raycast: false, pivot: [0.5, 0.5] });
b.sprite("Safe/Header/EnergyBarBg/Fill", { anchor: "stretch", color: "#46c46a", raycast: false });
b.patchComponent("Safe/Header/EnergyBarBg/Fill", SPRITE, { Type: 3, FillMethod: 0, FillOrigin: 0, FillAmount: 1 });
b.text("Safe/Header/EnergyText", "20 / 20", { anchor: "middle-right", pos: [-170, -4], rect_size: [300, 44], size: 24, color: "#ffffff", alignment: 4, pivot: [0.5, 0.5] });

// ============ Order bar (cards added at runtime) ============
b.sprite("Safe/OrderBar", { anchor: "top-center", pos: [0, -305], rect_size: [1000, 230], color: "#241d2c", alpha: 0.9, raycast: false, pivot: [0.5, 0.5] });
// hidden order-card template (a clickable button with icon/name/reward children)
b.button("Safe/OrderBar/OrderCardTemplate", "", { anchor: "middle-center", pos: [0, 0], rect_size: [300, 200], enable: false, pivot: [0.5, 0.5] });
b.patchComponent("Safe/OrderBar/OrderCardTemplate", SPRITE, { Type: 1, Color: { r: 0.29, g: 0.25, b: 0.35, a: 1.0 } });
b.sprite("Safe/OrderBar/OrderCardTemplate/Icon", { anchor: "top-center", pos: [0, -58], rect_size: [108, 108], image_ruid: T1, raycast: false, pivot: [0.5, 0.5] });
b.patchComponent("Safe/OrderBar/OrderCardTemplate/Icon", SPRITE, { Type: 0, PreserveSprite: 1 });
b.text("Safe/OrderBar/OrderCardTemplate/Name", "", { anchor: "middle-center", pos: [0, 6], rect_size: [280, 40], size: 24, color: "#ffffff", alignment: 4, pivot: [0.5, 0.5] });
b.text("Safe/OrderBar/OrderCardTemplate/Reward", "+0", { anchor: "bottom-center", pos: [0, 16], rect_size: [280, 40], size: 26, color: "#ffe08a", alignment: 4, pivot: [0.5, 0.5] });

// ============ Board ============
b.sprite("Safe/BoardArea", { anchor: "middle-center", pos: [0, -120], rect_size: [960, 960], color: "#1c1626", alpha: 0.95, raycast: false, pivot: [0.5, 0.5] });

// grid cells (visual slots)
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x = (c - (COLS - 1) / 2) * CELL;
    const y = ((ROWS - 1) / 2 - r) * CELL;
    const name = `Safe/BoardArea/Cell_${r}_${c}`;
    b.sprite(name, { anchor: "middle-center", pos: [x, y], rect_size: [124, 124], color: "#ffffff", alpha: 0.06, raycast: false, pivot: [0.5, 0.5] });
  }
}

// spawner (button at a fixed cell) with child icon
const sx = (SPAWNER_C - (COLS - 1) / 2) * CELL;
const sy = ((ROWS - 1) / 2 - SPAWNER_R) * CELL;
b.button("Safe/BoardArea/Spawner", "", { anchor: "middle-center", pos: [sx, sy], rect_size: [122, 122], pivot: [0.5, 0.5] });
b.patchComponent("Safe/BoardArea/Spawner", SPRITE, { Type: 1, Color: { r: 0.85, g: 0.55, b: 0.25, a: 1.0 } });
b.sprite("Safe/BoardArea/Spawner/Icon", { anchor: "middle-center", pos: [0, 0], rect_size: [96, 96], image_ruid: SPAWNER, raycast: false, pivot: [0.5, 0.5] });
b.patchComponent("Safe/BoardArea/Spawner/Icon", SPRITE, { Type: 0, PreserveSprite: 1 });

// draggable item template (hidden; cloned per board item)
b.sprite("Safe/BoardArea/ItemTemplate", { anchor: "middle-center", pos: [0, 0], rect_size: [118, 118], image_ruid: T1, raycast: true, enable: false, pivot: [0.5, 0.5] });
b.patchComponent("Safe/BoardArea/ItemTemplate", SPRITE, { Type: 0, PreserveSprite: 1 });
b.addComponent("Safe/BoardArea/ItemTemplate", "MOD.Core.UITouchReceiveComponent");

// ============ Footer (status messages) ============
b.sprite("Safe/Footer", { anchor: "bottom-center", pos: [0, 55], rect_size: [1000, 80], color: "#3b3047", alpha: 0.85, raycast: false, pivot: [0.5, 0.5] });
b.text("Safe/Footer/StatusText", "", { anchor: "middle-center", pos: [0, 0], rect_size: [960, 70], size: 24, color: "#ffffff", alignment: 4, overflow: 2, pivot: [0.5, 0.5] });

// ============ Controller script node ============
b.script("Controller", "script.MergeBoardController", { anchor: "stretch", pos: [0, 0], rect_size: [1080, 1920] });

// ---- write + inject bindings into the controller .mlua ----
b.write("ui/DefaultGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/MergeBoardController.mlua",
    props: {
      boardArea: "Safe/BoardArea",
      itemTemplate: "Safe/BoardArea/ItemTemplate",
      spawnerBtn: "Safe/BoardArea/Spawner",
      spawnerSprite: "Safe/BoardArea/Spawner/Icon",
      coinText: "Safe/Header/CoinText",
      energyText: "Safe/Header/EnergyText",
      energyFill: "Safe/Header/EnergyBarBg/Fill",
      orderBar: "Safe/OrderBar",
      orderCardTemplate: "Safe/OrderBar/OrderCardTemplate",
      statusText: "Safe/Footer/StatusText",
    },
  },
});

console.log("OK: DefaultGroup.ui built + bindings injected");
