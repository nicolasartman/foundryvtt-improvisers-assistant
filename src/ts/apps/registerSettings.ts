import { moduleId } from "../constants"

export default function registerSettings() {
  const settings = (game as Game).settings
  settings.register(moduleId, "open_ai_api_key", {
    name: `IMPROVISERS_ASSISTANT.Settings.OpenAI_API_Key.Name`,
    hint: `IMPROVISERS_ASSISTANT.Settings.OpenAI_API_Key.Hint`,
    scope: "world",
    config: true,
    type: String,
    default: "",
  })
}
