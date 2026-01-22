import express from 'express';
import * as tests from '../controller/speedtests.js';
import * as pauseController from '../controller/pause.js';
import * as config from '../controller/config.js';
import * as testTask from '../tasks/speedtest.js';
import password from '../middlewares/password.js';

const app = express.Router();

app.get("/", password(true), async (req, res) => {
    if (req.query.limit && /[^0-9]/.test(req.query.limit))
        return res.status(400).json({message: "You need to provide a correct number in the limit parameter"});

    if (req.query.afterId && /[^0-9]/.test(req.query.afterId))
        return res.status(400).json({message: "You need to provide a correct number in the afterId parameter"});

    res.json(await tests.listTests(req.query.afterId, req.query.limit));
});

app.get("/statistics", password(true), async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ message: "Both 'from' and 'to' date parameters are required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
        return res.status(400).json({ message: "Invalid 'from' date format. Use YYYY-MM-DD" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return res.status(400).json({ message: "Invalid 'to' date format. Use YYYY-MM-DD" });
    }
    
    res.json(await tests.listStatistics(from, to));
});

app.post("/run", password(false), async (req, res) => {
    if (pauseController.currentState) return res.status(410).json({message: "The speedtests are currently paused"});
    if (await config.getValue("provider") === "none") return res.status(410).json({message: "No provider selected"});
    let speedtest = await testTask.create("custom");
    if (speedtest !== undefined) return res.status(409).json({message: "An speedtest is already running"});
    res.json({message: "Speedtest successfully created"});
});

app.get("/status", password(true), (req, res) => {
    res.json({paused: pauseController.currentState, running: testTask.isRunning()});
});

app.post("/pause", password(false), (req, res) => {
    if (!req.body.resumeIn) return res.status(400).json({message: "You need to provide when to resume"});

    if (req.body.resumeIn === -1) {
        pauseController.updateState(true);
    } else if (!pauseController.resumeIn(req.body.resumeIn)) {
        return res.status(400).json({message: "You need to provide when to resume"});
    }

    res.json({message: "Successfully paused the speedtests"});
});

app.post("/continue", password(false), (req, res) => {
    pauseController.updateState(false);
    res.json({message: "Successfully resumed the speedtests"});
});

app.get("/:id", password(true), async (req, res) => {
    let test = await tests.getOne(req.params.id);
    if (test === null) return res.status(404).json({message: "Speedtest not found"});
    res.json(test);
});

app.delete("/:id", password(false), async (req, res) => {
    let test = await tests.deleteOne(req.params.id);
    if (!test) return res.status(404).json({message: "Speedtest not found"});
    res.json({message: "Successfully deleted the provided speedtest"});
});

export default app;