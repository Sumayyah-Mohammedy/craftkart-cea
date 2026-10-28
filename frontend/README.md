# CraftKart UI Evaluation

CraftKart is a full-stack e-commerce platform featuring separate interfaces and authentication for buyers, sellers, and admins. This repository contains both the frontend (React + Tailwind CSS) and backend (Node.js + Express + MongoDB) code.

## Features

### Buyer
- Browse products, view details, and add to cart
- Secure checkout with multiple payment options (Stripe, COD)
- Order tracking and order history
- Profile management and authentication

### Seller
- Seller registration and login
- Dashboard for managing products and orders
- Product CRUD operations
- Order management

### Admin
- Admin login
- Dashboard for user, seller, and order management
- Verification and reporting tools

## Tech Stack

- **Frontend:** React, Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB
- **Payments:** Stripe integration

## Getting Started

### Prerequisites
- Node.js and npm
- MongoDB

### Installation

1. **Clone the repository:**
   ```sh
   git clone <https://github.com/amnaasimkhan/CraftKart>
   cd craftkart UI Evaluation
   ```

2. **Install dependencies:**
   - For backend:
     ```sh
     cd backend
     npm install
     ```
   - For frontend:
     ```sh
     cd ../frontend
     npm install
     ```

3. **Configure environment variables:**
   - Set up your MongoDB URI and Stripe keys in `backend/config/database.js` and related files.

4. **Run the backend:**
   ```sh
   npm run dev
   
   ```
   (from the `backend` directory)

5. **Run the frontend:**
   ```sh
   npm start
   ```
   (from the `frontend` directory)

6. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000) (default)

## Folder Structure

- `frontend/` — React app source code
- `backend/` — Node.js/Express API and business logic

## Contributing


## License

[MIT](LICENSE)
