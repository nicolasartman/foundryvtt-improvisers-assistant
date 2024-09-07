import { moduleId } from "../constants"

export default class ImprovisersAssistant extends Application {
  private tokenImageBase64?: string
  private tileImageBase64?: string
  private isTokenLoading: boolean = false
  private isTileLoading: boolean = false
  private tokenPrompt: string = ""
  private tilePrompt: string = ""

  override get title(): string {
    return (game as Game).i18n.localize("IMPROVISERS_ASSISTANT.Title")
  }

  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "improvisers-assistant",
      template: `modules/${moduleId}/templates/generator.hbs`,
      width: 400,
      height: 700,
    }) as ApplicationOptions
  }

  override getData() {
    return {
      tokenImageUrl: this.tokenImageBase64
        ? `data:image/png;base64,${this.tokenImageBase64}`
        : undefined,
      tileImageUrl: this.tileImageBase64
        ? `data:image/png;base64,${this.tileImageBase64}`
        : undefined,
      isTokenLoading: this.isTokenLoading,
      isTileLoading: this.isTileLoading,
      tokenPrompt: this.tokenPrompt,
      tilePrompt: this.tilePrompt,
    }
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html)
    const generateToken = async () => {
      this.tokenPrompt = html.find("input[name='token-prompt']").val() as string
      this.isTokenLoading = true
      this.render()
      await this.generateImage("token")
      this.isTokenLoading = false
      this.render()
    }

    const generateTile = async () => {
      this.tilePrompt = html.find("input[name='tile-prompt']").val() as string
      this.isTileLoading = true
      this.render()
      await this.generateImage("tile")
      this.isTileLoading = false
      this.render()
    }

    html.find("button.generate-token-image-button").on("click", (event) => {
      event.preventDefault()
      generateToken()
    })
    html.find("input[name='token-prompt']").on("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        generateToken()
      }
    })

    html.find("button.generate-tile-image-button").on("click", (event) => {
      event.preventDefault()
      generateTile()
    })
    html.find("input[name='tile-prompt']").on("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        generateTile()
      }
    })

    html.find("button.create-token-button").on("click", async (event) => {
      event.preventDefault()
      await this.createToken()
    })

    html.find("button.create-tile-button").on("click", async (event) => {
      event.preventDefault()
      await this.createTile()
    })
  }

  static getOpenAiApiKey(): string {
    return ((game as Game).settings.get(moduleId, "open_ai_api_key") || "") as string
  }

  async generateImage(type: "token" | "tile") {
    const apiKey = ImprovisersAssistant.getOpenAiApiKey()
    if (!apiKey) {
      ui.notifications?.error("OpenAI API key is not set.")
      return
    }

    const prompt =
      type === "token"
        ? `Tabletop RPG token of a ${
            this.tokenPrompt || "cute kitten"
          }. Circle shape. Black matte background. Fantasy art style.`
        : `Overhead, flat lay view of a${this.tilePrompt || "wooden floor"}. Fantasy art style.`

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
      if (type === "token") {
        this.tokenImageBase64 = data.data[0].b64_json
      } else {
        this.tileImageBase64 = data.data[0].b64_json
      }
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

    if (!this.tokenImageBase64) {
      ui.notifications?.error("No token image generated yet.")
      return
    }

    try {
      // Create the token using the base64 image data directly
      const tokenData = {
        img: `data:image/png;base64,${this.tokenImageBase64}`,
        name: this.tokenPrompt || "Generated Token",
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

  async createTile() {
    const scene = (game as Game).scenes?.active as Scene & { grid: { size: number } }
    if (!scene) {
      ui.notifications?.warn("No active scene.")
      return
    }

    if (!this.tileImageBase64) {
      ui.notifications?.error("No tile image generated yet.")
      return
    }

    try {
      const gridSize = scene.grid.size
      const tileData = {
        img: `data:image/png;base64,${this.tileImageBase64}`,
        width: 3 * gridSize,
        height: 3 * gridSize,
        x: 0,
        y: 0,
      }

      await scene.createEmbeddedDocuments("Tile", [tileData])
      ui.notifications?.info("Tile created successfully.")
    } catch (error) {
      console.error("Error creating tile:", error)
      ui.notifications?.error("Failed to create tile.")
    }
  }
}
