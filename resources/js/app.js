require("./bootstrap");

import router from "./router";
import App from "./App";
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

let vue = new Vue({
    vuetify: new Vuetify(),
    router,
    render: (h) => h(App),
});

vue.$mount("#app");
