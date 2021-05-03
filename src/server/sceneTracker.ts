import { Main } from "."
import { SceneNameNotFoundError } from "./customErrors";
import colours from "../colourConfig.json"

export interface Scene {
    objectID: string
    children: Array<Scene>
    overlayTitle?: string
    sceneName: string
}

export default class SceneTracker {
    data: Scene
    currentScene: Scene
    main: Main
    colouring: {[objectID: string]: {value: string, was?: string}} = {}
    overlayText: {current: string, default: string}
    private deathCount: number

    constructor(main: Main, data: Scene, defaultOverlayText: string = "Better Luck Next Time") {
        this.main = main;
        this.data = data;
        this.currentScene = data;
        this.overlayText = {
            default: defaultOverlayText,
            current: defaultOverlayText
        }
        this.deathCount = 0

        //Set the colour and data for the first scene
        this.setSceneColour(this.currentScene, colours.CurrentScene);
        
        if (this.currentScene.overlayTitle) {
            this.setCurrentOverlayText(this.currentScene.overlayTitle);
        } else {
            this.main.Express.emitNewOverlayText(this.overlayText.current);
        }
    }

    incrementDeath(reset = false) {
        if (!reset) {
            this.deathCount++
        } else {
            this.deathCount = 0;
        }

        this.main.Express.emitDeathInteger(this.deathCount);
    }

    getDeathCount() {
        this.main.Express.emitDeathInteger(this.deathCount);

        return;
    }

    sendCurrentSceneChoices(): void {
        const children = this.currentScene.children

        if (!children || children.length === 0) {
            this.main.Express.emitSceneOptions([]);
        }

        let output = []
        for (const child in children) {
            output.push(children[child].sceneName)
        }

        this.main.Express.emitSceneOptions(output);
    }

    /**
     * @returns The next scene
     */
    gotoNextScene(sceneName: string): Scene {
        //If the scene has no children, we should go back to the start
        if (!this.currentScene.children || this.currentScene.children.length === 0) {
            this.setSceneColour(this.currentScene, colours.TerminatingScene);
            this.currentScene = this.data;
            this.setSceneColour(this.currentScene, colours.CurrentScene)

            this.incrementDeath();

        } else {
            const children = this.currentScene.children        

            const found = children.find(element => element.sceneName === sceneName);
            if (!found) throw new SceneNameNotFoundError()
    
            //Recolour all children, the one selected is set as a different colour though
            for (const child in children) {
                if (children[child].objectID !== found?.objectID) {
                    //If the child is red, that means it is a terminating cue and it should stay red
                    if (this.colouring[children[child].objectID]) {
                        if (this.colouring[children[child].objectID].was === colours.TerminatingScene) {
                            this.setSceneColour(children[child], colours.TerminatingScene)
                            delete this.colouring[children[child].objectID].was
                        } else {
                            if (!(this.colouring[children[child].objectID].value === colours.TerminatingScene)) {
                                this.setSceneColour(children[child], colours.UnselectedChoice)
                            }
                        }
                    } else {
                        this.setSceneColour(children[child], colours.UnselectedChoice)
                    }
                }
            }
    
            this.setSceneColour(this.currentScene, colours.PreviousScenes);
            this.setSceneColour(found, colours.CurrentScene);
    
            this.currentScene = found;

        }
        
        if (this.currentScene.overlayTitle) {
            this.setCurrentOverlayText(this.currentScene.overlayTitle);
        }
        
        this.sendCurrentSceneChoices();
        this.main.Express.emitCurrentSceneName(this.overlayText.current, this.currentScene.sceneName);

        return this.currentScene;
    }

    displayColourChoices(): void {
        this.currentScene.children?.forEach(element => {
            this.setSceneColour(element, colours.ChoiceScenes)
        })
    }

    reset() {
        for (const objectID in this.colouring) {
            this.main.Express.emitColourEvent(objectID, colours.ResetColour);
        }
        this.colouring = {};

        this.currentScene = this.data;
        this.sendCurrentSceneChoices();
        this.setSceneColour(this.currentScene, colours.CurrentScene);

        if (this.currentScene.overlayTitle) {
            this.setCurrentOverlayText(this.currentScene.overlayTitle)
        } else {
            this.defaultOverlayText();
        }

        //Update the sceneName
        this.main.Express.emitCurrentSceneName(this.overlayText.current, this.currentScene.sceneName)

        this.incrementDeath(true);
    }

    synchronize() {

        //Update the colours of all current colourings
        for (const objectID in this.colouring) {
            this.main.Express.emitColourEvent(objectID, this.colouring[objectID].value);
        }

        //Update the list of scene choices
        this.sendCurrentSceneChoices()

        //Update the overlay text
        this.main.Express.emitNewOverlayText(this.overlayText.current)

        this.getDeathCount()

    }

    recolourAll(colour: "red"): void {
        for (const entry in this.colouring) {
            switch (colour) {
                case "red":
                    this.colouring[entry].value = colours.TerminatingScene
                    break;

                default:
                    break;
            }
            this.main.Express.emitColourEvent(entry, this.colouring[entry].value)
        }
    }

    private setSceneColour(scene: Scene, colour: string): SceneTracker {
        if (this.colouring[scene.objectID] && this.colouring[scene.objectID].value === colours.TerminatingScene) {
            this.colouring[scene.objectID].was = this.colouring[scene.objectID].value
        }

        if (!this.colouring[scene.objectID]) {
            this.colouring[scene.objectID] = {
                "value": colour
            }
        } else {
            this.colouring[scene.objectID].value = colour
        }

        this.main.Express.emitColourEvent(scene.objectID, colour);

        return this;
    }

    private setCurrentOverlayText(text: string): SceneTracker {
        this.overlayText.current = text

        this.main.Express.emitNewOverlayText(this.overlayText.current);

        return this;
    }

    private defaultOverlayText(): SceneTracker {
        this.overlayText.current = this.overlayText.default;

        this.main.Express.emitNewOverlayText(this.overlayText.current)

        return this;
    }
} 