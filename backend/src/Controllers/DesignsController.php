<?php
// src/Controllers/DesignsController.php

namespace App\Controllers;

use App\Core\Response;
use App\Database\Connection;
use PDOException;

class DesignsController
{
    /**
     * Helper to insert an event into design_events
     */
    private function logEvent(int $designId, string $action, $fromValue = null, $toValue = null): void
    {
        try {
            $pdo = Connection::get();

            $stmt = $pdo->prepare(
                "INSERT INTO design_events (design_id, action, from_value, to_value)
                 VALUES (:design_id, :action, :from_value, :to_value)"
            );

            $stmt->execute([
                ':design_id'  => $designId,
                ':action'     => $action,
                ':from_value' => $fromValue,
                ':to_value'   => $toValue,
            ]);
        } catch (\PDOException $e) {
            // Don't break the main flow if logging fails,
            // just write to PHP error log.
            error_log('Failed to insert design_event: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/designs
     * Store a new design record
     */
    public function store(): void
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data)) {
            Response::json(['error' => 'Invalid JSON body'], 400);
        }

        // Basic required fields
        $required = [
            'productId',
            'variantId',
            'quantity',
            'artworkFile',
            'artworkUrl',
            'cartId',
            'checkoutUrl',
        ];

        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                Response::json(['error' => "Missing field: {$field}"], 400);
            }
        }

        $productId   = $data['productId'];
        $variantId   = $data['variantId'];
        $color       = $data['color'] ?? null;
        $size        = $data['size'] ?? null;
        $quantity    = (int) ($data['quantity'] ?? 1);
        $artworkFile = $data['artworkFile'];
        $artworkUrl  = $data['artworkUrl'];
        $cartId      = $data['cartId'];
        $checkoutUrl = $data['checkoutUrl'];
        $status      = $data['status'] ?? 'pending';

        try {
            $pdo = Connection::get();

            $stmt = $pdo->prepare(
                "INSERT INTO designs
                 (product_id, variant_id, color, size, quantity,
                  artwork_file, artwork_url, cart_id, checkout_url, status)
                 VALUES
                 (:product_id, :variant_id, :color, :size, :quantity,
                  :artwork_file, :artwork_url, :cart_id, :checkout_url, :status)"
            );

            $stmt->execute([
                ':product_id'   => $productId,
                ':variant_id'   => $variantId,
                ':color'        => $color,
                ':size'         => $size,
                ':quantity'     => $quantity,
                ':artwork_file' => $artworkFile,
                ':artwork_url'  => $artworkUrl,
                ':cart_id'      => $cartId,
                ':checkout_url' => $checkoutUrl,
                ':status'       => $status,
            ]);

            $id = (int) $pdo->lastInsertId();

            Response::json([
                'success' => true,
                'id'      => $id,
            ]);
        } catch (PDOException $e) {
            // Log $e->getMessage() in real app
            Response::json(['error' => 'Failed to save design'], 500);
        }
    }

    /**
     * GET /api/designs
     * Paginated list + summary
     */
    public function index(): void
    {
        $status  = $_GET['status'] ?? null;
        $search  = trim($_GET['search'] ?? '');
        $sort    = $_GET['sort'] ?? 'created_desc';

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
        $offset  = ($page - 1) * $perPage;

        // allow ?includeArchived=1 if you ever want to see them
        $includeArchived = isset($_GET['includeArchived']) && $_GET['includeArchived'] == '1';

        try {
            $pdo = Connection::get();

            // WHERE conditions + params for main query
            $conditions = [];
            $params     = [];

            if (!$includeArchived) {
                $conditions[] = 'archived = 0';
            }

            if ($status && $status !== 'all') {
                $conditions[]      = 'status = :status';
                $params[':status'] = $status;
            }

            if ($search !== '') {
                $conditions[] =
                    '(product_id LIKE :q OR variant_id LIKE :q OR color LIKE :q OR size LIKE :q)';
                $params[':q'] = '%' . $search . '%';
            }

            $where = $conditions ? ('WHERE ' . implode(' AND ', $conditions)) : '';

            // Sort
            $orderBy = 'created_at DESC';
            if ($sort === 'created_asc') {
                $orderBy = 'created_at ASC';
            }

            // Main paginated query
            $stmt = $pdo->prepare(
                "SELECT id, product_id, variant_id, color, size, quantity,
                        artwork_file, artwork_url, cart_id, checkout_url,
                        status, created_at, updated_at, archived, notes
                 FROM designs
                 {$where}
                 ORDER BY {$orderBy}
                 LIMIT :limit OFFSET :offset"
            );

            $stmt->bindValue(':limit', $perPage, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);

            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            $stmt->execute();
            $rows = $stmt->fetchAll();

            // Total count for pagination
            $countStmt = $pdo->prepare(
                "SELECT COUNT(*) AS total
                 FROM designs
                 {$where}"
            );
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = (int) $countStmt->fetchColumn();

            // ---------- Summary counts (ignoring status filter, but respecting search + archived) ----------
            $summaryConditions = [];
            $summaryParams     = [];

            if (!$includeArchived) {
                $summaryConditions[] = 'archived = 0';
            }

            if ($search !== '') {
                $summaryConditions[] =
                    '(product_id LIKE :sq OR variant_id LIKE :sq OR color LIKE :sq OR size LIKE :sq)';
                $summaryParams[':sq'] = '%' . $search . '%';
            }

            $summaryWhere = $summaryConditions
                ? ('WHERE ' . implode(' AND ', $summaryConditions))
                : '';

            $summaryStmt = $pdo->prepare(
                "SELECT status, COUNT(*) AS cnt
                 FROM designs
                 {$summaryWhere}
                 GROUP BY status"
            );

            foreach ($summaryParams as $key => $value) {
                $summaryStmt->bindValue($key, $value);
            }

            $summaryStmt->execute();
            $summaryRows = $summaryStmt->fetchAll();

            $summary = [
                'pending'   => 0,
                'printing'  => 0,
                'completed' => 0,
                'total'     => 0,
            ];

            foreach ($summaryRows as $r) {
                $st  = $r['status'];
                $cnt = (int)$r['cnt'];
                if (isset($summary[$st])) {
                    $summary[$st] = $cnt;
                    $summary['total'] += $cnt;
                }
            }

            Response::json([
                'data' => $rows,
                'pageInfo' => [
                    'page'            => $page,
                    'perPage'         => $perPage,
                    'total'           => $total,
                    'hasNextPage'     => ($offset + $perPage) < $total,
                    'hasPreviousPage' => $page > 1,
                ],
                'summary' => $summary,
            ]);
        } catch (\PDOException $e) {
            // For dev you can expose $e->getMessage() if needed
            Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/designs/status
     * Update status + log event
     */
    public function updateStatus(): void
    {
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data)) {
            Response::json(['error' => 'Invalid JSON body'], 400);
        }

        $id     = isset($data['id']) ? (int) $data['id'] : 0;
        $status = $data['status'] ?? null;

        $allowedStatuses = ['pending', 'printing', 'completed'];

        if ($id <= 0) {
            Response::json(['error' => 'Missing or invalid id'], 400);
        }

        if (!in_array($status, $allowedStatuses, true)) {
            Response::json(['error' => 'Invalid status value'], 400);
        }

        try {
            $pdo = Connection::get();

            // 1) Fetch previous status to log
            $prevStmt = $pdo->prepare(
                "SELECT status FROM designs WHERE id = :id"
            );
            $prevStmt->execute([':id' => $id]);
            $previousStatus = $prevStmt->fetchColumn();

            if ($previousStatus === false) {
                Response::json(['error' => 'Design not found'], 404);
            }

            // 2) Update status
            $stmt = $pdo->prepare(
                "UPDATE designs
                 SET status = :status,
                     updated_at = NOW()
                 WHERE id = :id"
            );

            $stmt->execute([
                ':status' => $status,
                ':id'     => $id,
            ]);

            if ($stmt->rowCount() === 0 && $previousStatus === $status) {
                // Row exists but status was the same; still consider success
                Response::json([
                    'success' => true,
                    'id'      => $id,
                    'status'  => $status,
                ]);
                return;
            }

            // 3) Log event
            $this->logEvent($id, 'status_change', $previousStatus, $status);

            Response::json([
                'success' => true,
                'id'      => $id,
                'status'  => $status,
            ]);
        } catch (\PDOException $e) {
            Response::json(['error' => 'Failed to update status'], 500);
        }
    }

    /**
     * POST /api/designs/archive
     * Mark a design as archived + log event
     */
    public function archive(): void
    {
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data) || !isset($data['id'])) {
            Response::json(['error' => 'Missing id'], 400);
        }

        $id = (int)$data['id'];

        if ($id <= 0) {
            Response::json(['error' => 'Invalid id'], 400);
        }

        try {
            $pdo = Connection::get();

            // 1) Fetch current archived flag
            $prevStmt = $pdo->prepare(
                "SELECT archived FROM designs WHERE id = :id"
            );
            $prevStmt->execute([':id' => $id]);
            $oldArchived = $prevStmt->fetchColumn();

            if ($oldArchived === false) {
                Response::json(['error' => 'Design not found'], 404);
            }

            // 2) Update archived flag
            $stmt = $pdo->prepare(
                "UPDATE designs
                 SET archived = 1,
                     updated_at = NOW()
                 WHERE id = :id"
            );
            $stmt->execute([':id' => $id]);

            // 3) Log event
            $this->logEvent($id, 'archive', $oldArchived, 1);

            Response::json(['success' => true]);
        } catch (\PDOException $e) {
            Response::json(['error' => 'Failed to archive design'], 500);
        }
    }

    /**
     * POST /api/designs/notes
     * Update notes + log event
     */
    public function updateNotes(): void
    {
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!is_array($data)) {
            Response::json(['error' => 'Invalid JSON body'], 400);
        }

        $id    = isset($data['id']) ? (int) $data['id'] : 0;
        $notes = $data['notes'] ?? '';

        if ($id <= 0) {
            Response::json(['error' => 'Missing or invalid id'], 400);
        }

        try {
            $pdo = Connection::get();

            // 1) Fetch previous notes
            $prevStmt = $pdo->prepare(
                "SELECT notes FROM designs WHERE id = :id"
            );
            $prevStmt->execute([':id' => $id]);
            $oldNotes = $prevStmt->fetchColumn();

            if ($oldNotes === false && $oldNotes !== null) {
                Response::json(['error' => 'Design not found'], 404);
            }

            // 2) Update notes
            $stmt = $pdo->prepare(
                "UPDATE designs
                 SET notes = :notes,
                     updated_at = NOW()
                 WHERE id = :id"
            );

            $stmt->execute([
                ':notes' => $notes,
                ':id'    => $id,
            ]);

            // 3) Log event
            $this->logEvent($id, 'note_update', $oldNotes, $notes);

            Response::json([
                'success' => true,
                'id'      => $id,
                'notes'   => $notes,
            ]);
        } catch (\PDOException $e) {
            Response::json(['error' => 'Failed to update notes'], 500);
        }
    }

    /**
     * GET /api/designs/logs?id=123
     * Return activity history from design_events
     */
    public function logs(): void
    {
        $designId = (int)($_GET['id'] ?? 0);

        if ($designId <= 0) {
            Response::json(['error' => 'Missing id'], 400);
        }

        try {
            $pdo = Connection::get();

            $stmt = $pdo->prepare(
                "SELECT id, action, from_value, to_value, created_at
                 FROM design_events
                 WHERE design_id = :design_id
                 ORDER BY created_at DESC, id DESC"
            );
            $stmt->execute([':design_id' => $designId]);
            $rows = $stmt->fetchAll();

            Response::json(['logs' => $rows]);
        } catch (\PDOException $e) {
            Response::json(['error' => 'Failed to load logs'], 500);
        }
    }
}
