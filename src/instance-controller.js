import fs from 'fs';
import {parseInstance} from './dimacs-instance-reader.js';

/**
 * @typedef {import('express').Response} Response
 */

export class InstanceController {

    /**
     *
     * @param instanceId
     * @param {Response} res
     */
    getInstance(instanceId, res) {
        instanceId = instanceId.toUpperCase();
        instanceId = instanceId.replace("ABS", "abs");
        instanceId = instanceId.replace("N", "n");

        const path = new URL(`../public/instances/${instanceId}.dat`, import.meta.url);
        if (!fs.existsSync(path)) {
            res.status(404);
            res.json({success: false, detail: "Could not find instance " + instanceId});
            return;
        }

        const data = fs.readFileSync(path, 'utf8').toString();
        const instance = parseInstance(instanceId, data);
        res.status(200);
        res.json(instance);
    }


}