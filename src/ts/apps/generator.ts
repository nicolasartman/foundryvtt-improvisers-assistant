import { moduleId } from "../constants"

export default class ImprovisersAssistant extends Application {
  private tokenImageBase64?: string
  private tileImageBase64?: string
  private pictureImageBase64?: string
  private isTokenLoading: boolean = false
  private isTileLoading: boolean = false
  private isPictureLoading: boolean = false
  private tokenPrompt: string = ""
  private tilePrompt: string = ""
  private picturePrompt: string = ""

  override get title(): string {
    return (game as Game).i18n.localize("IMPROVISERS_ASSISTANT.Title")
  }

  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "improvisers-assistant",
      template: `modules/${moduleId}/templates/generator.hbs`,
      width: 320,
      height: 800,
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
      pictureImageUrl: this.pictureImageBase64
        ? `data:image/png;base64,${this.pictureImageBase64}`
        : undefined,
      isTokenLoading: this.isTokenLoading,
      isTileLoading: this.isTileLoading,
      isPictureLoading: this.isPictureLoading,
      tokenPrompt: this.tokenPrompt,
      tilePrompt: this.tilePrompt,
      picturePrompt: this.picturePrompt,
    }
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html)
    const generateTokenImage = async () => {
      this.tokenPrompt = html.find("input[name='token-prompt']").val() as string
      this.isTokenLoading = true
      this.render()
      const prompt = `Tabletop RPG token of a ${
        this.tokenPrompt || "cute kitten"
      }. Circle shape. Black matte background. Fantasy art style.`
      this.tokenImageBase64 = await this.generateImage(prompt)
      this.isTokenLoading = false
      this.render()
    }

    const generateTileImage = async () => {
      this.tilePrompt = html.find("input[name='tile-prompt']").val() as string
      this.isTileLoading = true
      this.render()
      const prompt = `Overhead, flat lay view of a TTRPG tile of a ${
        this.tilePrompt || "wooden floor"
      }. Fantasy art style.`
      this.tileImageBase64 = await this.generateImage(prompt)
      this.isTileLoading = false
      this.render()
    }

    const generatePictureImage = async () => {
      this.picturePrompt = html.find("input[name='picture-prompt']").val() as string
      this.isPictureLoading = true
      this.render()
      const prompt = `${this.picturePrompt || "fantasy landscape"}. Fantasy art style.`
      this.pictureImageBase64 = await this.generateImage(prompt)
      this.isPictureLoading = false
      this.render()
    }

    html.find("button.generate-token-image-button").on("click", (event) => {
      event.preventDefault()
      generateTokenImage()
    })
    html.find("input[name='token-prompt']").on("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        generateTokenImage()
      }
    })

    html.find("button.generate-tile-image-button").on("click", (event) => {
      event.preventDefault()
      generateTileImage()
    })
    html.find("input[name='tile-prompt']").on("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        generateTileImage()
      }
    })

    html.find("button.generate-picture-image-button").on("click", (event) => {
      event.preventDefault()
      generatePictureImage()
    })
    html.find("input[name='picture-prompt']").on("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        generatePictureImage()
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

    html.find("button.create-picture-button").on("click", async (event) => {
      event.preventDefault()
      await this.createPicture()
    })
  }

  static getOpenAiApiKey(): string {
    return ((game as Game).settings.get(moduleId, "open_ai_api_key") || "") as string
  }

  async generateImage(prompt: string) {
    const apiKey = ImprovisersAssistant.getOpenAiApiKey()
    if (!apiKey) {
      ui.notifications?.error("OpenAI API key is not set.")
      return
    }

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
      return data.data[0].b64_json
    } else {
      ui.notifications?.error("No image returned from OpenAI.")
      return null
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
      const tokenData = {
        img: `data:image/png;base64,${this.tokenImageBase64}`,
        name: this.tokenPrompt || "Generated Token",
        x: 0,
        y: 0,
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

  async createPicture() {
    const scene = (game as Game).scenes?.active as Scene & { grid: { size: number } }
    if (!scene) {
      ui.notifications?.warn("No active scene.")
      return
    }

    if (!this.pictureImageBase64) {
      ui.notifications?.error("No picture generated yet.")
      return
    }

    try {
      const gridSize = scene.grid.size
      const pictureData = {
        name: this.picturePrompt || "Generated Picture",
        img: `data:image/png;base64,${this.pictureImageBase64}`,
        width: 10 * gridSize,
        height: 10 * gridSize,
      }

      await scene.createEmbeddedDocuments("Tile", [pictureData])
      ui.notifications?.info("Picture tile created successfully.")
    } catch (error) {
      console.error("Error creating picture:", error)
      ui.notifications?.error("Failed to create picture.")
    }
  }
}
