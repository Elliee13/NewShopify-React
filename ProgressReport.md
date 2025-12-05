# 📌 Project Progress Report – Custom + Shopify Hybrid System

## ✅ Completed Milestones

### 1. Custom Frontend Foundation
- Built a custom UI using HTML + Tailwind + Vanilla JS.
- Implemented a two-step customizer workflow:
  1. Upload artwork
  2. Choose garment, color, size, quantity
- Added live product mockup preview with artwork overlay.
- Built a dynamic color/size/variant selector.

### 2. Backend REST API (PHP)
- Clean MVC-style structure under `/src`.
- Core Router + Response helpers implemented.
- ShopifyClient service added (Storefront API integration).
- Environment config & autoloading set up.
- Successfully connected to Shopify Storefront API.

### 3. Products API + Frontend Integration
- `/api/products` returns all products + variants from Shopify.
- Frontend displays products fully.
- Variant matching works (color/size → variant ID).
- Estimated price calculation implemented.

### 4. Artwork Upload System
- Created `/api/upload` endpoint:
  - Validates file type & size
  - Stores file in `/public/uploads`
  - Returns secure filename + public URL
- Frontend now uploads artwork instantly after selection.

### 5. Cart + Checkout Integration
- Created `/api/cart/lines` endpoint:
  - Builds Shopify cart
  - Sends variant, quantity, and custom line item properties
  - Includes uploaded artwork info (stored file name + URL)
- Redirects user to Shopify checkout with full customization data.
- Verified successful checkout with correct details in Shopify.

### 6. UI/UX Improvements
- Stepper for “Upload → Customize”
- Clean layout for preview + configuration panel
- Debug panel to validate variant logic
- Fixed color selection behavior

---

## 🟡 Current Status

- Artwork uploads work both locally and backend-side.
- Shopify checkout displays:
  - Product
  - Color
  - Size
  - Quantity
  - Artwork metadata
- Variant matching logic now correct for size + color.
- Codebase stable and ready for next expansion phase.

---

## 🎯 Next Steps (Priority Order)

### 1. Build **MySQL “designs” table**
This will store every personalization job:
- variant ID
- product ID
- quantity
- color, size
- artwork stored filename
- artwork URL
- Shopify cart/checkout IDs
- job status (pending/printing/completed)

### 2. Add **POST /api/designs** endpoint
Triggered after cart creation — logs design into the database.

### 3. Build Internal Admin Dashboard (Production UI)
- List all design jobs
- View artwork + garment info
- Update job status
- Search/filter jobs

### 4. Add optional UI features:
- Artwork scaling/positioning
- Multiple print locations
- Save multiple customizations before checkout

---

## 🚀 Quick Wins Coming Next
- Define SQL schema for `designs`
- Create `DesignController.php`
- Connect checkout → MySQL tracking
- Start admin dashboard (HTML + Tailwind + simple PHP)

---

## 29/11/2025 12:00 PM -> 2:00 PM

### Highlights
- **Dual Experience Ready for A/B Testing**: finalized both public-facing flows (legacy HTML/Tailwind + React/Vite) so we can direct traffic to two distinct funnels for upcoming experiments.
- **Shopify Integration Live End-to-End**: confirmed the PHP API continues to proxy to Shopify for products, uploads, and cart creation after the frontend refactor; PrintBuilder now uses the new base-URL helper so tunnels and future deployments still reach Shopify.
- **Media + UX Refresh**: About hero now streams our official YouTube reel in place of placeholder imagery; layout polish preserved stats/pattern treatments and removed unused assets.
- **Dev Tooling Improvements**: added npm run setup, documented env handling, and whitelisted ngrok/cloudflared hosts so ramp-up + remote demos are frictionless.
- **Reliable Fetching Over Tunnels**: standardized `.env` defaults + Vite `allowedHosts` so API traffic, product fetching, and artwork uploads work whether the app runs locally, via ngrok/cloudflared, or future Vercel deployments.
- **Deployment Ready Builds**: verified `public/npm run build` after each configuration change, keeping the React bundle ship-ready and ensuring Shopify-facing endpoints still pass data integrity checks.
- **Documented Sharing Playbook**: captured ngrok/cloudflared workflow and troubleshooting tips directly in `How-to-run.md`, giving teammates a dependable reference for spinning up demos without cloud hosting.
- **Video Content Alignment**: replaced placeholder About imagery with the official Freckles reel to strengthen credibility across both A/B variants and align marketing collateral in one sprint.
- **Setup Automation**: added an `npm run setup` command that runs Composer + npm installs concurrently, shrinking onboarding time and reducing “missing dependency” issues across the team.
- **Shopify Data Integrity**: revalidated uploads/cart flows against Shopify after the refactor, ensuring custom line-item properties still carry artwork metadata into checkout for production tracking.

12/1/2025

✅ **What I Completed:**

* React + Vite Frontend Migration — Successfully moved the custom apparel builder UI into a clean React component structure with Tailwind styling.
* Backend API Integration — Confirmed `/api/upload`, `/api/products`, and `/api/cart/lines` are functioning correctly through both frontend and Postman tests.
* Upload System Fixes — Updated the `UploadController` to return correct public URLs and validated uploads for PNG/JPG/SVG/PDF.
* Product & Variant Flow — Products load correctly from Shopify, variant matching is stable, and live price calculation works.
* Checkout Flow Validation — The backend successfully builds Shopify carts with custom properties and returns `checkoutUrl`.
* Postman Validation — All core endpoints tested with happy paths and failure cases to confirm robustness.

🔧 **Current Status:**

* Frontend: ✅ Fully functional React UI with working preview, selectors, and cart integration
* Backend APIs: ✅ Stable and returning clean JSON
* Upload System: ✅ Correct URLs and storage behavior
* Shopify Integration: ✅ Cart creation and checkout confirmed
* Error Handling: ✅ Gracefully handles invalid uploads and variant errors

🎯 **Immediate Next Steps:**

* Build MySQL `designs` table — Store product, variant, artwork, and checkout metadata for production workflow.
* Implement `POST /api/designs` — Log each completed configuration into the database after cart creation.
* Create Admin Dashboard — A simple internal UI to view orders, artwork files, and job statuses (pending → printing → completed).
* Add Optional Enhancements — Artwork scaling/positioning, multiple print areas, and improved section-level UI feedback.

🚀 **Quick Wins:**

* Generate SQL schema for `designs` table
* Add `Database/connection.php` + PDO integration
* Build `DesignsController.php` with `store()` method
* Connect frontend checkout flow to `/api/designs` logging
* Begin admin UI structure (React or PHP) with Tailwind components

12/3/2025

✅ What I Completed:
Frontend (React + Vite)

- Built the Admin Dashboard entry point with React Router ( /admin/* ).
- Created the Admin layout, top nav, sidebar, and environment badges.
- Implemented the Print Jobs page (DesignsPage) with filters, search, pagination, and clean UI.
- Designed and integrated a fully functional jobs table:
  - Created column layout (Created, Product/Variant, Qty, Status, Artwork, Checkout)
  - Added status pills (Pending/Printing/Completed)
  - Added artwork and checkout action buttons
  - Styled using Tailwind with a Shopify-admin-like UI

Backend (PHP MVC)

- Integrated /api/designs GET endpoint with:
  - Pagination
  - Search filtering
  - Status filtering
  - Sorting

- Updated SQL query + response mapping to match TypeScript types (removed updated_at mismatch).
- Added proper JSON response structure (data + pageInfo).
- Implemented CORS configuration for local React dev environment.
- Verified data flow end-to-end for real jobs from the MySQL designs table.

API + Connectivity
- Fixed all CORS issues between React (localhost:3000) and XAMPP (/backend/public/api.php).
- Validated GET /api/designs in Postman (200 OK).
- Connected React’s fetchDesigns() to the backend and confirmed correct JSON output.
- Removed legacy debug JSON card and ensured UI renders the new jobs table.

🔧 Current Status:

- Admin layout: ✅ Complete
- Designs listing page: ✅ Fully functional
- GET /api/designs: ✅ Refined and operational
- Table rendering: ✅ Clean UI with Tailwind
- Filters & Search: ✅ Working
- Pagination: ✅ Working
- CORS handling: ✅ Working
- Data flow React → PHP → MySQL → React: ✅ Stable

Nothing in the current flow is blocking progress.

🎯 Immediate Next Steps:
1. Status Updater (Phase D)
  Add a PATCH /api/designs/:id or /api/designs/status endpoint
  Add a “Change Status” dropdown in each row
  Support workflow:
  Pending → Printing → Completed
  Implement optimistic UI updates

2. Artwork Modal (Phase E)
  Add modal viewer for artwork files
  Include download button and larger preview

3. Enhancements

  Improve Product/Variant formatting with Shopify titles
  Add date range filter
  Add sorting controls in the UI

🚀 Quick Wins:

  Add updateStatus() API to backend (fast to implement)
  Build StatusDropdown.tsx component
  Add modal component for artwork (ArtworkModal.tsx)
  Add “Completed Jobs” sidebar route
  Add loading skeleton for the table

  12 - 4 to 5 - 2025

  ✅ Progress Report

Frontend (React + Vite)

Admin Dashboard

  Built the entire Admin Dashboard system with React Router under /admin/*.
  Added Admin Login screen with environment password (Vite env variables).
  Developed a protected admin layout (sidebar + topbar + environment badges).
  Added conditional rendering so /admin is locked until authenticated.

DesignsPage (Print Jobs)

Implemented a modern, production-grade UI for managing print jobs:
  Status tabs (All / Pending / Printing / Completed)
  Sort (Newest First / Oldest First)
  Search bar with icon
  Pagination footer
  CSV export
  Include Archived toggle

Fully redesigned UI using Tailwind:

  Rounded-3xl containers
  Light Shopify-style shadows
  Status color accents
  Consistent spacing & typography
  Hover states & clean transitions

Job Details Panel

  Implemented full slide-out drawer with:
    Metadata summary
    Notes editor (with Save + Reset)
    Full Activity Timeline
    Sticky header & scrollable content

Artwork Viewer Modal

  Added modal to preview uploaded artwork in large view.

UX Improvements

  Added status-colored accents in table rows
  Added copy buttons (product ID, variant ID, checkout URL)
  Updated pagination UI to rounded-pill format
  Added loading states, empty states, error states
  Table now full width with proper responsive behavior

Backend (PHP MVC - DesignsController)

API Routing

  Converted /api/designs and related routes to protected admin routes.
  Added AdminAuth middleware using X-Admin-Token header.
  Added CORS rules with credentials support.

Designs API Enhancements

/api/designs now supports:
  Pagination
  Search
  Status filtering
  Sorting (ASC / DESC)
  Archived filtering
  Summary counts (pending/printing/completed/total)

Updated SQL structure & output mapping:
  Added notes field support
  Consistent timestamp fields
  Normalized response to match TypeScript types

Job Status Update API

  /api/designs/status supports:
    Validation
    Optimistic UI
    Error fallback

Archive API

  /api/designs/archive
    Marks job archived
    Updates timestamp
    Immediately removes job from UI

Notes API

  /api/designs/notes
    Saves internal notes
    Updates job updated_at
    Live update in React via callback

Event Logging System

  Created design_events table for complete audit history:
    status_change
    note_update
    archive

  Extended backend:
    Added automatic event recording in updateStatus(), updateNotes(), and archive().
    Implemented /api/designs/logs endpoint to fetch job history.

Frontend:

  Activity Timeline now shows:
    Status changes with colors
    Notes edit previews
    Archive events
    Timestamps

API + Connectivity

  Fixed all CORS issues between React and PHP:
    Added required headers
    Enabled credentials
    Allowed localhost origins

  Fixed security issues:
    Added token-based auth
    Required credentials in fetch requests
    Denied all admin API calls unless logged in
    
  Verified admin APIs in Postman (with testing token).

🔧 Current Status

Feature	% Status

Admin Login + Lockdown	✅ Complete & Secure
Admin Layout (Sidebar + Topbar)	✅ Done
DesignsPage UI	✅ Polished & Fully Functional
Sorting / Filtering / Pagination	✅ Live
Status updates	✅ Fully working
Notes system	✅ Working with real-time updates
Archive system	✅ Working with DB logging
Artwork Modal	✅ Working
Job Details Panel	✅ Working
Event Logging + Timeline	✅ Completed
API Auth System	✅ Working with tokens
CORS & Credentials	✅ Fixed
DB Structure	✅ Finalized & stable