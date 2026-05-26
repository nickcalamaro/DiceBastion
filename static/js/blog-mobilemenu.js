/**
 * Mobile menu for /posts/ CDN pages — mirrors assets/js/mobilemenu.js behaviour.
 */
(function () {
  var menuIcon = document.getElementById("blog-menu-icon");
  var menuClose = document.getElementById("blog-menu-close-button");
  var menuWrapper = document.getElementById("blog-menu-wrapper");
  var menuContainer = document.getElementById("blog-menu-button");

  if (!menuIcon || !menuClose || !menuWrapper || !menuContainer) return;

  function setOpen(isOpen) {
    menuIcon.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menuWrapper.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  function closeMenu() {
    document.body.style.overflowY = "";
    menuContainer.style.visibility = "visible";
    menuWrapper.style.visibility = "hidden";
    menuWrapper.style.opacity = "0";
    setOpen(false);
    document.removeEventListener("click", closeMenu);
  }

  function openMenu() {
    document.body.style.overflowY = "hidden";
    menuContainer.style.visibility = "hidden";
    menuWrapper.style.visibility = "visible";
    menuWrapper.style.opacity = "1";
    setOpen(true);
    if (window.utils && typeof window.utils.applyVisibilityControls === "function") {
      window.utils.applyVisibilityControls();
    }
    setTimeout(function () {
      document.addEventListener("click", closeMenu);
    }, 0);
  }

  menuIcon.addEventListener("click", function (event) {
    event.stopPropagation();
    openMenu();
  });

  menuClose.addEventListener("click", function (event) {
    event.stopPropagation();
    closeMenu();
  });

  menuWrapper.addEventListener("click", function (event) {
    event.stopPropagation();
  });
})();
