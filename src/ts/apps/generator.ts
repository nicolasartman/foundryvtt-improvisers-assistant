import { moduleId } from "../constants"

export default class ImprovisersAssistant extends Application {
  private imageUrl?: string = ""
  private isLoading: boolean = false
  private prompt: string = ""

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
      prompt: this.prompt,
    }
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html)
    const generate = async () => {
      this.prompt = html.find("input[name='prompt']").val() as string
      this.isLoading = true
      this.render()
      const imageUrl = await this.generateImage()
      this.imageUrl = imageUrl
      this.isLoading = false
      this.render()
    }

    html.find("button.generate-button").on("click", (event) => {
      event.preventDefault()
      generate()
    })
    html.find("input[name='prompt']").on("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        generate()
      }
    })
  }

  static getOpenAiApiKey(): string {
    return ((game as Game).settings.get(moduleId, "open_ai_api_key") || "") as string
  }

  async generateImage() {
    const apiKey = ImprovisersAssistant.getOpenAiApiKey()
    console.log("apiKey", apiKey)
    if (!apiKey) {
      ui.notifications?.error("OpenAI API key is not set.")
      return
    }

    const prompt = `Generate a circle tabletop RPG token of a ${
      this.prompt || "cute kitten"
    }. Black matte background. Fantasy art style.`

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    })

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
