import routes from "./routes";
import Router from "vue-router";
import Vue from "vue";

Vue.use(Router);

const router = new Router({
    mode: "history",
    base: process.env.BASE_URL,
    routes,
});

// Add router debugging
router.beforeEach((to, from, next) => {
    console.log('Router navigation:', { from: from.path, to: to.path });
    next();
});

router.afterEach((to, from) => {
    console.log('Router navigation completed:', { from: from.path, to: to.path });
});

export default router;
