require("./bootstrap");

// Add global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Add iframe-specific debugging
console.log('App starting in iframe context');
console.log('Window location:', window.location.href);
console.log('Optix environment:', window.optix_env);

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

import router from "./router";
import App from "./App.vue";
import Vue from "vue";

Vue.config.productionTip = false;

// Removed optixapp-ui-kit dependency for Vercel deployment
import Vuetify from "vuetify/lib";

// All vue components from "components" folder
import "./components/index";

// Optix UI Plugin removed for Vercel deployment

Vue.use(Vuetify);

console.log('Creating Vue app...');
console.log('App component:', App);
console.log('Router:', router);

let vue = new Vue({
    vuetify: new Vuetify(),
    router,
    render: (h) => h(App),
});

console.log('Vue instance created:', vue);
console.log('Mounting to #app...');

try {
    vue.$mount("#app");
    console.log('Vue app mounted successfully!');
    
    // Add a timeout to check if the app is working
    setTimeout(() => {
        console.log('Vue app state after 2 seconds:');
        console.log('- Vue instance:', vue);
        console.log('- Current route:', vue.$route);
        console.log('- App component mounted:', vue.$children.length > 0);
        if (vue.$children.length > 0) {
            console.log('- First child component:', vue.$children[0].$options.name);
        }
    }, 2000);
} catch (error) {
    console.error('Error mounting Vue app:', error);
}
