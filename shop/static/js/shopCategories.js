/**
 * Shop category display + matching.
 * Matching is case-insensitive; labels are shown in Title Case.
 */
(function (global) {
  function toTitleCase(str) {
    return String(str || '').replace(
      /\w\S*/g,
      function (text) {
        return text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();
      }
    );
  }

  function display(raw) {
    const trimmed = String(raw || '').trim().replace(/\s+/g, ' ');
    return trimmed ? toTitleCase(trimmed) : '';
  }

  function key(raw) {
    return display(raw).toLowerCase();
  }

  function parseField(raw) {
    const seen = new Set();
    const out = [];
    String(raw || '')
      .split(',')
      .forEach(function (part) {
        const name = display(part);
        const k = name.toLowerCase();
        if (!name || seen.has(k)) return;
        seen.add(k);
        out.push(name);
      });
    return out;
  }

  function normalizeField(raw) {
    return parseField(raw).join(', ');
  }

  function same(a, b) {
    const ka = key(a);
    const kb = key(b);
    return !!ka && ka === kb;
  }

  global.ShopCategories = {
    display: display,
    key: key,
    parseField: parseField,
    normalizeField: normalizeField,
    same: same
  };
})(typeof window !== 'undefined' ? window : globalThis);
