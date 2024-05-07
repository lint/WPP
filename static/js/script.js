
// define canvas variables
let display_canvas = null;
let display_ctx = null;
let buffer_canvas = null;
let buffer_ctx = null;

let display_canvas_size_ratio = 0.7;

// define sorting options
let sort_horizontal = true;
let sort_ascending = true;
let sort_mode = "h";
let sort_threshold_min = 30;
let sort_threshold_max = 70;
let use_hsl = false;
let apply_to_uploaded = true;

let uploaded_img_url = null;
let last_displayed_img_url = null;

// execute when the document is ready
document.addEventListener("DOMContentLoaded", function() { 

    // get the canvas and it's context
    display_canvas = document.getElementById("canvas");
    display_ctx = display_canvas.getContext("2d");

    buffer_canvas = document.createElement("canvas");
    buffer_ctx = buffer_canvas.getContext("2d");

    // fit the display canvas to the current window size
    update_display_canvas_size();

    // set variables based on currently selected inputs
    read_selected_inputs();

    // load a default image to display
    load_preset_image("/static/assets/img/bricks.jpg")

    // create multi thumb threshold slider
    create_threshold_slider();
});


// execute when the window is resized
window.addEventListener("resize", function(event) {
    
    // update the canvas size and displayed image
    update_display_canvas_size();
    draw_image(last_displayed_img_url, true, false);

}, true);


// update the display canvas size based on the size of the window
function update_display_canvas_size() {
    let display_section = document.getElementById("display");
    
    let display_width = display_section.offsetWidth;
    let display_height = display_section.offsetHeight;

    display_canvas.width = display_width * display_canvas_size_ratio;
    display_canvas.height = display_height * display_canvas_size_ratio;
}


// create the multi thumb slider for threshold selection
function create_threshold_slider() {
    
    let slider = document.getElementById("threshold-slider");

    // create the noUiSlider 
    noUiSlider.create(slider, {
        start: [30, 70],
        range: { min: [0], max: [100] },
        step: 1,
        connect: [false, true, false],
        tooltips: {
            to: (val) => val + "%"
        }
    });

    // update display and current congestion values whenver a value has changed
    slider.noUiSlider.on("update", function (values, handle) {
        sort_threshold_min = values[0];
        sort_threshold_max = values[1];
    });
    
    // color the different connections of the slider
    let connect = slider.querySelector(".noUi-connect");
    connect.classList.add("highlight-color");
}


// draw an image on the canvas
function draw_image(img_url, should_draw_display=true, should_draw_buffer=true) {
    let img = new Image();
    img.onload = function() {

        if (should_draw_display) {

            last_displayed_img_url = img_url;

            // reset the canvas
            display_ctx.clearRect(0, 0, display_canvas.width, display_canvas.height);
            
            // get drawing dimensions
            let scale = img.width > img.height ? display_canvas.width / img.width : display_canvas.height / img.height;
            let width = img.width * scale;
            let height = img.height * scale;
            let offset_x = width < display_canvas.width ? (display_canvas.width - width) / 2 : 0;
            let offset_y = height < display_canvas.height ? (display_canvas.height - height) / 2 : 0;
            
            // draw the image on the display canvas
            display_ctx.drawImage(img, offset_x, offset_y, width, height);
        }

        if (should_draw_buffer) {

            // reset the canvas
            buffer_ctx.clearRect(0, 0, buffer_canvas.width, buffer_canvas.height);

            // draw the image on the buffer canvas
            buffer_canvas.width = img.width;
            buffer_canvas.height = img.height;
            buffer_ctx.drawImage(img, 0, 0, buffer_canvas.width, buffer_canvas.height);
        }
    };
    img.src = img_url;
}


// load a preset image
function load_preset_image(img_fn) {

    fetch(img_fn)
    .then(res => res.blob())
    .then(blob => {
        uploaded_img_url = URL.createObjectURL(blob);
        draw_image(uploaded_img_url);
    });
}


// handler for submitting an uploaded image
function submit_uploaded_image(event) {

    let input = event.target;
    let reader = new FileReader();
    reader.onload = function () {
        uploaded_img_url = reader.result;
        draw_image(uploaded_img_url);
    };
    reader.readAsDataURL(input.files[0]);
}


// handler for the sort button being pressed
function handle_sort_pixels_button() {

    if (apply_to_uploaded) {
        draw_image(uploaded_img_url, false, true);
    }

    // get the data for each pixel of the image
    let img_data = buffer_ctx.getImageData(0, 0, buffer_canvas.width, buffer_canvas.height);
    let data = img_data.data;

    // choose functions and loop lengths for horizontal vs vertical
    let horz_offset_func = x => x * buffer_canvas.width;
    let vert_offset_func = x => x;

    let horz_pixel_index_func = (x, y) => (x + y) * 4;
    let vert_pixel_index_func = (x, y) => (x * buffer_canvas.width + y) * 4;

    let offset_func = sort_horizontal ? horz_offset_func : vert_offset_func;
    let pixel_index_func = sort_horizontal ? horz_pixel_index_func : vert_pixel_index_func;

    let outer_length = sort_horizontal ? buffer_canvas.height : buffer_canvas.width;
    let inner_length = sort_horizontal ? buffer_canvas.width : buffer_canvas.height;

    // iterate over every pixel
    for (let i = 0; i < outer_length; i++) {
        let offset = offset_func(i);
        let buffer = []; // TODO: make reusable buffer?

        // extract rows/cols of pixels
        for (let j = 0; j < inner_length; j++) {
            let data_index = pixel_index_func(j, offset);
            
            let pixel = {
                r: data[data_index],
                g: data[data_index+1], 
                b: data[data_index+2],
                a: data[data_index+3]
            };

            if (use_hsl) {
                add_hsl_to_pixel(pixel);
            }

            buffer.push(pixel);
        }

        // sort the pixels in the buffer
        sort_pixel_buffer(buffer);

        // replace the image data with the sorted pixels
        for (let j = 0; j < inner_length; j++) {
            let pixel = buffer[j];
            let data_index = pixel_index_func(j, offset);
            
            data[data_index]   = pixel.r;
            data[data_index+1] = pixel.g;
            data[data_index+2] = pixel.b;
            data[data_index+3] = pixel.a;
        }

        buffer = [];
    }

    // replace any changed pixels
    buffer_ctx.putImageData(img_data, 0, 0);

    // draw the buffer image on the display canvas
    draw_image(buffer_canvas.toDataURL(), true, false);
}


// check if pixel is sorting candidate
function check_pixel_sortable(pixel) {
    
    let sort_value = -1;

    if (sort_mode === "h") {
        sort_value = pixel.h;
    } else if (sort_mode === "s") {
        sort_value = pixel.s;
    } else if (sort_mode === "l") {
        sort_value = pixel.l;
    } else if (sort_mode === "r") {
        sort_value = pixel.r / 255;
    } else if (sort_mode === "g") {
        sort_value = pixel.g / 255;
    } else if (sort_mode === "b") {
        sort_value = pixel.b / 255;
    }

    sort_value *= 100;

    return sort_value >= sort_threshold_min && sort_value <= sort_threshold_max;
}


// overall comparison function to sort pixels
let pixel_compare = function (a, b) {
    let result = 0;

    if (sort_mode === "h") {
        result = a.h - b.h;
    } else if (sort_mode === "s") {
        result = a.s - b.s;
    } else if (sort_mode === "l") {
        result = a.l - b.l;
    } else if (sort_mode === "r") {
        result = a.r - b.r;
    } else if (sort_mode === "g") {
        result = a.g - b.g;
    } else if (sort_mode === "b") {
        result = a.b - b.b;
    }

    if (!sort_ascending) {
        result *= -1;
    }

    return result;
};


// sort a buffer of pixels
function sort_pixel_buffer(buffer) {

    let ranges = [];

    let start = -1;

    // find ranges of sortable pixels in the buffer
    for (let i = 0; i < buffer.length; i++) {

        let sortable = check_pixel_sortable(buffer[i]);

        if (sortable && start === -1) {
            start = i;
        } else if ((!sortable || i === buffer.length - 1) && start > -1) {
            ranges.push({start: start, end: i+1});
            start = -1;
        }
    }

    // sort each found range
    for (let i = 0; i < ranges.length; i++) {
        let range = ranges[i];

        // extract the range from the buffer and sort it
        let to_sort = buffer.slice(range.start, range.end);
        to_sort.sort(pixel_compare);

        // replace the sorted range
        buffer.splice(range.start, range.end-range.start, ...to_sort);
    }
}


// set sort vars based on currently selected form values
function read_selected_inputs() {

    // TODO: only really need to check one of each set

    let horizontal_radio = document.getElementById("horizontal-input");
    let vertical_radio = document.getElementById("vertical-input");
    let ascending_radio = document.getElementById("ascending-input");
    let descending_radio = document.getElementById("descending-input");
    let mode_select = document.getElementById("mode-select-input");

    sort_mode = mode_select.value;
    use_hsl = sort_mode === "h" || sort_mode === "s" || sort_mode === "l";

    if (horizontal_radio.checked) {
        sort_horizontal = true;
    }
    if (vertical_radio.checked) {
        sort_horizontal = false;
    }
    if (ascending_radio.checked) {
        sort_ascending = true;
    }
    if (descending_radio.checked) {
        sort_ascending = false;
    }
}


// handle direction input change
function handle_direction_change(radio) {

    if (radio.id === "horizontal-input") {
        sort_horizontal = true;
    } else if (radio.id === "vertical-input") {
        sort_horizontal = false;
    }
}


// handle order input change
function handle_order_change(radio) {

    if (radio.id === "ascending-input") {
        sort_ascending = true;
    } else if (radio.id === "descending-input") {
        sort_ascending = false;
    }
}


// handle mode input change
function handle_mode_change(mode_select) {
    sort_mode = mode_select.value;
    use_hsl = sort_mode === "h" || sort_mode === "s" || sort_mode === "l";
}


// handle applied image input change
function handle_image_applied(radio) {
    apply_to_uploaded = radio.id === "apply-uploaded-input";
}


// add HSL colorspace information to a given pixel object
function add_hsl_to_pixel(pixel) {
    
    let r = pixel.r / 255;
    let g = pixel.g / 255;
    let b = pixel.b / 255;

    let min = Math.min(r, g, b);
    let max = Math.max(r, g, b);

    let min_max_sum = min + max;
    let min_max_diff = max - min;

    let l = min_max_sum / 2;
    let s = 0;
    let h = 0;

    if (max !== min) {
        s = l > 0.5 ? min_max_diff / (2 - min_max_diff) : min_max_diff / min_max_sum;

        switch (max) {
            case r: h = (g - b) / min_max_diff + (g < b ? 6 : 0); break;
            case g: h = (b - r) / min_max_diff + 2; break;
            case b: h = (r - g) / min_max_diff + 4; break;
        }

        h /= 6;
    }

    // h = round(h * 360);
    // s = round(s * 100);
    // l = round(l * 100);

    pixel.h = h;
    pixel.s = s;
    pixel.l = l;
}
