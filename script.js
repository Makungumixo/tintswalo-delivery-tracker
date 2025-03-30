const farmLocation = L.latLng(-23.359056, 30.501417); // Fixed farm coordinates
let deliveryStops = [];
let deliveryMarkers = [];
let routeControl = null;
let satelliteOn = false;

const map = L.map('map').setView(farmLocation, 11);

// Base & Satellite Layers
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
const satellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  subdomains: ['mt0','mt1','mt2','mt3']
});

osm.addTo(map);

// Add Farm Marker
const farmMarker = L.marker(farmLocation).addTo(map).bindPopup("Farm Location").openPopup();

// Toggle Admin Sidebar
document.getElementById("adminToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("hidden");
});

// Toggle Satellite View
document.getElementById("toggleSatellite").addEventListener("click", () => {
  if (satelliteOn) {
    map.removeLayer(satellite);
    osm.addTo(map);
  } else {
    map.removeLayer(osm);
    satellite.addTo(map);
  }
  satelliteOn = !satelliteOn;
});

// Add delivery stops on map click
map.on('click', function(e) {
  const stopNumber = deliveryStops.length + 1;
  const marker = L.marker(e.latlng).addTo(map)
    .bindPopup(`Stop ${stopNumber}`).openPopup();
  deliveryStops.push(e.latlng);
  deliveryMarkers.push(marker);
});

// Calculate Route
document.getElementById("calculateRoute").addEventListener("click", () => {
  if (routeControl) map.removeControl(routeControl);

  const waypoints = [farmLocation, ...deliveryStops];

  routeControl = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    addWaypoints: false,
    show: false,
    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    plan: L.Routing.plan(waypoints, {
      createMarker: () => null
    }),
    lineOptions: {
      styles: [{ color: 'blue', weight: 6 }]
    }
  }).addTo(map);

  routeControl.on('routesfound', function(e) {
    const route = e.routes[0];
    const km = route.summary.totalDistance / 1000;
    const rate = parseFloat(document.getElementById("rate").value);
    const cost = (km * rate).toFixed(2);

    let html = `<p><strong>Total Distance:</strong> ${km.toFixed(2)} km</p>`;
    html += `<p><strong>Estimated Cost:</strong> R${cost}</p>`;
    html += `<strong>Route Instructions:</strong><ol>`;
    route.instructions.forEach(step => {
      html += `<li>${step.text}</li>`;
    });
    html += `</ol>`;
    document.getElementById("routeDetails").innerHTML = html;
  });
});

// Clear Route and Markers
document.getElementById("clearRoute").addEventListener("click", () => {
  if (routeControl) {
    map.removeControl(routeControl);
    routeControl = null;
  }

  deliveryMarkers.forEach(marker => map.removeLayer(marker));
  deliveryMarkers = [];
  deliveryStops = [];
  document.getElementById("routeDetails").innerHTML = "";
});
