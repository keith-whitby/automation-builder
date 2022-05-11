<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>{{ config('app.name') }}</title>
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css" rel="stylesheet">

    @if ( config('app.env') !== 'production' )
    <script>
        window.optix_env = {
            env: "{{ config('app.env') }}",
            conf: {
                optix_v2_url: "{{ str_replace('/graphql', '', config('optix.api_url')) }}"
            }
        };
    </script>
    @endif
</head>
<body >
    <div id="app"></div>
</body>
<script src="{{ mix('js/manifest.js') }}"></script>
<script src="{{ mix('js/vendor.js') }}"></script>
<script src="{{ mix('js/app.js') }}"></script>
</html>
