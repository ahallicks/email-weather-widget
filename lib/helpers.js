'use strict';

/**
 * Converts an angle (from 0 to 360 degrees) into a nice direction
 *
 * @param  {Integer} intDeg The angle to convert
 * @return {String}        The direction of the wind
 */
function degreeToDirection(intDeg)
{
	let value = parseFloat(intDeg);
	if (value <= 11.25) {
		return 'N';
	}
	value-= 11.25;
	const allDirections = ['NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
	const dIndex = parseInt(value/22.5);
	return allDirections[dIndex] ? allDirections[dIndex] : 'N';
}

/**
 * Formats the radius of each corner of a rectangle to output a rectangle
 * with rounded corners
 * @param  {Mixed} radius The radius, or object radius
 * @return {[type]}        [description]
 */
function calculateRadius(radius)
{
	if(typeof radius === 'number')
	{
		radius = {tl: radius, tr: radius, br: radius, bl: radius};
	} else {

		const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
		for(const side in defaultRadius)
		{
			radius[side] = radius[side] || defaultRadius[side];
		}

	}

	return radius;
}

module.exports = { degreeToDirection, calculateRadius };
