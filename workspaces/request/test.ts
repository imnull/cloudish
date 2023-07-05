import request from './src/request'

request({
    url: 'https://www.baidu.com',
}).then(res => {
    console.log(111111, res)
})