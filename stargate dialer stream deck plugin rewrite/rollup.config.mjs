import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const watching = Boolean(process.env.ROLLUP_WATCH);
const bundle = "com.stargate.command.sdPlugin";

export default {
  input: "src/plugin.ts",
  output: { file: `${bundle}/bin/plugin.js`, format: "es", sourcemap: watching },
  plugins: [
    typescript({ sourceMap: watching }),
    nodeResolve({ browser: false, exportConditions: ["node"], preferBuiltins: true }),
    commonjs(),
    !watching && terser(),
    {
      name: "plugin-package-json",
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "package.json", source: '{"type":"module"}' });
      },
    },
  ],
};
