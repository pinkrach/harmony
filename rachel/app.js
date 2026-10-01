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

  showScreen("welcome");
})();
