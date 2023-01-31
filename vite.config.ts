import {
  ConfigEnv,
  defineConfig,
  loadEnv,
  Plugin,
  UserConfig,
  UserConfigExport
} from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import path from "node:path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import ViteRequireContext from "@originjs/vite-plugin-require-context";
import envCompatible from "vite-plugin-env-compatible";
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";

const options = { pretty: true }; // FIXME: pug pretty is deprecated!
const locals = { name: "My Pug" };

export default ({ command, mode }: ConfigEnv) => {
  try{
    const root = process.cwd();
    const env = loadEnv(mode, root);

    // colors package 需要以下設定
    const stringifiedEnv: Record<string, any> = {
      'process.argv': process.argv,
      'process.env': {
          NODE_ENV: process.env.NODE_ENV,
          VITE_APP_ENV: process.env.VITE_APP_ENV
      }
    };
    const isBuild = command === "build";
    Object.keys(env).forEach(key => {
      stringifiedEnv[key] = JSON.stringify(env[key]);
    });

    // https://github.com/vitejs/vite/issues/8909
    //stringifiedEnv["global"] = JSON.stringify(JSON.stringify({}));
    // Load app-level env vars to node-level env vars.
    console.log("env:", stringifiedEnv);

    return defineConfig({
      root,
      // https://github.com/vitejs/vite/issues/5270#issuecomment-1065221182
      optimizeDeps: {
        esbuildOptions: {
          target: 'es2020',
        },
      },
      define: {
        ...stringifiedEnv,
        
      },
      esbuild: {
        target: "es2020"
      },
      resolve: {
        alias: {
          "@": path.resolve(root, "src/"),
          "~": path.resolve(root, "src/")
        },
        extensions: [".mjs", ".js", ".ts", ".tsx", ".json", ".vue"]
      },
      server: {},
      css: {
        preprocessorOptions: {
          //@ts-ignore
          resolver(id, basedir, importOptions) {
            console.log("id, basedir, importopt", id, basedir, importOptions);
          },
          scss: {
            // additionalData: `
            //   @import '@/presentation/assets/styles/predefined/mixin';
            //   @import '@/presentation/assets/styles/predefined/variables';
            // `
          }
        }
      },
      plugins: [
        vue(),
        vueJsx(),
        ViteRequireContext(),
        viteCommonjs(),
        // 讓 import.meta.env 可以被存取
        // envCompatible(),
        //pugPlugin(options, locals),
        // createSvgIconsPlugin({
        //   // Specify the icon folder to be cached
        //   iconDirs: [path.resolve(process.cwd(), "src/presentation/assets/icons")],
        //   // Specify symbolId format
        //   symbolId: "icon-[dir]-[name]",
        //   inject: 'body-last',
        //   customDomId: '__svg__icons__dom__',
        // }),
        createHtmlPlugin({
          inject: {
            data: { ...env, MODE: mode }
          }
        })
      ]
    });
    }catch(e){
      console.error(e);
      throw e;
    }
};
