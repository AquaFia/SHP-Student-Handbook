/* =========================================================
   ADAIR NEXUS — OPEN-METEO WEATHER STATION

   Privacy rule:
   - Never requests browser geolocation.
   - Never infers a location.
   - Weather is fetched only after the user searches for and
     explicitly selects a location.
   ========================================================= */

(function () {
  "use strict";

  const GEO_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
  const WEATHER_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
  const STORAGE_KEY = "adair-weather-preferences-v1";

  let runtime = null;
  let navButton = null;
  let panel = null;
  let style = null;
  let searchInput = null;
  let resultsHost = null;
  let weatherHost = null;
  let statusHost = null;
  let unitButton = null;
  let searchAbort = null;
  let weatherAbort = null;

  const state = {
    units: "celsius",
    selectedLocation: null,
  };

  const WEATHER_CODES = {
    0: ["Clear sky", "☀"],
    1: ["Mainly clear", "🌤"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁"],
    45: ["Fog", "🌫"],
    48: ["Rime fog", "🌫"],
    51: ["Light drizzle", "🌦"],
    53: ["Drizzle", "🌦"],
    55: ["Dense drizzle", "🌧"],
    56: ["Freezing drizzle", "🌧"],
    57: ["Dense freezing drizzle", "🌧"],
    61: ["Light rain", "🌧"],
    63: ["Rain", "🌧"],
    65: ["Heavy rain", "🌧"],
    66: ["Freezing rain", "🌧"],
    67: ["Heavy freezing rain", "🌧"],
    71: ["Light snow", "🌨"],
    73: ["Snow", "🌨"],
    75: ["Heavy snow", "❄"],
    77: ["Snow grains", "❄"],
    80: ["Light showers", "🌦"],
    81: ["Showers", "🌧"],
    82: ["Heavy showers", "🌧"],
    85: ["Snow showers", "🌨"],
    86: ["Heavy snow showers", "🌨"],
    95: ["Thunderstorm", "⛈"],
    96: ["Thunderstorm with hail", "⛈"],
    99: ["Severe thunderstorm with hail", "⛈"]
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function weatherInfo(code) {
    return WEATHER_CODES[Number(code)] || ["Unknown conditions", "◌"];
  }

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function loadPreferences() {
    const parsed = safeJsonParse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return;
    if (parsed.units === "fahrenheit" || parsed.units === "celsius") {
      state.units = parsed.units;
    }
    if (
      parsed.selectedLocation &&
      Number.isFinite(Number(parsed.selectedLocation.latitude)) &&
      Number.isFinite(Number(parsed.selectedLocation.longitude))
    ) {
      state.selectedLocation = parsed.selectedLocation;
    }
  }

  function savePreferences() {
    const payload = {
      units: state.units,
      selectedLocation: state.selectedLocation
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function setStatus(message, tone) {
    if (!statusHost) return;
    statusHost.textContent = message || "";
    statusHost.dataset.tone = tone || "neutral";
  }

  function formatLocation(item) {
    const parts = [item.name];
    if (item.admin1 && item.admin1 !== item.name) parts.push(item.admin1);
    if (item.country) parts.push(item.country);
    return parts.filter(Boolean).join(", ");
  }

  function tempUnitLabel() {
    return state.units === "fahrenheit" ? "°F" : "°C";
  }

  function speedUnitLabel() {
    return state.units === "fahrenheit" ? "mph" : "km/h";
  }

  function forecastUrl(location) {
    const p = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      timezone: "auto",
      forecast_days: "7",
      temperature_unit: state.units === "fahrenheit" ? "fahrenheit" : "celsius",
      wind_speed_unit: state.units === "fahrenheit" ? "mph" : "kmh",
      precipitation_unit: state.units === "fahrenheit" ? "inch" : "mm",
      current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "surface_pressure",
        "wind_speed_10m",
        "wind_gusts_10m"
      ].join(","),
      hourly: [
        "temperature_2m",
        "precipitation_probability",
        "weather_code"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max"
      ].join(",")
    });
    return `${WEATHER_ENDPOINT}?${p.toString()}`;
  }

  function nextHours(data, count) {
    const times = data?.hourly?.time || [];
    const currentTime = String(data?.current?.time || "");
    const currentHour = currentTime.length >= 13 ? `${currentTime.slice(0, 13)}:00` : "";
    let start = currentHour ? times.findIndex((value) => String(value) >= currentHour) : 0;
    if (start < 0) start = 0;
    const end = Math.min(start + count, times.length);
    const result = [];
    for (let i = start; i < end; i += 1) {
      result.push({
        time: times[i],
        temperature: data.hourly.temperature_2m?.[i],
        precip: data.hourly.precipitation_probability?.[i],
        code: data.hourly.weather_code?.[i]
      });
    }
    return result;
  }

  function formatHour(iso) {
    const value = String(iso || "");
    const match = value.match(/T(\d{2}):(\d{2})/);
    if (!match) return value;
    const hour = Number(match[1]);
    const minute = match[2];
    try {
      const sample = new Date(2000, 0, 1, hour, Number(minute));
      return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: minute === "00" ? undefined : "2-digit" }).format(sample);
    } catch {
      return `${match[1]}:${minute}`;
    }
  }

  function formatDay(iso) {
    try {
      return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${iso}T12:00:00`));
    } catch {
      return iso;
    }
  }

  function renderWeather(data) {
    if (!weatherHost || !state.selectedLocation) return;

    const current = data.current || {};
    const [condition, icon] = weatherInfo(current.weather_code);
    const label = escapeHtml(formatLocation(state.selectedLocation));
    const tUnit = tempUnitLabel();
    const sUnit = speedUnitLabel();
    const precipUnit = state.units === "fahrenheit" ? "in" : "mm";

    const hours = nextHours(data, 8);
    const hourCards = hours.map((item) => {
      const [hourCondition, hourIcon] = weatherInfo(item.code);
      return `
        <div class="adair-hour" title="${escapeHtml(hourCondition)}">
          <span>${escapeHtml(formatHour(item.time))}</span>
          <b aria-hidden="true">${hourIcon}</b>
          <strong>${Math.round(Number(item.temperature))}${tUnit}</strong>
          <small>${Number.isFinite(Number(item.precip)) ? `${Math.round(Number(item.precip))}% rain` : "—"}</small>
        </div>
      `;
    }).join("");

    const days = (data.daily?.time || []).map((day, i) => {
      const [dayCondition, dayIcon] = weatherInfo(data.daily.weather_code?.[i]);
      const hi = Math.round(Number(data.daily.temperature_2m_max?.[i]));
      const lo = Math.round(Number(data.daily.temperature_2m_min?.[i]));
      const pop = Math.round(Number(data.daily.precipitation_probability_max?.[i] || 0));
      return `
        <div class="adair-day">
          <span class="adair-day-name">${escapeHtml(formatDay(day))}</span>
          <span class="adair-day-condition"><b aria-hidden="true">${dayIcon}</b>${escapeHtml(dayCondition)}</span>
          <span class="adair-day-temp"><strong>${hi}${tUnit}</strong> / ${lo}${tUnit}</span>
          <span class="adair-day-rain">${pop}% precip.</span>
        </div>
      `;
    }).join("");

    weatherHost.innerHTML = `
      <section class="adair-current-card">
        <div class="adair-current-heading">
          <div>
            <span class="adair-kicker">SELECTED LOCATION</span>
            <h2>${label}</h2>
            <p>${escapeHtml(state.selectedLocation.timezone || data.timezone || "Local time")}</p>
          </div>
          <div class="adair-current-icon" aria-hidden="true">${icon}</div>
        </div>

        <div class="adair-current-main">
          <div class="adair-temp-block">
            <strong>${Math.round(Number(current.temperature_2m))}${tUnit}</strong>
            <span>${escapeHtml(condition)}</span>
            <small>Feels like ${Math.round(Number(current.apparent_temperature))}${tUnit}</small>
          </div>
          <div class="adair-metrics">
            <div><span>Humidity</span><b>${Math.round(Number(current.relative_humidity_2m))}%</b></div>
            <div><span>Wind</span><b>${Math.round(Number(current.wind_speed_10m))} ${sUnit}</b></div>
            <div><span>Gusts</span><b>${Math.round(Number(current.wind_gusts_10m))} ${sUnit}</b></div>
            <div><span>Cloud cover</span><b>${Math.round(Number(current.cloud_cover))}%</b></div>
            <div><span>Pressure</span><b>${Math.round(Number(current.surface_pressure))} hPa</b></div>
            <div><span>Precipitation</span><b>${Number(current.precipitation || 0).toFixed(1)} ${precipUnit}</b></div>
          </div>
        </div>
      </section>

      <section class="adair-weather-card">
        <div class="adair-section-title">
          <div>
            <span class="adair-kicker">NEXT FEW HOURS</span>
            <strong>Short-range outlook</strong>
          </div>
        </div>
        <div class="adair-hour-strip">${hourCards || "<p>No hourly forecast returned.</p>"}</div>
      </section>

      <section class="adair-weather-card">
        <div class="adair-section-title">
          <div>
            <span class="adair-kicker">7-DAY FORECAST</span>
            <strong>Planning board</strong>
          </div>
        </div>
        <div class="adair-day-list">${days || "<p>No daily forecast returned.</p>"}</div>
      </section>
    `;
  }

  async function fetchWeather(location) {
    weatherAbort?.abort();
    weatherAbort = new AbortController();
    setStatus(`Checking the atmosphere over ${formatLocation(location)}…`, "loading");
    weatherHost.innerHTML = `<div class="adair-empty"><div class="adair-loader" aria-hidden="true"></div><p>Give me a second—I’m checking the latest readings and what the next few hours are doing…</p></div>`;

    try {
      const response = await fetch(forecastUrl(location), { signal: weatherAbort.signal });
      if (!response.ok) throw new Error(`Weather request failed (${response.status}).`);
      const data = await response.json();
      if (data?.error) throw new Error(data.reason || "Open-Meteo returned an error.");
      renderWeather(data);
      setStatus(`Got it. The forecast is up to date for ${formatLocation(location)}.`, "ok");
    } catch (error) {
      if (error?.name === "AbortError") return;
      weatherHost.innerHTML = `
        <div class="adair-empty adair-error">
          <strong>Huh. I can’t get the forecast right now.</strong>
          <p>${escapeHtml(error?.message || "The weather service could not be reached.")}</p>
          <button type="button" data-weather-retry>Try again</button>
        </div>`;
      weatherHost.querySelector("[data-weather-retry]")?.addEventListener("click", () => fetchWeather(location));
      setStatus("I couldn’t get a reading back from the weather service. I’m leaving your selected place exactly as you chose it.", "error");
    }
  }

  function selectLocation(item) {
    state.selectedLocation = {
      id: item.id,
      name: item.name,
      admin1: item.admin1 || "",
      country: item.country || "",
      country_code: item.country_code || "",
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      timezone: item.timezone || "auto"
    };
    savePreferences();
    resultsHost.innerHTML = "";
    searchInput.value = formatLocation(state.selectedLocation);
    fetchWeather(state.selectedLocation);
  }

  function renderSearchResults(items) {
    if (!resultsHost) return;
    if (!items.length) {
      resultsHost.innerHTML = `<div class="adair-search-note">Hmm… I’m not finding that one. Try adding a state, province, or country so I have something more specific to work with.</div>`;
      return;
    }

    resultsHost.innerHTML = items.map((item, index) => {
      const secondary = [item.admin2, item.admin1, item.country].filter(Boolean).join(" · ");
      return `
        <button type="button" class="adair-location-result" data-location-index="${index}">
          <span>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(secondary || item.country_code || "")}</small>
          </span>
          <em>That’s the one</em>
        </button>`;
    }).join("");

    resultsHost.querySelectorAll("[data-location-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items[Number(button.dataset.locationIndex)];
        if (item) selectLocation(item);
      });
    });
  }

  async function searchLocations() {
    const query = searchInput?.value.trim() || "";
    if (query.length < 2) {
      setStatus("Give me at least two letters to work with and I’ll start looking.", "error");
      resultsHost.innerHTML = "";
      return;
    }

    searchAbort?.abort();
    searchAbort = new AbortController();
    setStatus(`Let me look for “${query}”…`, "loading");
    resultsHost.innerHTML = `<div class="adair-search-note">Checking the map…</div>`;

    try {
      const params = new URLSearchParams({
        name: query,
        count: "8",
        language: (document.documentElement.lang || navigator.language || "en").slice(0, 2).toLowerCase(),
        format: "json"
      });
      const response = await fetch(`${GEO_ENDPOINT}?${params.toString()}`, { signal: searchAbort.signal });
      if (!response.ok) throw new Error(`Location search failed (${response.status}).`);
      const data = await response.json();
      const items = Array.isArray(data?.results) ? data.results : [];
      renderSearchResults(items);
      setStatus(items.length ? "Pick the one you meant. Places with the same name can be annoyingly common." : "I couldn’t find a matching place yet.", items.length ? "ok" : "neutral");
    } catch (error) {
      if (error?.name === "AbortError") return;
      resultsHost.innerHTML = `<div class="adair-search-note adair-error">${escapeHtml(error?.message || "Location search is unavailable.")}</div>`;
      setStatus("The place search isn’t answering me right now. We can try again in a moment.", "error");
    }
  }

  function toggleUnits() {
    state.units = state.units === "celsius" ? "fahrenheit" : "celsius";
    savePreferences();
    if (unitButton) unitButton.textContent = state.units === "celsius" ? "°C" : "°F";
    if (state.selectedLocation) fetchWeather(state.selectedLocation);
  }

  function open() {
    runtime?.enterSpecialMode?.();
    navButton?.classList.add("active");
    panel?.removeAttribute("hidden");
    requestAnimationFrame(() => searchInput?.focus({ preventScroll: true }));
  }

  function close() {
    panel?.setAttribute("hidden", "");
    navButton?.classList.remove("active");
    runtime?.leaveSpecialMode?.();
  }

  function buildStyle() {
    style = document.createElement("style");
    style.dataset.companionSpecialModule = "adair-weather";
    style.textContent = `
      .adair-weather-module{
        padding:18px;
        display:grid;
        gap:14px;
        min-height:100%;
        color:var(--ink);
        background:
          radial-gradient(circle at 85% 5%, color-mix(in srgb, var(--cyan) 9%, transparent), transparent 30%),
          linear-gradient(180deg, color-mix(in srgb, var(--panel) 88%, black), var(--bg));
      }
      .adair-weather-header,.adair-weather-card,.adair-current-card{
        border:1px solid var(--line);
        border-radius:18px;
        background:color-mix(in srgb, var(--panel2) 88%, black);
        box-shadow:0 14px 34px rgba(0,0,0,.16);
      }
      .adair-weather-header{padding:16px;display:grid;gap:13px}
      .adair-weather-topline{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .adair-kicker{display:block;font-size:10px;letter-spacing:.15em;color:var(--muted);font-weight:800}
      .adair-weather-header h2,.adair-current-heading h2{margin:3px 0 0;font-size:18px;line-height:1.15}
      .adair-weather-header p,.adair-current-heading p{margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
      .adair-weather-actions{display:flex;gap:8px;flex-wrap:wrap}
      .adair-weather-module button{
        border:1px solid var(--line);border-radius:11px;padding:9px 12px;cursor:pointer;color:var(--ink);
        background:var(--panel);font:inherit;transition:border-color .15s ease,transform .15s ease,background .15s ease;
      }
      .adair-weather-module button:hover{border-color:var(--accent);background:color-mix(in srgb,var(--panel) 82%,var(--accent));transform:translateY(-1px)}
      .adair-weather-module button:focus-visible,.adair-weather-module input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
      .adair-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
      .adair-search-row input{
        width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;padding:11px 12px;
        background:color-mix(in srgb,var(--bg) 72%,black);color:var(--ink);font:inherit;
      }
      .adair-search-row button{background:color-mix(in srgb,var(--accent) 22%,var(--panel));font-weight:800}
      .adair-privacy-note{font-size:11px;color:var(--muted);display:flex;gap:7px;align-items:flex-start;line-height:1.45}
      .adair-privacy-note b{color:var(--secondary)}
      .adair-search-results{display:grid;gap:7px}
      .adair-location-result{display:flex!important;justify-content:space-between;text-align:left;align-items:center;gap:12px;width:100%;border-radius:13px!important}
      .adair-location-result span{display:grid;gap:3px}.adair-location-result small{color:var(--muted)}
      .adair-location-result em{font-style:normal;font-size:10px;color:var(--accent);font-weight:800;white-space:nowrap}
      .adair-search-note{padding:10px 12px;border-left:2px solid var(--secondary);color:var(--muted);font-size:11px;background:color-mix(in srgb,var(--panel) 84%,transparent)}
      .adair-module-status{min-height:17px;color:var(--muted);font-size:11px}.adair-module-status[data-tone="ok"]{color:var(--secondary)}.adair-module-status[data-tone="error"]{color:var(--danger)}
      .adair-current-card{padding:17px;display:grid;gap:16px;overflow:hidden;position:relative}
      .adair-current-card:after{content:"";position:absolute;right:-70px;top:-90px;width:210px;height:210px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 12%,transparent),transparent 67%);pointer-events:none}
      .adair-current-heading{display:flex;justify-content:space-between;gap:16px;align-items:center;position:relative;z-index:1}
      .adair-current-icon{font-size:45px;filter:saturate(.8);line-height:1}
      .adair-current-main{display:grid;grid-template-columns:minmax(120px,.7fr) 1.3fr;gap:16px;position:relative;z-index:1}
      .adair-temp-block{display:grid;align-content:start;gap:5px}.adair-temp-block>strong{font-size:38px;line-height:1;color:var(--accent)}.adair-temp-block>span{font-weight:800}.adair-temp-block>small{color:var(--muted)}
      .adair-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .adair-metrics div{border:1px solid color-mix(in srgb,var(--line) 75%,transparent);border-radius:11px;padding:9px;display:grid;gap:3px;background:color-mix(in srgb,var(--panel) 72%,transparent)}
      .adair-metrics span{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.adair-metrics b{font-size:12px}
      .adair-weather-card{padding:17px;display:grid;gap:14px}.adair-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px}.adair-section-title strong{display:block;margin-top:4px;font-size:17px;line-height:1.2;letter-spacing:.01em}
      .adair-hour-strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(78px,1fr);overflow-x:auto;gap:8px;padding-bottom:4px;scrollbar-width:thin}
      .adair-hour{border:1px solid color-mix(in srgb,var(--line) 78%,transparent);border-radius:12px;padding:11px 8px;text-align:center;display:grid;gap:6px;background:color-mix(in srgb,var(--panel) 74%,transparent)}
      .adair-hour span,.adair-hour small{font-size:10.5px;color:var(--muted);line-height:1.25}.adair-hour>b{font-size:22px}.adair-hour>strong{font-size:13px}
      .adair-day-list{display:grid;gap:7px}.adair-day{display:grid;grid-template-columns:1fr 1.5fr .8fr .8fr;gap:9px;align-items:center;padding:11px 12px;border:1px solid color-mix(in srgb,var(--line) 70%,transparent);border-radius:11px;background:color-mix(in srgb,var(--panel) 72%,transparent);font-size:11.5px;line-height:1.3}
      .adair-day-name{font-weight:800}.adair-day-condition{display:flex;gap:7px;align-items:center;color:var(--muted)}.adair-day-temp{text-align:right}.adair-day-rain{text-align:right;color:var(--cyan)}
      .adair-empty{min-height:180px;display:grid;place-items:center;align-content:center;text-align:center;gap:10px;color:var(--muted);border:1px dashed var(--line);border-radius:18px;padding:20px}.adair-empty p{margin:0;max-width:420px;line-height:1.5}.adair-error strong{color:var(--danger)}
      .adair-loader{width:24px;height:24px;border:2px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:adair-spin .8s linear infinite}@keyframes adair-spin{to{transform:rotate(360deg)}}
      .adair-weather-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;color:var(--muted);font-size:9px;line-height:1.4;padding:0 2px}.adair-weather-footer a{color:var(--cyan)}
      @media(max-width:720px){.adair-current-main{grid-template-columns:1fr}.adair-day{grid-template-columns:1fr 1.2fr}.adair-day-temp,.adair-day-rain{text-align:left}.adair-weather-footer{display:grid}.adair-weather-topline{display:grid}.adair-weather-actions{justify-content:flex-start}}
      @media(prefers-reduced-motion:reduce){.adair-weather-module *{scroll-behavior:auto!important;transition:none!important}.adair-loader{animation:none}}
    `;
    document.head.appendChild(style);
  }

  function buildPanel() {
    navButton = document.createElement("button");
    navButton.type = "button";
    navButton.className = "mode-tab";
    navButton.textContent = "WEATHER";
    navButton.setAttribute("aria-label", "Open Adair weather station");
    navButton.addEventListener("click", open);
    runtime.mounts.navigation.appendChild(navButton);

    panel = document.createElement("section");
    panel.className = "adair-weather-module";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="adair-weather-header">
        <div class="adair-weather-topline">
          <div>
            <span class="adair-kicker">ADAIR // FORECAST BOARD</span>
            <h2>Weather Station</h2>
            <p>Tell me which place you want to check and I’ll pull up the latest readings. Weather’s easier when I know exactly which sky we’re talking about.</p>
          </div>
          <div class="adair-weather-actions">
            <button type="button" data-weather-unit>°C</button>
          </div>
        </div>

        <form class="adair-search-row" data-weather-search-form>
          <input type="search" data-weather-query autocomplete="off" spellcheck="false" placeholder="City, postal code, or place name…" aria-label="Weather location search">
          <button type="submit">Search</button>
        </form>
        <div class="adair-privacy-note"><b>YOUR CALL</b><span>I’m not going to guess where you are. Pick the place yourself, and I’ll check that forecast. That’s all I need.</span></div>
        <div class="adair-search-results" data-weather-results></div>
        <div class="adair-module-status" data-weather-status aria-live="polite"></div>
      </div>

      <div data-weather-content>
        <div class="adair-empty">
          <strong>No sky to watch yet.</strong>
          <p>Search for a place above and pick the one you mean. I’ll handle the forecast from there.</p>
        </div>
      </div>

      <div class="adair-weather-footer">
        <span>Forecast data: Open-Meteo · Location search: GeoNames via Open-Meteo</span>
        <span>I’ll remember the place you picked on this device so you don’t have to search for it every time.</span>
      </div>
    `;

    searchInput = panel.querySelector("[data-weather-query]");
    resultsHost = panel.querySelector("[data-weather-results]");
    weatherHost = panel.querySelector("[data-weather-content]");
    statusHost = panel.querySelector("[data-weather-status]");
    unitButton = panel.querySelector("[data-weather-unit]");

    panel.querySelector("[data-weather-search-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      searchLocations();
    });
    unitButton.addEventListener("click", toggleUnits);

    runtime.mounts.content.appendChild(panel);
  }

  window.CompanionSpecialModule = {
    id: "adair-weather-station",
    name: "Weather",

    init(nextRuntime) {
      runtime = nextRuntime;
      loadPreferences();
      buildStyle();
      buildPanel();
      unitButton.textContent = state.units === "celsius" ? "°C" : "°F";

      if (state.selectedLocation) {
        searchInput.value = formatLocation(state.selectedLocation);
        fetchWeather(state.selectedLocation);
      }
    },

    open,
    close,

    onIdentityChange() {},

    destroy() {
      searchAbort?.abort();
      weatherAbort?.abort();
      navButton?.remove();
      panel?.remove();
      style?.remove();

      runtime = null;
      navButton = null;
      panel = null;
      style = null;
      searchInput = null;
      resultsHost = null;
      weatherHost = null;
      statusHost = null;
      unitButton = null;
      searchAbort = null;
      weatherAbort = null;
    }
  };
})();
