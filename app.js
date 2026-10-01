(() => {
  const frame = document.getElementById("version-frame");
  const buttons = document.querySelectorAll(".version-btn");

  function setVersion(button) {
    const src = button.dataset.src;
    const version = button.dataset.version;

    buttons.forEach((btn) => {
      const on = btn === button;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });

    frame.src = src;
    frame.title =
      version === "rachel" ? "Harmony — Rachel's Version" : "Harmony V1";

    const url = new URL(window.location.href);
    url.searchParams.set("version", version);
    window.history.replaceState({}, "", url);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => setVersion(button));
  });

  const start = new URLSearchParams(window.location.search).get("version");
  const initial =
    [...buttons].find((btn) => btn.dataset.version === start) ||
    document.querySelector('.version-btn[data-version="v1"]');

  if (initial) {
    setVersion(initial);
  }
})();
