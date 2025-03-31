const map = L.map('map').setView([-23.3591, 30.5014], 11); // Farm location

// Tile Layers
const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

const satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenTopoMap'
});

L.control.layers({
  "Streets": streets,
  "Satellite": satellite
}, null, { position: 'bottomleft' }).addTo(map);

// Add fixed farm marker
const farmCoords = [-23.3591, 30.5014];
const farmMarker = L.marker(farmCoords, {
  icon: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  })
}).addTo(map).bindPopup("Tintswalo's Poultry Farm").openPopup();

let deliveryPoints = [];
let markers = [];
let routeLayer = null;

// Admin toggle
document.getElementById('admin-toggle').addEventListener('click', () => {
  document.getElementById('admin-panel').classList.toggle('hidden');
});

// Add point by clicking
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

// Clear route
document.getElementById('clear-route').addEventListener('click', () => {
  if (routeLayer) map.removeLayer(routeLayer);
  markers.forEach(m => map.removeLayer(m));
  deliveryPoints = [];
  markers = [];
  document.getElementById('cost-display').textContent = 'Total Cost: R0.00';
});

// Calculate route
document.getElementById('calculate-route').addEventListener('click', async () => {
  if (deliveryPoints.length < 1) {
    alert("Add at least one stop.");
    return;
  }

  const API_KEY = '5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf';

  const jobs = deliveryPoints.map((coords, i) => ({
    id: i + 1,
    location: coords
  }));

  const vehicle = {
    id: 1,
    start: [30.5014, -23.3591],
    end: [30.5014, -23.3591]
  };

  const body = { jobs, vehicles: [vehicle] };

  try {
    const res = await fetch('https://api.openrouteservice.org/optimization', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
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
    const orderedCoords = [
      vehicle.start,
      ...steps.map(s => s.location),
      vehicle.end
    ];

    // Fetch route geometry
    const routeRes = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ coordinates: orderedCoords })
    });

    const geoData = await routeRes.json();

    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.geoJSON(geoData, {
      style: { color: '#007bff', weight: 5 }
    }).addTo(map);

    // Calculate cost
    const totalDistance = data.routes[0].distance / 1000; // in km
    const cost = totalDistance * 5; // R5/km
    document.getElementById('cost-display').textContent =
      `Total Distance: ${totalDistance.toFixed(2)} km | Cost: R${cost.toFixed(2)}`;

  } catch (error) {
    console.error(error);
    alert("An error occurred while calculating the route.");
  }
});


