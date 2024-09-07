import { moduleId } from "../constants"

export default class ImprovisersAssistant extends Application {
  private imageUrl?: string = ""
  private isLoading: boolean = false

  override get title(): string {
    return (game as Game).i18n.localize("IMPROVISERS_ASSISTANT.Title")
  }

  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "improvisers-assistant",
      template: `modules/${moduleId}/templates/generator.hbs`,
      width: 720,
      height: 720,
    }) as ApplicationOptions
  }

  override getData() {
    return {
      imageUrl: this.imageUrl,
      isLoading: this.isLoading,
    }
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html)
    html.find("button.module-control").on("click", async (event) => {
      event.preventDefault()
      this.isLoading = true
      this.render()
      const imageUrl = await this.generateKittenImage()
      this.imageUrl = imageUrl
      this.isLoading = false
      this.render()
    })
  }

  static getOpenAiApiKey(): string {
    return ((game as Game).settings.get(moduleId, "open_ai_api_key") || "") as string
  }

  async generateKittenImage() {
    const apiKey = ImprovisersAssistant.getOpenAiApiKey()
    console.log("apiKey", apiKey)
    if (!apiKey) {
      ui.notifications?.error("OpenAI API key is not set.")
      return
    }

    console.log("generating...")

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: "Generate an image of a cute kitten",
        n: 1,
        size: "1024x1024",
      }),
    })

    console.log("response", response)

    if (response.status != 200) {
      ui.notifications?.error(
        `Unexpected response fetching new kitten image: ${response.status}: ${response.statusText}`,
      )
      return
    }

    const data = await response.json()
    if (data && data.data && data.data.length > 0) {
      return data.data[0].url
    } else {
      ui.notifications?.error("No image returned from OpenAI.")
    }
  }
}
