const map = L.map("map").setView([-23.35906, 30.50142], 12);
let control;
let markers = [];
let stops = [];
const farmLocation = [-23.35906, 30.50142];
const farmMarker = L.marker(farmLocation, {
  icon: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })
}).addTo(map).bindPopup("Tintswalo’s Poultry Farm").openPopup();

// TILE LAYERS
const normal = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
const satellite = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png");

// SATELLITE TOGGLE
document.getElementById("toggle-satellite").addEventListener("change", function () {
  if (this.checked) {
    map.removeLayer(normal);
    satellite.addTo(map);
  } else {
    map.removeLayer(satellite);
    normal.addTo(map);
  }
});

// ADMIN TOGGLE
document.getElementById("adminToggle").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("open");
};

// CLICK TO ADD STOP
map.on("click", function (e) {
  const marker = L.marker(e.latlng, {
    icon: L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }).addTo(map);
  markers.push(marker);
  stops.push(e.latlng);
});

// CALCULATE OPTIMIZED ROUTE
document.getElementById("calculateRouteBtn").onclick = async () => {
  if (stops.length < 1) {
    alert("Add at least one stop.");
    return;
  }

  const coordinates = [farmLocation, ...stops.map(p => [p.lat, p.lng])];

  const response = await fetch("https://api.openrouteservice.org/v2/optimization", {
    method: "POST",
    headers: {
      "Authorization": "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jobs: stops.map((loc, i) => ({
        id: i + 1,
        location: [loc.lng, loc.lat]
      })),
      vehicles: [{
        id: 1,
        start: [farmLocation[1], farmLocation[0]]
      }]
    })
  });

  const data = await response.json();

  if (control) map.removeControl(control);

  const optimizedRoute = data.routes?.[0]?.steps.map(step => {
    const loc = step.location;
    return [loc[1], loc[0]];
  });

  if (!optimizedRoute) {
    alert("Failed to calculate optimized route.");
    return;
  }

  control = L.Routing.control({
    waypoints: optimizedRoute.map(loc => L.latLng(loc[0], loc[1])),
    createMarker: function(i, wp) {
      return L.marker(wp.latLng, {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      }).bindPopup(`Stop ${i + 1}`);
    },
    routeWhileDragging: false,
    addWaypoints: false
  }).addTo(map);

  // Estimate cost
  const totalDistanceKm = data.routes[0].distance / 1000;
  document.getElementById("distanceOutput").innerText = `Distance: ${totalDistanceKm.toFixed(2)} km`;
  document.getElementById("costOutput").innerText = `Estimated Cost: R ${(totalDistanceKm * 4.5).toFixed(2)}`;
};

// CLEAR EVERYTHING
document.getElementById("clearRouteBtn").onclick = () => {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  stops = [];
  if (control) map.removeControl(control);
  document.getElementById("distanceOutput").innerText = "";
  document.getElementById("costOutput").innerText = "";
};




