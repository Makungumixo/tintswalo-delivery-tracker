let map = L.map('map').setView([-23.3076, 30.7085], 10); // Starting view at Limpopo

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Coordinates of the farm (starting point)
const farmCoords = [-23.3076, 30.7085];
L.marker(farmCoords).addTo(map).bindPopup("Tintswalo’s Poultry Farm").openPopup();

let deliveryPoints = [];
let routingControl = null;

function addLocation() {
  const name = document.getElementById('locationName').value;
  const lat = parseFloat(document.getElementById('latitude').value);
  const lon = parseFloat(document.getElementById('longitude').value);

  if (!name || isNaN(lat) || isNaN(lon)) {
    alert("Please enter valid name and coordinates.");
    return;
  }

  deliveryPoints.push({ name, coords: [lat, lon] });
  L.marker([lat, lon]).addTo(map).bindPopup(name);

  const li = document.createElement('li');
  li.textContent = name;
  document.getElementById('locationList').appendChild(li);

  updateRoute();
}

function updateRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  let waypoints = [L.latLng(farmCoords)];
  deliveryPoints.forEach(loc => waypoints.push(L.latLng(loc.coords)));

  if (waypoints.length <= 1) return;

  routingControl = L.Routing.control({
    waypoints: waypoints,
    lineOptions: {
      styles: [{ color: '#28a745', weight: 4 }]
    },
    show: false,
    addWaypoints: false,
    routeWhileDragging: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    createMarker: () => null
  })
  .on('routesfound', function(e) {
    const route = e.routes[0];
    const km = (route.summary.totalDistance / 1000).toFixed(2);
    const cost = (km * 6).toFixed(2); // R6 per km

    document.getElementById('totalDistance').textContent = km;
    document.getElementById('costEstimate').textContent = cost;
  })
  .addTo(map);
}

// Admin toggle
document.getElementById('adminToggle').addEventListener('change', function() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('hidden', !this.checked);
});
