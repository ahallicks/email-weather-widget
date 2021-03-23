

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

const objColours = {
	primary: '#5151E5',
	secondary: '#3838A0',
	black: '#000',
	dark: '#222831',
	grey: '#bbb',
	light: '#ccc',
	white: '#fff'
};

// Used to get the current day of the week
const arrDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const arrMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

// Cache time in milliseconds
const intCacheTime = 1000 * 60 * 10;

module.exports = { objColours, objDimensions, objPositions, arrDays, arrMonths, intCacheTime };
