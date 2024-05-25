
import * as THREE from "three";  
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

// three js display variables
let scene = null;
let camera = null;
let renderer = null;
let controls = null;

let line_geo = null;

// konva js display variables
// let stage = null;
// let main_layer = null;
// let anim = null;
// let lines = [];
let auroras = [];
let num_auroras = 1;

let num_points = 100;
let max_dist = 10;

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

// let stage_center = null;


// callback for when DOM is loaded
document.addEventListener("DOMContentLoaded", function() { 

    // setup the stage
    // create_stage();

    // // initialize the aurora lines and animate them
    // initialize_lines();
    // animate_stage();

    create_display();
    setup_scene();
    create_auroras();
    animate(0);
});


// execute when the window is resized
// window.addEventListener("resize", function(event) {
    
//     resize_display_if_needed();

// }, true);


// setup three scene variables
function create_display() {

    let container = document.getElementById("stage-container");

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "";
    renderer.domElement.style.height = "";

    controls = new TrackballControls(camera, renderer.domElement);
}


// resize the display to current parent size
function resize_display_if_needed() {

    let container = document.getElementById("stage-container");

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


// create objects and place them within the scene
function setup_scene() {
    
    camera.position.set(0,0.5,-2);
    camera.up = new THREE.Vector3(0,0,1);
    camera.lookAt(new THREE.Vector3(0,0,0));

    let light = new THREE.AmbientLight(0xFFFFFF, 1);
    scene.add(light);

    let red_material = new THREE.MeshBasicMaterial({color: 0xff0000});
    let green_material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    let blue_material = new THREE.LineBasicMaterial({color: 0x0000ff});
    let vertex_material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        // wireframe: true,
        transparent: true,
        opacity: 0.5
    });

    let plane_geo = new THREE.PlaneGeometry(2, 2);
    set_gradient(plane_geo, cols, 'z', false);
    let floor = new THREE.Mesh(plane_geo, vertex_material)
    floor.rotation.x = -90 * Math.PI / 180;
    scene.add(floor)

    let points = [];



    line_geo = new THREE.BufferGeometry().setFromPoints( points );
    let line = new THREE.Line(line_geo, blue_material);
    scene.add(line);

}


// create and store shapes for each aurora line
function create_auroras() {

    let material = new THREE.MeshBasicMaterial({color:0x00FF00});

    // repeat process for given number of aurora lines
    for (let i = 0; i < num_auroras; i++) {

        // iterate for each point to construct the line
        let points = [];
        for (let i = 0; i < num_points; i++) {
    
            let x = max_dist * i / num_points;
            let z = Math.sin(x);
            
            points.push(new THREE.Vector3(x, 0.1, z));
        }

        // create the geometry and mesh for the line
        let geometry = new THREE.BufferGeometry().setFromPoints(points);
        let mesh = new THREE.Line(geometry, material);

        // store the geometry and mesh
        auroras.push({
            geometry: geometry,
            mesh: mesh
        });

        // add the aurora to the scene
        scene.add(mesh);
    }

    console.log(auroras)
}


// perform an animation
function animate(time) {
    time *= 0.001; // convert time to seconds

    // request the next animation frame
    requestAnimationFrame(animate);

    // resize the scene if window size has changed
    resize_display_if_needed();

    // iterate over every stored aurora
    for (let ai = 0; ai < auroras.length; ai++) {
        

        let geometry = auroras[ai].geometry;

        for (let pi = 0; pi < geometry.attributes.position.count; pi++) {
            let x = max_dist * pi / num_points;
            let z = Math.sin(x+time);
    
            geometry.attributes.position.setXYZ(pi, x, 0.1, z);
        }

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
  


// create the stage
// function create_stage() {

//     let stage_initial_size = 500;

//     // get the containers of the stages and their parents
//     let stage_container = document.getElementById("stage-container");
//     let parent = stage_container.parentElement;

//     // get necessary dimensions of the container cells
//     let container_width = parent.offsetWidth;
//     let container_height = parent.offsetHeight;

//     // container_width = 500;
//     // container_height = 500;

//     // // determine the scale for the stage
//     // let scale = Math.min(1, container_height / container_width);
//     // if (stage_initial_size < container_width) {
//     //     scale *= stage_initial_size / container_width;
//     // }

//     // // determine offset to place graph in the middle of the stage
//     // let main_x_offset = (container_width - container_width * scale) / 2;
//     // let main_y_offset = (container_height - container_width * scale) / 2;
//     let main_x_offset = container_width / 2;
//     let main_y_offset = container_height / 2;

//     // create the stages
//     stage = new Konva.Stage({
//         container: "stage-container",
//         width: Math.floor(container_width) - 1, // slightly underestimate size to prevent display bugs
//         height: Math.floor(container_height) - 1,
//         // scale: {x:scale, y:scale},
//         x: main_x_offset,
//         y: main_y_offset
//     });

//     main_layer = new Konva.Layer();
//     stage.add(main_layer);

//     // calculate the stage center point
//     stage_center = {x: 0, y: 0};
// }


// // animate the stage
// function animate_stage() {

//     let num_up_lines = 15;
//     let up_dist = 40;
//     let colors = interpolate_colors("rgba(0,255,0,1)", "rgba(255,255,255,0.5)", num_up_lines);

//     // define the animation
//     anim = new Konva.Animation(function(frame) {

//         // animation variables
//         let time = frame.time;
//         let diff = frame.timeDiff;
//         let frame_rate = frame.frameRate;

//         // reset the layer
//         main_layer.destroyChildren();

//         // iterate over every line object
//         for (let li = 0; li < lines.length; li++) {
//             let line_data = lines[li];

//             // create new shifts to move down the wave
//             line_data.shifts = line_data.shifts.map(shift => shift += diff / 50);

//             // recalculate the list of points
//             let points = [];
//             for (let i = 0; i < num_points; i++) {
                
//                 let x =  max_dist * i / num_points;
//                 let y = calc_sins(line_data.amps, line_data.periods, line_data.shifts, line_data.multiplier, x);
                
//                 let point = {
//                     x:x,
//                     y:y
//                 };
//                 points.push(point);
//             }
            
//             // transform the points
//             let trans_points = points.map(point => line_data.transform.point(point));
//             line_data.orig_points = points;
//             line_data.trans_points = trans_points;

//             let shape = new Konva.Line({
//                 points: flatten_points(trans_points),
//                 stroke: "white",
//                 strokeWidth: 2,
//                 lineJoin: "round"
//             });

//             main_layer.add(shape);

//             // method 1 for generating aurora - create many duplicate lines above base line
//             for (let j = 0; j < num_up_lines; j++) {

//                 let up_points = line_data.trans_points.map(point => {return {x:point.x, y:point.y-(j * up_dist / num_up_lines)}})
//                 let up_line = new Konva.Line({
//                     points: flatten_points(up_points),
//                     stroke: colors[j],
//                     strokeWidth: 4,
//                     lineJoin: "round",
//                     lineCap: "round",
//                     closed:false,
//                 });

//                 main_layer.add(up_line);
//             }

//             // method 2 for generating aurora - create rects for top and base line, then fill with gradient
//             // for (let i = 0; i < trans_points.length -2; i++) {
//             //     let point1 = trans_points[i];
//             //     let point2 = trans_points[i + 1];
//             //     let point3 = trans_points[i + 2];
    
//             //     let rect_path = [
//             //         {x:point1.x, y:point1.y-num_up_lines},
//             //         {x:point2.x, y:point2.y-num_up_lines},
//             //         point2,
//             //         point1
//             //     ];
    
//             //     let rect_path2 = [
//             //         calc_midpoint({x:point1.x, y:point1.y-num_up_lines}, {x:point2.x, y:point2.y-num_up_lines}),
//             //         calc_midpoint({x:point2.x, y:point2.y-num_up_lines}, {x:point3.x, y:point3.y-num_up_lines}),
//             //         calc_midpoint(point2, point3),
//             //         calc_midpoint(point1, point2)
//             //     ];
    
//             //     let rect = new Konva.Line({
//             //         points: flatten_points(rect_path),
//             //         lineJoin: "round",
//             //         closed:true,
//             //         fillLinearGradientStartPoint: calc_midpoint(rect_path[2], rect_path[3]),
//             //         fillLinearGradientEndPoint: calc_midpoint(rect_path[0], rect_path[1]),
//             //         fillLinearGradientColorStops: [0, 'rgba(0,255,0,0.90)', 1, 'rgba(255,255,255,0.5)'],
//             //     });
//             //     main_layer.add(rect);
    
//             //     rect = new Konva.Line({
//             //         points: flatten_points(rect_path2),
//             //         lineJoin: "round",
//             //         closed:true,
//             //         fillLinearGradientStartPoint: calc_midpoint(rect_path2[2], rect_path2[3]),
//             //         fillLinearGradientEndPoint: calc_midpoint(rect_path2[0], rect_path2[1]),
//             //         fillLinearGradientColorStops: [0, 'rgba(0,255,0,0.90)', 1, 'rgba(255,255,255,0.6)'],
//             //     });
//             //     main_layer.add(rect);
//             // }
//         }   
        
//     }, main_layer);
    
//     anim.start();
// }


// // create initial lines
// function initialize_lines() {

//     let num_lines = 1;
   
//     for (let li = 0; li < num_lines; li++) {

//         // define sin function variables
//         let amps = [2, 0.5];
//         let periods = [0.05, 0.1];
//         let shifts = [0, 0];
//         let mult = 3;
        
//         // get points using the sin function
//         let points = [];
//         for (let i = 0; i < num_points; i++) {
            
//             let x = max_dist * i / num_points;
//             let y = calc_sins(amps, periods, shifts, mult, x);
            
//             let point = {
//                 x:x,
//                 y:y
//             };
//             points.push(point);
//         }
        
//         // transform the points
//         let transform = new Konva.Transform().skew(0, -1).rotate(30 * Math.PI / 180);
//         let transformed_points = points.map(point => transform.point(point));

//         // store data in an object
//         let data = {
//             orig_points: points,
//             transform: transform,
//             trans_points: transformed_points,
//             amps: amps,
//             periods: periods,
//             shifts: shifts,
//             multiplier: mult,
//         };

//         lines.push(data);
//     }

// }


// // calculate a summed sin method with given amplitudes, periodicity factors, and x value
// function calc_sins(amps, periods, shifts, a, x) {

//     let result = 0;

//     // if (amps.length !== periods.length !== shifts.length) {
//     //     return result;
//     // }

//     for (let i = 0; i < amps.length; i++) {
//         result += amps[i] * Math.sin(periods[i] * (shifts[i] + x));
//     }

//     result *= a;

//     return result;
// }
