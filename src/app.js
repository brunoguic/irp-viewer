import express from 'express';
import {InstanceController} from './instance-controller.js';
const app = express()
const port = 3000

const instanceController = new InstanceController();

// static files folder
app.use(express.static('public', {
    etag: true, // Just being explicit about the default.
    lastModified: true,  // Just being explicit about the default.
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            // All of the project's HTML files end in .html
            res.setHeader('Cache-Control', 'no-cache');
        }
    },
}));

app.get('/api/instance/:instanceId', (req, res) => {
    let instanceId = req.params["instanceId"];

    try {
        instanceController.getInstance(instanceId, res);
    } catch (err) {
        res.status(500);
        res.json({success: false, detail: err.message});
    }
    res.end();
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})