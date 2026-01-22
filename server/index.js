import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as timerTask from './tasks/timer.js';
import * as integrationTask from './tasks/integrations.js';
import './util/createFolders.js';
import './util/loadServers.js';
import errorHandler from './util/errorHandler.js';
import errorMiddleware from './middlewares/error.js';
import configRoutes from './routes/config.js';
import speedtestsRoutes from './routes/speedtests.js';
import systemRoutes from './routes/system.js';
import storageRoutes from './routes/storage.js';
import recommendationsRoutes from './routes/recommendations.js';
import nodesRoutes from './routes/nodes.js';
import integrationsRoutes from './routes/integrations.js';
import prometheusRoutes from './routes/prometheus.js';
import opengraphRoutes from './routes/opengraph.js';
import db from './config/database.js';
import * as config from './controller/config.js';
import { initialize as initializeIntegrations } from './controller/integrations.js';
import { requestInterfaces } from './util/loadInterfaces.js';
import { load as loadCli } from './util/loadCli.js';
import { removeOld } from './tasks/speedtest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devModeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width"/>
    <link rel="icon" href="https://i.imgur.com/aCmA6rH.png" type="image/png"/>
    <title>MySpeed [Dev Mode]</title>
    <style>
        body, html { font-family: sans-serif; color: #FEFEFE; background-color: #232835; padding: 0; margin: 0; height: 100vh; display: flex; justify-content: center; align-items: center; flex-direction: column; text-align: center; gap: 1rem; }
        .logo { display: flex; gap: 1rem; align-items: center; user-select: none; }
        .logo img { width: 4rem; height: 4rem; }
        .logo span { color: #3EA95A; }
        code { background-color: #1d2128; padding: 0.5rem; border-radius: 0.4rem; }
        p { margin: 0.5rem; font-size: 16pt; }
        button { background-color: #3EA95A; border: none; border-radius: 0.4rem; padding: 0.5rem 1rem; color: #1d2128; font-weight: bold; font-size: 13pt; cursor: pointer; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="logo"><img src="https://i.imgur.com/aCmA6rH.png" alt="MySpeed Logo"/><h1>MySpeed <span>Dev Mode</span></h1></div>
    <div><p>Your MySpeed instance is currently in development mode.</p><p>Please build the client or use a production binary.</p></div>
    <button onclick="window.location.href='http://localhost:5173';" class="hidden">Go to development environment</button>
    <script>fetch("http://localhost:5173").then(r=>{if(r.ok)document.querySelector("button").classList.remove("hidden");}).catch(()=>{});</script>
</body>
</html>`;

const app = express();

app.disable('x-powered-by');

const port = process.env.SERVER_PORT || 5216;

process.on('uncaughtException', err => errorHandler(err));

app.use(express.json());
app.use(errorMiddleware);

app.use("/api/config", configRoutes);
app.use("/api/speedtests", speedtestsRoutes);
app.use("/api/info", systemRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/nodes", nodesRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/prometheus", prometheusRoutes);
app.use('/api/opengraph', opengraphRoutes);
app.use("/api*all", (req, res) => res.status(404).json({message: "Route not found"}));

let buildPath = path.join(__dirname, '..', 'build');
let buildExists = fs.existsSync(buildPath);

if (!buildExists) {
    buildPath = path.join(process.cwd(), 'build');
    buildExists = fs.existsSync(buildPath);
}

if (buildExists) {
    app.use(express.static(buildPath));
    app.get('*all', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
} else {
    app.get("*all", (req, res) => res.status(500).type('html').send(devModeHtml));
}

const run = async () => {
    await db.sync({alter: true, force: false});

    await initializeIntegrations();

    await requestInterfaces();
    setInterval(() => requestInterfaces(), 3600000);

    if (process.env.PREVIEW_MODE !== "true") await loadCli();

    await config.insertDefaults();

    timerTask.startTimer(await config.getValue("cron"));
    setInterval(async () => removeOld(), 60000);

    integrationTask.startTimer();
    if (process.env.RUN_TEST_ON_STARTUP === "true") {
        timerTask.runTask().then(undefined);
    }

    app.listen(port, () => console.log(`Server listening on port ${port}`));
}

db.authenticate().then(() => {
    console.log("Successfully connected to the database " + (process.env.DB_TYPE === "mysql" ? "server" : "file"));
    run().then(undefined);
}).catch(err => {
    console.error("Could not open the database file. Maybe it is damaged?: " + err.message);
    process.exit(111);
});