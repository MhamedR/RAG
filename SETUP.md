# Setup Guide for AI-Powered NestJS API

This guide provides detailed instructions for setting up all the necessary components of the AI-Powered NestJS API.

## Table of Contents

1. [Installing and Configuring Redis](#1-installing-and-configuring-redis-for-the-queue-system)
2. [Installing and Configuring Elasticsearch](#2-installing-and-configuring-elasticsearch-for-the-vector-store)
3. [Obtaining an OpenAI API Key](#3-obtaining-an-openai-api-key)
4. [Setting Up JWT Secrets and API Keys](#4-setting-up-jwt-secrets-and-api-keys-for-authentication)
5. [Starting the Application](#5-starting-the-application)
6. [Verifying Your Setup](#6-verifying-your-setup)
7. [Production Configuration](#7-additional-configuration-for-production)

## 1. Installing and Configuring Redis for the Queue System

Redis is essential for our application's asynchronous job processing with BullMQ.

### For macOS:

```bash
# Install Redis using Homebrew
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return "PONG"
```

### For Ubuntu/Debian:

```bash
# Update package lists
sudo apt update

# Install Redis
sudo apt install redis-server

# Configure Redis to start on boot
sudo systemctl enable redis-server

# Start Redis service
sudo systemctl start redis-server

# Check Redis status
sudo systemctl status redis-server
```

### For Windows:

1. Download the Redis Windows release from GitHub: https://github.com/microsoftarchive/redis/releases
2. Run the installer and follow the installation wizard
3. Check "Add the Redis installation folder to the PATH environment variable"
4. Start Redis server by running `redis-server` in cmd/PowerShell

### Configuring Redis in Your Application:

1. Open your `.env` file and update the Redis configuration:

```
# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Leave empty if not using authentication
```

2. For production environments, set up Redis with password authentication:

```bash
# Open Redis configuration file
sudo nano /etc/redis/redis.conf

# Find the line with #requirepass and change it to
requirepass your_strong_password

# Save and restart Redis
sudo systemctl restart redis-server
```

## 2. Installing and Configuring Elasticsearch for the Vector Store

Elasticsearch is used as our vector store for the RAG system.

### For macOS:

```bash
# Install Elasticsearch using Homebrew
brew tap elastic/tap
brew install elastic/tap/elasticsearch-full

# Start Elasticsearch service
brew services start elastic/tap/elasticsearch-full

# Verify Elasticsearch is running
curl http://localhost:9200
```

### For Ubuntu/Debian:

```bash
# Import the Elasticsearch GPG key
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg

# Add the Elasticsearch repository
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

# Update package lists
sudo apt update

# Install Elasticsearch
sudo apt install elasticsearch

# Enable and start Elasticsearch
sudo systemctl daemon-reload
sudo systemctl enable elasticsearch
sudo systemctl start elasticsearch

# Check Elasticsearch status
sudo systemctl status elasticsearch
```

### For Windows:

1. Download Elasticsearch from the official website: https://www.elastic.co/downloads/elasticsearch
2. Extract the ZIP file to a location of your choice
3. Navigate to the bin directory and run `elasticsearch.bat`
4. Verify it's running by visiting http://localhost:9200 in your browser

### Configuring Elasticsearch:

1. Open your `.env` file and update the Elasticsearch configuration:

```
# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic  # Use default or your custom username
ELASTICSEARCH_PASSWORD=your_elastic_password  # Use the password generated during installation
```

2. Important Elasticsearch security configuration for production:

```bash
# Generate passwords for built-in users (for new installations)
# This command outputs a password for the elastic user
sudo /usr/share/elasticsearch/bin/elasticsearch-setup-passwords auto

# Or set passwords manually
sudo /usr/share/elasticsearch/bin/elasticsearch-setup-passwords interactive
```

3. If you need to enable the dense_vector field type for embeddings (required for our RAG implementation), update the Elasticsearch configuration:

```bash
# Edit elasticsearch.yml
sudo nano /etc/elasticsearch/elasticsearch.yml

# Add this line at the end
indices.query.bool.max_clause_count: 8192
```

## 3. Obtaining an OpenAI API Key

To use the OpenAI services in our application, you'll need an API key:

1. Go to https://platform.openai.com/signup and create an account if you don't have one
2. Navigate to https://platform.openai.com/api-keys
3. Click "Create new secret key"
4. Give your key a name (e.g., "NestJS-AI-API")
5. Copy the generated API key (important: it will only be shown once)

### Adding the API Key to Your Application:

1. Open your `.env` file
2. Update the OpenAI configuration:

```
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

3. Make sure to never commit this key to a public repository. The `.env` file should be in your `.gitignore`.

### API Key Management Best Practices:

- Set up usage limits in the OpenAI dashboard to prevent unexpected billing
- Create different API keys for development and production
- Rotate your API keys periodically for enhanced security
- Consider using environment-specific key management services for production (like AWS Secrets Manager, HashiCorp Vault, etc.)

## 4. Setting Up JWT Secrets and API Keys for Authentication

Our application uses both JWT and API Key authentication.

### Generating a Secure JWT Secret:

```bash
# Using Node.js to generate a random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

### Setting Up Authentication in Your Application:

1. Open your `.env` file
2. Update the JWT and API Key configuration with secure values:

```
# JWT Authentication
JWT_SECRET=your_generated_jwt_secret
JWT_EXPIRATION=1d  # 1 day expiration, adjust as needed

# API Key Authentication
API_KEY_HEADER_NAME=x-api-key
API_KEY=your_secure_api_key
```

### Generating a Secure API Key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using a UUID (less secure but more readable)
node -e "console.log(require('crypto').randomUUID())"
```

### Authentication Security Best Practices:

1. **For JWT tokens:**
   - Use short expiration times and implement refresh token logic
   - Store tokens securely (HttpOnly cookies for web applications)
   - Consider implementing token revocation mechanisms

2. **For API keys:**
   - Create different API keys for different clients/services
   - Implement rate limiting for API key usage
   - Set up key rotation policies

3. **For both:**
   - Log authentication failures to detect attack attempts
   - Implement proper error messages that don't leak sensitive information

## 5. Starting the Application

After completing all the above setup steps:

```bash
# Install all dependencies
npm install

# Build the application
npm run build

# Start the application in development mode
npm run start:dev

# Or for production
npm run start:prod
```

## 6. Verifying Your Setup

Here are some quick tests to ensure everything is working correctly:

### Testing Redis Connection:

```bash
# Create a temporary test file
echo "const Redis = require('ioredis'); const redis = new Redis(); redis.ping().then(console.log)" > tests/redis-test.js

# Run the test
node tests/redis-test.js
# Should output "PONG"
```

### Testing Elasticsearch Connection:

```bash
# Check if Elasticsearch is running
curl -X GET "localhost:9200"

# Should return JSON with Elasticsearch information
```

### Testing OpenAI API Key:

```bash
# Create a temporary test file
echo "const { OpenAI } = require('openai'); const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY}); async function test() { const response = await openai.chat.completions.create({messages: [{role: 'user', content: 'Hello'}], model: 'gpt-3.5-turbo'}); console.log(response.choices[0].message.content);} test()" > tests/openai-test.js

# Run the test with your API key
OPENAI_API_KEY=your_api_key node tests/openai-test.js

# Should output a response from the OpenAI API
```

## 7. Additional Configuration for Production

For a production environment, consider these additional steps:

### Set up HTTPS:
- Obtain an SSL certificate (Let's Encrypt is free)
- Configure your Node.js application with HTTPS
- Or use a reverse proxy like Nginx or Apache

### Implement Docker for containerization:

Create a `Dockerfile` in the project root:

```Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

And a `docker-compose.yml` file:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - redis
      - elasticsearch
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
  
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.6.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

volumes:
  redis-data:
  es-data:
```

### Set up proper monitoring:
- Implement logging with tools like Winston or Pino
- Add application monitoring with New Relic, Datadog, or PM2
- Set up alerts for critical failures

### Database backups:
- Schedule regular backups for Elasticsearch
- Implement a backup rotation policy

### CI/CD pipeline:
- Set up automated testing and deployment
- Implement staging environments for testing before production

## Project Structure

```
nest-ai-api/
├── src/                   # Application source code
│   ├── ai/                # AI integration with OpenAI
│   ├── auth/              # Authentication strategies
│   ├── config/            # Configuration management
│   ├── document/          # Document processing
│   ├── queue/             # Asynchronous job processing
│   ├── rag/               # Retrieval-Augmented Generation
│   ├── websocket/         # Real-time communication
│   ├── app.module.ts      # Main application module
│   └── main.ts            # Application entry point
├── tests/                 # Test utilities and setups
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore file
├── docker-compose.yml     # Docker compose configuration
├── Dockerfile             # Docker configuration
├── README.md              # Project documentation
├── SETUP.md               # This setup guide
└── package.json           # Node.js dependencies and scripts
```

## Troubleshooting

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Check your Redis password if authentication is enabled
- Verify the Redis port is not blocked by firewall

### Elasticsearch Issues
- Check if Elasticsearch is running: `curl localhost:9200`
- For permission issues, ensure the Elasticsearch data directory has proper permissions
- If you see memory errors, adjust JVM heap settings in `jvm.options`

### OpenAI API Issues
- Verify your API key is valid
- Check for rate limiting or quota issues in the OpenAI dashboard
- Ensure your network can reach the OpenAI API endpoints

### NestJS Application Issues
- Check logs for specific error messages
- Verify all dependencies are installed: `npm install`
- Ensure TypeScript compilation is successful: `npm run build` 