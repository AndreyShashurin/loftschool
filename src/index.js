let arrayPlacemark = [
    {
        name: 'Точка 1',
        id: 1,
        lat: 55.847,
        lng: 37.6,
        comments: [
            {
                name: 'svetlana',
                place: 'Шоколадница',
                comment: 'comment1',
                date: '16.9.2019'
            },
            {
                name: 'Сергей Мелюков',
                place: 'Шоколадница',
                comment: 'comment2',
                date: '16.9.2019'
            }
        ]
    },
    {
        name: 'Точка 2',
        id: 2,
        lat: 55.547,
        lng: 37.2,
        comments: [
            {
                name: '1',
                comment: 'comment1',
                date: '16.9.2019'
            },
            {
                name: '2',
                comment: 'comment2',
                date: '16.9.2019'
            },
            {
                name: '3',
                comment: 'comment3',
                date: '16.9.2019'
            }
        ]
    }
];

// Загрузим тестовые данные в localStorage если их нет
if(!localStorage.getItem('arrayPlacemarks')){
    localStorage.setItem('arrayPlacemarks', JSON.stringify(arrayPlacemark));
}

function init() {
    let arrayPlacemarksLocalStorage = [];
    var myPlacemark;
    var myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 12,
        controls: [ 
            'zoomControl'
        ]
    });

    // Получим данные из localStorage
    arrayPlacemarksLocalStorage = JSON.parse(localStorage.getItem('arrayPlacemarks'))
    
    let MyBalloonLayout = ymaps.templateLayoutFactory.createClass(
        `<div class="popover top">
        <a class="close" href="#">&times;</a>
        <div class="arrow"></div>
        <div class="popover-inner">
        $[[options.contentLayout]]
        </div>
        <button type="submit" id="button" class="btn pull-right" data-option="$[options.id]" data-lat="$[options.lat]" data-lng="$[options.lng]" data-id="$[properties.id]">Добавить</button></div>
        </div>`, {

        build: function () {
            this.constructor.superclass.build.call(this);
            let propertiesClick = document.getElementById('button');
            propertiesClick.addEventListener("click", this.addBtn);
            this._$element = $('.popover', this.getParentElement());

            this.applyElementOffset();
            
            this._$element.find('.close')
                .on('click', $.proxy(this.onCloseClick, this));
        },

        clear: function () {
            this._$element.find('.close')
                .off('click');

            this.constructor.superclass.clear.call(this);
        },
   
        applyElementOffset: function () {
            this._$element.css({
                left: -(this._$element[0].offsetWidth / 2),
                top: -(this._$element[0].offsetHeight + this._$element.find('.arrow')[0].offsetHeight)
            });
        },

        onCloseClick: function (e) {
            e.preventDefault();
            this.events.fire('userclose');
        },            
        
        addBtn: function(event) {
            event.preventDefault();
            const searchForm = document.forms["comment"];
            const lat = Number(event.target.getAttribute('data-lat'));
            const lng = Number(event.target.getAttribute('data-lng'));
            const option = Number(event.target.getAttribute('data-option'));

            if (lat || lng) {
                coords = [lat, lng];
                myPlacemark = createPlacemark(coords);
                myMap.geoObjects.add(myPlacemark);

                let index = arrayPlacemarksLocalStorage.map(e => e.id).indexOf(option);
                updateStorage(index, searchForm);
                let content = this.parentNode.querySelector('.popover__comment');
                content.innerHTML = markComments(arrayPlacemarksLocalStorage[index].comments);
            } else {
                let index = arrayPlacemarksLocalStorage.map(e => e.id).indexOf(Number(event.target.getAttribute('data-id')));
                updateStorage(index, searchForm);
                let content = this.parentNode.querySelector('.popover__comment');
                content.innerHTML = markComments(arrayPlacemarksLocalStorage[index].comments);
            }                
            
        }
      }),

    // Создание вложенного макета содержимого балуна.
    MyBalloonContentLayout = ymaps.templateLayoutFactory.createClass(
        `<div class="popover-title">
            <img src="/img/location.png">
            <h3>
                {% if options.header %}
                $[options.header]
                {% else  %}
                $[properties.balloonHeader]
                {% endif %}
            </h3>
        </div>
        <div class="popover-content">
            <div class="popover__comment">
            {% if properties.comment %}
            $[properties.comment]
            <hr>
            {% else  %}
            Отзывов пока нет...
            {% endif %}
            </div>
            <form name="comment">
                <label>Ваш отзыв</label>
                <div>
                <input type="text" class="form-control input" id="name-input" placeholder="Ваше имя">
                </div>
                <div>
                <input type="text" class="form-control input" id="place-input" placeholder="Укажите место">
                </div>
                <div>
                <textarea class="form-control textarea" id="comment-input" placeholder="Поделитесь впечатлениями"></textarea>
                </div>
            </form>`
    );

    function updateStorage(index, searchForm) {
        const nameInput = searchForm.querySelector('#name-input');
        const placeInput = searchForm.querySelector('#place-input')
        const coomentInput = searchForm.querySelector('#comment-input');
        const date = new Date();
        arrayPlacemarksLocalStorage[index].comments.push({
            name: nameInput.value,
            place: placeInput.value,
            comment: coomentInput.value,
            date: `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
        })
        localStorage.setItem('arrayPlacemarks', JSON.stringify(arrayPlacemarksLocalStorage));
        nameInput.value = '';
        placeInput.value = '';
        coomentInput.value = '';
    }

    // Создание метки.
    function createPlacemark(coords) {
        return new ymaps.Placemark(coords, {
            balloonHeader: 'Заголовок балуна',
            balloonContent: 'Контент балуна',
            comments:''
        }, { 
            balloonLayout: MyBalloonLayout,
            balloonContentLayout: MyBalloonContentLayout,
            iconLayout: 'default#image',
            iconImageHref: 'img/point.png',
            iconImageSize: [20, 30],
        });
    }

    // Вывод коментариев метки
    function markComments(comments) {
        let val = '';
        for (let comment of comments){
            val = val + `<div class="comment__box">
            <div class="comment__title"><span><b>${comment.name}</b></span><span class="place">${comment.place}</span><span class="date">${comment.date}</span></div>
            <div class="comment__value">${comment.comment}</div>
            </div>`;
        }    
        return val;
    }
    
    for (let mark of arrayPlacemarksLocalStorage){
        myPlacemark = new ymaps.Placemark([mark.lat, mark.lng], {
              id: mark.id,
              balloonHeader: mark.name,
              comment: markComments(mark.comments)
        }, {
            balloonLayout: MyBalloonLayout,
            balloonContentLayout: MyBalloonContentLayout,
            balloonCloseButton: true,
            selectOnClick: false,
            hideIconOnBalloonOpen: false,
            iconLayout: 'default#image',
            iconImageHref: 'img/point.png',
            iconImageSize: [20, 30]
        }); 
        myMap.geoObjects.add(myPlacemark);
    }

    // Слушаем клик на карте.
    myMap.events.add('click', function (e) {
        var coords = e.get('coords');

        getAddressBaloon(coords).then(result => { 
            myMap.balloon.open(coords, { }, {
                coords: coords,
                header: result,
                id: arrayPlacemarksLocalStorage[arrayPlacemarksLocalStorage.length - 1].id +1,
                lat: coords[0],
                lng: coords[1],
                layout:MyBalloonLayout,
                contentLayout: MyBalloonContentLayout
            });       
             // Добавим новую пустую позицию в localStorage
            arrayPlacemarksLocalStorage.push({
                id: arrayPlacemarksLocalStorage[arrayPlacemarksLocalStorage.length - 1].id + 1,
                name: result,
                lat: coords[0],
                lng: coords[1],
                comments: []
            })
            localStorage.setItem('arrayPlacemarks', JSON.stringify(arrayPlacemarksLocalStorage));
        })
    });

    function getAddressBaloon(coords) {
        return ymaps.geocode(coords).then(function (res) {
            var firstGeoObject = res.geoObjects.get(0);
            return firstGeoObject.getAddressLine()
        });
    }

}
ymaps.ready(init);