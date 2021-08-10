import '../public/javascripts/typedef.js'

/**
 * Parse the instance-id and the input file. Will thrown an error for empty inputs or wrong formats.
 * Please check the http://dimacs.rutgers.edu/programs/challenge/vrp/irp/ for more detail.
 *
 * @param {String} instanceId   - The instanceId according to DIMACS;
 * @param {String} input        - The input file full content;
 * @returns {Instance}          - The Instance object;
 */
export function parseInstance(instanceId, input) {
    if (input === undefined || input.length === 0) {
        throw new Error("empty solution");
    }
    const lines = input.split("\n");
    const instance = /** @type {Instance} */ {};
    const header = getElements(lines[0]);
    if (header.length < 4) {
        throw new Error("expected header <number-of-nodes> <number-of-periods> <vehicle-of-capacity> <number-of-vehicles>");
    }
    instance.instanceId = instanceId;
    // the file includes the depot, so we must decrement it
    instance.n = parseInt(header[0]) - 1;
    instance.T = parseInt(header[1]);
    instance.Q = parseInt(header[2]);
    instance.K = parseInt(header[3]);

    instance.nodes = [];
    instance.nodes.push(parseDepot(lines[1]));
    for (let i = 2; i < 2 + instance.n; i++) {
        instance.nodes.push(parseCustomer(lines[i]))
    }

    return instance;
}

/**
 * This is just a helper private method that trim and splits by spaces a line.
 *
 * @param line          - A single line;
 * @returns {string[]}  - All;
 */
function getElements(line) {
    return line.trim().split(/\s+/);
}

/**
 * Parse a line that represents a depot. Will throw an error for wrong formats
 * Please check the http://dimacs.rutgers.edu/programs/challenge/vrp/irp/ for more detail.
 *
 * @param line      - The line that represents a depot;
 * @returns {Node}  - The depot;
 */
function parseDepot(line) {
    const details = getElements(line);
    if (details.length < 6) {
        throw new Error("expected depot <id> <x> <y> <startInv> <startInv> <daily> <cost>");
    }
    return {
        id: parseInt(details[0]),
        x: parseFloat(details[1]),
        y: parseFloat(details[2]),
        startInv: parseInt(details[3]),
        daily: parseInt(details[4]),
        maxInv: 0,
        minInv: 0,
        cost: parseFloat(details[5])
    }
}

/**
 * Parse a line that represents a customer. Will throw an error for wrong formats
 * Please check the http://dimacs.rutgers.edu/programs/challenge/vrp/irp/ for more detail.
 *
 * @param line      - The line that represents a customer;
 * @returns {Node}  - The customer;
 */
function parseCustomer(line) {
    const details = getElements(line);
    if (details.length < 8) {
        throw new Error("expected depot <id> <x> <y> <startInv> <startInv> <minInv> <maxInv> <daily> <cost>");
    }
    return {
        id: parseInt(details[0]),
        x: parseFloat(details[1]),
        y: parseFloat(details[2]),
        startInv: parseInt(details[3]),
        maxInv: parseInt(details[4]),
        minInv: parseInt(details[5]),
        daily: parseInt(details[6]),
        cost: parseFloat(details[7])
    }
}