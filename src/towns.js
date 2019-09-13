/*
 Страница должна предварительно загрузить список городов из
 https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json
 и отсортировать в алфавитном порядке.

 При вводе в текстовое поле, под ним должен появляться список тех городов,
 в названии которых, хотя бы частично, есть введенное значение.
 Регистр символов учитываться не должен, то есть "Moscow" и "moscow" - одинаковые названия.

 Во время загрузки городов, на странице должна быть надпись "Загрузка..."
 После окончания загрузки городов, надпись исчезает и появляется текстовое поле.

 Разметку смотрите в файле towns-content.hbs

 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер

 *** Часть со звездочкой ***
 Если загрузка городов не удалась (например, отключился интернет или сервер вернул ошибку),
 то необходимо показать надпись "Не удалось загрузить города" и кнопку "Повторить".
 При клике на кнопку, процесс загрузки повторяется заново
 */

/*
 homeworkContainer - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то добавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
const homeworkContainer = document.querySelector('#homework-container');

/*
 Функция должна вернуть Promise, который должен быть разрешен с массивом городов в качестве значения

 Массив городов пожно получить отправив асинхронный запрос по адресу
 https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json
 */
function loadTowns() {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        
        xhr.open('GET', 'https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json', true);
        xhr.responseType = 'json';
        xhr.onload = () => {
            let result = xhr.response;

            result.sort((a, b) => {
                if (a.name > b.name) {
                  
                    return 1;
                } 
              
                return -1;
            });
            resolve(result);
        }
        xhr.onerror = () => {
            reject('Не удалось загрузить города');
        }
        xhr.send();
    })
}

/*
 Функция должна проверять встречается ли подстрока chunk в строке full
 Проверка должна происходить без учета регистра символов

 Пример:
   isMatching('Moscow', 'moscow') // true
   isMatching('Moscow', 'mosc') // true
   isMatching('Moscow', 'cow') // true
   isMatching('Moscow', 'SCO') // true
   isMatching('Moscow', 'Moscov') // false
 */
function isMatching(full, chunk) {
    return full.toUpperCase().includes(chunk.toUpperCase());
}

/* Блок с надписью "Загрузка" */
const loadingBlock = homeworkContainer.querySelector('#loading-block');
/* Блок с текстовым полем и результатом поиска */
const filterBlock = homeworkContainer.querySelector('#filter-block');
/* Текстовое поле для поиска по городам */
const filterInput = homeworkContainer.querySelector('#filter-input');
/* Блок с результатами поиска */
const filterResult = homeworkContainer.querySelector('#filter-result');

loadTowns()
    .then(sortTowns => {
        filterBlock.style.display = 'block';
        loadingBlock.style.display = 'none';
        filterInput.addEventListener('keyup', (event) => {
            let value = event.target.value;
            
            filterResult.innerHTML = '';

            for (let i = 0; i < sortTowns.length; i++) {
                if (isMatching(sortTowns[i].name, value)) {

                    let div = document.createElement('div');

                    div.innerText = sortTowns[i].name;
                    filterResult.appendChild(div)
                }
            }

            if (!value) {
                filterResult.innerHTML = '';
            }
        });        
    },
    error => {
        let errorBlock = document.createElement('div'),
            button = document.createElement('button');
            
        loadingBlock.style.display = 'none';

        button.classList.add('btn');
        button.innerText = 'Повторить';
        errorBlock.innerText = error;
        homeworkContainer.appendChild(errorBlock);
        homeworkContainer.appendChild(button);

        button.addEventListener('click', () => {
            loadTowns();
        });     

    })
export {
    loadTowns,
    isMatching
};
