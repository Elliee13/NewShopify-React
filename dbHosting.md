📘 Database + Hosting Architecture (For Shopify Deployment)

Updated Documentation — Custom Print Builder System

🎯 Overview

Your Shopify-integrated custom print builder does not rely on Shopify to host data or run backend logic.
Instead, all database operations are handled by your own backend + MySQL server, exactly like in local development.

Shopify acts as:

- The storefront (product pages, checkout)
- The authentication system (optional for customers)
- The payment gateway

Your backend acts as:

- The print job manager
- The design uploader
- The Shopify API proxy
- The production workflow engine

Your database acts as:

The source of truth for designs, job statuses, artwork URLs, notes, and logs.

🧱 1. Where the Database Lives in Production

Your MySQL database does not live inside Shopify.
It lives on your server (or a managed SQL provider):

- DigitalOcean MySQL / MariaDB
- AWS RDS
- cPanel MySQL
- Cloudways MySQL

Local Linux server (LAMP / LEMP)

Your backend (PHP) connects to this database using environment variables:

DB_HOST=xxxx
DB_NAME=xxxx
DB_USER=xxxx
DB_PASS=xxxx


No Shopify connection to MySQL exists — only your backend interacts with it.

🔌 2. How Shopify Uses Your Database

Shopify never directly touches your DB.
Instead, your frontend builder and admin dashboard talk to your backend REST API.

Example flow:

🛒 Customer journey
1. Customer opens a Shopify product page.
2. They click Customize Your Print.
3. Your React app loads (embedded or external).
4. React calls your backend:

/api/products
/api/upload
/api/cart/lines
/api/designs

5. Your backend logs designs into MySQL (designs table).
6. Checkout is handled by Shopify Storefront API.
7. Production staff view jobs in your Admin Dashboard — all powered by MySQL.

🗄 3. Database Responsibilities
✔ Stores every print job

- product_id
- variant_id
- quantity
- color, size
- artwork info
- Shopify cart_id
- checkout_url
- status tracking (pending → printing → completed)
- timestamps

✔ Stores notes and job history
(added in Phase 4)

✔ Stores audit logs
(status changes, notes updates, archives)

✔ Stores admin-only metadata
(archived jobs, internal actions)

📨 4. Backend Responsibilities

Your backend:

- Receives AJAX calls from the React builder and admin UI.
- Talks to Shopify via Storefront API.
- Moves uploaded artwork into permanent storage.
- Logs designs into MySQL.
- Provides /admin endpoints protected by:
    - Admin login password (frontend)
    - Admin API token (backend)

Your backend URL in production looks like:

https://api.yourprintbrand.com/api/designs

🌐 5. Frontend Deployment

You have two choices:

Option A — Host React apps on your own server (recommended)
    https://app.yourprintbrand.com → Print Builder
    https://admin.yourprintbrand.com → Admin Dashboard

React → talks to your backend → talks to Shopify / MySQL.

Option B — Embed React bundle inside Shopify theme
    - Build Vite bundle.
    - Upload JS/CSS to theme assets.
    - Inject a <div id="builder"></div> + script loader.
    - React still calls your backend API.

🔐 6. Production Security Layers
✔ Frontend login gate

Password from .env:

VITE_ADMIN_PASSWORD

✔ Backend token authorization
All admin API endpoints require:

X-Admin-Token: <TOKEN>


Token comes from:

VITE_ADMIN_TOKEN
Admin::API_TOKEN (PHP)

These must match.

🎛 7. CORS Setup for Shopify

In production update:

$allowedOrigins = [
    'https://yourstore.myshopify.com',
    'https://app.yourprintbrand.com',
    'https://admin.yourprintbrand.com',
];


This allows your React frontend (wherever hosted) to call your backend.

🔁 8. Complete System Flow Diagram (Simplified)
Customer → Shopify Storefront → Product Page
                          ↓
                React Print Builder (hosted by you or theme)
                          ↓
                Your PHP Backend (REST API)
                          ↓
          ┌──────────────┴──────────────┐
          │                              │
     Shopify Storefront API           MySQL DB
     (cart creation, checkout)        (designs, logs)


Admin Dashboard flow:

Admin UI → /admin login → backend verifies token → fetches MySQL data

🚀 9. Deployment Summary (TL;DR)

- You keep your database exactly as is.
- You deploy your backend on a real server.
- You point the React apps to the backend.
- Shopify theme loads the React print builder.
- Designs + production workflow live entirely in your DB, not Shopify.
- Shopify is simply the ecommerce layer.

