import {parseSolution} from "./dimacs-solution-reader.js";
import {MIN_AXIS} from "./dimacs-solution-reader.js";
import {MAX_AXIS} from "./dimacs-solution-reader.js";
import {validateSolution, getInventoryByNodeByPeriod, INVENTORY_COST_IN_T0_ERROR} from "./dimacs-rules.js";

export class Viewer {
    /** @type {Solution} */
    solution;
    /** @type {Instance} */
    instance;
    /** @type {string[]} */
    errors;
    /** @type {number} */
    viewWindowMin;
    /** @type {number} */
    viewWindowMax;

    /** {HTMLElement} */
    welcomeDetailDiv;
    /** {HTMLElement} */
    solutionDetailDiv;
    /** {HTMLElement} */
    solutionDetailValidBoxDiv;
    /** {HTMLElement} */
    solutionDetailValidT0BoxDiv;
    /** {HTMLElement} */
    solutionDetailInvalidBoxDiv;
    /** {HTMLElement} */
    chartsDiv;
    /** {HTMLElement[]} */
    solutionDrawList;
    /** {HTMLElement} */
    errorsDiv;
    /** {HTMLElement} */
    welcomeLeftDiv;
    /** {HTMLElement} */
    instanceDetailDiv;
    /** {HTMLElement} */
    instanceDraw;

    constructor() {
        this.viewWindowMin = MIN_AXIS - 10;
        this.viewWindowMax = MAX_AXIS + 10;
    }

    /**
     * Initializes the viewer object with HTML elements. This method is separated from the constructor because it's
     * happens asynchronous, after the Google Charts initialization.
     *
     * @param {HTMLElement} welcomeDetailDiv
     * @param {HTMLElement} solutionDetailDiv
     * @param {HTMLElement} solutionDetailValidBoxDiv
     * @param {HTMLElement} solutionDetailValidT0BoxDiv
     * @param {HTMLElement} solutionDetailInvalidBoxDiv
     * @param {HTMLElement} chartsDiv
     * @param {HTMLElement[]} solutionDrawList
     * @param {HTMLElement} errorsDiv
     * @param {HTMLElement} welcomeLeftDiv
     * @param {HTMLElement} instanceDetailDiv
     * @param {HTMLElement} instanceDraw
     */
    init(welcomeDetailDiv,
         solutionDetailDiv, solutionDetailValidBoxDiv, solutionDetailValidT0BoxDiv,  solutionDetailInvalidBoxDiv,
         chartsDiv, solutionDrawList, errorsDiv,
         welcomeLeftDiv, instanceDetailDiv, instanceDraw) {
        this.welcomeDetailDiv = welcomeDetailDiv;
        this.solutionDetailDiv = solutionDetailDiv;
        this.solutionDetailValidBoxDiv = solutionDetailValidBoxDiv;
        this.solutionDetailValidT0BoxDiv = solutionDetailValidT0BoxDiv;
        this.solutionDetailInvalidBoxDiv = solutionDetailInvalidBoxDiv;
        this.chartsDiv = chartsDiv;
        this.solutionDrawList = solutionDrawList;
        this.errorsDiv = errorsDiv;
        this.welcomeLeftDiv = welcomeLeftDiv;
        this.instanceDetailDiv = instanceDetailDiv;
        this.instanceDraw = instanceDraw;
        this.width = 500
        this.height = 428
    }

    /**
     * Hide the solution view and show the welcome view.
     */
    hideSolutionView() {
        this.welcomeLeftDiv.style.display = 'block';
        this.welcomeDetailDiv.style.display = 'block';
        this.instanceDetailDiv.style.display = 'none';
        this.instanceDraw.style.display = 'none';
        this.solutionDetailDiv.style.display = 'none';
        this.solutionDetailValidBoxDiv.style.display = 'none';
        this.solutionDetailInvalidBoxDiv.style.display = 'none';
        this.chartsDiv.style.display = 'none';
    }

    /**
     * Hide the welcome view and show the solution view.
     */
    showSolutionView() {
        this.welcomeLeftDiv.style.display = 'none';
        this.welcomeDetailDiv.style.display = 'none';
        this.instanceDetailDiv.style.display = 'block';
        this.instanceDraw.style.display = 'block';
        this.solutionDetailDiv.style.display = 'block';
        this.chartsDiv.style.display = 'block';
    }

    /**
     * This is the main method from this class.
     * It should be triggered whenever an solution (or a lack of solution).
     * Will show the welcome view if no filename and content be passed.
     * Will show the solution view in other case.
     *
     * @param filename              - The filename;
     * @param content               - The file's content;
     * @returns {Promise<void>}     - A promise;
     */
    async render(filename, content) {
        if ((filename === undefined || filename.length === 0) && (content === undefined || content.length === 0)) {
            this.hideSolutionView();
            return;
        }
        this.showSolutionView();

        this.solution = parseSolution(filename, content);
        const instanceId = this.extractInstanceId(filename);
        this.instance = await this.fetchInstance(instanceId);
        this.errors = validateSolution(this.instance, this.solution);
        this.draw();
    };

    /**
     * Extracts the instance-id from some text. For example out_S_abs5_2_L3.txt will return S_abs5_2_L3.
     *
     * @param {string} text     - The input text. Should be the filename;
     * @returns {string|null}   - Returns the instance id if it valid, or null in other case;
     */
    extractInstanceId(text) {
        if (!text) {
            return null;
        }

        const match = text.match(/.*([L|S]_abs\d+n\d+_\d_[L|H]\d*).*/i);
        if (!match) {
            return null;
        }

        return match[1];
    }

    /**
     * Will ask the server for the instance.
     *
     * @param instanceId                        - The instance-id;
     * @returns {Promise<Instance|ErrorResponse>}    - Returns a promise with the instance, or an error;
     */
    async fetchInstance(instanceId) {
        let response;
        /** @type Instance|ErrorResponse */
        let json;
        try {
            response = await fetch("api/instance/" + instanceId)
            json = await response.json();
        } catch (er) {
            throw new Error("Could not fetch " + instanceId);
        }
        if (response.status !== 200) {
            throw new Error(json.detail);
        }
        return json;
    }

    /**
     * Will draw the charts and de detailed information on each HTML object. Should be called after the initialization
     * or nothing will happen.
     */
    draw() {
        if (!this.chartsDiv || !this.instance || !this.solution) {
            return;
        }

        let instanceDetailHtml = '';
        instanceDetailHtml += `<li>Number of Customers (n): <span>${this.instance.n}</span></li>`;
        instanceDetailHtml += `<li>Maximum Number of Vehicles (K): <span>${this.instance.K}</span></li>`;
        instanceDetailHtml += `<li>Periods (T): <span>${this.instance.T}</span></li>`;
        instanceDetailHtml += `<li>Vehicle Capacity (Q): <span>${this.instance.Q}</span></li>`;
        this.instanceDetailDiv.innerHTML = `<ul>${instanceDetailHtml}</ul>`;

        this.drawInstance(this.instance.instanceId, this.instanceDraw, this.instance.nodes);

        let detailHtml = '';
        detailHtml += `<li>Transportation cost: <span>${this.solution.transportationCost}</span></li>`;
        const inventoryCost = this.solution.depotCost + this.solution.customerCost;

        detailHtml += `<li>Inventory cost (depot + customer): <span>${inventoryCost.toFixed(2)} (${this.solution.depotCost} + ${this.solution.customerCost})</span></li>`;
        detailHtml += `<li>Cost: <span>${this.solution.totalCost}</span></li>`;
        detailHtml += `<li>Time(s): <span>${this.solution.timeInSeconds}</span></li>`;
        this.solutionDetailDiv.innerHTML = `<ul>${detailHtml}</ul>`;

        this.solutionDrawList.forEach(div => div.style.display = 'none');

        // handle the instances where includes costs from T0
        const inventoryCostInT0Error = this.errors.includes(INVENTORY_COST_IN_T0_ERROR);
        if (inventoryCostInT0Error) {
            // removes this error from list, and try to give a chance to only shows a warning box
            this.errors = this.errors.filter(error => error !== INVENTORY_COST_IN_T0_ERROR);
        }

        if (this.errors.length > 0) {
            this.solutionDetailInvalidBoxDiv.style.display = 'block';
            this.solutionDetailValidBoxDiv.style.display = 'none';
            this.solutionDetailValidT0BoxDiv.style.display = 'none';
            let errorsHtml = '';
            for (const error of this.errors) {
                errorsHtml += `<li>${error}</li>`;
            }
            this.errorsDiv.innerHTML = `<ul>${errorsHtml}</ul>`;
            this.errorsDiv.style.display = 'block';
        } else {
            this.solutionDetailInvalidBoxDiv.style.display = 'none';
            // if this solution is valid (no error) but we found that it was counting the inventory cost in T0
            if (inventoryCostInT0Error) {
                this.solutionDetailValidBoxDiv.style.display = 'none';
                this.solutionDetailValidT0BoxDiv.style.display = 'block';
            } else {
                this.solutionDetailValidBoxDiv.style.display = 'block';
                this.solutionDetailValidT0BoxDiv.style.display = 'none';
            }
            this.errorsDiv.innerHTML = ``;
            this.errorsDiv.style.display = 'none';
        }

        const inventoryByNodeByPeriod = getInventoryByNodeByPeriod(this.instance, this.solution);
        for (let t = 0; t < this.instance.T; t++) {
            const area = this.solutionDrawList[t];
            area.style.display = 'inline-block';
            this.drawSolutionAtPeriod(t + 1, area, this.instance.nodes,
                this.solution.routesByPeriod[t], this.solution.deliveriesByPeriod[t],
                inventoryByNodeByPeriod[t]);
        }
    }

    /**
     * A helper method that will draw one solution for some period.
     *
     * @param {int} period                  - The period from this solution;
     * @param {HTMLElement} area            - The HTML object that will be used as canvas for Google Charts lib;
     * @param {Array<Node>} nodes           - The list of nodes;
     * @param {Array<int[]>} routes         - The list of routes
     * @param {Array<Number[]>} deliveries  - The list of deliveries;
     * @param {Number[]} inventory          - The list of the total inventory on each node;
     */
    drawSolutionAtPeriod(period, area, nodes, routes, deliveries, inventory) {
        if (routes.length === 0) {
            const options = {
                title: `Period ${period}`,
                width: this.width,
                height: this.height,
                vAxis: {viewWindow: {min: this.viewWindowMin, max: this.viewWindowMax} },
                hAxis: {viewWindow: {min: this.viewWindowMin, max: this.viewWindowMax} },
                legend: 'true',
                displayAnnotations: true,
                pointSize: 2
            };
            let data;
            data = new google.visualization.DataTable({
                cols: [{label: 'x', type: 'number'},
                    {type: 'number', role: 'tooltip'},
                    {label: '', type: 'number'},
                    {role: 'tooltip', type: 'string'}
                ]
            });
            const instanceChart = new google.visualization.ScatterChart (area);
            instanceChart.draw(data, options);
            return;
        }

        const cols = [];
        cols.push({type:'number', label:'x'}); //col 0
        for (let i = 0; i < routes.length; i++) {
            cols.push( {type:'number', label:`Route ${i+1}`});
            cols.push( {type:'string', role:'tooltip'});
            cols.push( {type:'boolean', role:'certainty'});
        }

        const data = new google.visualization.DataTable({
            cols: cols
        });

        let row = -1;
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            const leftPadding = (3 * i) + 1;
            data.addRows(route.length);
            for (const nodeId of route) {
                row++;
                let column = leftPadding;

                const isDepot = nodeId === 0;
                const label = isDepot ?
                    `Route: ${i+1} | Depot | Inventory: ${inventory[0]}` :
                    `Route: ${i+1} | Customer: ${nodeId} | Inventory: ${inventory[nodeId]}`;
                const certainty = !isDepot;

                data.setCell(row, 0, nodes[nodeId].x);
                data.setCell(row, column++, nodes[nodeId].y);
                data.setCell(row, column++, label);
                data.setCell(row, column++, certainty);
            }
        }

        let options = {
            title: `Period ${period}`,
            width: this.width,
            height: this.height,
            vAxis: {viewWindow: {min: this.viewWindowMin, max: this.viewWindowMax} },
            hAxis: {viewWindow: {min: this.viewWindowMin, max: this.viewWindowMax} },
            legend:'true',
            annotationsWidth: 5,
            displayAnnotations: true,
            pointSize: 5
        };

        const solutionAtPeriodChart = new google.visualization.LineChart (area);
        solutionAtPeriodChart.draw(data, options);
    }

    /**
     * A helper method that will draw a instance.
     *
     * @param {string} instanceId   - The instance-id;
     * @param {HTMLElement} area    - The HTML object that will be used as canvas for Google Charts lib;
     * @param {Array<Node>} nodes   - The list of nodes;
     */
    drawInstance(instanceId, area, nodes) {
        if (!area || !nodes) {
            return;
        }

        // const data = google.visualization.arrayToDataTable([["x","y"]].concat(nodes));
        const data = new google.visualization.DataTable({
            cols: [
                {label: 'x', type: 'number'},
                {label: 'depot', type: 'number'},
                {role:'tooltip', type:'string',},
                {label: 'customers', type: 'number'},
                {role:'tooltip', type: 'string'}
            ]});

        const rows = [];
        for (const node of nodes) {
            const isDepot = node.id === 0;
            if (isDepot) {
                rows.push([node.x, node.y, `Depot`, null, null]);
            } else {
                rows.push([node.x, null, null, node.y, `Customer: ${node.id}`]);
            }
        }
        data.addRows(rows);

        const options = {
            title: `${instanceId}`,
            width: this.width,
            height: this.height,
            vAxis: {viewWindow: {min: this.viewWindowMin, max: this.viewWindowMax} },
            hAxis: {viewWindow: {min: this.viewWindowMin, max: this.viewWindowMax} },
            legend: {position: 'bottom'},
            annotationsWidth: 1,
            displayAnnotations: false,
            pointSize: 5
        };
        const instanceChart = new google.visualization.ScatterChart (area);
        instanceChart.draw(data, options);
    }

}
