const emptyState = document.getElementById("emptyState");
const dashboard = document.getElementById("dashboard");
const diagramDiv = document.getElementById("indexDiagram");
const currentSkill = document.getElementById("currentSkill");
const progressInfo = document.getElementById("progressInfo");
const steps = Array.from(document.querySelectorAll("[data-step]"));

const diagram = initDiagram();

function initDiagram() {
  if (!diagramDiv || typeof go === "undefined") {
    return null;
  }

  const $ = go.GraphObject.make;
  const myDiagram = $(go.Diagram, "indexDiagram", {
    "undoManager.isEnabled": false,
    layout: $(go.TreeLayout, { angle: 0, layerSpacing: 20, nodeSpacing: 10 }),
  });

  myDiagram.nodeTemplate =
    $(go.Node, "Auto",
      $(go.Shape, "RoundedRectangle", { strokeWidth: 0 },
        new go.Binding("fill", "color"),
        new go.Binding("stroke", "stroke"),
        new go.Binding("strokeWidth", "strokeWidth")),
      $(go.TextBlock, { margin: 8 },
        new go.Binding("text", "key"))
    );

  return myDiagram;
}

function buildMindMapData(outline, progress) {
  if (!outline || !outline.skill || !Array.isArray(outline.stages)) {
    return { nodes: [], links: [] };
  }

  const currentAspect = progress?.aspect_index ?? null;
  const currentTopic = progress?.topic_index ?? null;

  const nodes = [{ key: outline.skill, color: "lightblue" }];
  const links = [];

  outline.stages.forEach((stage, stageIndex) => {
    const stageKey = `${stage.title}`;
    nodes.push({ key: stageKey, color: "lightgreen" });
    links.push({ from: outline.skill, to: stageKey });

    if (Array.isArray(stage.topics)) {
      stage.topics.forEach((topic, topicIndex) => {
        const topicKey = `${topic}`;
        const isCurrent = currentAspect === stageIndex + 1 && currentTopic === topicIndex + 1;
        nodes.push({
          key: topicKey,
          color: "lightyellow",
          stroke: isCurrent ? "#ff9500" : null,
          strokeWidth: isCurrent ? 1 : 0,
        });
        links.push({ from: stageKey, to: topicKey });
      });
    }
  });

  return { nodes, links };
}

function setActiveStep(processIndex) {
  const currentStep = steps.find((step) => Number(step.dataset.step) === processIndex);
  const currentTitle = currentStep.querySelector("h3");
  if (currentTitle) {
    currentTitle.classList.add("active");
  }
}

function describeProgress(stage, progress) {
  if (!progress) {
    return "尚未开始学习";
  }

  const aspectIndex = progress.aspect_index || 1;
  const topicIndex = progress.topic_index || 1;
  const processIndex = progress.process_index || 1;

  const stages = stage.stages;
  const topics = stages[aspectIndex - 1].topics

  let stageTitle = stages[aspectIndex - 1].title;
  let topicTitle = topics[topicIndex - 1];

  return [
    `当前阶段：<span class="text-muted">${stageTitle}</span>`,
    `当前内容：<span class="text-muted">${topicTitle}</span>`,
    `当前步骤：<span class="text-muted">${processIndex === 1 ? "预习" : processIndex === 2 ? "学习" : "练习"}</span>`,
  ].join("\n");
}

async function loadStage() {
  try {
    const data = await postJson("/api/outline/get", {});

    if(data.ok && diagram) {
      const stage = data.data;
      const skill = stage.skill || "(空)";

      const progressData = await postJson("/api/progress/get", { 
        skill: skill 
      });

      const progress = progressData.data;
      const processIndex = progress.process_index || 1;

      currentSkill.innerHTML = `技能：<span class="text-muted">${skill}</span>`;
      progressInfo.innerHTML = describeProgress(stage, progress);
      setActiveStep(processIndex);

      const mapData = buildMindMapData(stage, progress);
      diagram.model = new go.GraphLinksModel(mapData.nodes, mapData.links);
      
      emptyState.classList.add("hidden");
      dashboard.classList.remove("hidden");
    } else {
      emptyState.classList.remove("hidden");
      dashboard.classList.add("hidden");
      console.error(data);
    }
  } catch (err) {
    emptyState.classList.remove("hidden");
    dashboard.classList.add("hidden");
    console.error(err);
  }
}

loadStage();
