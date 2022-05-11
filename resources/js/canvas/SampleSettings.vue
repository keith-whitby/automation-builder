<template>
    <div class="settings-wrapper">
        <v-layout justify-center class="mt-16">
            <o-sheet class="description-panel">
                <div class="d-flex py-6 mx-6">
                    <div class="d-flex-column justify-center">
                        <img style="max-width: 64px" :src="appLogo" />
                    </div>
                    <div class="d-flex-column ml-4">
                        <h3>ACCESS CONTROL</h3>
                        <h1>App name</h1>
                        <h2>
                            <a href="https://www.example.com" target="_blank"
                                >www.example.com</a
                            >
                        </h2>
                    </div>
                </div>
                <div class="mx-6">
                    <h4>Account connected</h4>
                    <div class="d-flex justify-space-between">
                        <div class="mt-1 d-flex align-center">
                            <b class="mt-1">Account ABC</b>
                            <v-icon color="teal lighten-2" class="ml-2"
                                >mdi-check-circle</v-icon
                            >
                        </div>
                        <div class="d-flex">
                            <v-btn color="primary" outlined> Disconnect </v-btn>
                        </div>
                    </div>
                </div>

                <div class="mx-6 mt-6 pb-4">
                    <h4>App description</h4>
                    <p class="mt-2">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                    </p>
                </div>
            </o-sheet>
        </v-layout>

        <v-layout justify-center>
            <div>
                <h5>Notification messages</h5>
                <o-sheet>
                    <div class="px-6 py-6">
                        <p>This canvas can trigger native messages.</p>
                        <o-btn
                            depressed
                            color="primary"
                            @click="triggerSuccess"
                        >
                            Trigger success message
                        </o-btn>
                        <o-btn depressed color="error" @click="triggerError">
                            Trigger error message
                        </o-btn>
                    </div>
                </o-sheet>
            </div>
        </v-layout>

        <v-layout justify-center>
            <div>
                <h5>Plans</h5>
                <o-sheet>
                    <div class="px-6 py-6">
                        <p>
                            Instruction box.
                            <a target="_blank" href="https://www.example.com"
                                >Learn More</a
                            >
                        </p>
                        <o-btn depressed color="primary" @click="openSidePanel">
                            Open Admin Side Panel
                        </o-btn>
                    </div>
                </o-sheet>
            </div>
        </v-layout>

        <v-layout justify-center>
            <div>
                <h5>Form fields</h5>
                <o-sheet>
                    <div class="px-6 py-6">
                        <p>
                            You can use all Vuetify components, but UI-Kit
                            provides a few customized elements by the prefix
                            <code>&lt;o-</code>.
                        </p>
                        <o-text-field
                            label="Type a number"
                            v-model="numberOfLines"
                        />

                        <v-divider></v-divider>
                        <div
                            class="d-flex justify-space-between align-center pt-6"
                        >
                            <v-btn
                                plain
                                class="px-0"
                                small
                                @click="openSidePanel()"
                            >
                                Learn More
                            </v-btn>
                            <o-btn color="primary" @click="openSidePanel2()">
                                Configure
                            </o-btn>
                        </div>
                    </div>
                </o-sheet>
            </div>
        </v-layout>

        <!-- Dynamic content -->
        <v-layout justify-center v-if="numberOfLines >= 1">
            <div>
                <h5>Dynamic content</h5>
                <o-sheet>
                    <div class="px-6 py-6">
                        <p v-for="i in parseInt(numberOfLines)" :key="i">
                            Line number is {{ i }}
                        </p>
                    </div>
                </o-sheet>
            </div>
        </v-layout>
    </div>
</template>

<script>
import { uiKitUrl } from "@/helpers/url.js";
import meQuery from "@/graphql-queries/me.graphql";
import appLogo from "@/assets/images/asset-integration-default.png";
import { listenCanvasMessage } from "@/helpers/canvas.js";

export default {
    data: () => ({
        appLogo,
        queryResult: null,
        success: {
            message: "Test Message",
            timeout: 4000,
            show: false,
        },
        error: {
            message: "Test Message",
            timeout: 15000,
            show: false,
        },
        numberOfLines: 3,
    }),
    async created() {
        // Removes canvas top shadow, remove it when not using tabs
        // this.$optix.canvas.canvasShadow(false);
        listenCanvasMessage("sample-app", "addline", this.addLine);
    },
    async mounted() {
        // Simple call to Optix GraphQL
        this.$optix.ws.graphQL(meQuery).then((result) => {
            this.queryResult = result.data;
        });
    },
    methods: {
        addLine() {
            this.numberOfLines++;
        },
        // Trigger an error message
        triggerError() {
            this.$optix.canvas.pushSnackbar({
                type: "error",
                message: "Negative message",
            });
        },
        // Trigger a success message
        triggerSuccess() {
            this.$optix.canvas.pushSnackbar({
                type: "success",
                message: "Positive message",
            });
        },
        // Opening sidepanels
        openSidePanel() {
            // Always provide the full url, including all necessary parameters
            // Sidepanels do not accept relative paths, you can use uiKitUrl helper to build the URL
            let url = uiKitUrl("sample-sidepanel", {
                variable1: "123",
                variable2: "456",
                variable3: 789,
            });
            // You can set the width of the panel
            let options = {
                "max-width": "800px", // Defaults to 600px
            };
            this.$optix.canvas.pushAdminSidePanel(url, options);
        },
        openSidePanel2() {
            this.$optix.canvas.pushAdminSidePanel(
                uiKitUrl("sample-sidepanel2")
            );
        },
    },
};
</script>
<style scoped>
h1 {
    color: rgba(0, 0, 0, 0.87);
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.76px;
    line-height: 24px;
}
h2 {
    font-size: 14px;
    font-weight: 400;
}
h2 a {
    text-decoration: none;
}
h3 {
    color: rgba(0, 0, 0, 0.54);
    font-size: 13px;
    font-weight: 500;
}
h4 {
    line-height: 24px;
    font-size: 14px;
    font-weight: 500;
}
h5 {
    line-height: 32px;
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 0.25px;
}
p {
    line-height: 24px;
    font-size: 14px;
}
</style>
