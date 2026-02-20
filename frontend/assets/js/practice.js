const generateBtn = document.getElementById("generateBtn");
const generateStatus = document.getElementById("generateStatus");
const submitBtn = document.getElementById("submitBtn");
const submitStatus = document.getElementById("submitStatus");
const questionList = document.getElementById("questionList");
const weaknessBox = document.getElementById("weaknessBox");
const result = document.getElementById("result");
const result2 = document.getElementById("result2");

let currentQuestions = [];

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeOption(optionText, index) {
  const trimmed = String(optionText).trim();
  const match = trimmed.match(/^([A-D])\s*[\.、\)]\s*(.*)$/i);
  if (match) {
    return {label: match[1].toUpperCase(), text: match[2] ? match[2].trim() : trimmed};
  } else {
    return {label: String.fromCharCode(65 + index), text: trimmed};
  }
}

function getSelectedAnswers() {
  return currentQuestions.map((question, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    return {
      index: index + 1,
      question: question.question,
      selected: selected ? selected.value : "",
      answer: question.answer || "",
    };
  });
}

function renderQuestions(questions, showAnswers) {
  const html = questions.map((question, index) => {
      const options = question.options;
      const normalizedOptions = options.map((opt, optIndex) => normalizeOption(opt, optIndex));
      const selected = showAnswers ? document.querySelector(`input[name="q${index}"]:checked`)?.value || "" : "";
      console.log("Normalized Options:", selected);
      const answer = (question.answer || "").toString().trim().toUpperCase();
      const explanation = question.explanation || "";

      const optionsHtml = normalizedOptions.map((opt) => {
          const checked = showAnswers && selected === opt.label ? "checked" : "";
          const disabled = showAnswers ? "disabled" : "";
          return `
            <label>
              <input type="radio" name="q${index}" value="${opt.label}" ${checked} ${disabled} />
              ${opt.label}. ${escapeHtml(opt.text)}
            </label>
          `;
        }).join("");

      const resultHtml = showAnswers ? `
          <div>
            <p class="${selected === answer ? 'right' : 'wrong'}"><strong>你的选择：</strong>${selected || "未选择"}</p>
            <p><strong>正确答案：</strong>${answer || ""}</p>
            <p><strong>解析：</strong>${escapeHtml(explanation || "暂无解析")}</p>
          </div>
        ` : "";

      return `
        <section class="section">
          <p>${index + 1}. ${escapeHtml(question.question || "")}</p>
          <div>
            ${optionsHtml}
          </div>
          ${resultHtml}
          <br>
        </section>
      `;
    }).join("");

  questionList.innerHTML = html || "<p class=\"text-muted\">暂无题目</p>";
}

function renderWeaknesses(weaknesses) {
  if (!Array.isArray(weaknesses) || weaknesses.length === 0) {
    weaknessBox.innerHTML = "<p class=\"text-muted\">未检测到明显薄弱点</p>";
    return;
  }

  const html = `
    <ul>
      ${weaknesses.map((item) => {
          const point = escapeHtml(item.point || "");
          const description = escapeHtml(item.description || "");
          const level = escapeHtml(item.level || "");
          return `<li><strong>${point}</strong>（${level}）- ${description}</li>`;
        }).join("")}
    </ul>
  `;
  weaknessBox.innerHTML = html;
}

generateBtn.addEventListener("click", async () => {
  generateStatus.textContent = "正在生成...";
  try {
    const data = await postJson("/api/practice", {});

    if(data.ok) {
      currentQuestions = data.result.questions;
      renderQuestions(currentQuestions, false);
    
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
  const answers = getSelectedAnswers();
  if (answers.some((item) => !item.selected)) {
    submitStatus.textContent = "请完成所有题目后再提交";
    return;
  }
  renderQuestions(currentQuestions, true);

  submitStatus.textContent = "正在提交...";
  try {
    const data = await postJson("/api/check", {
      questions: currentQuestions,
      answers: answers,
    });
    submitStatus.textContent = data.ok ? "提交成功" : "提交失败";

    if(data.ok) {
      let weaknesses = data.result.weaknesses;
      renderWeaknesses(weaknesses);

      await postJson("/api/weakness_save", {
        questions: currentQuestions,
        answers: answers,
        weaknesses: weaknesses,
      });

      submitStatus.textContent = "";
      result2.classList.remove("hidden");
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

  const outlineData = await postJson("/api/outline/get", {});
  const stages = outlineData.data.stages;
  const topics = stages[aspectIndex - 1].topics;

  let nextAspect = aspectIndex;
  let nextTopic = topicIndex + 1;
  if (nextTopic > topics.length) {
    nextAspect = aspectIndex + 1;
    nextTopic = 1;
  }
  if (nextAspect > stages.length) {
    nextAspect = 1;
    nextTopic = 1;
  }

  await postJson("/api/progress/save", {
    skill: skill,
    aspect_index: nextAspect,
    topic_index: nextTopic,
    process_index: 1,
  });
  window.open(`/index.html`, "_self");
});