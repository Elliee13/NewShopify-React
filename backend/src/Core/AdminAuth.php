<?php
namespace App\Core;

use App\Config\Admin;
use App\Core\Response;

class AdminAuth
{
    public static function check(): void
    {
        $headers = getallheaders();

        $token = $headers['X-Admin-Token'] ?? $headers['x-admin-token'] ?? null;

        if (!$token || $token !== Admin::API_TOKEN) {
            Response::json(['error' => 'Unauthorized'], 401);
        }
    }
}