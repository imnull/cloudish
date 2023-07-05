import yaml from 'yaml'
import request from '@imnull/request'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { CACHE_ACCESS_TMP_FILE, createError } from './common'

type TAccessTokenResponse = {
    access_token: string;
    refresh_token: string;
    scope: string[];
    session_key: string;
    session_secret: string;
    expires_in: number;
    expires_time: number;
}

export const _getAccessToken = async (params: { SecretKey: string; APIKey: string }) => {
    const { APIKey, SecretKey } = params
    const res = await request({
        url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${APIKey}&client_secret=${SecretKey}`,
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
    const v = JSON.parse(res)
    // {"error":"unsupported_grant_type","error_description":"The authorization grant type is not supported"}
    if (v.error) {
        throw createError(10010, v.error_description, v.error)
    }
    v.expires_time = (Date.now() / 1000 >> 0) + v.expires_in
    v.scope = (v.scope || '').split(/\s+?/)
    return v as TAccessTokenResponse
}

export const getAccessToken = (params: { SecretKey: string; APIKey: string }) => new Promise<TAccessTokenResponse>((resolve, reject) => {
    const file = path.join(os.tmpdir(), CACHE_ACCESS_TMP_FILE)
    const lock = file + '.lock'
    if (fs.existsSync(lock)) {
        setTimeout(() => {
            getAccessToken(params).then(resolve, reject)
        }, 50)
    } else if (!fs.existsSync(file)) {
        fs.writeFileSync(lock, '')
        _getAccessToken(params).then(res => {
            fs.writeFileSync(file, yaml.stringify(res))
            fs.unlinkSync(lock)
            resolve(res)
        }, reject)
    } else {
        const yml = fs.readFileSync(file, 'utf-8')
        const tokens = yaml.parse(yml) as TAccessTokenResponse
        const now = Date.now() / 1000 >> 0
        if (now > tokens.expires_time) {
            fs.unlinkSync(file)
            getAccessToken(params).then(resolve, reject)
        } else {
            resolve(tokens)
        }
    }
})