'use strict';

const { createCanvas, loadImage } = require('canvas');
const { objColours, objPositions, objDimensions } = require('./config');
const { calculateRadius } = require('./helpers');

/**
 * Create the layout (including backgrounds and sections) based on the
 * user agent string from the request. Mobile is stacked, basically.
 *
 * @param  {Object} req Express rewquest parameters
 * @return {Object}     The created canvas and context
 */
function createLayout(req)
{
	let canvas;
	let context;
	if(req.useragent.isMobile)
	{

		canvas = createCanvas(objDimensions.mobile.width, objDimensions.mobile.height);
		context = canvas.getContext('2d');
		context.fillStyle = objColours.dark;
		roundRect(context, 4, 300, objDimensions.mobile.width - 8, 340, {
			tl: 0,
			tr: 0,
			br: 25,
			bl: 25
		}, true);

		context.fillStyle = objColours.primary;
		roundRect(context, 0, 0, objDimensions.mobile.width, 360, 25, true);

	} else {

		canvas = createCanvas(objDimensions.desktop.width, objDimensions.desktop.height);
		context = canvas.getContext('2d');

		context.fillStyle = objColours.dark;
		roundRect(context, 280, 4, 360, objDimensions.desktop.height - 8, {
			tl: 0,
			tr: 25,
			br: 25,
			bl: 0
		}, true);

/*
		// Create a linear gradient
		// The start gradient point is at x=20, y=0
		// The end gradient point is at x=220, y=0
		const gradient = context.createLinearGradient(0, objDimensions.desktop.height, 300, objDimensions.desktop.height);

		// Add three color stops
		gradient.addColorStop(0, 'rgba(81, 81, 229, 1)');
		gradient.addColorStop(1, 'rgba(114, 237, 242, 1)');

		// Set the fill style and draw a rectangle
		context.fillStyle = gradient;
*/

		context.fillStyle = objColours.primary;
		roundRect(context, 0, 0, 300, objDimensions.desktop.height, 25, true);

	}

	return { canvas, context };
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
const roundRect = (context, x, y, width, height, radius = 0, fill = false, stroke = false) => {

	radius = calculateRadius(radius);

	context.beginPath();
	context.moveTo(x + radius.tl, y);
	context.lineTo(x + width - radius.tr, y);
	context.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	context.lineTo(x + width, y + height - radius.br);
	context.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	context.lineTo(x + radius.bl, y + height);
	context.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	context.lineTo(x, y + radius.tl);
	context.quadraticCurveTo(x, y, x + radius.tl, y);
	context.closePath();

	if (fill) {
		context.fill();
	}

	if (stroke) {
		context.stroke();
	}

};

/**
 * Add a text layer to the canvas
 *
 * @param {Object} context           The canvas 2D context
 * @param {String} strText           The text to put on the canvas
 * @param {Object} objPos            left and top positions for the text
 * @param {String} [strFont='16px    Montserrat']  The font to use
 * @param {String} [strAlign='left'] Text alignment (left or right)
 * @param {String} [strFill='#fff']  Fill text colour
 */
const addText = (context, strText, objPos, strFont = '16px Montserrat', strAlign = 'left', strFill = '#fff') => {
	context.font = strFont;
	context.fillStyle = strFill;
	context.textAlign = strAlign;
	context.fillText(strText, objPos.left, objPos.top);
};

/**
 * Loads a weather icon and adds it to the canvas
 *
 * @param  {Object} req 	Express rewquest parameters
 * @param  {Object} context The canvas context
 * @param  {Integer} intI   When used in a loop this is the loop key
 * @param  {Object} objDay  The day information
 * @return {Promise}        Promise filfilled when the icon as been added
 */
const loadIcon = (req, context, intI, objDay) => {
	return new Promise((resolve, reject) => {
		loadImage(`http://openweathermap.org/img/wn/${objDay.weather[0].icon}@2x.png`).then(image => {
			const intLeft = (intI - 1) * objPositions.rightPane.dayWidth;
			context.strokeStyle = objColours.black;
			context.fillStyle = objColours.grey;
			req.useragent.isMobile ? roundRect(context, (objPositions.rightPane.mobile.left + intLeft + 10), 515, 50, 50, 8, true, true) : roundRect(context, (objPositions.rightPane.left + intLeft + 10), 260, 50, 50, 8, true, true);
			req.useragent.isMobile ? context.drawImage(image, (objPositions.rightPane.mobile.left + intLeft + 10), 515, 50, 50) : context.drawImage(image, (objPositions.rightPane.left + intLeft + 10), 260, 50, 50);
			resolve();
		}).catch(err => reject(err));
	});
};

module.exports = { createLayout, roundRect, addText, loadIcon };
