/* ==========================================
   CLIMATEIQ
   AI Weather Intelligence Dashboard
   Phase 3A - Core Engine
========================================== */

/* ==========================================
   CONFIG
========================================== */

const API_KEY = "27b47116c7346ca2b7f6592c6b12c9de";

const WEATHER_URL =
  "https://api.openweathermap.org/data/2.5/weather";

const FORECAST_URL =
  "https://api.openweathermap.org/data/2.5/forecast";

const AIR_URL =
  "https://api.openweathermap.org/data/2.5/air_pollution";

/* ==========================================
   GLOBAL STATE
========================================== */

let currentWeather = null;
let forecastData = null;
let airQualityData = null;

/* ==========================================
   DOM ELEMENTS
========================================== */

const cityInput =
  document.getElementById("cityInput");

const searchBtn =
  document.getElementById("searchBtn");

const locationBtn =
  document.getElementById("locationBtn");

const cityName =
  document.getElementById("cityName");

const temperature =
  document.getElementById("temperature");

const condition =
  document.getElementById("condition");

const weatherIcon =
  document.getElementById("weatherIcon");

const humidity =
  document.getElementById("humidity");

const wind =
  document.getElementById("wind");

const pressure =
  document.getElementById("pressure");

const visibility =
  document.getElementById("visibility");

const uv =
  document.getElementById("uv");

const aqi =
  document.getElementById("aqi");

const climateScore =
  document.getElementById("climateScore");

/* ==========================================
   UTILITIES
========================================== */

function formatTemperature(temp) {
  return `${Math.round(temp)}°C`;
}

function formatVisibility(value) {
  return `${(value / 1000).toFixed(1)} km`;
}

function showError(message) {
  alert(message);
}

function saveRecentSearch(city) {
  let searches =
    JSON.parse(localStorage.getItem("recentSearches")) || [];

  searches = searches.filter(
    item => item.toLowerCase() !== city.toLowerCase()
  );

  searches.unshift(city);

  searches = searches.slice(0, 8);

  localStorage.setItem(
    "recentSearches",
    JSON.stringify(searches)
  );
}

/* ==========================================
   CURRENT WEATHER
========================================== */

async function fetchWeatherData(city) {
  try {

    const response = await fetch(
      `${WEATHER_URL}?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok)
      throw new Error("City not found");

    const data = await response.json();

    currentWeather = data;

    await fetchAQIData(
      data.coord.lat,
      data.coord.lon
    );

    await fetchForecastData(city);

    renderDashboard();

    saveRecentSearch(city);

  } catch (error) {

    console.error(error);

    showError(
      "Unable to load weather data."
    );
  }
}

/* ==========================================
   FORECAST DATA
========================================== */

async function fetchForecastData(city) {
  try {

    const response = await fetch(
      `${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok)
      throw new Error();

    forecastData = await response.json();

  } catch (error) {

    console.error(
      "Forecast Error",
      error
    );
  }
}

/* ==========================================
   AIR QUALITY
========================================== */

async function fetchAQIData(lat, lon) {

  try {

    const response = await fetch(
      `${AIR_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (!response.ok)
      throw new Error();

    airQualityData =
      await response.json();

  } catch (error) {

    console.error(
      "AQI Error",
      error
    );
  }
}

/* ==========================================
   CLIMATE SCORE ENGINE
========================================== */

function calculateClimateScore() {

  if (
    !currentWeather ||
    !airQualityData
  ) return 0;

  const temp =
    currentWeather.main.temp;

  const humidityValue =
    currentWeather.main.humidity;

  const windValue =
    currentWeather.wind.speed;

  const aqiValue =
    airQualityData.list[0].main.aqi;

  let score = 100;

  /* Temperature */

  if (temp < 10 || temp > 38)
    score -= 20;
  else if (temp < 15 || temp > 33)
    score -= 10;

  /* Humidity */

  if (
    humidityValue < 25 ||
    humidityValue > 80
  )
    score -= 15;

  /* Wind */

  if (windValue > 12)
    score -= 15;

  /* AQI */

  score -= (aqiValue - 1) * 8;

  return Math.max(
    0,
    Math.min(score, 100)
  );
}

function climateRating(score) {

  if (score >= 90)
    return "Excellent";

  if (score >= 75)
    return "Good";

  if (score >= 60)
    return "Moderate";

  if (score >= 40)
    return "Poor";

  return "Severe";
}

/* ==========================================
   DASHBOARD RENDER
========================================== */

function renderDashboard() {

  if (!currentWeather) return;

  cityName.textContent =
    currentWeather.name;

  temperature.textContent =
    formatTemperature(
      currentWeather.main.temp
    );

  condition.textContent =
    currentWeather.weather[0].description;

  weatherIcon.src =
    `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`;

  humidity.textContent =
    `${currentWeather.main.humidity}%`;

  wind.textContent =
    `${currentWeather.wind.speed} m/s`;

  pressure.textContent =
    `${currentWeather.main.pressure} hPa`;

  visibility.textContent =
    formatVisibility(
      currentWeather.visibility
    );

  if (airQualityData) {

    const aqiValue =
      airQualityData.list[0].main.aqi;

    aqi.textContent =
      getAQIText(aqiValue);
  }

  const score =
    calculateClimateScore();

  climateScore.textContent =
    `${score}/100 • ${climateRating(score)}`;
}

/* ==========================================
   AQI LABELS
========================================== */

function getAQIText(level) {

  switch (level) {

    case 1:
      return "Excellent";

    case 2:
      return "Good";

    case 3:
      return "Moderate";

    case 4:
      return "Poor";

    case 5:
      return "Severe";

    default:
      return "--";
  }
}

/* ==========================================
   GEOLOCATION
========================================== */

function loadCurrentLocation() {

  if (!navigator.geolocation) {

    showError(
      "Geolocation not supported."
    );

    return;
  }

  navigator.geolocation.getCurrentPosition(

    async position => {

      const lat =
        position.coords.latitude;

      const lon =
        position.coords.longitude;

      try {

        const response =
          await fetch(
            `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
          );

        const data =
          await response.json();

        currentWeather = data;

        await fetchAQIData(
          lat,
          lon
        );

        await fetchForecastData(
          data.name
        );

        renderDashboard();

      } catch (error) {

        console.error(error);

        showError(
          "Unable to detect location."
        );
      }
    },

    error => {

      console.error(error);

      showError(
        "Location permission denied."
      );
    }
  );
}

/* ==========================================
   SEARCH
========================================== */

function searchCity() {

  const city =
    cityInput.value.trim();

  if (!city) return;

  fetchWeatherData(city);

  cityInput.value = "";
}

/* ==========================================
   EVENTS
========================================== */

searchBtn.addEventListener(
  "click",
  searchCity
);

cityInput.addEventListener(
  "keydown",
  e => {

    if (e.key === "Enter")
      searchCity();
  }
);

locationBtn.addEventListener(
  "click",
  loadCurrentLocation
);

/* ==========================================
   THEME SYSTEM
========================================== */

const themeToggle =
  document.getElementById(
    "themeToggle"
  );

function loadTheme() {

  const savedTheme =
    localStorage.getItem(
      "climateTheme"
    );

  if (savedTheme === "dark") {

    document.body.classList.add(
      "dark"
    );
  }
}

function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );

  const isDark =
    document.body.classList.contains(
      "dark"
    );

  localStorage.setItem(
    "climateTheme",
    isDark ? "dark" : "light"
  );
}

themeToggle.addEventListener(
  "click",
  toggleTheme
);

/* ==========================================
   STARTUP
========================================== */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    loadTheme();

    loadCurrentLocation();
  }
);
/* ==========================================
   PHASE 3B
   FORECAST + AI WEATHER INTELLIGENCE
========================================== */

/* ==========================================
   DOM REFERENCES
========================================== */

const hourlyForecastContainer =
  document.getElementById("hourlyForecast");

const weeklyForecastContainer =
  document.getElementById("weeklyForecast");

const insightsContainer =
  document.getElementById("insightsContainer");

/* ==========================================
   TIME HELPERS
========================================== */

function formatHour(dateString) {

  const date = new Date(dateString);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDay(dateString) {

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    weekday: "short"
  });
}

/* ==========================================
   HOURLY FORECAST
========================================== */

function renderHourlyForecast() {

  if (!forecastData) return;

  hourlyForecastContainer.innerHTML = "";

  const next24Hours =
    forecastData.list.slice(0, 8);

  next24Hours.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "glass hour-card";

    const temp =
      Math.round(item.main.temp);

    const rain =
      item.pop
        ? Math.round(item.pop * 100)
        : 0;

    card.innerHTML = `
      <h4>${formatHour(item.dt_txt)}</h4>

      <img
        src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png"
        alt="weather"
      >

      <h3>${temp}°</h3>

      <p>${rain}% Rain</p>
    `;

    hourlyForecastContainer.appendChild(card);
  });
}

/* ==========================================
   WEEKLY FORECAST
========================================== */

function renderWeeklyForecast() {

  if (!forecastData) return;

  weeklyForecastContainer.innerHTML = "";

  const dailyMap = {};

  forecastData.list.forEach(item => {

    const day =
      item.dt_txt.split(" ")[0];

    if (!dailyMap[day]) {

      dailyMap[day] = [];
    }

    dailyMap[day].push(item);
  });

  const days =
    Object.keys(dailyMap).slice(0, 7);

  days.forEach(day => {

    const entries =
      dailyMap[day];

    const temps =
      entries.map(
        e => e.main.temp
      );

    const high =
      Math.max(...temps);

    const low =
      Math.min(...temps);

    const weather =
      entries[0].weather[0].main;

    const rainChance =
      Math.max(
        ...entries.map(
          e =>
            e.pop
              ? e.pop * 100
              : 0
        )
      );

    const row =
      document.createElement("div");

    row.className =
      "day-row";

    row.innerHTML = `
      <strong>
        ${formatDay(day)}
      </strong>

      <span>
        ${weather}
      </span>

      <span>
        ${Math.round(high)}°
        /
        ${Math.round(low)}°
      </span>

      <span>
        ${Math.round(rainChance)}%
      </span>
    `;

    weeklyForecastContainer.appendChild(row);
  });
}

/* ==========================================
   WEATHER INSIGHTS ENGINE
========================================== */

function generateWeatherInsights() {

  if (
    !currentWeather ||
    !airQualityData
  ) return [];

  const insights = [];

  const temp =
    currentWeather.main.temp;

  const humidityValue =
    currentWeather.main.humidity;

  const windSpeed =
    currentWeather.wind.speed;

  const conditionText =
    currentWeather.weather[0].main;

  const aqiLevel =
    airQualityData.list[0].main.aqi;

  /* Temperature */

  if (temp >= 20 && temp <= 28) {

    insights.push(
      "Perfect weather for outdoor exercise and walking."
    );
  }

  if (temp > 35) {

    insights.push(
      "High temperature alert. Stay hydrated and avoid prolonged sun exposure."
    );
  }

  if (temp < 10) {

    insights.push(
      "Cold weather expected. Layered clothing recommended."
    );
  }

  /* AQI */

  if (aqiLevel >= 4) {

    insights.push(
      "Air quality is poor. Reduce outdoor activities if possible."
    );
  }

  if (aqiLevel <= 2) {

    insights.push(
      "Air quality is excellent for outdoor activities."
    );
  }

  /* Humidity */

  if (humidityValue > 80) {

    insights.push(
      "High humidity may increase discomfort and fatigue."
    );
  }

  /* Wind */

  if (windSpeed > 10) {

    insights.push(
      "Strong winds expected. Secure loose outdoor items."
    );
  }

  /* Weather Condition */

  if (
    conditionText.includes("Rain") ||
    conditionText.includes("Drizzle")
  ) {

    insights.push(
      "Rain conditions detected. Carry an umbrella."
    );
  }

  if (
    conditionText.includes("Cloud")
  ) {

    insights.push(
      "Cloud cover creates excellent photography lighting."
    );
  }

  if (
    conditionText.includes("Clear")
  ) {

    insights.push(
      "Clear skies expected with strong visibility."
    );
  }

  return insights;
}

/* ==========================================
   INSIGHT UI
========================================== */

function renderInsights() {

  insightsContainer.innerHTML = "";

  const insights =
    generateWeatherInsights();

  insights.forEach(text => {

    const card =
      document.createElement("div");

    card.className =
      "insight-card";

    card.innerHTML = `
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <p>${text}</p>
    `;

    insightsContainer.appendChild(card);
  });
}

/* ==========================================
   TRAVEL RECOMMENDATION ENGINE
========================================== */

function generateTravelRecommendations() {

  if (!currentWeather)
    return [];

  const conditionText =
    currentWeather.weather[0].main;

  if (
    conditionText.includes("Clear")
  ) {

    return [
      "Hiking",
      "Cycling",
      "Beach Visit",
      "Photography Tour"
    ];
  }

  if (
    conditionText.includes("Cloud")
  ) {

    return [
      "Sightseeing",
      "Nature Walk",
      "City Exploration"
    ];
  }

  if (
    conditionText.includes("Rain")
  ) {

    return [
      "Museum Visit",
      "Indoor Activities",
      "Shopping Mall"
    ];
  }

  return [
    "Explore Local Attractions"
  ];
}

/* ==========================================
   OPTIONAL CONSOLE PREVIEW
========================================== */

function previewTravelSuggestions() {

  const suggestions =
    generateTravelRecommendations();

  console.log(
    "Travel Suggestions:",
    suggestions
  );
}

/* ==========================================
   SUNRISE / SUNSET
========================================== */

function formatTime(unix) {

  return new Date(
    unix * 1000
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getSunrise() {

  if (!currentWeather)
    return "--";

  return formatTime(
    currentWeather.sys.sunrise
  );
}

function getSunset() {

  if (!currentWeather)
    return "--";

  return formatTime(
    currentWeather.sys.sunset
  );
}

/* ==========================================
   UV ESTIMATION
========================================== */

function estimateUVIndex() {

  if (!currentWeather)
    return "--";

  const clouds =
    currentWeather.clouds.all;

  const hour =
    new Date().getHours();

  let uvEstimate = 0;

  if (
    hour >= 10 &&
    hour <= 15
  ) {

    uvEstimate = 8;
  } else {

    uvEstimate = 4;
  }

  if (clouds > 70)
    uvEstimate -= 3;

  if (clouds > 40)
    uvEstimate -= 1;

  uvEstimate =
    Math.max(1, uvEstimate);

  if (uv)
    uv.textContent =
      uvEstimate;

  return uvEstimate;
}

/* ==========================================
   EXTENDED DASHBOARD UPDATE
========================================== */

const originalRenderDashboard =
  renderDashboard;

renderDashboard = function () {

  originalRenderDashboard();

  renderHourlyForecast();

  renderWeeklyForecast();

  renderInsights();

  estimateUVIndex();

  previewTravelSuggestions();
};
/* ==========================================
   PHASE 3C
   ANALYTICS + COMPARISON
========================================== */

/* ==========================================
   CHART REFERENCES
========================================== */

const tempCanvas =
  document.getElementById("tempChart");

const humidityCanvas =
  document.getElementById("humidityChart");

const windCanvas =
  document.getElementById("windChart");

const rainCanvas =
  document.getElementById("rainChart");

const compareCanvas =
  document.getElementById("compareChart");

/* ==========================================
   CHART INSTANCES
========================================== */

let tempChart;
let humidityChart;
let windChart;
let rainChart;
let compareChart;

/* ==========================================
   COMMON CHART OPTIONS
========================================== */

function chartTheme() {

  const dark =
    document.body.classList.contains("dark");

  return {
    color: dark
      ? "#E2E8F0"
      : "#475569",

    grid: dark
      ? "rgba(255,255,255,.08)"
      : "rgba(15,23,42,.08)"
  };
}

/* ==========================================
   DESTROY EXISTING CHART
========================================== */

function destroyChart(chart) {

  if (chart)
    chart.destroy();
}

/* ==========================================
   EXTRACT FORECAST DATA
========================================== */

function getForecastMetrics() {

  if (!forecastData)
    return null;

  const next24 =
    forecastData.list.slice(0, 8);

  const labels =
    next24.map(item =>
      formatHour(item.dt_txt)
    );

  const temperatures =
    next24.map(item =>
      Math.round(item.main.temp)
    );

  const humidity =
    next24.map(item =>
      item.main.humidity
    );

  const wind =
    next24.map(item =>
      item.wind.speed
    );

  const rain =
    next24.map(item =>
      Math.round(
        (item.pop || 0) * 100
      )
    );

  return {
    labels,
    temperatures,
    humidity,
    wind,
    rain
  };
}

/* ==========================================
   TEMPERATURE CHART
========================================== */

function renderTemperatureChart() {

  const metrics =
    getForecastMetrics();

  if (!metrics || !tempCanvas)
    return;

  destroyChart(tempChart);

  const theme =
    chartTheme();

  tempChart = new Chart(
    tempCanvas,
    {
      type: "line",

      data: {
        labels: metrics.labels,

        datasets: [
          {
            label:
              "Temperature °C",

            data:
              metrics.temperatures,

            borderColor:
              "#4F46E5",

            backgroundColor:
              "rgba(79,70,229,.15)",

            fill: true,

            tension: .4
          }
        ]
      },

      options: {
        responsive: true,

        plugins: {
          legend: {
            labels: {
              color:
                theme.color
            }
          }
        },

        scales: {
          x: {
            ticks: {
              color:
                theme.color
            },
            grid: {
              color:
                theme.grid
            }
          },

          y: {
            ticks: {
              color:
                theme.color
            },
            grid: {
              color:
                theme.grid
            }
          }
        }
      }
    }
  );
}

/* ==========================================
   HUMIDITY CHART
========================================== */

function renderHumidityChart() {

  const metrics =
    getForecastMetrics();

  if (!metrics || !humidityCanvas)
    return;

  destroyChart(humidityChart);

  const theme =
    chartTheme();

  humidityChart =
    new Chart(
      humidityCanvas,
      {
        type: "bar",

        data: {
          labels:
            metrics.labels,

          datasets: [
            {
              label:
                "Humidity %",

              data:
                metrics.humidity,

              backgroundColor:
                "#06B6D4"
            }
          ]
        },

        options: {
          responsive: true,

          scales: {
            x: {
              ticks: {
                color:
                  theme.color
              }
            },

            y: {
              ticks: {
                color:
                  theme.color
              }
            }
          }
        }
      }
    );
}

/* ==========================================
   WIND CHART
========================================== */

function renderWindChart() {

  const metrics =
    getForecastMetrics();

  if (!metrics || !windCanvas)
    return;

  destroyChart(windChart);

  const theme =
    chartTheme();

  windChart =
    new Chart(
      windCanvas,
      {
        type: "line",

        data: {
          labels:
            metrics.labels,

          datasets: [
            {
              label:
                "Wind Speed",

              data:
                metrics.wind,

              borderColor:
                "#10B981",

              backgroundColor:
                "rgba(16,185,129,.15)",

              fill: true,

              tension: .45
            }
          ]
        },

        options: {
          responsive: true,

          scales: {
            x: {
              ticks: {
                color:
                  theme.color
              }
            },

            y: {
              ticks: {
                color:
                  theme.color
              }
            }
          }
        }
      }
    );
}

/* ==========================================
   RAIN CHART
========================================== */

function renderRainChart() {

  const metrics =
    getForecastMetrics();

  if (!metrics || !rainCanvas)
    return;

  destroyChart(rainChart);

  const theme =
    chartTheme();

  rainChart =
    new Chart(
      rainCanvas,
      {
        type: "bar",

        data: {
          labels:
            metrics.labels,

          datasets: [
            {
              label:
                "Rain Chance %",

              data:
                metrics.rain,

              backgroundColor:
                "#38BDF8"
            }
          ]
        },

        options: {
          responsive: true,

          scales: {
            x: {
              ticks: {
                color:
                  theme.color
              }
            },

            y: {
              ticks: {
                color:
                  theme.color
              }
            }
          }
        }
      }
    );
}

/* ==========================================
   RENDER ALL CHARTS
========================================== */

function renderCharts() {

  renderTemperatureChart();

  renderHumidityChart();

  renderWindChart();

  renderRainChart();
}

/* ==========================================
   MULTI CITY COMPARISON
========================================== */

async function fetchCityComparison(city) {

  const response =
    await fetch(
      `${WEATHER_URL}?q=${city}&appid=${API_KEY}&units=metric`
    );

  if (!response.ok)
    throw new Error(
      `Unable to load ${city}`
    );

  return response.json();
}

/* ==========================================
   COMPARISON CHART
========================================== */

async function compareCities(
  cities
) {

  try {

    const results =
      await Promise.all(
        cities.map(city =>
          fetchCityComparison(city)
        )
      );

    renderComparisonChart(
      results
    );

  } catch (error) {

    console.error(error);

    alert(
      "Comparison failed."
    );
  }
}

function renderComparisonChart(
  cities
) {

  if (!compareCanvas)
    return;

  destroyChart(compareChart);

  const theme =
    chartTheme();

  compareChart =
    new Chart(
      compareCanvas,
      {
        type: "radar",

        data: {
          labels: [
            "Temp",
            "Humidity",
            "Wind",
            "Pressure"
          ],

          datasets:
            cities.map(
              city => ({
                label:
                  city.name,

                data: [
                  city.main.temp,

                  city.main.humidity,

                  city.wind.speed,

                  city.main.pressure / 10
                ],

                fill: true
              })
            )
        },

        options: {
          responsive: true,

          plugins: {
            legend: {
              labels: {
                color:
                  theme.color
              }
            }
          }
        }
      }
    );
}

/* ==========================================
   COMPARE BUTTON
========================================== */

function setupComparisonUI() {

  const section =
    document.querySelector(
      ".compare"
    );

  if (!section)
    return;

  const inputs =
    section.querySelectorAll(
      "input"
    );

  const button =
    section.querySelector(
      "button"
    );

  button.addEventListener(
    "click",
    () => {

      const cities =
        [...inputs]
          .map(
            input =>
              input.value.trim()
          )
          .filter(Boolean);

      if (
        cities.length < 2
      ) {

        alert(
          "Enter at least 2 cities."
        );

        return;
      }

      compareCities(
        cities
      );
    }
  );
}

/* ==========================================
   EXTEND DASHBOARD
========================================== */

const previousDashboardRender =
  renderDashboard;

renderDashboard =
  function () {

    previousDashboardRender();

    renderCharts();
  };

/* ==========================================
   THEME REFRESH
========================================== */

if (themeToggle) {

  themeToggle.addEventListener(
    "click",
    () => {

      setTimeout(
        renderCharts,
        200
      );
    }
  );
}

/* ==========================================
   INIT COMPARISON
========================================== */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    setupComparisonUI();
  }
);
/* ==========================================
   PHASE 3D
   FAVORITES + JOURNAL + STORAGE
========================================== */

/* ==========================================
   STORAGE KEYS
========================================== */

const STORAGE_KEYS = {

  FAVORITES:
    "climateiq_favorites",

  JOURNAL:
    "climateiq_journal",

  RECENT:
    "climateiq_recent",

  THEME:
    "climateTheme"
};

/* ==========================================
   FAVORITES MANAGER
========================================== */

function getFavorites() {

  return JSON.parse(
    localStorage.getItem(
      STORAGE_KEYS.FAVORITES
    )
  ) || [];
}

function saveFavorites(
  favorites
) {

  localStorage.setItem(
    STORAGE_KEYS.FAVORITES,
    JSON.stringify(
      favorites
    )
  );
}

function addFavorite(
  city
) {

  let favorites =
    getFavorites();

  if (
    favorites.includes(city)
  )
    return;

  favorites.push(city);

  saveFavorites(
    favorites
  );

  renderFavorites();
}

function removeFavorite(
  city
) {

  let favorites =
    getFavorites();

  favorites =
    favorites.filter(
      item =>
        item !== city
    );

  saveFavorites(
    favorites
  );

  renderFavorites();
}

function renderFavorites() {

  let container =
    document.getElementById(
      "favoritesContainer"
    );

  if (!container) {

    container =
      document.createElement(
        "div"
      );

    container.id =
      "favoritesContainer";

    container.className =
      "glass";

    container.style.padding =
      "20px";

    document
      .querySelector("main")
      .appendChild(
        container
      );
  }

  const favorites =
    getFavorites();

  container.innerHTML = `
    <h2>
      Favorite Locations
    </h2>
  `;

  if (
    favorites.length === 0
  ) {

    container.innerHTML += `
      <p>No favorites saved.</p>
    `;

    return;
  }

  favorites.forEach(
    city => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "journal-entry";

      item.innerHTML = `
        <strong>${city}</strong>

        <div style="
          margin-top:10px;
          display:flex;
          gap:10px;
        ">
          <button
            class="load-city"
            data-city="${city}"
          >
            Load
          </button>

          <button
            class="remove-city"
            data-city="${city}"
          >
            Remove
          </button>
        </div>
      `;

      container.appendChild(
        item
      );
    });

  container
    .querySelectorAll(
      ".load-city"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          fetchWeatherData(
            btn.dataset.city
          );
        }
      );
    });

  container
    .querySelectorAll(
      ".remove-city"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          removeFavorite(
            btn.dataset.city
          );
        }
      );
    });
}

/* ==========================================
   QUICK FAVORITE BUTTON
========================================== */

function injectFavoriteButton() {

  const hero =
    document.querySelector(
      ".hero"
    );

  if (
    document.getElementById(
      "favoriteBtn"
    )
  )
    return;

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "favoriteBtn";

  button.innerHTML =
    "⭐ Save Favorite";

  button.style.marginTop =
    "15px";

  button.addEventListener(
    "click",
    () => {

      if (
        currentWeather
      ) {

        addFavorite(
          currentWeather.name
        );
      }
    }
  );

  hero.appendChild(
    button
  );
}

/* ==========================================
   RECENT SEARCHES
========================================== */

function saveRecentSearchAdvanced(
  city
) {

  let recent =
    JSON.parse(
      localStorage.getItem(
        STORAGE_KEYS.RECENT
      )
    ) || [];

  recent =
    recent.filter(
      item =>
        item !== city
    );

  recent.unshift(
    city
  );

  recent =
    recent.slice(0, 10);

  localStorage.setItem(
    STORAGE_KEYS.RECENT,
    JSON.stringify(
      recent
    )
  );

  renderRecentSearches();
}

function renderRecentSearches() {

  let container =
    document.getElementById(
      "recentSearchContainer"
    );

  if (!container) {

    container =
      document.createElement(
        "div"
      );

    container.id =
      "recentSearchContainer";

    container.className =
      "glass";

    container.style.padding =
      "20px";

    document
      .querySelector("main")
      .appendChild(
        container
      );
  }

  const recent =
    JSON.parse(
      localStorage.getItem(
        STORAGE_KEYS.RECENT
      )
    ) || [];

  container.innerHTML = `
    <h2>
      Recent Searches
    </h2>
  `;

  recent.forEach(
    city => {

      const btn =
        document.createElement(
          "button"
        );

      btn.textContent =
        city;

      btn.style.margin =
        "5px";

      btn.addEventListener(
        "click",
        () =>
          fetchWeatherData(
            city
          )
      );

      container.appendChild(
        btn
      );
    });
}

/* ==========================================
   WEATHER JOURNAL
========================================== */

function getJournalEntries() {

  return JSON.parse(
    localStorage.getItem(
      STORAGE_KEYS.JOURNAL
    )
  ) || [];
}

function saveJournalEntries(
  entries
) {

  localStorage.setItem(
    STORAGE_KEYS.JOURNAL,
    JSON.stringify(
      entries
    )
  );
}

function saveJournalEntry() {

  const textarea =
    document.getElementById(
      "journalText"
    );

  const text =
    textarea.value.trim();

  if (!text)
    return;

  const entries =
    getJournalEntries();

  entries.unshift({

    id:
      Date.now(),

    note:
      text,

    city:
      currentWeather
        ? currentWeather.name
        : "Unknown",

    temperature:
      currentWeather
        ? currentWeather.main.temp
        : "--",

    timestamp:
      new Date().toLocaleString()
  });

  saveJournalEntries(
    entries
  );

  textarea.value =
    "";

  renderJournalEntries();
}

function deleteJournalEntry(
  id
) {

  const updated =
    getJournalEntries()
      .filter(
        item =>
          item.id !== id
      );

  saveJournalEntries(
    updated
  );

  renderJournalEntries();
}

function renderJournalEntries() {

  const container =
    document.getElementById(
      "journalEntries"
    );

  if (!container)
    return;

  const entries =
    getJournalEntries();

  container.innerHTML =
    "";

  entries.forEach(
    entry => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "journal-entry";

      card.innerHTML = `
        <small>
          ${entry.timestamp}
        </small>

        <h4>
          ${entry.city}
        </h4>

        <p>
          ${entry.note}
        </p>

        <small>
          Temp:
          ${entry.temperature}°C
        </small>

        <br><br>

        <button
          class="delete-entry"
          data-id="${entry.id}"
        >
          Delete
        </button>
      `;

      container.appendChild(
        card
      );
    });

  document
    .querySelectorAll(
      ".delete-entry"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          deleteJournalEntry(
            Number(
              btn.dataset.id
            )
          );
        }
      );
    });
}

/* ==========================================
   SESSION STORAGE
========================================== */

function saveSessionCity(
  city
) {

  sessionStorage.setItem(
    "lastViewedCity",
    city
  );
}

function loadSessionCity() {

  return sessionStorage.getItem(
    "lastViewedCity"
  );
}

/* ==========================================
   OVERRIDE WEATHER FETCH
========================================== */

const originalFetchWeather =
  fetchWeatherData;

fetchWeatherData =
  async function (
    city
  ) {

    await originalFetchWeather(
      city
    );

    saveSessionCity(
      city
    );

    saveRecentSearchAdvanced(
      city
    );
  };

/* ==========================================
   JOURNAL BUTTON
========================================== */

const saveJournalBtn =
  document.getElementById(
    "saveJournal"
  );

if (
  saveJournalBtn
) {

  saveJournalBtn.addEventListener(
    "click",
    saveJournalEntry
  );
}

/* ==========================================
   EXTEND DASHBOARD
========================================== */

const dashboardRenderer =
  renderDashboard;

renderDashboard =
  function () {

    dashboardRenderer();

    injectFavoriteButton();
  };

/* ==========================================
   INITIALIZATION
========================================== */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    renderFavorites();

    renderRecentSearches();

    renderJournalEntries();

    const lastCity =
      loadSessionCity();

    if (
      lastCity
    ) {

      fetchWeatherData(
        lastCity
      );
    }
  }
);
