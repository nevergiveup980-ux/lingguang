const state = {
  screen: "welcome",
  method: "form",
  profile: {},
  concerns: [],
  concernNotes: "",
  pain: {}
};

const order = ["welcome", "method", "profile", "concern", "pain", "review", "complete"];
const screenEls = Object.fromEntries(order.map(id => [id, document.getElementById(`screen-${id}`)]));
const backBtn = document.getElementById("backBtn");
const progressText = document.getElementById("progressText");

function saveState() {
  localStorage.setItem("lingguangDemoState", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("lingguangDemoState");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
  } catch {}
}

function showScreen(id) {
  state.screen = id;
  Object.values(screenEls).forEach(el => el.classList.remove("active"));
  screenEls[id].classList.add("active");

  const index = order.indexOf(id);
  backBtn.classList.toggle("hidden", index <= 0 || id === "complete");
  progressText.textContent = (index > 0 && index < 6) ? `${index} of 5` : "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  saveState();
}

document.querySelectorAll("[data-next]").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.next));
});

backBtn.addEventListener("click", () => {
  const index = order.indexOf(state.screen);
  if (index > 0) showScreen(order[index - 1]);
});

document.querySelectorAll(".choice-card:not(.disabled)").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    state.method = card.dataset.method;
    saveState();
  });
});

const profileForm = document.getElementById("profileForm");
profileForm.addEventListener("input", () => {
  state.profile = Object.fromEntries(new FormData(profileForm).entries());
  saveState();
});
profileForm.addEventListener("submit", e => {
  e.preventDefault();
  state.profile = Object.fromEntries(new FormData(profileForm).entries());
  showScreen("concern");
});

document.querySelectorAll("#concernGrid .pill").forEach(pill => {
  pill.addEventListener("click", () => {
    const value = pill.dataset.value;
    pill.classList.toggle("selected");
    state.concerns = [...document.querySelectorAll("#concernGrid .pill.selected")]
      .map(el => el.dataset.value);
    saveState();
  });
});

document.getElementById("concernNotes").addEventListener("input", e => {
  state.concernNotes = e.target.value;
  saveState();
});

document.getElementById("concernContinue").addEventListener("click", () => {
  if (state.concerns.length === 0) {
    alert("Please select at least one concern.");
    return;
  }
  if (state.concerns.includes("Pain")) {
    showScreen("pain");
  } else {
    buildReview();
    showScreen("review");
  }
});

const painRange = document.getElementById("painRange");
painRange.addEventListener("input", e => {
  document.getElementById("painValue").textContent = e.target.value;
});

const painForm = document.getElementById("painForm");
painForm.addEventListener("input", () => {
  state.pain = Object.fromEntries(new FormData(painForm).entries());
  saveState();
});
painForm.addEventListener("submit", e => {
  e.preventDefault();
  state.pain = Object.fromEntries(new FormData(painForm).entries());
  buildReview();
  showScreen("review");
});

function safe(value, fallback = "Not provided") {
  return value && String(value).trim() ? value : fallback;
}

function buildReview() {
  const p = state.profile;
  const pain = state.pain || {};
  const hasPain = state.concerns.includes("Pain");

  document.getElementById("reviewCard").innerHTML = `
    <div class="summary-section">
      <h3>${safe(p.firstName, "Patient")} ${safe(p.lastName, "")}</h3>
      <p><strong>Date of birth:</strong> ${safe(p.dob)}</p>
      <p><strong>Phone:</strong> ${safe(p.phone)}</p>
      <p><strong>Preferred language:</strong> ${safe(p.language)}</p>
    </div>
    <div class="summary-section">
      <h3>Main concerns</h3>
      <p>${state.concerns.join(", ")}</p>
      <p><strong>Additional notes:</strong> ${safe(state.concernNotes)}</p>
    </div>
    ${hasPain ? `
    <div class="summary-section">
      <h3>Pain details</h3>
      <p><strong>Location:</strong> ${safe(pain.location)}</p>
      <p><strong>Side:</strong> ${safe(pain.side)}</p>
      <p><strong>Score:</strong> ${safe(pain.painScore, "5")}/10</p>
      <p><strong>Duration:</strong> ${safe(pain.duration)}</p>
      <p><strong>Sleep impact:</strong> ${safe(pain.sleepImpact)}</p>
      <p><strong>Daily activity impact:</strong> ${safe(pain.activityImpact)}</p>
      <p><strong>Worse with:</strong> ${safe(pain.worse)}</p>
      <p><strong>Better with:</strong> ${safe(pain.better)}</p>
    </div>` : ""}
  `;
}

document.getElementById("submitAssessment").addEventListener("click", () => {
  state.submittedAt = new Date().toISOString();
  saveState();
  showScreen("complete");
});

document.getElementById("restartBtn").addEventListener("click", () => {
  localStorage.removeItem("lingguangDemoState");
  location.reload();
});

function restoreForm(form, data) {
  Object.entries(data || {}).forEach(([name, value]) => {
    const fields = form.elements[name];
    if (!fields) return;
    if (fields instanceof RadioNodeList) {
      [...fields].forEach(field => field.checked = field.value === value);
    } else {
      fields.value = value;
    }
  });
}

loadState();
restoreForm(profileForm, state.profile);
restoreForm(painForm, state.pain);
document.getElementById("concernNotes").value = state.concernNotes || "";
document.getElementById("painValue").textContent = state.pain?.painScore || "5";

document.querySelectorAll("#concernGrid .pill").forEach(pill => {
  pill.classList.toggle("selected", state.concerns.includes(pill.dataset.value));
});
document.querySelectorAll(".choice-card").forEach(card => {
  card.classList.toggle("selected", card.dataset.method === state.method);
});

if (state.screen === "review") buildReview();
showScreen(state.screen || "welcome");
