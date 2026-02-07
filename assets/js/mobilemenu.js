var menuIcon = document.getElementById("menu-icon");
var menuClose = document.getElementById("menu-close-button");
var menuWrapper = document.getElementById("menu-wrapper");
var menuContainer = document.getElementById("menu-button");

function closeMenu() {
  document.body.style.overflowY = "auto";
  menuContainer.style.visibility = "visible";
  menuWrapper.style.visibility = "hidden";
  menuWrapper.style.opacity = "0";
  document.removeEventListener("click", closeMenu);
}

function openMenu() {
  document.body.style.overflowY = "hidden";
  menuContainer.style.visibility = "hidden";
  menuWrapper.style.visibility = "visible";
  menuWrapper.style.opacity = "1";
  setTimeout(() => document.addEventListener("click", closeMenu), 0);
}

menuIcon.addEventListener("click", openMenu);
menuClose.addEventListener("click", closeMenu);