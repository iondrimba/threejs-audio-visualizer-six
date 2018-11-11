import App from './scripts/index';

const app = new App();

window.addEventListener('resize', app.onResize.bind(app));
