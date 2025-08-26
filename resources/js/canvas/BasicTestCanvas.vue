<template>
    <div>
        <h1>Basic Test Canvas</h1>
        <p>If you can see this, Vue is working!</p>
        <p>Current URL: {{ currentUrl }}</p>
        <button @click="testClick">Test Click</button>
        <div v-if="clicked">
            <p>Button was clicked at: {{ clickTime }}</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BasicTestCanvas',
    data() {
        return {
            currentUrl: window.location.href,
            clicked: false,
            clickTime: null
        };
    },
    mounted() {
        console.log('BasicTestCanvas mounted successfully');
        console.log('Current URL:', this.currentUrl);
    },
    methods: {
        testClick() {
            this.clicked = true;
            this.clickTime = new Date().toISOString();
            console.log('Button clicked at:', this.clickTime);
            alert('Button clicked! Vue is working!');
        }
    }
};
</script>

<style scoped>
div {
    padding: 20px;
    font-family: Arial, sans-serif;
}

h1 {
    color: #333;
}

button {
    background-color: #007cba;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin: 10px 0;
}

button:hover {
    background-color: #005a87;
}
</style>
