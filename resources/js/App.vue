<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<script>
export default {
    name: 'App',
    mounted() {
        console.log('App.vue mounted successfully');
        
        // Try to initialize Optix if available
        if (this.$optix) {
            try {
                // Load environment vars
                if (typeof this.$optix.env.readUrl === 'function') {
                    this.$optix.env.readUrl();
                }

                // Handle special environment configs
                if (window.optix_env) {
                    if (typeof this.$optix.env.setConf === 'function') {
                        this.$optix.env.environment = window.optix_env.env;
                        this.$optix.env.setConf(
                            window.optix_env.conf,
                            window.optix_env.env
                        );
                    }
                }

                // Set default Optix Theme (fonts, colors, etc...)
                if (typeof this.$optix.page.refreshStylesheet === 'function') {
                    this.$optix.page.refreshStylesheet();
                }
                console.log('Optix initialized successfully');
            } catch (error) {
                console.error('Error initializing Optix:', error);
            }
        } else {
            console.log('Optix not available, running in basic mode');
        }
    },
    data: () => ({}),
};
</script>

<style>
#app {
    font-family: Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    margin: 0;
    padding: 20px;
}
</style>
