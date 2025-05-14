import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

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

    hashobject(content){
        return crypto.createHash('sha1').update(content, 'utf-8').digest('hex')
    }

    async add(file){
        const fileData = await fs.readFile(file, {encoding: 'utf-8'})
        const fileHash = this.hashobject(fileData)
        // console.log(fileHash)

        const newFolderHashedObjectPathName = fileHash.slice(0,2)
        const newFolderHashedObjectPath = path.join(this.objectsPath, newFolderHashedObjectPathName)

        await fs.mkdir(newFolderHashedObjectPath)

        const newFileHashedObjectPathName = fileHash.slice(2)
        const newFileHashedObjectPath = path.join(newFolderHashedObjectPath, newFileHashedObjectPathName)

        await fs.writeFile(newFileHashedObjectPath, fileData)
        await this.updateStagingArea(file, fileHash)

        console.log(`Added ${file}`)
    }

    async updateStagingArea(filePath, fileHash){
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding:'utf-8' }))
        
        index.push({ path:filePath, hash:fileHash })

        await fs.writeFile(this.indexPath, JSON.stringify(index))
    }

    async commit(message){
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding:'utf-8' }))

        const parentCommit = await this.getCurrentHead();

        const commitData = {
            parent: parentCommit,
            files: index,
            timeStamp: new Date().toISOString(),
            message
        }

        const commitHash = this.hashobject(JSON.stringify(commitData))

        const commitHashFolderPathName = commitHash.slice(0,2)
        const commitHashFolderPath = path.join(this.objectsPath, commitHashFolderPathName)

        await fs.mkdir(commitHashFolderPath)

        const commitHashObjectPathName = commitHash.slice(2)
        const commitHashObjectPath = path.join(commitHashFolderPath, commitHashObjectPathName)

        await fs.writeFile(commitHashObjectPath, JSON.stringify(commitData))
        await fs.writeFile(this.headPath, commitHash)
        await fs.writeFile(this.indexPath, JSON.stringify([]))

        console.log(`Successfully created commit: ${commitHash}`)
    }

    async getCurrentHead(){
        try {
            return await fs.readFile(this.headPath, { encoding: 'utf-8' })
        } catch (error) {
            return null
        }
    }
}

(async ()=>{
    const pit = new Pit()
    await pit.add('sample.txt')
    await pit.commit('first commit')
})();
// pit.add('sample2.txt')