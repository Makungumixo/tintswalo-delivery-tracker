const farmCoords = L.latLng(-23.358, 30.5014); // Your farm
const map = L.map('map').setView(farmCoords, 10);
let markers = [];
let destinations = [];
let routingControl;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Satellite toggle
const baseLayers = {
  "Street View": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  "Satellite View": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  })
};
L.control.layers(baseLayers).addTo(map);

// Click map to add locations
map.on('click', function (e) {
  addLocation(e.latlng);
});

function addLocation(latlng, label = null) {
  destinations.push(latlng);
  const marker = L.marker(latlng).addTo(map);
  markers.push(marker);

  const listItem = document.createElement("li");
  listItem.textContent = label ? label : `Lat: ${latlng.lat.toFixed(3)}, Lng: ${latlng.lng.toFixed(3)}`;
  document.getElementById("locationList").appendChild(listItem);
}

// Add by typing address
function addTypedLocation() {
  const input = document.getElementById("addressInput").value;
  if (!input) return;

  L.esri.Geocoding.geocode().text(input).run((err, result) => {
    if (err || result.results.length === 0) {
      alert("Location not found.");
      return;
    }
    const latlng = result.results[0].latlng;
    addLocation(latlng, result.results[0].text);
    document.getElementById("addressInput").value = "";
  });
}

// Calculate optimal route from farm to destinations
function calculateRoute() {
  if (routingControl) map.removeControl(routingControl);
  if (destinations.length === 0) return;

  routingControl = L.Routing.control({
    waypoints: [farmCoords, ...destinations],
    routeWhileDragging: false,
    addWaypoints: false,
    createMarker: (i, wp) => {
      return L.marker(wp.latLng).bindPopup(i === 0 ? "Farm" : `Stop ${i}`);
    }
  }).addTo(map);

  routingControl.on('routesfound', function (e) {
    const km = e.routes[0].summary.totalDistance / 1000;
    const cost = (km * 5).toFixed(2);
    alert(`Route Distance: ${km.toFixed(2)} km\nEstimated Cost: R${cost}`);
  });
}

// Clear all routes
function clearRoute() {
  if (routingControl) map.removeControl(routingControl);
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  destinations = [];
  document.getElementById("locationList").innerHTML = "";
}

// Admin toggle
document.getElementById("admin-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("hidden");
});
