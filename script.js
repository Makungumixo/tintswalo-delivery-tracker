const farmCoords = [-23.359056, 30.501417];
let map = L.map('map').setView(farmCoords, 11);
let satelliteOn = false;
let stops = [];
let markers = [];
let routeControl = null;
let markerCount = 0;

let baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
let satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

baseLayer.addTo(map);

// Farm marker
L.marker(farmCoords, { title: "Farm", icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616408.png', iconSize: [30, 30] }) })
  .addTo(map)
  .bindPopup("Farm");

// Admin toggle
document.getElementById("adminToggle").onclick = () => {
  document.getElementById("sidebar").classList.toggle("hidden");
};

// Toggle satellite
document.getElementById("toggleSatellite").onclick = () => {
  satelliteOn ? map.removeLayer(satelliteLayer) : satelliteLayer.addTo(map);
  satelliteOn = !satelliteOn;
};

// Add stops
map.on('click', function (e) {
  markerCount++;
  const stopMarker = L.marker(e.latlng, {
    title: `Stop ${markerCount}`,
    icon: L.divIcon({ className: 'custom-div-icon', html: `<div style="background:#ff5722;border-radius:50%;color:#fff;width:30px;height:30px;line-height:30px;text-align:center;">${markerCount}</div>` })
  }).addTo(map).bindPopup(`Stop ${markerCount}`);
  stops.push(e.latlng);
  markers.push(stopMarker);
});

// Calculate optimized route
document.getElementById("calculateRoute").onclick = () => {
  if (routeControl) map.removeControl(routeControl);

  const waypoints = [L.latLng(farmCoords), ...stops.map(p => L.latLng(p))];

  routeControl = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    plan: L.Routing.plan(waypoints, {
      createMarker: () => null,
      routeWhileDragging: false
    }),
    show: false,
    addWaypoints: false,
    lineOptions: {
      addWaypoints: false,
      styles: [{ color: 'blue', weight: 5 }]
    }
  }).addTo(map);

  routeControl.on('routesfound', function (e) {
    const route = e.routes[0];
    const km = route.summary.totalDistance / 1000;
    const rate = parseFloat(document.getElementById("rate").value);
    const cost = (km * rate).toFixed(2);
    const instructions = route.instructions || route.steps || route.coordinates;

    let html = `<p><strong>Distance:</strong> ${km.toFixed(2)} km</p>`;
    html += `<p><strong>Estimated Cost:</strong> R${cost}</p>`;
    html += `<strong>Route Instructions:</strong><ol>`;
    route.instructions.forEach(step => {
      html += `<li>${step.text}</li>`;
    });
    html += `</ol>`;
    document.getElementById("routeDetails").innerHTML = html;
  });
};

// Clear all
document.getElementById("clearRoute").onclick = () => {
  if (routeControl) map.removeControl(routeControl);
  markers.forEach(m => map.removeLayer(m));
  stops = [];
  markers = [];
  markerCount = 0;
  document.getElementById("routeDetails").innerHTML = "";
};


