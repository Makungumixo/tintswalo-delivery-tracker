const farmLocation = L.latLng(-23.359056, 30.501417); // Gandlanani Khani coordinates

const map = L.map('map').setView(farmLocation, 10);
let satellite = false;
let destinations = [];
let control;

const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

standardLayer.addTo(map);

// Geocoder control
L.Control.geocoder({
  defaultMarkGeocode: false
}).on('markgeocode', function(e) {
  const latlng = e.geocode.center;
  L.marker(latlng).addTo(map);
  destinations.push(latlng);
}).addTo(map);

// Search by typing address
document.getElementById("locationSearch").addEventListener("keypress", function(e) {
  if (e.key === 'Enter') {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.value}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const lat = data[0].lat;
          const lon = data[0].lon;
          const latlng = L.latLng(lat, lon);
          L.marker(latlng).addTo(map);
          map.setView(latlng, 13);
          destinations.push(latlng);
        }
      });
  }
});

// Click to add destination
map.on('click', function(e) {
  L.marker(e.latlng).addTo(map);
  destinations.push(e.latlng);
});

function toggleSatellite() {
  if (satellite) {
    map.removeLayer(satelliteLayer);
    standardLayer.addTo(map);
  } else {
    map.removeLayer(standardLayer);
    satelliteLayer.addTo(map);
  }
  satellite = !satellite;
}

function clearDestinations() {
  destinations = [];
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && !layer._icon.classList.contains('leaflet-routing-icon')) {
      map.removeLayer(layer);
    }
  });
  if (control) map.removeControl(control);
  document.getElementById("summary").innerText = "";
}

function optimizeRoute() {
  if (destinations.length < 1) {
    alert("Add at least one destination.");
    return;
  }

  const waypoints = [farmLocation, ...destinations];
  if (control) map.removeControl(control);
  control = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false
  }).addTo(map);

  control.on('routesfound', function(e) {
    const distance = e.routes[0].summary.totalDistance / 1000;
    const costPerKm = parseFloat(document.getElementById("rate").value);
    const totalCost = (distance * costPerKm).toFixed(2);
    document.getElementById("summary").innerText = `Distance: ${distance.toFixed(2)} km | Cost: R${totalCost}`;
  });
}

