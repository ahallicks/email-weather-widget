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
		test('Returns an object with equal radii of 10', () => {
			expect(calculateRadius(10)).toStrictEqual({ tl: 10, tr: 10, br: 10, bl: 10 });
		});

		test('Returns an object with equal radii of 50', () => {
			expect(calculateRadius(50)).toStrictEqual({ tl: 50, tr: 50, br: 50, bl: 50 });
		});

		test('Returns an object that matches the input object', () => {
			expect(calculateRadius({ tl: 10, tr: 10, br: 10, bl: 10 })).toStrictEqual({ tl: 10, tr: 10, br: 10, bl: 10 });
		});

		test('Returns a complete object from a partial input object with 0 as the non-specified radii', () => {
			expect(calculateRadius({ tl: 10, tr: 10 })).toStrictEqual({ tl: 10, tr: 10, br: 0, bl: 0 });
		});

		test('Returns a complete object from a partial input object with 0 as the non-specified radii', () => {
			expect(calculateRadius({ tl: 10, br: 10 })).toStrictEqual({ tl: 10, tr: 0, br: 10, bl: 0 });
		});

		test('Returns an object with each value as 0 when not passed an option', () => {
			expect(calculateRadius()).toStrictEqual({ tl: 0, tr: 0, br: 0, bl: 0 });
		});

		test('Returns an object with each value as 0 when passed an incorrect type', () => {
			expect(calculateRadius('blue')).toStrictEqual({ tl: 0, tr: 0, br: 0, bl: 0 });
		});
	});
});
