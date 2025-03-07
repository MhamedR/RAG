#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${YELLOW}===================================${NC}"
echo -e "${YELLOW}   NestJS AI-API Setup Assistant   ${NC}"
echo -e "${YELLOW}===================================${NC}"
echo

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✓ Created .env file${NC}"
  echo -e "${YELLOW}Please edit the .env file to add your API keys and credentials.${NC}"
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create uploads directory
if [ ! -d "uploads" ]; then
  echo -e "${YELLOW}Creating uploads directory...${NC}"
  mkdir -p uploads
  echo -e "${GREEN}✓ Created uploads directory${NC}"
else
  echo -e "${GREEN}✓ Uploads directory already exists${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check for Docker
if command -v docker &> /dev/null; then
  echo -e "${GREEN}✓ Docker is installed${NC}"
  
  # Check for Docker Compose
  if docker compose version &> /dev/null || command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose is installed${NC}"
    
    echo -e "${YELLOW}Would you like to start the Docker services? (Redis, Elasticsearch, and Ollama) [y/N]${NC}"
    read -r start_docker
    
    if [[ "$start_docker" =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Starting Docker services...${NC}"
      docker compose up -d
      echo -e "${GREEN}✓ Docker services started${NC}"
      
      echo -e "${YELLOW}Waiting for Ollama to initialize...${NC}"
      sleep 10
      
      echo -e "${YELLOW}Pulling the llama3 model (this may take a while)...${NC}"
      curl -X POST http://localhost:11434/api/pull -d '{"name": "llama3"}'
      echo -e "${GREEN}✓ Model pull request initiated${NC}"
    fi
  else
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo -e "${YELLOW}Please install Docker Compose to easily start Redis, Elasticsearch, and Ollama.${NC}"
  fi
else
  echo -e "${RED}✗ Docker is not installed${NC}"
  echo -e "${YELLOW}Please install Docker to easily start Redis, Elasticsearch, and Ollama.${NC}"
  echo -e "${YELLOW}Alternatively, install them manually as described in SETUP.md.${NC}"
fi

# Generate a JWT secret if not already set in .env
jwt_secret=$(grep "JWT_SECRET=" .env | cut -d '=' -f2)
if [ "$jwt_secret" = "your_jwt_secret" ] || [ -z "$jwt_secret" ]; then
  echo -e "${YELLOW}Generating a secure JWT secret...${NC}"
  if command -v node &> /dev/null; then
    jwt_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" .env
    rm -f .env.bak
    echo -e "${GREEN}✓ Generated and set JWT secret${NC}"
  else
    echo -e "${RED}✗ Node.js is required to generate a secure JWT secret${NC}"
    echo -e "${YELLOW}Please set a secure JWT_SECRET in your .env file manually.${NC}"
  fi
else
  echo -e "${GREEN}✓ JWT secret is already set${NC}"
fi

# Generate an API key if not already set in .env
api_key=$(grep "API_KEY=" .env | cut -d '=' -f2)
if [ "$api_key" = "your_secure_api_key_here" ] || [ "$api_key" = "your_api_key" ] || [ -z "$api_key" ]; then
  echo -e "${YELLOW}Generating a secure API key...${NC}"
  if command -v node &> /dev/null; then
    api_key=$(node -e "console.log(require('crypto').randomUUID())")
    sed -i.bak "s/API_KEY=.*/API_KEY=$api_key/" .env
    rm -f .env.bak
    echo -e "${GREEN}✓ Generated and set API key${NC}"
  else
    echo -e "${RED}✗ Node.js is required to generate a secure API key${NC}"
    echo -e "${YELLOW}Please set a secure API_KEY in your .env file manually.${NC}"
  fi
else
  echo -e "${GREEN}✓ API key is already set${NC}"
fi

# Check for Ollama settings
ollama_url=$(grep "OLLAMA_BASE_URL=" .env | cut -d '=' -f2)
if [ -z "$ollama_url" ]; then
  echo -e "${YELLOW}Setting default Ollama base URL...${NC}"
  echo "OLLAMA_BASE_URL=http://localhost:11434" >> .env
  echo -e "${GREEN}✓ Set default Ollama base URL${NC}"
else
  echo -e "${GREEN}✓ Ollama base URL is set${NC}"
fi

ollama_model=$(grep "OLLAMA_MODEL=" .env | cut -d '=' -f2)
if [ -z "$ollama_model" ]; then
  echo -e "${YELLOW}Setting default Ollama model...${NC}"
  echo "OLLAMA_MODEL=llama3" >> .env
  echo -e "${GREEN}✓ Set default Ollama model${NC}"
else
  echo -e "${GREEN}✓ Ollama model is set${NC}"
fi

echo
echo -e "${YELLOW}===================================${NC}"
echo -e "${GREEN}Setup is complete!${NC}"
echo -e "${YELLOW}===================================${NC}"
echo
echo -e "To start the application in development mode, run:"
echo -e "${YELLOW}npm run start:dev${NC}"
echo
echo -e "To start all services using Docker Compose, run:"
echo -e "${YELLOW}docker compose up -d${NC}"
echo
echo -e "For more detailed setup instructions, refer to the SETUP.md file."
echo 