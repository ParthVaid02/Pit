import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { diffLines } from 'diff';
import chalk from 'chalk';

class Pit{
    constructor(repoPath = '.'){
        this.repoPath = path.join(repoPath, '.pit');
        this.objectsPath = path.join(this.repoPath, 'objects');
        this.headPath = path.join(this.repoPath, 'HEAD');
        this.indexPath = path.join(this.repoPath, 'index')
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

    getObjectPath(hash){
        const hashFolderPathName = hash.slice(0,2)
        const hashFilePathName = hash.slice(2)

        return path.join(this.objectsPath, hashFolderPathName, hashFilePathName)
    }

    async log(){
        let currentCommitHash = await this.getCurrentHead()

        while(currentCommitHash){
            const commitPath = this.getObjectPath(currentCommitHash)

            const commitData = JSON.parse(await fs.readFile(commitPath, { encoding:'utf-8' }))

            console.log('-----------------------------------------------------------------------------\n')
            console.log(`Commit: ${currentCommitHash}\nDate: ${commitData.timeStamp}\n${commitData.message}\n`)

            currentCommitHash = commitData.parent
        }
    }
    
    async diff(commitHash){
        const commitData = JSON.parse(await this.getCommitData(commitHash))
        if(!commitData){
            console.log('Commit not found')
            return
        }

        console.log("Changes in the last commit are: ")

        for (const file of commitData.files) {
            console.log(`\nFile: ${file.path}`)
            const fileContent = await this.getFileData(file.hash)
            // console.log(fileContent)

            if(commitData.parent){
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent))
                const parentFileContent = await this.getParentFileContent(parentCommitData, file.path)
                if(parentFileContent){
                    console.log('\nDiff: ')

                    const diff = diffLines(parentFileContent, fileContent)

                    diff.forEach(part => {
                        if(part.added){
                            process.stdout.write(chalk.green('+++' + part.value))
                        }
                        else if(part.removed){
                            process.stdout.write(chalk.red("---" + part.value))
                        }
                        else{
                            process.stdout.write(chalk.gray(part.value))
                        }
                        console.log()
                    })
                }
                else{
                    console.log('New file in this commit')
                }
            }
            else{
                console.log('First Commit')
            }
            console.log('-----------------------------------------------------------------------------')
        }
    }

    async getParentFileContent(parentCommitData, filePath){
        const parentFile = parentCommitData.files.find(file => file.path === filePath)

        if(parentFile){
            return await this.getFileData(parentFile.hash)
        }
    }

    async getCommitData(commitHash){
        const commitPath = this.getObjectPath(commitHash)

        try {
            return await fs.readFile(commitPath, { encoding:'utf8' })
        } catch (error) {
            return null
        }
    }

    async getFileData(fileHash){
        const objectPath = this.getObjectPath(fileHash)

        return await fs.readFile(objectPath, { encoding:'utf-8' })
    }
}

(async ()=>{
    const pit = new Pit()
    // await pit.add('sample.txt')
    // await pit.add('sample2.txt')
    // await pit.commit('fifth commit')
    // await pit.log()

    await pit.diff('9b1d67c3df700e93f8976125f9d41d2668944906')
})();
// pit.add('sample2.txt')