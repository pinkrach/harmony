(() => {
  const HINT_KEY = "harmony_door_hint_seen";

  const screenHome = document.getElementById("screen-home");
  const screenChores = document.getElementById("screen-chores");
  const screenSupplies = document.getElementById("screen-supplies");
  const doorBtn = document.getElementById("door-btn");
  const doorHint = doorBtn.querySelector(".door-hint");
  const aptSnapshot = document.getElementById("apt-snapshot");
  const enterAppBtn = document.getElementById("enter-app");
  const navButtons = document.querySelectorAll("[data-nav]");
  const periodButtons = document.querySelectorAll("[data-period]");
  const addToggle = document.getElementById("add-supply-toggle");
  const addForm = document.getElementById("add-supply-form");
  const supplyInput = document.getElementById("supply-name");
  const neededList = document.getElementById("needed-list");
  const stockedList = document.getElementById("stocked-list");
  const progressPeriod = document.getElementById("progress-period");
  const progressFill = document.getElementById("progress-fill");
  const progressMeta = document.getElementById("progress-meta");
  const choreProgress = document.getElementById("chore-progress");

  let currentPeriod = "weekly";
  let doorRevealTimer = null;
  let autoOpenTimer = null;
  let hasAutoOpened = false;

  if (sessionStorage.getItem(HINT_KEY)) {
    doorHint.hidden = true;
  }

  function updateChoreProgress() {
    const items = screenChores.querySelectorAll(
      `.chore-block[data-show="${currentPeriod}"] .chore-item`
    );
    const total = items.length;
    const done = [...items].filter((item) => item.classList.contains("is-done")).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    progressPeriod.textContent = currentPeriod === "weekly" ? "This week" : "This month";
    progressFill.style.width = `${pct}%`;
    progressMeta.textContent =
      total === 0 ? "No chores yet" : `${done} of ${total} done`;
    choreProgress.setAttribute("aria-valuenow", String(pct));
  }

  function resetHome() {
    if (doorRevealTimer) {
      window.clearTimeout(doorRevealTimer);
      doorRevealTimer = null;
    }
    doorBtn.classList.remove("is-open");
    doorBtn.setAttribute("aria-expanded", "false");
    aptSnapshot.hidden = true;
  }

  function cancelAutoOpen() {
    if (autoOpenTimer) {
      window.clearTimeout(autoOpenTimer);
      autoOpenTimer = null;
    }
    hasAutoOpened = true;
  }

  function scheduleFirstAutoOpen() {
    if (hasAutoOpened) return;
    autoOpenTimer = window.setTimeout(() => {
      autoOpenTimer = null;
      hasAutoOpened = true;
      openDoor();
    }, 1000);
  }

  function showScreen(name) {
    const map = {
      home: screenHome,
      chores: screenChores,
      supplies: screenSupplies,
    };

    Object.entries(map).forEach(([key, el]) => {
      const active = key === name;
      el.hidden = !active;
      el.classList.toggle("is-active", active);
    });

    navButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.nav === name);
    });

    if (name === "home") {
      resetHome();
    } else {
      cancelAutoOpen();
    }

    if (name === "chores") {
      updateChoreProgress();
    }
  }

  function openDoor() {
    if (doorBtn.classList.contains("is-open")) return;
    doorBtn.classList.add("is-open");
    doorBtn.setAttribute("aria-expanded", "true");
    doorHint.hidden = true;
    sessionStorage.setItem(HINT_KEY, "1");

    doorRevealTimer = window.setTimeout(() => {
      aptSnapshot.hidden = false;
      doorRevealTimer = null;
    }, 650);
  }

  function dismissSnapshot() {
    aptSnapshot.hidden = true;
    doorBtn.classList.remove("is-open");
    doorBtn.setAttribute("aria-expanded", "false");
    showScreen("chores");
  }

  showScreen("home");
  scheduleFirstAutoOpen();

  doorBtn.addEventListener("click", () => {
    cancelAutoOpen();
    openDoor();
  });
  enterAppBtn.addEventListener("click", dismissSnapshot);

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.nav));
  });

  periodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const period = btn.dataset.period;
      currentPeriod = period;
      periodButtons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });

      document.querySelectorAll("[data-show]").forEach((block) => {
        block.hidden = block.dataset.show !== period;
      });

      updateChoreProgress();
    });
  });

  document.querySelectorAll(".chore-item:not(.is-other) .check").forEach((check) => {
    check.addEventListener("click", () => {
      const item = check.closest(".chore-item");
      const done = item.classList.toggle("is-done");
      check.setAttribute("aria-pressed", done ? "true" : "false");
      updateChoreProgress();
    });
  });

  updateChoreProgress();

  addToggle.addEventListener("click", () => {
    const open = addForm.hidden;
    addForm.hidden = !open;
    addToggle.setAttribute("aria-expanded", open ? "true" : "false");
    addToggle.textContent = open ? "Cancel" : "Add";
    if (open) {
      supplyInput.focus();
    } else {
      addForm.reset();
    }
  });

  function markBought(item) {
    const title = item.querySelector(".supply-title").textContent;
    item.classList.add("is-leaving");

    window.setTimeout(() => {
      item.remove();

      const stocked = document.createElement("li");
      stocked.className = "supply-item is-stocked";
      stocked.innerHTML = `
        <div class="supply-body">
          <p class="supply-title"></p>
          <p class="supply-meta">Bought by You · Just now</p>
        </div>
      `;
      stocked.querySelector(".supply-title").textContent = title;
      stockedList.prepend(stocked);
    }, 220);
  }

  neededList.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-action='bought']");
    if (!btn) return;
    markBought(btn.closest(".supply-item"));
  });

  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = supplyInput.value.trim();
    if (!name) return;

    const li = document.createElement("li");
    li.className = "supply-item";
    li.innerHTML = `
      <div class="supply-body">
        <p class="supply-title"></p>
        <p class="supply-meta">Marked low by You · Just now</p>
      </div>
      <button type="button" class="buy-btn" data-action="bought">I bought it</button>
    `;
    li.querySelector(".supply-title").textContent = name;
    neededList.prepend(li);

    addForm.reset();
    addForm.hidden = true;
    addToggle.setAttribute("aria-expanded", "false");
    addToggle.textContent = "Add";
  });
})();
