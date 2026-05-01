import fs from 'node:fs';
import { getJson } from './http.js';

const sources = [
    {
        file: "data/servers/ookla.json",
        url: "https://www.speedtest.net/api/js/servers?limit=20",
        format: (row) => `${row.name} (${row.distance}km)`
    },
    {
        file: "data/servers/librespeed.json",
        url: "https://librespeed.org/backend-servers/servers.php",
        format: (row) => row.name
    }
];

for (const {file, url, format} of sources) {
    if (fs.existsSync(file)) continue;

    getJson(url)
        .then((data) => {
            const servers = Object.fromEntries((data ?? []).map((row) => [row.id, format(row)]));
            fs.writeFileSync(file, JSON.stringify(servers, null, 4));
        })
        .catch(() => console.error("Could not load servers"));
}
