const farmLatLng = L.latLng(-23.358, 30.5014); // Gandlanani Khani
let map = L.map("map").setView(farmLatLng, 12);

let baseMaps = {
  "Streets": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
  "Satellite": L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  })
};

baseMaps["Streets"].addTo(map); // default view

L.control.layers(baseMaps).addTo(map);

let sidebar = document.getElementById("sidebar");
document.getElementById("admin-toggle").onclick = () => {
  sidebar.classList.toggle("open");
};

let deliveryPoints = [];
let markers = [];
let routingControl = null;

map.on("click", function (e) {
  const index = deliveryPoints.length + 1;
  const label = `Stop ${index}`;
  L.marker(e.latlng, { title: label })
    .bindPopup(label)
    .addTo(map)
    .openPopup();
  markers.push(e.latlng);
  deliveryPoints.push(e.latlng);
});

function clearRoute() {
  if (routingControl) map.removeControl(routingControl);
  deliveryPoints = [];
  markers = [];
  document.getElementById("instructions").innerHTML = "";
  document.getElementById("distanceOutput").innerText = "";
}

function calculateRoute() {
  if (deliveryPoints.length < 1) return alert("Add at least one stop!");

  let from = farmLatLng;
  let stops = [...deliveryPoints];

  // Nearest Neighbor Algorithm
  let route = [from];
  while (stops.length) {
    let last = route[route.length - 1];
    let nearestIndex = 0;
    let nearestDist = last.distanceTo(stops[0]);
    for (let i = 1; i < stops.length; i++) {
      const dist = last.distanceTo(stops[i]);
      if (dist < nearestDist) {
        nearestIndex = i;
        nearestDist = dist;
      }
    }
    route.push(stops.splice(nearestIndex, 1)[0]);
  }

  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: route,
    lineOptions: {
      styles: [{ color: "#1f6feb", weight: 4 }]
    },
    routeWhileDragging: false,
    show: false,
    createMarker: (i, wp) => {
      const label = i === 0 ? "Farm" : `Stop ${i}`;
      return L.marker(wp.latLng).bindPopup(label);
    }
  }).addTo(map);

  routingControl.on("routesfound", function (e) {
    const route = e.routes[0];
    const totalDistance = route.summary.totalDistance / 1000;
    const rate = parseFloat(document.getElementById("rateInput").value || 0);
    const cost = rate * totalDistance;
    document.getElementById("distanceOutput").innerText =
      `Distance: ${totalDistance.toFixed(2)} km | Estimated Cost: R${cost.toFixed(2)}`;

    const waypoints = route.waypoints.map((wp, i) =>
      i === 0 ? "Start at the Farm" : `Then go to Stop ${i}`
    );
    document.getElementById("instructions").innerHTML = waypoints.join("<br>");
  });
}

