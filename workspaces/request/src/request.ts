import http from 'http'
import https from 'https'

type TMethod = 'GET' | 'POST'
type TResponseType = 'text' | 'arraybuffer'

type TRequestOptions<T extends TResponseType> = {
    url: string;
    data?: Record<string, any>;
    header?: Record<string, string | number>;
    method?: TMethod;
    responseType?: T | TResponseType;
    responseEncoding?: BufferEncoding;
}

type TResPonseDataType<T extends TResponseType | undefined = 'text'> = T extends 'arraybuffer' ? Buffer : string


const HEAD_BASE = {
    'Content-Type': 'application/json',
    'Accept': '*',
}

const mergeHead = (header: any) => {
    const _header: Record<string, any> = {}
    Object.entries(HEAD_BASE).forEach(([key, val]) => {
        _header[key.toLowerCase()] = val
    })
    if (isRecord(header)) {
        Object.entries(header).forEach(([key, val]) => {
            _header[key.toLowerCase()] = val
        })
    }
    return _header
}

const createError = <T = any>(code: number, msg: string, err?: T) => {
    return { errCode: code, errMsg: msg, error: err || null }
}

const isRecord = (v: any): v is Record<string, any> => {
    return Object.prototype.toString.call(v) === '[object Object]'
}

const parseJSON = (data: any) => {
    if (typeof data === 'undefined') {
        return ''
    } else if (data === null) {
        return 'null'
    } else {
        return JSON.stringify(data)
    }
}

const parseForm = (data: any) => {
    if(isRecord(data)) {
        return Object.entries(data).map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&')
    } else {
        return data + ''
    }
}

const parseData = (data: any, header: Record<string, any>) => {
    let contentType = 'application/json'
    Object.entries(header).forEach(([key, val]) => {
        if(key.toLowerCase() === 'content-type') {
            contentType = (val + '').toLowerCase()
        }
    })
    const [, type] = contentType.split(/\/+/)
    if(type.startsWith('json')) {
        return parseJSON(data)
    } else if(type.startsWith('x-www-form-urlencoded')) {
        return parseForm(data)
    } else {
        return data + ''
    }
}

const request = <T extends TResponseType = 'text'>(options: TRequestOptions<T>) => new Promise<TResPonseDataType<T>>((resolve, reject) => {
    const {
        url = '',
        data = null,
        header = null,
        method = 'GET' as TMethod,
        responseType = 'text' as T,
        responseEncoding = 'utf-8',
    } = options || {}

    if (!url) {
        return
    }

    const _header = mergeHead(header)
    const HTTP = url.startsWith('https:') ? https : http
    
    const req = HTTP.request(url, {
        method,
    }, res => {
        const chunks: Buffer[] = []

        res.on('data', chunk => {
            chunks.push(chunk)
        })
        res.on('end', () => {
            const data = Buffer.concat(chunks)
            const json = data.toString(responseEncoding)
            if (responseType === 'text') {
                resolve(json as any)
            } else {
                resolve(data as any)
            }
        })
        res.on('error', (err) => {
            reject(createError(110, 'response error', err))
        })
    })

    req.on('error', (err) => {
        reject(createError(10, 'request error', err))
        req.destroy()
    })

    req.on('timeout', () => {
        reject(createError(10, 'request timeout'))
        req.destroy()
    })
    req.on('close', () => {
        req.destroy()
    })

    Object.entries(_header).forEach(([key, val]) => {
        req.setHeader(key, val)
    })

    const sendData = ['GET'].includes(method) ? '' : parseData(data, _header)

    req.write(sendData, (err) => {
        if (err) {
            reject(createError(11, 'request error', err))
            req.destroy()
        } else {
            req.end()
        }
    })
})


export default request