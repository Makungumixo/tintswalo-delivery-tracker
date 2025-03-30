const map = L.map("map", {
  center: [-23.3591, 30.5014], // Farm coordinates
  zoom: 10,
  layers: [
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }),
  ],
});

L.control.scale().addTo(map);
L.Control.geocoder().addTo(map); // Search box

let waypoints = [
  L.latLng(-23.3591, 30.5014), // Tintswalo's Farm
];
let control = null;

function updateRoute() {
  if (control) map.removeControl(control);

  control = L.Routing.control({
    waypoints: waypoints,
    routeWhileDragging: false,
    createMarker: (i, wp) => L.marker(wp, { draggable: true })
      .on('dragend', updateRoute),
    show: false,
  })
  .on("routesfound", function (e) {
    const total = e.routes[0].summary.totalDistance / 1000;
    document.getElementById("distance").innerText = total.toFixed(2);
    const rate = parseFloat(document.getElementById("rate").value);
    document.getElementById("cost").innerText = (total * rate).toFixed(2);
  })
  .addTo(map);
}

map.on("click", function (e) {
  waypoints.push(e.latlng);
  updateRoute();
});

window.clearRoute = function () {
  waypoints = [L.latLng(-23.3591, 30.5014)];
  updateRoute();
};

updateRoute();


