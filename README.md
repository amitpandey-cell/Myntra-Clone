# StyleKart

StyleKart is a responsive fashion storefront built with React and Vite, with an Express REST API and MongoDB/Mongoose backend. The storefront includes a browsable 24-piece sample catalog and works as a preview without a database; account, order, review and administration features require the API and MongoDB.

## What’s included

- Homepage, department navigation, catalog search, categories, brands, sizes, price/discount filters and sorting.
- Product details with image gallery support, size and colour choices, quantity, delivery-pincode format check, ratings, reviews and related pieces.
- Cart and wishlist persisted in browser local storage; coupon codes `STYLE10` (10% off) and `FREESHIP`.
- Registration, login, logout, profile, saved shipping addresses and password reset by email.
- Authenticated checkout with Cash on Delivery and an optional Razorpay **test-mode-only** integration.
- Order history, tracking, eligible COD cancellation and return requests.
- Role-protected admin dashboard for store stats, products/inventory/categories, orders and user roles.
- Responsive layouts, loading/error/empty states, inline feedback and toast notifications.

## Run locally

Requirements: Node.js 20.19+ and MongoDB 7+ (local or hosted).

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set `MONGODB_URI` and a private `JWT_SECRET` of at least 32 characters. Generate a secret locally, for example:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

To create the initial administrator, set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `.env`, then seed the catalog and start both development servers:

```powershell
npm run seed
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173). The API listens on port 5000 and Vite proxies `/api` requests to it. `npm run dev` starts only the storefront; `npm run dev:api` starts only the API. If MongoDB is not configured, the sample storefront remains available but database-backed features return an explicit setup error.

## Optional integrations

- **Password reset:** configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Reset tokens are random, hashed in the database, and expire after 30 minutes. Without SMTP, the reset form reports that email delivery is unavailable.
- **Razorpay:** configure a test key ID beginning with `rzp_test_` and its matching test secret. The secret stays on the server; checkout verifies Razorpay’s signature and captured payment before creating an order. Live keys are intentionally rejected. Without test credentials, Cash on Delivery remains available and online payment is hidden.
- `CLIENT_URL` must match the browser origin when running outside the default local Vite URL.

Never commit `.env` or paste credentials into source files. `.env` is ignored by Git; `.env.example` contains placeholders only.

## Useful commands

```powershell
npm run lint
npm run build
npm test
npm run seed
npm start
```

`npm run seed` upserts the sample catalog. If the administrator variables are set, it creates the initial admin account with a bcrypt-hashed password or confirms the role of an existing account.

## API outline

- `GET /api/health`
- `GET /api/products`, `GET /api/products/:productId`
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `PUT /api/auth/profile`, `PUT /api/auth/addresses`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/reviews/:productId`, `POST /api/reviews/:productId`
- `GET /api/orders`, `POST /api/orders`, `POST /api/orders/razorpay/create`, `POST /api/orders/razorpay/verify`
- `GET /api/admin/stats`, `/api/admin/products`, `/api/admin/orders`, `/api/admin/users`
- `POST /api/newsletter`

Authentication uses an HTTP-only, SameSite cookie; the browser never receives or stores the JWT. Passwords are bcrypt-hashed. Admin access is assigned only through the seed configuration or by an existing administrator.
