import path from 'path'
import fs from 'fs'

import { getConfig, getAccessToken, colourize, dehaze, contrastEnhance, imageWorkflow } from './src/baiduyun'

const config = getConfig()
console.log(config)

// getAccessToken(config).then(res => {
//     console.log(res)
// })


const basePath = '/Users/kema/Desktop/3'

const run = async () => {
    const files = [
        // '7awjNg7vij_b.JPG',
        // '711eccd8bb484debbf2df12fafdcadf2.jpeg',
        '4811212ad9e14ab1a2c3c0cd1e2eb0d7.jpeg',
    ]

    for(let i = 0; i < files.length; i++) {
        const fileSource = path.join(basePath, files[i])
        const fileTarget = path.join(basePath, '_' + files[i])
        try {
            const buff = await imageWorkflow(['contrast_enhance', 'colourize'], fileSource)
            fs.writeFileSync(fileTarget, buff)
            console.log('saved ->', fileTarget)
        } catch(ex) {
            console.log(ex)
        }
        
       
    }

}

run()

// const image = fs.readFileSync(path.resolve('11111.jpg'))

// colourize({
//     image
// }).then(({ image }) => {
//     const buff = Buffer.from(image, 'base64')
//     fs.writeFileSync(path.resolve('22222.jpg'), buff)
// })