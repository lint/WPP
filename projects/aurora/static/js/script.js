
import * as THREE from "three";  
// import { TrackballControls } from "three/addons/controls/TrackballControls.js";
// import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import FastNoiseLite from "fastnoise-lite";

// three js display variables
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let clock = null;

// animation variables
let step = 0;
let last_time = 0;
let delta = 0;
let movement_speed = 0.5;

// noise variables
let noise = null;

// scene object variables
let auroras = [];
let num_auroras = 5;
let num_points_per_aurora = 100;
let num_rocks = 100;
let rock_min_size = 0.05;
let rock_max_size = 0.15;
let rock_placement_bound1 = {x:-50, y: 0, z:-50};
let rock_placement_bound2 = {x:50, y:0, z:50};

// aurora coordinate positioning
let x_start = -2;
let x_end = 2;
let y_start = 1;
let y_end = 2;
let z_start = -4;
let z_end = 4;

// color variables
let sky_color = 0x0c1b2e;
let ground_color = 0x574032;
let rock_color = 0x444444;

// movement control variables for PointerLockControls
let key_map = {};
let on_key = function (e) {
    key_map[e.code] = e.type === "keydown"
};
document.addEventListener("keydown", on_key, false);
document.addEventListener("keyup", on_key, false);

// callback for when DOM is loaded - main function
// document.addEventListener("DOMContentLoaded", function() { 
function main() {
    setup_noise();
    create_display();
    create_auroras();
    create_terrain();
    create_rocks();
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
    scene.background = new THREE.Color(sky_color);

    // setup camera
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.001, 1000);
    camera.position.set(0,0.15,1);
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // setup renderer
    renderer = new THREE.WebGLRenderer({antialiasing:true});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "";
    renderer.domElement.style.height = "";

    // setup trackball controls
    // controls = new TrackballControls(camera, renderer.domElement);
    controls = new PointerLockControls(camera, renderer.domElement);
    container.addEventListener("click", function() {
        controls.lock();
    });

    // setup light
    let ambient_light = new THREE.AmbientLight(0xFFFFFF, 0.1);
    scene.add(ambient_light);
    
    let directional_light = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directional_light.position.set(0, 2, -2);
    scene.add(directional_light);

    // setup clock
    clock = new THREE.Clock();
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
    for (let i = 1; i < num_points_per_aurora; i++) {

        let z_next = (i / num_points_per_aurora) * z_dist + z_start;
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
    // material.depthTest = false;

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
function create_terrain() {

    // create the material and geometry for the ground
    let material = new THREE.MeshPhongMaterial({
        color: ground_color,
        side: THREE.DoubleSide
    });
    let geometry = new THREE.PlaneGeometry(100, 100);

    // create and rotate the mesh
    let mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -90 * Math.PI / 180;

    // add the mesh to the scene
    scene.add(mesh)
}


// create rock meshes
function create_rocks() {
    
    // create the material and geometry for the rocks
    let material = new THREE.MeshPhongMaterial({
        color:rock_color
    });

    let rock_size = 1;
    
    // iterate for specified number of rocks
    for (let ri = 0; ri < num_rocks; ri++) {
        
        // create, translate, and resize the geometry
        let geometry = new THREE.BoxGeometry(rock_size, rock_size, rock_size);
        
        let x = rand_in_range(rock_placement_bound1.x, rock_placement_bound2.x);
        let y = rand_in_range(rock_placement_bound1.y, rock_placement_bound2.y);
        let z = rand_in_range(rock_placement_bound1.z, rock_placement_bound2.z);
        let scale_x = rand_in_range(rock_min_size, rock_max_size);
        let scale_y = rand_in_range(rock_min_size, rock_max_size);
        let scale_z = rand_in_range(rock_min_size, rock_max_size);
        
        geometry.translate(x, y+rock_size/2, z);
        geometry.scale(scale_x, scale_y, scale_z);
        
        // add the mesh to the scene
        let mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }
}


// perform an animation
function animate(time) {
    time *= 0.01; // convert time to seconds
    step += 0.10;
    delta = clock.getDelta();

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

    // PointerLockControls movement
    if (key_map["KeyW"] || key_map["ArrowUp"]) {
        controls.moveForward(delta * movement_speed);
    }
    if (key_map["KeyS"] || key_map["ArrowDown"]) {
        controls.moveForward(-delta * movement_speed);
    }
    if (key_map["KeyA"] || key_map["ArrowLeft"]) {
        controls.moveRight(-delta * movement_speed);
    }
    if (key_map["KeyD"] || key_map["ArrowRight"]) {
        controls.moveRight(delta * movement_speed);
    }

    // update controls and animation changes
    // controls.update(time - last_time);
	renderer.render(scene, camera);
    
    last_time = time;
}


// call the main function
main();