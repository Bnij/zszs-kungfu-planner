(function () {
  const baseUrl = String(window.ZSZS_DATA_BASE_URL || "").replace(/\/+$/, "");
  const dataFiles = ["data.js", "admin-lineups.js", "popular-lineups.js"];

  function scriptUrl(file, useRemote = true) {
    return baseUrl && useRemote ? `${baseUrl}/${file}` : `./${file}`;
  }

  function loadScript(file, useRemote = true) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = scriptUrl(file, useRemote);
      script.onload = resolve;
      script.onerror = () => reject(new Error(`加载失败：${script.src}`));
      document.head.appendChild(script);
    });
  }

  async function loadData(useRemote) {
    for (const file of dataFiles) {
      await loadScript(file, useRemote);
    }
  }

  async function loadAll() {
    try {
      try {
        await loadData(true);
      } catch (remoteError) {
        if (!baseUrl) throw remoteError;
        console.warn("远程数据加载失败，已切换到本地数据。", remoteError);
        await loadData(false);
      }
      await loadScript("app.js", false);
    } catch (error) {
      const meta = document.querySelector("#dataMeta");
      if (meta) {
        meta.textContent = "数据加载失败，请刷新页面或稍后重试。";
      }
      console.error(error);
    }
  }

  loadAll();
})();
