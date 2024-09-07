import { ModuleData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/packages.mjs"
import ImproviserAssistant from "./apps/generator"

export interface ImproviserAssistantModule extends Game.ModuleData<ModuleData> {
  improviserAssistant: ImproviserAssistant
}
