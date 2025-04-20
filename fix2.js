const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'dist/websocket/websocket.gateway.js');
let content = fs.readFileSync(filePath, 'utf8');

// Add payload check
content = content.replace(
  /async handleChatMessage\(client, payload\) {\s+try {/g,
  'async handleChatMessage(client, payload) {\n    try {\n      // Check if payload exists\n      if (!payload) {\n        this.logger.error("Received undefined payload from client");\n        client.emit("error", {\n          message: "Invalid request: payload is missing",\n        });\n        return;\n      }\n'
);

// Add prompt check
content = content.replace(
  /try { const promptPreview = typeof payload\.prompt === "string" \? \(payload\.prompt\.substring\(0, 50\) \+ "\.\.\."\) : "undefined"; this\.logger\.log\(`Received message from client \${client\.id}: \${promptPreview}`\); } catch\(e\) { this\.logger\.warn\("Error logging message"\); }/g,
  'try { const promptPreview = typeof payload.prompt === "string" ? (payload.prompt.substring(0, 50) + "...") : "undefined"; this.logger.log(`Received message from client ${client.id}: ${promptPreview}`); } catch(e) { this.logger.warn("Error logging message"); }\n\n      // Check if prompt is provided\n      if (!payload.prompt) {\n        this.logger.warn(`Client ${client.id} sent a message without a prompt`);\n        client.emit("error", {\n          message: "Invalid request: prompt is required",\n        });\n        return;\n      }'
);

// Update service calls
content = content.replace(
  /if \(payload\.useRag\) {\s+response = await this\.ragService\.query\(payload\.prompt\);/g,
  'if (payload.useRag) {\n        response = await this.ragService.query(typeof payload.prompt === "string" ? payload.prompt : "");'
);

content = content.replace(
  /} else {\s+response = await this\.llamaService\.getCompletion\(payload\.prompt\);/g,
  '} else {\n        response = await this.llamaService.getCompletion(typeof payload.prompt === "string" ? payload.prompt : "");'
);

// Update error handling
content = content.replace(
  /} catch \(error\) {\s+this\.logger\.error\(`Error processing WebSocket message: \${error\.message}`.*\s+client\.emit\('error', {\s+message: 'Failed to process your request',\s+error: error\.message,/g,
  '} catch (error) {\n      const errorMessage = error && typeof error === "object" && "message" in error \n        ? String(error.message) \n        : "Unknown error";\n      \n      const errorStack = error && typeof error === "object" && "stack" in error \n        ? String(error.stack) \n        : "";\n      \n      this.logger.error(`Error processing WebSocket message: ${errorMessage}`, errorStack);\n      client.emit("error", {\n        message: "Failed to process your request",\n        error: errorMessage,'
);

fs.writeFileSync(filePath, content);
console.log('Additional fixes applied successfully'); 