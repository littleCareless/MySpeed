const speedTest = require('../util/speedtest');
const tests = require('../controller/speedtests');
const config = require('../controller/config');
const controller = require("../controller/recommendations");
const parseData = require('../util/providers/parseData');
let {setState, sendRunning, sendError, sendFinished} = require("./integrations");
const serverController = require("../controller/servers");

let isRunning = false;

const setRunning = (running, sendRequest = true) => {
    isRunning = running;

    if (running) {
        setState("running");
        if (sendRequest) sendRunning().then(undefined);
    } else {
        setState("ping");
    }
}

const createRecommendations = async () => {
    let list = (await tests.listTests()).filter((entry) => !entry.error);
    if (list.length >= 10) {
        let recommendations = {ping: 1000, down: 0, up: 0};
        for (let i = 0; i < 10; i++) {
            if (list[i].ping < recommendations["ping"]) recommendations["ping"] = list[i].ping;
            if (list[i].download > recommendations["down"]) recommendations["down"] = list[i].download;
            if (list[i].upload > recommendations["up"]) recommendations["up"] = list[i].upload;
        }

        await controller.update(recommendations["ping"], recommendations["down"], recommendations["up"]);
    }
}

module.exports.run = async (retryAuto = false) => {
    setRunning(true);
    let mode = await config.getValue("provider");

    if (mode === "none") {
        setRunning(false);
        throw {message: "No provider selected"};
    }

    let serverId = mode === "cloudflare" ? 0 : await config.getValue(mode + "Id");
    let serverUrl = mode === "libre" ? await config.getValue("libreUrl") : undefined;

    if (serverId === "none")
        serverId = undefined;
    
    if (serverUrl === "none")
        serverUrl = undefined;

    if (mode === "libre" && serverUrl)
        serverId = undefined;

    let speedtest = await (retryAuto ? speedTest(mode) : speedTest(mode, serverId, serverUrl));

    if (mode === "ookla" && speedtest.server) {
        if (serverId === undefined) await config.updateValue("ooklaId", speedtest.server?.id);
        serverId = speedtest.server?.id;
    }

    if (mode === "libre" && speedtest.server && !serverUrl) {
        let serverEntry = Object.entries(serverController.getLibreServers())
            .filter(([, value]) => value === speedtest.server.name)[0];

        if (serverEntry) {
            if (serverId === undefined) await config.updateValue("libreId", serverEntry[0]);
            serverId = parseInt(serverEntry[0]);
        }
    }

    if (Object.keys(speedtest).length <= 1) throw {message: "No response, even after trying again, test timed out."};

    return {...speedtest, serverId}
}

module.exports.create = async (type = "auto", retried = false) => {
    const mode = await config.getValue("provider");
    if (mode === "none") return 400;
    if (isRunning && !retried) return 500;

    try {
        let test;
        if (process.env.PREVIEW_MODE === "true") {
            await new Promise(resolve => setTimeout(resolve, 5000));
            test = {
                ping: {latency: Math.floor(Math.random() * 25) + 5, jitter: Math.random() * 5 + 0.5},
                download: {bandwidth: 125 * 100000 * (Math.random() + 0.5), elapsed: 10000},
                upload: {bandwidth: 125 * 100000 * (Math.random() + 0.5), elapsed: 10000},
            }
        } else {
            test = await this.run(retried);
        }

        let {ping, jitter, download, upload, time, resultId} = await parseData.parseData(process.env.PREVIEW_MODE === "true" ?
            "ookla" : mode, test);

        let testResult = await tests.create(ping, download, upload, time, test.serverId, type, resultId, null, jitter);
        console.log(`Test #${testResult} was executed successfully in ${time}s. 🏓 ${ping} (±${jitter || 'N/A'}) ⬇ ${download}️ ⬆ ${upload}️`);
        createRecommendations().then(() => "");
        setRunning(false);
        sendFinished({ping, jitter, download, upload, time}).then(() => "");
    } catch (e) {
        console.log(e)
        if (!retried) return this.create(type, true);
        let testResult = await tests.create(-1, -1, -1, null, 0, type, null, e.message);
        await sendError(e.message);
        setRunning(false, false);
        console.log(`Test #${testResult} was not executed successfully. Please try reconnecting to the internet or restarting the software: ` + e.message);
    }
}

module.exports.isRunning = () => isRunning;

module.exports.removeOld = async () => {
    await tests.removeOld();
}