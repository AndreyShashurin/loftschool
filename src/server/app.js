const WebSocket = require('ws');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const http = require('http');
var url = require('url');
const server = http.createServer((req, res) => {
    //сделать проверку
    res.end(fs.readFileSync(`.${req.url}`));
});

const wss = new WebSocket.Server({ port: 9001, noServer: true});
const users = {};
const usersHistory = [];
const allMessage = [];
const handlers = {
    newUser: function (data, ws) {
        let active = true;
        for (const user in users){
            if (users[user].userData.fio == data.fio){
                active = false;
                ws.send(JSON.stringify({
                    payload: 'errorUser',
                    data: ''
                }))
            }
        }
        if (active) {
            ws.userData = data;
            users[uuidv1()] = ws;
            ws.userData.id = uuidv1();

            const allUsers = [];
            for (const id in users) {
                if (users.hasOwnProperty(id)) {
                    allUsers.push(users[id].userData);
                    users[id].send(JSON.stringify({
                        payload: 'newUser',
                        data: [ws.userData]
                    }))
                }
            }
            

            if (usersHistory.length) {
                for (let user of usersHistory) {
                    if (user.fio !== data.fio) {
                        console.log('Не Нашли', user)
                        /*ws.send(JSON.stringify({
                            payload: 'setSettings',
                            data: data
                        }))*/
                    } else {
                        delete user;
                        console.log('Нашли', user)
                    }
                }
            } else {
                usersHistory.push(ws.userData);
            }
            ws.send(JSON.stringify({
                payload: 'getUsers',
                data: {
                    users: allUsers,
                    usersHistory: usersHistory
                }
            }));

            ws.send(JSON.stringify({
                payload: 'accessAllowed',
                data: ws.userData
            })) 

            ws.send(JSON.stringify({
                payload: 'getMessage',
                data: allMessage
            }));
        }
    },
    newMessage: function (data, ws) {
        const nes = {user: ws.userData, messages: data};
        allMessage.push(nes);
        for (const id in users) {
            if (users.hasOwnProperty(id)) {
                users[id].send(JSON.stringify({
                    payload: 'newMessage',
                    data: nes
                }))
            }
        }
    },
    logOut: function (data, ws) {
        ws.userData = data;
        const allUsers = [];

        for (const id in users) {
            if (users.hasOwnProperty(id)) {
                if (users[id].userData.fio !== data.fio){
                    allUsers.push(users[id].userData);
                    users[id].send(JSON.stringify({
                        payload: 'logOutUser',
                        data: {
                            user: ws.userData,
                            allUsers: allUsers
                        }   
                    }))
                } else {
                    delete users[id];
                }
            }
        }
        ws.send(JSON.stringify({
            payload: 'getOutUser',
            data: data
        }));
    },
    uploadPhoto: function (data, ws) {
        ws.userData = data;

      /*  for (const id in users) {
            if (users.hasOwnProperty(id)) {
                users[id].send(JSON.stringify({
                    payload: 'updatePhoto',
                    data: ws.userData
                }))
            }
        }*/
        for (const id in usersHistory) {
            if (usersHistory[id].fio == data.fio) {
                usersHistory[id].img = data.img
            }
            ws.send(JSON.stringify({
                payload: 'setSettings',
                data: usersHistory
            }))
        }
    },
   /* upload: function (data, ws) {
        if (!fs.existsSync('./upload')) {
            fs.mkdirSync('./upload');
        }

        fs.appendFileSync(`./upload/${data.name}`, Buffer.from(data.arrayBuffer))

        ws.userData.img = `/upload/${data.name}`;

        for (const id in users) {
            if (users.hasOwnProperty(id)) {
                users[id].send(JSON.stringify({
                    payload: 'upload',
                    data: ws.userData
                }))
            }
        }
    }*/
}
wss.on('connection', function (ws) {
    ws.on('message', function (event) {
        const message = JSON.parse(event);
        handlers[message.payload](message.data, ws);
    })
    ws.on('error', function (event) {
        console.log('Отключено')
    })
});


server.listen(9000);