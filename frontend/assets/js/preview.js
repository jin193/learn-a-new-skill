const previewBtn = document.getElementById("previewBtn");
const generateBtn = document.getElementById("generateBtn");
const generateStatus = document.getElementById("generateStatus");
const saveBtn = document.getElementById("saveBtn");
const saveStatus = document.getElementById("saveStatus");
const rendered = document.getElementById("rendered");
const result = document.getElementById("result");

let lastContext = null;
let lastHtml = "";

async function checkExistingPreview() {
  try {
    const progressData = await postJson("/api/progress/get", {});
    const aspectIndex = progressData?.data?.aspect_index ?? 1;
    const topicIndex = progressData?.data?.topic_index ?? 1;
    const skill = progressData?.data?.skill ?? "";

    const previewData = await postJson("/api/preview/get", {});
    context = previewData?.data ?? {};

    if (context && aspectIndex === context?.aspect_index && topicIndex === context?.topic_index && skill === context?.skill) {
      rendered.innerHTML = buildPreviewHtml(context);

      generateBtn.classList.add("hidden");
      saveBtn.classList.add("hidden");
      previewBtn.classList.remove("hidden");
      result.classList.remove("hidden");
      // saveStatus.innerHTML = `已保存：<a href="/preview/${aspectIndex}.${topicIndex}.html" target="_blank">查看</a>`;
      return true;
    }
  } catch (err) {
    console.error(err);
  }
  return false;
}

checkExistingPreview();

function buildPreviewHtml(payload) {
  const title = payload.topic || "预习内容";
  const core = payload.context.core_concept || "";
  const points = Array.isArray(payload.context.key_points) ? payload.context.key_points : [];
  const example = payload.context.example || "";
  const connections = payload.context.connections || "";

  return `
    <div class="preview-card">
      <h3>${title}</h3>
      <p><strong>核心概念：</strong>${core}</p>
      <p><strong>关键要点：</strong></p>
      <ul>
        ${points.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <p><strong>应用示例：</strong>${example}</p>
      <p><strong>知识关联：</strong>${connections}</p>
    </div>
  `;
}

previewBtn.addEventListener("click", async () => {
  const progressData = await postJson("/api/progress/get", {});
  const aspectIndex = progressData.data.aspect_index;
  const topicIndex = progressData.data.topic_index;
  window.open(`/preview/${aspectIndex}.${topicIndex}.html`, "_blank");
});

generateBtn.addEventListener("click", async () => {
  generateStatus.textContent = "正在加载...";
  try {
    const data = await postJson("/api/preview", {});

    if(data.ok) {
      const context = data.result;
      lastContext = context;
      lastHtml = buildPreviewHtml(context);
      rendered.innerHTML = lastHtml;
    
      generateStatus.textContent = "";
      result.classList.remove("hidden");
    } else {
      generateStatus.textContent = "加载失败";
      console.error(data);
    }
  } catch (err) {
    generateStatus.textContent = "加载失败";
    console.error(err);
  }
});

saveBtn.addEventListener("click", async () => {
  if (!lastContext) {
    saveStatus.textContent = "暂无可保存的内容";
    return;
  }

  saveStatus.textContent = "正在保存...";
  try {
    const data = await postJson("/api/preview/save", {
      context: lastContext,
      html: lastHtml
    });
    const state = await postJson("/api/progress/save", {
      skill: lastContext.skill || "",
      aspect_index: lastContext.aspect_index,
      topic_index: lastContext.topic_index,
      process_index: 2
    });

    if (data.ok && state.ok) {
      saveStatus.textContent = "";
      window.open(`/index.html`, "_self");
    } else {
      saveStatus.textContent = "保存失败";
      console.error(data, state);
    }
  } catch (err) {
    saveStatus.textContent = "保存失败";
    console.error(err);
  }
});
