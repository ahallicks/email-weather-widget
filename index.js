'use strict';

// Env vars
const dotenv = require('dotenv');
dotenv.config();

// Import packages for express
const http = require('http');

// Node internals
const fs = require('fs-extra');
const path = require('path');

// Canvas details
const { createCanvas, loadImage, registerFont } = require('canvas');
const fetch = require('node-fetch');

// Setup the express server
const express = require('express');
const useragent = require('express-useragent');
const app = express();
app.use(useragent.express());
const port = 5050;

// Serve the API
const httpServer = http.createServer(app);

httpServer.listen(port, () => {
	console.log(`HTTP Server running on port ${port}`);
});

// Internal lib helpers and methods
const { objColours, objPositions, arrDays, arrMonths, intCacheTime } = require('./lib/config');
const { degreeToDirection } = require('./lib/helpers');
const { createLayout, roundRect, addText, loadIcon } = require('./lib/canvas');

// Register the fonts for the canvas
registerFont(path.join(__dirname, 'assets', 'Montserrat-Regular.ttf'), { family: 'Montserrat' });
registerFont(path.join(__dirname, 'assets', 'Montserrat-Bold.ttf'), { family: 'Montserrat Bold' });

// API key and URL for weather map usage
const api = process.env.API_KEY;
const apiUrl = `https://api.openweathermap.org/data/2.5`;

// Default country
let country = 'uk';
let objCurrent = {};

/**
 * Shows an error page
 *
 * @param  {Object} req        Express request parameters
 * @param  {Object} res        Express response parameters
 * @param  {String} strMessage String (optional) a message to display
 */
const showError = (req, res, strMessage) => {
	const { canvas, context } = createLayout(req);

	const now = new Date();
	addText(context, arrDays[now.getDay()], { left: 25, top: 50}, '24px "Montserrat Bold"');
	addText(context, now.toLocaleDateString(), { left: 25, top: 75 });
	addText(context, (strMessage || `Unknown city`), { left: 25, top: 120 });
	addText(context, 'No weather data available', { left: objPositions.rightPane.left, top: 60 }, '16px "Montserrat Bold"');

	const buffer = canvas.toBuffer('image/png');
	res.contentType('png');
	res.end(buffer, 'binary');
};

/**
 * Get the last modified time of a given file
 * @param  {String} path The path to the file
 * @return {Integer}     The time the file was last modified
 */
const getFileUpdatedDate = path => {
  const stats = fs.statSync(path);
  return stats.mtime;
};

const buildUi = (req, res) => {

	country = req.params.country || country;
	const blnMobile = req.useragent.isMobile;
	const apiKey = req.query.api_key || api;
	const now = new Date();
	const strPath = path.join(__dirname, 'cache');
	const strFilename = path.join(strPath, `${req.params.city.toLowerCase()}-${country.toLowerCase()}-${blnMobile ? 'mob' : 'desk'}.png`);

	// Firsly check to see if we have a cached image
	if(fs.ensureDir(strPath) && fs.existsSync(strFilename) && now.getTime() - getFileUpdatedDate(strFilename).getTime() < intCacheTime)
	{
		console.log('Found cache, returning image');
		fs.readFile(strFilename, (_err, buffer) => {

			res.contentType('png');
			res.end(buffer, 'binary');

		});
	} else {

		console.log('No cache, creating new image');

		// Fetch the latest weather from the API
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

				addText(context, arrDays[now.getDay()], blnMobile ? { left: 25, top: 40 } : { left: 25, top: 50 }, '24px "Montserrat Bold"');
				addText(context, `${now.getDate()} ${arrMonths[now.getMonth()]}, ${now.getFullYear()}`, blnMobile ? { left: 25, top: 65 } : { left: 25, top: 75 });
				addText(context, `${objCurrent.name}, ${objCurrent.sys.country}`, blnMobile ? { left: 45, top: 105 } : { left: 45, top: 110 });

				loadImage(`http://openweathermap.org/img/wn/${objCurrent.weather[0].icon}@2x.png`).then(image => {

					context.strokeStyle = objColours.secondary;
					context.fillStyle = objColours.primary;
					blnMobile ? roundRect(context, 25, 135, 100, 100, 10, true) : roundRect(context, 25, 180, 100, 100, 10, true, true);
					blnMobile ? context.drawImage(image, 25, 135, 100, 100) : context.drawImage(image, 25, 180, 100, 100);

					return loadImage(path.join(__dirname, 'assets', 'pin.svg'));

				}).then(icon => {

					blnMobile ? context.drawImage(icon, 25, 93, 13, 13) : context.drawImage(icon, 25, 98, 13, 13);

					// Main weather with cloud coverage where applicable
					let strMain = objCurrent.weather[0].main;
					if(objCurrent.clouds.all > 10)
					{
						strMain+= ` (${objCurrent.clouds.all}%)`;
					}

					addText(context, `${Math.round(parseFloat(objCurrent.main.temp))}°C`, blnMobile ? { left: 25, top: 310 } : { left: 25, top: 350 }, '64px "Montserrat Bold"');
					addText(context, strMain, blnMobile ? { left: 25, top: 340 } : { left: 25, top: 380 });

					// Wind speed with gusts if applicable
					const intSpeed = Math.round(parseFloat(objCurrent.wind.speed));
					let strSpeed = `${intSpeed} mph`;

					// Check for gusts in the API
					if(objCurrent.wind.gust)
					{
						const intGusts = Math.round(parseFloat(objCurrent.wind.gust));
						if(intSpeed !== intGusts)
						{
							strSpeed = `${intSpeed} mph (gusts ${intGusts} mph)`;
						}
					}

					if(blnMobile)
					{

						addText(context, 'FEELS LIKE', { left: objPositions.rightPane.mobile.left, top: 400 }, '16px "Montserrat Bold"');
						addText(context, `${Math.round(parseFloat(objCurrent.main.feels_like))}°C`, { left: 300, top: 400 }, '16px Montserrat', 'right');

						addText(context, 'WIND', { left: objPositions.rightPane.mobile.left, top: 440 }, '16px "Montserrat Bold"');
						addText(context, strSpeed, { left: 300, top: 440 }, '16px Montserrat', 'right');

						addText(context, 'WIND DIRECTION', { left: objPositions.rightPane.mobile.left, top: 480 }, '16px "Montserrat Bold"');
						addText(context, `${degreeToDirection(objCurrent.wind.deg)}`, { left: 300, top: 480 }, '16px Montserrat', 'right');

					} else {

						addText(context, 'FEELS LIKE', { left: objPositions.rightPane.left, top: 60 }, '16px "Montserrat Bold"');
						addText(context, `${Math.round(parseFloat(objCurrent.main.feels_like))}°C`, { left: 610, top: 60 }, '16px Montserrat', 'right');

						addText(context, 'PRESSURE', { left: objPositions.rightPane.left, top: 100 }, '16px "Montserrat Bold"');
						addText(context, `${objCurrent.main.pressure} hPa`, { left: 610, top: 100 }, '16px Montserrat', 'right');

						addText(context, 'HUMIDITY', { left: objPositions.rightPane.left, top: 140 }, '16px "Montserrat Bold"');
						addText(context, `${objCurrent.main.humidity}%`, { left: 610, top: 140 }, '16px Montserrat', 'right');

						addText(context, 'WIND', { left: objPositions.rightPane.left, top: 180 }, '16px "Montserrat Bold"');
						addText(context, strSpeed, { left: 610, top: 180 }, '16px Montserrat', 'right');

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
								if(blnMobile)
								{
									roundRect(context, (objPositions.rightPane.mobile.left + intLeft), 505, objPositions.rightPane.dayWidth, 125, 10, true);

									addText(context, arrDays[objDate.getDay()].substring(0, 3), { left: (objPositions.rightPane.mobile.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 586 }, '16px Montserrat', 'center');
									addText(context, `${Math.round(parseFloat(objDay.temp.day))}°C`, { left: (objPositions.rightPane.mobile.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 606 }, '16px "Montserrat Bold"', 'center');
									addText(context, `${objDay.weather[0].main}`, { left: (objPositions.rightPane.mobile.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 624 }, '14px "Montserrat"', 'center');
								} else {
									roundRect(context, (objPositions.rightPane.left + intLeft), 250, objPositions.rightPane.dayWidth, 130, 10, true);

									addText(context, arrDays[objDate.getDay()].substring(0, 3), { left: (objPositions.rightPane.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 332 }, '16px Montserrat', 'center');
									addText(context, `${Math.round(parseFloat(objDay.temp.day))}°C`, { left: (objPositions.rightPane.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 352 }, '16px "Montserrat Bold"', 'center');
									addText(context, `${objDay.weather[0].main}`, { left: (objPositions.rightPane.left + intLeft + (objPositions.rightPane.dayWidth / 2)), top: 370 }, '14px "Montserrat"', 'center');
								}
							}

						});

						const out = fs.createWriteStream(strFilename);
						const stream = canvas.createPNGStream();
						stream.pipe(out);
						out.on('finish', () => {
							const buffer = canvas.toBuffer('image/png');

							res.contentType('png');
							res.end(buffer, 'binary');
						});

					}).catch(err => showError(req, res, err));

				}).catch(err => showError(req, res, err));

			}).catch(err => {

				console.log(JSON.stringify(err, null, 4));

			});

	}
};

// Ignore favicon requests
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// No data to process, show an error
app.get('/', (req, res) => {

	showError(req, res);

});

// A city and (optionally) a country, build our UI
app.get('/:city/:country*?', (req, res) => {

	buildUi(req, res);

});
