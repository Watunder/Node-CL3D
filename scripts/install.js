import fs from 'fs';

const downloadList = [
    {
        publicCDN: {
            'spector.bundle.js': 'https://cdn.jsdelivr.net/npm/spectorjs@0.9.30/dist/spector.bundle.js'
        }
    }
]

downloadList.some(({ publicCDN }) => {
    Object.keys(publicCDN).forEach(async (file) => {
        const url = publicCDN[file];

        if (!fs.existsSync(`../dist/${file}`)) {

            console.log('downloaded', url);
            const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'text/plain' } });
            const data = await response.text();

            fs.writeFileSync(`../dist/${file}`, data, { encoding: 'utf-8' });
        }
    })
});
