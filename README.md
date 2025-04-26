# Time Tracker Application

This is a web-based employee time tracking system with geolocation, photo capture, and comprehensive admin functionality.

## Docker Setup

The application has been optimized to use Docker for both development and production environments.

### Prerequisites

- Docker
- Docker Compose

### Development Environment

To start the development environment with hot reloading:

```bash
./scripts/start-dev.sh
```

This will:
1. Start the PostgreSQL database
2. Start the application in development mode
3. Run any necessary database migrations

The application will be accessible at http://localhost:5000

### Production Environment

To start the production environment:

```bash
./scripts/start-prod.sh
```

This will:
1. Build the application
2. Start the PostgreSQL database
3. Start the application in production mode
4. Run any necessary database migrations

The application will be accessible at http://localhost:5000

### Database Migrations

To manually run database migrations:

```bash
./scripts/db-migrate.sh
```

### Stopping the Environment

To stop all running environments:

```bash
./scripts/stop.sh
```

## Directory Structure

- `/client` - Frontend code
- `/server` - Backend code
- `/shared` - Shared code (schemas, types)
- `/scripts` - Helper scripts for the Docker environment

## Environment Variables

The following environment variables are used:

- `NODE_ENV` - Environment mode (development or production)
- `DATABASE_URL` - PostgreSQL connection string

These are automatically set in the Docker Compose files.

## Development Workflow

1. Make code changes
2. The changes will be automatically reflected in the development environment due to hot reloading
3. Test your changes
4. Commit your changes
5. Deploy to production

## Production Deployment

To deploy to production, run:

```bash
./scripts/start-prod.sh
```

This will build a production-ready image and start the application in production mode.