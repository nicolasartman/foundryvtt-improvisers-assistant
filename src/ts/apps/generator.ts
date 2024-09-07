import { moduleId } from "../constants"

export default class ImprovisersAssistant extends Application {
  private imageUrl? = ""

  override get title(): string {
    return (game as Game).i18n.localize("IMPROVISERS_ASSISTANT.title")
  }

  static override get defaultOptions(): ApplicationOptions {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "improviser-assistant",
      template: `modules/${moduleId}/templates/generator.hbs`,
      width: 720,
      height: 720,
    }) as ApplicationOptions
  }

  override getData() {
    return {
      imageUrl: this.imageUrl,
    }
  }

  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html)
    html.find("button.module-control").on("click", (event) => {
      event.preventDefault()
      this._randomizeDog()
    })
  }

  async _randomizeDog() {
    const response = await fetch("https://dog.ceo/api/breeds/image/random")
    if (response.status != 200) {
      ui.notifications?.error(
        `Unexpected response fetching new dog image: ${response.status}: ${response.statusText}`,
      )
      return
    }
    this.imageUrl = (await response.json()).message
    this.render()
  }
}
