const map = L.map('map').setView([-23.3591, 30.5014], 10); // Farm location

// Tile Layers
const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenTopoMap'
});

L.control.layers({ "Streets": streets, "Satellite": satellite }).addTo(map);

// Add farm marker
const farmCoords = [-23.3591, 30.5014];
L.marker(farmCoords, { icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [25, 41], iconAnchor: [12, 41] }) })
  .addTo(map)
  .bindPopup("Tintswalo's Poultry Farm")
  .openPopup();

let deliveryPoints = [];
let markers = [];
let routeLayer;

// Admin toggle
const adminToggle = document.getElementById('admin-toggle');
const adminPanel = document.getElementById('admin-panel');
adminToggle.addEventListener('click', () => {
  adminPanel.classList.toggle('hidden');
});

// Add delivery point by clicking map
map.on('click', function (e) {
  const marker = L.marker(e.latlng, {
    icon: L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    })
  }).addTo(map);
  markers.push(marker);
  deliveryPoints.push([e.latlng.lng, e.latlng.lat]); // ORS format
});

// Clear Route button
document.getElementById('clear-route').addEventListener('click', () => {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  deliveryPoints = [];
  if (routeLayer) map.removeLayer(routeLayer);
  document.getElementById('cost-display').textContent = 'Total Cost: R0.00';
});

// Calculate Optimal Route
document.getElementById('calculate-route').addEventListener('click', async () => {
  if (deliveryPoints.length < 1) {
    alert("Add at least one delivery point.");
    return;
  }

  const ORS_API_KEY = '5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf';

  const jobs = deliveryPoints.map((coord, i) => ({
    id: i + 1,
    location: coord
  }));

  const vehicles = [{
    id: 1,
    start: [farmCoords[1], farmCoords[0]], // Note: Reversed to [lon, lat]
    end: [farmCoords[1], farmCoords[0]]
  }];

  const body = {
    jobs,
    vehicles
  };

  const res = await fetch('https://api.openrouteservice.org/optimization', {
    method: 'POST',
    headers: {
      'Authorization': ORS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    alert("Failed to calculate route.");
    return;
  }

  const steps = data.routes[0].steps;
  const orderedCoords = [vehicles[0].start, ...steps.map(s => s.location), vehicles[0].end];

  if (routeLayer) map.removeLayer(routeLayer);

  // Calculate and display polyline route
  const routeRes = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
    method: 'POST',
    headers: {
      'Authorization': ORS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates: orderedCoords
    })
  });

  const routeGeoJSON = await routeRes.json();

  routeLayer = L.geoJSON(routeGeoJSON, {
    style: { color: '#007bff', weight: 5 }
  }).addTo(map);

  // Calculate and display cost
  const totalDistance = data.routes[0].distance / 1000; // in km
  const cost = totalDistance * 5; // Example R5/km rate
  document.getElementById('cost-display').textContent = `Total Distance: ${totalDistance.toFixed(2)} km | Cost: R${cost.toFixed(2)}`;
});



