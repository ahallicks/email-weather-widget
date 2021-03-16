'use strict';

// Notes:
// Run
// 	npm test -- --watch
// to have this watch for changes since last test

const { degreeToDirection, calculateRadius } = require('./helpers');

describe('Helpers tests tests', () => {
	describe('Degrees to direction tests', () => {
		test('Returns SW when given 220 degrees', () => {
			expect(degreeToDirection(220)).toBe('SW');
		});

		test('Returns SW when given 220 as a string', () => {
			expect(degreeToDirection('220')).toBe('SW');
		});

		test('Returns S when given 180 as an integer', () => {
			expect(degreeToDirection('180')).toBe('S');
		});

		test('Returns N when not passed anything', () => {
			expect(degreeToDirection()).toBe('N');
		});

		test('Returns N when passed something untangible', () => {
			expect(degreeToDirection('dsfjhjdsfh')).toBe('N');
		});

		test('Returns N when passed null', () => {
			expect(degreeToDirection(null)).toBe('N');
		});
	});

	describe('Radius tests', () => {
		test('Returns an object with equal radii', () => {
			expect(calculateRadius(10)).toStrictEqual({ tl: 10, tr: 10, br: 10, bl: 10 });
		});
	});
});
