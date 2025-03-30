let map = L.map("map").setView([-23.35906, 30.50142], 10);
let waypoints = [L.latLng(-23.35906, 30.50142)];
let routingControl;
let isSatellite = false;

// Tile layers
const normalTiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
});
const satelliteTiles = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "Tiles © Esri" }
);

// Load default tiles
normalTiles.addTo(map);

// Geocoder Search Bar
L.esri.Geocoding.geosearch().addTo(map)
  .on("results", function (data) {
    data.results.forEach((result) => {
      L.marker(result.latlng).addTo(map);
      waypoints.push(result.latlng);
    });
  });

// Click to add point
map.on("click", (e) => {
  const latlng = e.latlng;
  L.marker(latlng).addTo(map);
  waypoints.push(latlng);
});

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.style.display = sidebar.style.display === "block" ? "none" : "block";
}

function toggleSatellite() {
  isSatellite = !isSatellite;
  map.removeLayer(normalTiles);
  map.removeLayer(satelliteTiles);
  if (isSatellite) {
    satelliteTiles.addTo(map);
  } else {
    normalTiles.addTo(map);
  }
}

function calculateRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
  }
  routingControl = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    show: false,
  }).addTo(map);

  routingControl.on("routesfound", function (e) {
    const route = e.routes[0];
    const km = (route.summary.totalDistance / 1000).toFixed(2);
    const rate = parseFloat(document.getElementById("rate").value || "0");
    document.getElementById("distance").innerText = km;
    document.getElementById("cost").innerText = (km * rate).toFixed(2);
  });
}

function clearRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
  }
  routingControl = null;
  waypoints = [L.latLng(-23.35906, 30.50142)];
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker && !layer._icon.classList.contains('leaflet-control-geocoder-icon')) {
      map.removeLayer(layer);
    }
  });
  document.getElementById("distance").innerText = "0";
  document.getElementById("cost").innerText = "0";
}

