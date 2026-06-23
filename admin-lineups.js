(function () {
  const updatedAt = "2026-06-11";
  const kungfuInfo = {
    无相劫指: { quality: "红", school: "少林" },
    天佛降世: { quality: "金", school: "少林" },
    火凤葬仙决: { quality: "神通", school: "佛门" },
    佛光普照: { quality: "红", school: "少林" },
    万佛朝宗: { quality: "金", school: "少林" },
    佛点千灯: { quality: "金", school: "少林" },
    天龙八音: { quality: "金", school: "少林" },
    大悲狮子吼: { quality: "红", school: "少林" },
    净世业火莲: { quality: "神通", school: "佛门" },
    太乙玄罡阵: { quality: "金", school: "武当" },
    天地同寿: { quality: "金", school: "武当" },
    先天一气诀: { quality: "金", school: "武当" },
    四象镇天印: { quality: "红", school: "武当" },
    紫薇星斗阵: { quality: "橙", school: "武当" },
    破空剑法: { quality: "橙", school: "剑阁" },
    回风拂柳剑: { quality: "橙", school: "剑阁" },
    夺命十三剑: { quality: "红", school: "剑阁" },
    六脉神剑: { quality: "红", school: "剑阁" },
    流星剑雨: { quality: "橙", school: "剑阁" },
    青冥九针: { quality: "红", school: "逍遥" },
  };

  const rawLineups = [
    {
      name: "站长推荐：少林灼烧六脉",
      variants: [
        ["无相劫指", "天佛降世"],
        ["佛光普照", "万佛朝宗"],
        ["佛点千灯"],
        ["天龙八音", "大悲狮子吼"],
        ["夺命十三剑"],
        ["六脉神剑"],
      ],
    },
    {
      name: "站长推荐：佛门少林兜底",
      low_priority: true,
      variants: [
        ["天佛降世"],
        ["火凤葬仙决"],
        ["万佛朝宗"],
        ["佛点千灯"],
        ["天龙八音"],
        ["净世业火莲"],
      ],
    },
    {
      name: "站长推荐：武当重创六脉",
      variants: [
        ["太乙玄罡阵"],
        ["天地同寿", "先天一气诀"],
        ["四象镇天印"],
        ["紫薇星斗阵"],
        ["夺命十三剑"],
        ["六脉神剑"],
      ],
    },
    {
      name: "站长推荐：紫薇青冥六脉",
      variants: [
        ["回风拂柳剑"],
        ["破空剑法"],
        ["夺命十三剑"],
        ["紫薇星斗阵"],
        ["六脉神剑"],
        ["青冥九针"],
      ],
    },
    {
      name: "站长推荐：紫薇流星六脉",
      variants: [
        ["破空剑法"],
        ["紫薇星斗阵"],
        ["回风拂柳剑"],
        ["夺命十三剑"],
        ["六脉神剑"],
        ["流星剑雨"],
      ],
    },
  ];

  function expandVariants(variants, index = 0, current = [], out = []) {
    if (index >= variants.length) {
      out.push(current);
      return out;
    }
    for (const name of variants[index]) {
      expandVariants(variants, index + 1, [...current, name], out);
    }
    return out;
  }

  function slotOf(name, index) {
    const info = kungfuInfo[name] || {};
    return {
      pos: index + 1,
      name,
      normal_name: name,
      quality: info.quality || "",
      school: info.school || "",
    };
  }

  const lineups = rawLineups.flatMap((raw) => {
    const combos = expandVariants(raw.variants);
    return combos.map((combo, index) => ({
      name: combos.length > 1 ? `${raw.name} #${index + 1}` : raw.name,
      low_priority: Boolean(raw.low_priority),
      core: combo,
      slots: combo.map(slotOf),
    }));
  });

  window.ZSZS_ADMIN_LINEUPS = {
    meta: {
      count: lineups.length,
      updated_at: updatedAt,
    },
    lineups,
  };
})();
