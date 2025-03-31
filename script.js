const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";
const farmCoord = [-23.35906, 30.50142];
let stopMarkers = [];
let routeLine = null;

// Map setup
const map = L.map("map").setView(farmCoord, 13);

// Street & Satellite tile layers
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "© Esri"
});

L.control.layers({
  "Street View": osmLayer,
  "Satellite View": satelliteLayer
}, null, { position: "bottomleft" }).addTo(map);

// Blue location icon
const blueIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Add fixed farm marker
L.marker(farmCoord, { icon: blueIcon }).addTo(map).bindPopup("Farm").openPopup();

// Admin sidebar toggle
document.getElementById("toggle-admin").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("hidden");
};

// Add stops by clicking on map
map.on("click", (e) => {
  const marker = L.marker(e.latlng, { icon: blueIcon }).addTo(map);
  stopMarkers.push(marker);
});

// Clear route and markers
document.getElementById("clear-route").onclick = () => {
  stopMarkers.forEach(marker => map.removeLayer(marker));
  stopMarkers = [];

  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  document.getElementById("distance").innerText = "";
  document.getElementById("cost").innerText = "";
};

// Calculate route and cost
document.getElementById("calculate-route").onclick = async () => {
  if (stopMarkers.length < 1) return alert("Add at least one stop.");

  const coords = [
    farmCoord,
    ...stopMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng])
  ];

  const body = {
    coordinates: coords.map(c => [c[1], c[0]]),
    optimize_waypoints: true
  };

  try {
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    const dist = data.features[0].properties.summary.distance / 1000; // in km
    const cost = dist * 5; // R5/km

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.geoJSON(data.features[0].geometry, {
      style: { color: "#1f6feb", weight: 5 }
    }).addTo(map);

    document.getElementById("distance").innerText = `Distance: ${dist.toFixed(2)} km`;
    document.getElementById("cost").innerText = `Estimated Cost: R${cost.toFixed(2)}`;
  } catch (err) {
    console.error(err);
    alert("Failed to calculate route.");
  }
};





