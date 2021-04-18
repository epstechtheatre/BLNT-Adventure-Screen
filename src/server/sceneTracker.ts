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
    colouring: {[objectID: string]: string} = {}

    constructor(main: Main, data: Scene) {
        this.main = main;
        this.data = data;
        this.currentScene = data;
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

        } else {
            const children = this.currentScene.children        

            const found = children.find(element => element.sceneName === sceneName);
            if (!found) throw new SceneNameNotFoundError()
    
            //Recolour all children, the one selected is set as a different colour though
            for (const child in children) {
                if (children[child].objectID !== found?.objectID) {
                    this.setSceneColour(children[child], colours.UnselectedChoice)
                }
            }
    
            this.setSceneColour(this.currentScene, colours.PreviousScenes);
            this.setSceneColour(found, colours.CurrentScene);
    
            this.currentScene = found;
        }

        return this.currentScene;
    }

    displayColourChoices(): void {
        this.currentScene.children?.forEach(element => {
            this.setSceneColour(element, colours.ChoiceScenes)
        })
    }

    reset() {
        for (const objectID in this.colouring) {
            this.main.Express.emitColourEvent(objectID, "#ffffff");
        }
    }

    synchronize() {

        //Update the colours of all current colourings
        for (const objectID in this.colouring) {
            this.main.Express.emitColourEvent(objectID, this.colouring[objectID]);
        }

        //Update the list of scene choices
        this.sendCurrentSceneChoices()

    }

    private setSceneColour(scene: Scene, colour: string): void {
        this.colouring[scene.objectID] = colour;

        this.main.Express.emitColourEvent(scene.objectID, colour);
    }
} 