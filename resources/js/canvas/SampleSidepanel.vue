<template>
    <o-admin-container :loading="isLoading" :breadcrumb="breadcrumb">
        <template v-slot:primary-actions>
            <o-btn @click="doSomething">
                Done
            </o-btn>
        </template>

        <div>
            <p>Parameters received by this canvas</p>
            <div class="mb-8">
                <pre>{{ parameters }}</pre>
            </div>
            Check <code>o-admin-container</code> for more details
        </div>
    </o-admin-container>
</template>
<script>
export default {
    data() {
        return {
            parameters: null,
            isLoading: false // You can use a loading state
        };
    },
    async mounted() {
        await this.$optix.init();
        this.parameters = JSON.stringify(this.$optix.env.get, null, 2);
    },
    methods: {
        doSomething() {
            this.$optix.canvas.pushSnackbar({
                message: "Nice!",
                type: "success" // error
            });
            this.$optix.canvas.popAdminSidePanel();
        }
    },
    computed: {
        breadcrumb() {
            return ["Sample panel"];
        }
    }
};
</script>
