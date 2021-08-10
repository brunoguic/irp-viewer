import './typedef.js'

export const MIN_AXIS = 0;
export const MAX_AXIS = 500;

const FILE_FORMAT = /out_(.*)\.txt/;
const SMALL_INSTANCE = /S_abs\dn(\d+)_(\d+)_[H|L](\d+)$/;
const LARGE_INSTANCE = /L_abs\dn(\d+)_(\d+)_[H|L]$/;


/**
 * A helper method that parses the filename, and extracts ist instance id.
 * Will throw an error if it is not a valid format.
 *
 * @param filename
 * @returns {InstanceId}
 */
export function parseFilename(filename) {
    const filenameMatch = filename.match(FILE_FORMAT);
    if (!filenameMatch) {
        throw new Error(`could not parse filename '${filename}'. Expected 'out_INSTANCE.txt'.`);
    }

    const instanceId = filenameMatch[1];
    if (!instanceId.startsWith("S") && !instanceId.startsWith("L")) {
        throw new Error(`could not parse instance id ${instanceId} from filename.`);
    }

    const pattern = instanceId.startsWith("S") ? SMALL_INSTANCE : LARGE_INSTANCE;
    const instanceMatch = instanceId.match(pattern);
    if (!instanceMatch) {
        throw new Error(`could not parse ${instanceId.startsWith("S") ? "small" : "large"} instance ${instanceId}. Expected '${pattern}'.`);
    }

    return {
        n: Number.parseInt(instanceMatch[1]),
        T: pattern === SMALL_INSTANCE ? Number.parseInt(instanceMatch[3]) : 6,
        K: Number.parseInt(instanceMatch[2])
    }
}

/**
 * Parses the filename and the file's content to a Solution object.
 * Will throw an error if it is not a valid format.
 *
 * @param {String} filename
 * @param {String} content
 * @returns {Solution}
 */
export function parseSolution(filename, content) {
    if (filename === undefined || filename.length === 0 || content === undefined || content.length === 0) {
        throw new Error("empty input.");
    }

    const filenameParsed = parseFilename(filename);

    const solution = /** @type Solution */ {
        routesByPeriod: [],
        deliveriesByPeriod: [],
    };

    const lines = content.split("\n");
    let i = 0;
    for (let t = 1; t <= filenameParsed.T; t++) {
        if (lines[i++] !== `Day ${t}`) {
            throw new Error(`could not parse line ${i}: '${lines[i-1]}'. Expected 'Day ${t}'.`);
        }
        solution.routesByPeriod.push([]);
        solution.deliveriesByPeriod.push([]);

        for (let k = 1; k <= filenameParsed.K; k++) {
            const regex = new RegExp(`Route ${k}: 0 - (([0-9]* \\( [0-9]*\\.?[0-9]* \\) - )*)0`)
            const routeMatch = lines[i++].match(regex);
            if (!routeMatch) {
                throw new Error(`could not parse line ${i}: '${lines[i-1]}'. Expected 'Route ${k}: 0 - {Number} ( {Number} )* - 0'.`);
            }

            const route = [];
            const deliveries = [];
            route.push(0);
            deliveries.push(0.0);
            const routeTxt = routeMatch[1];
            if (routeTxt) {
                for (const customerTxt of routeTxt.split("-")) {
                    if (!customerTxt.trim()) {
                        continue;
                    }
                    const customerMatch = customerTxt.match(/([0-9]*) \( ([0-9]*\.?[0-9]*) \).*/);
                    if (!customerMatch) {
                        throw new Error(`could not parse route at line ${i}: '${lines[i-1]}. Wrong customer format '${customerTxt}.'`);
                    }
                    route.push(Number.parseInt(customerMatch[1]))
                    deliveries.push(Number.parseFloat(customerMatch[2]))
                }
            }
            route.push(0);
            deliveries.push(0.0);
            solution.routesByPeriod[t-1].push(route);
            solution.deliveriesByPeriod[t-1].push(deliveries);
        }
    }

    const lineRemainingCount = lines.length - i;
    if (lineRemainingCount < 6) {
        throw new Error(`could not parse file '${filename}'. Expected six lines in the end of the file.`);
    }

    try {
        solution.transportationCost = parseNumberOrError(lines[i++]);
        solution.customerCost = parseNumberOrError(lines[i++]);
        solution.depotCost = parseNumberOrError(lines[i++]);
        solution.totalCost = parseNumberOrError(lines[i++]);
        solution.processor = parseNumberOrError(lines[i++]);
        solution.timeInSeconds = parseNumberOrError(lines[i++]);
    } catch (err) {
        throw new Error(`could not parse line ${i}: '${err}'.`);
    }

    return solution;
}

/**
 * A helper method to parse a string if it is a valid number, or throws an error in other case.
 *
 * @param string        - The string to be parsed
 * @returns {number}    - The result number
 */
function parseNumberOrError(string) {
    const result = Number.parseFloat(string.trim());
    if (Number.isNaN(result)) {
        throw Error (`'${string}' is not a number.`);
    }

    return result;
}

/**
 * Calculates the Euclidean distance between two nodes.
 * It follows the DIMACS rules.
 *
 * @param {Node} nodeI  - First node;
 * @param {Node} nodeJ  - Second node;
 * @returns {number}    - The Euclidean distance;
 */
export function dist(nodeI, nodeJ) {
    return dist2D(nodeI.x, nodeI.y, nodeJ.x, nodeJ.y);
}

/**
 * Calculates the Euclidean distance between two Euclidean points.
 *
 * @param {number} ax
 * @param {number} ay
 * @param {number} bx
 * @param {number} by
 * @returns {number}
 */
export function dist2D(ax, ay, bx, by) {
    return Math.floor(Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)) + 0.5);
}
