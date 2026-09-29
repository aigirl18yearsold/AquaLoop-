// ============================================================
// AquaLoop — Water Intelligence
// ============================================================

const RATES = {
  shower: 9,     // liters per minute
  toilet: 6,     // liters per flush
  laundry: 60,   // liters per load
  dishes: 6      // liters per minute
};

const RECORDS_KEY = "aquaLoopRecords";
const GOAL_KEY = "aquaLoopGoal";


// ============================================================
// STORAGE
// ============================================================

function getRecords() {
  try {
    const saved = localStorage.getItem(RECORDS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not load records:", error);
    return [];
  }
}


function storeRecords(records) {
  localStorage.setItem(
    RECORDS_KEY,
    JSON.stringify(records)
  );
}


function getSavedGoal() {
  const goal = Number(
    localStorage.getItem(GOAL_KEY)
  );

  return goal > 0 ? goal : 10;
}


// ============================================================
// INPUTS
// ============================================================

function getNumber(id) {
  const element = document.getElementById(id);

  if (!element) {
    return 0;
  }

  const value = Number(element.value);

  return Number.isFinite(value) && value >= 0
    ? value
    : 0;
}


// ============================================================
// CALCULATION
// ============================================================

function calculateValues() {

  const showerMinutes = getNumber("shower");
  const toiletFlushes = getNumber("toilet");
  const laundryLoads = getNumber("laundry");
  const dishesMinutes = getNumber("dishes");


  const shower =
    showerMinutes * RATES.shower;

  const toilet =
    toiletFlushes * RATES.toilet;

  const laundry =
    laundryLoads * RATES.laundry;

  const dishes =
    dishesMinutes * RATES.dishes;


  const total =
    shower +
    toilet +
    laundry +
    dishes;


  return {
    shower,
    toilet,
    laundry,
    dishes,
    total
  };
}


// ============================================================
// MAIN CALCULATOR
// ============================================================

function calculateWater() {

  const usage = calculateValues();

  const daily = usage.total;
  const weekly = daily * 7;
  const monthly = daily * 30;


  // Show results
  const results =
    document.getElementById("results");

  if (results) {
    results.classList.remove("hidden");
  }


  // Main numbers
  document.getElementById("dailyResult").textContent =
    `${Math.round(daily)} L`;

  document.getElementById("weeklyResult").textContent =
    `${Math.round(weekly)} L`;

  document.getElementById("monthlyResult").textContent =
    `${Math.round(monthly)} L`;


  // Breakdown
  updateBreakdown(usage);


  // Recommendation
  updateRecommendation(usage);


  // Dashboard
  updateDashboard(usage);


  // Goal
  updateGoalProgress();


  // Smoothly show results
  if (results) {
    setTimeout(() => {
      results.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }, 100);
  }
}


// ============================================================
// BREAKDOWN
// ============================================================

function updateBreakdown(usage) {

  const values = [
    usage.shower,
    usage.toilet,
    usage.laundry,
    usage.dishes
  ];

  const largest =
    Math.max(...values);


  const items = [
    ["shower", usage.shower],
    ["toilet", usage.toilet],
    ["laundry", usage.laundry],
    ["dishes", usage.dishes]
  ];


  items.forEach(([name, value]) => {

    const valueElement =
      document.getElementById(
        `${name}Value`
      );

    const barElement =
      document.getElementById(
        `${name}Bar`
      );


    if (valueElement) {
      valueElement.textContent =
        `${Math.round(value)} L`;
    }


    if (barElement) {

      const percentage =
        largest > 0
          ? (value / largest) * 100
          : 0;

      barElement.style.width =
        `${percentage}%`;
    }

  });
}


// ============================================================
// RECOMMENDATION
// ============================================================

function updateRecommendation(usage) {

  const element =
    document.getElementById(
      "recommendationText"
    );

  if (!element) {
    return;
  }


  if (usage.total <= 0) {

    element.textContent =
      "Enter your daily activities to receive a personalized AquaLoop insight.";

    return;
  }


  const sources = [
    {
      name: "shower",
      value: usage.shower
    },
    {
      name: "toilet",
      value: usage.toilet
    },
    {
      name: "laundry",
      value: usage.laundry
    },
    {
      name: "dishes",
      value: usage.dishes
    }
  ];


  sources.sort(
    (a, b) => b.value - a.value
  );


  const largest =
    sources[0].name;


  const messages = {

    shower:
      "Your shower is your largest estimated water source. Try reducing your shower time by a few minutes.",

    toilet:
      "Your toilet is your largest estimated source. Reducing unnecessary flushes can help lower your estimated use.",

    laundry:
      "Laundry is your largest estimated source. Consider running fuller loads instead of several smaller loads.",

    dishes:
      "Dishwashing is your largest estimated source. Try reducing the amount of time water runs while washing."
  };


  element.textContent =
    messages[largest];
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard(usage) {

  const dailyElement =
    document.getElementById(
      "dashboardDaily"
    );

  const sourceElement =
    document.getElementById(
      "dashboardSource"
    );

  const goalElement =
    document.getElementById(
      "dashboardGoal"
    );

  const recordsElement =
    document.getElementById(
      "dashboardRecords"
    );


  // Daily estimate
  if (dailyElement) {

    dailyElement.textContent =
      usage.total > 0
        ? `${Math.round(usage.total)} L`
        : "—";
  }


  // Largest source
  if (sourceElement) {

    if (usage.total <= 0) {

      sourceElement.textContent = "—";

    } else {

      const sources = [
        ["Shower", usage.shower],
        ["Toilet", usage.toilet],
        ["Laundry", usage.laundry],
        ["Dishes", usage.dishes]
      ];

      sources.sort(
        (a, b) => b[1] - a[1]
      );

      sourceElement.textContent =
        sources[0][0];
    }
  }


  // Goal
  if (goalElement) {

    goalElement.textContent =
      `${getSavedGoal()}%`;
  }


  // Records
  if (recordsElement) {

    recordsElement.textContent =
      getRecords().length;
  }
}


// ============================================================
// SAVE RECORD
// ============================================================

function saveRecord() {

  const usage =
    calculateValues();


  if (usage.total <= 0) {

    alert(
      "Please enter your water-use activities first."
    );

    return;
  }


  const records =
    getRecords();


  const record = {

    date: new Date().toLocaleString(),

    daily: usage.total,

    shower: usage.shower,

    toilet: usage.toilet,

    laundry: usage.laundry,

    dishes: usage.dishes
  };


  records.unshift(record);


  // Keep only latest 20
  const limitedRecords =
    records.slice(0, 20);


  storeRecords(limitedRecords);


  renderHistory();


  updateDashboard(usage);


  updateGoalProgress();


  alert(
    "💧 Your AquaLoop record has been saved!"
  );
}


// ============================================================
// HISTORY
// ============================================================

function renderHistory() {

  const historyList =
    document.getElementById(
      "historyList"
    );


  if (!historyList) {
    return;
  }


  const records =
    getRecords();


  if (records.length === 0) {

    historyList.innerHTML = `
      <div class="empty-history">

        <span>💧</span>

        <h3>No records yet</h3>

        <p>
          Calculate your water use and save your first record.
        </p>

      </div>
    `;

    return;
  }


  historyList.innerHTML =
    records.map((record) => {

      return `
        <div class="history-item">

          <div class="history-main">

            <strong>
              ${Math.round(record.daily)} L/day
            </strong>

            <span>
              ${record.date}
            </span>

          </div>

          <div class="history-details">

            🚿 ${Math.round(record.shower)} L

            ·

            🚽 ${Math.round(record.toilet)} L

            ·

            👕 ${Math.round(record.laundry)} L

            ·

            🍽️ ${Math.round(record.dishes)} L

          </div>

        </div>
      `;

    }).join("");
}


// ============================================================
// GOAL
// ============================================================

function setGoal() {

  const input =
    document.getElementById("goal");


  if (!input) {
    return;
  }


  let goal =
    Number(input.value);


  if (
    !Number.isFinite(goal) ||
    goal < 1 ||
    goal > 90
  ) {

    alert(
      "Please enter a goal between 1% and 90%."
    );

    return;
  }


  goal =
    Math.round(goal);


  localStorage.setItem(
    GOAL_KEY,
    goal
  );


  updateDashboard(
    calculateValues()
  );


  updateGoalProgress();


  alert(
    `🎯 Your reduction goal is now ${goal}%.`
  );
}


// ============================================================
// GOAL PROGRESS
// ============================================================

function updateGoalProgress() {

  const progressBar =
    document.getElementById(
      "progressBar"
    );

  const progressText =
    document.getElementById(
      "progressText"
    );

  const message =
    document.getElementById(
      "goalMessage"
    );


  const goal =
    getSavedGoal();


  const records =
    getRecords();


  if (!progressBar) {
    return;
  }


  // Need at least two records
  if (records.length < 2) {

    progressBar.style.width =
      "0%";

    if (progressText) {
      progressText.textContent =
        "0%";
    }

    if (message) {
      message.textContent =
        "Save at least two records to start tracking your reduction.";
    }

    return;
  }


  const latest =
    records[0].daily;

  const previous =
    records[1].daily;


  if (previous <= 0) {
    return;
  }


  const reduction =
    ((previous - latest) /
      previous) * 100;


  const progress =
    Math.max(
      0,
      Math.min(
        100,
        (reduction / goal) * 100
      )
    );


  progressBar.style.width =
    `${progress}%`;


  if (progressText) {

    progressText.textContent =
      `${Math.round(progress)}%`;
  }


  if (message) {

    if (reduction >= goal) {

      message.textContent =
        `🎉 You've reached your ${goal}% reduction goal!`;

    } else if (reduction > 0) {

      message.textContent =
        `You're currently about ${Math.round(reduction)}% below your previous estimate. Keep going!`;

    } else {

      message.textContent =
        "Your latest estimate is not lower than your previous record yet.";
    }
  }
}


// ============================================================
// STARTUP
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    renderHistory();

    updateDashboard(
      calculateValues()
    );

    updateGoalProgress();

  }
);
