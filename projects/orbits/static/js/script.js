
let stage = null;
let main_layer = null;
let bodies = [];
let anim = null;

let stage_center = null;

// gravitational constant
let g = 0.01;

// callback for when DOM is loaded
document.addEventListener("DOMContentLoaded", function() { 

    // setup the stage
    create_stage();

    // create the objects
    draw(main_layer);

    // animate the objects
    animate();
});


// create the stage
function create_stage() {

    // get the containers of the stages and their parents
    let stage_container = document.getElementById("stage-container");
    let parent = stage_container.parentElement;

    // get necessary dimensions of the container cells
    let container_width = parent.offsetWidth;
    let container_height = parent.offsetHeight;

    let main_x_offset = container_width / 2;
    let main_y_offset = container_height / 2;

    // create the stages
    stage = new Konva.Stage({
        container: "stage-container",
        width: Math.floor(container_width) - 1, // slightly underestimate size to prevent display bugs
        height: Math.floor(container_height) - 1,
        x: main_x_offset,
        y: main_y_offset
    });

    main_layer = new Konva.Layer();
    stage.add(main_layer);

    // calculate the stage center point
    stage_center = {x: 0, y: 0};
}


// animate circles
function animate() {

    
    anim = new Konva.Animation(function(frame) {
        let time = frame.time;
        let diff = frame.timeDiff;
        let frame_rate = frame.frameRate;

        // iterate over every body
        for (let bi = 0; bi < bodies.length; bi++) {
            let body1 = bodies[bi];
            
            // do not update this position if it is static
            if (body1.static) {
                continue;
            }

            let accel = {x:0, y:0};

            for (let bj = 0; bj < bodies.length; bj++) {
                if (bj === bi) {
                    continue;
                }

                let body2 = bodies[bj];
                accel = calc_point_add(accel, calc_acceleration(body1, body2));
            }

            body1.velocity = calc_point_add(body1.velocity, calc_point_mult_scalar(accel, diff));
            body1.position = calc_point_add(body1.position, calc_point_mult_scalar(body1.velocity, diff));
            body1.shape.position(body1.position);
        }

    }, main_layer);
    
    anim.start();
}

// draw objects on the stage
function draw(parent) {

    let body1 = {
        position: {...stage_center},
        radius: 20,
        fill: "white",
        mass: 100,
        velocity: {x:0, y:0},
        static: true,
        shape: null
    };
    draw_body(body1, parent);
    bodies.push(body1);

    let body2 = {
        position: {x:stage_center.x + 50, y:stage_center.y},
        radius: 10,
        fill: "red",
        mass: 1,
        velocity: {x:0, y:-0.01},
        static: false,
        shape: null
    };
    draw_body(body2, parent);
    bodies.push(body2);

    let orbit_vel = calc_orbital_velocity(body2, body1);
    body2.velocity.y = orbit_vel;
}


// adds a shape to a parent for a given body
function draw_body(body, parent) {

    // remove previous shape if it exists
    if (body.shape != null) {
        body.shape.destroy();
    }

    // construct a new shape and add it to the provided parent
    let shape = new Konva.Circle({
        x: body.position.x,
        y: body.position.y,
        radius: body.radius,
        fill: body.fill
    });
    parent.add(shape);

    // store the new shape
    body.shape = shape;
}


// calculate force of gravity between two bodies
function calc_force_gravity(body1, body2) {

    let dist = calc_dist(body1.position, body2.position);
    return g * body1.mass * body2.mass / (dist * dist);
}


// calculate acceleration due to gravity
function calc_acceleration(body1, body2) {

    if (points_eq(body1.position, body2.position, 1)) {
        return {x:0, y:0};
    }

    let direction = calc_normalize(calc_point_sub(body2.position, body1.position));
    let gravity = calc_force_gravity(body1, body2);

    let accel = calc_point_mult_scalar(direction, gravity);
    return accel;
}


// calculate orbital velocity (body1 is orbiting body2)
function calc_orbital_velocity(body1, body2) {
    return Math.sqrt(g * body1.mass * body2.mass / calc_dist(body1.position, body2.position));
}