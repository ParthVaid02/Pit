import path from 'path'
import fs from 'fs/promises'

class Pit{
    constructor(repoPath = '.'){
        this.repoPath = path.join(repoPath, '.pit');
        this.objectsPath = path.join(this.repoPath, 'objects');
        this.headPath = path.join(this.repoPath, 'HEAD');
        this.indexPath = path.join(this.repoPath, 'index')
        this.init()
    }

    async init(){
        await fs.mkdir(this.objectsPath, {recursive: true})

        try {
            await fs.writeFile(this.headPath, '', {flag: 'wx'})
            await fs.writeFile(this.indexPath, JSON.stringify([]), {flag: 'wx'})
        } catch (error) {
            console.log('Already initialized pit in this repo')
        }
    }

    
}

const pit = new Pit()