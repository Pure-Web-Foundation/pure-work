const esbuild = require("esbuild");
const envPlugin = require('./lib/esbuild-plugin-env');
const copyPlugin = require('./lib/esbuild-plugin-copy');
const {sassPlugin} = require('esbuild-sass-plugin');
const fs = require("node:fs");
const argv = require('minimist')(process.argv.slice(2));

const externalResolverPlugin = {
  name: 'custom-resolver',
  setup(build) {
    build.onResolve({ filter: /^\/assets\// }, args => {
      return { external: true };
    });
  },
};

const config = {
  entryPoints: [
    'src/js/index.js'
  ],
  outdir: 'public/assets/js/',
  bundle: true,
  minify: true,
  metafile: true,
  sourcemap: ! argv.hasOwnProperty('no-sourcemaps'),
  external: ['*.woff', '*.eot', '*.ttf', '*.svg'],
  plugins: [
    envPlugin({
      API_ROOT: (process.env.hasOwnProperty('API_ROOT') ? process.env.API_ROOT : 'http://localhost:8181/api'),
      ONESIGNAL_APP_ID: (process.env.hasOwnProperty('ONESIGNAL_APP_ID') ? process.env.ONESIGNAL_APP_ID : '13d6dba6-7541-4ad9-b34d-213f725c9ee4'),
      ONESIGNAL_SAFARI_ID: (process.env.hasOwnProperty('ONESIGNAL_SAFARI_ID') ? process.env.ONESIGNAL_SAFARI_ID : 'web.onesignal.auto.07679346-76f9-40eb-adf2-79670b2a6a52'),
      ONESIGNAL_NOTIFY_BUTTON: false,
      SW_ENABLED: true,
      STRIPE_KEY: (process.env.hasOwnProperty('STRIPE_KEY') ? process.env.STRIPE_KEY : ''),
      VERSION: (process.env.hasOwnProperty('VERSION') ? process.env['VERSION'] : null),
      PWA_URL: (process.env.hasOwnProperty('PWA_URL') ? process.env['PWA_URL'] : 'https://dev.qogni.io'),
      ENVIRONMENT: (process.env.hasOwnProperty('ENVIRONMENT') ? process.env['ENVIRONMENT'] : 'local'),
    }),
    sassPlugin(),
    copyPlugin({
      from: 'public/assets/js/app.css',
      to: 'public/assets/css/main.css',
      move: true,
    }),
    copyPlugin({
      from: 'public/assets/js/app.css.map',
      to: 'public/assets/css/main.css.map',
      move: true,
    }),
    copyPlugin({
      from: 'src/polyfills/*',
      to: 'public/assets/js/polyfills',
      exclude: ['src/polyfills/urlpatternPolyfill.js']
    }),
    copyPlugin({
      from: 'node_modules/@qogni-technologies/design-system/public/assets/img/icons.svg',
      to: 'public/assets/img/icons.svg',
    }),
    copyPlugin({
      from: 'public/assets/js/svc/service-worker.js',
      to: 'public/service-worker.js',
    }),
    externalResolverPlugin,
  ],
};

const build = async () => {
  const result = await esbuild.build(config);
  fs.writeFileSync('build-meta.json', JSON.stringify(result.metafile));
};

build();
console.log("Build completed");
