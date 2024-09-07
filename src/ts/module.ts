import ImproviserAssistant from "./apps/generator"
import { moduleId } from "./constants"
import { ImproviserAssistantModule } from "./types"

let module: ImproviserAssistantModule

Hooks.once("init", () => {
  console.log(`Initializing ${moduleId}`)

  module = (game as Game).modules.get(moduleId) as ImproviserAssistantModule
  module.improviserAssistant = new ImproviserAssistant()
})

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
        onClick: () => module.improviserAssistant.render(true),
      },
    ],
  })
})
