'use strict';

// Env vars
const dotenv = require('dotenv');
dotenv.config();

// Import packages for express
const http = require('http');
const https = require('https');
const fs = require('fs');

// Canvas details
const { createCanvas, loadImage, registerFont } = require('canvas');
const fetch = require('node-fetch');

const api = process.env.API_KEY;

// Default image width and height
const width = 640;
const height = 408;

// Setup the express server
const express = require('express');
const app = express();
const port = 3000;

// Used to get the current day of the week
const arrDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Register the fonts for the canvas
registerFont('./assets/Montserrat-Regular.ttf', { family: 'Montserrat' });
registerFont('./assets/Montserrat-Bold.ttf', { family: 'Montserrat Bold' });

// Default country
let country = 'uk';

// Serve the API with signed certificate on 443 (SSL/HTTPS) port
const httpServer = http.createServer(app);
const httpsServer = https.createServer({
	key: fs.readFileSync(__dirname + '/key.pem'),
	cert: fs.readFileSync(__dirname + '/cert.pem'),
	requestCert: false,
	rejectUnauthorized: false,
	passphrase: process.env.SSL_PASSWORD
}, app);

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

httpServer.listen(port, () => {
    console.log('HTTP Server running on port 80');
});

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

app.get('/', (req, res) => {

	country = req.query.country || country;
	const apiKey = req.query.api_key || api;
	fetch(`https://api.openweathermap.org/data/2.5/weather?q=${req.query.city},${country}&units=metric&appid=${apiKey}`)
		.then(res => res.json())
    	.then(json => {

			const canvas = createCanvas(width, height);
			const context = canvas.getContext('2d');

			const now = new Date();

			context.fillStyle = '#222831';
			roundRect(context, 280, 4, 360, height - 8, {
				tl: 0,
				tr: 25,
				br: 25, bl: 0
			}, true);

			context.fillStyle = '#5151E5';
			roundRect(context, 0, 0, 300, height, 25, true);

			addText(context, arrDays[now.getDay()], { left: 25, top: 50}, '24px "Montserrat Bold"');
			addText(context, now.toLocaleDateString(), { left: 25, top: 75 });
			addText(context, `${req.query.city}, ${country.toUpperCase()}`, { left: 25, top: 120 });

			loadImage(`http://openweathermap.org/img/wn/${json.weather[0].icon}@2x.png`).then(image => {
				context.drawImage(image, 25, 180, 100, 100);

				addText(context, `${Math.round(parseFloat(json.main.temp))}°C`, { left: 25, top: 350 }, '64px "Montserrat Bold"');
				addText(context, json.weather[0].main, { left: 25, top: 380 });

				addText(context, 'FEELS LIKE', { left: 340, top: 60 }, '16px "Montserrat Bold"');
				addText(context, json.main.feels_like, { left: 600, top: 60 }, '16px Montserrat', 'right');

				addText(context, 'PRESSURE', { left: 340, top: 100 }, '16px "Montserrat Bold"');
				addText(context, json.main.pressure, { left: 600, top: 100 }, '16px Montserrat', 'right');

				addText(context, 'HUMIDITY', { left: 340, top: 140 }, '16px "Montserrat Bold"');
				addText(context, json.main.humidity, { left: 600, top: 140 }, '16px Montserrat', 'right');

				addText(context, 'WIND', { left: 340, top: 180 }, '16px "Montserrat Bold"');
				addText(context, `${json.wind.speed} mph`, { left: 600, top: 180 }, '16px Montserrat', 'right');

				addText(context, 'WIND DIRECTION', { left: 340, top: 220 }, '16px "Montserrat Bold"');
				addText(context, `${json.wind.deg}`, { left: 600, top: 220 }, '16px Montserrat', 'right');

				addText(context, now.toLocaleTimeString(), { left: 390, top: 365 }, '12px Montserrat');

				loadImage('./assets/avatar.jpeg').then(image => {
					context.drawImage(image, 340, 340, 40, 40);

					const buffer = canvas.toBuffer('image/png');

					res.contentType('png');
					res.end(buffer, 'binary');
				}).catch(err => res.end(err));

			}).catch(err => res.end(err));

		}).catch(err => res.end(err));
});
