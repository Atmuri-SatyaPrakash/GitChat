# GitChat

GitChat is an AI-powered GitHub repository assistant that allows developers to connect their GitHub account, explore their repositories, index source code, and chat with their codebase using Retrieval-Augmented Generation (RAG).

Instead of manually searching through a large repository, developers can ask questions about their code and receive AI-generated answers grounded in the actual repository source code.

---

## Features

- GitHub OAuth 2.0 authentication
- View repositories accessible through the authenticated GitHub account
- Sync repositories from GitHub
- Repository source-code indexing
- Intelligent code chunking
- OpenAI embeddings
- Vector similarity search using pgvector
- AI-powered repository chat
- Streaming AI responses using Server-Sent Events (SSE)
- Code citations in responses
- Multiple chat sessions per repository
- Repository and chat ownership protection
- Encrypted storage of GitHub access tokens
- Docker support for local PostgreSQL + pgvector
- Production deployment using Render
- Neon PostgreSQL for the production database

---

## Architecture

```text
                         ┌──────────────────┐
                         │      GitHub      │
                         │    OAuth 2.0     │
                         └────────┬─────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│                       Vite                          │
│                                                     │
│   Login → Repositories → Index → Chat              │
└────────────────────────┬────────────────────────────┘
                         │
                         │ HTTP / SSE
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Spring Boot Backend                 │
│                                                     │
│  Spring Security                                    │
│  GitHub OAuth                                       │
│  REST Controllers                                   │
│  Repository Services                                │
│  Indexing Services                                  │
│  RAG Pipeline                                       │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
               ▼                      ▼
      ┌─────────────────┐    ┌──────────────────┐
      │   GitHub API    │    │    OpenAI API    │
      │                 │    │                  │
      │ Repositories    │    │ Chat Model       │
      │ Repository Tree │    │ Embeddings       │
      │ File Contents   │    │                  │
      └─────────────────┘    └──────────────────┘
               │
               │
               ▼
      ┌─────────────────────────────┐
      │ PostgreSQL + pgvector       │
      │                             │
      │ Users                       │
      │ Repositories                │
      │ Chat Sessions               │
      │ Chat Messages               │
      │ Vector Embeddings           │
      └─────────────────────────────┘
```

---

## How It Works

GitChat follows this workflow:

```text
GitHub Login
     ↓
GitHub OAuth 2.0
     ↓
Authenticated Session
     ↓
Fetch User's GitHub Repositories
     ↓
Select Repository
     ↓
Index Repository
     ↓
Read Source Files
     ↓
Split Files into Chunks
     ↓
Generate Embeddings
     ↓
Store Embeddings in pgvector
     ↓
User Asks a Question
     ↓
Vector Similarity Search
     ↓
Retrieve Relevant Code
     ↓
Build AI Prompt
     ↓
OpenAI
     ↓
Stream Response
     ↓
Display Answer + Citations
```

---

## GitHub OAuth Authentication

GitChat uses GitHub OAuth 2.0 through Spring Security.

The authentication flow is:

```text
User
 │
 ▼
GitChat Frontend
 │
 ▼
Spring Boot OAuth Endpoint
 │
 ▼
GitHub Authorization
 │
 ▼
User Grants Permission
 │
 ▼
GitHub Redirects Back to Backend
 │
 ▼
Backend Obtains GitHub Access Token
 │
 ▼
User Information Stored/Updated
 │
 ▼
Authenticated Session Created
 │
 ▼
Frontend
```

The GitHub access token is encrypted before being stored in the database.

---

## Repository Management

After authentication, GitChat retrieves repositories using the authenticated user's GitHub access token.

The backend communicates with the GitHub REST API to retrieve:

- Repository information
- Repository tree
- Source files
- Default branch
- Programming language
- Repository visibility
- Repository metadata

Repositories are associated with the application's internal user ID.

```text
Authenticated User
        │
        ▼
Current User ID
        │
        ▼
Repository Ownership Check
        │
        ▼
User's Repository
```

---

## Repository Indexing

A repository must be indexed before it can be used for AI chat.

The indexing pipeline is:

```text
GitHub Repository
        │
        ▼
Repository Tree
        │
        ▼
Source Files
        │
        ▼
Text Extraction
        │
        ▼
Code Chunking
        │
        ▼
Generate Embeddings
        │
        ▼
PostgreSQL + pgvector
```

GitChat stores metadata along with the vectorized code chunks, allowing the application to identify the repository, file, and chunk associated with each piece of code.

The indexing process also tracks repository indexing status, total files, processed files, chunk count, indexed time, and possible indexing errors.

---

## Retrieval-Augmented Generation

GitChat uses Retrieval-Augmented Generation (RAG) to answer questions about repository code.

When a user asks a question, GitChat performs multiple semantic searches to find relevant code.

```text
User Question
      │
      ▼
Query Processing
      │
      ▼
Multiple Search Formulations
      │
      ▼
Vector Similarity Search
      │
      ▼
Repository Filter
      │
      ▼
Remove Duplicate Chunks
      │
      ▼
Relevant Code Chunks
      │
      ▼
Context Construction
      │
      ▼
Prompt Builder
      │
      ▼
OpenAI
      │
      ▼
Generated Answer
```

GitChat uses multiple search formulations for a question to improve retrieval.

For example, a question such as:

```text
Where is authentication implemented?
```

can be expanded into searches related to:

```text
implementation backend code
function class controller service logic
authentication login credentials verification
```

The retrieved documents are deduplicated using their file path and chunk index before being passed to the AI model.

---

## Repository Isolation

Vector searches are filtered using the repository ID.

This ensures that when a user chats with a particular repository, the retrieval process only searches chunks belonging to that repository.

```text
Repository A
     │
     ▼
Vector Search
     │
     ▼
repoId = A
     │
     ▼
Repository A Chunks Only
```

This provides an additional layer of isolation between repositories.

---

## AI Chat

Users can create chat sessions for indexed repositories.

A repository must have an indexing status of `READY` before a chat session can be created.

The chat flow is:

```text
User Question
      │
      ▼
Authenticated User
      │
      ▼
Chat Session Ownership Check
      │
      ▼
Repository Ownership Check
      │
      ▼
Repository Ready Check
      │
      ▼
Save User Message
      │
      ▼
RAG Retrieval
      │
      ▼
Relevant Code Context
      │
      ▼
Prompt Construction
      │
      ▼
OpenAI
      │
      ▼
Server-Sent Events
      │
      ▼
Frontend Chat Interface
```

AI responses are streamed to the frontend using Server-Sent Events (SSE).

Chat sessions and messages are persisted in PostgreSQL.

---

## Code Citations

GitChat keeps metadata about retrieved code chunks.

Retrieved context can include:

- File path
- Programming language
- Start line
- End line
- Chunk index

This information is used to provide citations associated with AI responses.

Example:

```text
FILE: backend/src/main/java/devPilot/backend/config/SecurityConfig.java
LANGUAGE: Java
LINES: 20-55
CHUNK: 2
```

This makes it easier to understand where the information used by the AI response came from.

---

## Security

GitChat includes several security mechanisms.

### Authentication

Spring Security protects application API endpoints.

### GitHub OAuth

GitHub OAuth 2.0 is used for authentication and GitHub API access.

The application requests the following GitHub scopes:

```text
read:user
repo
```

### Session Security

The application uses an HTTP-only session cookie for authenticated sessions.

The production session cookie is configured to support secure cross-origin communication between the deployed frontend and backend.

### Token Encryption

GitHub access tokens are encrypted before being stored in PostgreSQL.

The encryption configuration uses an application-specific password and salt supplied through environment variables.

### Repository Ownership

Repository operations verify that the requested repository belongs to the authenticated application user.

### Chat Ownership

Chat sessions are retrieved using both:

```text
Session ID + User ID
```

This prevents a user from accessing another user's chat session simply by changing the session ID.

### RAG Isolation

Vector searches include a repository metadata filter so that code from unrelated repositories is not retrieved.

### CORS

The backend uses a configured list of allowed frontend origins and allows credentials for authenticated session requests.

### API Protection

Application endpoints under:

```text
/api/**
```

require authentication.

OAuth endpoints and required authentication-related endpoints are publicly accessible.

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Spring AI
- Spring Security OAuth2 Client
- Maven

### AI / RAG

- OpenAI
- Spring AI
- OpenAI Chat Model
- OpenAI Embeddings
- Retrieval-Augmented Generation
- pgvector

### Database

- PostgreSQL
- pgvector
- Neon PostgreSQL

### GitHub Integration

- GitHub OAuth 2.0
- GitHub REST API

### Infrastructure

- Docker
- Docker Compose
- Render
- Neon

---

## Project Structure

```text
GITCHAT/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/devPilot/backend/
│   │       │   ├── config/
│   │       │   ├── controllers/
│   │       │   ├── dto/
│   │       │   ├── entity/
│   │       │   ├── exceptions/
│   │       │   ├── repository/
│   │       │   ├── security/
│   │       │   └── services/
│   │       │       ├── ai/
│   │       │       ├── github/
│   │       │       └── indexing/
│   │       │
│   │       └── resources/
│   │
│   ├── Dockerfile
│   ├── pom.xml
│   └── mvnw
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── dist/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── docker/
│   └── postgres/
│
├── docker-compose.yml
│
└── README.md
```

---

## Backend Components

### Security

```text
backend/src/main/java/devPilot/backend/security/
```

Responsible for:

- GitHub OAuth authentication
- Current authenticated user
- Application user principal

### Controllers

```text
backend/src/main/java/devPilot/backend/controllers/
```

Responsible for exposing REST APIs for:

- Authentication
- Repositories
- Chat
- Repository indexing

### Services

```text
backend/src/main/java/devPilot/backend/services/
```

Contains the main application logic.

Important service areas include:

```text
services/
├── ai/
├── github/
└── indexing/
```

### Repository Layer

```text
backend/src/main/java/devPilot/backend/repository/
```

Provides database access through Spring Data JPA.

### Entities

```text
backend/src/main/java/devPilot/backend/entity/
```

Contains the application's persistent domain models such as:

- User
- Repository
- Chat Session
- Chat Message

### Exceptions

```text
backend/src/main/java/devPilot/backend/exceptions/
```

Contains application-specific exceptions and centralized exception handling.

---

## Environment Variables

The backend uses environment variables for configuration and secrets.

```text
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

Never commit real secret values to the repository.

For local development, configure these variables in your local environment.

For production, configure them through the deployment platform.

---

## Application Configuration

Important application configuration includes:

```text
OpenAI Chat Model:
gpt-4o-mini

OpenAI Embedding Model:
text-embedding-3-small

Vector Dimensions:
1536

Vector Index:
HNSW

Distance Type:
COSINE_DISTANCE
```

Repository indexing configuration includes:

```text
Maximum File Size:
102400 bytes

Chunk Size:
800

Chunk Overlap:
100
```

The application also uses a configurable delay between GitHub API requests.

---

## Local Development

### Prerequisites

Make sure the following are installed:

- Java 21
- Maven
- Node.js
- npm
- Docker
- Git

---

## Run PostgreSQL + pgvector

The project includes Docker Compose configuration for running PostgreSQL with pgvector locally.

From the project root:

```bash
docker compose up -d
```

The local PostgreSQL configuration is:

```text
Database: gitchat
Username: postgres
Password: postgres
Port: 5434
```

The PostgreSQL service uses:

```text
pgvector/pgvector:pg16
```

To check running containers:

```bash
docker ps
```

To stop the database:

```bash
docker compose down
```

---

## Run the Backend

Navigate to the backend:

```bash
cd backend
```

Build the application:

```bash
./mvnw clean package -DskipTests
```

On Windows:

```powershell
.\mvnw.cmd clean package -DskipTests
```

Run the application:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

---

## Run the Frontend

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display the local frontend URL in the terminal.

---

## Docker

The backend uses a multi-stage Docker build.

### Build

From the project root:

```bash
docker build -t gitchat-backend ./backend
```

### Run

```bash
docker run -p 8080:8080 gitchat-backend
```

The Docker build uses:

```text
Build Stage
    │
    ├── Maven
    ├── Java 21
    └── Build Spring Boot JAR
              │
              ▼
Runtime Stage
    │
    ├── Java 21 JRE
    └── Run application
```

The application exposes port:

```text
8080
```

---

## Production Deployment

GitChat is designed to run with:

- React/Vite frontend
- Spring Boot backend
- Render deployment
- Neon PostgreSQL
- pgvector
- GitHub OAuth
- OpenAI API

The production architecture is:

```text
                     Internet
                         │
                         ▼
                ┌────────────────┐
                │    Frontend    │
                │     Render     │
                └───────┬────────┘
                        │
                        │ HTTPS
                        ▼
                ┌────────────────┐
                │ Spring Boot    │
                │    Backend     │
                │     Render     │
                └───────┬────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
      GitHub API    OpenAI API    Neon PostgreSQL
                                    + pgvector
```

Production environment variables should be configured through Render rather than committed to GitHub.

---

## Deployment Configuration

The backend is containerized using Docker.

The Docker build contains two stages:

```text
Build Stage
    │
    ├── Maven
    ├── Java 21
    └── Build Spring Boot JAR
              │
              ▼
Runtime Stage
    │
    ├── Java 21 JRE
    └── Run application
```

This separates the build environment from the runtime environment.

---

## API Overview

The backend provides APIs for:

- Authentication
- GitHub OAuth
- Repository management
- Repository indexing
- Index status
- Chat sessions
- Chat messages
- Logout

Application APIs under:

```text
/api/**
```

require authentication.

### Authentication

```text
GET /api/auth/login-url
POST /api/auth/logout
```

### Repositories

```text
GET /api/repos
GET /api/repos/{id}
POST /api/repos/{id}/index
GET /api/repos/{id}/status
```

### Chat

```text
POST /api/chat/sessions
GET /api/chat/sessions
GET /api/chat/sessions/{id}
POST /api/chat/sessions/{id}/messages
DELETE /api/chat/sessions/{id}
```

The message endpoint streams AI responses using Server-Sent Events.

---

## RAG Pipeline Components

The RAG pipeline is organized into several components.

```text
GitHub Repository
       │
       ▼
GitHub API Client
       │
       ▼
Repository Indexing
       │
       ▼
Document Splitting
       │
       ▼
OpenAI Embeddings
       │
       ▼
pgvector
       │
       ▼
Code Context Retriever
       │
       ▼
Chat Prompt Builder
       │
       ▼
OpenAI Chat Model
       │
       ▼
Chat Stream Handler
       │
       ▼
SSE Response
       │
       ▼
Frontend
```

The retrieval process uses repository-specific metadata filtering and deduplication to construct relevant context for the AI model.

---

## Database

GitChat uses PostgreSQL as its primary relational database.

pgvector is used to store and search vector embeddings generated from repository source code.

The database stores application data such as:

```text
Users
Repositories
Chat Sessions
Chat Messages
Vector Documents
```

For local development, PostgreSQL + pgvector can be started through Docker Compose.

For production, Neon PostgreSQL is used.

---

## Data Flow

### User Authentication

```text
Frontend
   │
   ▼
GitHub OAuth
   │
   ▼
Spring Security
   │
   ▼
GitHub User Information
   │
   ▼
UserService
   │
   ▼
PostgreSQL
```

### Repository Synchronization

```text
Frontend
   │
   ▼
RepoController
   │
   ▼
RepoService
   │
   ▼
Decrypt GitHub Token
   │
   ▼
GithubApiClient
   │
   ▼
GitHub REST API
   │
   ▼
PostgreSQL
```

### Repository Indexing

```text
Repository
   │
   ▼
GitHub Repository Tree
   │
   ▼
Source Files
   │
   ▼
Document Splitting
   │
   ▼
Embeddings
   │
   ▼
pgvector
```

### Chat

```text
Question
   │
   ▼
ChatController
   │
   ▼
ChatService
   │
   ▼
CodeContextRetriever
   │
   ▼
pgvector
   │
   ▼
Relevant Code
   │
   ▼
ChatPromptBuilder
   │
   ▼
OpenAI
   │
   ▼
ChatStreamHandler
   │
   ▼
SSE
   │
   ▼
Frontend
```

---

## Screenshots

Screenshots of the application can be added here.

For example:

```markdown
![GitChat Home](screenshots/home.png)
```

```markdown
![Repositories](screenshots/repositories.png)
```

```markdown
![Repository Indexing](screenshots/indexing.png)
```

```markdown
![Repository Chat](screenshots/chat.png)
```

---

## Future Improvements

Potential future improvements include:

- Improved repository indexing performance
- Better indexing progress visualization
- Support for very large repositories
- Advanced code search
- Pull request analysis
- Commit history analysis
- Branch comparison
- Repository analytics
- Improved chat context management
- Additional AI model support
- Improved error and retry handling
- More advanced repository understanding
- Improved citation navigation

---

## Project Goal

GitChat aims to make understanding GitHub repositories easier for developers.

By combining GitHub OAuth, repository indexing, vector search, and generative AI, GitChat allows developers to interact with their codebase conversationally.

Instead of manually navigating through hundreds or thousands of files, developers can ask questions about their repository and receive answers grounded in the repository's source code.

The goal is to provide a practical AI assistant for understanding, exploring, and working with real-world software repositories.

---

## Author

**Satya Prakash**

GitHub: [Atmuri-SatyaPrakash](https://github.com/Atmuri-SatyaPrakash)
