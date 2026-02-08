const map = L.map('map').setView([lon, lat], 10);
const customIcon = L.icon({
  iconUrl: "https://api.geoapify.com/v2/icon?type=material&color=%23fe424d&size=64&apiKey=2c3cbeb5be704618b33a5c652f267f69",
  iconSize: [27, 40], // match the size parameter
  iconAnchor: [11, 34], // anchor point so the marker tip is at the location
  popupAnchor: [0, -34] // position of popup relative to icon
});

const marker = L.marker([lon, lat], { icon: customIcon }).addTo(map).bindPopup("<b>your destination</b>");

L.tileLayer('https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=2c3cbeb5be704618b33a5c652f267f69', {
  maxZoom: 20,
  id: 'osm-bright'
}).addTo(map);
