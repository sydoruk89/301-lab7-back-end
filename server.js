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


//API routes
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', getTrails);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);


app.get('*', (request, response) => {
  response.status(404).send('This route does not exist');
});

// Location handler
function locationHandler(request, response) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
    superagent.get(url)
      .then(data => {
        const geoData = data.body;
        const location = (new Location(request.query.data, geoData));
        response.status(200).send(location);
      });
  }
  catch (error) {
    //some function or error message
    errorHandler('So sorry, something went wrong', request, response);
  }
}

// weather handler
function weatherHandler(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  // console.log('lat/long', request.query.data.latitude);
  superagent.get(url)
    .then(data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).send(weatherSummaries);
    })
    .catch(() => {
      errorHandler('Something went wrong', request, response);
    });
}

// Trails handler

function getTrails(request, response) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.TRAILS_API_KEY}`;
  // console.log('lat/long', request.query.data.latitude);
  superagent.get(url)
    .then(data => {
      const trailsSummaries = data.body.trails.map(element => {
        return new Trails(element);
      });
      response.status(200).send(trailsSummaries);
    })
    .catch(() => {
      errorHandler('Something went wrong', request, response);
    });
}

// Movies handler

function getMovies(request, response){
  const url = `https://api.themoviedb.org/3/search/movie/?api_key=${process.env.MOVIES_API_KEY}&query=${request.query.data.search_query}`;
  superagent.get(url)
    .then(data => {
      console.log(data.body.results);
      const moviesSummaries = data.body.results.slice(0, 20).map(element => {
        return new Movies(element);
      });
      response.status(200).send(moviesSummaries);
    })
    .catch(() => {
      errorHandler('Something went wrong', request, response);
    });
}

// yelp handler
function getYelp(request, response){
  const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;
  superagent.get(url).set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then(data => {
      console.log(data.body.business);
      const restaurantSummaries = data.body.businesses.slice(0, 20).map(element => {
        return new Yelp(element);
      });
      response.status(200).send(restaurantSummaries);
    })
    .catch(() => {
      errorHandler('Something went wrong', request, response);
    });
}

// error handler
function errorHandler(error, request, response) {
  response.status(500).send(error);
}

//Helper Funcitons
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

//Helper Funcitons
function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

// trails constructor
function Trails(trail){
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate.slice(0, 10);
  this.condition_time = trail.conditionDate.slice(11);
}

// movies constructor
function Movies(movie){
  this.title = movie.title;
  this.released_on = movie.release_date;
  this.total_votes = movie.vote_count;
  this.average_votes = movie.vote_average;
  this.popularity = movie.popularity;
  this.image_url = `https://image.tmdb.org/t/p/w400${movie.backdrop_path}`;
  this.overview = movie.overview;
}

// yelp constructor

function Yelp(business){
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
}
// //Ensure the server is listening for requests
// // THIS MUST BE AT THE BOTTOM OF THE FILE!!!!
app.listen(PORT, () => console.log(`The server is up, listening on ${PORT}`));
