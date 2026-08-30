# GitChat

GitChat is an AI-powered GitHub repository assistant that lets
developers connect their GitHub account, explore repositories, index
source code, and chat with their codebase using Retrieval-Augmented
Generation (RAG).

## Live Demo

https://gitchat-frontend.onrender.com/

## Features

-   GitHub OAuth 2.0 authentication
-   GitHub repository synchronization
-   Repository source-code indexing
-   AI-powered codebase chat
-   Retrieval-Augmented Generation (RAG)
-   OpenAI embeddings and chat
-   PostgreSQL with pgvector
-   Code citations in AI responses
-   Multiple chat sessions per repository
-   Secure repository and chat ownership
-   Encrypted GitHub access-token storage
-   Docker support
-   Production deployment with Render and Neon

## Tech Stack

### Frontend

-   React
-   Vite
-   JavaScript
-   CSS

### Backend

-   Java 21
-   Spring Boot
-   Spring Security
-   Spring Data JPA
-   Spring AI
-   Maven

### AI / RAG

-   OpenAI
-   Spring AI
-   Retrieval-Augmented Generation
-   pgvector

### Database

-   PostgreSQL
-   pgvector
-   Neon PostgreSQL

### Integration & Deployment

-   GitHub OAuth 2.0
-   GitHub REST API
-   Docker
-   Docker Compose
-   Render
-   Neon

## Architecture

``` text
GitHub
   │
   ▼
React + Vite Frontend
   │
   │ HTTP / SSE
   ▼
Spring Boot Backend
   │
   ├──────────────► GitHub API
   │
   ├──────────────► OpenAI API
   │
   ▼
PostgreSQL + pgvector
```

## How It Works

``` text
GitHub Login
     ↓
Connect Repository
     ↓
Index Source Code
     ↓
Generate Embeddings
     ↓
Store in pgvector
     ↓
Ask Questions
     ↓
Retrieve Relevant Code
     ↓
OpenAI
     ↓
AI Answer + Citations
```

## Project Structure

``` text
GITCHAT/
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docker/
├── docker-compose.yml
└── README.md
```

## Local Development

### Prerequisites

-   Java 21
-   Node.js
-   Docker
-   Git
-   PostgreSQL / pgvector

### Start PostgreSQL

``` bash
docker compose up -d
```

### Start Backend

``` bash
cd backend
./mvnw spring-boot:run
```

On Windows:

``` powershell
.\mvnw.cmd spring-boot:run
```

### Start Frontend

``` bash
cd frontend
npm install
npm run dev
```

## Environment Variables

The application requires environment variables for:

``` text
DB_URL
DB_USERNAME
DB_PASSWORD

OPENAI_API_KEY

GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET

FRONTEND_URL
CORS_ALLOWED_ORIGINS

TOKEN_ENCRYPTOR_PASSWORD
TOKEN_ENCRYPTOR_SALT
```

Do not commit secret values to GitHub.

## Screenshots

Add screenshots of the application here.

## Future Improvements

-   Pull request analysis
-   Commit history analysis
-   Branch comparison
-   Advanced code search
-   Repository analytics
-   Improved large-repository indexing
-   Support for additional AI models

## Author

**Satya Prakash**

GitHub: https://github.com/Atmuri-SatyaPrakash
