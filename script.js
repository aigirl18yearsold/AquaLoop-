// AquaLoop
// Measure. Understand. Reduce.

const RATES = {
  shower: 9,   // liters per minute
  toilet: 6,   // liters per flush
  laundry: 60, // liters per load
  dishes: 6    // liters per minute
};

const RECORDS_KEY = "aquaLoopRecords";
const GOAL_KEY = "aquaLoopGoal";

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function getGoal() {
  return Number(localStorage.getItem(GOAL_KEY)) || 20;
}

function calculateUsage() {
  const shower =
    Number(document.getElementById("shower")?.value) || 0;

  const toilet =
    Number(document.getElementById("toilet")?.value) || 0;

  const laundry =
    Number(document.getElementById("laundry")?.value) || 0;

  const dishes =
    Number(document.getElementById("dishes")?.value) || 0;

  const usage = {
    shower: shower * RATES.shower,
    toilet: toilet * RATES.toilet,
    laundry: laundry * RATES.laundry,
    dishes: dishes * RATES.dishes
  };

  const total =
    usage.shower +
    usage.toilet +
    usage.laundry +
    usage.dishes;

  return {
    ...usage,
    total
  };
}

function formatLiters(value) {
  return `${Math.round(value)} L`;
}

function updateResults() {
  const usage = calculateUsage();

  const daily = usage.total;
  const weekly = daily * 7;
  const monthly = daily * 30;

  const dailyElement = document.getElementById("dailyResult");
  const weeklyElement = document.getElementById("weeklyResult");
  const monthlyElement = document.getElementById("monthlyResult");

  if (dailyElement) dailyElement.textContent = formatLiters(daily);
  if (weeklyElement) weeklyElement.textContent = formatLiters(weekly);
  if (monthlyElement) monthlyElement.textContent = formatLiters(monthly);

  updateBreakdown(usage);
  updateRecommendation(usage);
  updateDashboard(usage);

  return usage;
}

function updateBreakdown(usage) {
  const items = [
    { name: "shower", value: usage.shower },
    { name: "toilet", value: usage.toilet },
    { name: "laundry", value: usage.laundry },
    { name: "dishes", value: usage.dishes }
  ];

  const largest = Math.max(...items.map(item => item.value));

  items.forEach(item => {
    const bar = document.getElementById(`${item.name}Bar`);
    const value = document.getElementById(`${item.name}Value`);

    if (value) {
      value.textContent = formatLiters(item.value);
    }

    if (bar) {
      const percentage =
        largest > 0 ? (item.value / largest) * 100 : 0;

      bar.style.width = `${percentage}%`;
    }
  });
}

function updateRecommendation(usage) {
  const recommendation =
    document.getElementById("recommendation");

  if (!recommendation) return;

  const sources = [
    ["shower", usage.shower],
    ["toilet", usage.toilet],
    ["laundry", usage.laundry],
    ["dishes", usage.dishes]
  ];

  sources.sort((a, b) => b[1] - a[1]);

  const largest = sources[0];

  if (usage.total === 0) {
    recommendation.textContent =
      "Enter your daily activities above to receive a personalized water-saving recommendation.";
    return;
  }

  const messages = {
    shower:
      "Your shower is your largest estimated water source. Try reducing shower time by a few minutes.",
    toilet:
      "Your toilet use is your largest estimated source. Consider reducing unnecessary flushes.",
    laundry:
      "Laundry is your largest estimated source. Running fuller loads can help reduce water use.",
    dishes:
      "Dishwashing is your largest estimated source. Try reducing running-water time while washing."
  };

  recommendation.textContent = messages[largest[0]];
}

function updateDashboard(usage) {
  const latestDaily =
    document.getElementById("latestDaily");

  const largestSource =
    document.getElementById("largestSource");

  const records =
    getRecords();

  if (latestDaily) {
    latestDaily.textContent = formatLiters(usage.total);
  }

  if (largestSource) {
    const sources = [
      ["Shower", usage.shower],
      ["Toilet", usage.toilet],
      ["Laundry", usage.laundry],
      ["Dishes", usage.dishes]
    ];

    sources.sort((a, b) => b[1] - a[1]);

    largestSource.textContent =
      usage.total > 0 ? sources[0][0] : "—";
  }

  const recordsElement =
    document.getElementById("recordCount");

  if (recordsElement) {
    recordsElement.textContent = records.length;
  }

  updateGoalDisplay();
}

function saveCurrentRecord() {
  const usage = calculateUsage();

  if (usage.total <= 0) {
    alert("Please enter your water-use activities first.");
    return;
  }

  const records = getRecords();

  const record = {
    date: new Date().toLocaleString(),
    daily: usage.total,
    shower: usage.shower,
    toilet: usage.toilet,
    laundry: usage.laundry,
    dishes: usage.dishes
  };

  records.unshift(record);

  // Keep the latest 20 records
  saveRecords(records.slice(0, 20));

  renderHistory();
  updateDashboard(usage);

  alert("Your AquaLoop record has been saved.");
}

function renderHistory() {
  const history =
    document.getElementById("history");

  if (!history) return;

  const records = getRecords();

  if (records.length === 0) {
    history.innerHTML =
      "<p>No saved records yet.</p>";
    return;
  }

  history.innerHTML = records
    .map(record => {
      return `
        <div class="history-item">
          <div>
            <strong>${formatLiters(record.daily)}</strong>
            <small>${record.date}</small>
          </div>
          <div class="history-details">
            Shower: ${formatLiters(record.shower)} ·
            Toilet: ${formatLiters(record.toilet)} ·
            Laundry: ${formatLiters(record.laundry)} ·
            Dishes: ${formatLiters(record.dishes)}
          </div>
        </div>
      `;
    })
    .join("");
}

function setGoal() {
  const input =
    document.getElementById("goalInput");

  if (!input) return;

  let goal = Number(input.value);

  if (!goal || goal < 1 || goal > 90) {
    alert("Please enter a goal between 1% and 90%.");
    return;
  }

  localStorage.setItem(GOAL_KEY, goal);

  updateGoalDisplay();

  alert(`Your AquaLoop goal is now ${goal}% reduction.`);
}

function updateGoalDisplay() {
  const goal = getGoal();

  const goalElement =
    document.getElementById("goalValue");

  if (goalElement) {
    goalElement.textContent = `${goal}%`;
  }

  const progressBar =
    document.getElementById("goalProgress");

  const progressText =
    document.getElementById("goalMessage");

  const records = getRecords();

  if (!progressBar || !progressText) return;

  if (records.length < 2) {
    progressBar.style.width = "0%";
    progressText.textContent =
      "Save at least two records to track your progress.";
    return;
  }

  const latest = records[0].daily;
  const previous = records[1].daily;

  if (previous <= 0) {
    progressBar.style.width = "0%";
    return;
  }

  const reduction =
    ((previous - latest) / previous) * 100;

  const progress =
    Math.max(
      0,
      Math.min(100, (reduction / goal) * 100)
    );

  progressBar.style.width = `${progress}%`;

  if (reduction >= goal) {
    progressText.textContent =
      `Great! You've reached your ${goal}% reduction goal.`;
  } else if (reduction > 0) {
    progressText.textContent =
      `You've reduced estimated use by ${Math.round(reduction)}%. Keep going!`;
  } else {
    progressText.textContent =
      "Your latest estimate is not lower than your previous record yet.";
  }
}

function clearHistory() {
  if (!confirm("Delete all saved AquaLoop records?")) {
    return;
  }

  localStorage.removeItem(RECORDS_KEY);

  renderHistory();

  const usage = calculateUsage();
  updateDashboard(usage);
}

function setupNavigation() {
  const links = document.querySelectorAll(
    'a[href^="#"]'
  );

  links.forEach(link => {
    link.addEventListener("click", event => {
      const targetId =
        link.getAttribute("href");

      const target =
        document.querySelector(targetId);

      if (target) {
        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth"
        });
      }
    });
  });
}

function setupButtons() {
  const calculateButton =
    document.getElementById("calculateBtn");

  if (calculateButton) {
    calculateButton.addEventListener(
      "click",
      updateResults
    );
  }

  const saveButton =
    document.getElementById("saveBtn");

  if (saveButton) {
    saveButton.addEventListener(
      "click",
      saveCurrentRecord
    );
  }

  const goalButton =
    document.getElementById("goalBtn");

  if (goalButton) {
    goalButton.addEventListener(
      "click",
      setGoal
    );
  }

  const clearButton =
    document.getElementById("clearHistoryBtn");

  if (clearButton) {
    clearButton.addEventListener(
      "click",
      clearHistory
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  setupNavigation();
  renderHistory();
  updateResults();
});
