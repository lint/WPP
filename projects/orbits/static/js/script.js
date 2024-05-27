
let stage = null;
let tracer_layer = null;
let body_layer = null;
let bodies = [];
let anim = null;

let stage_center = null;

let show_tracers = true;
let tracer_max_points = 10000;

// track number of animation calls
let tick = 0;

// gravitational constant
let g = 0.0001;

// callback for when DOM is loaded
document.addEventListener("DOMContentLoaded", function() { 

    // setup the stage
    create_stage();

    // create the objects
    draw();

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

    tracer_layer = new Konva.Layer();
    body_layer = new Konva.Layer();

    stage.add(tracer_layer);
    stage.add(body_layer);

    // calculate the stage center point
    stage_center = {x: 0, y: 0};
}


// animate circles
function animate() {

    
    anim = new Konva.Animation(function(frame) {
        let time = frame.time;
        let diff = frame.timeDiff;
        let frame_rate = frame.frameRate;

        tick++;

        // iterate over every body
        for (let bi = 0; bi < bodies.length; bi++) {
            let body1 = bodies[bi];
            
            // do not update this position if it is static
            if (!body1.affected_by_gravity) {
                continue;
            }

            // calculate the acceleration for the current body using all other bodies
            let accel = {x:0, y:0};
            for (let bj = 0; bj < bodies.length; bj++) {
                let body2 = bodies[bj];

                if (bj === bi || !body2.influences_gravity) {
                    continue;
                }

                accel = calc_point_add(accel, calc_acceleration(body1, body2));
            }

            // calculate new velocity and position for the body
            // body1.velocity = calc_point_add(body1.velocity, calc_point_mult_scalar(accel, diff));
            // body1.position = calc_point_add(body1.position, calc_point_mult_scalar(body1.velocity, diff));
            body1.velocity = calc_point_add(body1.velocity, accel);
            body1.position = calc_point_add(body1.position, body1.velocity);
            body1.shape.position(body1.position);

            // update the tracer points
            if (show_tracers) {

                if (body1.tracer_points.length >= tracer_max_points) {
                    body1.tracer_points.splice(0, body1.tracer_points.length - tracer_max_points + 1);
                }
                body1.tracer_points.push({...body1.position});
                body1.tracer_shape.points(flatten_points(body1.tracer_points));
            }
        }

    });
    
    anim.start();
}


// draw objects on the stage
function draw() {

    let body1 = create_body(1000, {...stage_center}, {x:0, y:0}, 10, "white", false, true, null);
    let body2 = create_body(100, {x:stage_center.x + 50, y:stage_center.y}, {x:0, y:0}, 10, "red", true, true, body1);
    let body3 = create_body(100, {x:stage_center.x + 100, y:stage_center.y}, {x:0, y:0}, 10, "red", true, true, body1);
}


// create new body object
function create_body(mass=1, position={x:0, y:0}, velocity={x:0, y:0}, radius=10, fill="white", 
    affected_by_gravity=true, influences_gravity=true, orbiting_body=null) {
    
    console.log("mass: ", mass, "position: ", position, "velocity: ", velocity, "radius: ", radius, "fill: ", fill, "affected_by_grav:", affected_by_gravity, "influences_gravity: ", influences_gravity, "orbiting_body: ", orbiting_body)

    // create the body object
    let body = {
        position: position,
        radius: radius,
        fill: fill,
        mass: mass,
        velocity: velocity,
        affected_by_gravity: affected_by_gravity,
        influences_gravity: influences_gravity,
        shape: null,
        tracer_points: [],
        tracer_shape: null
    };

    // set the velocity to be orbiting around a provided body
    if (orbiting_body !== null) {
        let speed = calc_orbital_velocity(body, orbiting_body);
        let direction = calc_perpendicular(calc_point_sub(orbiting_body.position, body.position));

        body.velocity = calc_point_mult_scalar(direction, speed);
    }

    // draw the created body
    draw_body(body);

    // add the body to the bodies array
    bodies.push(body);

    return body;
}


// draw a body to the stage
function draw_body(body) {

    // remove previous shape if it exists
    if (body.shape != null) {
        body.shape.destroy();
    }
    if (body.tracer_shape != null) {
        body.tracer_shape.destroy();
    }

    // construct a new shape for the body and add it to the provided parent
    let body_shape = new Konva.Circle({
        x: body.position.x,
        y: body.position.y,
        radius: body.radius,
        fill: body.fill
    });

    // construct a new shape for the body's tracer
    let tracer_shape = new Konva.Line({
        points: flatten_points(body.tracer_points),
        stroke: "blue",
        strokeWidth: 2,
        closed: false,
        lineJoin: "round",
        lineCap: "round"
    });

    // add the shapes to the parent
    body_layer.add(body_shape);
    tracer_layer.add(tracer_shape);

    // store the new shapes
    body.shape = body_shape;
    body.tracer_shape = tracer_shape;
}


// toggle the show tracers variable
function toggle_show_tracers() {
    show_tracers = !show_tracers;

    if (show_tracers) {
        tracer_layer.show();
    } else {
        tracer_layer.hide();
    }
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