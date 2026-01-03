const unitsMenu = document.getElementById("units-menu");
const forecastMenu = document.getElementById("forecast-menu");
const unitsToggle = document.getElementById("units--toggle");
const forecastToggle = document.getElementById("forecast-toggle");
const allMenus = document.querySelectorAll("ul");
const unitsItems = unitsMenu.querySelectorAll("li");
const forecastItems = forecastMenu.querySelectorAll("li");
const forecastDay = document.getElementById("day-text");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const searchResultMenu = document.getElementById("search-result-menu");
const cityText = document.getElementById("city-text");
const currentTempText = document.getElementById("current-temp");
const currentTempImg = document.getElementById("cur-temp-img");
const currentDateText = document.getElementById("current-date");
const currentFeelsLike = document.getElementById("feels-like");
const currentHumidity = document.getElementById("humidity");
const currentWindSpeed = document.getElementById("wind");
const currentPrecipitation = document.getElementById("precipitation");
const dailyForecastCardsWrapper = document.getElementById(
  "daily-forecast-cards-container"
);
const hourlyCardsContainer = document.getElementById("hourly-cards-wrapper");

const loader = document.getElementById("load");
const hidingContent = document.getElementById("hiding-content");

let currentWeatherData = null;
let cityName = "";
let timeZoneState = "";
let mph = 0;
const date = new Date();
const days = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

let todayIndex = date.getDay();
let selectedDay = days[todayIndex];
forecastDay.textContent = selectedDay;

const weatherCode = {
  0: "sunny.webp",
  1: "partly-cloudy.webp",
  2: "partly-cloudy.webp",
  3: "partly-cloudy.webp",
  45: "fog.webp",
  48: "fog.webp",
  51: "drizzle.webp",
  53: "drizzle.webp",
  55: "drizzle.webp",
  56: "drizzle.webp",
  57: "drizzle.webp",
  61: "rain.webp",
  63: "rain.webp",
  65: "rain.webp",
  66: "rain.webp",
  67: "rain.webp",
  71: "snow.webp",
  73: "snow.webp",
  75: "snow.webp",
  77: "snow.webp",
  80: "rain.webp",
  81: "rain.webp",
  82: "rain.webp",
  85: "snow.webp",
  86: "snow.webp",
  95: "storm.webp",
  96: "storm.webp",
  99: "storm.webp",
};

const unitsActions = {
  Celsius: () => updateTempUnit("c"),
  Fahrenheit: () => updateTempUnit("f"),
  "km/h": () => updateWindSpeedUnit("km/h"),
  mph: () => updateWindSpeedUnit("mph"),
  Millimeters: () => updatePrecipitationUnit("mm"),
  Inches: () => updatePrecipitationUnit("in"),
};

// Toggle Dropdown Lists Function
const toggleMenu = (menu, visibilityClass) => {
  allMenus.forEach((m) => {
    if (m !== menu) {
      m.classList.add(visibilityClass);
    }
  });
  menu.classList.toggle(visibilityClass);
};

// Shows Loader Before Getting Data
function showLoader() {
  hidingContent.classList.remove("hide");
  currentTempImg.classList.add("hidden");
}

// Hides Loader After Getting Data
function hideLoader() {
  hidingContent.classList.add("hide");
  currentTempImg.classList.remove("hidden");
}

// Getting Weather Data From API

async function getWeather(lat, lon) {
  showLoader();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,weather_code&current=apparent_temperature,temperature_2m,relative_humidity_2m,rain,precipitation,wind_speed_10m,weather_code&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.log(Error("Couldn't get data"), err);
  } finally {
    hideLoader();
  }
}

// Getting City Coordinates From API

async function getCityCoordinates(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=10&language=en&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.results) throw new Error("City Not Found");
  console.log(data.results);
  return data.results;
}

// Getting City Name From TimeZone

function getCityByTimeZone(timezone) {
  if (!timezone) return "Your Location";

  const capitalCity = timezone.split("/");
  return capitalCity[1]?.replace("_", " ") || "Your Location";
}

// Getting Country Name From TimeZone

function getCountryByTimeZone(timezone) {
  if (!timezone) return "Your Location";

  const capitalCity = timezone.split("/");
  return capitalCity[0]?.replace("_", " ") || "Your Location";
}

// Getting On Load Location Coordinates

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation is not supported");
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

// Getting Time From TimeZone From API

function getTimeByTimeZone(timezone) {
  const options = {
    timeZone: timezone,
    weekday: "long",
    hour12: false,
    year: "numeric",
    month: "short",
    day: "2-digit",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

// Get Local Day String Based On Timezone

function getLocalDayKey(dateString, timezone) {
  const date = new Date(dateString);

  const localDayString = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  }).format(date);

  return localDayString;
}

// Render Hourly Forecast (The Function That Took More Time From Me More Than Anything Else In This Practice)

function updateHourlyForecast(currentWeatherData, timezone, selectedDayIndex) {
  if (!currentWeatherData?.timezone) return;
  hourlyCardsContainer.innerHTML = "";
  const totalDays = 7;
  todayIndex = new Date().getDay();

  // Counts The Steps Between Chosen Day And Today
  const steps =
    selectedDayIndex >= todayIndex
      ? selectedDayIndex - todayIndex
      : totalDays - todayIndex + selectedDayIndex;

  // Gets The Target Day Name
  const targetDayName = days[(todayIndex + steps) % 7];

  for (let i = 0; i < currentWeatherData.hourly.time.length; i++) {
    const dateStr = currentWeatherData.hourly.time[i];
    const localDay = getLocalDayKey(dateStr, timezone);
    if (localDay !== targetDayName) continue;

    const localHour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      }).format(new Date(dateStr))
    );

    if (localHour >= 15 && localHour <= 22) {
      const hourText = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: true,
      }).format(new Date(dateStr));

      const divCard = document.createElement("div");
      const divHour = document.createElement("div");
      const image = document.createElement("img");
      const spanHour = document.createElement("span");
      const divTemp = document.createElement("div");

      divCard.classList.add("hour-info-card");
      divHour.classList.add("hour", "flex");
      image.classList.add("small-img");
      image.src = `images/icon-${
        weatherCode[currentWeatherData.hourly.weather_code[i]]
      }`;
      image.alt = "Weather Condition";
      divTemp.classList.add("hourly-temp", "temperature_unit");

      spanHour.textContent = hourText;
      divTemp.textContent = `${Math.round(
        currentWeatherData.hourly.temperature_2m[i]
      )}°`;

      divCard.appendChild(divHour);
      divCard.appendChild(divTemp);
      divHour.appendChild(image);
      divHour.appendChild(spanHour);
      hourlyCardsContainer.appendChild(divCard);
    }
  }
  casheBaseTemps();
}

// Render Fetched Data

function updateUI(cityData, weatherData) {
  // City Name And Date
  cityText.textContent = `${cityData.name}, ${cityData.country}`;
  currentDateText.textContent = getTimeByTimeZone();
  // Current Temperature
  const currentTemp = `${Math.round(weatherData.current.temperature_2m)}°`;
  currentTempText.textContent = currentTemp;

  currentTempImg.src = `images/icon-${
    weatherCode[weatherData.current.weather_code]
  }`;
  currentTempText.before(currentTempImg);
  // Weather Data Cards (Feels Like, Humidity %, Wind Speed km/h, Precipitation mm)
  const currentApparentTemp = Math.round(
    weatherData.current.apparent_temperature
  );
  currentFeelsLike.textContent = `${currentApparentTemp}°`;
  currentHumidity.textContent = `${weatherData.current.relative_humidity_2m}%`;
  const windSpeed = Math.round(weatherData.current.wind_speed_10m);
  currentWindSpeed.textContent = `${windSpeed} km/h`;
  currentPrecipitation.textContent = `${weatherData.current.precipitation} mm`;
  // Max And Min Temperature For The Next 7 Days
  const dateArray = weatherData.daily.time;
  dailyForecastCardsWrapper.innerHTML = "";
  for (let i = 0; i < dateArray.length; i++) {
    const dateMaxMin = new Date(dateArray[i]);
    const dayName = days[dateMaxMin.getDay()].slice(0, 3);
    const divCard = document.createElement("div");
    const h4DayName = document.createElement("h4");
    const imgWeather = document.createElement("img");
    const divMaxMin = document.createElement("div");
    const pMax = document.createElement("p");
    const pMin = document.createElement("p");

    divCard.classList.add("temp-card", "temp-card-forecast");
    h4DayName.classList.add("h4-day");
    imgWeather.classList.add("mid-img");
    divMaxMin.classList.add("temp-card-max-min");
    pMax.classList.add("max-temp", "temperature_unit");
    pMin.classList.add("min-temp", "temperature_unit");

    // Adding Text Content To Daily Forecast (Max, Min) Cards
    h4DayName.textContent = `${dayName}`;

    const imageSrc = weatherCode[weatherData.daily.weather_code[i]];
    imgWeather.src = `images/icon-${imageSrc}`;
    imgWeather.alt = "weather condition";

    pMax.textContent = Math.round(weatherData.daily.temperature_2m_max[i]);
    pMin.textContent = Math.round(weatherData.daily.temperature_2m_min[i]);

    // Appending Cards

    divMaxMin.appendChild(pMax);
    divMaxMin.appendChild(pMin);
    divCard.appendChild(h4DayName);
    divCard.appendChild(imgWeather);
    divCard.appendChild(divMaxMin);
    dailyForecastCardsWrapper.appendChild(divCard);
  }
  // Hourly Forecast (Show 8 Hours Of The Chosen Day From 3PM To 10PM)
  if (cityData.timezone) {
    updateHourlyForecast(weatherData, cityData.timezone, todayIndex);
  }

  casheBaseTemps();
  casheBasePrecipitation();
}

// Setting Dataset For Celsius Value Gotten From API
function casheBaseTemps() {
  document.querySelectorAll(".temperature_unit").forEach((el) => {
    el.dataset.celsius = parseInt(el.textContent);
  });
}

function casheBasePrecipitation() {
  currentPrecipitation.dataset.mm = parseInt(currentPrecipitation.textContent);
}

// Changing Temp Unit

function updateTempUnit(unit) {
  if (!currentWeatherData) return;
  const allTempElements = document.querySelectorAll(".temperature_unit");

  allTempElements.forEach((el) => {
    const celsius = parseInt(el.dataset.celsius);
    if (unit === "f") {
      el.textContent = `${Math.round(celsius * 1.8 + 32)}°`;
    } else {
      el.textContent = `${Math.round(celsius)}°`;
    }
  });
}

// Changing Wind Speed Unit
function updateWindSpeedUnit(unit) {
  if (!currentWeatherData) return;
  if (unit === "mph") {
    mph = currentWeatherData.current.wind_speed_10m / 1.609;
    currentWindSpeed.textContent = `${Math.round(mph)} mph`;
  } else if (unit === "km/h") {
    currentWindSpeed.textContent = `${Math.round(mph * 1.609)} km/h`;
    console.log(mph * 1.609);
  }
}

function updatePrecipitationUnit(unit) {
  if (!currentWeatherData) return;
  const mm = currentPrecipitation.dataset.mm;
  if (unit === "in") {
    currentPrecipitation.textContent = `${mm / 25.4} in`;
  } else if (unit === "mm") {
    currentPrecipitation.textContent = `${mm} mm`;
  }
}

// Getting User Location On Load

window.addEventListener("load", async () => {
  try {
    const { lat, lon } = await getUserLocation();

    const weatherData = await getWeather(lat, lon);
    currentWeatherData = weatherData;

    const cityData = {
      name: getCityByTimeZone(weatherData.timezone),
      country: getCountryByTimeZone(weatherData.timezone),
      timezone: weatherData.timezone,
    };

    timeZoneState = weatherData.timezone;

    updateUI(cityData, weatherData);

    const todayIndex = new Date().getDay();
    if (!timeZoneState) return;
    updateHourlyForecast(currentWeatherData, timeZoneState, todayIndex);
  } catch (err) {
    console.log("Location access denied", err);
  }
});

// Click Outsite The Menu to Hide Menu

window.addEventListener("click", (e) => {
  if (!unitsMenu.contains(e.target)) {
    unitsMenu.classList.add("hidden");
  }
  // Click Outsite The Menu Or On Any Element Inside The Menu to Hide It
  forecastMenu.classList.add("hidden");
});

// Toggle Units List

unitsToggle.addEventListener("click", (e) => {
  toggleMenu(unitsMenu, "hidden");
  e.stopPropagation();
});

// Toggle Forecast List

forecastToggle.addEventListener("click", (e) => {
  toggleMenu(forecastMenu, "hidden");
  e.stopPropagation();
});

// Changing Selected Item Depending On dataset-group For (Units Menu)

unitsItems.forEach((item) => {
  const groupName = item.dataset.group;

  item.addEventListener("click", () => {
    unitsItems.forEach((li) => {
      if (li.dataset.group === groupName) {
        li.classList.remove("selected");
      }
    });

    item.classList.add("selected");
    const action = unitsActions[item.textContent];
    if (action) action();
  });
});

// Search Feature

searchBtn.addEventListener("click", async () => {
  if (!currentWeatherData) return;
  cityName = searchInput.value.trim();
  if (!cityName) return;

  try {
    const citiesData = await getCityCoordinates(cityName);
    const cityData = citiesData[0];
    const weatherData = await getWeather(cityData.latitude, cityData.longitude);
    console.log(cityData);
    console.log(weatherData);

    currentWeatherData = weatherData;
    timeZoneState = cityData.timezone;
    updateUI(cityData, weatherData);
    getTimeByTimeZone(cityData.timezone);
  } catch (err) {
    console.log(Error("error"), err);
    cityText.textContent = "";
  }
});

forecastItems.forEach((item) => {
  if (forecastDay.textContent === item.textContent) {
    item.style.backgroundColor = "var(--btn-hover-bg)";
  }

  item.addEventListener("click", () => {
    selectedDay = item.textContent;
    forecastDay.textContent = selectedDay;
    forecastItems.forEach((li) => {
      li.style.backgroundColor = "";
    });

    item.style.backgroundColor = "var(--btn-hover-bg)";

    const selectedDayIndex = Object.keys(days).find(
      (key) => days[key] === selectedDay
    );
    updateHourlyForecast(currentWeatherData, timeZoneState, selectedDayIndex);
  });
});

searchInput.addEventListener("input", async () => {
  let query = searchInput.value.trim().toLowerCase();
  searchResultMenu.innerHTML = "";
  if (query.length < 2) return;
  let allCities = await getCityCoordinates(query);
  let filteredCities = allCities.filter(
    (address) =>
      address.name.trim().toLowerCase().startsWith(query) ||
      address.country.trim().toLowerCase().startsWith(query)
  );
  console.log(filteredCities);
  filteredCities.forEach((address) => {
    let li = document.createElement("li");
    li.textContent = `${address.name}, ${address.country}`;
    searchResultMenu.appendChild(li);
    li.addEventListener("click", () => {
      searchInput.value = li.textContent;
      searchResultMenu.innerHTML = "";
    });
  });

  // for (let i = 0; i < 6; i++) {
  //   let li = document.createElement("li");
  //   li.textContent = `${filteredCities[i].name}, ${filteredCities[i].country}`;
  //   searchResultMenu.appendChild(li);
  //   console.log(filteredCities[i]);
  //   li.addEventListener("click", () => {
  //     searchInput.value = li.textContent;
  //     searchResultMenu.innerHTML = "";
  //   });
  // }
});
