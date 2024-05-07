
// define canvas variables
let display_canvas = null;
let display_ctx = null;
let buffer_canvas = null;
let buffer_ctx = null;

// define sorting options
let sort_horizontal = true;
let sort_ascending = true;
let sort_mode = "h";
let sort_threshold_min = 50;
let use_hsl = false;

// execute when the document is ready
document.addEventListener("DOMContentLoaded", function() { 

    // get the canvas and it's context
    display_canvas = document.getElementById("canvas");
    display_ctx = display_canvas.getContext("2d");

    buffer_canvas = document.createElement("canvas");
    buffer_ctx = buffer_canvas.getContext("2d");

    // load a default image to display
    load_preset_image("/static/assets/img/rubiks_cube.png")

    // set variables based on currently selected inputs
    read_selected_inputs();

    // allow continuous tracking of threshold slider value
    let threshold_slider = document.getElementById("threshold-input")
    threshold_slider.addEventListener("input", function() {
        handle_threshold_change(threshold_slider);
        update_threshold_display();
    }); 
});


// draw an image on the canvas
function draw_image(img_url, should_draw_display=true, should_draw_buffer=true) {
    let img = new Image();
    img.onload = function() {

        if (should_draw_display) {

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
        draw_image(URL.createObjectURL(blob));
    });
}


// handler for submitting an uploaded image
function submit_uploaded_image(event) {

    let input = event.target;
    let reader = new FileReader();
    reader.onload = function () {
        draw_image(reader.result);
    };
    reader.readAsDataURL(input.files[0]);
}


// handler for the sort button being pressed
function handle_sort_pixels_button() {

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
            let pixel_index = pixel_index_func(j, offset);
            
            // TODO: add directly instead of making new array for each pixel?
            let pixel = data.slice(pixel_index, pixel_index+5)

            if (use_hsl) {
                pixel = rgba_to_hsla(pixel);
            }

            buffer.push(pixel);
        }

        // sort the pixels in the buffer
        sort_pixel_buffer(buffer);

        // replace the image data with the sorted pixels
        for (let j = 0; j < inner_length; j++) {
            let pixel = buffer[j];

            if (use_hsl) {
                pixel = hsla_to_rgba(pixel);
            }
            
            let pixel_index = pixel_index_func(j, offset);
            data[pixel_index]   = pixel[0];
            data[pixel_index+1] = pixel[1];
            data[pixel_index+2] = pixel[2];
            data[pixel_index+3] = pixel[3];
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
        sort_value = pixel[0];
    } else if (sort_mode === "s") {
        sort_value = pixel[1];
    } else if (sort_mode === "l") {
        sort_value = pixel[2];
    } else if (sort_mode === "r") {
        sort_value = pixel[0] / 255;
    } else if (sort_mode === "g") {
        sort_value = pixel[1] / 255;
    } else if (sort_mode === "b") {
        sort_value = pixel[2] / 255;
    }

    sort_value *= 100;

    return sort_value >= sort_threshold_min;
}


// overall comparison function to sort pixels
let pixel_compare = function (a, b) {
    let result = 0;

    if (sort_mode === "h" || sort_mode === "r") {
        result = a[0] - b[0];
    } else if (sort_mode === "s" || sort_mode === "g") {
        result = a[1] - b[1];
    } else if (sort_mode === "l" || sort_mode === "b") {
        result = a[2] - b[2];
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
    let threshold_slider = document.getElementById("threshold-input");

    sort_mode = mode_select.value;
    use_hsl = sort_mode === "h" || sort_mode === "s" || sort_mode === "l";

    sort_threshold_min = threshold_slider.value;
    update_threshold_display();

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


// handle threshold input change
function handle_threshold_change(slider) {
    sort_threshold_min = slider.value;
    update_threshold_display();
}


// update threshold value display
function update_threshold_display() {
    let threshold_element = document.getElementById("threshold-value");
    threshold_element.innerHTML = sort_threshold_min + "%";
}


// convert rgb color to hsl
function rgba_to_hsla(rgba) {
    
    let r = rgba[0] / 255;
    let g = rgba[1] / 255;
    let b = rgba[2] / 255;
    let a = rgba[3];

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

    return [h, s, l, a];
}


// convert hue to rgb
function hue_to_rgb(p, q, t) {
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1 / 6) { return p + (q - p) * 6 * t; }
    if (t < 1 / 2) { return q; }
    if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
    return p;
}


// convert hsl color to rgb
function hsla_to_rgba(hsla) {

    let h = hsla[0]; // / 360;
    let s = hsla[1]; // / 100;
    let l = hsla[2]; // / 100;
    let a = hsla[3];

    let r = 0;
    let g = 0;
    let b = 0;

    if (s === 0) {
        r = g = b = l;
    } else {

        q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        p = 2 * l - q;
        r = hue_to_rgb(p, q, h + 1 / 3);
        g = hue_to_rgb(p, q, h);
        b = hue_to_rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a];
}