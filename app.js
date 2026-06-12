const data = window.ZSZS_KUNGFU_DATA;
const adminData = window.ZSZS_ADMIN_LINEUPS || { meta: { count: 0 }, lineups: [] };
const popularData = window.ZSZS_POPULAR_LINEUPS || { meta: { count: 0 }, lineups: [] };

const QUALITY_NAMES = { 4: "紫", 5: "橙", 6: "红", 7: "金", 8: "神通" };
const QUALITY_ORDER = [8, 7, 6, 5, 4];
const SCHOOL_ORDER = ["佛门", "道家", "剑宗", "青冥", "天绝", "少林", "武当", "剑阁", "逍遥", "登仙", "基础"];
const STORAGE_KEY = "zszs-simple-owned-v1";
const XIANJIE_GROUP_NAME = "仙界第6天榜单";
const BOOK_ORDER = {
  "8:佛门": ["火凤葬仙决", "梵天浮屠塔", "大日炎轮经", "净世业火莲"],
  "8:道家": ["阴阳逆元符", "天引神雷术", "五行镇天阵", "千鹤裂空杀"],
  "8:剑宗": ["流光剑意", "星河淬剑诀", "寂灭红尘斩", "龙吟九霄剑"],
  "8:青冥": ["幽泉引魂歌", "修罗千蛊咒", "窃天造化功", "五衰夺运术"],
  "8:天绝": ["玄魔降世", "破妄神光", "斩龙剑阵"],
  "7:少林": ["天佛降世", "万佛朝宗", "佛点千灯", "天龙八音"],
  "7:武当": ["太乙玄罡阵", "仙人指路", "天地同寿", "先天一气诀"],
  "7:剑阁": ["万剑归宗", "剑二十三", "天外飞仙", "一剑隔世"],
  "7:逍遥": ["寒冰生死符", "暴雨梨花针", "北冥神功", "黯然销魂手"],
  "7:登仙": ["乙木生雷诀", "太虚五衰咒", "太乙分光诀"],
  "6:武当": ["真武七截阵", "四象镇天印", "太阴惊雷掌", "降龙神掌"],
  "6:剑阁": ["夺命十三剑", "独孤九剑", "六脉神剑", "倾城一剑"],
  "5:少林": ["一阳指", "南明离火棍", "般若禅掌", "达摩渡世拳"],
  "5:武当": ["紫薇星斗阵", "霹雳绝掌", "九阴神爪", "九阳天罡拳"],
  "5:剑阁": ["破空剑法", "落花无情剑", "回风拂柳剑", "流星剑雨"],
};

const state = {
  owned: {},
  excluded: {},
};

const els = {
  dataMeta: document.querySelector("#dataMeta"),
  resetOwned: document.querySelector("#resetOwned"),
  ownedState: document.querySelector("#ownedState"),
  ownedSummary: document.querySelector("#ownedSummary"),
  kungfuGrid: document.querySelector("#kungfuGrid"),
  recommendations: document.querySelector("#recommendations"),
};

const groups = buildGroups();
const groupByName = new Map(groups.map((group) => [group.name, group]));
const ADMIN_RECOMMENDATIONS = buildRecommendations(adminData, "admin").filter((template) => !hasDengxianTemplate(template));
const POPULAR_RECOMMENDATIONS = buildRecommendations(popularData, "popular");
const LEADERBOARD_DAYS = leaderboardDayLabels(popularData);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildRecommendations(raw, kind = "popular") {
  if (Array.isArray(raw.groups) && raw.groups.length) {
    return raw.groups.flatMap((group, groupIndex) =>
      normalizeLineups(group.lineups || [], groupIndex, kind).map((lineup) => ({
        ...lineup,
        group_name: group.name || lineup.group_name || "",
      }))
    );
  }
  return normalizeLineups(raw.lineups || [], 0, kind);
}

function normalizeLineups(lineups, groupIndex, kind) {
  return lineups.map((lineup, index) => ({
    kind,
    name: lineup.name || `热门搭配 #${index + 1}`,
    group_name: lineup.group_name || "",
    core: lineup.core || [],
    slots: lineup.slots || [],
    player: {
      ...(lineup.player || {}),
      sort_index: lineup.player?.sort_index ?? index + 1,
    },
    group_index: groupIndex,
  }));
}

function leaderboardDayLabels(raw) {
  const openingDays = new Set();
  const otherLabels = [];
  for (const group of raw.groups || []) {
    const name = String(group.name || "").trim();
    if (!name) continue;
    const match = name.match(/开服\s*(\d+)\s*天/);
    if (match) {
      openingDays.add(Number(match[1]));
    } else if (!otherLabels.includes(name)) {
      otherLabels.push(name);
    }
  }
  return [
    ...[...openingDays].sort((a, b) => a - b).map((day) => `开服${day}天`),
    ...otherLabels,
  ];
}

function hasDengxianName(name) {
  const group = findGroup(name);
  if (group?.item?.weapon_name === "登仙") return true;
  const dengxianNames = BOOK_ORDER["7:登仙"] || [];
  const cleanName = String(name || "").replace("·极", "");
  return dengxianNames.includes(cleanName);
}

function hasDengxianTemplate(template) {
  if ((template.slots || []).some((slot) => slot.school === "登仙" || hasDengxianName(slot.normal_name || slot.name))) {
    return true;
  }
  return (template.core || []).some(hasDengxianName);
}

function buildGroups() {
  const map = new Map();
  for (const item of data.kungfu || []) {
    if (!QUALITY_ORDER.includes(Number(item.quality))) continue;
    const name = item.normal_name || item.name;
    if (!map.has(name)) map.set(name, { name, item });
  }
  return [...map.values()].sort((a, b) => {
    const qualityDiff = Number(b.item.quality || 0) - Number(a.item.quality || 0);
    if (qualityDiff) return qualityDiff;
    const schoolDiff = schoolIndex(a.item.weapon_name) - schoolIndex(b.item.weapon_name);
    if (schoolDiff) return schoolDiff;
    const orderDiff = bookOrderIndex(a) - bookOrderIndex(b);
    if (orderDiff) return orderDiff;
    return a.name.localeCompare(b.name, "zh-Hans-CN");
  });
}

function schoolIndex(name) {
  const index = SCHOOL_ORDER.indexOf(name);
  return index === -1 ? SCHOOL_ORDER.length : index;
}

function qualityClass(quality) {
  if (quality === 8) return "mythic";
  if (quality === 7) return "gold";
  if (quality === 6) return "red";
  if (quality === 5) return "orange";
  if (quality === 4) return "purple";
  return "blue";
}

function qualityLabel(quality) {
  return Number(quality) === 8 ? "神通" : `${QUALITY_NAMES[quality]}品`;
}

function qualitySectionTitle(quality) {
  return Number(quality) === 8 ? "神通武学" : `${QUALITY_NAMES[quality]}品武学`;
}

function slotQualityLabel(slotQuality, fallbackQuality) {
  if (slotQuality) return slotQuality === "神通" ? "神通" : `${slotQuality}品`;
  return qualityLabel(fallbackQuality);
}

function bookOrderIndex(group) {
  const key = `${Number(group.item.quality)}:${group.item.weapon_name}`;
  const order = BOOK_ORDER[key];
  if (!order) return 999999;
  const index = order.indexOf(group.name);
  return index === -1 ? 999999 : index;
}

function selectedHighestQuality() {
  return groups.reduce((highest, group) => {
    return state.owned[group.name] ? Math.max(highest, Number(group.item.quality || 0)) : highest;
  }, 0);
}

function isDefaultOwned(group, highest = selectedHighestQuality()) {
  return highest > 0 && Number(group.item.quality) < highest;
}

function isOwned(group, highest = selectedHighestQuality()) {
  if (isDefaultOwned(group, highest)) return !state.excluded[group.name];
  const value = state.owned[group.name];
  if (typeof value === "boolean") return value;
  return false;
}

function toggleGroup(group, highest = selectedHighestQuality()) {
  if (isDefaultOwned(group, highest)) {
    state.excluded[group.name] = !state.excluded[group.name];
    if (state.excluded[group.name]) delete state.owned[group.name];
    if (!state.excluded[group.name]) delete state.excluded[group.name];
  } else {
    state.owned[group.name] = !isOwned(group, highest);
    if (!state.owned[group.name]) delete state.owned[group.name];
    delete state.excluded[group.name];
  }
  saveState();
  render();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (saved && typeof saved === "object") {
      state.owned = saved.owned || {};
      state.excluded = saved.excluded || {};
    }
  } catch {
    state.owned = {};
    state.excluded = {};
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ owned: state.owned, excluded: state.excluded }));
  } catch {
    // Some embedded browsers can disable localStorage.
  }
}

function resetOwned() {
  state.owned = {};
  state.excluded = {};
  saveState();
  render();
}

function findGroup(name) {
  if (groupByName.has(name)) return groupByName.get(name);
  const cleanName = String(name || "").replace("·极", "");
  if (groupByName.has(cleanName)) return groupByName.get(cleanName);
  return groups.find((group) => group.name.includes(cleanName) || cleanName.includes(group.name)) || null;
}

function availableNames(highest) {
  return new Set(groups.filter((group) => isOwned(group, highest)).map((group) => group.name));
}

function selectedNames() {
  return new Set(groups.filter((group) => state.owned[group.name]).map((group) => group.name));
}

function hasSelectedDengxian() {
  return groups.some((group) => state.owned[group.name] && group.item.weapon_name === "登仙");
}

function hasSelectedShentong() {
  return groups.some((group) => state.owned[group.name] && Number(group.item.quality) === 8);
}

function recommendationTemplates() {
  if (hasSelectedShentong()) {
    return POPULAR_RECOMMENDATIONS.filter((template) => template.group_name === XIANJIE_GROUP_NAME);
  }
  if (hasSelectedDengxian()) return POPULAR_RECOMMENDATIONS;
  return [...ADMIN_RECOMMENDATIONS, ...POPULAR_RECOMMENDATIONS];
}

function textOfGroup(group) {
  const item = group?.item || {};
  return [group?.name, item.weapon_name, ...(item.effect_labels || [])]
    .join(" ")
    .toLowerCase();
}

function featureSet(groupsForLineup) {
  const features = new Set();
  const schools = new Map();
  for (const group of groupsForLineup) {
    const item = group.item || {};
    const text = textOfGroup(group);
    schools.set(item.weapon_name, (schools.get(item.weapon_name) || 0) + 1);
    if (/攻速/.test(text)) features.add("attackSpeed");
    if (/刷新|冷却|再次释放/.test(text)) features.add("refresh");
    if (/多段|段伤害|额外造成1段|造成.*次/.test(text)) features.add("multiHit");
    if (/重创/.test(text)) features.add("wound");
    if (/重击/.test(text)) features.add("heavyHit");
    if (/会心/.test(text)) features.add("crit");
    if (/灼烧|佛焱|燃烧/.test(text)) features.add("burn");
    if (/引爆|结算剩余/.test(text)) features.add("detonate");
    if (/中毒|毒/.test(text)) features.add("poison");
    if (/易伤|武学伤害|受.*伤害|伤害提升/.test(text)) features.add("vulnerable");
    if (/目标.*3|对3个目标|最多3个/.test(text)) features.add("threeTargets");
    if (/目标.*4|对4个目标|最多4个|全体/.test(text)) features.add("wideTargets");
  }
  return { features, schools };
}

function synergyValue(profile) {
  let value = 0;
  const has = (name) => profile.features.has(name);
  const majorSchool = [...profile.schools.entries()].sort((a, b) => b[1] - a[1])[0];
  if (majorSchool && majorSchool[1] >= 3) value += 18;
  if (has("attackSpeed") && has("refresh")) value += 20;
  if (has("attackSpeed") && has("multiHit")) value += 16;
  if (has("wound") && (has("multiHit") || has("crit"))) value += 18;
  if (has("burn") && has("detonate")) value += 18;
  if (has("poison") && has("vulnerable")) value += 14;
  if (has("wideTargets") || has("threeTargets")) value += 12;
  return value;
}

function fitLabel(row) {
  if (row.missingCore.length === 0) return "适配度高";
  if (row.missingCore.length <= 2) return "可尝试";
  return "需补核心";
}

function qualityWeight(group) {
  const quality = Number(group?.item?.quality || 0);
  if (quality === 8) return 220;
  if (quality === 7) return 100;
  if (quality === 6) return 45;
  if (quality === 5) return 18;
  if (quality === 4) return 8;
  return quality;
}

function lineupRank(template) {
  if (template.kind !== "popular") return 999999;
  return Number(template.player?.sort_index || 999999);
}

function lineupGroupRank(template) {
  if (template.kind !== "popular") return 999999;
  return Number(template.group_index || 0);
}

function compareLeaderboardOrder(a, b) {
  const groupDiff = lineupGroupRank(a.template) - lineupGroupRank(b.template);
  if (groupDiff) return groupDiff;
  const rankDiff = lineupRank(a.template) - lineupRank(b.template);
  if (rankDiff) return rankDiff;
  const powerDiff = Number(b.template.player?.power || 0) - Number(a.template.player?.power || 0);
  if (powerDiff) return powerDiff;
  return 0;
}

function compareRecommendation(a, b) {
  const aComplete = a.missingCore.length === 0;
  const bComplete = b.missingCore.length === 0;
  if (aComplete !== bComplete) return aComplete ? -1 : 1;

  if (aComplete && bComplete) {
    const leaderboardDiff = compareLeaderboardOrder(a, b);
    if (leaderboardDiff) return leaderboardDiff;

    const exactQualityDiff = b.exactQuality - a.exactQuality;
    if (exactQualityDiff) return exactQualityDiff;

    const qualityDiff = b.lineupQuality - a.lineupQuality;
    if (qualityDiff) return qualityDiff;
  }

  const missingDiff = a.missingCore.length - b.missingCore.length;
  if (missingDiff) return missingDiff;

  const missingWeightDiff = a.missingWeight - b.missingWeight;
  if (missingWeightDiff) return missingWeightDiff;

  const exactQualityDiff = b.exactQuality - a.exactQuality;
  if (exactQualityDiff) return exactQualityDiff;

  const availableDiff = b.availableCount - a.availableCount;
  if (availableDiff) return availableDiff;

  const qualityDiff = b.lineupQuality - a.lineupQuality;
  if (qualityDiff) return qualityDiff;

  const adminDiff = Number(b.template.kind === "admin") - Number(a.template.kind === "admin");
  if (adminDiff) return adminDiff;

  return compareLeaderboardOrder(a, b);
}

function recommendLineups(highest) {
  const ownedNames = availableNames(highest);
  const pickedNames = selectedNames();
  if (!pickedNames.size) return [];
  const templates = recommendationTemplates();
  return templates.map((template) => {
    const core = template.core.map(findGroup).filter(Boolean);
    const missingCore = core.filter((group) => !ownedNames.has(group.name));
    const exactOwned = core.filter((group) => pickedNames.has(group.name));
    const profile = featureSet(core);
    const synergy = synergyValue(profile);
    const qualityValue = core.reduce((sum, group) => sum + Number(group.item.quality || 0), 0);
    const lineupQuality = core.reduce((sum, group) => sum + qualityWeight(group), 0);
    const exactQuality = exactOwned.reduce((sum, group) => sum + qualityWeight(group), 0);
    const missingWeight = missingCore.reduce((sum, group) => sum + qualityWeight(group), 0);
    const availableCount = core.length - missingCore.length;
    const powerValue = Number(template.player?.power || 0) / 100000000;
    const fitValue =
      exactOwned.length * 120 +
      availableCount * 60 -
      missingCore.length * 180 +
      synergy +
      qualityValue * 2 +
      Math.min(powerValue, 40);
    return { template, core, missingCore, exactOwned, fitValue, lineup: core, lineupQuality, exactQuality, missingWeight, availableCount };
  })
    .filter((row) => row.lineup.length >= 3)
    .filter((row) => row.exactOwned.length > 0 || row.missingCore.length <= 2)
    .sort(compareRecommendation)
    .slice(0, 30);
}

function formatPower(power) {
  const value = Number(power || 0);
  if (!value) return "";
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `${Math.round(value / 10000)}万`;
  return String(value);
}

function lineupMetaText(template) {
  const groupName = template.group_name && template.group_name !== "热门搭配" ? `${template.group_name} · ` : "";
  return `${groupName}战力 ${formatPower(template.player?.power)}`;
}

function slotLevelText(slot) {
  const rank = slot.rank_display;
  const level = slot.level_display;
  if (rank == null && level == null) return "";
  if (rank == null) return `${level}重`;
  if (level == null) return `${rank}阶`;
  return `${rank}阶${level}重`;
}

function renderSummary(highest) {
  const counts = {};
  for (const quality of QUALITY_ORDER) counts[quality] = { total: 0, owned: 0 };
  for (const group of groups) {
    const quality = Number(group.item.quality);
    counts[quality].total += 1;
    if (isOwned(group, highest)) counts[quality].owned += 1;
  }
  els.ownedSummary.innerHTML = QUALITY_ORDER.map(
    (quality) => `
      <div class="summary-card ${qualityClass(quality)}">
        <strong>${qualityLabel(quality)}</strong>
        <span>${counts[quality].owned}/${counts[quality].total} 可用</span>
      </div>
    `
  ).join("");
}

function renderKungfuGrid(highest) {
  const rows = groups;
  const qualities = QUALITY_ORDER;
  els.kungfuGrid.innerHTML = qualities
    .map((quality) => {
      const qualityRows = rows.filter((group) => Number(group.item.quality) === quality);
      if (!qualityRows.length) return "";
      const schools = SCHOOL_ORDER.map((school) => ({
        school,
        rows: qualityRows.filter((group) => group.item.weapon_name === school),
      })).filter((entry) => entry.rows.length);
      return `
        <section class="quality-section ${qualityClass(quality)}">
          <div class="quality-title">${qualitySectionTitle(quality)}</div>
          <div class="school-board">
            ${schools
              .map(
                (entry) => `
              <div class="school-column">
                <h3>${escapeHtml(entry.school)}</h3>
                <div class="school-list">
                  ${entry.rows
	                    .map((group) => {
	                      const item = group.item;
	                      const owned = isOwned(group, highest);
	                      const defaultOwned = isDefaultOwned(group, highest);
	                      const excluded = Boolean(state.excluded[group.name]);
	                      return `
	                        <button class="kungfu-card ${qualityClass(quality)} ${owned ? "owned" : "locked"} ${defaultOwned ? "default-owned" : "manual-owned"} ${excluded ? "excluded" : ""}" data-name="${escapeHtml(group.name)}" type="button">
	                          <span class="school-mark">${escapeHtml(entry.school.slice(0, 1))}</span>
	                          <span class="icon-box">
	                            <span class="icon-fallback">${escapeHtml(group.name.slice(0, 2))}</span>
	                          </span>
	                          <span class="name">${escapeHtml(group.name)}</span>
	                          <span class="status">${excluded ? "已排除" : owned ? (defaultOwned ? "默认可用" : "已选") : "未拥有"}</span>
	                        </button>
	                      `;
                    })
                    .join("")}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
  els.kungfuGrid.querySelectorAll("[data-name]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = groupByName.get(button.dataset.name);
      if (!group) return;
      toggleGroup(group, selectedHighestQuality());
    });
  });
}

function renderRecommendations(highest) {
  const rows = recommendLineups(highest);
  const ownedNames = availableNames(highest);
  if (!rows.length) {
    els.recommendations.innerHTML = `
      <div class="empty-state">
        <strong>先选择你拥有的武学</strong>
        <p>点选橙品、红品或金品武学后，这里会按适配情况推荐搭配。更低品质会自动进入可用池，也可以在上方手动排除。</p>
      </div>
    `;
    return;
  }
  els.recommendations.innerHTML = rows
    .map(
      (row, index) => `
      <article class="recommend-card ${row.template.kind === "admin" ? "admin-recommend" : ""}">
        <div class="recommend-head">
          <div>
            <strong>${index + 1}. ${escapeHtml(row.template.name)}</strong>
            ${
              row.template.kind === "admin"
                ? `<div class="admin-meta">站长推荐</div>`
                : ""
            }
            ${
              row.template.kind === "popular"
                ? `<div class="power-meta">${escapeHtml(lineupMetaText(row.template))}</div>`
                : ""
            }
          </div>
          <span class="fit-pill">${escapeHtml(fitLabel(row))}</span>
        </div>
        ${
          row.missingCore.length
            ? `<div class="missing">缺核心：${row.missingCore.map((group) => escapeHtml(group.name)).join(" / ")}</div>`
            : `<div class="ready">核心已齐，可以直接试。</div>`
        }
        <ol class="lineup">
          ${
            row.template.slots?.length
              ? row.template.slots
                  .map((slot) => {
                    const group = findGroup(slot.normal_name || slot.name);
                    const item = group?.item;
                    const owned = group ? ownedNames.has(group.name) : false;
                    const quality = Number(item?.quality || 7);
                    return `<li class="${qualityClass(quality)} ${owned ? "" : "missing-slot"}">
                      <span>${escapeHtml(slot.name)}</span>
                      <small>${escapeHtml(slot.school || item?.weapon_name || "")} · ${escapeHtml(slotQualityLabel(slot.quality, quality))} · ${escapeHtml(slotLevelText(slot))}</small>
                    </li>`;
                  })
                  .join("")
              : row.lineup
                  .map((group) => {
                    const item = group.item;
                    return `<li class="${qualityClass(Number(item.quality))}"><span>${escapeHtml(group.name)}</span><small>${escapeHtml(item.weapon_name)} · ${qualityLabel(item.quality)}</small></li>`;
                  })
                  .join("")
          }
        </ol>
      </article>
    `
    )
    .join("");
}

function render() {
  const highest = selectedHighestQuality();
  const below = QUALITY_ORDER.filter((quality) => quality < highest)
    .sort((a, b) => b - a)
    .map(qualityLabel)
    .join("、") || "无";
  const selectedText = highest ? qualityLabel(highest) : "未选择";
  const leaderboardText = LEADERBOARD_DAYS.length ? LEADERBOARD_DAYS.join("、") : "暂无";
  const updatedAt = popularData.meta?.updated_at ? ` · 更新时间：${escapeHtml(popularData.meta.updated_at)}` : "";
  els.dataMeta.innerHTML = `
    <span>${groups.length} 个紫品以上武学 · 站长推荐 ${ADMIN_RECOMMENDATIONS.length} 条 · 热门搭配 ${POPULAR_RECOMMENDATIONS.length} 条</span>
    <span>已统计榜单：${escapeHtml(leaderboardText)}${updatedAt}</span>
    <span>推荐排序：先看能否完整凑齐，再按推图榜单新鲜度和名次；战力只作参考。</span>
    <span>使用方法：只点你实际拥有的高品质武学，低品质会自动可用，也可以点卡片排除。</span>
  `;
  els.ownedState.innerHTML = `
    <span>当前最高已选：${escapeHtml(selectedText)}</span>
    <span>自动可用：${escapeHtml(below)}</span>
  `;
  renderSummary(highest);
  renderKungfuGrid(highest);
  renderRecommendations(highest);
}

function bindEvents() {
  els.resetOwned.addEventListener("click", resetOwned);
}

loadState();
bindEvents();
render();
