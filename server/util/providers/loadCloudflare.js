const fs = require('fs');
const path = require('path');
const { get } = require('https');
const decompress = require("decompress");
const decompressTarGz = require('decompress-targz');
const decompressUnzip = require('decompress-unzip');
const { file } = require("tmp");
const binaries = require('../../config/binaries');

const binaryName = `cfspeedtest${process.platform === "win32" ? ".exe" : ""}`;
const binaryDirectory = path.join(__dirname, "../../../bin");
const binaryPath = path.join(binaryDirectory, binaryName);
const downloadBaseURL = `https://github.com/code-inflation/cfspeedtest/releases/download/v${binaries.cloudflareVersion}/`;

const binaryRegex = /cfspeedtest(.exe)?$/;

module.exports.fileExists = async () => fs.existsSync(binaryPath);

const downloadToFile = (url, destinationPath) => {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(downloadToFile(res.headers.location, destinationPath));
            }

            const writeStream = fs.createWriteStream(destinationPath);
            res.pipe(writeStream);

            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
            res.on('error', reject);
        }).on('error', reject);
    });
}

const decompressBinary = async (archivePath) => {
    await decompress(archivePath, binaryDirectory, {
        plugins: [decompressTarGz(), decompressUnzip()],
        filter: file => binaryRegex.test(file.path),
        map: file => {
            file.path = binaryName;
            return file;
        }
    });
}

module.exports.downloadFile = async () => {
    let binary = binaries.cloudflareList.find(b => b.os === process.platform && b.arch === process.arch);

    if (!binary && process.platform === 'darwin') {
        binary = binaries.cloudflareList.find(b => b.os === 'darwin' && b.arch === 'universal');
    }

    if (!binary) {
        throw new Error(`Your platform (${process.platform}-${process.arch}) is not supported by the Cloudflare CLI`);
    }

    return new Promise((resolve, reject) => {
        file({ postfix: binary.suffix }, async (err, tempPath) => {
            if (err) return reject(err);

            try {
                const fullUrl = downloadBaseURL + binary.suffix;
                await downloadToFile(fullUrl, tempPath);
                await decompressBinary(tempPath);
                resolve();
            } catch (error) {
                reject(new Error(`Failed to download and extract binary: ${error.message}`));
            }
        });
    });
};

module.exports.load = async () => {
    if (!await module.exports.fileExists()) {
        await module.exports.downloadFile();
    }
};