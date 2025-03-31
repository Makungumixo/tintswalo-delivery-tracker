const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";
const farmCoord = [-23.35906, 30.50142];
let stopMarkers = [];
let routeLine = null;

const map = L.map("map").setView(farmCoord, 13);

const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "© Esri"
});

L.control.layers({
  "Street": osmLayer,
  "Satellite": satelliteLayer
}, null, {
  position: "bottomleft"
}).addTo(map);

// Blue location icon
const blueIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Add fixed farm marker
L.marker(farmCoord, { icon: blueIcon })
  .addTo(map)
  .bindPopup("Farm")
  .openPopup();

// Toggle sidebar
document.getElementById("toggle-admin").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("hidden");
};

// Add marker on click
map.on("click", (e) => {
  const marker = L.marker(e.latlng, { icon: blueIcon }).addTo(map);
  stopMarkers.push(marker);
});

// Clear all
document.getElementById("clear-route").onclick = () => {
  stopMarkers.forEach(m => map.removeLayer(m));
  stopMarkers = [];
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  document.getElementById("distance").innerText = "";
  document.getElementById("cost").innerText = "";
};

// Calculate shortest optimized route
document.getElementById("calculate-route").onclick = async () => {
  if (stopMarkers.length < 1) return alert("Add at least one stop.");

  const coordinates = [farmCoord, ...stopMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng])];

  try {
    const res = await fetch("https://api.openrouteservice.org/optimization", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobs: coordinates.slice(1).map((coord, i) => ({
          id: i + 1,
          location: [coord[1], coord[0]]
        })),
        vehicles: [{
          id: 1,
          start: [farmCoord[1], farmCoord[0]],
          end: [coordinates[coordinates.length - 1][1], coordinates[coordinates.length - 1][0]]
        }]
      })
    });

    const result = await res.json();
    const ordered = result.routes[0].steps.map(s => s.location);

    if (routeLine) map.removeLayer(routeLine);

    const routeCoords = ordered.map(([lng, lat]) => [lat, lng]);

    routeLine = L.polyline(routeCoords, {
      color: "#1f6feb",
      weight: 5
    }).addTo(map);

    const distance = result.routes[0].distance / 1000;
    const cost = distance * 5;

    document.getElementById("distance").innerText = `Distance: ${distance.toFixed(2)} km`;
    document.getElementById("cost").innerText = `Cost: R${cost.toFixed(2)}`;

  } catch (err) {
    alert("Failed to calculate route.");
    console.error(err);
  }
};
