const farmLatLng = [-23.35906, 30.50142]; // Tintswalo’s Poultry Farm
let map = L.map("map").setView(farmLatLng, 10);
let markers = [];
let control = null;
let isSatellite = false;

// Tile layers
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

const satellite = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17
});

// Static Farm Marker
const farmMarker = L.marker(farmLatLng, {
  icon: L.divIcon({
    className: 'farm-marker',
    html: '<div style="background:#198754;color:white;padding:6px;border-radius:50%;">Farm</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })
}).addTo(map).bindPopup("Tintswalo’s Poultry Farm");

// Admin Toggle
document.getElementById("adminToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("hidden");
});

// Satellite View Toggle
document.getElementById("satelliteToggle").addEventListener("click", () => {
  if (isSatellite) {
    map.removeLayer(satellite);
    osm.addTo(map);
  } else {
    map.removeLayer(osm);
    satellite.addTo(map);
  }
  isSatellite = !isSatellite;
});

// Add delivery location by clicking
map.on("click", (e) => {
  const stopNumber = markers.length + 1;
  const marker = L.marker(e.latlng, {
    icon: L.divIcon({
      className: 'delivery-marker',
      html: `<div style="background:#dc3545;color:white;padding:6px;border-radius:50%;">${stopNumber}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }).addTo(map).bindPopup(`Stop ${stopNumber}`);
  markers.push(marker);
});

// Calculate route with optimized path
document.getElementById("calculateRoute").addEventListener("click", () => {
  if (control) map.removeControl(control);

  const waypoints = [L.latLng(farmLatLng), ...markers.map(m => m.getLatLng())];

  control = L.Routing.control({
    waypoints,
    routeWhileDragging: false,
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    plan: L.Routing.plan(waypoints, {
      createMarker: function(i, wp) {
        let label = i === 0 ? 'Farm' : `Stop ${i}`;
        return L.marker(wp, {
          icon: L.divIcon({
            className: 'route-label',
            html: `<div style="background:#1f6feb;color:white;padding:6px;border-radius:50%;">${label}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        });
      }
    })
  }).addTo(map);

  control.on("routesfound", (e) => {
    const route = e.routes[0];
    const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);
    const rate = parseFloat(document.getElementById("rateInput").value);
    const cost = (distanceKm * rate).toFixed(2);

    document.getElementById("distanceOutput").textContent = `Distance: ${distanceKm} km`;
    document.getElementById("costOutput").textContent = `Estimated Cost: R${cost}`;

    // Build instructions
    let steps = route.instructions || route.routes[0].instructions;
    const instructionHTML = route.instructions.map((i, idx) => `<li>${i.text}</li>`).join('');
    document.getElementById("instructions").innerHTML = `<h4>Directions:</h4><ol>${instructionHTML}</ol>`;
  });
});

// Clear map
document.getElementById("clearRoute").addEventListener("click", () => {
  if (control) {
    map.removeControl(control);
    control = null;
  }
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  document.getElementById("distanceOutput").textContent = "";
  document.getElementById("costOutput").textContent = "";
  document.getElementById("instructions").innerHTML = "";
});


