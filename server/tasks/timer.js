import * as pauseController from '../controller/pause.js';
import schedule from 'node-schedule';
import { isValidCron } from "cron-validator";
import { create as createSpeedtest } from './speedtest.js';

let job;

export const startTimer = (cron) => {
    if (!isValidCron(cron)) return;
    job = schedule.scheduleJob(cron, () => runTask());
};

export const runTask = async () => {
    if (pauseController.currentState) {
        console.warn("Speedtests currently paused. Trying again later...");
        return;
    }

    await createSpeedtest("auto");
};

export const stopTimer = () => {
    if (job !== undefined) {
        job.cancel();
        job = undefined;
    }
};

export { job };