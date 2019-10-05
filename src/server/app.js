const WebSocket = require('ws');
const uuidv1 = require('uuid/v1');

const wss = new WebSocket.Server({ port: 9000 });
const users = {};
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

            ws.send(JSON.stringify({
                payload: 'getUsers',
                data: allUsers
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
    }
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
