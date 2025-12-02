📘 CUSTOM SHOPIFY BUILDER SYSTEM — UPDATED DOCUMENTATION (Dec 2025)
1. System Overview
A hybrid React + PHP system allowing customers to:

1. Upload artwork
2. Select a garment
3. Customize color, size, quantity
4. Preview the final mockup
5. Checkout through Shopify
6. Log the design into a MySQL database for production

The system also includes a backend API layer and an upcoming production dashboard.

2. Architecture Summary

Frontend (React + Vite)

1. Artwork upload + live preview
2. Product & variant selection synced to Shopify
3. Dynamic mockup layering system
4. Live pricing based on selected variant
5. Shopify checkout creation
6. Logs all design data after cart creation

Backend (PHP)

1. REST API (/api/products, /api/upload, /api/cart/lines, /api/designs)
2. File upload validation + storage
3. Shopify Storefront API integration
4. MySQL database connection for storing designs
5. MVC-style controllers with clean routing

Database

Table: designs

   productId
   variantId
   color, size, quantity
   artworkFile, artworkUrl
   cartId, checkoutUrl
   status (pending, printing, completed)
   timestamps

3. Completed Features (Updated)
✅ Frontend Customizer

   Fully functional garment picker
   Overlay preview system
   Quantity & variant logic
   Artwork upload (local + server)
   Shopify checkout redirect
   Debug tooling
   Basic art scaling slider

✅ Backend API

   Product fetching from Shopify
   Cart creation and checkout URL retrieval
   Secure artwork uploads
   MySQL design logging
   /api/designs GET + POST

✅ Design Logging System

   Stores every custom job into the database
   Includes all metadata needed for production
   Ensures production team can trace the order

✅ Core Customer Flow

Upload → Choose Garment → Configure → Checkout → Store Job
This entire loop is now fully working.

Current System Completion: ~60–65%

The foundation is DONE.
What’s left is Admin UI + refinement + art-blending improvements.

4. Phase 2 — Admin Dashboard (Next in development)
🎛️ Admin Dashboard V1

Purpose: allow production staff to manage print jobs.

Features:

View all designs

Sort & filter by:
   status
   product
   date

Artwork viewer
   Show uploaded artwork file
   Show garment image

Status controls
   Pending → Printing → Completed

Notes field (optional)
Search bar (by customer name, product, etc.)

API additions:

   GET /api/designs
   PATCH /api/designs/{id} to update status
   Optional: DELETE /api/designs/{id}

UI Tech:

Pure PHP + HTML + Tailwind (fastest)
OR
React admin panel (optional)

5. Phase 3 — Art Blending Improvements

Your customers need the mockup to look “real,” not just an image pasted on top.

🖼️ Mockup Quality Roadmap

A) Per-Product Art Placement Config (DOING NEXT)

Each garment gets a config:

{
  "x": 0.5,
  "y": 0.32,
  "w": 0.45,
  "blendMode": "multiply",
  "opacity": 0.9
}


This allows:

   Correct placement for every garment
   Appropriate blending based on shirt color
   Scaling limits (avoid too-large prints)

B) Better Blending (Target Improvement)

   Use mix-blend-mode: multiply for light shirts
   Use screen / overlay for dark shirts
   Auto-detect dominant garment luminance
   Adjust opacity per color group

C) Future (Optional AI)

   AI-generated mockup that looks real
   Automatic wrinkle simulation
   Shadow + lighting adjustment

⚠️ AI mockup generator is optional and saved for later.

6. Phase 4 — Final Polish & Deployment
🧪 Quality Assurance

   Full testing across 10 garment types
   Stress test image uploads (25MB)
   Verify Shopify checkout on staging
   Validate admin workflow end-to-end

🔐 Security

   Protect Admin Dashboard with login
   Move API keys to environment variables
   Enforce HTTPS in production
   Sanitize uploaded file names

🚀 Deployment

   Deploy backend to:
      cPanel / VPS / DigitalOcean / Render
   Deploy frontend to:
      Netlify / Vercel / static hosting

📦 Backup Strategy

   Daily MySQL backups
   Weekly design archive
   Auto-clean orphan artwork files

7. Full Updated Roadmap Summary
PHASE 1 — Customer Flow (DONE)

✔ Upload
✔ Product selection
✔ Customization + preview
✔ Shopify checkout
✔ Design logging

PHASE 2 — Admin Dashboard (NEXT)

➡ Admin page UI
➡ Status update system
➡ Artwork viewer
➡ Filtering + search
➡ Production notes

PHASE 3 — Mockup Blending Enhancements

➡ Per-garment blend configs
➡ Light/dark mode blending
➡ Better scaling logic

PHASE 4 — Polish & Deployment

➡ QA testing
➡ Security
➡ Production hosting
➡ Backup system

8. Completion Rate

Core customer experience: ~85%
Entire platform including admin tools: ~60–65% overall

You are well past the hardest part — the admin tools and blending refinements are straightforward compared to the API/cart system you've already completed.

9. Comprehensive details regarding to the rest of the phase

Where the remaining 35–40% lives

Admin Dashboard V1
   - Listing designs
   - Filters, status updates
   - Artwork viewer

Art blending improvements
   - Per-product tweak config, better overlay logic

Production readiness
   - Auth/permissions for admin
   - More defensive error handling
   - Final UX polish + responsive tweaks
   - Staging/production deployment + basic monitoring