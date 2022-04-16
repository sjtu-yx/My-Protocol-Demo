const net = require('net');

class Packet {
    total;
    seq;
    data;
};

const EventEmitter = require('events');

class Parser extends EventEmitter {
    buffer = null;
    state = '1';
    packet = new Packet();
    parse(buf) {
        if(!this.buffer) this.buffer = buf;
        else this.buffer = Buffer.concat([this.buffer, buf]);
        while(true) {
            const length = Buffer.byteLength(this.buffer);
            switch(this.state) {
                case '1':
                    if (length >= 4) {
                        this.packet = new Packet();
                        this.packet.total = this.buffer.readUInt32BE();
                        this.state = '2';
                        this.buffer = this.buffer.slice(4);
                        break;
                    } else {
                        return;
                    }
                case '2':
                    if (length >= 4) {
                        this.packet.seq = this.buffer.readUInt32BE();
                        this.state = '3';
                        this.buffer = this.buffer.slice(4);
                        break;
                    } else {
                        return;
                    } 
                case '3':
                    let packetLength = this.packet.total;
                    if (length >= packetLength) {
                        this.packet.data = JSON.parse(this.buffer.slice(0, packetLength).toString('utf-8'));
                        this.state = '1';
                        this.buffer = this.buffer.slice(packetLength);
                        this.emit('packet', this.packet);
                        this.packet = null;
                        break;
                    } else {
                        return;
                    }   
            }
        }
    }

    makePacket(seq, body) {
        const data = Buffer.from(body);
        const totalBuffer = Buffer.alloc(4);
        totalBuffer.writeUInt32BE(Buffer.byteLength(data));
        const seqBuffer = Buffer.alloc(4);
        seqBuffer.writeUInt32BE(seq);
        return Buffer.concat([totalBuffer, seqBuffer, data]);;
    }

}
let server;
function getTime() {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours() + 1;
    let minute = date.getMinutes();
    let second = date.getSeconds();
    time = year + '年' + month + '月' + day + '日 ' + hour + ':' + minute + ':' + second;
    return time;
}
function CreateServer() {
    server = net.createServer((socket) => {
        let parser = new Parser();
        parser.on('packet', (packet) => {
            console.log("接收到请求包：", JSON.stringify(packet, null, 4));
            const body = JSON.stringify({code: 0, time: getTime()});
            socket.write(parser.makePacket(packet.seq, body));
        });
        socket.on('data', (buf) => {
            parser.parse(buf);
        });
        socket.on('end', () => {
            parser = null;
        });
    });
}
function Listen(url) {
    server.listen(url);
    
}
function httpRequest(url, method, message) {
    const socket = net.connect(url);
    socket.on('connect', () => {
        let parser = new Parser();
        const body = JSON.stringify({time: getTime(), url: url, method: method, message: message});
        socket.write(parser.makePacket(1, body));
        parser.on('packet', (packet) => {
            console.log("接收到响应包：", JSON.stringify(packet, null, 4));
            socket.end();
        });
        socket.on('data', (buf) => {
            parser.parse(buf);
        });
        socket.on('end', () => {
            parser = null;
        });
    });
}



module.exports = {
    CreateServer,
    Listen,
    httpRequest
};


