/*
 ДЗ 7 - Создать редактор cookie с возможностью фильтрации

 7.1: На странице должна быть таблица со списком имеющихся cookie. Таблица должна иметь следующие столбцы:
   - имя
   - значение
   - удалить (при нажатии на кнопку, выбранная cookie удаляется из браузера и таблицы)

 7.2: На странице должна быть форма для добавления новой cookie. Форма должна содержать следующие поля:
   - имя
   - значение
   - добавить (при нажатии на кнопку, в браузер и таблицу добавляется новая cookie с указанным именем и значением)

 Если добавляется cookie с именем уже существующей cookie, то ее значение в браузере и таблице должно быть обновлено

 7.3: На странице должно быть текстовое поле для фильтрации cookie
 В таблице должны быть только те cookie, в имени или значении которых, хотя бы частично, есть введенное значение
 Если в поле фильтра пусто, то должны выводиться все доступные cookie
 Если добавляемая cookie не соответсвует фильтру, то она должна быть добавлена только в браузер, но не в таблицу
 Если добавляется cookie, с именем уже существующей cookie и ее новое значение не соответствует фильтру,
 то ее значение должно быть обновлено в браузере, а из таблицы cookie должна быть удалена

 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер
 */

/*
 homeworkContainer - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то добавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
const homeworkContainer = document.querySelector('#homework-container');
// текстовое поле для фильтрации cookie
const filterNameInput = homeworkContainer.querySelector('#filter-name-input');
// текстовое поле с именем cookie
const addNameInput = homeworkContainer.querySelector('#add-name-input');
// текстовое поле со значением cookie
const addValueInput = homeworkContainer.querySelector('#add-value-input');
// кнопка "добавить cookie"
const addButton = homeworkContainer.querySelector('#add-button');
// таблица со списком cookie
const listTable = homeworkContainer.querySelector('#list-table tbody');

function setTbody(name, value) {
    let tr = document.createElement('tr');

    tr.innerHTML = '<td>'+name+'</td><td>'+value+'</td><td><button>Удалить</button></td>';

    return tr;
}

function getCookie() {
    return document.cookie.split('; ').reduce((prevValue, currentItem) => {
        let [name, value] = currentItem.split('=');

        prevValue[name] = value;

        return prevValue;
    }, {});
}  

function removeTable() {
    while (listTable.firstChild) {
        listTable.removeChild(listTable.firstChild);
    }
}

function setCookie() {
    let cookies = getCookie();

    removeTable();
    for (let index in cookies) {
        if (cookies.hasOwnProperty(index) && (index || cookies[index])) {
            listTable.appendChild(setTbody(index, cookies[index]));
        }
    }
}  

function isMatching(full, chunk) {
    
    return full.toUpperCase().includes(chunk.toUpperCase());
}

function replaceCookie() {
    let cookies = getCookie();
      
    if (filterNameInput.value) {
        removeTable();
        for (let index in cookies) {
            if (isMatching(index, filterNameInput.value) || isMatching(cookies[index], filterNameInput.value)) {
                listTable.appendChild(setTbody(index, cookies[index]));
            }
        }
    } else {
        setCookie();
    }
}  

filterNameInput.addEventListener('keyup', () => {
    replaceCookie();
});

addButton.addEventListener('click', () => {
    document.cookie = `${addNameInput.value} = ${addValueInput.value}`;

    replaceCookie();
});

listTable.addEventListener('click', (event) => {
    if (event.target.nodeName == 'BUTTON') {
        let tr = event.target.parentNode.parentNode;

        document.cookie = `${tr.firstChild.innerText} = ; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
        tr.remove();
    }
});

setCookie()
