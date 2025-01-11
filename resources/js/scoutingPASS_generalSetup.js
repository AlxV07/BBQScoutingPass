// General setup for ScoutingPass

document.addEventListener("touchstart", startTouch, false);
document.addEventListener("touchend", moveTouch, false);

// Swipe Up / Down / Left / Right
let initialX = null;
let xThreshold = 0.3;
let slide = 0;
let enableGoogleSheets = false;
let pitScouting = false;
let checkboxAs = 'YN';

function startTouch(e) {
    initialX = e.touches[0].screenX;
}

function moveTouch(e) {
    if (initialX === null) {
        return;
    }
    let currentX = e.changedTouches[0].screenX;
    let diffX = initialX - currentX;
    // sliding horizontally
    if (diffX / screen.width > xThreshold) {
        // swiped left
        swipePage(1);
    } else if (diffX / screen.width < -xThreshold) {
        // swiped right
        swipePage(-1);
    }
    initialX = null;
}

// Options (TODO: Find out what used for)
let options = {
    correctLevel: QRCode.CorrectLevel.L,
    quietZone: 15,
    quietZoneColor: '#FFFFFF'
};


function swipePage(increment) {
    let q = qr_regenerate()
    if (q === true) {
        let slides = document.getElementById("main-panel-holder").children
        if (slide + increment < slides.length && slide + increment >= 0) {
            slides[slide].style.display = "none";
            slide += increment;
            window.scrollTo(0, 0);
            slides[slide].style.display = "table";
            document.getElementById('data').innerHTML = "";
            document.getElementById('copyButton').setAttribute('value', 'Copy Data');
        }
    }
}
