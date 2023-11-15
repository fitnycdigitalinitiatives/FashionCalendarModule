$(document).ready(function () {
    const url = "/modules/FashionCalendarModule/asset/geojson/fashion-archives.json?_=" + (new Date()).getTime();
    fetch(url)
        .then((response) => response.json())
        .then((geoJSON) => {
            let map = L.map('map').setView([40.7621, -73.9280], 12);;
            L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZml0ZGlnaXRhbGluaXRpYXRpdmVzIiwiYSI6ImNqZ3FxaWI0YTBoOXYyenA2ZnVyYWdsenQifQ.ckTVKSAZ8ZWPAefkd7SOaA', {
                id: 'mapbox/light-v10',
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>'
            }).addTo(map);
            const geoJSONLayer = L.geoJSON(geoJSON, {
                onEachFeature: onEachFeature
            });
            L.markerClusterGroup.layerSupport({
                maxClusterRadius: 5
            }).addTo(map).checkIn(geoJSONLayer);
            geoJSONLayer.addTo(map);
            map.fitBounds(geoJSONLayer.getBounds());
        });
    let singleMap = null;
    const singleMapModal = document.getElementById('singleMapModal');
    if (singleMapModal) {
        singleMapModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const longitude = button.getAttribute('data-longitude');
            const latitude = button.getAttribute('data-latitude');
            if (singleMap) {
                singleMap.setView([latitude, longitude], 12);
                if (singleMarker) {
                    singleMap.removeLayer(singleMarker);
                }
            }
        });
        singleMapModal.addEventListener('shown.bs.modal', event => {
            const button = event.relatedTarget;
            const longitude = button.getAttribute('data-longitude');
            const latitude = button.getAttribute('data-latitude');
            const formattedAddress = decodeURIComponent(button.getAttribute('data-formattedAddress'));
            if (!singleMap) {
                singleMap = L.map('single-map').setView([latitude, longitude], 12);
                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZml0ZGlnaXRhbGluaXRpYXRpdmVzIiwiYSI6ImNqZ3FxaWI0YTBoOXYyenA2ZnVyYWdsenQifQ.ckTVKSAZ8ZWPAefkd7SOaA', {
                    id: 'mapbox/light-v10',
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>'
                }).addTo(singleMap);
            }
            singleMarker = L.marker([latitude, longitude]);
            singleMap.addLayer(singleMarker);
            singleMarker.bindPopup(formattedAddress).openPopup();
        });
    }
});

function onEachFeature(feature, layer) {
    let popup_content = '';
    if (feature.properties.name) {
        popup_content += `<h1>${feature.properties.name}</h1>`;
    }
    if (feature.properties.address) {
        popup_content += `<p>${feature.properties.address}</p>`;
    }
    if (feature.properties.website || feature.properties.video) {
        popup_content += `<ul class="list-inline">`;
        if (feature.properties.website) {
            popup_content += `<li class="list-inline-item">
            <a class="link-dark" target="_blank" href="${feature.properties.website}">
            <i class="fas fa-home" aria-hidden="true" title="Homepage"></i>
            <span class="sr-only">Homepage</span>
            </a>
            </li>`;
        }
        if (feature.properties.video) {
            popup_content += `<li class="list-inline-item">
            <a class="link-dark" target="_blank" href="${feature.properties.video}">
            <i class="fas fa-video" aria-hidden="true" title="Video"></i>
            <span class="sr-only">Video</span>
            </a>
            </li>`;
        }
        popup_content += `</ul>`;
    }
    const popup = L.popup({
        maxWidth: 400
    }).setContent(popup_content);
    layer.bindPopup(popup);
}