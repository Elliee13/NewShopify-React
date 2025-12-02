<?php
// src/Config/config.php

use Dotenv\Dotenv;

$root = dirname(__DIR__, 2);

if (file_exists($root . '/.env')) {
    $dotenv = Dotenv::createImmutable($root);
    $dotenv->safeLoad();
}

return [
    'shopify' => [
        'domain'          => $_ENV['base_url'] ?? '',
        'storefrontToken' => $_ENV['storefront_access_token'] ?? '',
        'apiVersion'      => $_ENV['api_version'] ?? '2024-01',
    ],
    'db' => [
        'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
        'port' => $_ENV['DB_PORT'] ?? '3306',
        'name' => $_ENV['DB_NAME'] ?? 'custom_print',
        'user' => $_ENV['DB_USER'] ?? 'root',
        'pass' => $_ENV['DB_PASS'] ?? '',
    ],
];
