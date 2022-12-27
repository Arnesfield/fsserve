import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import './assets/main.scss';
import router from './router';
import App from './App.vue';

const vuetify = createVuetify({ components, directives });

const app = createApp(App);
app.use(router);
app.use(vuetify);
app.mount('#app');
