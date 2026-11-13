const text = {
  en: {
    startCopy: "Explore Gobustan through three heritage stops. This browser cannot start the 3D view, so an interactive 2D story map is available.",
    startButton: "OPEN STORY MAP",
    warning: "3D rendering is unavailable here. The story map remains interactive.",
    mode: "2D STORY MAP · 3D UNAVAILABLE",
    eyebrow: "AZERBAIJAN · CULTURAL LANDSCAPE",
    headline: "Layers of the Landscape",
    intro: "Explore Gobustan through three interpretive stops. The route below is a conceptual sketch.",
    factSites: "3 UNESCO areas", factYear: "Listed 2007",
    map: "SCHEMATIC ROUTE · SELECT A STOP",
    choose: "Choose a stop",
    chooseCopy: "Select a numbered marker to discover the story behind it.",
    field: "FIELD NOTE",
    progress: "stops explored",
    source: "Open source ↗",
    restart: "Restart",
    footer: "This is an illustrative route, not an official visitor trail or survey-accurate GIS map. 3D models generated with",
    titles: ["Rock engravings", "The resonant stone", "A landscape in layers"],
    descriptions: [
      "UNESCO describes more than 6,000 engravings across Gobustan, bearing testimony to 40,000 years of rock art. The figures record changing lives, landscapes, and ways of seeing.",
      "Azerbaijan Travel identifies the qavaldaşı as a musical stone in Gobustan, used as a natural percussion instrument.",
      "The UNESCO property includes three areas: Jinghirdagh–Yazylytepe, Boyukdash, and Kichikdash. This small route is an interpretation, not the official site plan."
    ]
  },
  az: {
    startCopy: "Qobustanı üç irs dayanacağı vasitəsilə kəşf edin. Bu brauzerdə 3D görünüş başlaya bilmədiyi üçün interaktiv 2D hekayə xəritəsi mövcuddur.",
    startButton: "HEKAYƏ XƏRİTƏSİNİ AÇ",
    warning: "Burada 3D görüntü açıla bilmir. Hekayə xəritəsi interaktivdir.",
    mode: "2D HEKAYƏ XƏRİTƏSİ · 3D MÖVCUD DEYİL",
    eyebrow: "AZƏRBAYCAN · MƏDƏNİ LANDŞAFT",
    headline: "Landşaftın qatları",
    intro: "Qobustanı üç interpretasiya dayanacağı vasitəsilə kəşf edin. Aşağıdakı marşrut konseptual sxemdir.",
    factSites: "3 UNESCO ərazisi", factYear: "2007-ci ildən",
    map: "SXEMATİK MARŞRUT · DAYANACAĞI SEÇİN",
    choose: "Dayanacaq seçin",
    chooseCopy: "Hekayəni oxumaq üçün nömrələnmiş işarələrdən birinə toxunun.",
    field: "SAHƏ QEYDİ",
    progress: "dayanacaq araşdırılıb",
    source: "Mənbəyə bax ↗",
    restart: "Yenidən başla",
    footer: "Bu marşrut təsviridir; rəsmi ziyarət cığırı və ölçülmüş GIS xəritəsi deyil. 3D modellər",
    titles: ["Qayaüstü təsvirlər", "Səslənən daş", "Landşaftın qatları"],
    descriptions: [
      "UNESCO Qobustanda 6 000-dən çox qayaüstü təsvirin olduğunu bildirir; onlar 40 000 illik qaya sənətinə şahidlik edir. Təsvirlər dəyişən həyat tərzini, landşaftı və dünyagörüşünü əks etdirir.",
      "Azerbaijan Travel Qobustandakı qavaldaşını təbii zərb aləti kimi istifadə edilən musiqili daş kimi tanıdır.",
      "UNESCO ərazisinə üç hissə daxildir: Cingirdağ–Yazılıtəpə, Böyükdaş və Kiçikdaş. Bu kiçik marşrut məkan interpretasiyasıdır, rəsmi sahə planı deyil."
    ]
  }
};

export function initFallback() {
  if (document.documentElement.dataset.fallbackReady === "true") return;
  document.documentElement.dataset.fallbackReady = "true";
  let language = document.documentElement.lang === "az" ? "az" : "en";
  let selected = -1;
  const visited = [false, false, false];
  const byId = id => document.getElementById(id);
  const underlay = [document.querySelector(".topbar"), byId("game"), byId("stats"), byId("map-card"),
    byId("quick-stops"), byId("crosshair"), byId("controls"), byId("touch-controls")];
  function setUnderlay(hidden) {
    underlay.forEach(function(element) {
      if (!element) return;
      element.inert = hidden;
      if (hidden) element.setAttribute("aria-hidden", "true");
      else element.removeAttribute("aria-hidden");
    });
  }

  function render() {
    const t = text[language];
    document.documentElement.lang = language;
    byId("start-eyebrow").textContent = t.eyebrow;
    byId("start-title").textContent = t.headline;
    byId("start-copy").textContent = t.startCopy;
    byId("start-btn").textContent = t.startButton;
    byId("load-error").textContent = t.warning;
    byId("fb-mode").textContent = t.mode;
    byId("fb-eyebrow").textContent = t.eyebrow;
    byId("fb-headline").textContent = t.headline;
    byId("fb-intro").textContent = t.intro;
    byId("fb-fact-sites").textContent = t.factSites;
    byId("fb-fact-year").textContent = t.factYear;
    byId("fb-map-title").textContent = t.map;
    byId("fb-lang").textContent = language === "en" ? "EN / AZ" : "AZ / EN";
    byId("fb-reset").setAttribute("aria-label", t.restart);
    byId("lang").textContent = language === "en" ? "EN / AZ" : "AZ / EN";
    byId("fb-progress").textContent = visited.filter(Boolean).length + " / 3 " + t.progress;
    byId("fb-footer").innerHTML = t.footer + " <a href='https://www.thrixel.com/' target='_blank' rel='noopener'>Thrixel</a>.";
    for (let i = 0; i < 3; i++) {
      byId("fb-point-" + i).setAttribute("aria-label", t.titles[i]);
      byId("fb-point-" + i).setAttribute("aria-pressed", selected === i ? "true" : "false");
    }
    if (selected < 0) {
      byId("fb-kicker").textContent = t.field;
      byId("fb-title").textContent = t.choose;
      byId("fb-copy").textContent = t.chooseCopy;
      byId("fb-source").href = "https://whc.unesco.org/en/list/1076/";
    } else {
      byId("fb-kicker").textContent = t.field + " 0" + (selected + 1);
      byId("fb-title").textContent = t.titles[selected];
      byId("fb-copy").textContent = t.descriptions[selected];
      byId("fb-source").href = selected === 1
        ? "https://azerbaijan.travel/qobustanda-das-dovrune-seyahet"
        : "https://whc.unesco.org/en/list/1076/";
    }
    byId("fb-source").textContent = t.source;
    document.dispatchEvent(new CustomEvent("gobustan:language-changed", { detail: language }));
  }
  function toggleLanguage() {
    language = language === "en" ? "az" : "en";
    render();
  }
  byId("start-btn").disabled = false;
  byId("load-error").style.display = "block";
  byId("start-btn").addEventListener("click", function() {
    byId("start").style.display = "none";
    byId("fallback-view").style.display = "block";
    setUnderlay(true);
  });
  byId("lang").addEventListener("click", toggleLanguage);
  byId("fb-lang").addEventListener("click", toggleLanguage);
  document.addEventListener("gobustan:set-language", function(event) {
    language = event.detail === "az" ? "az" : "en";
    render();
  });
  function restart() {
    visited.fill(false);
    selected = -1;
    byId("fallback-view").style.display = "none";
    byId("start").style.display = "grid";
    setUnderlay(false);
    render();
  }
  byId("reset").addEventListener("click", restart);
  byId("fb-reset").addEventListener("click", restart);
  for (let i = 0; i < 3; i++) {
    byId("fb-point-" + i).addEventListener("click", function() {
      selected = i;
      visited[i] = true;
      render();
    });
  }
  render();
}
