const roundSpeed = (bandwidth) => {
    return Math.round(bandwidth / 1250) / 100;
}

module.exports.parseOokla = (test) => {
    let ping = Math.round(test.ping.latency);
    let download = roundSpeed(test.download.bandwidth);
    let upload = roundSpeed(test.upload.bandwidth);
    let time = Math.round((test.download.elapsed + test.upload.elapsed) / 1000);

    return {ping, download, upload, time, resultId: test.result?.id};
}

module.exports.parseLibre = (test) => ({...test, ping: Math.round(test.ping), time: Math.round(test.elapsed / 1000),
    resultId: null});

module.exports.parseCloudflare = (test) => {
    if (test && test.latency_measurement && test.speed_measurements) {
        const downloadTests = test.speed_measurements.filter(t => t.test_type === "Download");
        const uploadTests = test.speed_measurements.filter(t => t.test_type === "Upload");

        const downloadSpeeds = downloadTests.map(t => t.max || t.median || 0);
        const download = downloadSpeeds.length > 0 ? Math.max(...downloadSpeeds) : 0;

        const uploadSpeeds = uploadTests.map(t => t.max || t.median || 0);
        const upload = uploadSpeeds.length > 0 ? Math.max(...uploadSpeeds) : 0;

        const ping = Math.round(test.latency_measurement.avg_latency_ms || 0);

        const time = Math.round((test.elapsed || 30000) / 1000);
        
        return {ping, download: parseFloat(download.toFixed(2)),
            upload: parseFloat(upload.toFixed(2)), time, resultId: null};
    }

    return {ping: 0, download: 0, upload: 0, time: 0, resultId: null};
};

module.exports.parseData = (provider, data) => {
    switch (provider) {
        case "ookla":
            return this.parseOokla(data);
        case "libre":
            return this.parseLibre(data);
        case "cloudflare":
            return this.parseCloudflare(data);
        default:
            throw {message: "Invalid provider"};
    }
}