/** Six 16x16 role bases: hat, hood+staff, scarf, goggles, pack, circlet. */
/** Builder: hard hat, wide shoulders, hammer loop on the belt. */
export const BUILDER = [
  "................",
  ".....cccccc.....",
  "...cccccccccc...",
  "...cbbbbbbbbc...",
  "....bDbDDbDb....",
  "....bbbbbbbb....",
  ".....cccccc.....",
  "...cccccccccc...",
  "..cccccccccccc..",
  "..ccbccccccbcc..",
  "....cccccccc....",
  "....cVVVVVc.....",
  ".....cc..cc.....",
  ".....cc..cc.....",
  ".....cc..cc.....",
  "....KKK..KKK....",
] as const;

/** Medic: round hood, satchel on the left hip, bone cross on the chest. */
export const MEDIC = [
  ".....V..........",
  ".....VVVVV......",
  "....Vcccccc.....",
  "....cbbbbbb.....",
  ".W..cbDbDbD.....",
  ".S..cbbbbbb.....",
  ".S...cbbbc......",
  ".S..ccbbbc......",
  ".S.Qccbbbc......",
  ".S.Qcccccc......",
  ".S.QQcccc.......",
  ".S..cVVVc.......",
  ".S...cc.cc......",
  ".....cc.cc......",
  ".....cc.cc......",
  "....KKK.KKK.....",
];

/** Striker: spiked scarf, broad chest, heavy boots. */
export const STRIKER = [
  "................",
  "................",
  ".....cc.cc......",
  "....cbbbbb......",
  "....bDbDDb......",
  "....bbbbbb......",
  ".K.cccccccc.K...",
  "..cccccccccc....",
  "..cccccccccc....",
  "..ccbccccbcc....",
  "...cccccccc.....",
  "....cVVVcc......",
  "....cc...cc.....",
  "....cc...cc.....",
  "...ccc...ccc....",
  "...KKK...KKK....",
];

/** Scout: goggles, lean 2px-narrower torso, toe-first boots. */
export const SCOUT = [
  "................",
  "................",
  "......bbbb......",
  ".....bDDDDb.....",
  ".....bDbDb......",
  "......bbbb......",
  "......cccc......",
  ".....cccccc.....",
  ".....cccccc.....",
  ".....cbccbc.....",
  "......cccc......",
  "......cVVc......",
  "......cc........",
  ".....cc.cc......",
  ".....cc..cc.....",
  "....KKK..KKK....",
];

/** Keeper: wide oil-canister backpack, rose hood, lantern charm. */
export const KEEPER = [
  "................",
  ".....PPPPP......",
  "....PPbbbPP.....",
  "....PbbbbbPPP...",
  "....PbDbDbPP....",
  "....PbbbbbPPPS..",
  "....PbDbDbPQSS..",
  ".SS.PPPPPPQS....",
  ".SSQccccccSS....",
  ".SSQcWAcc.SS....",
  ".SSQcccc..SS....",
  "....cVVVc.......",
  ".....cc.cc......",
  ".....cc.cc......",
  ".....cc.cc......",
  "....KKK.KKK.....",
];

/** Lumen: bright circlet, flowing cloak, amber charm at the throat. */
export const LUMEN = [
  ".....W....W.....",
  ".....WWWWW......",
  ".....WcccW......",
  ".....cbbbb......",
  ".....bDbDb......",
  ".....bbbbbb.....",
  "....cccAcc......",
  "..cccccccccc....",
  "..cccccccccc....",
  "...cccAcc.......",
  "..cccccccc......",
  "....cVVVc.......",
  "...cccc.cc......",
  "...ccc..ccc.....",
  "...ccc..ccc.....",
  "....KKK.KKK.....",
];

export const ROLES_LIST = [
  "builder",
  "medic",
  "striker",
  "scout",
  "keeper",
  "lumen",
] as const;

export const ROLE_BASES: Record<string, readonly string[]> = {
  builder: BUILDER,
  medic: MEDIC,
  striker: STRIKER,
  scout: SCOUT,
  keeper: KEEPER,
  lumen: LUMEN,
};

export const ROLE_COLOR: Record<string, string> = {
  builder: "T",
  medic: "G",
  striker: "R",
  scout: "B",
  keeper: "P",
  lumen: "L",
};
