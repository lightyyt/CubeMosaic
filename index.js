let cubes = [];

let color = "white";

let toastTO=-1;

function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTO);
    toastTO = setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}


function change(col){
    let title = document.getElementsByTagName("h1")[0];
    title.style.color = col;
    color = col;
}

function simulateLeftClickOnCube(cubeEl) {
  const tiles = cubeEl.children;
  for (let i = 0; i < tiles.length; i++) {
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0 // 0 means left click
    });
    tiles[i].dispatchEvent(clickEvent);
    showToast("Set Cube color to "+color);
  }
}

function tile_right(tile, event) {
    event.preventDefault();  // Prevent the default right-click menu
    let cube_id = tile.id.split("_")[1];

    simulateLeftClickOnCube(document.getElementById(cube_id));
}

function tile_click(tile) {
    //console.log(tile);
    tile.classList = "";
    tile.className = "tile "+color;
}

function create_mosaic(size) {
    document.getElementById("mosaic").innerHTML="";
    cubes = [];
    let i = 0;
    for(let y = 0; y < size; y++){
        for(let x = 0; x < size; x++){
            i++;
            create_cube("cube-"+i);
        }
    }
    document.getElementById("mosaic").style.width = size*181+"px";
}

function mosaicsel(){ 
    let prp = prompt("Enter Mosaic Size:", "10");
    let num = parseInt(prp);
    if(prp == null || prp == "") return;
    else if(isNaN(num))
        alert("Invalid Number!")
    else
        create_mosaic(num);
    
}

function create_cube(id = "cube-1"){
    let cube = document.createElement("span");
    cube.classList.add("cube");
    cube.id = id;
    let tiles = [];
    for (let i = 0; i < 9; i++) {
        let tile = document.createElement("button");
        tile.className = ("tile white");
        tile.onclick = ()=>{ tile_click(tile); }
        tile.id = "tile_"+id;
        tile.addEventListener("contextmenu", (event)=>{ tile_right(tile, event); });

        tiles.push(tile);
        cube.appendChild(tile);
    }
    let info = document.createElement("span");
    info.className = "info";
    info.innerHTML="WW";
    info.hidden=true;
    info.id = "info";
    cube.appendChild(info);
    
    cubes.push({"cube":cube, "tiles":tiles});
    document.getElementById("mosaic").appendChild(cube);
}




// Shortcuts
addEventListener("keydown", (ev) => {
    switch(ev.code) {
        case "Digit1":
            change("red");
            break;
        case "Digit2":
            change("green");
            break;
        case "Digit3":
            change("blue");
            break;
        case "Digit4":
            change("orange");
            break;
        case "Digit5":
            change("yellow");
            break;
        case "Digit6":
            change("white");
            break;
    }
})


function getNameForNumber(n) {
  let result = "";
  while (n > 0) {
    n--; // Adjust for 0-based indexing
    const remainder = n % 26;
    result = String.fromCharCode(65 + remainder) + result; // 65 = "A"
    n = Math.floor(n / 26);
  }
  return result;
}

// Generate Results
async function generatePDF() {
    const options = {
        margin:       0.5,
        filename:     "my-element.pdf",
        image:        { type: "jpeg", quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: "in", format: "letter", orientation: "portrait" }
    };


    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        unit: "pt",
        format: "a4",
        orientation: "portrait",
    });

    const vals = [];
    const valid_cubes = [];

    let nameid = 1;
    cubes.forEach(cube => {
        cube.cube.querySelector("span").hidden=false;
        //Cube to String
        var str = "";
        cube.tiles.forEach(tile => {
            str+=tile.classList[1][0];
        });
        console.log(str);
        let idx = vals.indexOf(str);
        
        if(idx == -1) { // If not exists, add
            vals.push(str);
            let name = getNameForNumber(nameid);
            valid_cubes.push(
                {
                    "cube":cube.cube,
                    "tiles":cube.tile,
                    "count": 1,
                    "name": name
                }
            );
            cube.cube.querySelector("span").innerHTML = name;
            nameid++;
        } else { // Increase count otherwise
            valid_cubes[idx].count++;
            cube.cube.querySelector("span").innerHTML = valid_cubes[idx].name;
        }
    });
    console.log(valid_cubes);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    showToast("Generating Full Mosaic...");

    const full = await html2canvas(document.getElementById("mosaic"), { scale: 1, useCORS: true });
    // Hide Text After Full Image, as mini images don't need it
    cubes.forEach(cube => {
       cube.cube.querySelector("span").hidden = true;
    });
    const fpdfWidth = pageWidth;
    const fpdfHeight = (full.height * fpdfWidth) / full.width;

    pdf.addImage(full, "PNG", 50, 50, fpdfWidth-100, fpdfHeight-100);

    let i = 0;
    for (const cube of valid_cubes) {
        i++;
        pdf.addPage();
        const canvas = await html2canvas(cube.cube, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");

        const pdfWidth = pageWidth;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        
        const padding = 10;  // padding space below the image

        pdf.addImage(imgData, "PNG", 50, 50, pdfWidth-100, pdfHeight-100);

        // Put the text *below* the image (image bottom + padding)
        const text = ""+cube.name+"  : " + cube.count+"x";
        const fontSize = 40;
        pdf.setFontSize(fontSize);
        const textWidth = pdf.getTextWidth(text);

        // X position: right align with some margin 
        const x = pdfWidth - textWidth - 10;

        // Y position: image height + padding + font size (to not overlap)
        const y = pdfHeight + padding + fontSize;

        pdf.text(text, x, y);
        showToast("Cubes: " + i + " / "+valid_cubes.length);
    }

pdf.save("output.pdf");



setTimeout(()=>{document.getElementById("generate").innerHTML = "PDF";}, 2000);
}

let mouseDown = false;
let touchDown = false;
const activated = new Set();

// Track mouse state
document.addEventListener("mousedown", () => { mouseDown = true; activated.clear(); });
document.addEventListener("mouseup", () => { mouseDown = false; });

// Mouse swipe
document.addEventListener("mousemove", (ev) => {
    if (!mouseDown) return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    triggerSwipeClick(el);
}, { passive: true });

// Touch state
document.addEventListener("touchstart", () => { touchDown = true; activated.clear(); });
document.addEventListener("touchend", () => { touchDown = false; });

// Touch swipe
document.addEventListener("touchmove", (ev) => {
    if (!touchDown || ev.touches.length === 0) return;
    const touch = ev.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    triggerSwipeClick(el);
}, { passive: true });

// Click triggering with deduplication
function triggerSwipeClick(el) {
    if (!el || activated.has(el)) return;
    activated.add(el);

    // Simulate click
    const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0
    });
    el.dispatchEvent(clickEvent);

    //showToast(el);
}