const ui = {
    updateHealthBar,
    updateThreats,
    removeThreat,
    addThreat,
    updateNode,
    updateLog
};
let health = 100;
let timer;

//  automatic health drain
function startHealthTimer() {
    timer = setInterval(() => {
        health -= 1;

        if (health < 0) {
            health = 0;
        }

        updateHealthBar();

        if (health === 0) {
            clearInterval(timer);
            gameOver();
        }
    }, 1000);
}
// active threats
let activeThreats = 10;

function updateThreats(count) {
    activeThreats = count;

    document.getElementById("threatText").textContent =
        `HOSTILE CODE DETECTED: ${activeThreats} ACTIVE THREATS`;
}

function removeThreat(amount = 1) {
    activeThreats -= amount;

    if (activeThreats < 0) {
        activeThreats = 0;
    }

    updateThreats(activeThreats);
}

function addThreat(amount = 1) {
    activeThreats += amount;
    updateThreats(activeThreats);
}

function updateNode(nodeName) {
    document.getElementById("currentNode").textContent =
        nodeName;
}
// 
function updateLog(message) {
    document.getElementById("challengeLog").textContent = message;
}
// Update health bar
function updateHealthBar() {
    const healthText = document.getElementById("healthText");
    const healthState = document.getElementById("healthState");
    const healthFill = document.getElementById("healthFill");

    healthFill.style.width = health + "%";
    healthText.textContent = health + "%";

    if (health > 70) {
        healthState.textContent = "STABLE";

        healthText.style.color = "#29d36a";
        healthState.style.color = "#29d36a";
        healthFill.style.background = "#29d36a";

    } else if (health > 30) {
        healthState.textContent = "WARNING";

        healthText.style.color = "#ffb000";
        healthState.style.color = "#ffb000";
        healthFill.style.background = "#ffb000";

    } else if (health > 0) {
        healthState.textContent = "CRITICAL";

        healthText.style.color = "#d9434f";
        healthState.style.color = "#d9434f";
        healthFill.style.background = "#d9434f";

    } else {
        healthState.textContent = "FLATLINE";

        healthText.style.color = "#d9434f";
        healthState.style.color = "#d9434f";
        healthFill.style.background = "#d9434f";
    }
}
// game over function
function gameOver() {
    document.getElementById("flatlineScreen").style.display = "flex";
}
// Reboot 
function rebootSystem() {
    health = 100;
    activeThreats = 10;

    updateHealthBar();
    updateThreats(activeThreats);
    updateNode("NODE 01-B [MAINFRAME]");

    document.getElementById("flatlineScreen").style.display = "none";

    clearInterval(timer);
    startHealthTimer();
}
startHealthTimer();