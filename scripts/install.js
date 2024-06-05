import fs from 'fs';
import { execSync } from 'child_process';

const downloadList = [
    {
        publicCDN: {
            'spector.bundle.js': 'https://cdn.jsdelivr.net/npm/spectorjs@0.9.30/dist/spector.bundle.js'
        }
    }
]

downloadList.some(({ publicCDN }) => {
    Object.keys(publicCDN).forEach(async (bundle) => {
        const url = publicCDN[bundle];

        if (!fs.existsSync(`../dist/${bundle}`)) {

            console.log('downloading', url);
            const response = await fetch(url);
            const data = await response.text();

            fs.writeFileSync(`../dist/${bundle}`, data, { encoding: 'utf-8' });
        }
    })
});

console.log('building...');
execSync('cd ../ && npx rollup -c');