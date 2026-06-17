// Builds the level bar, world-map button, region label, and the WorldMapScreen
// overlay into ui/DefaultGroup.ui, then injects .ui UUIDs into the two controllers.
// Re-runnable: creators upsert in place.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI = "ui/DefaultGroup.ui";
const MERGE = "RootDesk/MyDesk/MergeBoardController.mlua";
const WORLDMAP = "RootDesk/MyDesk/Progression/WorldMapController.mlua";

const b = UIBuilder.load(UI);

// ---------------------------------------------------------------
// 1) In-game level bar (below the header): "Lv N" + XP fill
// ---------------------------------------------------------------
b.sprite("Safe/LevelBar", { anchor: "top-center", pos: [0, -235], rect_size: [940, 64], pivot: [0.5, 0.5], alpha: 0, raycast: false });
b.text("Safe/LevelBar/LevelText", "Lv 1", { anchor: "middle-left", pos: [10, 0], rect_size: [160, 56], size: 34, color: "#FFE08A", bold: true, alignment: 3 });
b.sprite("Safe/LevelBar/XpBarBg", { anchor: "middle-left", pos: [184, 0], rect_size: [720, 28], color: "#2B2F3A" });
b.sprite("Safe/LevelBar/XpBarBg/Fill", { anchor: "stretch", color: "#7ED957", sprite_type: 3, fill_method: 0 });
b.patchComponent("Safe/LevelBar/XpBarBg/Fill", "MOD.Core.SpriteGUIRendererComponent", { Type: 3, FillMethod: 0, FillOrigin: 0, FillAmount: 1.0 });

// ---------------------------------------------------------------
// 2) World-map open button (bottom-right) + region label (bottom-left)
// ---------------------------------------------------------------
b.button("Safe/WorldMapBtn", "🗺 월드맵", { anchor: "bottom-right", pos: [-30, 30], rect_size: [280, 104], font_size: 30, color: "#FFFFFF" });
b.patchComponent("Safe/WorldMapBtn", "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.17, g: 0.42, b: 0.70, a: 1.0 } });
b.text("Safe/RegionLabel", "📍 여행지", { anchor: "bottom-left", pos: [30, 44], rect_size: [440, 56], size: 30, color: "#FFFFFF", alignment: 3 });

// ---------------------------------------------------------------
// 3) World-map overlay (full-screen, starts hidden, high displayOrder)
// ---------------------------------------------------------------
b.sprite("WorldMapScreen", { anchor: "stretch", color: "#0F1422", alpha: 1.0, raycast: true, enable: false });
b.patch("WorldMapScreen", { display_order: 50 });
b.text("WorldMapScreen/Title", "월드맵", { anchor: "top-center", pos: [0, -130], rect_size: [700, 90], size: 60, color: "#FFFFFF", bold: true, alignment: 4 });
b.text("WorldMapScreen/Subtitle", "Lv 1 · 지역을 선택하세요", { anchor: "top-center", pos: [0, -235], rect_size: [820, 56], size: 32, color: "#C8D0E0", alignment: 4 });
b.button("WorldMapScreen/CloseBtn", "✕ 게임으로", { anchor: "top-right", pos: [-30, -40], rect_size: [300, 96], font_size: 30, color: "#FFFFFF" });
b.patchComponent("WorldMapScreen/CloseBtn", "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 0.20, g: 0.23, b: 0.30, a: 1.0 } });

// list container + card template (cloned per region at runtime)
b.sprite("WorldMapScreen/List", { anchor: "middle-center", pos: [0, -40], rect_size: [980, 1320], alpha: 0, raycast: false });
b.button("WorldMapScreen/List/CardTemplate", "", { anchor: "middle-center", pos: [0, 0], rect_size: [900, 220], font_size: 24, color: "#000000", enable: false });
b.patchComponent("WorldMapScreen/List/CardTemplate", "MOD.Core.SpriteGUIRendererComponent", { Color: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 } });
b.sprite("WorldMapScreen/List/CardTemplate/Icon", { anchor: "middle-left", pos: [40, 0], rect_size: [150, 150] });
b.text("WorldMapScreen/List/CardTemplate/Name", "지역", { anchor: "middle-left", pos: [220, 36], rect_size: [560, 64], size: 42, color: "#23262E", bold: true, alignment: 3 });
b.text("WorldMapScreen/List/CardTemplate/Status", "입장하기", { anchor: "middle-left", pos: [220, -38], rect_size: [560, 52], size: 30, color: "#5A5F6A", alignment: 3 });

// ---------------------------------------------------------------
// 4) World-map controller script entity (always enabled, separate from the overlay)
// ---------------------------------------------------------------
b.script("WorldMapController", "script.WorldMapController", { anchor: "stretch", pos: [0, 0], rect_size: [1080, 1920], enable: true });

// ---------------------------------------------------------------
// 4b) Declutter: hide leftover combat UI that doesn't belong on the merge board
//     (these would otherwise overlap the new world-map button).
// ---------------------------------------------------------------
for (const leftover of ["Button_Attack", "Button_Jump", "UIJoystick"]) {
  if (b.find(leftover)) b.patch(leftover, { enable: false });
}

// ---------------------------------------------------------------
// 5) Write + inject bindings into both controllers
// ---------------------------------------------------------------
b.write(UI, {
  strict: false,
  lint_verbose: true,
  bind: {
    mlua: MERGE,
    props: {
      levelText: "Safe/LevelBar/LevelText",
      xpFill: "Safe/LevelBar/XpBarBg/Fill",
      regionLabel: "Safe/RegionLabel",
      worldMapBtn: "Safe/WorldMapBtn",
      worldMap: "WorldMapController",
    },
  },
});

b.injectBindings(WORLDMAP, {
  screen: "WorldMapScreen",
  listContainer: "WorldMapScreen/List",
  cardTemplate: "WorldMapScreen/List/CardTemplate",
  subtitleText: "WorldMapScreen/Subtitle",
  closeBtn: "WorldMapScreen/CloseBtn",
  game: "Controller",
});

console.log("OK: built world-map UI and injected bindings");
