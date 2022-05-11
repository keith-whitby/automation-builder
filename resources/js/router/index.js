import routes from "./routes";
import Router from "vue-router";
import Vue from "vue";

Vue.use(Router);

const router = new Router({
    mode: "history",
    base: process.env.BASE_URL,
    routes,
});
export default router;
