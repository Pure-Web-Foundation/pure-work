const esbuild = require("esbuild");
const sassPlugin = require("esbuild-plugin-sass");

const config = {
  entryPoints: [
    'src/js/index.js'
  ],
  plugins: [
    sassPlugin({
      type: "css-text",
    }),
  ],
  platform: "node",
  outdir: "public/assets/js/",
  external: ["*.woff", "*.eot", "*.ttf", "*.svg"],
  bundle: true,
  minify: true,
  sourcemap: false,
  external: ["esbuild"],
  loader: {
    ".scss": "css",
  },
};

const run = async () => {
  const ctx = await esbuild.context(config);
  await ctx.rebuild();
};

run();
console.log("Build completed");
