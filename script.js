const apiKey = '5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf';
const farmCoords = [-23.35906, 30.50142];

let map = L.map('map').setView(farmCoords, 11);
let stops = [];
let stopMarkers = [];
let routeLayer = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let satellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  subdomains: ['mt0','mt1','mt2','mt3']
});

L.control.layers({
  'Normal': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  'Satellite': satellite
}).addTo(map);

// Fixed marker at the farm
L.marker(farmCoords, {
  icon: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })
}).addTo(map).bindPopup('Tintswalo Poultry Farm').openPopup();

// Admin Panel Toggle
document.getElementById('adminToggle').onclick = () => {
  const panel = document.getElementById('adminPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
};

// Click to add delivery stop
map.on('click', e => {
  const coords = [e.latlng.lat, e.latlng.lng];
  stops.push(coords);

  let marker = L.marker(coords, {
    icon: L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }).addTo(map).bindPopup(`Stop ${stops.length}`).openPopup();

  stopMarkers.push(marker);
});

function calculateRoute() {
  if (stops.length < 1) {
    alert("Add at least one stop.");
    return;
  }

  let coordinates = [farmCoords, ...stops];
  let locationsForORS = coordinates.map(c => [c[1], c[0]]); // [lng, lat]

  fetch('https://api.openrouteservice.org/v2/optimization', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jobs: stops.map((stop, i) => ({
        id: i + 1,
        location: [stop[1], stop[0]]
      })),
      vehicles: [{
        id: 1,
        start: [farmCoords[1], farmCoords[0]],
        end: null
      }]
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.routes || !data.routes[0]) {
      throw new Error("Failed to optimize.");
    }

    const route = data.routes[0].steps.map(s => [s.location[1], s.location[0]]);
    if (routeLayer) map.removeLayer(routeLayer);

    routeLayer = L.polyline(route, { color: 'blue', weight: 5 }).addTo(map);
    
    // Calculate distance & cost
    const distanceKm = data.routes[0].distance / 1000;
    const cost = distanceKm * parseFloat(document.getElementById('rateInput').value || 0);
    document.getElementById('results').innerHTML = `
      📏 Distance: ${distanceKm.toFixed(2)} km<br>
      💰 Estimated Cost: R${cost.toFixed(2)}
    `;
  })
  .catch(err => {
    console.error(err);
    alert("Failed to calculate route.");
  });
}

function clearRoute() {
  if (routeLayer) map.removeLayer(routeLayer);
  stopMarkers.forEach(m => map.removeLayer(m));
  stops = [];
  stopMarkers = [];
  document.getElementById('results').innerHTML = '';
}





