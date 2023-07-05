import request from '@imnull/request'
import { getAccessToken } from './auth'
import { createError, getConfig } from './common'
import fs from 'fs'

export type TProcessName = 'colourize' | 'dehaze' | 'contrast_enhance'

export const imageWorkflow = async (tasks: TProcessName[], imageFile: string) => {
    const buffer = fs.readFileSync(imageFile)
    let base64 = buffer.toString('base64')
    for(let i = 0; i < tasks.length; i++) {
        console.log(` - image process [${i + 1}/${tasks.length}]: `, tasks[i], '->', imageFile)
        const res = await imageProcessFactory(tasks[i])({ image: base64 })
        const { image } = res
        base64 = image
    }
    return Buffer.from(base64, 'base64')
}

const dealParams = <T extends Record<string, any> = {}>(params: ({ url: string } | { image: string | Buffer }) & T, defaultParams: Record<string, any> = {}) => {
    const { url: _url, image: _image, ...rest } = params as any
    const data: any = { ...defaultParams, ...rest }
    if (_url) {
        data.url = _url
    } else if (_image) {
        if (typeof _image === 'string') {
            data.image = _image
        } else {
            data.image = (_image as Buffer).toString('base64')
        }
    }
    return data
}

const imageProcessFactory = <T extends Record<string, any> = {}>(processName: TProcessName, defaultParams: Record<string, any> = {}) => {
    return async (params: ({ url: string } | { image: string | Buffer }) & T) => {
        const { access_token } = await getAccessToken(getConfig())
        const url = `https://aip.baidubce.com/rest/2.0/image-process/v1/${processName}?access_token=${access_token}`
        const { url: _url, image: _image, ...rest } = params as any
        const data = dealParams<T>(params, defaultParams)
        const res = await request({
            url,
            method: 'POST',
            header: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data,
        })
    
        const v = JSON.parse(res)
        if(v.error_msg) {
            throw createError(11010, v.error_msg, v)
        }
    
        const fin = v as { log_id: number; image: string; }
        return fin
    }
}

export const colourize = imageProcessFactory('colourize')
export const dehaze = imageProcessFactory('dehaze')
export const contrastEnhance = imageProcessFactory('contrast_enhance')
// export const inPainting = imageProcessFactory<{ rectangle: { width: number; height: number; top: number; left: number; }[] }>('inpainting')