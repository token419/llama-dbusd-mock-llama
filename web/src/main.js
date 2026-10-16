import { mount } from 'svelte';
import App from './App.svelte';

function start() {
  const target = document.getElementById('app');
  if (target) {
    mount(App, { target });
  } else {
    console.error("Could not find #app element in DOM");
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
