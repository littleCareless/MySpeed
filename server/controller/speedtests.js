const tests = require('../models/Speedtests');
const {Op, Sequelize} = require("sequelize");
const {mapFixed, mapRounded} = require("../util/helpers");

module.exports.create = async (ping, download, upload, time, serverId, type = "auto", resultId = null, error = null, jitter = null) => {
    return (await tests.create({ping, jitter, download, upload, error, serverId, type, resultId, time, created: new Date().toISOString()})).id;
}

module.exports.getOne = async (id) => {
    let speedtest = await tests.findByPk(id);
    if (speedtest === null) return null;
    if (speedtest.error === null) delete speedtest.error;
    return speedtest
}

module.exports.listAll = async () => {
    let dbEntries = await tests.findAll({order: [["created", "DESC"]]});
    for (let dbEntry of dbEntries) {
        if (dbEntry.error === null) delete dbEntry.error;
        if (dbEntry.resultId === null) delete dbEntry.resultId;
    }

    return dbEntries;
}

module.exports.listTests = async (afterId, limit) => {
    limit = parseInt(limit) || 10;

    let whereClause = {};
    
    if (afterId) whereClause.id = {[Op.lt]: afterId};

    let dbEntries = await tests.findAll({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined, 
        order: [["created", "DESC"]], 
        limit
    });

    for (let dbEntry of dbEntries) {
        if (dbEntry.error === null) delete dbEntry.error;
        if (dbEntry.resultId === null) delete dbEntry.resultId;
    }

    return dbEntries;
}

module.exports.deleteTests = async () => {
    await tests.destroy({where: {}});
    return true;
}

module.exports.importTests = async (data) => {
    if (!Array.isArray(data)) return false;

    for (let entry of data) {
        if (entry.error === null) delete entry.error;
        if (entry.resultId === null) delete entry.resultId;

        if (!["custom", "auto"].includes(entry.type)) continue;
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(entry.created)) continue;

        try {
            console.log(entry)
            await tests.create(entry);
        } catch (e) {
        }
    }

    return true;
}

module.exports.listStatistics = async (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    
    const dbEntries = (await tests.findAll({order: [["created", "DESC"]]}))
        .filter((entry) => {
            const entryDate = new Date(entry.created);
            return entryDate >= from && entryDate <= to;
        });

    let notFailed = dbEntries.filter((entry) => entry.error === null);

    const daysDiff = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
    const dataPointCount = notFailed.length;

    const MAX_CHART_POINTS = 100;
    
    let aggregationType = 'none';
    if (dataPointCount > MAX_CHART_POINTS) {
        if (daysDiff > 180 || dataPointCount > MAX_CHART_POINTS * 10) {
            aggregationType = 'weekly';
        } else if (daysDiff > 7 || dataPointCount > MAX_CHART_POINTS * 3) {
            aggregationType = 'daily';
        } else {
            aggregationType = 'hourly';
        }
    }

    let data = {};
    ["ping", "jitter", "download", "upload", "time"].forEach(item => {
        data[item] = notFailed.map(entry => entry[item]);
    });

    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = { download: [], upload: [], ping: [], jitter: [] };
    }
    
    notFailed.forEach(entry => {
        const hour = new Date(entry.created).getHours();
        hourlyData[hour].download.push(entry.download);
        hourlyData[hour].upload.push(entry.upload);
        hourlyData[hour].ping.push(entry.ping);
        if (entry.jitter !== null) hourlyData[hour].jitter.push(entry.jitter);
    });

    const hourlyAverages = Object.keys(hourlyData).map(hour => ({
        hour: parseInt(hour),
        download: hourlyData[hour].download.length > 0 
            ? parseFloat((hourlyData[hour].download.reduce((a, b) => a + b, 0) / hourlyData[hour].download.length).toFixed(2))
            : null,
        upload: hourlyData[hour].upload.length > 0
            ? parseFloat((hourlyData[hour].upload.reduce((a, b) => a + b, 0) / hourlyData[hour].upload.length).toFixed(2))
            : null,
        ping: hourlyData[hour].ping.length > 0
            ? Math.round(hourlyData[hour].ping.reduce((a, b) => a + b, 0) / hourlyData[hour].ping.length)
            : null,
        jitter: hourlyData[hour].jitter.length > 0
            ? parseFloat((hourlyData[hour].jitter.reduce((a, b) => a + b, 0) / hourlyData[hour].jitter.length).toFixed(2))
            : null,
        count: hourlyData[hour].download.length
    }));

    const calcStdDev = (arr) => {
        if (arr.length < 2) return 0;
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length);
    };

    const downloadValues = notFailed.map(e => e.download);
    const uploadValues = notFailed.map(e => e.upload);
    const pingValues = notFailed.map(e => e.ping);

    const downloadMean = downloadValues.length > 0 ? downloadValues.reduce((a, b) => a + b, 0) / downloadValues.length : 0;
    const uploadMean = uploadValues.length > 0 ? uploadValues.reduce((a, b) => a + b, 0) / uploadValues.length : 0;

    const consistency = {
        download: {
            stdDev: parseFloat(calcStdDev(downloadValues).toFixed(2)),
            consistency: downloadMean > 0 ? parseFloat((100 - (calcStdDev(downloadValues) / downloadMean * 100)).toFixed(1)) : 100
        },
        upload: {
            stdDev: parseFloat(calcStdDev(uploadValues).toFixed(2)),
            consistency: uploadMean > 0 ? parseFloat((100 - (calcStdDev(uploadValues) / uploadMean * 100)).toFixed(1)) : 100
        },
        ping: {
            stdDev: parseFloat(calcStdDev(pingValues).toFixed(2)),
            jitter: parseFloat(calcStdDev(pingValues).toFixed(2))
        }
    };

    let chartData = data;
    let chartLabels = notFailed.map((entry) => new Date(entry.created).toISOString());
    
    if (aggregationType !== 'none' && notFailed.length > 0) {
        const aggregated = {};
        
        notFailed.forEach(entry => {
            const date = new Date(entry.created);
            let key;
            
            if (aggregationType === 'weekly') {
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const weekStart = new Date(date);
                weekStart.setDate(diff);
                key = weekStart.toISOString().split('T')[0];
            } else if (aggregationType === 'daily') {
                key = date.toISOString().split('T')[0];
            } else {
                key = date.toISOString().substring(0, 13);
            }
            
            if (!aggregated[key]) {
                aggregated[key] = { ping: [], jitter: [], download: [], upload: [], time: [], count: 0 };
            }
            
            aggregated[key].ping.push(entry.ping);
            if (entry.jitter !== null) aggregated[key].jitter.push(entry.jitter);
            aggregated[key].download.push(entry.download);
            aggregated[key].upload.push(entry.upload);
            aggregated[key].time.push(entry.time);
            aggregated[key].count++;
        });

        const sortedKeys = Object.keys(aggregated).sort((a, b) => new Date(a) - new Date(b));
        
        chartLabels = sortedKeys.map(key => {
            if (aggregationType === 'hourly') {
                return new Date(key + ':00:00.000Z').toISOString();
            }
            return new Date(key).toISOString();
        });
        chartData = {
            ping: sortedKeys.map(key => Math.round(aggregated[key].ping.reduce((a, b) => a + b, 0) / aggregated[key].ping.length)),
            jitter: sortedKeys.map(key => aggregated[key].jitter.length > 0 ? parseFloat((aggregated[key].jitter.reduce((a, b) => a + b, 0) / aggregated[key].jitter.length).toFixed(2)) : null),
            download: sortedKeys.map(key => parseFloat((aggregated[key].download.reduce((a, b) => a + b, 0) / aggregated[key].download.length).toFixed(2))),
            upload: sortedKeys.map(key => parseFloat((aggregated[key].upload.reduce((a, b) => a + b, 0) / aggregated[key].upload.length).toFixed(2))),
            time: sortedKeys.map(key => Math.round(aggregated[key].time.reduce((a, b) => a + b, 0) / aggregated[key].time.length))
        };
    }

    return {
        tests: {
            total: dbEntries.length,
            failed: dbEntries.length - notFailed.length
        },
        ping: mapRounded(notFailed, "ping"),
        jitter: mapFixed(notFailed.filter(e => e.jitter !== null), "jitter"),
        download: mapFixed(notFailed, "download"),
        upload: mapFixed(notFailed, "upload"),
        time: mapRounded(notFailed, "time"),
        data: chartData,
        labels: chartLabels,
        hourlyAverages,
        consistency,
        aggregated: aggregationType !== 'none',
        aggregationType,
        dateRange: {
            from: fromDate,
            to: toDate,
            days: daysDiff
        }
    };
}

module.exports.deleteOne = async (id) => {
    if (await this.getOne(id) === null) return false;
    await tests.destroy({where: {id: id}});
    return true;
}

module.exports.removeOld = async () => {
    await tests.destroy({
        where: {
            created: process.env.DB_TYPE === "mysql"
                ? {[Op.lte]: new Date(new Date().getTime() - 30 * 24 * 3600000)} // MySQL
                : {[Op.lte]: Sequelize.literal(`datetime('now', '-30 days')`)} // SQLite
        }
    });
    return true;
}

module.exports.getLatest = async () => {
    let latest = await tests.findOne({order: [["created", "DESC"]]});
    if (latest === null) return undefined;
    if (latest.error === null) delete latest.error;
    if (latest.resultId === null) delete latest.resultId;
    return latest;
}