const {spawn} = require('child_process');
const interfaces = require('../util/loadInterfaces');
const config = require('../controller/config');

module.exports = async (mode, serverId) => {
    const binaryPath = mode === "ookla" ? './bin/speedtest' + (process.platform === "win32" ? ".exe" : "")
        : mode === "libre" ? './bin/librespeed-cli' + (process.platform === "win32" ? ".exe" : "")
            : './bin/cfspeedtest' + (process.platform === "win32" ? ".exe" : "");

    if (!interfaces.interfaces) throw new Error("No interfaces found");

    const currentInterface = await config.getValue("interface");
    const interfaceIp = interfaces.interfaces[currentInterface];

    const startTime = new Date().getTime();
    let args;

    if (mode === "ookla") {
        args = ['--accept-license', '--accept-gdpr', '--format=json'];

        if (process.platform === "win32") {
            args.push('--ip=' + interfaceIp);
        } else {
            args.push('--interface=' + currentInterface);
        }

        if (serverId) args.push(`--server-id=${serverId}`);
    } else if (mode === "libre") {
        args = ['--json', '--duration=5', '--source=' + interfaceIp];
        if (serverId) args.push(`--server=${serverId}`);
    } else if (mode === "cloudflare") {
        args = ['--output-format=json'];

        if (interfaceIp.includes(':')) {
            args.push('--ipv6=' + interfaceIp);
        } else {
            args.push('--ipv4=' + interfaceIp);
        }
    }

    let result = {};
    let stdout = '';

    const testProcess = spawn(binaryPath, args, {windowsHide: true});

    testProcess.stderr.on('data', (buffer) => {
        result.error = buffer.toString();
        if (buffer.toString().includes("Too many requests")) {
            result.error = "Too many requests. Please try again later";
        }
    });

    testProcess.stdout.on('data', (buffer) => {
        stdout += buffer.toString();
    });

    await new Promise((resolve, reject) => {
        testProcess.on('error', e => reject({message: e}));
        testProcess.on('exit', () => {
            if (stdout.trim()) {
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    if (!(line.startsWith("{") || line.startsWith("["))) continue;

                    let data = {};
                    try {
                        data = JSON.parse(line);
                        if (line.startsWith("[") && mode !== "cloudflare") data = data[0];
                    } catch (e) {
                        data.error = e.message;
                        console.error("JSON parse error:", e.message, "Line:", line);
                        continue;
                    }

                    if (data.error) result.error = data.error;

                    if ((mode === "ookla" && data.type === "result") || mode === "libre" || mode === "cloudflare") {
                        result = data;
                    }
                }
            }
            resolve();
        });
    });

    if (result.error) throw new Error(result.error);
    return {...result, elapsed: new Date().getTime() - startTime};
}