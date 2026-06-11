# 宗师之上武学推荐器

这是一个轻量静态网页。压缩包根目录需要包含：

- `index.html`
- `app.js`
- `styles.css`
- `config.js`
- `loader.js`
- `data.js`
- `admin-lineups.js`
- `popular-lineups.js`
- `README.md`

## 当前功能

- 用户点击自己实际拥有的高品质武学。
- 系统会从已选武学里自动判断最高品质。
- 低于已选最高品质的武学默认全可用。
- 已选最高品质本身和更高品质，需要用户手动点击选择。
- 例：点了红武学后，橙品和紫品自动可用；点了金武学后，红品、橙品、紫品自动可用。
- 站长推荐来自 `admin-lineups.js`，会优先展示在推荐结果最上面。
- 热门搭配来自 `popular-lineups.js`。
- 站长推荐不会展示登仙武学搭配；如果用户手动选择了登仙武学，站长推荐会暂时隐藏。
- 推荐结果只展示阵容、战力和武学阶重。
- 多批热门搭配会自动合并到推荐池，用户不用切换数据组。
- 武学卡片会显示文字缩写，后续也可以自行补充图标样式。

## 数据文件放 Gitee

默认情况下，网页读取同目录下的：

- `data.js`
- `admin-lineups.js`
- `popular-lineups.js`

如果要把数据文件单独放到 Gitee，只需要修改 `config.js`：

```js
window.ZSZS_DATA_BASE_URL = "https://你的数据文件地址";
```

这个地址下面需要能直接访问：

```text
data.js
admin-lineups.js
popular-lineups.js
```

论坛上传的离线包建议保持 `config.js` 为空，这样用户打开 zip 里的 `index.html` 就会读取本地数据。

## 手动添加站长推荐

站长推荐放在 `admin-lineups.js` 的 `window.ZSZS_ADMIN_LINEUPS.lineups` 里。你以后主要改这个文件就行，每一条推荐写 6 个武学：

```js
{
  name: "站长推荐：紫薇六脉流",
  core: ["霹雳绝掌", "紫薇星斗阵", "夺命十三剑", "破空剑法", "六脉神剑", "落花无情剑"],
  slots: [
    { pos: 1, name: "霹雳绝掌", normal_name: "霹雳绝掌", quality: "橙", school: "武当" },
    { pos: 2, name: "紫薇星斗阵", normal_name: "紫薇星斗阵", quality: "橙", school: "武当" },
    { pos: 3, name: "夺命十三剑", normal_name: "夺命十三剑", quality: "红", school: "剑阁" },
    { pos: 4, name: "破空剑法", normal_name: "破空剑法", quality: "橙", school: "剑阁" },
    { pos: 5, name: "六脉神剑", normal_name: "六脉神剑", quality: "红", school: "剑阁" },
    { pos: 6, name: "落花无情剑", normal_name: "落花无情剑", quality: "橙", school: "剑阁" }
  ]
}
```

注意：

- `core` 用普通武学名，不用写 `·极`。
- `slots` 是展示顺序，用户看到的就是这个顺序。
- 不要在站长推荐里写登仙武学；页面也会自动过滤登仙搭配。

## 手动添加热门搭配

热门搭配放在 `popular-lineups.js` 的 `window.ZSZS_POPULAR_LINEUPS.groups` 里。每个 `group` 是一批数据，组内顺序就是网页展示顺序；网页会自动合并所有组。可以在某个 `lineups` 数组里手动加一条：

```js
{
  name: "热门搭配 #101",
  player: {
    power: 2121000000,
    sort_index: 101
  },
  core: ["乙木生雷诀", "北冥神功", "暴雨梨花针", "寒冰生死符", "太虚五衰咒", "黯然销魂手"],
  slots: [
    { pos: 1, name: "乙木生雷诀", normal_name: "乙木生雷诀", quality: "金", school: "登仙", rank_display: 6, level_display: 5 },
    { pos: 2, name: "北冥神功", normal_name: "北冥神功", quality: "金", school: "逍遥", rank_display: 8, level_display: 5 }
  ]
}
```

字段说明：

- `name`：网页展示的搭配名。
- `player.power`：网页展示的战力。
- `player.sort_index`：展示排序用，数字越小越靠前。
- `core`：用于匹配用户是否拥有这些武学，普通名即可，不带 `·极`。
- `slots`：真实展示的 6 个位置，可以在 `name` 里保留 `·极`。
- `rank_display`、`level_display`：网页展示的阶重数字。
