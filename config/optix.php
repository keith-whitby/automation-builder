<?php

return [
    /*
     * Optix GraphQL endpoint
     */
    'api_url' => env('OPTIX_API_URL', 'https://api.optixapp.com/graphql'),

    /*
     * Optix Webhook secret
     */
    'webhook-secret' => env('OPTIX_SECRET', null),

    /*
     * Audit mode
     * Track all requests made to Optix API
     */
    'audit' => env('OPTIX_AUDIT', false),

    /*
     * Middleware configuration
     */
    'middleware' => [
        // For how long the token authentication should be cached (seconds)
        // You might want to disable (0) or tune the option based on how important is to fetch
        // updated properties merged to $request by EnsureOptixToken middleware
        'token-cache-ttl' => env('OPTIX_MIDDLEWARE_TOKEN_CACHE_TTL', 300),

        // Uses a custom query instead of EnsureOptixToken from the library
        'custom-query-path' => null,
    ],

    /*
     * Cache file queries during same session (same job execution or same request)
     * You might disable this when your long live scripts should reload queries from the disk
     * every time
     */
    'query-file-cache' => env('OPTIX_QUERY_FILE_CACHE', true)
];
