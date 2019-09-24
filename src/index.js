import balloon from './view/baloon.hbs';
import commentList from './view/commentList.hbs';

let arrayPlacemark = [],
    arrayPlacemarksLocalStorage = [],
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

    // Макет для кластера
    const customItemContentLayout = () => {
        const itemContentLayout = ymaps.templateLayoutFactory.createClass(
            `<h4 class=ballon_header>$[properties.name]</h4>
            <div class=ballon_place data-coords="$[properties.coords]">$[properties.header]</div>
            <div class=ballon_comment>$[properties.comment]</div>
            <div class=ballon_footer>$[properties.date]</div>`, {

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
                let coords = event.target.getAttribute('data-coords'); 
                const datMark = {
                    coords: '',
                    header: '',
                    comments: []
                }
                for (let mark of arrayPlacemarksLocalStorage) {
                    if(mark.coords == coords) { 
                        datMark.coords = mark.coords;
                        datMark.header = mark.header;
                        datMark.comments.push(mark);
                    }
                }
                openBaloon(datMark)
            }     
        })

        return itemContentLayout;
    }

    const openBaloon = (data) => {
        myMap.balloon.open(data.coords, data, {
            layout: MyBalloonLayout(data),
            contentLayout: MyBalloonContentLayout(data)
        }); 
    };

    let clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout(),
        maxZoom: 11
    });    

    // Получим данные из localStorage
    arrayPlacemarksLocalStorage = JSON.parse(localStorage.getItem('arrayPlacemarks'))

    // Находим последний элемент
    const lastId = () => {
        let lastId = arrayPlacemarksLocalStorage.length > 0 ? arrayPlacemarksLocalStorage[arrayPlacemarksLocalStorage.length - 1].id : 0;  
        return lastId;
    }

    const MyBalloonLayout = (mark) => {
        const balloonLayout = ymaps.templateLayoutFactory.createClass(
            `$[[options.contentLayout]]`, {
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
                if (mark.comments) {
                    content.innerHTML = commentList({comments:mark.comments});
                } else if (mark.date) {
                    content.innerHTML = commentList({comment:mark});
                }
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

                const coords = myMap.balloon.getData(),
                searchForm = document.forms["comment"];
                let content = searchForm.parentNode.parentNode.querySelector('.popover__comment');

                const data = {
                    id: lastId() + 1,
                    header: mark.header,
                    name: searchForm.querySelector('#name-input').value,
                    place: searchForm.querySelector('#place-input').value,
                    comment: searchForm.querySelector('#comment-input').value,
                    date: formatDate(date),
                    coords: coords.coords || coords.geometry.getCoordinates()
                };
                createteStorage(data);
                
                if(data) content.innerHTML = commentList({comment:data});

                placemarks = createPlacemark(data);
                clusterer.add(placemarks);
                myMap.geoObjects.add(clusterer);
            }
        })
         
        return balloonLayout;
    }

    // Создание вложенного макета содержимого балуна.
    const MyBalloonContentLayout = (mark) => {
        const balloonContentLayout = ymaps.templateLayoutFactory.createClass(balloon(mark));

        return balloonContentLayout;
    }

    const createteStorage = (data) => {
        arrayPlacemarksLocalStorage.push(data);
        localStorage.setItem('arrayPlacemarks', JSON.stringify(arrayPlacemarksLocalStorage));
    }

    // Создание метки.
    const createPlacemark = (data) => {
        placemarks = new ymaps.Placemark(data.coords, data, { 
            balloonLayout: MyBalloonLayout(data),
            balloonContentLayout: MyBalloonContentLayout(data)
        });
        
        return placemarks;
    }

    // Выведем их на карте
    const initMark = () => {
        for (let mark of arrayPlacemarksLocalStorage) {
            placemarks.push(new ymaps.Placemark(mark.coords, mark, {
                balloonLayout: MyBalloonLayout(mark),
                balloonContentLayout: MyBalloonContentLayout(mark),
                balloonCloseButton: true,
                selectOnClick: false,
                hideIconOnBalloonOpen: false
            }))     
            clusterer.add(placemarks);
            myMap.geoObjects.add(clusterer);
        }
    }   
 
    // Слушаем клик на карте.
    myMap.events.add('click', function (e) {
        coords = e.get('coords'); 
        getAddress(coords).then(result => { 
            let data = {
                coords: [coords[0], coords[1]],
                header: result.geoObjects.get(0).getAddressLine(),
                id: lastId() + 1
            };
            myMap.balloon.open(coords, data, {
                layout: MyBalloonLayout(data),
                contentLayout: MyBalloonContentLayout(data)
            });      
        })
    });

    const getAddress = (coords) => {
        myGeocoder = ymaps.geocode(coords);
        
        return myGeocoder;
    }
    
    initMark()
}

ymaps.ready(init);