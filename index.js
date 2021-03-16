'use strict';

// Env vars
const dotenv = require('dotenv');
dotenv.config();

// Import packages for express
const http = require('http');

// Node internals
const path = require('path');

// Canvas details
const { createCanvas, loadImage, registerFont } = require('canvas');
const fetch = require('node-fetch');

// Default image width and height
const objDimensions = {
	mobile: {
		width: 320,
		height: 640
	},
	desktop: {
		width: 640,
		height: 408
	}
};

// Setup the express server
const express = require('express');
const useragent = require('express-useragent');
const app = express();
app.use(useragent.express());
const port = 5050;

// Used to get the current day of the week
const arrDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Register the fonts for the canvas
registerFont(path.join(__dirname, 'assets', 'Montserrat-Regular.ttf'), { family: 'Montserrat' });
registerFont(path.join(__dirname, 'assets' ,'Montserrat-Bold.ttf'), { family: 'Montserrat Bold' });

// API key and URL for weather map usage
const api = process.env.API_KEY;
const apiUrl = `https://api.openweathermap.org/data/2.5`;

// Default country
let country = 'uk';
let objCurrent = {};

// Serve the API
const httpServer = http.createServer(app);

httpServer.listen(port, () => {
	console.log('HTTP Server running on port 80');
});

// Define some positions for items that sit in the same column
const objPositions = {
	leftPane: {
		left: 25
	},
	rightPane: {
		left: 330,
		dayWidth: 70,
		mobile: {
			left: 20
		}
	}
};

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 *
 * @param {CanvasRenderingContext2D} ctx
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
function roundRect(ctx, x, y, width, height, radius = 0, fill = false, stroke = false) {

	if (typeof radius === 'number') {
		radius = {tl: radius, tr: radius, br: radius, bl: radius};
	} else {
		const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
		for (const side in defaultRadius) {
		  radius[side] = radius[side] || defaultRadius[side];
		}
	}

	ctx.beginPath();
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	ctx.closePath();

	if (fill) {
		ctx.fill();
	}

	if (stroke) {
		ctx.stroke();
	}

}

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
function addText(context, strText, objPos, strFont = '16px Montserrat', strAlign = 'left', strFill = '#fff')
{
	context.font = strFont;
	context.fillStyle = strFill;
	context.textAlign = strAlign;
	context.fillText(strText, objPos.left, objPos.top);
}

/**
 * Loads a weather icon and adds it to the canvas
 *
 * @param  {Object} context The canvas context
 * @param  {Integer} intI    When used in a loop this is the loop key
 * @param  {Object} objDay  The day information
 * @return {Promise}         Promise filfilled when the icon as been added
 */
function loadIcon(req, context, intI, objDay)
{
	return new Promise((resolve, reject) => {
		loadImage(`http://openweathermap.org/img/wn/${objDay.weather[0].icon}@2x.png`).then(image => {
			const intLeft = (intI - 1) * objPositions.rightPane.dayWidth;
			context.fillStyle = '#3838A0';
			req.useragent.isMobile ? roundRect(context, (objPositions.rightPane.mobile.left + intLeft + 10), 515, 50, 50, 10, true) : roundRect(context, (objPositions.rightPane.left + intLeft + 10), 260, 50, 50, 10, true);
			req.useragent.isMobile ? context.drawImage(image, (objPositions.rightPane.mobile.left + intLeft + 10), 515, 50, 50) : context.drawImage(image, (objPositions.rightPane.left + intLeft + 10), 260, 50, 50);
			resolve();
		}).catch(err => reject(err));
	});
}

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

function createLayout(req)
{
	let canvas;
	let context;
	if(req.useragent.isMobile)
	{

		canvas = createCanvas(objDimensions.mobile.width, objDimensions.mobile.height);
		context = canvas.getContext('2d');
		context.fillStyle = '#222831';
		roundRect(context, 4, 300, objDimensions.mobile.width - 8, 340, {
			tl: 0,
			tr: 0,
			br: 25,
			bl: 25
		}, true);

		context.fillStyle = '#5151E5';
		roundRect(context, 0, 0, objDimensions.mobile.width, 360, 25, true);

	} else {

		canvas = createCanvas(objDimensions.desktop.width, objDimensions.desktop.height);
		context = canvas.getContext('2d');

		context.fillStyle = '#222831';
		roundRect(context, 280, 4, 360, objDimensions.desktop.height - 8, {
			tl: 0,
			tr: 25,
			br: 25,
			bl: 0
		}, true);

		context.fillStyle = '#5151E5';
		roundRect(context, 0, 0, 300, objDimensions.desktop.height, 25, true);

	}

	return { canvas, context };
}

function showError(req, res, strMessage)
{
	const { canvas, context } = createLayout(req);

	const now = new Date();

	addText(context, arrDays[now.getDay()], { left: 25, top: 50}, '24px "Montserrat Bold"');
	addText(context, now.toLocaleDateString(), { left: 25, top: 75 });

	addText(context, (strMessage || `Unknown city`), { left: 25, top: 120 });

	addText(context, 'No weather data available', { left: objPositions.rightPane.left, top: 60 }, '16px "Montserrat Bold"');

	const buffer = canvas.toBuffer('image/png');

	res.contentType('png');
	res.end(buffer, 'binary');
}

app.get('/', (req, res) => {

	showError(req, res);

});

app.get('/:city/:country*?', (req, res) => {

	country = req.params.country || country;
	const apiKey = req.query.api_key || api;
	fetch(`${apiUrl}/weather?q=${req.params.city},${country}&units=metric&appid=${apiKey}`)
		.then(res => res.json())
		.then(json => {

			if(json.cod === '404')
			{
				showError(req, res, json.message);
				throw new Error();
			} else {
				objCurrent = json;
				return fetch(`${apiUrl}/onecall?lat=${json.coord.lat}&lon=${json.coord.lon}&exclude=current,minutely,hourly&units=metric&appid=${apiKey}`);
			}

		})
		.then(res => res.json())
		.then(json => {

			const { canvas, context } = createLayout(req);

			const now = new Date();

			addText(context, arrDays[now.getDay()], req.useragent.isMobile ? { left: 25, top: 40 } : { left: 25, top: 50 }, '24px "Montserrat Bold"');
			addText(context, now.toLocaleDateString(), req.useragent.isMobile ? { left: 25, top: 65 } : { left: 25, top: 75 });
			addText(context, `${objCurrent.name}, ${objCurrent.sys.country}`, req.useragent.isMobile ? { left: 25, top: 105 } : { left: 25, top: 120 });

			loadImage(`http://openweathermap.org/img/wn/${objCurrent.weather[0].icon}@2x.png`).then(image => {

				context.fillStyle = '#3838A0';
				req.useragent.isMobile ? roundRect(context, 25, 135, 100, 100, 10, true) : roundRect(context, 25, 180, 100, 100, 10, true);
				req.useragent.isMobile ? context.drawImage(image, 25, 135, 100, 100) : context.drawImage(image, 25, 180, 100, 100);

				addText(context, `${Math.round(parseFloat(objCurrent.main.temp))}°C`, req.useragent.isMobile ? { left: 25, top: 310 } : { left: 25, top: 350 }, '64px "Montserrat Bold"');
				addText(context, objCurrent.weather[0].main, req.useragent.isMobile ? { left: 25, top: 340 } : { left: 25, top: 380 });

				if(req.useragent.isMobile)
				{

					addText(context, 'FEELS LIKE', { left: objPositions.rightPane.mobile.left, top: 400 }, '16px "Montserrat Bold"');
					addText(context, `${Math.round(parseFloat(objCurrent.main.feels_like))}°C`, { left: 300, top: 400 }, '16px Montserrat', 'right');

					addText(context, 'WIND', { left: objPositions.rightPane.mobile.left, top: 440 }, '16px "Montserrat Bold"');
					addText(context, `${Math.round(parseFloat(objCurrent.wind.speed))} mph`, { left: 300, top: 440 }, '16px Montserrat', 'right');

					addText(context, 'WIND DIRECTION', { left: objPositions.rightPane.mobile.left, top: 480 }, '16px "Montserrat Bold"');
					addText(context, `${degreeToDirection(objCurrent.wind.deg)}`, { left: 300, top: 480 }, '16px Montserrat', 'right');

				} else {

					addText(context, 'FEELS LIKE', { left: objPositions.rightPane.left, top: 60 }, '16px "Montserrat Bold"');
					addText(context, `${Math.round(parseFloat(objCurrent.main.feels_like))}°C`, { left: 610, top: 60 }, '16px Montserrat', 'right');

					addText(context, 'PRESSURE', { left: objPositions.rightPane.left, top: 100 }, '16px "Montserrat Bold"');
					addText(context, objCurrent.main.pressure, { left: 610, top: 100 }, '16px Montserrat', 'right');

					addText(context, 'HUMIDITY', { left: objPositions.rightPane.left, top: 140 }, '16px "Montserrat Bold"');
					addText(context, `${objCurrent.main.humidity}%`, { left: 610, top: 140 }, '16px Montserrat', 'right');

					addText(context, 'WIND', { left: objPositions.rightPane.left, top: 180 }, '16px "Montserrat Bold"');
					addText(context, `${Math.round(parseFloat(objCurrent.wind.speed))} mph`, { left: 610, top: 180 }, '16px Montserrat', 'right');

					addText(context, 'WIND DIRECTION', { left: objPositions.rightPane.left, top: 220 }, '16px "Montserrat Bold"');
					addText(context, `${degreeToDirection(objCurrent.wind.deg)}`, { left: 610, top: 220 }, '16px Montserrat', 'right');

				}

				const arrProms = [];
				json.daily.forEach((objDay, intI) => {
					if(intI > 0 && intI < 5)
					{
						arrProms.push(loadIcon(req, context, intI, objDay));
					}
				});

				// Load all of the images
				Promise.all(arrProms).then(() => {

					json.daily.forEach((objDay, intI) => {

						if(intI > 0 && intI < 5)
						{
							const objDate = new Date(objDay.dt * 1000);
							const intLeft = (intI - 1) * objPositions.rightPane.dayWidth;
							context.fillStyle = 'rgba(255, 255, 255, 0.1)';
							if(req.useragent.isMobile)
							{
								roundRect(context, (objPositions.rightPane.mobile.left + intLeft), 505, objPositions.rightPane.dayWidth, 120, 10, true);

								addText(context, arrDays[objDate.getDay()].substring(0, 3), { left: (objPositions.rightPane.mobile.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 590 }, '16px Montserrat', 'center');
								addText(context, `${Math.round(parseFloat(objDay.temp.day))}°C`, { left: (objPositions.rightPane.mobile.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 610 }, '16px "Montserrat Bold"', 'center');
							} else {
								roundRect(context, (objPositions.rightPane.left + intLeft), 250, objPositions.rightPane.dayWidth, 120, 10, true);

								addText(context, arrDays[objDate.getDay()].substring(0, 3), { left: (objPositions.rightPane.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 335 }, '16px Montserrat', 'center');
								addText(context, `${Math.round(parseFloat(objDay.temp.day))}°C`, { left: (objPositions.rightPane.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 355 }, '16px "Montserrat Bold"', 'center');
							}
						}

					});

					/*
					// Avatar or branding here?
					loadImage('./assets/avatar.jpeg').then(image => {

						context.drawImage(image, 340, 340, 40, 40);

					}).catch(err => res.end(err));
					*/

					const buffer = canvas.toBuffer('image/png');

					res.contentType('png');
					res.end(buffer, 'binary');

				}).catch(err => showError(req, res, err));

			}).catch(err => showError(req, res, err));

		}).catch(err => {

			console.log(JSON.stringify(err, null, 4));

		});
});
