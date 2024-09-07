import * as fsPromises from "fs/promises"
import fastGlob from "fast-glob"
import copy from "rollup-plugin-copy"
import { defineConfig, Plugin } from "vite"

const moduleVersion = process.env.MODULE_VERSION
const githubProject = process.env.GH_PROJECT
const githubTag = process.env.GH_TAG

console.log(process.env.VSCODE_INJECTION)

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: "src/ts/module.ts",
      output: {
        dir: "dist/scripts",
        entryFileNames: "module.js",
        format: "es",
      },
    },
  },
  plugins: [
    // Watch for changes to Handlebars templates & JSON files since they aren't picked up
    // automatically
    {
      name: "watch-external",
      async buildStart() {
        const files = [
          ...(await fastGlob("src/**/*.hbs")),
          ...(await fastGlob("src/**/*.json")),
          "src/styles/style.css",
        ]
        for (let file of files) {
          this.addWatchFile(file)
        }
      },
    },
    updateModuleManifestPlugin(),
    copy({
      targets: [
        { src: "src/languages", dest: "dist" },
        { src: "src/templates", dest: "dist" },
        { src: "src/styles/style.css", dest: "dist", rename: "style.css" },
      ],
      hook: "writeBundle",
    }),
  ],
})

function updateModuleManifestPlugin(): Plugin {
  return {
    name: "update-module-manifest",
    async writeBundle(): Promise<void> {
      const packageContents = JSON.parse(
        await fsPromises.readFile("./package.json", "utf-8"),
      ) as Record<string, unknown>
      const version = moduleVersion || (packageContents.version as string)
      const manifestContents: string = await fsPromises.readFile("src/module.json", "utf-8")
      const manifestJson = JSON.parse(manifestContents) as Record<string, unknown>
      manifestJson["version"] = version
      if (githubProject) {
        const baseUrl = `https://github.com/${githubProject}/releases`
        manifestJson["manifest"] = `${baseUrl}/latest/download/module.json`
        if (githubTag) {
          manifestJson["download"] = `${baseUrl}/download/${githubTag}/module.zip`
        }
      }
      await fsPromises.writeFile("dist/module.json", JSON.stringify(manifestJson, null, 4))
    },
  }
}
