let arrayPlacemark = [],
    arrayPlacemarksLocalStorage = [],
    myPlacemark,
    placemarks = [],
    coords,
    myGeocoder;
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

// Загрузим тестовые данные в localStorage если их нет
if (!localStorage.getItem('arrayPlacemarks')) {
    localStorage.setItem('arrayPlacemarks', JSON.stringify(arrayPlacemark));
}

const init = () => {
    let myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 10,
        controls: [ 
            'zoomControl'
        ]
    });

    // Получим данные из localStorage
    arrayPlacemarksLocalStorage = JSON.parse(localStorage.getItem('arrayPlacemarks'))

    // Находим последний элемент
    const lastId = () => {
        let lastId = arrayPlacemarksLocalStorage.length > 0 ? arrayPlacemarksLocalStorage[arrayPlacemarksLocalStorage.length - 1].id : 0;  
        return lastId;
    }

    const MyBalloonLayout = () => {
        const balloonLayout = ymaps.templateLayoutFactory.createClass(
            `<div class="popover top">
            <a class="close" href="#">&times;</a>
            <div class="arrow"></div>
            <div class="popover-inner">
            $[[options.contentLayout]]
            </div>
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
                let content = this._$element[0].querySelector('.popover__comment');
    
                this._$element.css({
                    left: -(this._$element[0].offsetWidth / 2),
                    top: -(this._$element[0].offsetHeight + this._$element.find('.arrow')[0].offsetHeight)
                });  
    
                for (let mark of arrayPlacemarksLocalStorage) {
                    if(mark.header == this._$element[0].querySelector('h3').innerText) {
                        content.innerHTML += markComments(mark);
                        this._$element[0].querySelector('.result').style.display = 'none';
                    }
                }
            },
            onCloseClick: function (e) {
                e.preventDefault();
                this.events.fire('userclose');
            },      
            addBtn: function(event) {
                event.preventDefault();
                let index, content;
                const searchForm = document.forms["comment"],
                    lat = Number(event.target.getAttribute('data-lat')),
                    lng = Number(event.target.getAttribute('data-lng')),
                    header = searchForm.parentNode.parentNode.querySelector('h3').innerText;
                
                content = searchForm.parentNode.parentNode.querySelector('.popover__comment');
                searchForm.parentNode.parentNode.querySelector('.result').style.display = 'none';
                content = searchForm.parentNode.parentNode.querySelector('.popover__comment'); 
    
                if (lat || lng) {
                    coords = [lat, lng];
    
                    updateStorage(lastId(), searchForm, coords, header);        
                    index = arrayPlacemarksLocalStorage.map(e => e.id).indexOf(lastId());  
                    content.innerHTML += markComments(arrayPlacemarksLocalStorage[index]); 
                } else {
                    index = arrayPlacemarksLocalStorage.map(e => e.id).indexOf(Number(event.target.getAttribute('data-id')));      
                    coords = [arrayPlacemarksLocalStorage[index].lat, arrayPlacemarksLocalStorage[index].lng];
    
                    updateStorage(index, searchForm, coords, header);
                    content.innerHTML += markComments(arrayPlacemarksLocalStorage[index]);
                }        
                myPlacemark = createPlacemark(coords, header, arrayPlacemarksLocalStorage[index], searchForm);
                clusterer.add(myPlacemark);
                myMap.geoObjects.add(clusterer);  
            }
        })
         
        return balloonLayout;
    }

    // Создание вложенного макета содержимого балуна.
    const MyBalloonContentLayout = () => {
        const balloonContentLayout = ymaps.templateLayoutFactory.createClass(
            `<div class="popover-title">
                <img src="/img/location.png">
                <h3>
                    {% if options.header %}
                    $[options.header]
                    {% else  %}
                    $[properties.header]
                    {% endif %}
                </h3>
            </div>
            <div class="popover-content">
                <div class="popover__comment">
                    {% if properties.comment %}
                    $[properties.comment]
                    <hr>
                    {% else  %}
                    <span class="result">Отзывов пока нет...</span>
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
                    <div>
                        <button type="submit" id="button" class="btn pull-right"data-lat="$[options.lat]" data-lng="$[options.lng]" data-id="$[properties.id]">Добавить</button>
                    </div>
                </form>`
        );

        return balloonContentLayout;
    }

    // Макет для кластера
    const customItemContentLayout = () => {
        const itemContentLayout = ymaps.templateLayoutFactory.createClass(
            `<h4 class=ballon_header>$[properties.name]</h4>
            <div class=ballon_place data-id="$[properties.id]">$[properties.header]</div>
            <div class=ballon_comment>$[properties.balloonComment]</div>
            <div class=ballon_footer>$[properties.balloonContentFooter]</div>`, {

            build: function () {
                this.constructor.superclass.build.call(this);
                let ballonPlace = document.querySelector('.ballon_place');
                ballonPlace.addEventListener("click", this.ballonPlace);
                
            },
    
            onCloseClick: function (e) {
                e.preventDefault();
                this.events.fire('userclose');
            },            
            
            ballonPlace: function(event) {
                let id = event.target.getAttribute('data-id'); 

                for (let mark of arrayPlacemarksLocalStorage) {
                    if(mark.id == id) {
                        myMap.balloon.open([mark.lat, mark.lng], { }, {
                            header: mark.header,
                            id: mark.id,
                            lat: mark.lat,
                            lng: mark.lng,
                            layout: MyBalloonLayout(),
                            contentLayout: MyBalloonContentLayout()
                        });  
                    }
                }
            }     
        })

        return itemContentLayout;
    }

    const updateStorage = (option, searchForm, coords, header) => {
        arrayPlacemarksLocalStorage.push({
            header: header,
            name: searchForm.querySelector('#name-input').value,
            id: lastId() + 1,
            lat: coords[0],
            lng: coords[1],     
            place: searchForm.querySelector('#place-input').value,
            comment: searchForm.querySelector('#comment-input').value,
            date: formatDate(date)
        });

        localStorage.setItem('arrayPlacemarks', JSON.stringify(arrayPlacemarksLocalStorage));
    }

    // Создание метки.
    const createPlacemark = (coords, header, index, searchForm) => {
        const nameInput = searchForm.querySelector('#name-input'),
              placeInput = searchForm.querySelector('#place-input'),
              coomentInput = searchForm.querySelector('#comment-input');

        placemarks = new ymaps.Placemark(coords, {
            id: index.id,
            balloonHeader: header,
            header: header,
            name: nameInput.value,
            balloonComment: coomentInput.value,
            balloonContentFooter: formatDate(date)
        }, { 
            balloonLayout: MyBalloonLayout(),
            balloonContentLayout: MyBalloonContentLayout()
        });
        nameInput.value = '';
        placeInput.value = '';
        coomentInput.value = '';

        return placemarks;
    }

    // Вывод коментариев метки
    const markComments = (mark) => {
        if(mark){
            return `<div class="comment__box">
                <div class="comment__title"><span><b>${mark.name}</b></span><span class="place">${mark.place}</span><span class="date">${mark.date}</span></div>
                <div class="comment__value">${mark.comment}</div>
                </div>`;
        }
    }    

    let clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout(),
        maxZoom: 11
    });    

    // Выведем их на карте
    for (let mark of arrayPlacemarksLocalStorage) {
        placemarks.push(new ymaps.Placemark([mark.lat, mark.lng], {
            id: mark.id,
            header: mark.header,
            coords: [mark.lat, mark.lng],
            name: mark.name,
            balloonComment: mark.comment,
            balloonContentFooter: mark.date
        }, {
            balloonLayout: MyBalloonLayout(),
            balloonContentLayout: MyBalloonContentLayout(),
            balloonCloseButton: true,
            selectOnClick: false,
            hideIconOnBalloonOpen: false
        }))     
        
        clusterer.add(placemarks);
        myMap.geoObjects.add(clusterer);     
    }

    // Слушаем клик на карте.
    myMap.events.add('click', function (e) {
        coords = e.get('coords'); 
        
        getAddress(coords).then(result => { 
            myMap.balloon.open(coords, { }, {
                coords: coords,
                header: result.geoObjects.get(0).getAddressLine(),
                id: lastId(),
                lat: coords[0],
                lng: coords[1],
                layout: MyBalloonLayout(),
                contentLayout: MyBalloonContentLayout()
            });       
        })
    });

    const getAddress = (coords) => {
        myGeocoder = ymaps.geocode(coords);
        
        return myGeocoder;
    }
}
ymaps.ready(init);