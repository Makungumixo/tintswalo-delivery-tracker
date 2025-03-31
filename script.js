const farmCoords = [-23.35906, 30.50142]; // Gandlanani Khani Farm Coordinates
let stops = [];
let markers = [];
let routeControl = null;
let adminMode = false;
let costPerKm = 5; // You can adjust this rate

// Initialize Map
const map = L.map("map").setView(farmCoords, 11);

// Tile Layers
const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

const satelliteLayer = L.tileLayer(
  "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  {
    maxZoom: 20,
    subdomains: ["mt0", "mt1", "mt2", "mt3"]
  }
);

const baseMaps = {
  "Street View": streetLayer,
  "Satellite View": satelliteLayer
};
L.control.layers(baseMaps).addTo(map);

// Add fixed farm marker
L.marker(farmCoords, { title: "Farm" })
  .addTo(map)
  .bindPopup("🐔 Tintswalo's Poultry Farm")
  .openPopup();

// Admin Mode toggle
document.getElementById("adminToggle").addEventListener("click", () => {
  adminMode = !adminMode;
  document.getElementById("sidebar").classList.toggle("hidden", !adminMode);
});

// Add stops on map click
map.on("click", function (e) {
  if (!adminMode) return;

  const marker = L.marker(e.latlng, {
    icon: L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    })
  }).addTo(map);
  markers.push(marker);
  stops.push([e.latlng.lng, e.latlng.lat]); // ORS needs [lng, lat]
});

// Calculate Route
document.getElementById("calculateRoute").addEventListener("click", async () => {
  if (stops.length < 1) {
    alert("Add at least one delivery location.");
    return;
  }

  const coords = [[farmCoords[1], farmCoords[0]], ...stops.map(p => [p[1], p[0]])];

  const body = {
    jobs: coords.slice(1).map((coord, index) => ({
      id: index + 1,
      location: coord
    })),
    vehicles: [
      {
        id: 1,
        start: coords[0],
        end: coords[0]
      }
    ]
  };

  const res = await fetch("https://api.openrouteservice.org/optimization", {
    method: "POST",
    headers: {
      Authorization: "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.routes) {
    alert("Failed to calculate route.");
    return;
  }

  const ordered = data.routes[0].steps.map(step => {
    if (step.type === "job") {
      const loc = body.jobs.find(j => j.id === step.id).location;
      return [loc[1], loc[0]];
    }
    return [farmCoords[0], farmCoords[1]];
  });

  if (routeControl) {
    map.removeControl(routeControl);
  }

  routeControl = L.Routing.control({
    waypoints: ordered.map(c => L.latLng(c[0], c[1])),
    createMarker: function (i, wp, n) {
      return L.marker(wp.latLng, {
        icon: L.divIcon({
          className: "custom-icon",
          html: `<div style="background:#007bff;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">${i}</div>`,
          iconSize: [30, 30]
        })
      });
    },
    addWaypoints: false,
    routeWhileDragging: false,
    draggableWaypoints: false
  }).addTo(map);

  // Cost Estimate
  const distKm = data.routes[0].distance / 1000;
  const cost = (distKm * costPerKm).toFixed(2);
  document.getElementById("costDisplay").innerText = `Estimated Distance: ${distKm.toFixed(1)} km | Delivery Cost: R${cost}`;
});

// Clear Route
document.getElementById("clearRoute").addEventListener("click", () => {
  stops = [];
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  if (routeControl) {
    map.removeControl(routeControl);
    routeControl = null;
  }

  document.getElementById("costDisplay").innerText = "";
});


