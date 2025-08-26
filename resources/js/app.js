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

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

import router from "./router";
import App from "./App.vue";
import Vue from "vue";


Vue.config.productionTip = false;

import OptixUIPlugin from "optixapp-ui-kit/src/vue-plugin";
import "optixapp-ui-kit/src/vue-base.css";
import "optixapp-ui-kit/src/icons";
import Vuetify from "vuetify/lib";

// All vue components from "components" folder
import "./components/index";

Vue.use(OptixUIPlugin, {
    themed: true, // Create stylesheets and support theming functions
});

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
} catch (error) {
    console.error('Error mounting Vue app:', error);
}

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
} catch (error) {
    console.error('Error mounting Vue app:', error);
}
