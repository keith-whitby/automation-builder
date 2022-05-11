<template>
    <o-app>
        <router-view></router-view>
    </o-app>
</template>

<script>
export default {
    created() {
        // Load environment vars
        this.$optix.env.readUrl();

        // Handle special environment configs
        if (window.optix_env) {
            this.$optix.env.environment = window.optix_env.env;
            this.$optix.env.setConf(
                window.optix_env.conf,
                window.optix_env.env
            );
        }

        // Set default Optix Theme (fonts, colors, etc...)
        this.$optix.page.refreshStylesheet();
    },
    data: () => ({}),
};
</script>
<style scoped>
.main-wrapper {
}
</style>
