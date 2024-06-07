
let stage = null;
let layer = null;
let anim = null;

let stage_center = null;

// track number of animation calls
let tick = 0;

// track the eyes
let eyes = [];
let num_eyes = 1000;

// define eye shape variables
let eye_padding = 5;
let eye_look_radius_ratio = 0.25;
let eye_iris_size_ratio = 0.8;
let eye_iris_move_speed = 1;
let eye_horz_edge_weight = 0.5;
let eye_vert_edge_weight = 1;
let eye_horz_center_weight = 1 - eye_horz_edge_weight;
let eye_vert_center_weight = 1 - eye_vert_edge_weight;
let eye_min_width = 50;
let eye_max_width = 100;
let eye_min_height = 20;
let eye_max_height = 35;
let eye_min_blink_interval = 60000;
let eye_max_blink_interval = 100000;
let eye_min_blink_duration = 300;
let eye_max_blink_duration = 600;

// track pressed keys
let key_map = {};
let on_key = function (e) {
    key_map[e.code] = e.type === "keydown"
};
document.addEventListener("keydown", on_key, false);
document.addEventListener("keyup", on_key, false);

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

    // draw initial elements
    create_eyes();

    // animate the objects
    animate();
});


// callback for when the window is resized
window.addEventListener("resize", function(event) {
    
    // resize the stage based on the new window size
    resize_stage();

}, true);


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

    layer = new Konva.Layer();

    stage.add(layer);

    // calculate the stage center point
    stage_center = {x: 0, y: 0};

    // setup callbacks for the main stage
    stage.on("mousedown.pan", panning_stage_mousedown);
    stage.on("mousemove.pan", panning_stage_mousemove);
    stage.on("mouseleave.pan", panning_stage_mouseleave);
    stage.on("mouseup.pan", panning_stage_mouseup);
    stage.on("wheel.zoom", zooming_stage_wheel);
}


// resize the stage based on parent dimensions
function resize_stage() {
    
    // get the containers of the stages and their parents
    let stage_container = document.getElementById("stage-container");
    let parent = stage_container.parentElement;

    // get necessary dimensions of the container cells
    stage.width(parent.offsetWidth);
    stage.height(parent.offsetHeight);
}


// create the eyes
function create_eyes() {

    for (let ei = 0; ei < num_eyes; ei++) {
        create_eye();
    }
}


// create a new eye
function create_eye() {

    let eye_placement_tries = 100;

    let x = 0; 
    let y = 0; 
    let width = rand_in_range(eye_min_width, eye_max_width);
    let height = rand_in_range(eye_min_height, eye_max_height);

    let found_eye_placement = false;

    // try to place the eye on the stage
    for (let i = 0; i < eye_placement_tries; i++) {
        
        let down_left = {x: x - width/2 - eye_padding, y: y + height/2 + eye_padding};
        let up_right  = {x: x + width/2 + eye_padding, y: y - height/2 - eye_padding };

        let intersects = false;

        // check if it intersects with any other eyes
        for (let ei = 0; ei < eyes.length; ei++) {
            let eye = eyes[ei];
            let eye_down_left = {x: eye.x - eye.width/2 - eye_padding, y: eye.y + eye.height/2 + eye_padding};
            let eye_up_right  = {x: eye.x + eye.width/2 + eye_padding, y: eye.y - eye.height/2 - eye_padding};

            // compare bounding rectangles of new eye and current eye
            if ((down_left.x < eye_up_right.x) && (eye_down_left.x < up_right.x) && (down_left.y > eye_up_right.y) && (eye_down_left.y > up_right.y)) {
                intersects = true;
                break;
            }
        }

        // break if no intersections found with other 
        if (!intersects) {
            found_eye_placement = true;
            break;
        }

        // regenerate coordinates
        x = rand_in_range(-stage.x(), stage.x());
        y = rand_in_range(-stage.y(), stage.y());
    }

    if (!found_eye_placement) {
        return;
    }

    let blink_interval = rand_in_range(eye_min_blink_interval, eye_max_blink_interval);
    
    // create the eye object
    let eye_info = {
        x: x,
        y: y, 
        width: width, 
        height: height,
        shapes: {
            group: null,
            sclera: null,
            iris: null
        },
        blink_percentage: 0,
        blink_duration: rand_in_range(eye_min_blink_duration, eye_max_blink_duration),
        blink_next_time: Date.now() + blink_interval * Math.random() * 5,
        blink_interval: blink_interval,
        iris_target_pos: {x: x, y: y},
        iris_current_pos: {x: x, y: y}
    };

    // define group to contain the eye shapes
    let group = new Konva.Group();
    layer.add(group);
    eye_info.shapes.group = group;

    // create the eye objects

    let sclera = new Konva.Shape({
        fill: "white",
        sceneFunc: null,
        clipFunc: null
    });
    group.add(sclera);
    eye_info.shapes.sclera = sclera;

    let iris = new Konva.Circle({
        x: eye_info.iris_current_pos.x, 
        y: eye_info.iris_current_pos.y, 
        radius: eye_info.height/2 * eye_iris_size_ratio,
        fill: "black"
    }) 
    group.add(iris);
    eye_info.shapes.iris = iris;
    
    // utilize the final eye object
    eyes.push(eye_info);
    update_eye_shape(eye_info);
}


// draw a given eye object
function update_eye_shape(eye_info) {
    
    // calculate blink animation state
    let blink_anim_time = Math.max((Date.now() - eye_info.blink_next_time) / eye_info.blink_duration, 0);
    if (blink_anim_time > 1) {
        eye_info.blink_percentage = 0;
        eye_info.blink_next_time = Date.now() + eye_info.blink_interval;
    } else {
        eye_info.blink_percentage = Math.min(1, Math.sin((blink_anim_time + 0.75) * 2 * Math.PI)/2 + 0.5);
    }

    // calculate eye bounding box
    let center = {x: eye_info.x, y: eye_info.y};
    let left = {x: eye_info.x-eye_info.width/2, y:eye_info.y};
    let right = {x: eye_info.x+eye_info.width/2, y:eye_info.y};
    let up = {x: eye_info.x, y: (eye_info.y-eye_info.height/2) + eye_info.height/2*eye_info.blink_percentage};
    let down = {x: eye_info.x, y: (eye_info.y+eye_info.height/2) - eye_info.height/2*eye_info.blink_percentage};
    let up_left = {x: eye_info.x*eye_horz_center_weight + left.x*eye_horz_edge_weight, y: eye_info.y*eye_vert_center_weight + up.y*eye_vert_edge_weight};
    let up_right = {x: eye_info.x*eye_horz_center_weight + right.x*eye_horz_edge_weight, y: eye_info.y*eye_vert_center_weight + up.y*eye_vert_edge_weight};
    let down_left = {x: eye_info.x*eye_horz_center_weight + left.x*eye_horz_edge_weight, y: eye_info.y*eye_vert_center_weight + down.y*eye_vert_edge_weight};
    let down_right = {x: eye_info.x*eye_horz_center_weight + right.x*eye_horz_edge_weight, y: eye_info.y*eye_vert_center_weight + down.y*eye_vert_edge_weight};

    // define a function that creates the eye shape
    let shape_func = (ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(left.x, left.y);
        ctx.quadraticCurveTo(
            up_left.x, 
            up_left.y, 
            up.x, 
            up.y
        );
        ctx.quadraticCurveTo(
            up_right.x, 
            up_right.y, 
            right.x, 
            right.y
        );
        ctx.quadraticCurveTo(
            down_right.x, 
            down_right.y, 
            down.x, 
            down.y
        );
        ctx.quadraticCurveTo(
            down_left.x, 
            down_left.y, 
            left.x, 
            left.y
        );
        // ctx.quadraticCurveTo(
        //     up_left.x, 
        //     up_left.y, 
        //     up.x, 
        //     up.y
        // );
        ctx.fillStrokeShape(shape);
    };

    eye_info.shapes.sclera.sceneFunc(shape_func);
    // eye_info.shapes.group.clipFunc(shape_func);

    // get pointer position on stage
    let pointer = stage.getPointerPosition();
    if (pointer === null) {
        return;
    }

    // calculate stage coordinates for the pointer
    let pointer_stage_coords = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleX(),
    };
    let line_to_pointer = [center, pointer_stage_coords];

    // set position of the iris to eye center by default
    let iris_target_pos = center;

    // check if eye is within look radius 
    if (calc_dist(center, pointer_stage_coords) < Math.max(stage.width(), stage.height()) * eye_look_radius_ratio) {
        
        // calculate bounding rhombus lines
        let bounding_rhom = [[left, up], [up, right], [right, down], [down, left]];
        let intersection = null;
        for (let line of bounding_rhom) {
    
            intersection = calc_lines_intersection(line, line_to_pointer);
            if (intersection !== null) {
                iris_target_pos = calc_line_extend_point(center, intersection, (eye_info.height/2 * eye_iris_size_ratio) / -2);
                break;
            }
        }
    }

    // set new iris target position
    eye_info.iris_target_pos = iris_target_pos;

    // calculate the current position for the iris
    let dist_to_target = calc_dist(iris_target_pos, eye_info.iris_current_pos);
    eye_info.iris_current_pos = calc_line_extend_point(iris_target_pos, eye_info.iris_current_pos, -1 * eye_iris_move_speed);

    // adjust iris to the current position
    if (dist_to_target > 0.5) { // arbitrary number to allow smooth movement without idle jittering
        eye_info.shapes.iris.position(eye_info.iris_current_pos);
    }
}


// animate circles
function animate() {

    
    anim = new Konva.Animation(function(frame) {
        let time = frame.time;
        let diff = frame.timeDiff;
        let frame_rate = frame.frameRate;

        for (let ei = 0; ei < eyes.length; ei++) {
            let eye = eyes[ei];

            update_eye_shape(eye);
        }

    });
    
    anim.start();
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