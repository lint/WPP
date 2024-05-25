
import * as THREE from "three";  
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
// import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
// import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import FastNoiseLite from "fastnoise-lite";

// three js display variables
let scene = null;
let camera = null;
let renderer = null;
let controls = null;

// animation variables
let step = 0;
let last_time = 0;

// noise variables
let noise = null;

// aurora variables
let auroras = [];
let num_auroras = 5;
let num_points = 50;

// aurora coordinate positioning
let x_start = -1;
let x_end = 1;
let y_start = -1;
let y_end = 1;
let z_start = -1;
let z_end = 1;


// callback for when DOM is loaded - main function
// document.addEventListener("DOMContentLoaded", function() { 
function main() {
    setup_noise();
    create_display();
    create_auroras();
    // create_terrain();
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
    scene.background = new THREE.Color( 0x444444 );

    // setup camera
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(0,0,2);
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // setup renderer
    renderer = new THREE.WebGLRenderer({antialiasing:true});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "";
    renderer.domElement.style.height = "";

    // setup trackball controls
    controls = new TrackballControls(camera, renderer.domElement);
    // controls = new PointerLockControls(camera, renderer.domElement);
    // container.addEventListener("click", function() {
    //     controls.lock();
    // });

    // setup light
    // let light = new THREE.AmbientLight(0xFFFFFF, 1);
    // scene.add(light);
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


// calculate points for aurora
function calc_aurora_parts(origin_ratio, offset) {

    let points = [];
    let colors = [];

    // scale for the noise function
    let scale = 100;

    // function to get the noise value
    function get_noise(a, b, scale, offset) {
        return noise.GetNoise(a*scale, b*scale+offset) / 5;
    }

    // width of the aurora mesh
    let left_width = 0.01;
    let right_width = 0.01;

    // calculate point coordinate information based on provided variables
    let x_origin = origin_ratio * Math.abs(x_end - x_start) + x_start;
    let z_dist = Math.abs(z_end - z_start);

    // calculate coordinates for first point
    let z_prev = z_start;
    let x_prev = x_origin + get_noise(x_origin, z_prev, scale, offset);

    let x_left = x_prev - left_width;
    let x_right = x_prev + right_width;

    // back triangle 1
    points.push(x_left, y_start, z_prev);
    points.push(x_left, y_end, z_prev);
    points.push(x_right, y_start, z_prev);
    colors.push(0,1,0,1, 1,1,1,0, 0,1,0,1);

    // back triangle 2
    points.push(x_right, y_start, z_prev);
    points.push(x_left, y_end, z_prev);
    points.push(x_right, y_end, z_prev);
    colors.push(0,1,0,1, 1,1,1,0, 1,1,1,0);

    // calculate coordinates for every other point
    for (let i = 1; i < num_points; i++) {

        let z_next = (i / num_points) * z_dist + z_start;
        let noise_val = get_noise(x_origin, z_next, scale, offset);
        let x_next = x_origin + noise_val;

        let x_next_left = x_next - left_width;
        let x_next_right = x_next + right_width;

        let x_prev_left = x_prev - left_width;
        let x_prev_right = x_prev + right_width;

        // calculate faces
        // left triangle 1 
        points.push(x_prev_left, y_start, z_prev);
        points.push(x_next_left, y_start, z_next);
        points.push(x_next_left, y_end, z_next);
        colors.push(0,1,0,1, 0,1,0,1, 1,1,1,0);

        // left triangle 2
        points.push(x_prev_left, y_start, z_prev);
        points.push(x_next_left, y_end, z_next);
        points.push(x_prev_left, y_end, z_prev);
        colors.push(0,1,0,1, 1,1,1,0, 1,1,1,0);

        // right triangle 1
        points.push(x_next_right, y_start, z_next);
        points.push(x_prev_right, y_start, z_prev);
        points.push(x_prev_right, y_end, z_prev);
        colors.push(0,1,0,1, 0,1,0,1, 1,1,1,0);

        // right triangle 2
        points.push(x_next_right, y_start, z_next);
        points.push(x_prev_right, y_end, z_prev);
        points.push(x_next_right, y_end, z_next);
        colors.push(0,1,0,1, 1,1,1,0, 1,1,1,0);

        // bottom triangle 1
        points.push(x_prev_left, y_start, z_prev);
        points.push(x_next_right, y_start, z_next);
        points.push(x_next_left, y_start, z_next);
        colors.push(0,1,0,1, 0,1,0,1, 0,1,0,1);

        // bottom triangle 2
        points.push(x_prev_left, y_start, z_prev);
        points.push(x_prev_right, y_start, z_prev);
        points.push(x_next_right, y_start, z_next);
        colors.push(0,1,0,1, 0,1,0,1, 0,1,0,1);

        // top triangle 1
        points.push(x_prev_left, y_end, z_prev);
        points.push(x_next_left, y_end, z_next);
        points.push(x_next_right, y_end, z_next);
        colors.push(1,1,1,0, 1,1,1,0, 1,1,1,0);

        // top triangle 2
        points.push(x_prev_left, y_end, z_prev);
        points.push(x_next_right, y_end, z_next);
        points.push(x_prev_right, y_end, z_prev);
        colors.push(1,1,1,0, 1,1,1,0, 1,1,1,0);

        z_prev = z_next;
        x_prev = x_next;
    }

    x_left = x_prev - left_width;
    x_right = x_prev + right_width;

    // front triangle 1
    points.push(x_left, y_start, z_prev);
    points.push(x_right, y_start, z_prev);
    points.push(x_left, y_end, z_prev);
    colors.push(0,1,0,1, 0,1,0,1, 1,1,1,0);

    // front triangle 2
    points.push(x_right, y_start, z_prev);
    points.push(x_right, y_end, z_prev);
    points.push(x_left, y_end, z_prev);
    colors.push(0,1,0,1, 1,1,1,0, 1,1,1,0);

    return {
        points:points,
        colors:colors
    };
}


// create and store shapes for each aurora line
function create_auroras() {

    let material = new THREE.MeshBasicMaterial({
        // color:0x00FF00,
        vertexColors: true,
        transparent : true,
        // vertexAlphas:true,
        side: THREE.FrontSide
    });
    material.depthTest = false;

    // repeat process for given number of aurora lines
    for (let i = 0; i < num_auroras; i++) {

        // calculate starting point for the current aurora
        let origin_ratio = i / num_auroras + (1 / num_auroras / 2);

        // iterate for each point to construct the line
        let aurora_info = calc_aurora_parts(origin_ratio, 0);

        // create the geometry and mesh for the line
        let geometry = new THREE.BufferGeometry().setFromPoints(aurora_info.points);
        geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(aurora_info.colors), 4));
        let mesh = new THREE.Mesh(geometry, material);

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


// create terrain mesh
// function create_terrain() {

//     let material = new THREE.MeshBasicMaterial({
//         color:0xFF0000,
//         side:THREE.DoubleSide
//     });
//     let geometry = new THREE.PlaneGeometry(2, 2);

//     let mesh = new THREE.Mesh(geometry, material)
//     mesh.rotation.x = -90 * Math.PI / 180;
//     scene.add(mesh)
// }


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
        let aurora_info = calc_aurora_parts(aurora.origin_ratio, step);
        geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(aurora_info.points), 3);

        // update the geometry
        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
    }

    // update controls and animation changes
    controls.update(time - last_time);
	renderer.render(scene, camera);
    
    last_time = time;
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