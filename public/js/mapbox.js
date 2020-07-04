/* eslint-disable */

export const displayMap = (locations) => {
    mapboxgl.accessToken = 
        'pk.eyJ1IjoiZ2hvc3RzaW50b3dlcnMiLCJhIjoiY2tibW81Z21sMWtvZjJ4bWx4dDc0NDZ1NiJ9.W5NWupbj4q0WTXqivmze6w';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/ghostsintowers/ckbmo8ma912ty1ip2r2oqo0zp',
        scrollZoom: false,
        // center: [-118.113491,34.111745],
        // zoom: 10,
        // interactive: false
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create Marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add Marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        // Add Popup
        new mapboxgl.Popup({offset: 30}).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map);

        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    })

    map.fitBounds(bounds, { padding: 
        {
            top: 200,
            bottom: 100,
            left: 100,
            right: 100
        }
    });


}

