import { execSync } from 'child_process';

execSync('node bpkg.js');

execSync('cd ../ && npx rollup -c');

execSync('node copy.js');
