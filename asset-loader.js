(() => {
  const assetMap = window.SITE_ASSETS || {};
  const XLINK_NS = "http://www.w3.org/1999/xlink";

  function resolveAsset(keyOrUrl) {
    return assetMap[keyOrUrl] || keyOrUrl || "";
  }

  window.resolveSiteAsset = resolveAsset;

  document.querySelectorAll("[data-asset-key]").forEach((element) => {
    const src = resolveAsset(element.dataset.assetKey);
    if (!src) return;

    const tagName = element.tagName.toLowerCase();
    if (tagName === "image") {
      element.setAttribute("href", src);
      element.setAttributeNS(XLINK_NS, "href", src);
      return;
    }

    if ("src" in element) {
      element.src = src;
    } else {
      element.setAttribute("href", src);
    }
  });
})();
