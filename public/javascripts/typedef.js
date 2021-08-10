/**
 * This type represents a the result from the solution
 * @typedef Solution
 *
 * @type {object}
 * @property {Number} transportationCost                - The transportation cost.
 * @property {Number} customerCost                      - The inventory cost on customers.
 * @property {Number} depotCost                         - The inventory cost on depot.
 * @property {Number} totalCost                         - The total cost.
 * @property {Number} processor                         - The processor value based on DIMACS rules.
 * @property {Number} timeInSeconds                     - The elapsed time in seconds.
 * @property {Array<Array<int[]>>} routesByPeriod              - An zero-based array from each route by period.
 * @property {Array<Array<number[]>>} deliveriesByPeriod        - An zero-based array from each delivery by period.
 */

/**
 * This type represents an instance from the IRP problem.
 * @typedef Instance
 *
 * @type {object}
 * @property {String} instanceId                        - The instance unique identifier.
 * @property {Number} n                                 - The number of costumers.
 * @property {Number} T                                 - The number of periods.
 * @property {Number} Q                                 - The vehicle maximum capacity.
 * @property {Number} K                                 - The number of vehicles.
 * @property {Array<Node>} nodes                        - A list with all customers and the depot.
 */

/**
 * This type represents a node in the problem. Can be a depot, if the identifier is Zero, or a costumer in the other case.
 * @typedef Node
 *
 * @type {object}
 * @property {Number} id        - The identifier for this node. Zero means the Depot.
 * @property {Number} x         - The x coord.
 * @property {Number} y         - The y coord
 * @property {Number} startInv  - The initial inventory.
 * @property {Number} maxInv    - The maximum inventory. Negative number means infinity.
 * @property {Number} minInv    - The minimum inventory.
 * @property {Number} daily     - The production/consume inventory per day.
 * @property {Number} cost      - The inventory cost per unity.
 */

/**
 * This type represents an instance-id
 * @typedef InstanceId
 *
 * @type {object}
 * @property {Number} n  - The number of costumers.
 * @property {Number} T  - The number of periods.
 * @property {Number} K  - The number of vehicles.
 */


/**
 * This type represents an API error response.
 * @typedef ErrorResponse
 *
 * @type {object}
 * @property {boolean} success  - A boolean that indicates if the requests was success.
 * @property {String} detail    - The detailed error message.
 */
