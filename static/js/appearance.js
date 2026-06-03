/**
 * Appearance / dark mode — shared by main site (via Hugo assets) and /posts/ CDN pages.
 * Syncs with localStorage key "appearance" and prefers-color-scheme when auto is enabled.
 */
const sitePreference = document.documentElement.getAttribute("data-default-appearance");
const userPreference = localStorage.getItem("appearance");

if ((sitePreference === "dark" && userPreference === null) || userPreference === "dark") {
  document.documentElement.classList.add("dark");
}

if (document.documentElement.getAttribute("data-auto-appearance") === "true") {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    userPreference !== "light"
  ) {
    document.documentElement.classList.add("dark");
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (event.matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });
}

function getTargetAppearance() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function updateMeta() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const style = getComputedStyle(document.body);
  meta.setAttribute("content", style.backgroundColor);
}

function bindAppearanceSwitcher(id) {
  const switcher = document.getElementById(id);
  if (!switcher) return;
  switcher.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("appearance", getTargetAppearance());
    updateMeta();
    if (typeof window.updateLogo === "function") {
      window.updateLogo(getTargetAppearance());
    }
  });
  switcher.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    localStorage.removeItem("appearance");
  });
}

window.addEventListener("DOMContentLoaded", () => {
  bindAppearanceSwitcher("appearance-switcher");
  bindAppearanceSwitcher("appearance-switcher-mobile");
  updateMeta();
  if (typeof window.updateLogo === "function") {
    window.updateLogo(getTargetAppearance());
  }
});
