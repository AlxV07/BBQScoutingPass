// === Themes ===
let stylesheetIdx = 0
let rgbIntervalIdx;
function nextStylesheet() {
    let stylesheet = document.getElementById('stylesheet');
    if (stylesheetIdx === 0) {
        stylesheet.href = "resources/css/bbqScoutingPASS.css";
        setColor('orangered')
        clearInterval(rgbIntervalIdx)
    } else if (stylesheetIdx === 1) {
        stylesheet.href = "resources/css/bbqScoutingPASS_RGBColorTheme.css";
        function updateRGB() {  // RGB theme :DDD
            function getRandomColor() {
                let letters = '0123456789ABCDEF';
                let color = '#';
                for (let i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }
            let c = getRandomColor()
            setColor(c)
        }
        rgbIntervalIdx = setInterval(updateRGB, 1000)
    } else {
        stylesheet.href = "resources/css/bbqScoutingPASS_UwUTheme.css";
        setColor('pink')
        clearInterval(rgbIntervalIdx)
    }
    stylesheetIdx = (stylesheetIdx + 1) % 3
}
function setColor(c) {
    document.body.style.color = c;
    document.body.style.borderColor = c;
    document.body.style.backgroundColor = c;
    let buttons = document.querySelectorAll('input[type="button"]');
    buttons.forEach(function(button) {
        button.style.backgroundColor = c;
        button.style.color = 'black';
    });
    let texts = document.querySelectorAll('input[type="text"]');
    texts.forEach(function(text) {
        text.style.backgroundColor = c;
        text.style.color = 'black';
    });
    let numbers = document.querySelectorAll('input[type="number"]');
    numbers.forEach(function(number) {
        number.style.backgroundColor = c;
        number.style.color = 'black';
    });
    let radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(function(radio) {
        radio.style.backgroundColor = c;
        radio.style.color = 'black';
    });
}
