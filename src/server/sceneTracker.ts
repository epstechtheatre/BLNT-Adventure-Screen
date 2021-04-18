import { Main } from "."
import { SceneNameNotFoundError } from "./customErrors";

export interface Scene {
    objectID: string
    children: Array<Scene>
    overlayTitle?: string
    outcome?: "passed"|"ended"
    sceneName: string
}

export default class SceneTracker {
    data: Scene
    currentScene: Scene
    main: Main

    constructor(main: Main, data: Scene) {
        this.main = main;
        this.data = data;
        this.currentScene = data;
    }

    getCurrentSceneChoices(): Array<Scene> {
        const children = this.currentScene.children

        if (!children || children.length === 0) {
            return [];
        }

        return children
    }

    /**
     * @returns The next scene
     */
    gotoNextScene(sceneName: string): Scene {
        const children = this.currentScene.children

        const found = children.find(element => element.sceneName === sceneName);

        if (!found) throw new SceneNameNotFoundError()

        //We have some work to do before going to the next scene

        return found;
    }
} 