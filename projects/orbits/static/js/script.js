
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
let g = 0.01;

// store planets
let planets = [

];

// scale parameters for relative sizing and distances
let body_radius_scale = (x) => Math.log(x/2+1)*10;
let body_dist_scale = 1000;
let body_mass_scale = 1;

// variables to support panning on stages
let pan_start_pointer_pos = null;
let pan_start_stage_pos = null;
let is_panning = false;
let is_pan_attempted = false;
let stage_scale_by = 1.05;
const pan_min_dist = 5;

let can_pan_enabled = true;
let can_zoom_enabled = true;


// callback for when DOM is loaded
document.addEventListener("DOMContentLoaded", function() { 

    // setup the stage
    create_stage();

    // create the objects in the solar system
    create_solar_system();

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

    // setup callbacks for the main stage
    stage.on("mousedown.pan", panning_stage_mousedown);
    stage.on("mousemove.pan", panning_stage_mousemove);
    stage.on("mouseleave.pan", panning_stage_mouseleave);
    stage.on("mouseup.pan", panning_stage_mouseup);
    stage.on("wheel.zoom", zooming_stage_wheel);
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


// create bodies for each planet in the solar system
function create_solar_system() {

    let sun = create_body({
        mass: 333000, 
        position: {...stage_center},
        affected_by_gravity: false,
        influences_gravity: true,
    }, {
        radius: 109,
        fill: "white", 
    });

    let mercury = create_body({
        mass: 0.055, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 0.3829,
        fill: "#8C8686", 
    }, {
        body: sun,
        perigee_distance: 0.307499,
        apogee_distance: 0.466697,
        angle: 29.124 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });

    let venus = create_body({
        mass: 0.902, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 0.9499,
        fill: "#ECE9E0", 
    }, {
        body: sun,
        perigee_distance: 0.718440,
        apogee_distance: 0.728213,
        angle: 54.884 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });

    let earth = create_body({
        mass: 1, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 1,
        fill: "blue", 
    }, {
        body: sun,
        perigee_distance: 1,
        apogee_distance: 1,
        angle: 0, 
        clockwise: true,
        starting_percent: 0
    });

    let mars = create_body({
        mass: 0.107, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 1,
        fill: "#C5966D", 
    }, {
        body: sun,
        perigee_distance: 1.3814,
        apogee_distance: 1.66621,
        angle: 286.5 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });

    let jupiter = create_body({
        mass: 317.8, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 10.973,
        fill: "#B69783", 
    }, {
        body: sun,
        perigee_distance: 4.9506,
        apogee_distance: 5.4570,
        angle: 273.867 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });

    let saturn = create_body({
        mass: 95.159, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 9.1402,
        fill: "#EAC881", 
    }, {
        body: sun,
        perigee_distance: 9.0412,
        apogee_distance: 10.1238,
        angle: 339.392 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });

    let uranus = create_body({
        mass: 14.536, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 4.007,
        fill: "#C5DEEB", 
    }, {
        body: sun,
        perigee_distance: 18.2861,
        apogee_distance: 20.0965,
        angle: 96.998857 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });

    let neptune = create_body({
        mass: 17.147, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 3.883,
        fill: "#A0C0CF", 
    }, {
        body: sun,
        perigee_distance: 29.81,
        apogee_distance: 30.33,
        angle: 273.187 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });

    let pluto = create_body({
        mass: 0.00218, 
        affected_by_gravity: true,
        influences_gravity: true,
    }, {
        radius: 0.1868,
        fill: "#C0B7A8", 
    }, {
        body: sun,
        perigee_distance: 29.658,
        apogee_distance: 49.305,
        angle: 113.834 * Math.PI / 180, 
        clockwise: true,
        starting_percent: 0
    });
}


// create new body object
function create_body(body_info, display_info, orbit_info=null) {

    // get body info values if they are present
    let mass = "mass" in body_info ? body_info.mass : 1;
    let position = "position" in body_info ? body_info.position : {x:0, y:0};
    let velocity = "velocity" in body_info ? body_info.velocity : {x:0, y:0};
    let affected_by_gravity = "affected_by_gravity" in body_info ? body_info.affected_by_gravity : true;
    let influences_gravity = "influences_gravity" in body_info ? body_info.influences_gravity : true;

    // get display info values if they are present
    let radius = "radius" in display_info ? display_info.radius : 10;
    let fill = "fill" in display_info ? display_info.fill : "white";
    
    // create the body object
    let body = {
        mass: mass * body_mass_scale,
        position: position,
        radius: body_radius_scale(radius),
        fill: fill,
        velocity: velocity,
        affected_by_gravity: affected_by_gravity,
        influences_gravity: influences_gravity,
        shape: null,
        tracer_points: [],
        tracer_shape: null
    };

    if (orbit_info != null && orbit_info.body != null) {

        let angle = "angle" in orbit_info ? orbit_info.angle : 0;
        let clockwise = "clockwise" in orbit_info ? orbit_info.clockwise : true;
        let apogee_distance = "apogee_distance" in orbit_info ? orbit_info.apogee_distance : 50;
        let perigee_distance = "perigee_distance" in orbit_info ? orbit_info.perigee_distance : 50;
        let starting_percent = "starting_percent" in orbit_info ? orbit_info.starting_percent : 1;

        apogee_distance *= body_dist_scale;
        perigee_distance *= body_dist_scale;

        let orbit = calc_initial_orbit(body.mass, orbit_info.body, perigee_distance, apogee_distance, angle, starting_percent, clockwise, true);
        body.velocity = orbit.velocity;
        body.position = orbit.position;
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


// calculate orbital velocity for a given body
function calc_initial_orbit(orbiting_mass, orbited_body, perigee_distance, apogee_distance, rotation, starting_percent, clockwise=true) {

    let position = calc_point_on_circle(orbited_body.position, perigee_distance, rotation);
    let speed = calc_elliptical_orbital_speed(orbiting_mass, orbited_body.mass, perigee_distance, apogee_distance, perigee_distance);
    let direction = calc_perpendicular(calc_point_sub(orbited_body.position, position));
    let velocity = calc_point_mult_scalar(direction, speed);

    if (!clockwise) {
        velocity = calc_point_mult_scalar(velocity, -1);
    }

    // let semi_major_dist = (perigee_distance + apogee_distance) / 2;
    // let semi_minor_dist = Math.sqrt(perigee_distance * apogee_distance);

    // let start_angle = starting_percent * 2 * Math.PI;

    // let x = semi_major_dist * Math.cos(start_angle) * Math.cos(rotation) - semi_minor_dist * Math.sin(start_angle) * Math.sin(rotation);
    // let y = semi_major_dist * Math.cos(start_angle) * Math.sin(rotation) + semi_minor_dist * Math.sin(start_angle) * Math.cos(rotation);

    // let position = {
    //     x: x+orbited_body.position.x,
    //     y: y+orbited_body.position.y
    // };

    // let dist = calc_dist(position, orbited_body.position);
    // let speed = calc_elliptical_orbital_speed(orbiting_mass, orbited_body.mass, perigee_distance, apogee_distance, dist);
    // let direction = calc_perpendicular(calc_point_sub(orbited_body.position, position));
    // let velocity = calc_point_mult_scalar(direction, speed);

    // console.log("perigree dist", perigee_distance, "apogee dist", apogee_distance, "dist: ", dist)

    // if (!clockwise) {
    //     velocity = calc_point_mult_scalar(velocity, -1);
    // }

    return {
        velocity: velocity,
        position: position,
    };
}


// calculate orbital velocity (body1 is orbiting body2)
function calc_circular_orbital_speed(mass1, mass2, position1, position2) {
    return Math.sqrt(g * mass1 * mass2 / calc_dist(position1, position2));
}


// calculate elliptical orbital velocity (body1 is orbiting body2)
function calc_elliptical_orbital_speed(mass1, mass2, perigee_distance, apogee_distance, r) {
    
    let dist_sum = perigee_distance + apogee_distance;
    return Math.sqrt(2 * g * mass1 * mass2 * ((1/r) - (1/dist_sum)));
}


/* -------------------------- main stage panning support ------------------------- */


// callback for detection of any mouse down events on the stage
function panning_stage_mousedown(e) {

    if (e.evt.button !== 0 || !can_pan_enabled) {
        return;
    }

    is_pan_attempted = true;

    // set panning start positions
    pan_start_pointer_pos = stage.getPointerPosition();
    pan_start_stage_pos = {
        x: stage.x(),
        y: stage.y()
    };
};


// callback for detection of mouse movement events on the stage
function panning_stage_mousemove(e) {

    // do nothing if not currently panning
    if (!is_pan_attempted || (!is_pan_attempted && !is_panning) || pan_start_pointer_pos === null || pan_start_stage_pos === null || !can_pan_enabled) {
        return;
    }

    // get the current position of the pointer
    let pan_end_pointer_pos = stage.getPointerPosition();

    // find the difference in pointer positions
    let pan_diff = {
        x: pan_end_pointer_pos.x - pan_start_pointer_pos.x,
        y: pan_end_pointer_pos.y - pan_start_pointer_pos.y 
    };

    // check if a pan has been attempted but not started
    if (is_pan_attempted && !is_panning) {
        
        let dist = Math.hypot(pan_diff.x, pan_diff.y);

        if (dist > pan_min_dist) {
            is_panning = true;

            // reset start pointer position to cleanly begin panning
            pan_start_pointer_pos = pan_end_pointer_pos;
            pan_diff = {
                x: pan_end_pointer_pos.x - pan_start_pointer_pos.x,
                y: pan_end_pointer_pos.y - pan_start_pointer_pos.y 
            };
        } else {
            return;
        }
    }

    // set the move cursor pointer
    stage.container().style.cursor = "move";

    let scale = stage.scaleX();

    // convert the end pointer position to local coordinates
    let pan_end_local = {
        x: (pan_end_pointer_pos.x - pan_start_stage_pos.x) / scale,
        y: (pan_end_pointer_pos.y - pan_start_stage_pos.y) / scale
    };

    // calculate the new stage position
    let new_stage_pos = {
        x: pan_end_pointer_pos.x - pan_end_local.x * scale + pan_diff.x,
        y: pan_end_pointer_pos.y - pan_end_local.y * scale + pan_diff.y
    };

    stage.position(new_stage_pos);
};


// callback for detection of when the cursor moves out of the stage
function panning_stage_mouseleave(e) {

    // disable panning if it is enabled
    if (is_panning || is_pan_attempted || !can_pan_enabled) {
        pan_start_pointer_pos = null;
        pan_start_stage_pos = null;
        is_panning = false;
        is_pan_attempted = false;
    }

    stage.container().style.cursor = "default";
};


// callback for detection of when the cursor is released in the stage
function panning_stage_mouseup(e) {

    // disable panning if it is enabled
    if (is_panning || is_pan_attempted || !can_pan_enabled) {
        pan_start_pointer_pos = null;
        pan_start_stage_pos = null;
        is_panning = false;
        is_pan_attempted = false;
    }

    stage.container().style.cursor = "default";
};


/* -------------------------- main stage zooming support ------------------------- */


// callback for when wheel movement detected on main stage
function zooming_stage_wheel(e) {
    
    // stop default scrolling
    e.evt.preventDefault();

    if (is_panning || !can_zoom_enabled) {
        return;
    }

    let old_scale = stage.scaleX();
    let pointer = stage.getPointerPosition();

    let stage_coords = {
        x: (pointer.x - stage.x()) / old_scale,
        y: (pointer.y - stage.y()) / old_scale,
    };

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? -1 : 1;

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
        direction = -direction;
    }

    let new_scale = direction > 0 ? old_scale * stage_scale_by : old_scale / stage_scale_by;

    stage.scale({ x: new_scale, y: new_scale });

    let new_pos = {
        x: pointer.x - stage_coords.x * new_scale,
        y: pointer.y - stage_coords.y * new_scale,
    };
    stage.position(new_pos);
};