
let stage = null;
let layer = null;
let anim = null;

let stage_center = null;

// track number of animation calls
let tick = 0;

// track the eyes
let eyes = [];

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
    stage.width = parent.offsetWidth;
    stage.height = parent.offsetHeight;
}


// animate circles
function animate() {

    
    anim = new Konva.Animation(function(frame) {
        let time = frame.time;
        let diff = frame.timeDiff;
        let frame_rate = frame.frameRate;

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

    // update the orbit tracer size
    update_tracer_size();
};