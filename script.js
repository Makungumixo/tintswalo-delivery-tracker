const farmCoord = [-23.35906, 30.50142]; // Gandlanani Khani
const apiKey = "5b3ce3597851110001cf624899017faaa5cc44228022ed43274258bf";
const deliveryStops = [];
let routingControl = null;

// Setup map
const map = L.map("map").setView(farmCoord, 13);

// Base layers
const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "&copy; Esri Satellite",
});

// Layer control (bottom left)
L.control.layers(
  { "OpenStreetMap": osmLayer, "Satellite": satelliteLayer },
  null,
  { position: "bottomleft" }
).addTo(map);

// Fixed Farm Marker
L.marker(farmCoord, {
  icon: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}).addTo(map).bindPopup("Farm Location");

// Admin Toggle
document.getElementById("toggle-admin").onclick = () => {
  document.getElementById("admin-sidebar").classList.toggle("hidden");
};

// Add delivery stop on click
map.on("click", (e) => {
  const stopNumber = deliveryStops.length + 1;
  const marker = L.marker(e.latlng, {
    icon: L.divIcon({
      className: "custom-marker",
      html: `<div style="background:#1f6feb;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">${stopNumber}</div>`,
      iconSize: [24, 24]
    })
  }).addTo(map);
  deliveryStops.push(e.latlng);
});

// Clear route
document.getElementById("clear-route").onclick = () => {
  deliveryStops.length = 0;
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && layer.getLatLng().toString() !== L.latLng(farmCoord).toString()) {
      map.removeLayer(layer);
    }
  });
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  document.getElementById("distance").innerText = "";
  document.getElementById("cost").innerText = "";
  document.getElementById("steps").innerHTML = "";
};

// Calculate optimized route
document.getElementById("calculate-route").onclick = async () => {
  if (deliveryStops.length < 1) return alert("Add at least one stop");

  const jobs = deliveryStops.map((loc, index) => ({
    id: index + 1,
    location: [loc.lng, loc.lat]
  }));

  const vehicle = {
    id: 1,
    profile: "driving-car",
    start: [farmCoord[1], farmCoord[0]],
    end: [farmCoord[1], farmCoord[0]],
  };

  const body = {
    jobs,
    vehicles: [vehicle]
  };

  try {
    const res = await fetch("https://api.openrouteservice.org/optimization", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const steps = data.routes[0].steps;
    const route = [farmCoord, ...steps.map(step => [deliveryStops[step.job - 1].lat, deliveryStops[step.job - 1].lng]), farmCoord];

    if (routingControl) map.removeControl(routingControl);
    routingControl = L.Routing.control({
      waypoints: route.map(p => L.latLng(p[0], p[1])),
      createMarker: () => null,
      routeWhileDragging: false
    }).addTo(map);

    const distKm = data.routes[0].distance / 1000;
    const cost = distKm * 5;
    document.getElementById("distance").innerText = `Distance: ${distKm.toFixed(2)} km`;
    document.getElementById("cost").innerText = `Cost: R${cost.toFixed(2)}`;
    document.getElementById("steps").innerHTML = steps.map((step, i) => `→ Stop ${i + 1}`).join("<br>");

  } catch (err) {
    console.error(err);
    alert("Failed to calculate optimized route.");
  }
};


