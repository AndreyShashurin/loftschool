import usersNbs from './view/users.hbs';
import messageNbs from './view/message.hbs';
import userInfoHBS from './view/userInfo.hbs';
import { rejects } from 'assert';

const ws = new WebSocket('ws://localhost:9001');
const storageName = 'user';

// User form
const loginForm = document.getElementById('loginForm'),
    fio = loginForm.querySelector('#fio'),
    nik = loginForm.querySelector('#nik'),
    loginFormButton = loginForm.querySelector('#login'),
    sendButton = document.querySelector('.sendMessage'),
    messageText = document.querySelector('.messageText'),
    username = document.querySelector('.usernblock'),
    userImg = username.querySelector('img'),
    userForm = username.querySelector('.userInfo');

ws.onopen = function (event) {
  console.log(event)
}

ws.onerror = function (event) {
  console.log(event)
}

ws.onmessage = function (message) {
  const messageData = JSON.parse(message.data);
  handlers[messageData.payload](messageData.data)
}

function update(value){
  let prevData = JSON.parse(sessionStorage.getItem(storageName));
  Object.keys(value).forEach(function(val, key){
      prevData[val] = value[val];
  })
  sessionStorage.setItem(storageName, JSON.stringify(prevData));
}

const handlers = {
    getUsers: function (data) {
      console.log('getUsers', data)
      document.querySelector('.useractive').innerHTML = usersNbs({ users: data.users });
    },
    newUser(data) {
        document.querySelector('.useractive').innerHTML += usersNbs({ users: data });
    },
    getMessage(data) {
        if (data.length != 0) {
          document.querySelector('.messsage').innerHTML = messageNbs({ messages: data })
          document.querySelector('.messsage').scrollTop = document.querySelector('.messsage').scrollHeight;
        }
    },
    newMessage(data) {
        document.querySelector('.messsage').innerHTML += messageNbs({ message: data.messages })
        document.querySelector('.messsage').scrollTop = document.querySelector('.messsage').scrollHeight;
    },
    getOutUser(data){
        sessionStorage.removeItem(storageName);

        document.location.reload(true);
    },
    logOutUser(data) {
      console.log(data)
        const details = data.allUsers.filter((e) => { return e.id !== data.user.id })
        document.querySelector('.useractive').innerHTML = usersNbs({ users: details })
    },
    errorUser(data) {
      console.log(data)
      confirm('Пользователь с таким именем уже есть');
    },
    accessAllowed(data) {   
        sessionStorage.setItem(storageName, '{}');
        update({fio: data.fio})
        update({nik: data.nik})

        loginFormFn();
        storageFunc();  
    },
    uploadPhoto(data) {
      console.log("uploadPhoto",data)          
      const attribute = document.querySelectorAll(`[data-name=${data.fio}]`);

      for (let name of attribute) {
        name.querySelector('img').src = data.img;
      }
    },
    setSettings(data) {
      console.log("setSettings", data)    
      const users = document.querySelectorAll(`[data-name="${data.fio}"]`);
      
      for (const user of users) {
          user.querySelector('img').src = `http://localhost:9000${data.img}`;
      }     
    },
    upload: function (data) {
        console.log('upload', data)
        const users = document.querySelectorAll(`[data-name="${data.fio}"]`);

        for (const user of users) {
            user.querySelector('img').src = `http://localhost:9000${data.img}`;
        }
    }
}

let unbind = true;
const storageFunc = () => {
  const storage = JSON.parse(sessionStorage.getItem(storageName));
  userForm.innerHTML = userInfoHBS({name: storage ? storage.fio :''});

  if(storage){
    if (storage.img) {
      userImg.src = storage.img;
    }
    loginFormFn();

    const dataAttribute = {
      toggle:'modal',
      target:'#exampleModal'
    }
    
    const setAttribite = (data, form) => {
      for(let attr in data) {
        form.setAttribute(`data-${attr}`, data[attr]);
      }
      return form;
    }

    setAttribite(dataAttribute, userImg);

    const logout = userForm.querySelector('.logout');
    logout.addEventListener('click', () => {
      unbind = false;
      storageFunc();
      const logOut = {
        fio: storage.fio,
        nik: storage.nik
      }
      sendSocket('logOut', logOut);
     return
    })
    
    sendButton.onclick = () => {
      sendMessage();
    }
   
    const sendMessage = () => {           
      const date = new Date();

      const formatDate = (date) => {
      
          let dd = date.getDate();
          let mm = date.getMonth() + 1;
          let yyyy = date.getFullYear();
      
          if (dd < 10) {
              dd = '0' + dd;
          }
          if (mm < 10) {
              mm = '0' + mm;
          }
      
          return `${dd}.${mm}.${yyyy}`;
      };
      
      const newMessage = {
        text: messageText.value,
        img: JSON.parse(sessionStorage.getItem(storageName)).img,
        fio: storage.fio,
        date: formatDate(date),
        nik: storage.nik
      }
      sendSocket('newMessage', newMessage);
      messageText.value = '';
    }
  
    // Загружаем фотографию
    const fileselect = document.getElementById("fileselect"),
    filedrag = document.getElementById("filedrag"),
    fileimg = document.getElementById("fileimg")
    
    fileselect.addEventListener("change", FileSelectHandler, false);
    filedrag.addEventListener("dragover", FileDragHover, false);
    filedrag.addEventListener("dragleave", FileDragHover, false);
    filedrag.addEventListener("drop", FileSelectHandler, false);
    filedrag.style.display = "block";
    
    function FileDragHover(e){
      e.stopPropagation();
      e.preventDefault();
    }
    
    const reader = new FileReader();
    
    function FileSelectHandler(e){
      FileDragHover(e);
    
      const file = e.dataTransfer.files[0];
      reader.readAsDataURL(file);
      uploadfile(file)
    }
    
    const uploadfile = (file) => {
      reader.onload = function () {
        fileimg.src = reader.result;
        filedrag.style.display = 'none';
      }
  
      const fileupload = document.querySelector('.fileupload');
      fileupload.addEventListener('click', (e) => { 
          update({img: reader.result})
          userImg.src = reader.result;
          const storageValue = {
            fio: fio.value,
            nik: nik.value,
            img: reader.result
          }

          sendSocket('uploadPhoto', storageValue);
         /* ws.send(JSON.stringify({
            payload: 'upload',
            data: {
                name: file.name,
                arrayBuffer: Array.from(new Uint8Array(file.name))
            }
        }))*/
      })
    }

  }
  
  return;

}


const loginFormFn = () => {
  loginForm.remove()
}

if (!storageFunc()) {
  loginFormButton.addEventListener('click', () => {
    const storageValue = {
         fio: fio.value,
         nik: nik.value
    }
    sendSocket('newUser', storageValue);
  })
}  

const sendSocket = (payload, data) => {
  ws.send(JSON.stringify({
    payload: payload,
    data: data
  }))   
}
/*

if (unbind)  {
  window.onbeforeunload = function() {
    const logOut = {
      fio: JSON.parse(sessionStorage.getItem(storageName)).fio,
      nik: JSON.parse(sessionStorage.getItem(storageName)).nik,
    }
    sendSocket('logOut', logOut);
  };
}*/