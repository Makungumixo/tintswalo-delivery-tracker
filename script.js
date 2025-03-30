const farmLatLng = [-23.35906, 30.50142];
let map = L.map("map").setView(farmLatLng, 10);
let markers = [];
let control = null;
let isSatellite = false;

const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

const satellite = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
});

const farmMarker = L.marker(farmLatLng, { draggable: false }).addTo(map).bindPopup("Tintswalo's Poultry Farm").openPopup();

document.getElementById("adminToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("hidden");
});

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

map.on("click", (e) => {
  const marker = L.marker(e.latlng).addTo(map);
  markers.push(marker);
});

document.getElementById("calculateRoute").addEventListener("click", () => {
  if (control) map.removeControl(control);
  if (markers.length === 0) return;

  const waypoints = [L.latLng(farmLatLng), ...markers.map(m => m.getLatLng())];

  control = L.Routing.control({
    waypoints,
    routeWhileDragging: false,
    show: false,
    plan: L.Routing.plan(waypoints, {
      createMarker: (i, wp) => {
        return L.marker(wp, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:#1f6feb;color:white;padding:5px;border-radius:50%">${i}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })
        });
      },
    }),
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1"
    })
  }).addTo(map);

  control.on("routesfound", function (e) {
    const route = e.routes[0];
    const km = (route.summary.totalDistance / 1000).toFixed(2);
    const rate = parseFloat(document.getElementById("rateInput").value);
    const cost = (rate * km).toFixed(2);

    document.getElementById("distanceOutput").innerText = `Distance: ${km} km`;
    document.getElementById("costOutput").innerText = `Estimated Cost: R${cost}`;

    let directionsHTML = "<h4>Route Instructions:</h4><ol>";
    route.instructions.forEach(step => {
      directionsHTML += `<li>${step.text}</li>`;
    });
    directionsHTML += "</ol>";

    document.getElementById("instructions").innerHTML = directionsHTML;
  });
});

document.getElementById("clearRoute").addEventListener("click", () => {
  if (control) {
    map.removeControl(control);
    control = null;
  }
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  document.getElementById("distanceOutput").innerText = "";
  document.getElementById("costOutput").innerText = "";
  document.getElementById("instructions").innerHTML = "";
});
const farmLatLng = [-23.35906, 30.50142];
let map = L.map("map").setView(farmLatLng, 10);
let markers = [];
let control = null;
let isSatellite = false;

const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

const satellite = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
});

const farmMarker = L.marker(farmLatLng, { draggable: false }).addTo(map).bindPopup("Tintswalo's Poultry Farm").openPopup();

document.getElementById("adminToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("hidden");
});

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

map.on("click", (e) => {
  const marker = L.marker(e.latlng).addTo(map);
  markers.push(marker);
});

document.getElementById("calculateRoute").addEventListener("click", () => {
  if (control) map.removeControl(control);
  if (markers.length === 0) return;

  const waypoints = [L.latLng(farmLatLng), ...markers.map(m => m.getLatLng())];

  control = L.Routing.control({
    waypoints,
    routeWhileDragging: false,
    show: false,
    plan: L.Routing.plan(waypoints, {
      createMarker: (i, wp) => {
        return L.marker(wp, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:#1f6feb;color:white;padding:5px;border-radius:50%">${i}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })
        });
      },
    }),
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1"
    })
  }).addTo(map);

  control.on("routesfound", function (e) {
    const route = e.routes[0];
    const km = (route.summary.totalDistance / 1000).toFixed(2);
    const rate = parseFloat(document.getElementById("rateInput").value);
    const cost = (rate * km).toFixed(2);

    document.getElementById("distanceOutput").innerText = `Distance: ${km} km`;
    document.getElementById("costOutput").innerText = `Estimated Cost: R${cost}`;

    let directionsHTML = "<h4>Route Instructions:</h4><ol>";
    route.instructions.forEach(step => {
      directionsHTML += `<li>${step.text}</li>`;
    });
    directionsHTML += "</ol>";

    document.getElementById("instructions").innerHTML = directionsHTML;
  });
});

document.getElementById("clearRoute").addEventListener("click", () => {
  if (control) {
    map.removeControl(control);
    control = null;
  }
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  document.getElementById("distanceOutput").innerText = "";
  document.getElementById("costOutput").innerText = "";
  document.getElementById("instructions").innerHTML = "";
});
V
