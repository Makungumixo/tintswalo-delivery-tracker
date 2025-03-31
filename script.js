const farmCoords = [-23.359056, 30.501417]; // Giyani
const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";

const map = L.map("map").setView(farmCoords, 13);

// Map Tile Layers
const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
}).addTo(map);

const satellite = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
  }
);

L.control
  .layers({ "Street View": street, "Satellite View": satellite })
  .addTo(map);

// Fixed farm marker
const farmMarker = L.marker(farmCoords, {
  icon: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [30, 45],
    iconAnchor: [15, 45],
  }),
})
  .addTo(map)
  .bindPopup("🐔 Tintswalo’s Poultry Farm")
  .openPopup();

// Admin toggle
document.getElementById("admin-toggle").onclick = () => {
  document.getElementById("sidebar").classList.toggle("hidden");
};

let stopMarkers = [];
let routingControl = null;

// Click to add stops
map.on("click", (e) => {
  const marker = L.marker(e.latlng, {
    icon: L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    }),
  })
    .addTo(map)
    .bindPopup("Added Stop")
    .openPopup();

  stopMarkers.push({ coords: [e.latlng.lat, e.latlng.lng], marker });
});

function calculateOptimizedRoute() {
  if (stopMarkers.length < 1) {
    alert("Add at least one stop.");
    return;
  }

  const jobs = stopMarkers.map((s, i) => ({
    id: i + 1,
    location: s.coords.slice().reverse(), // lng, lat
  }));

  const vehicle = {
    id: 1,
    profile: "driving-car",
    start: farmCoords.slice().reverse(),
  };

  fetch("https://api.openrouteservice.org/optimization", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobs, vehicles: [vehicle] }),
  })
    .then((res) => res.json())
    .then((data) => {
      const steps = data.routes[0].steps.map((s) => s.location.slice().reverse());

      if (routingControl) map.removeControl(routingControl);

      routingControl = L.Routing.control({
        waypoints: steps.map((c) => L.latLng(c[0], c[1])),
        createMarker: (i, wp) => {
          return L.marker(wp.latLng).bindPopup(`Stop ${i}`);
        },
        lineOptions: {
          styles: [{ color: "#1f6feb", weight: 5 }],
        },
        addWaypoints: false,
        routeWhileDragging: false,
        show: false,
      }).addTo(map);

      // Distance + cost
      const dist = data.routes[0].summary.distance / 1000; // in km
      const rate = parseFloat(document.getElementById("rate").value);
      document.getElementById("cost").innerText = `Estimated Cost: R ${(
        dist * rate
      ).toFixed(2)}`;
    })
    .catch((err) => {
      console.error(err);
      alert("⚠️ Failed to calculate route.");
    });
}

function clearRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  stopMarkers.forEach((s) => map.removeLayer(s.marker));
  stopMarkers = [];
  document.getElementById("cost").innerText = "";
}


