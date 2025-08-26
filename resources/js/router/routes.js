export default [
    {
        path: "/ui-kit/sample-sidepanel",
        component: () => import("@/canvas/SampleSidepanel.vue"),
    },
    {
        path: "/ui-kit/sample-sidepanel2",
        component: () => import("@/canvas/SampleSidepanel2.vue"),
    },
    {
        path: "/ui-kit/sample-settings",
        component: () => import("@/canvas/SampleSettings.vue"),
    },
    {
        path: "/ui-kit/primary-button-canvas",
        component: () => import("@/canvas/PrimaryButtonCanvas.vue"),
    },
    {
        path: "/ui-kit/auth-test",
        component: () => import("@/canvas/AuthTestCanvas.vue"),
    },
    {
        path: "/ui-kit/vuex-auth-test",
        component: () => import("@/canvas/VuexAuthTestCanvas.vue"),
    },
    {
        path: "/ui-kit/simple-test",
        component: () => import("@/canvas/SimpleTestCanvas.vue"),
    },
    {
        path: "/ui-kit/basic-test",
        component: () => import("@/canvas/BasicTestCanvas.vue"),
    },
    {
        path: "/ui-kit/optix-api-test",
        component: () => import("@/canvas/OptixApiTestCanvas.vue"),
    },
    {
        path: "*",
        component: () => import("@/canvas/NotFound.vue"),
    },
];
