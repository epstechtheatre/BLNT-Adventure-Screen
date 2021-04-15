interface Scene {
    objectID: string
    childrenScenes: Array<Scene>
    overlayTitle?: string
}

type ShowSceneNamespace = {[sceneName: string]: Scene}

export class SceneTracker {
    path: ShowSceneNamespace


    constructor(path: ShowSceneNamespace) {
        this.path = path
    }


} 