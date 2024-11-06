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

const build = async () => {
  await esbuild.build(config);
};

build().then(() => {
  console.log("Build ready.");
});
