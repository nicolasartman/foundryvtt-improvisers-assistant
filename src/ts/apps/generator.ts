import { moduleId } from "../constants"

export default class ImprovisersAssistant extends Application {
  private imageBase64?: string
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
      imageUrl: this.imageBase64 ? `data:image/png;base64,${this.imageBase64}` : undefined,
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
      await this.generateImage()
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

    html.find("button.create-token-button").on("click", async (event) => {
      event.preventDefault()
      await this.createToken()
    })
  }

  static getOpenAiApiKey(): string {
    return ((game as Game).settings.get(moduleId, "open_ai_api_key") || "") as string
  }

  async generateImage() {
    const apiKey = ImprovisersAssistant.getOpenAiApiKey()
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
        response_format: "b64_json",
      }),
    })

    if (response.status != 200) {
      ui.notifications?.error(
        `Unexpected response fetching new image: ${response.status}: ${response.statusText}`,
      )
      return
    }

    const data = await response.json()
    if (data && data.data && data.data.length > 0) {
      this.imageBase64 = data.data[0].b64_json
    } else {
      ui.notifications?.error("No image returned from OpenAI.")
    }
  }

  async createToken() {
    const scene = (game as Game).scenes?.active
    if (!scene) {
      ui.notifications?.warn("No active scene.")
      return
    }

    if (!this.imageBase64) {
      ui.notifications?.error("No image generated yet.")
      return
    }

    try {
      // Create the token using the base64 image data directly
      const tokenData = {
        img: `data:image/png;base64,${this.imageBase64}`,
        name: this.prompt || "Generated Token",
        x: 0,
        y: 0,
        // You can add more properties here as needed
      }

      await scene.createEmbeddedDocuments("Token", [tokenData])
      ui.notifications?.info("Token created successfully.")
    } catch (error) {
      console.error("Error creating token:", error)
      ui.notifications?.error("Failed to create token.")
    }
  }
}
