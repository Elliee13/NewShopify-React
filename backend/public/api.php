<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Router;
use App\Core\Response;
use App\Controllers\ProductsController;
use App\Controllers\CartController; 
use App\Controllers\UploadController; 
use App\Controllers\DesignsController;
use App\Core\AdminAuth;

$router = new Router();

// -------------------------
// CORS HEADERS (DEV)
// -------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    // For local dev you can keep this permissive
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Token');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// -------------------------
// Public / customer-facing routes
// -------------------------
$router->get('/api/products', [ProductsController::class, 'index']);
$router->post('/api/cart/lines', [CartController::class, 'addLine']);
$router->post('/api/upload', [UploadController::class, 'upload']);

// -------------------------
// Admin-only routes (protected by AdminAuth)
// -------------------------

// GET /api/designs  (list with filters, summary, pagination)
$router->get('/api/designs', function () {
    AdminAuth::check();
    (new DesignsController())->index();
});

// POST /api/designs (store new design log)
$router->post('/api/designs', function () {
    AdminAuth::check();
    (new DesignsController())->store();
});

// POST /api/designs/status (update job status)
$router->post('/api/designs/status', function () {
    AdminAuth::check();
    (new DesignsController())->updateStatus();
});

// POST /api/designs/archive (archive job)
$router->post('/api/designs/archive', function () {
    AdminAuth::check();
    (new DesignsController())->archive();
});

// POST /api/designs/notes (update internal notes)
$router->post('/api/designs/notes', function () {
    AdminAuth::check();
    (new DesignsController())->updateNotes();
});

$router->get('/api/designs/logs', [DesignsController::class, 'logs']);


// -------------------------
// Dispatch
// -------------------------
try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (Throwable $e) {
    Response::json(['error' => $e->getMessage()], 500);
}
