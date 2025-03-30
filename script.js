const farmCoords = [-23.358, 30.5014]; // Your fixed farm coordinates
let map = L.map('map').setView(farmCoords, 11);

let markers = [];
let routingControl = null;
let isSatellite = false;
let markerLayer = L.layerGroup().addTo(map);

// Base layers
const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
const satellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

streets.addTo(map);

// Admin toggle
document.getElementById('adminToggle').addEventListener('click', () => {
  const panel = document.getElementById('sidebar');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

// Satellite toggle
document.getElementById('satelliteToggle').addEventListener('click', () => {
  isSatellite = !isSatellite;
  if (isSatellite) {
    map.removeLayer(streets);
    satellite.addTo(map);
  } else {
    map.removeLayer(satellite);
    streets.addTo(map);
  }
});

// Add marker on map click
map.on('click', function (e) {
  const markerNumber = markers.length + 1;
  const marker = L.marker(e.latlng).bindTooltip(`Stop ${markerNumber}`, {
    permanent: true,
    direction: "top"
  }).addTo(markerLayer);
  markers.push(e.latlng);
});

// Calculate optimal route
document.getElementById('calculateRoute').addEventListener('click', () => {
  if (markers.length < 1) return;

  const waypoints = [L.latLng(farmCoords), ...markers];
  const rate = parseFloat(document.getElementById('rateInput').value || 5);

  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    router: new L.Routing.OSRMv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    createMarker: function () { return null; }
  }).addTo(map);

  routingControl.on('routesfound', function (e) {
    const route = e.routes[0];
    const km = (route.summary.totalDistance / 1000).toFixed(2);
    const cost = (rate * km).toFixed(2);

    document.getElementById('distanceOutput').innerText = `Distance: ${km} km`;
    document.getElementById('costOutput').innerText = `Estimated Cost: R${cost}`;
  });
});

// Clear everything
document.getElementById('clearRoute').addEventListener('click', () => {
  markerLayer.clearLayers();
  markers = [];
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  document.getElementById('distanceOutput').innerText = '';
  document.getElementById('costOutput').innerText = '';
});


