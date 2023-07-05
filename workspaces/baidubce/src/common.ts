import yaml from 'yaml'
import fs from 'fs'
import path from 'path'
import process from 'process'
import os from 'os'

const isNil = (v: any) => typeof v === 'undefined' || v === null

export const createError = (code: number, msg: string, err?: any) => {
    return { errCode: code, errMsg: msg, error: isNil(err) ? null : err }
}

export const ENVNAME_APPID = 'BDBCE_APPID'
export const ENVNAME_SECRETKEY = 'BDUBCE_SECRETKEY'
export const ENVNAME_APIKEY = 'BDUBCE_APIKEY'
export const ENVRC_FILE = '.bdbcerc'
export const CACHE_ACCESS_TMP_FILE = 'bdbce_access_info.yaml'

export const getEnvValue = (envName: string, defaultValue: string = '') => {
    return process.env[envName] || defaultValue
}

export type TAppConfig = { AppID: number; SecretKey: string; APIKey: string }
export const getConfig = (rcfile: string = path.join(os.homedir(), ENVRC_FILE)) => {
    const config: TAppConfig = {
        AppID: Number(getEnvValue(ENVNAME_APPID, '0')),
        APIKey: getEnvValue(ENVNAME_APIKEY, ''),
        SecretKey: getEnvValue(ENVNAME_SECRETKEY, ''),
    }
    if (fs.existsSync(rcfile)) {
        const yml = fs.readFileSync(rcfile, 'utf-8')
        try {
            const data = yaml.parse(yml) || {}
            if (data.AppID) {
                config.AppID = data.AppID
            }
            if (data.SecretKey) {
                config.SecretKey = data.SecretKey
            }
            if (data.APIKey) {
                config.APIKey = data.APIKey
            }
        } catch (ex) { }
    }
    return config
}
