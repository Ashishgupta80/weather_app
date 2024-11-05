//this is my api key from open weather map api i am putting it here so that i dont have to write it again and again
const API_KEY = "b279a0e85e73dea536bee47fb8e9b6ce";

//this is the function that will be called when we will be submitting our form
function submitForm(event) {
  event.preventDefault();
  document.getElementById("loading").style = "display:block";
  //console.log(event.target);
  const formData = new FormData(event.target);
  for (let [key, value] of formData.entries()) {
    //console.log(key, value);
    //get data from fetchData
    getFetchData(value);
    // storing recently searched cities in the localstorage
    addHistory(value);
  }
  //display history dropdown arrow
  document.querySelector(".history_dropdown").style = "display:block";
  //call all the history last 5
  getHistory();
  event.target.reset();
}

//this is function i used to implement the functionality of adding history of your cities entered
function addHistory(value) {
  let search_history = localStorage.getItem("searched_cities");
  if (!search_history) {
    search_history = [];
    search_history.unshift(value);
  } else {
    search_history = JSON.parse(search_history);
    // console.log("search_history::", search_history, " ", typeof search_history);
    search_history.unshift(value);
    if (search_history.length > 5) {
      search_history.pop();
    }
  }
  localStorage.setItem("searched_cities", JSON.stringify(search_history));
}

function getFetchData(value, lat, lon) {
  fetchData(value, lat, lon)
    .then((data) => {
      if (data) {
        //working with marker on map

        marker_on_map(
          { lat: data.coord.lat, lng: data.coord.lon },
          data.coord.lat,
          data.coord.lon,
          data.name
        );

        //call run_fetchData i am not directly getting the data over her because i need to run it again in case of
        //use current location.
        run_fetchData(data);
        //call run_forecast data i am not directly getting the data over her because i need to run it again in case of
        //use current location.

        run_forecastData(data.coord.lat, data.coord.lon);
      }
    })
    .catch((err) => {
      console.log(err);
      alert(err);
    });
}

//hitting the forecast api for five days weather forecast
async function forecastData(lat, lon) {
  try {
    //console.log("working", lat, " ", lon);
    let res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    let result = await res.json();
    return new Promise((resolve, reject) => {
      if (result) {
        resolve(result);
      } else {
        reject("Unable to fetch data.");
      }
    });
  } catch (err) {
    console.log(err);
    alert(err);
  }
}

//fetching cuurent weather condition for the city
async function fetchData(city, lat, lon) {
  //console.log("city::", city);
  if (city && !lat && !lon) {
    try {
      let res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${API_KEY}`
      );
      if (!res.ok) {
        if (res.status == "404") {
          document.querySelector(".right-side").style = "display:none";
          document.getElementById("loading").style = "display:none";
          document.querySelector(".errors").style = "display:block";
        } else throw new Error("Network response was not ok");
      }
      let result = await res.json();
      return new Promise((resolve, reject) => {
        if (result) {
          resolve(result);
        } else {
          reject("Unable to fetch data.");
        }
      });
    } catch (err) {
      console.log(err);
      alert(err);
    }
  } else if (lat && lon && !city) {
    try {
      let res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      if (!res.ok) {
        if (res.status == "404") {
          document.querySelector(".right-side").style = "display:none";
          document.getElementById("loading").style = "display:none";
          document.querySelector(".errors").style = "display:block";
        } else throw new Error("Network response was not ok");
      }
      let result = await res.json();
      return new Promise((resolve, reject) => {
        if (result) {
          resolve(result);
        } else {
          reject("Unable to fetch data.");
        }
      });
    } catch (err) {
      console.log(err);
      alert(err);
    }
  }
}

function run_fetchData(data) {
  //this is our current date.
  let date = new Date();
  date =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) +
    "-" +
    (date.getDate() < 10 ? "0" + date.getDate() : date.getDate());

  //in data we are getting the current weather data according to the city we searched.
  // console.log("data for city::", data);
  document.querySelector("p").style = "display:none";
  document.querySelector(".city-name").innerHTML = `${data.name}`;
  //placing the current weather values on the screen
  document.querySelector(".right-side").style = "display:block";
  document.querySelector(".up-left").style = "display:block";
  document.querySelector(".up-right").style = "display:block";
  document.querySelector(".errors").style = "display:none";
  document.querySelector(".first_time").style = "display:none";
  document.querySelector(".errors_forecast").style = "display:none";
  document.querySelector(".date").innerHTML = "(" + date + ")";
  document.querySelector("#temp").innerHTML = `${(data.main.temp - 273.15) //converting kelvivn to celcius
    .toFixed(2)}`;
  document.querySelector("#humidity").innerHTML = `${data.main.humidity.toFixed(
    2
  )}`;
  document.querySelector("#wind").innerHTML = `${data.wind.speed.toFixed(2)}`;
  document.querySelector(
    "#temp-des"
  ).innerHTML = `${data.weather[0].description}`;
  document.querySelector(
    "#weather-img"
  ).src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function run_forecastData(lat, lon) {
  //removing prev data before getitng new data.
  if (document.querySelector("tr").firstElementChild) {
    document.querySelector("tr").remove();
    let new_tr_element = document.createElement("tr");
    let tbody_element = document.querySelector("tbody");
    tbody_element.appendChild(new_tr_element);
  }
  forecastData(lat, lon)
    .then((forecast_data) => {
      // console.log("forcecast data::", forecast_data);

      //for the five day weather forcast data i will go for a more reuseable code approach than rather
      //just simply checking all the other five consecutive dates filter them out one by one and then
      //displaying them same as the main one that can be done but thats not a good approach we will make
      //our code resuable by creating the elmenent and appending them i loop so it automatically creates.
      //5 elements with diffrent data and display them.

      let new_date = new Date();

      for (let i = 1; i <= 5; i++) {
        let search_date =
          new_date.getFullYear() +
          "-" +
          (new_date.getMonth() + 1 < 10
            ? "0" + (new_date.getMonth() + 1)
            : new_date.getMonth() + 1) +
          "-" +
          (new_date.getDate() + i < 10
            ? "0" + (new_date.getDate() + i)
            : new_date.getDate() + i);
        //console.log("search_date::", search_date);
        let filtered_forecast_data = forecast_data.list.filter(
          (weather) => weather.dt_txt.split(" ")[0] === search_date
        );
        // console.log(filtered_forecast_data);
        //making the first filtered data out of 4 consecutive 3 hrs time frame data of the present date as the main temp of the present date for the particular location.
        if (filtered_forecast_data) {
          let td_element = document.createElement("td");
          let span_element = document.createElement("span");
          span_element.innerHTML =
            filtered_forecast_data[0].dt_txt.split(" ")[0];
          td_element.appendChild(span_element);
          let div_element = document.createElement("div");
          //paragraph for weather description
          let para0 = document.createElement("p");
          para0.innerHTML = filtered_forecast_data[0].weather[0].description;
          para0.style = "text-align:end";
          div_element.appendChild(para0);
          let img_element = document.createElement("img");
          img_element.src = `https://openweathermap.org/img/wn/${filtered_forecast_data[0].weather[0].icon}@2x.png`;
          div_element.appendChild(img_element);
          td_element.appendChild(div_element);
          //paragraph for temprature.
          let para1 = document.createElement("p");
          let span_element2 = document.createElement("span");
          span_element2.innerHTML =
            "<i class='fa-solid fa-temperature-three-quarters'></i>&nbsp;Temprature : ";
          para1.appendChild(span_element2);
          let span_element3 = document.createElement("span");
          span_element3.innerHTML = (
            filtered_forecast_data[0].main.temp - 273.15
          ).toFixed(2);
          para1.appendChild(span_element3);
          let span_element4 = document.createElement("span");
          span_element4.innerHTML = "&#8451;";
          para1.appendChild(span_element4);
          td_element.appendChild(para1);
          //paragraph for Wind.
          let para2 = document.createElement("p");
          let span_element2b = document.createElement("span");
          span_element2b.innerHTML =
            "<i class='fa-solid fa-wind'></i>&nbsp;Wind : ";
          para2.appendChild(span_element2b);
          let span_element3b = document.createElement("span");
          span_element3b.innerHTML =
            filtered_forecast_data[0].wind.speed.toFixed(2);
          para2.appendChild(span_element3b);
          let span_element4b = document.createElement("span");
          span_element4b.innerHTML = "M/S";
          para2.appendChild(span_element4b);
          td_element.appendChild(para2);
          //paragraph for Humidity.
          let para3 = document.createElement("p");
          let span_element2c = document.createElement("span");
          span_element2c.innerHTML =
            "<i class='fa-solid fa-droplet'></i>&nbsp;Humidity : ";
          para3.appendChild(span_element2c);
          let span_element3c = document.createElement("span");
          span_element3c.innerHTML =
            filtered_forecast_data[0].main.humidity.toFixed(2);
          para3.appendChild(span_element3c);
          let span_element4c = document.createElement("span");
          span_element4c.innerHTML = "%";
          para3.appendChild(span_element4c);
          td_element.appendChild(para3);
          //append the td element in the tr element
          let tr_element = document.querySelector("tr");
          tr_element.appendChild(td_element);
        }
      }
    })
    .catch((err) => {
      console.log(err);
      alert(err);
    });
}

//get all the cites
fetch("https://countriesnow.space/api/v0.1/countries")
  .then((response) => response.json())
  .then((result) => {
    for (let data of result.data) {
      for (let city of data.cities) {
        //console.log(city);
        let datalist_element = document.getElementById("cities");
        let option_element = document.createElement("option");
        option_element.textContent = city;
        datalist_element.appendChild(option_element);
      }
    }
  });

//function for get history of the latest function.
function getHistory() {
  let search_history = localStorage.getItem("searched_cities");
  if (search_history) {
    search_history = JSON.parse(search_history);
    if (document.querySelector("ul")) {
      document.querySelector("ul").remove();
    }
    let ul_element = document.createElement("ul");
    let li_head_element = document.createElement("li");
    li_head_element.textContent = "Recent Searches";
    li_head_element.id = "history_head";
    ul_element.appendChild(li_head_element);
    let search_history_element = document.querySelector(".search_history");
    for (let search of search_history) {
      let li_element = document.createElement("li");
      li_element.classList.add("searched_history_city");
      li_element.textContent = search;
      //providing functionality to the list element when we click on any recent search city its weather and forecast should be displayed.
      li_element.addEventListener("click", function (event) {
        let clicked_city = event.target.textContent;
        const regex = /"lat":/;
        let match = clicked_city.match(regex);
        if (match) {
          clicked_city = JSON.parse(clicked_city);
          // console.log("clicked city::", clicked_city);
          getFetchData(undefined, clicked_city.lat, clicked_city.lon);
        } else {
          getFetchData(clicked_city);
        }
      });

      ul_element.appendChild(li_element);
    }
    search_history_element.appendChild(ul_element);
  } else {
    document.querySelector(".search_history").style = "display:none";
  }
}
//if there is nothing in localstorage ie history is empty then dont display the dropdown for history else display history dropdown.
if (!localStorage.getItem("searched_cities")) {
  document.querySelector(".history_dropdown").style = "display:none";
} else {
  document.querySelector(".history_dropdown").style = "display:block";
}
//toggle history
function toggle_history(event) {
  let toggle_icon = event.target.classList[1];
  getHistory();
  if (toggle_icon == "fa-caret-down") {
    event.target.classList = " fa-solid fa-caret-up";
    document.querySelector(".search_history").style = "display:block";
  } else {
    event.target.classList = " fa-solid fa-caret-down";
    document.querySelector(".search_history").style = "display:none";
  }
}

//get user current location
function getLocation() {
  let err_elem = document.querySelector(".err_use_current_location");
  if (navigator.geolocation) {
    err_elem.style = "display:none";
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    err_elem.textContent = "Geolocation is not supported by this browser.";
    err_elem.style = "display:block";
  }
}

function showPosition(position) {
  // console.log(
  //   "Latitude: " +
  //     position.coords.latitude +
  //     "Longitude: " +
  //     position.coords.longitude
  // );

  //now you have the latitude and longitude of the current location now use
  //run_forecastData function to get the forecast of the next 5 days.
  addHistory(
    JSON.stringify({
      lat: position.coords.latitude.toFixed(2),
      lon: position.coords.longitude.toFixed(2),
    })
  );
  getHistory();
  getFetchData(undefined, position.coords.latitude, position.coords.longitude);
  //display history dropdown arrow
  document.querySelector(".history_dropdown").style = "display:block";
  //get all the history last 5.
  getHistory();
}

//Note : I'm not using Google map api because ot asks for a biller account.

//script for implementing open street map

//making london as the default loacation on map.
var map = L.map("map").setView([51.5085, -0.1257], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>contributors',
}).addTo(map);

var marker; // Declare a variable to store the marker , i am placing it here for a better understanding but it can
//be used anywhere in the code by the concept of hoisting.

map.on("click", function (e) {
  addHistory(
    JSON.stringify({
      lat: e.latlng.lat.toFixed(2),
      lon: e.latlng.lng.toFixed(2),
    })
  );
  getHistory();
  getFetchData(undefined, e.latlng.lat, e.latlng.lng);
  //display history dropdown arrow
  document.querySelector(".history_dropdown").style = "display:block";
  getHistory();
});

//implementing marker on map i am making it as a function sos that i can reuse it again.
function marker_on_map(latlng, latitude, longitude, city_name) {
  // Remove any existing marker
  //Note map is a globla variable as declared var
  if (marker) {
    map.removeLayer(marker);
  }

  // Create a new marker at the clicked location
  marker = L.marker(latlng).addTo(map);

  // Add a popup to the marker with the coordinates
  marker
    .bindPopup(
      (city_name ? city_name + ", " : "") +
        "Latitude: " +
        latitude.toFixed(3) +
        ", Longitude: " +
        longitude.toFixed(3)
    )
    .openPopup();

  // console.log("Latitude:", latitude);
  // console.log("Longitude:", longitude);
}
