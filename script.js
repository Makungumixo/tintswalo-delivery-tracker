const farmCoords = [-23.359056, 30.501417]; // Gandlanani Khani, Giyani
const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";

const map = L.map("map").setView(farmCoords, 13);

// Layers
const normal = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
const satellite = L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
  subdomains: ["mt0", "mt1", "mt2", "mt3"],
});
normal.addTo(map);

L.control
  .layers({ "Street View": normal, "Satellite View": satellite })
  .addTo(map);

// Farm marker
const farmMarker = L.marker(farmCoords, { icon: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [25, 41], iconAnchor: [12, 41] }) })
  .addTo(map)
  .bindPopup("Tintswalo’s Poultry Farm")
  .openPopup();

let stopMarkers = [];
let routingControl = null;

map.on("click", function (e) {
  const marker = L.marker(e.latlng, { icon: L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png", iconSize: [25, 41], iconAnchor: [12, 41] }) })
    .addTo(map)
    .bindPopup("Stop " + (stopMarkers.length + 1))
    .openPopup();
  stopMarkers.push({ coords: [e.latlng.lat, e.latlng.lng], marker });
});

function calculateOptimizedRoute() {
  if (stopMarkers.length < 1) {
    alert("Add at least one stop.");
    return;
  }

  const locations = [farmCoords, ...stopMarkers.map(s => s.coords)];

  const body = {
    jobs: stopMarkers.map((stop, i) => ({
      id: i + 1,
      location: stop.coords.reverse(), // [lng, lat]
    })),
    vehicles: [{
      id: 1,
      profile: "driving-car",
      start: farmCoords.slice().reverse(),
    }],
  };

  fetch("https://api.openrouteservice.org/optimization", {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then(res => res.json())
    .then(data => {
      const route = data.routes[0];
      const steps = route.steps.map(s => s.location.reverse()); // back to [lat, lng]
      if (routingControl) map.removeControl(routingControl);

      routingControl = L.Routing.control({
        waypoints: steps.map(p => L.latLng(p)),
        lineOptions: { styles: [{ color: "blue", weight: 4 }] },
        createMarker: function (i, wp) {
          return L.marker(wp.latLng).bindPopup("Stop " + i).openPopup();
        },
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
      }).addTo(map);

      const distanceKm = route.summary.distance / 1000;
      const rate = parseFloat(document.getElementById("rate").value);
      const cost = distanceKm * rate;
      document.getElementById("cost").innerText = `Estimated Cost: R ${cost.toFixed(2)}`;
    })
    .catch(err => {
      alert("Failed to calculate route.");
      console.error(err);
    });
}

function clearRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  stopMarkers.forEach(s => map.removeLayer(s.marker));
  stopMarkers = [];
  document.getElementById("cost").innerText = "";
}

// Admin Toggle
document.getElementById("admin-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("hidden");
});


