const map = L.map('map').setView([48.1500327, 11.5753989], 10);
L.tileLayer('https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=2c3cbeb5be704618b33a5c652f267f69', {
  maxZoom: 20,
  id: 'osm-bright'
}).addTo(map);
  
