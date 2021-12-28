const express = require('express');

//Destructuring for readability
const {
    httpGetAllPlanets,
} = require('./planets.controller');

const planetRouter = express.Router();

planetRouter.get('/', httpGetAllPlanets);



module.exports = planetRouter;