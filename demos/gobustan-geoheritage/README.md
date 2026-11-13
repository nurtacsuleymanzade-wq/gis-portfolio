# Gobustan: Layers of the Landscape

An interactive browser prototype for cultural-heritage and geotourism interpretation. It presents three short field notes in English and Azerbaijani, with a walkable 3D scene and a separate geographic map of the three UNESCO component areas.

The terrain, rock-art imagery, route and local grid are illustrative. They are not survey-accurate GIS data, an official visitor route or replicas of individual archaeological objects. The sound at the musical-stone stop is synthesized, not a field recording.

The GIS map uses UNESCO's published reference coordinates and property areas in WGS84. These are points, not site boundaries. The three records can be downloaded as GeoJSON from the map. OpenStreetMap supplies the optional interactive basemap.

## Sources and credits

- [UNESCO World Heritage Centre: Gobustan Rock Art Cultural Landscape](https://whc.unesco.org/en/list/1076/)
- [UNESCO: geographic data for the three component areas](https://whc.unesco.org/en/list/1076/maps/)
- [Azerbaijan Travel: Qobustanda daş dövrünə səyahət](https://azerbaijan.travel/qobustanda-das-dovrune-seyahet)
- Basemap: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
- 3D models generated with [Thrixel](https://www.thrixel.com/).
- Built with [Three.js](https://threejs.org/) and [Leaflet](https://leafletjs.com/).

Use a web server to view the files; the application loads Three.js from jsDelivr and the models from the `models` directory.
If WebGL 2 is unavailable or the 3D scene fails to load, an interactive 2D story map remains available.
