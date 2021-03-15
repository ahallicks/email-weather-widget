# Email Weather Widget

A widget that returns an image that shows weather for the given location (town, country).

The output is created by using the wonderful library by [Automattic](https://automattic.com/) called [node-canvas](https://github.com/Automattic/node-canvas), which allows you to use the standard browser canvas in Node and output the resulting canvas as an image.

The image uses the lovely design from [this Codepen](https://codepen.io/Call_in/pen/pMYGbZ) as much as possible (though, forecast isn't done yet). Thanks to [Colin Espinas](https://codepen.io/Call_in) for the design.

## Options

## To Do

- [ ] Add a background image to the left side panel
- [x] Add a forecast (if available from the API)
- [ ] Add colour options
- [ ] Add style Options
- [ ] Change the query params to proper Express parameters with fallback
- [x] Check that the image being output is transparent
- [ ] Add error checking for the passed city and country
- [ ] Add proper catch statements to return something useful and nice
- [ ] Convert all calculations/positions to a percentage/offset so that the width and height can be easily changed
