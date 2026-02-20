const previewBtn = document.getElementById("previewBtn");
const generateBtn = document.getElementById("generateBtn");
const generateStatus = document.getElementById("generateStatus");
const questionList = document.getElementById("questionList");
const submitBtn = document.getElementById("submitBtn");
const submitStatus = document.getElementById("submitStatus");
const finishBtn = document.getElementById("finishBtn");
const result = document.getElementById("result");

let currentQuestions = [];

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderQuestions(questions) {
  const html = questions.map((question, index) => {
      return `
        <section class="section">
          <p class="question-text">${index + 1}. ${escapeHtml(question || "")}</p>
          <textarea spellcheck="false" question-index="${index}" placeholder="请输入你的回答..."></textarea>
          <div class="hidden feedback" feedback-index="${index}"></div>
        </section>
      `;
    }).join("");

  questionList.innerHTML = html;
}

function collectAnswers() {
  return currentQuestions.map((question, index) => {
    const input = document.querySelector(`textarea[question-index="${index}"]`);
    return {question,nswer: input ? input.value.trim() : "",};
  });
}

function applyFeedbacks(feedbacks) {
  feedbacks.forEach((feedback, index) => {
    const target = document.querySelector(`[feedback-index="${index}"]`);
    if (target) {
      target.textContent = feedback;
      target.classList.remove("hidden");
    }
  });
}

previewBtn.addEventListener("click", async () => {
  const progressData = await postJson("/api/progress/get", {});
  const aspectIndex = progressData.data.aspect_index;
  const topicIndex = progressData.data.topic_index;
  window.open(`/preview/${aspectIndex}.${topicIndex}.html`, "_blank");
});

generateBtn.addEventListener("click", async () => {
  generateStatus.textContent = "正在生成...";
  currentQuestions = [];
  renderQuestions([]);
  try {
    const data = await postJson("/api/learning", {});
    
    if(data.ok) {
      currentQuestions = data.result.guiding_questions;
      renderQuestions(currentQuestions);

      generateStatus.textContent = "";
      result.classList.remove("hidden");
    } else {
      generateStatus.textContent = "加载失败";
      console.error(data);
    }
  } catch (err) {
    generateStatus.textContent = "生成失败";
    console.error(err);
  }
});

submitBtn.addEventListener("click", async () => {
  submitStatus.textContent = "正在提交...";
  const aqs = collectAnswers();
  try {
    const data = await postJson("/api/review", {
      aqs: JSON.stringify(aqs, null, 2),
    });
    if(data.ok) {
      const feedbacks = data.result.guiding_feedbacks;
      applyFeedbacks(feedbacks);

      submitStatus.textContent = "";
      finishBtn.classList.remove("hidden");
    } else {
      submitStatus.textContent = "提交失败";
      console.error(data);
    }
  } catch (err) {
    submitStatus.textContent = "提交失败";
    console.error(err);
  }
});

finishBtn.addEventListener("click", async () => {
  const progressData = await postJson("/api/progress/get", {});
  const skill = progressData.data.skill;
  const aspectIndex = progressData.data.aspect_index;
  const topicIndex = progressData.data.topic_index;

  await postJson("/api/progress/save", {
    skill: skill,
    aspect_index: aspectIndex,
    topic_index: topicIndex,
    process_index: 3
  });
  window.open(`/index.html`, "_self");
});