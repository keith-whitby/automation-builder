# Optix Boilerplate

This boilerplate is a Laravel 9 project, that includes:

-   [Laravel Sail](https://laravel.com/docs/9.x/sail): So you only need docker in your dev device;
-   [Laravel Horizon](https://laravel.com/docs/9.x/horizon): Easy background worker coordination;
-   [Optix PHP Client 2](https://gitlab.com/optix-app/php-client): Helps dealing with GraphQL queries, basic webhooks and user validation;
-   Optix UI Kit 2: Helps the creation of canvases, basic examples and most used UI components;
-   [Vuetify 2.6](https://vuetifyjs.com/en/): A complete Material UI library;
-   [Material design icons](https://materialdesignicons.com/): All material icons;
-   Optix icons: More icons;
-   Other fonts and theme presets for Admin canvases: Use the same fonts used at the Web Dashboard;
-   [Laravel IDE Helper](https://github.com/barryvdh/laravel-ide-helper): To facilitate the static analysis;

## How to start dev environment and run this sample project

What you will need:

-   [Docker](https://docs.docker.com/engine/install/)
-   [Docker compose](https://docs.docker.com/compose/install/)
-   [Ngrok](https://ngrok.com/) or [Expose](https://expose.dev/) to work with webhooks and test mobile canvases
-   [Composer](https://getcomposer.org/)
-   [PHP 8.x](https://www.php.net/downloads.php)
-   [VSCode](https://code.visualstudio.com/), [PHP Storm](https://www.jetbrains.com/phpstorm) or any other IDE.

Starting the environment for the first time:

```bash
# Install PHP dependencies
composer install

# Create .env file
cp .env.example .env

# Start the environment
./vendor/bin/sail up -d

# Make sure you have the proper dependencies
./vendor/bin/sail composer install

# Generate a new .env key
./vendor/bin/sail artisan key:generate

# Run database migrations
./vendor/bin/sail artisan migrate

# Install JS dependencies
./vendor/bin/sail npm i

# Build/compile frontend
./vendor/bin/sail npm run prod
```

Now that your environment is running you should be able to access `http://localhost` in your browser.

Some useful commands during development:

```bash
# Build frontend every file change
./vendor/bin/sail npm run watch

# Regenerate IDE helpers
./vendor/bin/sail php artisan ide-helper:generate

# Regenerate model IDE helpers
./vendor/bin/sail php artisan ide-helper:models

# Bring down the containers
./vendor/bin/sail down
```

> If you are tired of typing `./vendor/bin/sail` add to your `.bashrc`:
> `alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'`

This boilerplate include a sample settings page and one mobile app canvases, you should follow these steps to make them available at your admin:

1. Create a new app at Apps > Develop;
2. Copy the Optix Secret key to `.env` `OPTIX_SECRET`;
3. Start the `ngrok` or `expose` and take note of the public https URL provided
    1. `expose share http://localhost`
    2. Try to access the URL provided by the service to make sure your environment is working properly. Keep the `sail up` running in the background.
4. Replace the URL host at the settings file below and copy the contents to the proper field at the app page.
    1. Make sure to only replace the host, the path was carefully set to reach the samples of this boilerplate.

```json
{
    "canvases": [
        {
            "type": "MOBILE_HOME_PRIMARY",
            "url": "https://your.host.here.com/ui-kit/primary-button-canvas",
            "title": "Primary button test canvas",
            "icon": "star"
        },
        {
            "type": "ADMIN_APP_SETTINGS",
            "url": "http://your.host.here.com/ui-kit/sample-settings"
        }
    ],
    "webhooks": [
        {
            "event": "app_install",
            "url": "https://your.host.here.com/optix-webhook/app_install"
        },
        {
            "event": "app_uninstall",
            "url": "https://your.host.here.com/optix-webhook/app_uninstall"
        },
        {
            "event": "organization_token_updated",
            "url": "https://your.host.here.com/optix-webhook/organization_token_updated"
        }
    ]
}
```

> Some Optix plans offer a Sandbox Organization, reach our support team via the web dashboard for more information. This is especially useful while implementing a new app for a running organization.

Immediately after saving the settings file, your application will receive a webhook regarding the auto installation of the app in your organization. Use any MySQL client to check the new Organization GraphQL API Token provided via webhook at the `optix_organizations` table. This token will be exactly the same as viewed at the Web Dashboard > App > Develop > App detail page.

> You can check the `storage/*.log` files to troubleshoot any unexpected error.

### PHP Client

Make sure to read more about the [Optix PHP Client 2](https://gitlab.com/optix-app/php-client) README, there is a good overview of how the app handle webhooks and the usage of GraphQL query helpers.

### UI Kit

The UI Kit is based on [Vuetify 2.6](https://vuetifyjs.com/en/), and should be fairly simple to understand the Vue setup in this project. Feel free to explore `router.js` and the Single File Components. We already set up a `ui-kit` route to facilitate the implementation of new canvases.

Usually canvases are very small applications that provide only one view/functionality, but you can use VueRouter to navigate across multiple interfaces.

> You are not required to use the UI Kit, you can implement your views using the traditional Blade HTML templates or even include your own UI Kit or CSS libraries. We suggest the use of UI Kit in order your application look part of Optix Web Dashboard.
> Feel free to explore the source code of the UI Kit to learn more about the components provided.

## OK, now what should I do?

You can read more about the [Optix platform](https://developer.optixapp.com/) to understand what you can do. Here is a brief explanation, with examples:

-   You can [register webhooks](https://developer.optixapp.com/using-webhooks/): so any event on Optix platform will reach your URL.
    -   "Every booking should trigger a REST API call"
    -   "Every time a plan end an email should be triggered to the manager"
    -   "Every time an invoice is raised or modified it should be synced to my ERP"
-   You can add web interfaces into [Optix Web Dashboard](https://developer.optixapp.com/using-canvases/optix-venue-manager-canvases/) or [Mobile app](https://developer.optixapp.com/using-canvases/optix-mobile-app-canvases/).
    -   "Members should have access to a list of their latest members at the home screen"
    -   "Admins should be able to register and track
    -   "Members should have access to a guide of our facility"
    -   "Members should be able to open the doors via mobile app"
-   You can [fetch or mutate data via GraphQL](https://developer.optixapp.com/using-the-api/)
    -   "New members on my ERP should be automatically added to Optix system"
    -   "ERP should import custom properties added by the members at the mobile app signup"
    -   "Read invoicing data for consolidation"
    -   "My external booking application should be aware of the resource availability"

Its very likely you will integrate multiple features in order to achieve a the implementation of a feature.

> You can build a car parking management system that allows members to register their car plate via the app (using a canvas or custom property), then your lot monitoring team provide you a list of cards parked at your lot. The app is able to read via GraphQL who owns the vehicle and add a charge to their invoice via GraphQL, or even avoid the charge in case the member has a plan.
> The app could also alert your admins with a notification in case a unknown vehicle shows up.

## Deploying to production

There are multiple environment setups for Laravel application, check [Laravel Deployment](https://laravel.com/docs/9.x/deployment) for more details.

## Going further

By default, apps are private (Available only to your organization).

This boilerplate is set up in a way that multiple tenants can make use of the same app (`optix_organizations` table register what organizations in Optix use the app). Let us know if you want to make it available to other organizations of your network.
