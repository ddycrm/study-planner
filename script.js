// 默认初始课程待办数据
var defaultTasks = [
  { id: 1, title: "Finish Web Programming Assignment (完成 Web 大作业)", course: "Web", done: false },
  { id: 2, title: "Review Software Engineering Slides (复习软工课件)", course: "SE", done: true },
  { id: 3, title: "Complete Ripes Cache Lab Report (整理系统实验报告)", course: "CS", done: false }
];

// 本地兜底名言（防止直接双击 html 时浏览器拦截本地 AJAX 请求）
var fallbackQuotes = [
  { text: "Stay hungry, stay foolish. 求知若饥，虚心若愚。", author: "Steve Jobs" },
  { text: "Talk is cheap. Show me the code. 代码见真章。", author: "Linus Torvalds" },
  { text: "Done is better than perfect. 先完成，再完美。", author: "Sheryl Sandberg" }
];

var tasks = JSON.parse(localStorage.getItem("study_tasks")) || defaultTasks;
var currentFilter = "all";

// 1. 渲染任务列表与顶部统计数字
function renderTasks() {
  var listEl = document.getElementById("task-list");
  listEl.innerHTML = "";

  var total = tasks.length;
  var completed = 0;

  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].done) completed++;
  }

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-done").textContent = completed;
  document.getElementById("stat-todo").textContent = total - completed;

  for (var j = 0; j < tasks.length; j++) {
    var item = tasks[j];
    if (currentFilter === "todo" && item.done) continue;
    if (currentFilter === "done" && !item.done) continue;

    var li = document.createElement("li");
    li.className = "task-item" + (item.done ? " done" : "");

    li.innerHTML =
      '<div class="task-left">' +
        '<input type="checkbox" ' + (item.done ? "checked" : "") + ' onchange="toggleTask(' + item.id + ')" />' +
        '<span class="tag">' + item.course + '</span>' +
        '<span class="task-text">' + escapeHtml(item.title) + '</span>' +
      '</div>' +
      '<button class="del-btn" onclick="deleteTask(' + item.id + ')">Delete</button>';

    listEl.appendChild(li);
  }

  localStorage.setItem("study_tasks", JSON.stringify(tasks));
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 添加新任务
document.getElementById("task-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var input = document.getElementById("task-input");
  var select = document.getElementById("course-select");
  var text = input.value.trim();
  if (!text) {
    alert("Please enter a task! 请输入待办内容");
    return;
  }
  tasks.unshift({
    id: Date.now(),
    title: text,
    course: select.value,
    done: false
  });
  input.value = "";
  renderTasks();
});

// 勾选完成 / 删除任务
window.toggleTask = function (id) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      tasks[i].done = !tasks[i].done;
      break;
    }
  }
  renderTasks();
};

window.deleteTask = function (id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  renderTasks();
};

// 筛选按钮切换
var filterBtns = document.querySelectorAll(".filter-btn");
for (var i = 0; i < filterBtns.length; i++) {
  filterBtns[i].addEventListener("click", function () {
    for (var k = 0; k < filterBtns.length; k++) {
      filterBtns[k].classList.remove("active");
    }
    this.classList.add("active");
    currentFilter = this.getAttribute("data-filter");
    renderTasks();
  });
}

// 2. 番茄钟倒计时 (25:00)
var timeLeft = 25 * 60;
var timerId = null;

function updateTimerText() {
  var m = Math.floor(timeLeft / 60);
  var s = timeLeft % 60;
  var mStr = m < 10 ? "0" + m : "" + m;
  var sStr = s < 10 ? "0" + s : "" + s;
  document.getElementById("timer-display").textContent = mStr + ":" + sStr;
}

document.getElementById("timer-start").addEventListener("click", function () {
  if (timerId !== null) return;
  timerId = setInterval(function () {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerText();
    } else {
      clearInterval(timerId);
      timerId = null;
      alert("Time is up! 专注时间结束，休息一下吧！");
    }
  }, 1000);
});

document.getElementById("timer-pause").addEventListener("click", function () {
  clearInterval(timerId);
  timerId = null;
});

document.getElementById("timer-reset").addEventListener("click", function () {
  clearInterval(timerId);
  timerId = null;
  timeLeft = 25 * 60;
  updateTimerText();
});

// 3. 使用原生 XMLHttpRequest (AJAX) 异步加载 quotes.json
function loadRandomQuote() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "quotes.json", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      var list = fallbackQuotes;
      if (xhr.status === 200) {
        try {
          list = JSON.parse(xhr.responseText);
        } catch (err) {
          list = fallbackQuotes;
        }
      }
      showQuoteFromList(list);
    }
  };
  xhr.onerror = function () {
    showQuoteFromList(fallbackQuotes);
  };
  try {
    xhr.send();
  } catch (e) {
    showQuoteFromList(fallbackQuotes);
  }
}

function showQuoteFromList(list) {
  var pick = list[Math.floor(Math.random() * list.length)];
  document.getElementById("quote-text").textContent = '"' + pick.text + '"';
  document.getElementById("quote-author").textContent = "— " + pick.author;
}

document.getElementById("btn-new-quote").addEventListener("click", loadRandomQuote);

// 4. 夜间模式开关
document.getElementById("theme-btn").addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
});

// 5. 底部学习打卡备注简单表单验证
document.getElementById("note-form").addEventListener("submit", function (e) {
  e.preventDefault();
  var nameVal = document.getElementById("stu-name").value.trim();
  var noteVal = document.getElementById("stu-note").value.trim();
  var msgEl = document.getElementById("form-msg");

  if (!nameVal || !noteVal) {
    msgEl.style.color = "#ef4444";
    msgEl.textContent = "Error: Please fill in all fields! 请填写完整信息。";
    return;
  }

  msgEl.style.color = "#16a34a";
  msgEl.textContent = "Saved! 打卡记录已提交：" + nameVal + " - " + noteVal;
  document.getElementById("stu-note").value = "";
});

// 页面初始化
renderTasks();
updateTimerText();
loadRandomQuote();
