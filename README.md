# Agri-Connect API

A RESTful API for connecting farmers with consumers built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Farmer profiles and product listings
- Product search and filtering
- Order management
- In-app messaging
- Notification system
- Location-based services

## API Endpoints

### 1. Authentication & Users

| Method | Path                  | Description                            |
|--------|-----------------------|----------------------------------------|
| POST   | `/auth/register`      | Sign up (farmer or consumer)           |
| POST   | `/auth/login`         | Login (returns JWT access & refresh)   |
| POST   | `/auth/refresh-token` | Refresh access token                   |
| GET    | `/auth/me`            | Get current user profile               |
| PUT    | `/auth/me`            | Update profile (name, avatar, etc.)    |

### 2. Farmers & Profiles

| Method | Path                   | Description                               |
|--------|------------------------|-------------------------------------------|
| GET    | `/farmers`             | List all registered farmers (with filters by location, rating) |
| GET    | `/farmers/:farmerId`   | Get a single farmer's public profile      |
| PUT    | `/farmers/:farmerId`   | Update farmer profile & payment details   |

### 3. Products (Listings)

| Method | Path                       | Description                             |
|--------|----------------------------|-----------------------------------------|
| POST   | `/farmers/:farmerId/items` | Create a new listing (e.g. 1 kg pork)   |
| GET    | `/items`                   | Browse all listings (with query params for category, price range, location radius) |
| GET    | `/items/:itemId`           | Get detailed info on a single listing   |
| PUT    | `/items/:itemId`           | Update price, stock, images             |
| DELETE | `/items/:itemId`           | Remove a listing                        |

### 4. Orders & Checkout

| Method | Path                         | Description                             |
|--------|------------------------------|-----------------------------------------|
| POST   | `/orders`                    | Place a new order (includes payment intent) |
| GET    | `/orders`                    | List current user's orders              |
| GET    | `/orders/:orderId`           | Get order details & status              |
| PUT    | `/orders/:orderId/status`    | Update order status (e.g. confirmed, shipped, delivered) |
| DELETE | `/orders/:orderId`           | Cancel an order (if allowed)            |

### 5. Messaging / Chat

| Method | Path                               | Description                           |
|--------|------------------------------------|---------------------------------------|
| GET    | `/conversations`                   | List open chats for current user      |
| GET    | `/conversations/:convId/messages`  | Fetch messages in a conversation      |
| POST   | `/conversations/:convId/messages`  | Send a new message                   |
| POST   | `/conversations`                   | Start a new chat (farmer ↔ consumer)  |

### 6. Miscellaneous

| Method | Path                        | Description                            |
|--------|-----------------------------|----------------------------------------|
| GET    | `/categories`               | List of product categories             |
| GET    | `/locations`                | Supported delivery/pick-up locations   |
| GET    | `/notifications`            | Fetch user's notifications             |
| PUT    | `/notifications/:id/read`   | Mark a notification as read            |

## Installation

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables in `.env` file
4. Start the server with `npm run dev`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/agri-connect-api
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRATION=30d
```

## Development

```bash
# Run in development mode with auto-restart
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Project Structure

```
agri-connect-api/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Entrypoint: loads app & starts HTTP server
│   ├── config/                # Env variables, database config
│   ├── routes/                # Route definitions
│   ├── controllers/           # Handlers for each route
│   ├── services/              # Business logic & DB interaction
│   ├── models/                # MongoDB/Mongoose models
│   ├── middlewares/           # Auth, validation, error handling
│   └── utils/                 # Helpers (e.g. JWT, email, payment)
├── tests/                     # Unit & integration tests
└── README.md
```

## License

MIT