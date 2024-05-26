
import * as THREE from "three";  
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import FastNoiseLite from "fastnoise-lite";

// three js display variables
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let clock = null;

let camera_height_offset = 0.1;
let use_pointer_controls = true;

// animation variables
let step = 0;
let last_time = 0;
let delta = 0;
let movement_speed = 0.5;

// noise variables
let noise = null;

// aurora settings
let auroras = [];
let num_auroras = 10;
let num_points_per_aurora = 250;
let aurora_scale_inner = 10;
let aurora_scale_outer = 1;
let aurora_width = 0.5;
let aurora_placement_bound1 = {x:-15, y:8, z:-30};
let aurora_placement_bound2 = {x:15, y:12, z:30};

// rock settings
let num_rocks = 150;
let rock_min_size = 0.05;
let rock_max_size = 0.15;
let rock_placement_bound1 = {x:-25, y: 0, z:-25};
let rock_placement_bound2 = {x:25, y:0, z:25};

// star settings
let num_stars = 500;
let star_min_size = 0.2;
let star_max_size = 0.4;
let star_exclusion_bound1 = {x:-150, y:0, z:-150};
let star_exclusion_bound2 = {x:150, y:200, z:150};
let star_inclusion_bound1 = {x:-250, y:0, z:-250};
let star_inclusion_bound2 = {x:250, y:300, z:250};

// terrain variables
let terrain_mesh = null;
let num_terrain_parts = 50;
let num_terrain_octaves = 3;
let terrain_size = 100;
let terrain_scale_inner = 4;
let terrain_scale_outer = 10;
let terrain_flat_center_radius = 10;

// color variables
let sky_color = 0x0c1b2e;
let rock_color = 0x888888;
let star_color = 0xFFFFFF;
let terrain_colors = [
    0xC1AC9D, // sand
    0xD6CCBC, // brighter sand
    0xA0A479, // yellow green
    0x6A854F, // green
    0x62785D, // forest green,
    0xFFFFFF, // snow
];

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
    create_scene_objects();
    animate(0);
};


// create the scene objects
function create_scene_objects() {
    create_auroras();
    create_terrain();
    create_rocks();
    create_stars();
}

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
    camera.position.set(0, camera_height_offset, 1);
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // setup renderer
    renderer = new THREE.WebGLRenderer({antialiasing:true});
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "";
    renderer.domElement.style.height = "";

    // setup controls
    if (use_pointer_controls) {
        controls = new PointerLockControls(camera, renderer.domElement);
        container.addEventListener("click", function() {
            controls.lock();
        });
    } else {
        controls = new TrackballControls(camera, renderer.domElement);
    }

    // setup light
    let ambient_light = new THREE.AmbientLight(0xFFFFFF, 0.05);
    scene.add(ambient_light);
    
    let directional_light = new THREE.DirectionalLight(0xFFFFFF, 0.25);
    directional_light.position.set(0, 2, -1);
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


// function to get the noise value
function get_aurora_noise(a, b, offset) {
    return noise.GetNoise(a*aurora_scale_inner, b*aurora_scale_inner+offset) * aurora_scale_outer;
}


// calculate points for aurora
function calc_aurora_parts(origin_ratio, offset) {

    let points = [];
    let colors = [];

    // calculate point coordinate information based on provided variables
    let x_origin = origin_ratio * Math.abs(aurora_placement_bound2.x - aurora_placement_bound1.x) + aurora_placement_bound1.x;
    let z_dist = Math.abs(aurora_placement_bound2.z - aurora_placement_bound1.z);

    // calculate coordinates for first point
    let z_prev = aurora_placement_bound1.z;
    let noise_val = get_aurora_noise(x_origin, z_prev, offset);
    let x_prev = x_origin + noise_val;

    // width of the aurora mesh
    let prev_width_half = aurora_width * ((noise_val + 1) / 2) / 2;

    let x_left = x_prev - prev_width_half;
    let x_right = x_prev + prev_width_half;

    // back triangle 1
    points.push(x_left, aurora_placement_bound1.y, z_prev);
    points.push(x_left, aurora_placement_bound2.y, z_prev);
    points.push(x_right, aurora_placement_bound1.y, z_prev);
    colors.push(0,1,0,1, 1,1,1,0, 0,1,0,1);

    // back triangle 2
    points.push(x_right, aurora_placement_bound1.y, z_prev);
    points.push(x_left, aurora_placement_bound2.y, z_prev);
    points.push(x_right, aurora_placement_bound2.y, z_prev);
    colors.push(0,1,0,1, 1,1,1,0, 1,1,1,0);

    // calculate coordinates for every other point
    for (let i = 1; i < num_points_per_aurora; i++) {

        let z_next = (i / num_points_per_aurora) * z_dist + aurora_placement_bound1.z;
        let noise_val = get_aurora_noise(x_origin, z_next, offset);
        let x_next = x_origin + noise_val;

        let next_width_half = aurora_width * ((noise_val + 1) / 2) / 2;

        let x_next_left = x_next - next_width_half;
        let x_next_right = x_next + next_width_half;

        let x_prev_left = x_prev - prev_width_half;
        let x_prev_right = x_prev + prev_width_half;

        // calculate faces
        // left triangle 1 
        points.push(x_prev_left, aurora_placement_bound1.y, z_prev);
        points.push(x_next_left, aurora_placement_bound1.y, z_next);
        points.push(x_next_left, aurora_placement_bound2.y, z_next);
        colors.push(0,1,0,1, 0,1,0,1, 1,1,1,0);

        // left triangle 2
        points.push(x_prev_left, aurora_placement_bound1.y, z_prev);
        points.push(x_next_left, aurora_placement_bound2.y, z_next);
        points.push(x_prev_left, aurora_placement_bound2.y, z_prev);
        colors.push(0,1,0,1, 1,1,1,0, 1,1,1,0);

        // right triangle 1
        points.push(x_next_right, aurora_placement_bound1.y, z_next);
        points.push(x_prev_right, aurora_placement_bound1.y, z_prev);
        points.push(x_prev_right, aurora_placement_bound2.y, z_prev);
        colors.push(0,1,0,1, 0,1,0,1, 1,1,1,0);

        // right triangle 2
        points.push(x_next_right, aurora_placement_bound1.y, z_next);
        points.push(x_prev_right, aurora_placement_bound2.y, z_prev);
        points.push(x_next_right, aurora_placement_bound2.y, z_next);
        colors.push(0,1,0,1, 1,1,1,0, 1,1,1,0);

        // bottom triangle 1
        points.push(x_prev_left, aurora_placement_bound1.y, z_prev);
        points.push(x_next_right, aurora_placement_bound1.y, z_next);
        points.push(x_next_left, aurora_placement_bound1.y, z_next);
        colors.push(0,1,0,1, 0,1,0,1, 0,1,0,1);

        // bottom triangle 2
        points.push(x_prev_left, aurora_placement_bound1.y, z_prev);
        points.push(x_prev_right, aurora_placement_bound1.y, z_prev);
        points.push(x_next_right, aurora_placement_bound1.y, z_next);
        colors.push(0,1,0,1, 0,1,0,1, 0,1,0,1);

        // top triangle 1
        points.push(x_prev_left, aurora_placement_bound2.y, z_prev);
        points.push(x_next_left, aurora_placement_bound2.y, z_next);
        points.push(x_next_right, aurora_placement_bound2.y, z_next);
        colors.push(1,1,1,0, 1,1,1,0, 1,1,1,0);

        // top triangle 2
        points.push(x_prev_left, aurora_placement_bound2.y, z_prev);
        points.push(x_next_right, aurora_placement_bound2.y, z_next);
        points.push(x_prev_right, aurora_placement_bound2.y, z_prev);
        colors.push(1,1,1,0, 1,1,1,0, 1,1,1,0);

        z_prev = z_next;
        x_prev = x_next;
        prev_width_half = next_width_half;
    }

    x_left = x_prev - prev_width_half;
    x_right = x_prev + prev_width_half;

    // front triangle 1
    points.push(x_left, aurora_placement_bound1.y, z_prev);
    points.push(x_right, aurora_placement_bound1.y, z_prev);
    points.push(x_left, aurora_placement_bound2.y, z_prev);
    colors.push(0,1,0,1, 0,1,0,1, 1,1,1,0);

    // front triangle 2
    points.push(x_right, aurora_placement_bound1.y, z_prev);
    points.push(x_right, aurora_placement_bound2.y, z_prev);
    points.push(x_left, aurora_placement_bound2.y, z_prev);
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


// function to get the noise value
function get_terrain_noise(a, b, offset) {

    let dist = calc_dist({x:0, y:0}, {x:a, y:b});
    // TODO: multiplier function could be better
    // let dist_scale = Math.log2(0.15 * dist+1);
    // let dist_scale = calc_sigmoid(dist * 2, 10) * 2;
    let dist_scale = dist / (terrain_size / 2);
    
    let noise_val = 0;
    let amp_sum = 0;
    for (let oi = 0; oi < num_terrain_octaves; oi++) {
        let pow = Math.pow(2, oi);
        amp_sum += (1 / pow);
        noise_val += (1 / pow) * (((noise.GetNoise(pow*a*terrain_scale_inner, pow*b*terrain_scale_inner+offset) + 1) / 2));
    }
    noise_val /= amp_sum;

    // use the noise val to determine the color
    let color = null;
    if (noise_val < 0.1) color = terrain_colors[0];
    else if (noise_val < 0.2) color = terrain_colors[1];
    else if (noise_val < 0.5) color = terrain_colors[2];
    else if (noise_val < 0.7) color = terrain_colors[3];
    else if (noise_val < 0.9) color = terrain_colors[4];
    else color = terrain_colors[5];
    
    let rgb = hex_to_rgb(color.toString(16));
    color = [rgb.r/255, rgb.g/255, rgb.b/255];
    
    noise_val *= dist_scale;
    noise_val = Math.pow(noise_val, 2);
    noise_val *= terrain_scale_outer;

    // make a flat circle in the center
    if (dist < terrain_flat_center_radius) {
        noise_val = 0;
    }
    
    // cutoff any negative results
    if (noise_val < 0) {
        noise_val = 0;
    }

    return {
        noise: noise_val,
        color: color
    };
}


// calculate points and items for terrain object
function calc_terrain_parts() {

    let points = [];
    let colors = [];

    for (let xi = 0; xi < num_terrain_parts - 1; xi++) {
        for (let yi = 0; yi < num_terrain_parts - 1; yi++) {

            let x = xi * terrain_size / num_terrain_parts - (terrain_size/2);
            let y = yi * terrain_size / num_terrain_parts - (terrain_size/2);
            let next_x = (xi + 1) * terrain_size / num_terrain_parts - (terrain_size/2);
            let next_y = (yi + 1) * terrain_size / num_terrain_parts - (terrain_size/2);

            let p1 = {x:x, y:y};
            let p2 = {x:next_x, y:y};
            let p3 = {x:next_x, y:next_y};
            let p4 = {x:x, y:next_y};

            let noise1 = get_terrain_noise(p1.x, p1.y, 0);
            let noise2 = get_terrain_noise(p2.x, p2.y, 0);
            let noise3 = get_terrain_noise(p3.x, p3.y, 0);
            let noise4 = get_terrain_noise(p4.x, p4.y, 0);

            // triangle 1
            points.push(p4.x, noise4.noise, p4.y);
            points.push(p2.x, noise2.noise, p2.y);
            points.push(p1.x, noise1.noise, p1.y);
            colors.push(...noise4.color, ...noise2.color, ...noise1.color);

            // triangle 2
            points.push(p4.x, noise4.noise, p4.y);
            points.push(p3.x, noise3.noise, p3.y);
            points.push(p2.x, noise2.noise, p2.y);
            colors.push(...noise4.color, ...noise3.color, ...noise2.color);
        }
    }

    return {
        points: points,
        colors: colors
    };
}


// create terrain mesh
function create_terrain() {

    // create the material for the ground
    let material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        vertexColors: true
    });

    // calculate terrain geometry points and colors
    let terrain_info = calc_terrain_parts();

    // create the geometry and mesh for the line
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(terrain_info.points), 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(terrain_info.colors), 3));
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    let mesh = new THREE.Mesh(geometry, material);
    
    // add the mesh to the scene
    scene.add(mesh)

    terrain_mesh = mesh;
}


// create rock meshes
function create_rocks() {

    // create the material for the rocks
    let material = new THREE.MeshPhongMaterial({
        color: rock_color
    });

    // iterate for specified number of rocks
    for (let ri = 0; ri < num_rocks; ri++) {
        
        // calculate the random size of the geometry
        let size_x = rand_in_range(rock_min_size, rock_max_size);
        let size_y = rand_in_range(rock_min_size, rock_max_size);
        let size_z = rand_in_range(rock_min_size, rock_max_size);

        let x = rand_in_range(rock_placement_bound1.x, rock_placement_bound2.x);
        let y = rand_in_range(rock_placement_bound1.y, rock_placement_bound2.y);
        let z = rand_in_range(rock_placement_bound1.z, rock_placement_bound2.z);

        // place the rock on the terrain
        let intersection = find_vertical_intersection(new THREE.Vector3(x, y, z), terrain_mesh);
        if (intersection !== null) {
            y = intersection.y;
        }

        // create the geometry
        let geometry = new THREE.BoxGeometry(size_x, size_y, size_z);
        geometry.translate(x, y+size_y/2, z);
        
        // add the mesh to the scene
        let mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    }
}


// create star meshes
function create_stars() {

    // create the material for the stars
    let material = new THREE.MeshBasicMaterial({
        color: star_color
    });

    // iterate for specified number of stars
    for (let si = 0; si < num_stars; si++) {
        
        // calculate the random size of the geometry
        let size_x = rand_in_range(star_min_size, star_max_size);
        let size_y = rand_in_range(star_min_size, star_max_size);
        let size_z = rand_in_range(star_min_size, star_max_size);

        let x = rand_in_range(star_inclusion_bound1.x, star_inclusion_bound2.x);
        let y = rand_in_range(star_inclusion_bound1.y, star_inclusion_bound2.y);
        let z = rand_in_range(star_inclusion_bound1.z, star_inclusion_bound2.z);

        // generate new positions for the star until it is outside of the exclusion bound
        let point = {x:x,y:y,z:z};
        let tries = 0;
        let max_tries = 1000;
        while (calc_is_point_in_prism(point, star_exclusion_bound1, star_exclusion_bound2) && tries++ < max_tries) {
            point.x = rand_in_range(star_inclusion_bound1.x, star_inclusion_bound2.x);
            point.y = rand_in_range(star_inclusion_bound1.y, star_inclusion_bound2.y);
            point.z = rand_in_range(star_inclusion_bound1.z, star_inclusion_bound2.z);
        }

        // create the geometry
        let geometry = new THREE.BoxGeometry(size_x, size_y, size_z);
        geometry.translate(point.x, point.y, point.z);
        
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

    // update controls
    if (use_pointer_controls) {

        let sprint_mult = key_map["ShiftLeft"] ? 2 : 1;
        
        // PointerLockControls movement
        if (key_map["KeyW"] || key_map["ArrowUp"]) {
            controls.moveForward(delta * movement_speed * sprint_mult);
        }
        if (key_map["KeyS"] || key_map["ArrowDown"]) {
            controls.moveForward(-delta * movement_speed * sprint_mult);
        }
        if (key_map["KeyA"] || key_map["ArrowLeft"]) {
            controls.moveRight(-delta * movement_speed * sprint_mult);
        }
        if (key_map["KeyD"] || key_map["ArrowRight"]) {
            controls.moveRight(delta * movement_speed * sprint_mult);
        }

        // calculate camera position based on terrain height
        let intersection = find_vertical_intersection(camera.position, terrain_mesh);
        if (intersection !== null) {
            camera.position.setY(intersection.y + camera_height_offset);
        }

    } else {
        controls.update(time - last_time);
    }

    // render the scene
	renderer.render(scene, camera);
    
    last_time = time;
}


// get the vertical intersection of a point and mesh
function find_vertical_intersection(point, mesh) {

    if (point === null || mesh === null) {
        return null;
    }
        
    let up = new THREE.Vector3(0, 1, 0).normalize();
    let down = new THREE.Vector3(0, -1, 0).normalize();
   
    let up_ray = new THREE.Raycaster(point, up);
    let down_ray = new THREE.Raycaster(point, down);
    
    let up_intersection = up_ray.intersectObject(mesh);
    let down_intersection = down_ray.intersectObject(mesh);

    if (up_intersection.length > 0) {
        return up_intersection[0].point;
    } else if (down_intersection.length > 0) {
        return down_intersection[0].point;
    }

    return null;
}


// call the main function
main();