
import * as THREE from "three";  
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import FastNoiseLite from "fastnoise-lite";

// three js display variables
let scene = null;
let camera = null;
let renderer = null;
let controls = null;

// counter for frame processing
let step = 0;

// noise variables
let noise = null;

// aurora variables
let auroras = [];
let num_auroras = 25;
let num_points = 100;

// aurora coordinate positioning
let x_start = -1;
let x_end = 1;
let y_start = -1;
let y_end = 1;
let z_start = -1;
let z_end = 1;

let cols = [{
    stop: 0,
    color: new THREE.Color(0xf7b000)
}, {
    stop: .25,
    color: new THREE.Color(0xdd0080)
}, {
    stop: .5,
    color: new THREE.Color(0x622b85)
}, {
    stop: .75,
    color: new THREE.Color(0x007dae)
}, {
    stop: 1,
    color: new THREE.Color(0x77c8db)
}];


// callback for when DOM is loaded - main function
// document.addEventListener("DOMContentLoaded", function() { 
function main() {
    setup_noise();
    create_display();
    create_auroras();
    animate(0);
};


// execute when the window is resized
// window.addEventListener("resize", function(event) {
//     resize_display_if_needed();
// }, true);


// setup noise variables
function setup_noise() {
    noise = new FastNoiseLite();
    // noise.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
}


// setup three scene variables
function create_display() {

    // get the container of the stage
    let container = document.getElementById("stage-container");

    // create scene
    scene = new THREE.Scene();

    // setup camera
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(0,2,0);
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // setup renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "";
    renderer.domElement.style.height = "";

    // setup trackball controls
    controls = new TrackballControls(camera, renderer.domElement);

    // setup light
    let light = new THREE.AmbientLight(0xFFFFFF, 1);
    scene.add(light);
}


// resize the display to current parent size
function resize_display_if_needed() {

    // get the container of the stage
    let container = document.getElementById("stage-container");

    // calculate size of the screen
    let pixel_ratio = window.devicePixelRatio;
    let width = Math.floor(container.offsetWidth * pixel_ratio);
    let height = Math.floor(container.offsetHeight * pixel_ratio);

    // check if dimensions have changed
    if (width === renderer.domElement.width && height === renderer.domElement.height) {
        return;
    }
    
    // resize renderer and camera aspect ratio
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}


// // create objects and place them within the scene
// function setup_scene() {
//     let red_material = new THREE.MeshBasicMaterial({color: 0xff0000});
//     let green_material = new THREE.MeshBasicMaterial({color: 0x00ff00});
//     let blue_material = new THREE.LineBasicMaterial({color: 0x0000ff});
//     let vertex_material = new THREE.MeshBasicMaterial({
//         vertexColors: true,
//         // wireframe: true,
//         transparent: true,
//         opacity: 0.5
//     });

//     // let plane_geo = new THREE.PlaneGeometry(2, 2);
//     // set_gradient(plane_geo, cols, 'z', false);
//     // let floor = new THREE.Mesh(plane_geo, vertex_material)
//     // floor.rotation.x = -90 * Math.PI / 180;
//     // scene.add(floor)
// }


// calculate points for aurora line
function calc_aurora_points(origin_ratio, offset) {

    let points = [];

    // scale for the noise function
    let scale = 100;

    // calculate point coordinate information based on provided variables
    let x_origin = origin_ratio * Math.abs(x_end - x_start) + x_start;
    let z_dist = Math.abs(z_end - z_start);

    for (let i = 0; i < num_points; i++) {

        let x = x_origin;
        let z = (i / num_points) * z_dist + z_start;
        let noise_val = noise.GetNoise(x*scale, z*scale+offset) / 5;
        
        points.push(x + noise_val, 0.1, z);
    }

    return points;
}


// create and store shapes for each aurora line
function create_auroras() {

    let material = new THREE.MeshBasicMaterial({color:0x00FF00});

    // repeat process for given number of aurora lines
    for (let i = 0; i < num_auroras; i++) {

        // calculate starting point for the current aurora
        let origin_ratio = i / num_auroras + (1 / num_auroras / 2);

        // iterate for each point to construct the line
        let points = calc_aurora_points(origin_ratio, 0);

        // create the geometry and mesh for the line
        let geometry = new THREE.BufferGeometry().setFromPoints(points);
        let mesh = new THREE.Line(geometry, material);

        // store the geometry and mesh
        auroras.push({
            geometry: geometry,
            mesh: mesh,
            origin_ratio: origin_ratio
        });

        // add the aurora to the scene
        scene.add(mesh);
    }
}


// perform an animation
function animate(time) {
    time *= 0.01; // convert time to seconds
    step += 0.10;

    // request the next animation frame
    requestAnimationFrame(animate);

    // resize the scene if window size has changed
    resize_display_if_needed();

    // iterate over every stored aurora
    for (let ai = 0; ai < auroras.length; ai++) {
        
        let aurora = auroras[ai];
        let geometry = aurora.geometry;

        // calculate new vertex positions
        let points = calc_aurora_points(aurora.origin_ratio, step);
        geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(points), 3);

        // update the geometry
        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
    }

    // update controls and animation changes
    controls.update();
	renderer.render(scene, camera);
}

// set gradient colors for a geometry
// from: https://stackoverflow.com/questions/52614371/apply-color-gradient-to-material-on-mesh-three-js
function set_gradient(geometry, colors, axis, reverse) {

    geometry.computeBoundingBox();
  
    var bbox = geometry.boundingBox;
    var size = new THREE.Vector3().subVectors(bbox.max, bbox.min);
  
    var vertexIndices = ['a', 'b', 'c'];
    var face, vertex, normalized = new THREE.Vector3(),
      normalizedAxis = 0;
  
    // for (var c = 0; c < colors.length - 1; c++) {
  
    //     var colorDiff = colors[c + 1].stop - colors[c].stop;
    
    //     for (var i = 0; i < geometry.faces.length; i++) {
    //         face = geometry.faces[i];
    //         for (var v = 0; v < 3; v++) {
    //             vertex = geometry.vertices[face[vertexIndices[v]]];
    //             normalizedAxis = normalized.subVectors(vertex, bbox.min).divide(size)[axis];
    //             if (reverse) {
    //                 normalizedAxis = 1 - normalizedAxis;
    //             }
    //             if (normalizedAxis >= colors[c].stop && normalizedAxis <= colors[c + 1].stop) {
    //                 var localNormalizedAxis = (normalizedAxis - colors[c].stop) / colorDiff;
    //                 face.vertexColors[v] = colors[c].color.clone().lerp(colors[c + 1].color, localNormalizedAxis);
    //             }
    //         }
    //     }
    // }

    colors = [];
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        colors.push(Math.random(), Math.random(), Math.random());
    }
    geometry.setAttribute('color',
        new THREE.BufferAttribute(new Float32Array(colors), 3));
  
}


// call the main function
main();