# Skeleton API

A modern, scalable NestJS API skeleton with TypeScript, PostgreSQL, Prisma ORM, and comprehensive developer tools.

## 🚀 Features

- **NestJS Framework**: Modern, scalable Node.js server-side application framework
- **TypeScript**: Full TypeScript support with strict typing
- **PostgreSQL + Prisma ORM**: Type-safe database access with migrations
- **Configuration Management**: Environment-based configuration with validation
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Security**: Helmet for security headers, CORS configuration
- **Validation**: Global validation pipes with class-validator and class-transformer
- **Health Checks**: Built-in health check endpoints
- **Logging**: Request/response logging middleware
- **Code Quality**: ESLint, Prettier, Husky, and lint-staged
- **Testing**: Jest testing framework with e2e tests

## 📋 Prerequisites

- Node.js >= 18
- PostgreSQL >= 13
- pnpm (recommended) or npm

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd skeleton-api
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

4. **Setup database**

   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Run database migrations
   pnpm db:migrate

   # Seed the database (optional)
   pnpm db:seed
   ```

## 🚀 Running the Application

### Development

```bash
pnpm dev
# or
pnpm start:dev
```

### Production

```bash
pnpm build
pnpm start:prod
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 📚 API Documentation

Once the application is running, you can access the API documentation at:

- **Development**: http://localhost:3000/docs
- **API Endpoints**: http://localhost:3000

### Health Check Endpoints

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (includes database connectivity)

## 🗂️ Project Structure

```
src/
├── common/           # Shared modules, middleware, pipes, guards
│   ├── middleware/   # Custom middleware
│   └── pipes/        # Custom validation pipes
├── config/           # Configuration files and validation
├── database/         # Database connection and Prisma service
├── health/           # Health check module
├── app.controller.ts # Main app controller
├── app.module.ts     # Root module
├── app.service.ts    # Main app service
└── main.ts           # Application entry point

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Database seeding script
```

## ⚙️ Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure:

### Database

- `DATABASE_URL`: PostgreSQL connection string

### Application

- `NODE_ENV`: Environment (development, production, test)
- `PORT`: Server port (default: 3000)

### Security

- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGIN`: Allowed CORS origins

### Logging

- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## 🗃️ Database

This project uses Prisma ORM with PostgreSQL. Key commands:

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Create and run a new migration
pnpm db:migrate

# Deploy migrations to production
pnpm db:migrate:prod

# Reset database (development only)
pnpm db:reset

# Seed database
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run e2e tests
pnpm test:e2e

# Generate test coverage
pnpm test:cov
```

## 📝 Code Quality

This project uses several tools to maintain code quality:

- **ESLint**: Linting and code analysis
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Run linters on staged files

### Manual Commands

```bash
# Format code
pnpm format

# Lint and fix
pnpm lint

# Husky is automatically set up to run linting and formatting on commits
```

## 🔒 Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Validation**: Input validation and sanitization
- **Environment-based config**: Secure configuration management

## 📦 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set secure JWT secret
4. Configure CORS origins
5. Run migrations: `pnpm db:migrate:prod`

### Build and Start

```bash
pnpm build
pnpm start:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the [UNLICENSED](LICENSE) license.

## 🆘 Support

If you have any questions or need help with setup, please create an issue in the repository.

---

**Happy Coding!** 🎉
