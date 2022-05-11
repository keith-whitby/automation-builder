<template>
    <div class="px-4 py-4">
        <p>Parameters received by this canvas</p>
        <div class="mb-8">
            <pre>{{ parameters }}</pre>
        </div>
        <SampleComponent />
    </div>
</template>
<script>
export default {
    data() {
        return {
            parameters: null,
        };
    },
    async mounted() {
        // Always call .init()
        // Specially if using native loading
        await this.$optix.init();
        this.parameters = JSON.stringify(this.$optix.env.get, null, 2);
    },
    methods: {},
    computed: {},
};
</script>
