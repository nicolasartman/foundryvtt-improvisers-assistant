import DogBrowser from "./apps/dogBrowser"
import { moduleId } from "./constants"
import { MyModule } from "./types"

let module: MyModule

Hooks.once("init", () => {
  console.log(`Initializing ${moduleId}`)

  module = (game as Game).modules.get(moduleId) as MyModule
  module.dogBrowser = new DogBrowser()
})

// Hooks.on("renderActorDirectory", (_: Application, html: JQuery) => {
//   const button = $(`<button class="cc-sidebar-button" type="button">🐶</button>`)
//   button.on("click", () => {
//     module.dogBrowser.render(true)
//   })
//   html.find(".directory-header .action-buttons").append(button)
// })

Hooks.on("getSceneControlButtons", (controls) => {
  controls.push({
    name: "tokencreator",
    title: "Improviser's Assistant",
    icon: "fas fa-plus-circle",
    layer: "controls",
    visible: true,
    activeTool: "none",
    tools: [
      {
        name: "open",
        title: "Open Improviser's Assistant",
        icon: "fas fa-plus-circle",
        button: true,
        onClick: () => module.dogBrowser.render(true),
      },
    ],
  })
})
