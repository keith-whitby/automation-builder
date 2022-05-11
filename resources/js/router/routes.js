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
        path: "*",
        component: () => import("@/canvas/NotFound.vue"),
    },
];
