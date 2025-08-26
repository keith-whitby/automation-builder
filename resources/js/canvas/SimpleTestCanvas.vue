<template>
    <o-admin-container :loading="isLoading" :breadcrumb="breadcrumb">
        <template v-slot:primary-actions>
            <o-btn @click="testSimple">
                Test Simple
            </o-btn>
        </template>

        <div>
            <h2>Simple Test Canvas</h2>
            <p>If you can see this, Vue is working!</p>
            
            <div class="mb-4">
                <h3>Current URL:</h3>
                <pre>{{ currentUrl }}</pre>
            </div>

            <div class="mb-4">
                <h3>URL Parameters:</h3>
                <pre>{{ urlParams }}</pre>
            </div>

            <div class="mb-4" v-if="testResult">
                <h3>Test Result:</h3>
                <pre>{{ testResult }}</pre>
            </div>
        </div>
    </o-admin-container>
</template>

<script>
export default {
    data() {
        return {
            isLoading: false,
            currentUrl: window.location.href,
            urlParams: {},
            testResult: null
        };
    },
    async mounted() {
        console.log('SimpleTestCanvas mounted');
        await this.$optix.init();
        this.extractUrlParams();
    },
    methods: {
        extractUrlParams() {
            const urlParams = new URLSearchParams(window.location.search);
            const params = {};
            for (let [key, value] of urlParams) {
                params[key] = value;
            }
            this.urlParams = params;
        },

        testSimple() {
            this.testResult = {
                message: 'Simple test successful!',
                timestamp: new Date().toISOString(),
                url: window.location.href,
                params: this.urlParams
            };
            
            this.$optix.canvas.pushSnackbar({
                message: "Simple test completed!",
                type: "success"
            });
        }
    },
    computed: {
        breadcrumb() {
            return ["Simple Test"];
        }
    }
};
</script>

<style scoped>
pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
}
</style>
