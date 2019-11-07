'use strict';

//load Environtment Variable from the .env
require('dotenv').config();

//declare Application Dependancies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

//Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

// app.get('*', (request, response) => {
//   response.status(404).send('This route does not exist');
// });

//API routes
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);


app.get('*', (request, response) => {
  response.status(404).send('This route does not exist');
});

// Location handler
function locationHandler(request, response) {
  try{
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
    superagent.get(url)
      .then( data => {
        const geoData = data.body;
        const location = (new Location(request.query.data, geoData));
        response.status(200).send(location);
      });
  }
  catch(error){
    //some function or error message
    errorHandler('So sorry, something went wrong', request, response);
  }
}

//API routes
app.get('/weather', (request, response) => {
  try {
    const weatherArr = [];
    const darkSkyData = require('./data/darksky.json');
    darkSkyData.daily.data.forEach( day => {
      weatherArr.push(new Weather(day.summary, new Date(day.time * 1000).toString().slice(0, 15)));
    });
    response.send(weatherArr);
  }
  catch (error) {
    //some function or error message
    errorHandler('So sorry, something went wrong', request, response);
  }
});

//Helper Funcitons
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

//Helper Funcitons
function Weather(forecast, time) {
  this.forecast = forecast;
  this.time = time;
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}



// //Ensure the server is listening for requests
// // THIS MUST BE AT THE BOTTOM OF THE FILE!!!!
app.listen(PORT, () => console.log(`The server is up, listening on ${PORT}`));
