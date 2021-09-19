import './typedef.js'
import {dist} from './dimacs-solution-reader.js';
import {isEquals} from "./utils.js";


/**
 * A helper method that calculates the amount delivered for each node at each period.
 *
 * @param {Instance} instance
 * @param {Solution} solution
 */
function getDeliveredByNodeByPeriod(instance, solution) {
    const deliveredByNodeByPeriod = Array(instance.T);
    for (let t = 0; t < instance.T; t++) {
        const deliveredByNode = Array(instance.n + 1).fill(0);
        for (let k = 0; k < solution.deliveriesByPeriod[t].length; k++) {
            for (let i = 0; i < solution.deliveriesByPeriod[t][k].length; i++) {
                const id = solution.routesByPeriod[t][k][i];
                deliveredByNode[id] = solution.deliveriesByPeriod[t][k][i];
            }
        }
        deliveredByNodeByPeriod[t] = deliveredByNode;
    }

    return deliveredByNodeByPeriod;
}

/**
 * A helper method that calculates the inventory level for each node at each period.
 *
 * @param {Instance} instance
 * @param {Solution} solution
 */
export function getInventoryByNodeByPeriod(instance, solution) {
    const inventoryByNodeByPeriod = Array(instance.T);
    const deliveredByNodeByPeriod = getDeliveredByNodeByPeriod(instance, solution);
    const inventoryByNode = Array(instance.n + 1).fill(0);
    for (let id = 0; id <= instance.n; id++) {
        inventoryByNode[id] = instance.nodes[id].startInv;
    }
    for (let t = 0; t < instance.T; t++) {
        inventoryByNode[0] += instance.nodes[0].daily;
        for (let id = 1; id <= instance.n; id++) {
            const node = instance.nodes[id];
            const deliveredToThisNode = deliveredByNodeByPeriod[t][id];
            inventoryByNode[id] += deliveredToThisNode - node.daily;
            inventoryByNode[0] -= deliveredToThisNode;
        }
        // make a copy
        inventoryByNodeByPeriod[t] = [...inventoryByNode];
    }
    return inventoryByNodeByPeriod;
}


/**
 * Based on the instance and on the solution, applies the DIMACS IRP's rules.
 * Will try to validate all the solution, and collect all the errors in a single list;
 *
 * @param {Instance} instance   - The instance;
 * @param {Solution} solution   - The solution;
 * @returns {String[]}          - All collect errors;
 */
export function validateSolution(instance, solution) {
    const errors = [];

    // validates the CVRP constraints and calculate the transportationCost
    let transportationCost = 0;
    // for each period
    for (let t = 1; t <= instance.T; t++) {
        // validates if the customer is attended more than one time per period
        const customers = new Set();
        // for each route
        for (let k = 1; k <= solution.routesByPeriod[t-1].length; k++) {
            const route = solution.routesByPeriod[t-1][k-1];
            const deliveries = solution.deliveriesByPeriod[t-1][k-1];
            let delivered = 0;

            for (let i = 0; i < route.length - 1; i++) {
                const curr = route[i];
                const next = route[i+1];
                transportationCost += dist(instance.nodes[curr], instance.nodes[next]);
                delivered += deliveries[curr];

                // ignore the depot since it participates on all routes
                if (curr === 0) continue;

                if (customers.has(curr)) {
                    errors.push(`Period ${t}; Route ${k}; Customer ${curr} was previously attended in the same route.`);
                }
                customers.add(curr);
            }

            // ensures that the amount that the vehicle loaded, is smaller than its maximum capacity
            if (delivered > instance.Q) {
                errors.push(`Period ${t}; Route ${k}; Delivered ${delivered} but the max load the vehicle support is: ${instance.Q}.`);
            }
        }
    }

    // if the solution value is different from what we've just validated
    if (transportationCost !== solution.transportationCost) {
        errors.push(`Wrong transportation cost reported. Calculated of ${transportationCost}, but was reported ${solution.transportationCost}.`);
    }

    // validates the inventory constraints and calculate inventory cost
    let depotInventoryCost = 0;
    let customerInventoryCost = 0;
    const deliveredToNodeByPeriod = getDeliveredByNodeByPeriod(instance, solution);
    const inventoryByNode = Array(instance.n + 1);
    for (let id = 0; id <= instance.n; id++) {
        inventoryByNode[id] = instance.nodes[id].startInv;
    }
    for (let t = 1; t <= instance.T; t++) {
        inventoryByNode[0] += instance.nodes[0].daily;
        for (let id = 1; id <= instance.n; id++) {
            const node = instance.nodes[id];
            const deliveredToThisNode = deliveredToNodeByPeriod[t-1][id];

            // delivery occurs first
            inventoryByNode[id] += deliveredToThisNode;
            // maximum inventory level constraints
            if (inventoryByNode[id] > node.maxInv) {
                errors.push(`Period ${t}; Customer ${id} exceed the maximum inventory ${node.maxInv} with ${inventoryByNode[id]}.`);
            }

            // consuming occurs last
            inventoryByNode[id] -= node.daily;
            // minimum inventory level constraints
            if (inventoryByNode[id] < node.minInv) {
                errors.push(`Period ${t}; Customer ${id} is lower than the minimum inventory ${node.minInv} with ${inventoryByNode[id]}.`);
            }

            // calculate customer cost
            customerInventoryCost += inventoryByNode[id] * node.cost;

            // update depot inventory
            inventoryByNode[0] -= deliveredToThisNode;
        }

        if (inventoryByNode[0] < 0) {
            errors.push(`Period ${t}; Depot with negative inventory of ${inventoryByNode[0]}.`);
        }

        // calculate depot cost
        depotInventoryCost += inventoryByNode[0] * instance.nodes[0].cost;
    }

    customerInventoryCost = customerInventoryCost * 100 / 100
    if (!isEquals(customerInventoryCost, solution.customerCost)) {
        errors.push(`Wrong inventory customer cost reported. Calculated of ${customerInventoryCost}, but was reported ${solution.customerCost}.`);
    }

    depotInventoryCost = depotInventoryCost * 100 / 100
    if (!isEquals(depotInventoryCost, solution.depotCost)) {
        errors.push(`Wrong inventory depot cost reported. Calculated of ${depotInventoryCost}, but was reported ${solution.depotCost}.`);
    }

    const totalCost = transportationCost + depotInventoryCost + customerInventoryCost;
    if (!isEquals(totalCost, solution.totalCost)) {
        errors.push(`Wrong total cost reported. Calculated of ${totalCost}, but was reported ${solution.totalCost}.`);
    }

    return errors;
}