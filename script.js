let map = L.map("map").setView([-23.35906, 30.50142], 10); // Farm: 23°21'32.6"S 30°30'05.1"E

let farmLatLng = L.latLng(-23.35906, 30.50142);
let destinations = [];
let routingControl = null;

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Satellite toggle
L.control.layers({
  "Street View": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
  "Satellite View": L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  })
}).addTo(map);

// Click to add marker
map.on("click", function (e) {
  destinations.push(e.latlng);
  L.marker(e.latlng).addTo(map);
  updateLocationsList();
});

// Geocoder
let geocoder = L.esri.Geocoding.geocodeService();

function addAddressFromInput() {
  const address = document.getElementById("addressInput").value;
  if (!address) return;

  L.esri.Geocoding.geocode().text(address).run(function (err, results) {
    if (err || results.results.length === 0) {
      alert("Address not found!");
      return;
    }
    const result = results.results[0];
    destinations.push(result.latlng);
    L.marker(result.latlng).addTo(map).bindPopup(result.text).openPopup();
    updateLocationsList();
    document.getElementById("addressInput").value = "";
  });
}

function calculateRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  if (destinations.length === 0) return;

  let waypoints = [farmLatLng, ...destinations];

  routingControl = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    createMarker: function (i, wp) {
      return L.marker(wp.latLng).bindPopup(i === 0 ? "Farm Start" : `Stop ${i}`);
    }
  }).addTo(map);

  routingControl.on("routesfound", function (e) {
    const km = e.routes[0].summary.totalDistance / 1000;
    const cost = (km * 5).toFixed(2); // Example: R5/km
    alert(`Route length: ${km.toFixed(2)} km\nEstimated Delivery Cost: R${cost}`);
  });
}

function updateLocationsList() {
  const listDiv = document.getElementById("locationsList");
  listDiv.innerHTML = "";
  destinations.forEach((loc, i) => {
    const item = document.createElement("div");
    item.textContent = `Location ${i + 1}: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
    listDiv.appendChild(item);
  });
}

function clearAll() {
  destinations = [];
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
  if (routingControl) {
    map.removeControl(routingControl);
  }
  updateLocationsList();
}

// Admin toggle button
document.getElementById("admin-toggle").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("hidden");
});

