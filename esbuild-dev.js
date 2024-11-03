const esbuild = require("esbuild");
const rebuildNotifyPlugin = require("./lib/esbuild-plugin-rebuild-notify");
const sassPlugin = require("esbuild-plugin-sass");

const config = {
  entryPoints: [
    'src/js/index.js'
  ],
  plugins: [
    rebuildNotifyPlugin(),
    sassPlugin({
      type: "css-text",
    }),
  ],
  platform: "node",
  outdir: "public/assets/js/",
  external: ["*.woff", "*.eot", "*.ttf", "*.svg"],
  bundle: true,
  sourcemap: true,
  external: ["esbuild"],
  loader: {
    ".scss": "css",
  },
};

const run = async () => {
  const ctx = await esbuild.context(config);
  await ctx.watch();
};

run();
