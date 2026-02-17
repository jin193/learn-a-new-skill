const skillInput = document.getElementById("skillInput");
const generateBtn = document.getElementById("generateBtn");
const generateStatus = document.getElementById("generateStatus");
const diagramDiv = document.getElementById("diagramDiv");
const saveBtn = document.getElementById("saveBtn");
const saveStatus = document.getElementById("saveStatus");
const result = document.getElementById("result");

let lastOutline = null;

const diagram = initDiagram();

function initDiagram() {
  if (!diagramDiv || typeof go === "undefined") {
    return null;
  }

  const $ = go.GraphObject.make;
  const myDiagram = $(go.Diagram, "diagramDiv", {
    "undoManager.isEnabled": true,
    layout: $(go.TreeLayout, { angle: 0, layerSpacing: 20, nodeSpacing: 10 }),
  });

  myDiagram.nodeTemplate =
    $(go.Node, "Auto",
      $(go.Shape, "RoundedRectangle", { strokeWidth: 0 },
        new go.Binding("fill", "color")),
      $(go.TextBlock, { margin: 5 },
        new go.Binding("text", "key"))
    );

  return myDiagram;
}

function buildMindMapData(outline) {
  if (!outline || !outline.skill || !Array.isArray(outline.stages)) {
    return { nodes: [], links: [] };
  }

  const nodes = [{ key: outline.skill, color: "lightblue" }];
  const links = [];

  outline.stages.forEach((stage, stageIndex) => {
    const stageKey = `${stage.title}`;
    nodes.push({ key: stageKey, color: "lightgreen" });
    links.push({ from: outline.skill, to: stageKey });

    if (Array.isArray(stage.topics)) {
      stage.topics.forEach((topic, topicIndex) => {
        const topicKey = `${topic}`;
        nodes.push({ key: topicKey, color: "lightyellow" });
        links.push({ from: stageKey, to: topicKey });
      });
    }
  });

  return { nodes, links };
}

generateBtn.addEventListener("click", async () => {
  generateStatus.textContent = "正在加载...";
  try {
    const data = await postJson("/api/outline", {
      skill: skillInput.value.trim(),
    });

    if (data.ok && diagram) {
      const outline = data.result;
      lastOutline = outline;
      const mapData = buildMindMapData(outline);
      diagram.model = new go.GraphLinksModel(mapData.nodes, mapData.links);

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
  if (!lastOutline) {
    saveStatus.textContent = "暂无可保存的大纲";
    return;
  }
  saveStatus.textContent = "正在保存...";
  try {
    const data = await postJson("/api/outline/save", {
      stage: lastOutline,
    });
    const state = await postJson("/api/progress/save", {
      skill: lastOutline.skill || "",
      aspect_index: 1,
      topic_index: 1,
      process_index: 1
    });
    
    if (data.ok && state.ok) {
      saveStatus.textContent = "";
      window.open(`/index.html`, "_self");
    } else {
      saveStatus.textContent = "保存失败";
      console.error(data);
    }
  } catch (err) {
    saveStatus.textContent = "保存失败";
    console.error(err);
  }
});
