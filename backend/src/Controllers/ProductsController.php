<?php
// src/Controllers/ProductsController.php
namespace App\Controllers;

use App\Core\Response;
use App\Services\ShopifyClient;

class ProductsController
{
    private ShopifyClient $shopify;

    public function __construct()
    {
        $config       = require __DIR__ . '/../Config/config.php';
        $this->shopify = new ShopifyClient($config);
    }

    public function index(): void
    {
        // Allow callers to request additional pages/search results using Shopify's cursor pattern.
        $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
        $limit = max(1, min(50, $limit)); // keep requests lightweight per Shopify guidance
        $cursor = $_GET['cursor'] ?? null;
        $search = $_GET['query'] ?? null;

        $query = <<<'GRAPHQL'
        query GetProducts($first: Int!, $after: String, $query: String) {
          products(first: $first, after: $after, query: $query) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            nodes {
              id
              title
              description
              featuredImage {
                url
                altText
              }
              variants(first: 50) {
                nodes {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  image {
                    url
                    altText
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
        GRAPHQL;

        // Using variables keeps the query reusable and lets Shopify handle pagination via cursors.
        $variables = [
            'first' => $limit,
            'after' => $cursor ?: null,
            'query' => $search ?: null,
        ];

        try {
            // Bubble up raw Shopify errors so the client can provide actionable feedback.
            $data = $this->shopify->query($query, $variables);
        } catch (\Throwable $e) {
            Response::json([
                'error'   => 'shopify_query_failed',
                'message' => 'Unable to load products from Shopify.',
                'details' => $e->getMessage(),
            ], 502);
        }

        $products = $data['products']['nodes'] ?? [];
        $pageInfo = $data['products']['pageInfo'] ?? null;

        $result = array_map(function ($p) {
            return [
                'id'          => $p['id'],
                'title'       => $p['title'],
                'description' => $p['description'],
                'image'       => $p['featuredImage']['url'] ?? null,
                'variants'    => array_map(function ($v) {
                    $color = null;
                    $size  = null;

                    foreach ($v['selectedOptions'] as $opt) {
                        $name = strtolower($opt['name']);
                        if ($name === 'color') {
                            $color = $opt['value'];
                        } elseif ($name === 'size') {
                            $size = $opt['value'];
                        }
                    }

                    return [
                        'id'       => $v['id'],
                        'title'    => $v['title'],
                        'color'    => $color,
                        'size'     => $size,
                        'price'    => $v['price']['amount'],
                        'currency' => $v['price']['currencyCode'],
                        // optional variant-level image so the UI can swap based on color/size selection
                        'image'    => $v['image']['url'] ?? null,
                    ];
                }, $p['variants']['nodes'] ?? []),
            ];
        }, $products);

        // Frontend consumes normalized products plus pageInfo to know when to fetch more.
        Response::json([
            'products' => $result,
            'pageInfo' => $pageInfo,
            'limit'    => $limit,
        ]);
    }
}
