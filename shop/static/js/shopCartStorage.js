/**
 * Shop basket: payload in localStorage, sliding TTL via expires_at + first-party cookie.
 * Cookie avoids relying only on clocks and matches "shopping cart cookie" UX; cart body stays in LS for size.
 *
 * Sliding window: each save() extends expiry by MAX_AGE_SECONDS.
 * Cookies blocked: TTL still enforced via localStorage expiry only.
 */
(function () {
  var LS_CART = 'shop_cart';
  var LS_EXP = 'shop_cart_expires_at';
  var CK = 'db_shop_basket_v1';

  /** Seconds until basket expires after the last cart change (add/update/remove/checkout clear). */
  var MAX_AGE_SEC = 7 * 24 * 60 * 60;

  function maxAgeMs() {
    return MAX_AGE_SEC * 1000;
  }

  function getCookie(name) {
    var m = document.cookie.match(
      new RegExp(
        '(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'
      )
    );
    return m ? decodeURIComponent(m[1]) : '';
  }

  function setCookie(name, value, maxAgeSec) {
    var attrs =
      encodeURIComponent(value) +
      ';path=/;max-age=' +
      String(maxAgeSec) +
      ';SameSite=Lax';
    if (typeof location !== 'undefined' && location.protocol === 'https:') {
      attrs += ';Secure';
    }
    document.cookie = name + '=' + attrs;
  }

  function deleteCookie(name) {
    var attrs = ';path=/;max-age=0;SameSite=Lax';
    if (typeof location !== 'undefined' && location.protocol === 'https:') {
      attrs += ';Secure';
    }
    document.cookie = name + '=' + attrs;
  }

  function cookiesAvailable() {
    if (typeof navigator !== 'undefined' && navigator.cookieEnabled === false) {
      return false;
    }
    try {
      setCookie('_db_shop_ck', '1', 120);
      var ok = getCookie('_db_shop_ck') === '1';
      deleteCookie('_db_shop_ck');
      return ok;
    } catch (e) {
      return false;
    }
  }

  function basketCookieOk() {
    return getCookie(CK) === '1';
  }

  function parseCart(raw) {
    try {
      var p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      return [];
    }
  }

  function isExpired(expStr) {
    if (expStr == null || expStr === '') return false;
    var exp = Number(expStr);
    if (!Number.isFinite(exp)) return false;
    return Date.now() > exp;
  }

  function dispatchCart(count, cart) {
    try {
      window.dispatchEvent(
        new CustomEvent('cartUpdated', {
          detail: { count: count, cart: cart }
        })
      );
    } catch (e) {}
  }

  function clearStorage() {
    try {
      localStorage.removeItem(LS_CART);
      localStorage.removeItem(LS_EXP);
    } catch (e) {}
    deleteCookie(CK);
    dispatchCart(0, []);
  }

  /**
   * One-time hygiene: drop expired baskets, migrate legacy carts, refresh cookie if needed.
   */
  function init() {
    var raw = null;
    var expStr = null;
    try {
      raw = localStorage.getItem(LS_CART);
    } catch (e) {
      raw = null;
    }
    try {
      expStr = localStorage.getItem(LS_EXP);
    } catch (e2) {
      expStr = null;
    }

    if (isExpired(expStr)) {
      if (raw) clearStorage();
      else {
        try {
          localStorage.removeItem(LS_EXP);
        } catch (e3) {}
        deleteCookie(CK);
      }
      return;
    }

    if (!raw) {
      if (basketCookieOk()) deleteCookie(CK);
      try {
        if (expStr) localStorage.removeItem(LS_EXP);
      } catch (e4) {}
      return;
    }

    var parsed = parseCart(raw);
    if (parsed.length === 0) {
      clearStorage();
      return;
    }

    if (!expStr) {
      try {
        localStorage.setItem(LS_EXP, String(Date.now() + maxAgeMs()));
      } catch (e5) {}
      if (cookiesAvailable()) setCookie(CK, '1', MAX_AGE_SEC);
      return;
    }

    if (cookiesAvailable() && !basketCookieOk()) {
      setCookie(CK, '1', MAX_AGE_SEC);
    }
  }

  function load() {
    init();

    var raw = '';
    try {
      raw = localStorage.getItem(LS_CART) || '';
    } catch (e) {
      return [];
    }

    try {
      if (isExpired(localStorage.getItem(LS_EXP))) {
        clearStorage();
        return [];
      }
    } catch (e2) {
      clearStorage();
      return [];
    }

    if (!raw) return [];
    var arr = parseCart(raw);
    if (arr.length === 0 && raw) clearStorage();
    return arr;
  }

  function save(cartArr) {
    var arr = Array.isArray(cartArr) ? cartArr : [];

    if (arr.length === 0) {
      clearStorage();
      return;
    }

    var expiresAt = Date.now() + maxAgeMs();
    try {
      localStorage.setItem(LS_CART, JSON.stringify(arr));
      localStorage.setItem(LS_EXP, String(expiresAt));
    } catch (e) {
      return;
    }
    if (cookiesAvailable()) {
      setCookie(CK, '1', MAX_AGE_SEC);
    }

    var totalItems = arr.reduce(function (sum, row) {
      return sum + (Number(row.quantity) || 0);
    }, 0);
    dispatchCart(totalItems, arr);
  }

  window.ShopCartStorage = {
    load: load,
    save: save,
    clear: clearStorage,
    init: init,
    cookieName: CK,
    localStorageExpiryKey: LS_EXP,
    maxAgeSeconds: MAX_AGE_SEC
  };

  init();
})();
