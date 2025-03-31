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
}, null, { position: "bottomleft" }).addTo(map);

const blueIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

L.marker(farmCoord, {
  icon: blueIcon
}).addTo(map).bindPopup("Farm");

document.getElementById("toggle-admin").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("hidden");
};

map.on("click", (e) => {
  const marker = L.marker(e.latlng, { icon: blueIcon }).addTo(map);
  stopMarkers.push(marker);
});

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

document.getElementById("calculate-route").onclick = async () => {
  if (stopMarkers.length < 1) return alert("Add at least one stop.");

  const coords = [farmCoord, ...stopMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]), farmCoord];
  const body = {
    coordinates: coords.map(c => [c[1], c[0]])
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
    const dist = data.features[0].properties.summary.distance / 1000;
    const cost = dist * 5;

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



