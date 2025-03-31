const farmCoord = [-23.35906, 30.50142]; // Farm: 23°21'32.6"S 30°30'05.1"E
const apiKey = '5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf';

let map = L.map("map").setView(farmCoord, 13);
let markers = [];
let control = null;

// Satellite toggle
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "© Esri Satellite",
  }
);

L.control.layers(
  { "OpenStreetMap": osm, "Satellite": satellite }
).addTo(map);

// Fixed farm marker
L.marker(farmCoord, { icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [30, 30] }) })
  .addTo(map)
  .bindPopup("Farm Location")
  .openPopup();

map.on("click", (e) => {
  const stopNumber = markers.length + 1;
  const marker = L.marker(e.latlng, {
    icon: L.divIcon({
      className: "custom-marker",
      html: `<div style="background:#1f6feb;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">${stopNumber}</div>`,
      iconSize: [24, 24],
    }),
  }).addTo(map);
  markers.push(e.latlng);
});

// Admin toggle
document.getElementById("toggle-admin").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("hidden");
};

// Clear route
document.getElementById("clear-route").onclick = () => {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  if (control) {
    map.removeControl(control);
    control = null;
  }
  document.getElementById("distance").innerText = "";
  document.getElementById("cost").innerText = "";
  document.getElementById("directions").innerHTML = "";
};

// Calculate optimal route using OpenRouteService
document.getElementById("calculate-route").onclick = async () => {
  if (markers.length < 1) {
    alert("Add at least one delivery stop.");
    return;
  }

  const coords = [farmCoord, ...markers.map(p => [p.lat, p.lng])];
  const locations = coords.map(c => [c[1], c[0]]); // lng, lat for API

  const body = {
    jobs: locations.slice(1).map((loc, i) => ({
      id: i + 1,
      location: loc
    })),
    vehicles: [{
      id: 1,
      profile: "driving-car",
      start: locations[0],
      end: locations[0],
    }],
  };

  try {
    const res = await fetch("https://api.openrouteservice.org/optimization", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const steps = data.routes[0].steps;

    const orderedCoords = [locations[0], ...steps.map(s => locations[s.job])];

    if (control) map.removeControl(control);
    control = L.Routing.control({
      waypoints: orderedCoords.map(c => L.latLng(c[1], c[0])),
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
    }).addTo(map);

    // Distance
    const distanceKm = data.routes[0].distance / 1000;
    const cost = distanceKm * 5; // R5/km
    document.getElementById("distance").innerText = `Distance: ${distanceKm.toFixed(2)} km`;
    document.getElementById("cost").innerText = `Estimated Cost: R${cost.toFixed(2)}`;

    // Directions
    const directions = steps.map((s, i) => `<li>Stop ${i + 1}</li>`).join("");
    document.getElementById("directions").innerHTML = `<ol>${directions}</ol>`;

  } catch (err) {
    console.error("Route calculation error", err);
    alert("Failed to calculate route.");
  }
};


