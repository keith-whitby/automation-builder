<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Optix Automation Builder</title>

        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">

        <!-- Styles -->
        <style>
            /*! normalize.css v8.0.1 | MIT License | github.com/necolas/normalize.css */html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}a{background-color:transparent}[hidden]{display:none}html{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;line-height:1.5}*,:after,:before{box-sizing:border-box;border:0 solid #e2e8f0}a{color:inherit;text-decoration:inherit}svg,video{display:block;vertical-align:middle}video{max-width:100%;height:auto}.bg-white{--bg-opacity:1;background-color:#fff;background-color:rgba(255,255,255,var(--bg-opacity))}.bg-gray-100{--bg-opacity:1;background-color:#f7fafc;background-color:rgba(247,250,252,var(--bg-opacity))}.border-gray-200{--border-opacity:1;border-color:#edf2f7;border-color:rgba(237,242,247,var(--border-opacity))}.border-t{border-top-width:1px}.flex{display:flex}.grid{display:grid}.hidden{display:none}.items-center{align-items:center}.justify-center{justify-content:center}.font-semibold{font-weight:600}.h-5{height:1.25rem}.h-8{height:2rem}.h-16{height:4rem}.text-sm{font-size:.875rem}.text-lg{font-size:1.125rem}.leading-7{line-height:1.75rem}.mx-auto{margin-left:auto;margin-right:auto}.ml-1{margin-left:.25rem}.mt-2{margin-top:.5rem}.mr-2{margin-right:.5rem}.ml-2{margin-left:.5rem}.mt-4{margin-top:1rem}.ml-4{margin-left:1rem}.mt-8{margin-top:2rem}.ml-12{margin-left:3rem}.-mt-px{margin-top:-1px}.max-w-6xl{max-width:72rem}.min-h-screen{min-height:100vh}.overflow-hidden{overflow:hidden}.p-6{padding:1.5rem}.py-4{padding-top:1rem;padding-bottom:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.pt-8{padding-top:2rem}.fixed{position:fixed}.relative{position:relative}.top-0{top:0}.right-0{right:0}.shadow{box-shadow:0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px 0 rgba(0,0,0,.06)}.text-center{text-align:center}.text-gray-200{--text-opacity:1;color:#edf2f7;color:rgba(237,242,247,var(--text-opacity))}.text-gray-300{--text-opacity:1;color:#e2e8f0;color:rgba(226,232,240,var(--text-opacity))}.text-gray-400{--text-opacity:1;color:#cbd5e0;color:rgba(203,213,224,var(--text-opacity))}.text-gray-500{--text-opacity:1;color:#a0aec0;color:rgba(160,174,192,var(--text-opacity))}.text-gray-600{--text-opacity:1;color:#718096;color:rgba(113,128,150,var(--text-opacity))}.text-gray-700{--text-opacity:1;color:#4a5568;color:rgba(74,85,104,var(--text-opacity))}.text-gray-900{--text-opacity:1;color:#1a202c;color:rgba(26,32,44,var(--text-opacity))}.underline{text-decoration:underline}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.w-5{width:1.25rem}.w-8{width:2rem}.w-auto{width:auto}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}@media (min-width:640px){.sm\:rounded-lg{border-radius:.5rem}.sm\:block{display:block}.sm\:items-center{align-items:center}.sm\:justify-start{justify-content:flex-start}.sm\:justify-between{justify-content:space-between}.sm\:h-20{height:5rem}.sm\:ml-0{margin-left:0}.sm\:px-6{padding-left:1.5rem;padding-right:1.5rem}.sm\:pt-0{padding-top:0}.sm\:text-left{text-align:left}.sm\:text-right{text-align:right}}@media (min-width:768px){.md\:border-t-0{border-top-width:0}.md\:border-l{border-left-width:1px}.md\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (min-width:1024px){.lg\:px-8{padding-left:2rem;padding-right:2rem}}@media (prefers-color-scheme:dark){.dark\:bg-gray-800{--bg-opacity:1;background-color:#2d3748;background-color:rgba(45,55,72,var(--bg-opacity))}.dark\:bg-gray-900{--bg-opacity:1;background-color:#1a202c;background-color:rgba(26,32,44,var(--bg-opacity))}.dark\:border-gray-700{--border-opacity:1;border-color:#4a5568;border-color:rgba(74,85,104,var(--border-opacity))}.dark\:text-white{--text-opacity:1;color:#fff;color:rgba(255,255,255,var(--text-opacity))}.dark\:text-gray-400{--text-opacity:1;color:#cbd5e0;color:rgba(203,213,224,var(--text-opacity))}.dark\:text-gray-500{--tw-text-opacity:1;color:#6b7280;color:rgba(107,114,128,var(--tw-text-opacity))}}
        </style>

        <style>
            body {
                font-family: 'Nunito', sans-serif;
                margin: 0;
                padding: 0;
                height: 100vh;
                overflow: hidden;
            }

            /* Test Panel Styles */
            .test-panel-toggle {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }

            .test-panel-toggle:hover {
                background: #2563eb;
                transform: scale(1.1);
            }

            .test-panel {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 999;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                padding: 20px;
                max-width: 400px;
                max-height: 80vh;
                overflow-y: auto;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                border: 1px solid #e5e7eb;
            }

            .test-panel.open {
                transform: translateX(0);
            }

            .test-panel h3 {
                margin: 0 0 16px 0;
                color: #374151;
                font-size: 18px;
                font-weight: 600;
            }

            .test-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .test-button {
                display: inline-flex;
                align-items: center;
                padding: 8px 12px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                color: #374151;
                text-decoration: none;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;
            }

            .test-button:hover {
                background: #e5e7eb;
                border-color: #9ca3af;
            }

            .test-button.small {
                font-size: 11px;
                padding: 6px 10px;
            }

            /* Main App Container */
            #app {
                height: 100vh;
                width: 100vw;
            }


        </style>
    </head>
    <body class="antialiased">
        <!-- Test Panel Toggle Button -->
        <button class="test-panel-toggle" onclick="toggleTestPanel()" title="Toggle Test Panel">
            🧪
        </button>

        <!-- Test Panel -->
        <div class="test-panel" id="testPanel">
            <h3>🧪 Test Pages</h3>
            <div class="test-buttons">
                <a href="/auth-test.html" class="test-button" onclick="navigateWithToken('/auth-test.html')">
                    🔐 Auth Token Extraction
                </a>
                <a href="/test-direct-api.html" class="test-button" onclick="navigateWithToken('/test-direct-api.html')">
                    🚀 Direct API Test
                </a>
                <a href="/test-auth-service.html" class="test-button" onclick="navigateWithToken('/test-auth-service.html')">
                    🔐 AuthService Test
                </a>
                <a href="/test-optix-api-service.html" class="test-button" onclick="navigateWithToken('/test-optix-api-service.html')">
                    🌐 OptixApiService Test
                </a>
                <a href="/test-error-handling.html" class="test-button" onclick="navigateWithToken('/test-error-handling.html')">
                    🚨 Error Handling Test
                </a>
                <a href="/ui-kit/simple-test" class="test-button">
                    ⚡ Simple Canvas Test
                </a>
                <a href="/ui-kit/auth-test" class="test-button">
                    🧪 Auth Canvas Test
                </a>
                <a href="/ui-kit/optix-api-test" class="test-button">
                    🌐 API Canvas Test
                </a>
            </div>
        </div>

        <!-- Main App Container -->
        <div id="app"></div>

        <!-- Scripts -->
        <script src="{{ mix('js/app.js') }}"></script>
        <script>
            function toggleTestPanel() {
                const panel = document.getElementById('testPanel');
                panel.classList.toggle('open');
            }

            function navigateWithToken(path) {
                // Get token from current URL
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                const organizationId = urlParams.get('organization_id');
                
                // Build new URL with token
                let newUrl = path;
                const params = new URLSearchParams();
                
                if (token) {
                    params.append('token', token);
                }
                if (organizationId) {
                    params.append('organization_id', organizationId);
                }
                
                if (params.toString()) {
                    newUrl += '?' + params.toString();
                }
                
                // Navigate to the new URL
                window.location.href = newUrl;
            }

            // Close test panel when clicking outside
            document.addEventListener('click', function(event) {
                const panel = document.getElementById('testPanel');
                const toggle = document.querySelector('.test-panel-toggle');
                
                if (!panel.contains(event.target) && !toggle.contains(event.target)) {
                    panel.classList.remove('open');
                }
            });

            // Initialize the app when the page loads
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Main page loaded');
                
                // Check if we have a token in the URL
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                
                if (token) {
                    console.log('Token found in URL, initializing AutomationBuilder');
                    // The Vue app will handle the rest
                } else {
                    console.log('No token found in URL');
                }
            });
        </script>
    </body>
</html>
