const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'dist/websocket/websocket.gateway.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic line
content = content.replace(
  /this\.logger\.log\(`Received message from client \${client\.id}: \${payload\.prompt\.substring\(0, 50\)}\.\.\.`\);/g,
  'try { const promptPreview = typeof payload.prompt === "string" ? (payload.prompt.substring(0, 50) + "...") : "undefined"; this.logger.log(`Received message from client ${client.id}: ${promptPreview}`); } catch(e) { this.logger.warn("Error logging message"); }'
);

fs.writeFileSync(filePath, content);
console.log('File updated successfully'); 