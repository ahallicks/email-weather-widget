# Email Weather Widget

A widget that returns an image that shows weather for the given location (town, country).

The output is created by using the wonderful library by [Automattic](https://automattic.com/) called [node-canvas](https://github.com/Automattic/node-canvas), which allows you to use the standard browser canvas in Node and output the resulting canvas as an image.

The image is based on the lovely design from [this Codepen](https://codepen.io/Call_in/pen/pMYGbZ). Thanks to [Colin Espinas](https://codepen.io/Call_in) for the design.

## Options

**City** (string)

The name of the city to get the weather for

**Country** (string)

The ISO 3166 country code

## Development

In order to run this locally you will need to do a few things:

 - Generate a local SSL key to use if you want it available on https. I followed [the instructions here](https://hackernoon.com/set-up-ssl-in-nodejs-and-express-using-openssl-f2529eab5bb)
 - Run `npm i`
 - RUn `npm start` or, as I like to do when working on things locally with node use `nodemon index.js` (`npm i -g nodemon`), which will live reload the index.js script when you save it

## To Do

- [ ] Move functions to external methods and add tests
- [ ] Add a background image to the left side panel
- [x] Add a forecast (if available from the API)
- [ ] Add colour options
- [ ] Add style Options
- [ ] Change the query params to proper Express parameters with fallback
- [x] Check that the image being output is transparent
- [ ] Add error checking for the passed city and country
- [ ] Add proper catch statements to return something useful and nice
- [ ] Convert all calculations/positions to a percentage/offset so that the width and height can be easily changed
- [x] Format the place name properly
- [ ] Add a nice, personal 'Hello' message
- [x] If there's an error show a proper error page
