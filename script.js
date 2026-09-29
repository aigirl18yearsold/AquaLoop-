// ============================================
// AquaLoop
// Main application logic
// ============================================


// Simplified prototype estimates.
// These should be replaced with validated
// regional/fixture-specific data in a later version.

const RATES = {
  shower: 9,
  toilet: 6,
  laundry: 60,
  dishes: 6
};


// Current calculation

let currentCalculation = null;


// --------------------------------------------
// Helpers
// --------------------------------------------

function getNumber(id) {

  const value = Number(
    document.getElementById(id).value
  );

  return Number.isFinite(value) && value >= 0
    ? value
    : 0;
}


function formatLitres(value) {

  return Math.round(value) + " L";

}


function getRecords() {

  try {

    return JSON.parse(
      localStorage.getItem("aquaLoopRecords") || "[]"
    );

  } catch {

    return [];

  }

}


function getGoal() {

  return Number(
    localStorage.getItem("aquaLoopGoal") || 0
  );

}


// --------------------------------------------
// Water calculation
// --------------------------------------------

function calculateWater() {

  const showerMinutes = getNumber("shower");

  const toiletFlushes = getNumber("toilet");

  const laundryLoads = getNumber("laundry");

  const dishMinutes = getNumber("dishes");


  const showerWater =
    showerMinutes * RATES.shower;

  const toiletWater =
    toiletFlushes * RATES.toilet;

  const laundryWater =
    laundryLoads * RATES.laundry;

  const dishesWater =
    dishMinutes * RATES.dishes;


  const total =
    showerWater +
    toiletWater +
    laundryWater +
    dishesWater;


  if (total <= 0) {

    alert(
      "Please enter at least one activity."
    );

    return;

  }


  const activities = {

    shower: showerWater,

    toilet: toiletWater,

    laundry: laundryWater,

    dishes: dishesWater

  };


  const biggest =
    Object.entries(activities)
      .sort((a, b) => b[1] - a[1])[0];


  currentCalculation = {

    daily: total,

    weekly: total * 7,

    monthly: total * 30,

    activities: activities,

    biggest: biggest[0],

    date: new Date().toLocaleDateString()

  };


  displayResults();

}


// --------------------------------------------
// Display calculation
// --------------------------------------------

function displayResults() {

  if (!currentCalculation) return;


  const data = currentCalculation;


  document.getElementById("results")
    .classList.remove("hidden");


  document.getElementById("dailyResult")
    .textContent = formatLitres(data.daily);


  document.getElementById("weeklyResult")
    .textContent = formatLitres(data.weekly);


  document.getElementById("monthlyResult")
    .textContent = formatLitres(data.monthly);


  document.getElementById("showerValue")
    .textContent =
    formatLitres(data.activities.shower);


  document.getElementById("toiletValue")
    .textContent =
    formatLitres(data.activities.toilet);


  document.getElementById("laundryValue")
    .textContent =
    formatLitres(data.activities.laundry);


  document.getElementById("dishesValue")
    .textContent =
    formatLitres(data.activities.dishes);


  const total = data.daily;


  setBar(
    "showerBar",
    data.activities.shower,
    total
  );


  setBar(
    "toiletBar",
    data.activities.toilet,
    total
  );


  setBar(
    "laundryBar",
    data.activities.laundry,
    total
  );


  setBar(
    "dishesBar",
    data.activities.dishes,
    total
  );


  const sourceNames = {

    shower: "showering",

    toilet: "toilet use",

    laundry: "laundry",

    dishes: "dishwashing"

  };


  document.getElementById("recommendationText")
    .textContent =
    createRecommendation(
      data.biggest,
      data.activities[data.biggest]
    );


  updateDashboard();

}


// --------------------------------------------
// Progress bars
// --------------------------------------------

function setBar(id, value, total) {

  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;


  document.getElementById(id)
    .style.width =
    Math.min(percentage, 100) + "%";

}


// --------------------------------------------
// Recommendations
// --------------------------------------------

function createRecommendation(source, value) {

  const recommendations = {

    shower:
      "Showering is your largest estimated source at " +
      formatLitres(value) +
      "/day. Try reducing shower time by a few minutes " +
      and avoid leaving water running unnecessarily.",

    toilet:
      "Toilet use is your largest estimated source at " +
      formatLitres(value) +
      "/day. Water-efficient fixtures and avoiding " +
      unnecessary flushing can help.",

    laundry:
      "Laundry is your largest estimated source at " +
      formatLitres(value) +
      "/day. Fuller loads can reduce the estimated " +
      water used per item.",

    dishes:
      "Dishwashing is your largest estimated source at " +
      formatLitres(value) +
      "/day. Avoid leaving the tap running continuously."

  };


  return recommendations[source];

}


// --------------------------------------------
// Save record
// --------------------------------------------

function saveRecord() {

  if (!currentCalculation) {

    alert(
      "Calculate your water use first."
    );

    return;

  }


  const records = getRecords();


  records.unshift(currentCalculation);


  // Keep only the latest 20 records.

  const limited =
    records.slice(0, 20);


  localStorage.setItem(
    "aquaLoopRecords",
    JSON.stringify(limited)
  );


  renderHistory();

  updateDashboard();

  updateGoalProgress();


  alert(
    "Your AquaLoop record has been saved."
  );

}


// --------------------------------------------
// History
// --------------------------------------------

function renderHistory() {

  const list =
    document.getElementById("historyList");


  const records =
    getRecords();


  if (records.length === 0) {

    list.innerHTML = `

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


  list.innerHTML =
    records.map((record, index) => `

      <div class="history-item">

        <div>

          <strong>
            ${formatLitres(record.daily)}
          </strong>

          <small>
            ${record.date}
          </small>

        </div>

        <div>

          <small>
            Largest source:
            ${getReadableSource(record.biggest)}
          </small>

        </div>

      </div>

    `).join("");

}


// --------------------------------------------
// Goal
// --------------------------------------------

function setGoal() {

  const goal =
    Number(
      document.getElementById("goal").value
    );


  if (
    !Number.isFinite(goal) ||
    goal < 1 ||
    goal > 90
  ) {

    alert(
      "Choose a goal between 1% and 90%."
    );

    return;

  }


  localStorage.setItem(
    "aquaLoopGoal",
    goal
  );


  updateGoalProgress();

  updateDashboard();

}


// --------------------------------------------
// Goal progress
// --------------------------------------------

function updateGoalProgress() {

  const goal = getGoal();

  const records = getRecords();


  if (!goal || records.length < 1) {

    document.getElementById("progressText")
      .textContent = "0%";

    document.getElementById("progressBar")
      .style.width = "0%";

    document.getElementById("goalMessage")
      .textContent =
      "Calculate and save your water use to begin tracking.";

    return;

  }


  if (records.length === 1) {

    document.getElementById("progressText")
      .textContent = "0%";

    document.getElementById("progressBar")
      .style.width = "0%";

    document.getElementById("goalMessage")
      .textContent =
      "Your first saved record is your baseline. Save another record later to measure change.";

    return;

  }


  const latest =
    records[0].daily;

  const previous =
    records[1].daily;


  if (previous <= 0) return;


  const reduction =
    ((previous - latest) / previous) * 100;


  const progress =
    Math.max(
      0,
      Math.min(
        100,
        (reduction / goal) * 100
      )
    );


  document.getElementById("progressText")
    .textContent =
    Math.round(reduction) + "%";


  document.getElementById("progressBar")
    .style.width =
    progress + "%";


  if (reduction >= goal) {

    document.getElementById("goalMessage")
      .textContent =
      "You have reached your current reduction target.";

  } else if (reduction > 0) {

    document.getElementById("goalMessage")
      .textContent =
      "You're moving in the right direction. Keep working toward your " +
      goal +
      "% target.";

  } else {

    document.getElementById("goalMessage")
      .textContent =
      "Your latest estimate has not decreased yet. Use the largest-source insight to choose one behavior to change.";

  }

}


// --------------------------------------------
// Dashboard
// --------------------------------------------

function updateDashboard() {

  const records =
    getRecords();

  const goal =
    getGoal();


  document.getElementById("dashboardRecords")
    .textContent =
    records.length;


  if (records.length === 0) {

    document.getElementById("dashboardDaily")
      .textContent = "—";

    document.getElementById("dashboardSource")
      .textContent = "—";

  } else {

    document.getElementById("dashboardDaily")
      .textContent =
      formatLitres(records[0].daily);


    document.getElementById("dashboardSource")
      .textContent =
      getReadableSource(records[0].biggest);

  }


  document.getElementById("dashboardGoal")
    .textContent =
    goal
      ? goal + "%"
      : "Not set";

}


// --------------------------------------------
// Names
// --------------------------------------------

function getReadableSource(source) {

  const names = {

    shower: "Shower",

    toilet: "Toilet",

    laundry: "Laundry",

    dishes: "Dishes"

  };


  return names[source] || "—";

}


// --------------------------------------------
// Initial load
// --------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  function() {

    renderHistory();

    updateDashboard();

    updateGoalProgress();

    const savedGoal =
      getGoal();

    if (savedGoal) {

      document.getElementById("goal")
        .value = savedGoal;

    }

  }
);
