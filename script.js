const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";
const farmCoord = [-23.35906, 30.50142]; // Tintswalo's Poultry Farm

let stopMarkers = [];
let routeLine = null;

// Initialize the map
const map = L.map("map").setView(farmCoord, 13);

// Base Layers
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "© Esri, NASA, NGA"
});

L.control.layers(
  {
    "Street View": osmLayer,
    "Satellite View": satelliteLayer
  },
  null,
  { position: "bottomleft" }
).addTo(map);

// Custom blue icon
const blueIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Mark the farm
L.marker(farmCoord, { icon: blueIcon }).addTo(map).bindPopup("Tintswalo’s Poultry Farm");

// Toggle admin sidebar
document.getElementById("toggle-admin").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("hidden");
};

// Add stops by clicking on the map
map.on("click", (e) => {
  const marker = L.marker(e.latlng, { icon: blueIcon }).addTo(map);
  stopMarkers.push(marker);
});

// Clear stops and route
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

// Calculate optimal delivery route
document.getElementById("calculate-route").onclick = async () => {
  if (stopMarkers.length === 0) {
    alert("Add at least one stop.");
    return;
  }

  const coords = [farmCoord, ...stopMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng])];

  try {
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: coords.map(([lat, lng]) => [lng, lat]),
        optimize_waypoints: true
      })
    });

    const data = await res.json();
    const dist = data.features[0].properties.summary.distance / 1000; // km
    const cost = dist * 5; // R5 per km

    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.geoJSON(data.features[0].geometry, {
      style: { color: "#1f6feb", weight: 5 }
    }).addTo(map);

    document.getElementById("distance").innerText = `Distance: ${dist.toFixed(2)} km`;
    document.getElementById("cost").innerText = `Cost: R${cost.toFixed(2)}`;
  } catch (err) {
    alert("Failed to calculate route.");
    console.error(err);
  }
};





