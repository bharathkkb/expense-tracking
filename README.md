# gSpend - Expense Tracking Application

gSpend is a modern expense tracking application with a React frontend and a FastAPI backend.

## System Architecture

The application consists of the following components:
-   **Frontend**: React application built with Vite, providing a dynamic and responsive user interface. Proxy API requests to Backend.
-   **Backend**: FastAPI application providing RESTful endpoints for user management, expense tracking, and reporting.
-   **Database**: Uses SQLite by default for local development, with support for Cloud SQL (PostgreSQL) via Unix sockets in production.

## Local Development

### Prerequisites
-   Docker and Docker Compose

### Running the Application
To start the entire stack (frontend and backend) with live reload enabled:
```bash
docker compose up --build --watch
```
The frontend will be available at `http://localhost:8081` and the backend at `http://localhost:8080`.

### Running Backend Tests Locally
1. Navigate to the backend directory.
2. Run the tests using the Makefile:
   ```bash
   cd backend
   make install  # To setup venv and install dependencies
   make test     # To run tests
   ```

## Containerization & Deployment

### Building Images
To build images locally using Docker Compose:
```bash
docker compose build
```

### Pushing to Google Artifact Registry

To push your container images to Google Artifact Registry, follow these steps:

1.  **Set Environment Variables**:
    ```bash
    export REGION="us-central1"
    export PROJECT_ID="your-project-id"
    export REPOSITORY="your-repository-name"
    ```

2.  **Configure Docker Authentication**:
    ```bash
    gcloud auth configure-docker $REGION-docker.pkg.dev
    ```

3.  **Tag the Images**:
    ```bash
    # Tag backend image
    docker tag expense-tracking-backend $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/expense-tracking-backend:latest
    
    # Tag frontend image
    docker tag expense-tracking-frontend $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/expense-tracking-frontend:latest
    ```

4.  **Push the Images**:
    ```bash
    # Push backend image
    docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/expense-tracking-backend:latest
    
    # Push frontend image
    docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/expense-tracking-frontend:latest
    ```
