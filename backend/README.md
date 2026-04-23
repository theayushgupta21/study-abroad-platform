# University & Program Discovery Platform - Backend

This is a production-ready backend system for a "University & Program Discovery Platform" built using **Node.js, Express.js, MongoDB (Mongoose), and JWT authentication**.

## Architecture & Design Decisions
- **Clean Architecture Principles**: Organized neatly into layers — Routes, Controllers, Services, Models, and Middleware to maintain separation of concerns.
- **Dynamic Query Builder**: Uses a reusable class `QueryBuilder` for handling consistent pagination, advanced filtering, and sorting across resources (e.g., fetching Programs).
- **MongoDB Aggregation**: Recommendation engine transformed from JS memory-level iterations to optimized DB-level Aggregation Pipelines for performance at scale.
- **Caching**: Developed a dual-layer caching strategy checking Redis first, falling back to an in-memory application cache (`node-cache`) for robustness, bound selectively by an Express middleware.
- **Security**: Hardened entry points using `helmet` for HTTP headers, `express-rate-limit` to prevent brute force, structured logging via `morgan`, and `Joi` validation at Controller ingress to protect against NoSQL-injections/Malformed data.
- **Testing**: Using Jest & Supertest pointing to an isolated Test Database for asserting correctness across vital routes.

---

## Folder Structure

```
backend/
├── src/
│   ├── app.js               # Express application composition
│   ├── server.js            # Entry point
│   ├── config/              # Environment configurations & constants
│   ├── controllers/         # Web request handlers
│   ├── middleware/          # Cache, Auth, Errors, Security
│   ├── models/              # Mongoose schema definitions
│   ├── routes/              # Express Router definitions
│   ├── services/            # Deep business logic (e.g., Aggregation Logic)
│   ├── utils/               # Common utilities (Validators, AsyncHandlers, QueryBuilder)
│   └── scripts/             # Useful scripts for seeding
└── tests/                   # Jest + Supertest suites
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Running instance or Atlas URI)
- Redis (Optional, falls back to memory cache)
- Git

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Configure Environment variables
Create a `.env` file in the `backend/` root directory:
```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/university-discovery
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=30d
CACHE_TTL_SECONDS=300
REDIS_URL=redis://127.0.0.1:6379 
```
*(Leave REDIS_URL blank to force in-memory mock if Redis is not installed locally).*

### 3. Run the Server
```bash
# Seed initial data to MongoDB
npm run seed

# Run in Development mode (with nodemon)
npm run dev

# Run in Production mode
npm run start
```

---

## API Documentation

### Auth APIs
- `POST /api/auth/register` - Register a new user (student or counselor)
- `POST /api/auth/login` - Authenticate a user and issue JWT
- `GET /api/auth/me` - Profile lookup using Auth Token

*(Role-based access middleware `restrictTo('role')` optionally shields routes).*

### Application Workflow APIs
- `POST /api/applications` - Creates a new draft application (Enforces Student+Program+Intake Unique limits).
- `PATCH /api/applications/:id/status` - Propagates status through defined valid transitions (e.g. `draft -> submitted -> review`). It also stores historical change trails within the `timeline` array using timestamps.
- `GET /api/applications` - Retrieves filtered applications (Requires Role Auth).

### Program Discovery APIs (With QueryBuilder)
- `GET /api/programs` - Discover programs. Cached for 5 minutes.
  *Query Params:* `country`, `degreeLevel`, `intake`, `field`, `maxTuition`, `q` (search string), `sortBy`, `sortOrder`, `page`, `limit`.

### Recommendation Engine APIs
- `GET /api/recommendations/:studentId` - Suggests top 10 ranked programs based on Student preferences. Fully executes in Mongoose Aggregation pipelines scoring matching variables (Country, Budget, IELTS, Intents).

---

## Indexing strategies
To ensure high performance under load, the following indexing strategies have been implemented:
1. **Compound Indexes**: Used in the `Application` model (`student`, `program`, `intake`) to enforce uniqueness and optimize frequent lookups.
2. **Field Indexes**: `country`, `degreeLevel`, and `field` are indexed in the `Program` model to support fast discovery filtering.
3. **Ascending/Descending Sorting**: Specific indexes on `tuitionFeeUsd` and `popularScore` facilitate optimized sorting without in-memory re-ranking.
4. **Text Indexing**: The `University` model utilizes text indexes on `name`, `country`, and `city` to enable efficient keyword searching.

## Performance Considerations
1. **Aggregation vs. In-memory**: The recommendation engine uses MongoDB's native aggregation pipeline. This avoids the overhead of fetching thousands of records into Node.js memory, significantly reducing latency and CPU usage.
2. **Dual-Layer Caching**: By utilizing Redis (primary) and Node-Cache (secondary), we minimize costly DB reads for static-ish data like University/Program lists.
3. **Database Projections**: All critical queries use `.lean()` and specific field projections to reduce the payload size transferred between MongoDB and the application server.
4. **Rate Limiting**: Protects the server from DDoS and brute force by limiting the number of requests per IP, ensuring resources remain available for legitimate users.
5. **Atomic Updates**: Application status updates use Mongoose `save()` which ensures schema validation or `findOneAndUpdate` where atomic precision is required.

---

## Running Tests

```bash
# Execute Jest test suite
npm run test
```

*Tests assert Auth, Application Workflow (prevent duplicate, status transitions), and the correctness of the Recommendation Aggregation outputs.*

---

## Assumptions Made
1. Application workflows follow strict directional lifecycles (can't go from enrolled back to draft, etc.) outlined in `config/constants.js`.
2. Redis is preferred but gracefully disabled. Memory cache binds to exactly the same interface so consumers face no disruption regardless of the state.

