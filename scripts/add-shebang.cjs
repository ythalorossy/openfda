#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildPath = path.join(__dirname, '../build/index.js');
const shebang = '#!/usr/bin/env node\n';

let content = fs.readFileSync(buildPath, 'utf8');
if (!content.startsWith(shebang)) {
  content = shebang + content;
  fs.writeFileSync(buildPath, content, 'utf8');
} 