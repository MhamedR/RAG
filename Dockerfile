FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies and explicitly install axios
RUN npm install && npm install axios@latest

# Copy application source
COPY . .

# Build application
RUN npm run build

# Create uploads directory for document storage
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["npm", "run", "start:prod"] 