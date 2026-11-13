import("./gis.js").then(function(gis) {
  gis.initGeoExplorer();
}).catch(function(error) {
  console.error("Geographic explorer could not start", error);
});

async function openFallback(reason) {
  try {
    const fallback = await import("./fallback.js");
    fallback.initFallback(reason);
  } catch (error) {
    const box = document.getElementById("load-error");
    box.style.display = "block";
    box.textContent = "The experience could not start. Please refresh the page or try another browser.";
    console.error("Fallback could not start", error);
  }
}

async function boot() {
  try {
    await import("./main.js");
  } catch (error) {
    console.error("3D experience could not start", error);
    await openFallback("3d-error");
  }
}

boot();
