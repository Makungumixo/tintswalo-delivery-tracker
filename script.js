const farmLatLng = [-23.35906, 30.50142];
let waypoints = [];
let routingControl = null;

const baseMaps = {
  Standard: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }),
  Satellite: L.tileLayer(
    "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© Google"
    }
  )
};

let currentMapType = "Standard";
let map = L.map("map", {
  center: farmLatLng,
  zoom: 11,
  layers: [baseMaps.Standard]
});

L.marker(farmLatLng).addTo(map).bindPopup("Tintswalo's Poultry Farm");

map.on("click", function (e) {
  waypoints.push(L.latLng(e.latlng.lat, e.latlng.lng));
  const li = document.createElement("li");
  li.textContent = `Stop ${waypoints.length}: (${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)})`;
  document.getElementById("waypoints-list").appendChild(li);
});

function calculateRoute() {
  if (routingControl) map.removeControl(routingControl);
  let routePoints = [L.latLng(farmLatLng), ...waypoints];

  routingControl = L.Routing.control({
    waypoints: routePoints,
    routeWhileDragging: false,
    draggableWaypoints: false,
    addWaypoints: false
  }).addTo(map);

  routingControl.on("routesfound", function (e) {
    const routes = e.routes[0];
    const stepsContainer = document.getElementById("route-steps");
    stepsContainer.innerHTML = "";
    for (let i = 0; i < routes.instructions.length; i++) {
      const li = document.createElement("li");
      li.innerText = routes.instructions[i].text;
      stepsContainer.appendChild(li);
    }
  });
}

function clearRoute() {
  if (routingControl) map.removeControl(routingControl);
  waypoints = [];
  document.getElementById("waypoints-list").innerHTML = "";
  document.getElementById("route-steps").innerHTML = "";
}

document.getElementById("admin-toggle").onclick = () => {
  document.getElementById("sidebar").classList.toggle("collapsed");
};

document.getElementById("satellite-toggle").onclick = () => {
  currentMapType =
    currentMapType === "Standard" ? "Satellite" : "Standard";
  map.eachLayer(layer => map.removeLayer(layer));
  baseMaps[currentMapType].addTo(map);
  if (routingControl) routingControl.addTo(map);
};
