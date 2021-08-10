import {validateSolution} from "../public/javascripts/dimacs-rules.js";
import {parseSolution, dist} from "../public/javascripts/dimacs-solution-reader.js";
import {parseInstance} from "../src/dimacs-instance-reader.js";
import fs from "fs";


// Lets use a global variable to be set before each unit test
/** @type Instance */
let instance;
/** @type Solution */
let solution;


beforeEach(() => {
    initializeValidSolution();
});

test('sanity check, test the base instance and solution for the next tests', () => {
    expect(validateSolution(instance, solution)).toBeTruthy()
});

test('vehicle capacity constraint, a route should delivery less than the vehicle capacity', () => {
    // Day 1
    // Route 1: 0 - 1 ( 65.00 ) - 0
    solution.deliveriesByPeriod[0][0][1] = instance.Q
    expect(validateSolution(instance, solution)).toBeTruthy();

    solution.deliveriesByPeriod[0][0][1] += 1;
    const errors = validateSolution(instance, solution);
    const expectedError = /max load the vehicle support is/;
    expect(matches(expectedError, errors)).toBeTruthy()
});

test('depot inventory constraint, the depot never should stock out', () => {
    instance.nodes[0].startInv = 1;
    instance.nodes[0].daily = 1;
    solution.deliveriesByPeriod[0][0][1] = 3;

    const errors = validateSolution(instance, solution);
    const expectedError = /Period 1; Depot with negative inventory of -1/;
    expect(matches(expectedError, errors)).toBeTruthy()
});

test('customer inventory min constraint, the customer never should has less than the minimum', () => {
    instance.nodes[1].minInv = 2;
    instance.nodes[1].startInv = 2;
    instance.nodes[1].daily = 2;
    // Day 1
    // Route 1: 0 - 1 ( 65.00 ) - 0
    solution.deliveriesByPeriod[0][0][1] = 1;

    const errors = validateSolution(instance, solution);
    const expectedError = /Customer 1 is lower than the minimum inventory 2 with 1/;
    expect(matches(expectedError, errors)).toBeTruthy()
});


test('customer inventory max constraint, the customer never should has more than the maximum', () => {
    instance.nodes[1].minInv = 0;
    instance.nodes[1].maxInv = 2;
    instance.nodes[1].startInv = 1;
    instance.nodes[1].daily = 1;
    // Day 1
    // Route 1: 0 - 1 ( 65.00 ) - 0
    solution.deliveriesByPeriod[0][0][1] = 2;

    const errors = validateSolution(instance, solution);
    const expectedError = /Customer 1 exceed the maximum inventory 2 with 3/;
    expect(matches(expectedError, errors)).toBeTruthy()
});


test('customers should be visited once per period', () => {
    // Day 1
    // Route 1: 0 - 1 ( 65.00 ) - 0
    // Route 2: 0 - 0
    solution.routesByPeriod[0][1] = [0, 1, 0];
    solution.deliveriesByPeriod[0][1] = [0, 65, 0];
    const errors = validateSolution(instance, solution);
    const expectedError = /Customer 1 was previously attended in the same route/;
    expect(matches(expectedError, errors)).toBeTruthy()
});

test('Euclidean distance should round up', () => {
    instance.nodes[0].x = 0;
    instance.nodes[0].y = 0;

    instance.nodes[1].x = 10;
    instance.nodes[1].y = 0;

    expect(dist(instance.nodes[0], instance.nodes[1])).toEqual(10);

    instance.nodes[1].x = 10;
    instance.nodes[1].y = 10;
    // real dist = 14.14
    expect(dist(instance.nodes[0], instance.nodes[1])).toEqual(14);

    instance.nodes[1].x = 11;
    instance.nodes[1].y = 11;
    // real dist = 15.55
    expect(dist(instance.nodes[0], instance.nodes[1])).toEqual(16);
});



/**
 * Will set the global variables instance and solution to a valid solution. Then we can change it as we want.
 */
function initializeValidSolution() {
    // Lets uses create a valid solution
    const instanceId = "S_abs1n5_2_L3"
    const instancePath = new URL(`../public/instances/${instanceId}.dat`, import.meta.url);
    const instanceContent = fs.readFileSync(instancePath, 'utf8').toString();
    instance = parseInstance(instanceId, instanceContent);

    const validSolutionContent =
        `Day 1
Route 1: 0 - 1 ( 65.00 ) - 0
Route 2: 0 - 0
Day 2
Route 1: 0 - 3 ( 116.00 ) - 0
Route 2: 0 - 4 ( 48.00 ) - 2 ( 35.00 ) - 5 ( 22.00 ) - 0
Day 3
Route 1: 0 - 0
Route 2: 0 - 0
1302.00
9.88
61.53
1373.41
0.00
0.23`;

    solution = parseSolution("out_S_abs1n5_2_L3.txt", validSolutionContent);
}

/**
 *
 * @param {RegExp} regex
 * @param {string[]} errors
 */
function matches(regex, errors) {
    for (let error of errors) {
        if (error.match(regex)) {
            return true;
        }
    }
    return false;
}