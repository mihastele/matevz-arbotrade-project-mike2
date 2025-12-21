# VueNest E-commerce Platform

A modern, full-stack e-commerce platform built with **Vue.js 3** frontend and **NestJS** backend. Features a sleek, responsive design optimized for desktop and mobile experiences.

![Vue.js](https://img.shields.io/badge/Vue.js-3.4-4FC08D?style=flat-square&logo=vue.js)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Development](#-development)
  - [Running Locally](#running-locally)
  - [Docker Development](#docker-development)
  - [API Documentation](#api-documentation)
- [Production Deployment](#-production-deployment)
  - [Docker Compose](#docker-compose-recommended)
  - [Manual Deployment](#manual-deployment)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Storefront
- 🏠 **Home Page** - Hero section, featured products, category highlights
- 📦 **Product Catalog** - Grid/list views, advanced filtering, sorting, pagination
- 🔍 **Product Details** - Image gallery, variants, specifications, related products
- 🛒 **Shopping Cart** - Real-time updates, quantity management, guest & user carts
- 💳 **Checkout** - Multi-step checkout, address management, Stripe payments
- 📧 **Order Confirmation** - Order summary, email notifications

### User Account
- 🔐 **Authentication** - JWT-based login/register with role-based access
- 👤 **Profile Management** - Edit personal information, change password
- 📍 **Address Book** - Multiple shipping/billing addresses
- 📋 **Order History** - View past orders, order details, tracking

### Admin Dashboard
- 📊 **Dashboard** - Sales overview, recent orders, statistics
- 📝 **Product Management** - CRUD operations, image uploads, inventory
- 🏷️ **Category Management** - Hierarchical categories, SEO slugs
- 📦 **Order Management** - Order processing, status updates, fulfillment

### Technical Features
- 🔒 **Security** - JWT authentication, rate limiting, input validation
- 📱 **Responsive** - Mobile-first design, works on all devices
- ⚡ **Performance** - Code splitting, lazy loading, optimized builds
- 🎨 **UI/UX** - Clean design system, consistent components, smooth transitions

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Vue.js 3 | Reactive UI framework with Composition API |
| Vue Router 4 | Client-side routing with guards |
| Pinia | State management |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client |
| TypeScript | Type safety |

### Backend
| Technology | Purpose |
|------------|---------|
| NestJS 11 | Node.js framework |
| TypeORM | Database ORM |
| PostgreSQL | Primary database |
| Passport.js | Authentication |
| JWT | Token-based auth |
| Stripe | Payment processing |
| Swagger | API documentation |
| Class Validator | Input validation |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy & static serving |

---

## 📁 Project Structure

```
vuenest/
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── users/         # User management
│   │   │   ├── products/      # Product catalog
│   │   │   ├── categories/    # Product categories
│   │   │   ├── cart/          # Shopping cart
│   │   │   ├── orders/        # Order processing
│   │   │   ├── payments/      # Stripe integration
│   │   │   └── uploads/       # File uploads
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry
│   ├── uploads/               # Uploaded files
│   ├── Dockerfile             # Production container
│   ├── Dockerfile.dev         # Development container
│   └── package.json
│
├── frontend/                   # Vue.js SPA
│   ├── src/
│   │   ├── api/               # API client modules
│   │   ├── components/        # Reusable components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── product/       # Product components
│   │   │   └── ui/            # Base UI components
│   │   ├── composables/       # Vue composables
│   │   ├── router/            # Route definitions
│   │   ├── stores/            # Pinia stores
│   │   ├── types/             # TypeScript types
│   │   ├── views/             # Page components
│   │   │   ├── account/       # User account pages
│   │   │   ├── admin/         # Admin dashboard pages
│   │   │   └── auth/          # Auth pages
│   │   ├── App.vue            # Root component
│   │   └── main.ts            # Application entry
│   ├── nginx.conf             # Nginx configuration
│   ├── Dockerfile             # Production container
│   ├── Dockerfile.dev         # Development container
│   └── package.json
│
├── docker-compose.yml          # Production setup
├── docker-compose.dev.yml      # Development setup
├── .env.example               # Environment template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **PostgreSQL** 14+ (or use Docker)
- **Git**

Optional for Docker deployment:
- **Docker** 24.x or higher
- **Docker Compose** v2.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vuenest.git
   cd vuenest
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Configuration

1. **Create environment file**
   ```bash
   # From project root
   cp .env.example .env
   ```

2. **Configure required variables**
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=vuenest

   # JWT (generate a strong secret!)
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRATION=7d

   # Stripe (from dashboard.stripe.com)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Application
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

3. **Backend environment** (create `backend/.env`)
   ```bash
   cp backend/.env.example backend/.env
   # Edit with your values
   ```

---

## 💻 Development

### Running Locally

1. **Start PostgreSQL**
   
   Using Docker:
   ```bash
   docker run -d \
     --name vuenest-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=vuenest \
     -p 5432:5432 \
     postgres:16-alpine
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm run start:dev
   ```
   Backend runs at: http://localhost:3000

3. **Start the frontend** (new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs at: http://localhost:5173

### Docker Development

For a complete containerized development environment with hot reload:

```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

Services:
- **Frontend**: http://localhost:5173 (with hot reload)
- **Backend**: http://localhost:3000 (with hot reload)
- **PostgreSQL**: localhost:5432

### API Documentation

Swagger documentation is available when running the backend:

📚 **API Docs**: http://localhost:3000/api/docs

### Useful Commands

**Backend**
```bash
npm run start:dev      # Development with watch mode
npm run start:debug    # Debug mode (attach debugger on :9229)
npm run build          # Build for production
npm run lint           # Run ESLint
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run migration:run  # Run database migrations
```

**Frontend**
```bash
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

### Admin Setup

#### Automatic Admin User Creation (Recommended)

The application can automatically create an admin user on first startup using environment variables:

**1. Configure Environment Variables**

Edit your `.env` file (or set in Docker):

```env
# Admin User Auto-Creation
ADMIN_SETUP_KEY=your-secure-random-key-here
ADMIN_EMAIL=admin@arbotrade.si
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

**2. Start the Application**

```bash
docker compose up -d
```

The backend will automatically:
- Check if an admin user exists
- If not, create one with the specified credentials
- If user exists but isn't admin, promote them to admin role
- Log the creation status to console

**Security Notes:**
- Change `ADMIN_SETUP_KEY` from the default value
- Use a strong, unique password for `ADMIN_PASSWORD`
- The setup key must be set to a custom value (not the default) for auto-creation to work
- After first login, immediately change the password through the UI

**3. Login**

Navigate to http://localhost/login and use the configured admin credentials.

#### Manual Admin User Creation

**Method 1: Database Update**

After registering a normal user account through the UI, you can promote them to admin via database:

```bash
# Connect to PostgreSQL
docker exec -it vuenest-postgres-1 psql -U postgres -d vuenest

# Or if not using Docker:
psql -U postgres -d vuenest
```

Then run this SQL to promote a user to admin:

```sql
-- Replace 'user@example.com' with the actual email
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Verify the change
SELECT id, email, role FROM users WHERE email = 'user@example.com';

-- Exit psql
\q
```

**Method 2: Direct User Creation**

Create an admin user directly in the database:

```sql
-- Connect to database (as shown above)
-- Then create the admin user (replace values as needed):

INSERT INTO users (email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  'admin@arbotrade.com',
  '$2b$10$YourHashedPasswordHere',  -- You'll need to hash this first
  'Admin',
  'User',
  'admin',
  NOW(),
  NOW()
);
```

**Important**: For Method 2, you need to hash the password first. You can use this Node.js command:

```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword123', 10).then(hash => console.log(hash));"
```

Then replace `$2b$10$YourHashedPasswordHere` with the output hash.

**Method 3: Registration + Database Update (Easiest)**

1. Register a new account through the UI at http://localhost/register
2. Use your desired admin credentials (e.g., admin@arbotrade.com)
3. Immediately promote the account using Method 1 above
4. Log out and log back in to access admin features

#### Accessing Admin Features

Once you have an admin account:

1. Log in with your admin credentials
2. Click on your profile in the top right
3. You'll see "Admin Panel" link (only visible to admin users)
4. Access routes like:
   - `/admin/dashboard` - Overview and statistics
   - `/admin/products` - Product management
   - `/admin/orders` - Order management
   - `/admin/categories` - Category management

#### Admin Role Verification

To verify a user's admin status:

```bash
# Via database
docker exec -it vuenest-postgres-1 psql -U postgres -d vuenest -c "SELECT email, role FROM users;"

# Or check the JWT token payload after login (developers)
# Admin users will have role: 'admin' in the token
```

---

## 🏭 Production Deployment

### Docker Compose (Recommended)

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

   **Important**: Set strong values for:
   - `DB_PASSWORD` - Strong database password
   - `JWT_SECRET` - Generate with: `openssl rand -base64 64`
   - `STRIPE_SECRET_KEY` - Your live Stripe key
   - `FRONTEND_URL` - Your production domain

2. **Build and start services**
   ```bash
   docker compose up -d --build
   ```

3. **Verify deployment**
   ```bash
   # Check service health
   docker compose ps
   
   # View logs
   docker compose logs -f
   ```

4. **Access the application**
   - Frontend: http://localhost (or your domain)
   - Backend API: http://localhost/api
   - API Docs: http://localhost:3000/api/docs

### Manual Deployment

1. **Build the backend**
   ```bash
   cd backend
   npm ci --legacy-peer-deps
   npm run build
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

3. **Deploy**
   - Backend: Deploy `backend/dist` folder with Node.js
   - Frontend: Deploy `frontend/dist` folder with Nginx/Caddy

### SSL/HTTPS Setup

For production, add a reverse proxy (Nginx, Caddy, or Traefik) with SSL. Example with Caddy:

```caddyfile
yourdomain.com {
    # Frontend
    handle {
        root * /path/to/frontend/dist
        try_files {path} /index.html
        file_server
    }
    
    # API proxy
    handle /api/* {
        reverse_proxy localhost:3000
    }
    
    # Uploads proxy
    handle /uploads/* {
        reverse_proxy localhost:3000
    }
}
```

---

## 🏗 Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Request                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Application                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Guards    │  │    Pipes     │  │    Interceptors     │ │
│  │ (JWT Auth)  │  │ (Validation) │  │ (Transform/Logging) │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                      Controllers                         │ │
│  │   Auth │ Users │ Products │ Cart │ Orders │ Payments    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                       Services                           │ │
│  │   Business Logic, Validation, Data Processing           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   TypeORM Repositories                   │ │
│  │             Entity Mapping, Query Building               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       PostgreSQL                             │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vue.js SPA                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Vue Router                            │ │
│  │         Route Guards, Navigation, Lazy Loading          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                       Views                              │ │
│  │   Home │ Products │ Cart │ Checkout │ Account │ Admin   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│       ┌──────────────────────┼──────────────────────┐       │
│       ▼                      ▼                      ▼       │
│  ┌──────────┐         ┌───────────┐         ┌─────────────┐ │
│  │Components│         │Composables│         │   Stores    │ │
│  │  (UI)    │         │ (Logic)   │         │  (Pinia)    │ │
│  └──────────┘         └───────────┘         └─────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    API Client (Axios)                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | User login |
| `/api/auth/profile` | GET | Get current user profile |
| `/api/auth/refresh` | POST | Refresh JWT token |

### Products

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List products (paginated) |
| `/api/products/:slug` | GET | Get product by slug |
| `/api/products` | POST | Create product (admin) |
| `/api/products/:id` | PATCH | Update product (admin) |
| `/api/products/:id` | DELETE | Delete product (admin) |

### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories` | GET | List all categories |
| `/api/categories/:slug` | GET | Get category by slug |
| `/api/categories` | POST | Create category (admin) |
| `/api/categories/:id` | PATCH | Update category (admin) |
| `/api/categories/:id` | DELETE | Delete category (admin) |

### Cart

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cart` | GET | Get current cart |
| `/api/cart/add` | POST | Add item to cart |
| `/api/cart/update` | PATCH | Update cart item |
| `/api/cart/remove/:id` | DELETE | Remove item from cart |
| `/api/cart/clear` | DELETE | Clear cart |

### Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET | List user orders |
| `/api/orders/:id` | GET | Get order details |
| `/api/orders` | POST | Create order |
| `/api/orders/:id/status` | PATCH | Update order status (admin) |

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/create-intent` | POST | Create Stripe PaymentIntent |
| `/api/payments/webhook` | POST | Stripe webhook handler |

Full API documentation available at `/api/docs` when running the backend.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules (run `npm run lint`)
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Stripe](https://stripe.com/) - Payment processing platform

---

<p align="center">
  Made with ❤️ for modern e-commerce
</p>
