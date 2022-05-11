<template>
    <o-admin-container
        :breadcrumb="['Sample panel 2']"
        :icon-padded="false"
        :header-style="{ 'padding-bottom': '8px' }"
    >
        <template v-slot:primary-actions>
            <o-btn @click="doSomething"> Done </o-btn>
        </template>

        <div>
            <p>Description here</p>
            <o-btn @click="sendMessage">Increment one to parent text field</o-btn>
        </div>
    </o-admin-container>
</template>
<script>
import { messageCanvas } from "@/helpers/canvas.js";
export default {
    data() {
        return {};
    },
    async mounted() {
        await this.$optix.init();
    },
    methods: {
        doSomething() {
            this.$optix.canvas.popAdminSidePanel();
        },
        sendMessage() {
            messageCanvas(this.$optix.canvas, "sample-app", "addline");
        },
    },
    computed: {},
};
</script>
