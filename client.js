//导入http_yx应用层协议
const http_yx = require('./http_yx')
//向服务器发送请求
http_yx.httpRequest(8080, 'POST', 'hello world!');
