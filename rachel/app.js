(() => {
  const screens = document.querySelectorAll(".screen");
  const phoneShell = document.querySelector(".phone-shell");
  const stage = document.querySelector(".stage");
  const stageLabel = document.querySelector(".stage-label");
  const PHONE_W = 430;
  const PHONE_H = 932;

  function showScreen(name) {
    screens.forEach((screen) => {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    });
  }

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-go]");
    if (!btn) return;
    showScreen(btn.dataset.go);
  });

  const signinForm = document.getElementById("signin-form");
  if (signinForm) {
    signinForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!signinForm.reportValidity()) return;
      showScreen("household-check");
    });
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!signupForm.reportValidity()) return;
      showScreen("household-check");
    });
  }

  const joinForm = document.getElementById("join-form");
  if (joinForm) {
    joinForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!joinForm.reportValidity()) return;
      showScreen("invite");
    });
  }

  const createHouseholdForm = document.getElementById("create-household-form");
  if (createHouseholdForm) {
    createHouseholdForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!createHouseholdForm.reportValidity()) return;
      showScreen("invite");
    });
  }

  const inviteForm = document.getElementById("invite-form");
  const addRoommateBtn = document.getElementById("add-roommate");
  let roommateCount = 2;

  if (inviteForm) {
    inviteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showScreen("preferences");
    });
  }

  if (addRoommateBtn && inviteForm) {
    addRoommateBtn.addEventListener("click", () => {
      roommateCount += 1;
      const label = document.createElement("label");
      label.className = "wire-field";
      label.htmlFor = `roommate-${roommateCount}`;
      label.innerHTML = `
        Roommate ${roommateCount}
        <input
          id="roommate-${roommateCount}"
          class="wire-input"
          type="email"
          name="roommate${roommateCount}"
          placeholder="email or phone"
        />
      `;
      inviteForm.insertBefore(label, addRoommateBtn);
    });
  }

  const preferencesForm = document.getElementById("preferences-form");
  if (preferencesForm) {
    preferencesForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showScreen("dashboard");
    });
  }

  function fitPhoneToViewport() {
    if (!phoneShell || !stage) return;
    if (window.matchMedia("(max-width: 440px)").matches) {
      phoneShell.style.setProperty("--phone-scale", "1");
      return;
    }

    const styles = window.getComputedStyle(stage);
    const padX =
      (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const padY =
      (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
    const gap = parseFloat(styles.gap) || 0;
    const labelH =
      stageLabel && stageLabel.offsetParent !== null
        ? stageLabel.getBoundingClientRect().height + gap
        : 0;

    const availableW = stage.clientWidth - padX;
    const availableH = stage.clientHeight - padY - labelH;
    const scale = Math.min(1, availableW / PHONE_W, availableH / PHONE_H);
    phoneShell.style.setProperty("--phone-scale", String(Math.max(scale, 0.2)));
  }

  fitPhoneToViewport();
  window.addEventListener("resize", fitPhoneToViewport);
  window.addEventListener("load", fitPhoneToViewport);

  /* Chores: check off / uncomplete + confetti */
  const weekList = document.getElementById("chore-this-week");
  const doneList = document.getElementById("chore-completed");
  const doneCount = document.getElementById("chore-done-count");
  const emptyDone = document.getElementById("chore-empty");
  const progressFill = document.getElementById("chore-progress-fill");
  const progressLabel = document.getElementById("chore-progress-label");
  const confettiCanvas = document.getElementById("confetti-canvas");
  let confettiRaf = 0;

  function updateChoreCounts() {
    if (!weekList || !doneList) return;
    const left = weekList.querySelectorAll("[data-chore]").length;
    const done = doneList.querySelectorAll("[data-chore]").length;
    const total = left + done;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    if (doneCount) doneCount.textContent = String(done);
    if (emptyDone) emptyDone.hidden = done > 0;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressLabel) {
      progressLabel.textContent = total === 0 ? "0 of 0" : `${done} of ${total}`;
    }
  }

  function burstConfetti() {
    if (!confettiCanvas) return;
    const screen = confettiCanvas.parentElement;
    if (!screen) return;

    const rect = screen.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width;
    const h = rect.height;
    confettiCanvas.width = Math.floor(w * dpr);
    confettiCanvas.height = Math.floor(h * dpr);
    confettiCanvas.style.width = `${w}px`;
    confettiCanvas.style.height = `${h}px`;
    confettiCanvas.classList.add("is-active");

    const ctx = confettiCanvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#5f7d6e", "#3f5a4c", "#b86b3a", "#6a8f9a", "#e8c27a", "#f4f7f5"];
    const pieces = Array.from({ length: 70 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 7;
      return {
        x: w * 0.5,
        y: h * 0.38,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 4 + Math.random() * 5,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        life: 1,
      };
    });

    const start = performance.now();
    cancelAnimationFrame(confettiRaf);

    function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      pieces.forEach((p) => {
        p.vy += 0.22;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - t / 1.35);
        if (p.life <= 0) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (t < 1.35) {
        confettiRaf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        confettiCanvas.classList.remove("is-active");
      }
    }

    confettiRaf = requestAnimationFrame(frame);
  }

  function onChoreToggle(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
    const row = input.closest("[data-chore]");
    if (!row || !weekList || !doneList) return;

    const meta = row.querySelector("small");
    const due = row.dataset.due || (meta ? meta.textContent : "");

    if (input.checked) {
      row.classList.add("done");
      if (meta) meta.textContent = "Done today";
      doneList.prepend(row);
      burstConfetti();
    } else {
      row.classList.remove("done");
      if (meta) meta.textContent = due;
      weekList.appendChild(row);
    }
    updateChoreCounts();
  }

  if (weekList && doneList) {
    weekList.addEventListener("change", onChoreToggle);
    doneList.addEventListener("change", onChoreToggle);
    updateChoreCounts();
  }

  /* Chore wheel expand / rotate */
  const wheelOpen = document.getElementById("wheel-open");
  const wheelOverlay = document.getElementById("wheel-overlay");
  const wheelClose = document.getElementById("wheel-close");
  const wheelCloseSecondary = document.getElementById("wheel-close-secondary");
  const wheelRotate = document.getElementById("wheel-rotate");
  const wheelDisk = document.getElementById("wheel-disk");
  const wheelLegend = document.getElementById("wheel-legend");
  const wheelAssignments = [
    { person: "You", chore: "Kitchen", swatch: "you" },
    { person: "Sam", chore: "Bath", swatch: "sam" },
    { person: "Jordan", chore: "Trash", swatch: "jordan" },
  ];
  let wheelTurn = 0;

  function renderWheelLegend() {
    if (!wheelLegend) return;
    const chores = wheelAssignments.map((a) => a.chore);
    const offset = wheelTurn % chores.length;
    wheelLegend.innerHTML = wheelAssignments
      .map((a, i) => {
        const chore = chores[(i + offset) % chores.length];
        return `<div class="wheel-legend-row"><span class="swatch ${a.swatch}"></span><strong>${a.person}</strong><span>${chore}</span></div>`;
      })
      .join("");
  }

  function openWheel() {
    if (!wheelOverlay || !wheelOpen) return;
    wheelOverlay.hidden = false;
    requestAnimationFrame(() => wheelOverlay.classList.add("is-open"));
    wheelOpen.setAttribute("aria-expanded", "true");
  }

  function closeWheel() {
    if (!wheelOverlay || !wheelOpen) return;
    wheelOverlay.classList.remove("is-open");
    wheelOpen.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!wheelOverlay.classList.contains("is-open")) {
        wheelOverlay.hidden = true;
      }
    }, 320);
  }

  if (wheelOpen) wheelOpen.addEventListener("click", openWheel);
  if (wheelClose) wheelClose.addEventListener("click", closeWheel);
  if (wheelCloseSecondary) wheelCloseSecondary.addEventListener("click", closeWheel);
  if (wheelOverlay) {
    wheelOverlay.addEventListener("click", (event) => {
      if (event.target === wheelOverlay) closeWheel();
    });
  }
  if (wheelRotate && wheelDisk) {
    wheelRotate.addEventListener("click", () => {
      wheelTurn += 1;
      wheelDisk.style.transform = `rotate(${wheelTurn * 120}deg)`;
      renderWheelLegend();
    });
  }
  renderWheelLegend();

  /* Alt chores: arc zoom (original iteration) */
  const arcBody = document.getElementById("arc-body");
  const arcHub = document.getElementById("arc-hub");
  const arcHint = document.getElementById("arc-hint");
  const arcCheck = document.getElementById("arc-chore-check");
  const altProgressFill = document.getElementById("chore-alt-progress-fill");
  const altProgressLabel = document.getElementById("chore-alt-progress-label");
  let arcDone = false;

  function setArcZoom(zoomedOut) {
    if (!arcBody || !arcHub) return;
    arcBody.classList.toggle("is-zoomed-out", zoomedOut);
    arcHub.setAttribute("aria-expanded", zoomedOut ? "true" : "false");
    if (arcHint) {
      arcHint.textContent = zoomedOut
        ? "Full chore chart · tap the chart area to zoom back in"
        : "Prev & next slices peek at the edges · tap Week chart to zoom out";
    }
  }

  function updateAltProgress() {
    const done = arcDone ? 2 : 1;
    const total = 3;
    const pct = Math.round((done / total) * 100);
    if (altProgressFill) altProgressFill.style.width = `${pct}%`;
    if (altProgressLabel) altProgressLabel.textContent = `${done} of ${total}`;
  }

  if (arcHub && arcBody) {
    const zoomOut = () => {
      if (!arcBody.classList.contains("is-zoomed-out")) setArcZoom(true);
    };
    arcHub.addEventListener("click", (event) => {
      event.stopPropagation();
      zoomOut();
    });
    arcHub.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        zoomOut();
      }
    });

    const arcViewport = document.getElementById("arc-viewport");
    if (arcViewport) {
      arcViewport.addEventListener("click", (event) => {
        if (!arcBody.classList.contains("is-zoomed-out")) return;
        if (event.target.closest(".arc-check, .arc-focus")) return;
        setArcZoom(false);
      });
    }
  }

  if (arcCheck) {
    arcCheck.addEventListener("change", () => {
      arcDone = arcCheck.checked;
      updateAltProgress();
      if (arcDone) burstConfetti();
      const title = document.querySelector(".arc-focus-title");
      const copy = document.querySelector(".arc-focus-copy");
      if (title && copy) {
        if (arcDone) {
          copy.textContent = "Done today · nice work";
        } else {
          copy.textContent = "Wipe-down · Due Sun";
        }
      }
    });
  }

  showScreen("welcome");
})();
