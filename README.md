# AI-Powered API with NestJS

A powerful AI-powered API built with NestJS that provides seamless integration with OpenAI's GPT models, asynchronous job processing, secure authentication, and advanced AI features like Retrieval-Augmented Generation (RAG).

## Features

### 1. User Input and AI Request Processing
- Real-time streaming of AI responses using Server-Sent Events (SSE)
- Efficient request management with NestJS's modular architecture

### 2. Asynchronous Job Processing
- Redis and BullMQ integration for reliable job queuing
- Non-blocking requests for better performance
- Scalable job management

### 3. Secure API Architecture
- JWT and API Key authentication
- Modular security integration
- Secure data transmission

### 4. Scalability and Flexibility
- Horizontal scaling support
- Concurrent multi-task handling
- Flexible architecture for feature expansion

### 5. Enhanced AI Capabilities with LangChain.js
- Memory-based conversations
- Structured AI pipelines
- Contextual AI responses

### 6. Real-Time AI Interaction
- WebSocket integration for low-latency communication
- Instant feedback for interactive applications

### 7. Advanced AI Features with Retrieval-Augmented Generation (RAG)
- External knowledge integration
- Elasticsearch as vector store
- Semantic search capabilities

### 8. Document-Based AI Memory
- Support for document uploads (PDF, text)
- Document parsing and chunking
- Document-based RAG

### 9. Production-Ready Architecture
- Resilient design
- Comprehensive monitoring and logging

## Getting Started

### Prerequisites
- Node.js (v16+)
- Redis
- Elasticsearch
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/nest-ai-api.git
cd nest-ai-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the application
```bash
npm run start:dev
```

### Detailed Setup Guide

For a more detailed setup with step-by-step instructions for installing Redis, Elasticsearch, and configuring OpenAI API keys, please refer to our comprehensive [SETUP.md](SETUP.md) guide.

The setup guide includes:
- Installing and configuring Redis for the queue system
- Installing and configuring Elasticsearch for the vector store
- Obtaining and setting up an OpenAI API key
- Setting up JWT secrets and API keys for authentication
- Docker configuration for containerization
- Testing scripts to verify your setup
- Production deployment considerations

### Test Scripts

We've included several test scripts in the `tests` directory to help you verify your setup:
- `tests/redis-test.js` - Tests Redis connection
- `tests/elasticsearch-test.js` - Tests Elasticsearch connection and vector capabilities
- `tests/openai-test.js` - Tests OpenAI API key configuration

Run these tests to ensure your environment is properly configured:

```bash
node tests/redis-test.js
node tests/elasticsearch-test.js
OPENAI_API_KEY=your_api_key node tests/openai-test.js
```

### Docker Support

For easy development and deployment, we've included Docker configuration:

```bash
# Start all services (app, Redis, Elasticsearch)
docker-compose up

# Or run just the dependencies
docker-compose up redis elasticsearch
```

## API Endpoints

### AI Endpoints
- `GET /api/ai?prompt=your_text_here` - Get AI response (streamed)

### RAG Endpoints
- `POST /api/rag/index` - Index content for RAG
- `GET /api/rag/query?query=your_query` - Query using RAG

### Document Endpoints
- `POST /api/documents/upload` - Upload and process documents

## WebSocket Events

### Client to Server
- `chat-message` - Send a message to the AI

### Server to Client
- `chat-response` - Receive AI response
- `error` - Error notifications

## Environment Variables

See `.env.example` for all required environment variables.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 