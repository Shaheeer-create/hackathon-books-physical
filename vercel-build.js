// vercel-build.js
// This script modifies the baseUrl for Vercel deployment

const fs = require('fs');
const path = require('path');

// Read the current config
const configPath = path.join(__dirname, 'docusaurus.config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Temporarily change the baseUrl for Vercel deployment
configContent = configContent.replace(
  /baseUrl:\s*'\/physical-ai-textbook\/'/,
  "baseUrl: '/'"
);

// Write the modified config
fs.writeFileSync(configPath, configContent);

console.log('Updated baseUrl for Vercel deployment');