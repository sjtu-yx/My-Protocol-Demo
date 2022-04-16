//导入http_yx应用层协议
const http_yx = require('./http_yx')
//创建服务器
http_yx.CreateServer('POST', 'dhldj');
//启动监听
http_yx.Listen(8080);