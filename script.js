const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";
const farmCoord = [-23.35906, 30.50142]; // Gandlanani Khani
let stopMarkers = [];
let routeLine = null;

// Setup map
const map = L.map("map").setView(farmCoord, 13);

// Base layers
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "&copy; Esri",
});

L.control.layers(
  { "Street Map": osmLayer, "Satellite": satelliteLayer },
  null,
  { position: "bottomleft" }
).addTo(map);

// Fixed farm marker
L.marker(farmCoord, {
  icon: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}).addTo(map).bindPopup("Farm Location");

// Toggle Admin Sidebar
document.getElementById("toggle-admin").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("hidden");
};

// Click to add stops
map.on("click", (e) => {
  const marker = L.marker(e.latlng, {
    icon: L.divIcon({
      className: "custom-marker",
      html: `<div style="background:#1f6feb;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">${stopMarkers.length + 1}</div>`,
      iconSize: [24, 24]
    })
  }).addTo(map);
  stopMarkers.push(marker);
});

// Clear route
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
  if (stopMarkers.length === 0) {
    alert("Add at least one stop.");
    return;
  }

  const coords = [farmCoord, ...stopMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]), farmCoord];
  const coordStr = coords.map(c => `${c[1]},${c[0]}`).join("|");

  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${coords[0][1]},${coords[0][0]}&end=${coords.at(-1)[1]},${coords.at(-1)[0]}`;
  
  try {
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: coords.map(c => [c[1], c[0]])
      })
    });

    const data = await res.json();
    const geometry = data.features[0].geometry;

    // Draw route
    if (routeLine) map.removeLayer(routeLine);
    routeLine = L.geoJSON(geometry, {
      style: { color: "#1f6feb", weight: 5 }
    }).addTo(map);

    // Distance and cost
    const dist = data.features[0].properties.summary.distance / 1000;
    const cost = dist * 5;
    document.getElementById("distance").innerText = `Distance: ${dist.toFixed(2)} km`;
    document.getElementById("cost").innerText = `Cost: R${cost.toFixed(2)}`;

  } catch (err) {
    console.error(err);
    alert("Failed to calculate route. Please try again.");
  }
};



