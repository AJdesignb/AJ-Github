let birdy;
let birdyTwo;
let birdyThree;
let angryBirdy;
let bonkSound; // NEW: Sound variable
let bgMusic;
let cheerSound;
let isCheering = false;
let cheerTimer = 0;

let score = 0; // Tracks how many times Birdy makes it across

let gameState = "start"; // Can be "start", "play", or "gameover"

// Birdy position & speed
let birdX, birdY;
let birdSpeedX = 1.5;   // automatic right movement
let birdMoveStep = 15; // how far bird moves up/down per key press
let isAngry = false; // tracks if birdy is angry yet
let angryTimer = 0; // When the birdy hits the brick

let grass;
let grassX = 0;
let grassSpeed = 2; // Speed of the grass moving left to right

let cloudA1x, cloudA2x;
let cloudSpeed = 1;
let skyColor;
let bgColor;

let font;
let r, g, b;

let bricks = [];

function preload() {
  birdy = loadImage("Birdy.png");
  birdyTwo = loadImage("Birdy 2.png");
  birdyThree = loadImage("BirdyThree.png");
  angryBirdy = loadImage("angry birdy.png");
  grass = loadImage("Asset 1.png");
  font = loadFont('Super Dream.ttf');
  
  // NEW: Load the sound effect
  // Make sure you have a file named 'bonk.mp3' in your folder!
  bonkSound = loadSound("bonk.mp3"); 
  cheerSound = loadSound("cheer.mp3");
  bgMusic = loadSound("muzic.mp3");
}

function setup() {
  createCanvas(800, 850);
  rectMode(CORNER);

  // Cloud starting positions
  cloudA1x = width / 2;
  cloudA2x = -width / 2;

  // Bird starting position
  birdX = 100;       // near the left side
  birdY = 400;       // vertically centered
  
  // Initial Background Color
  bgColor = color(255);
  skyColor = color(135, 206, 235); 

  randomizeBricks(); // calling bricks

  bgMusic.setVolume(0.5); // Optional: Lowers the music volume so it doesn't drown out the bonk/cheer!
  bgMusic.loop();         // Plays the music continuously
}

function draw() {
  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "play") {
    playGame();
  } else if (gameState === "gameover") {
    drawGameOverScreen();
  }
}

function playGame() {
  background(bgColor);

  // ---------- SKY ----------
  fill(skyColor);
  noStroke();
  rect(0, 0, 800, 600);

  // --------- SCORE ---------
  textFont(font);
  textSize(60);
  fill(255); // White text
  noStroke();
  text("Score: " + score, 50, 90);

  // ---------- CLOUDS ----------
  drawClouds();

  // ---------- GROUND ----------

  // Draw the moving grass texture
  imageMode(CENTER);
  
  // Image 1 (The main grass)
  image(grass, grassX + 400, 510, 820, 240);
  // Image 2 (The backup grass, sitting exactly one width to the RIGHT)
  image(grass, grassX + 400 + 820, 510, 820, 240);

  // Move the grass to the LEFT
  grassX -= grassSpeed;

  // Once the grass moves a full width (820px) to the left, snap it seamlessly back to 0
  if (grassX <= -820) {
    grassX = 0;
  }

   // Draw the solid dirt base first (this doesn't need to move)
  fill(132, 153, 79);
  noStroke();
  rect(0, 550, 800, 300);

  // --------- INSTRUCTIONS ---------
  textFont(font);
  textSize(40);
  fill(255, 231, 151);
  noStroke();
  text('Use the', 110, 630);
  fill(255, 255, 255);
  text('UP & Down', 260, 630);
  fill(255, 231, 151);
  text('arrow keys', 470, 630);
  textSize(35);
  text('to save birdy from bumping into the bricks', 50, 680);
  fill(255, 255, 255);
  text('press B', 100, 730);
  fill(255, 231, 151);
  text('to change background colors', 240, 730);

  // ---------- BORDER ----------
  let c = [0, 126, 255, 122];
  fill(c);
  noStroke();
  rect(0, 820, 850, 30);
  rect(0, 0, 850, 30);
  rect(0, 20, 30, 850);
  rect(770, 20, 30, 850);

  // ---------- RANDOM DOTS ----------
  // If cheering is active, alternate between white and orange every 10 frames
  let dotColor;
  if (isCheering && frameCount % 20 < 10) {
    dotColor = color(255, 255, 255); // Flash Bright White
  } else {
    dotColor = color(255, 177, 47);  // Default Orange
  }

  fill(dotColor); // Apply the color to all dots at once

  for (let by = height; by >= 0; by -= 40) {
    ellipse(14, by, 25, 25);
  }
  for (let ax = 800; ax >= 40; ax -= 40) {
    ellipse(ax, 14, 25, 25);
  }
  for (let y = 0; y <= width; y += 40) {
    ellipse(y, 835, 25, 25);
  }
  for (let x = 0; x <= height; x += 40) {
    ellipse(785, x, 25, 25);
  }

  // Turn off the cheering after 2 seconds (2000 milliseconds)
  if (isCheering && millis() - cheerTimer > 2000) {
    isCheering = false;
  }

  // ---------- BRICKS ----------
  stroke(184, 124, 76);
  strokeWeight(6);
  fill(123, 64, 25);
  for (let brick of bricks) {
    rect(brick.x, brick.y, 100, 50);
  }

  // ---------- BIRDY ----------
  imageMode(CENTER);
  image(birdy, 50, 750, 200, 200);
  image(birdyThree, 730, 790, 200, 200);

  // The Flapping Logic!
  let currentBirdy;
  
  if (isAngry) {
    currentBirdy = angryBirdy; // If she bonks, show the angry birdy
  } else {
    // If not angry, flap the wings!
    // This switches the image every 10 frames (about 3 flaps per second)
    if (frameCount % 20 < 10) {
      currentBirdy = birdy;      
    } else {
      currentBirdy = birdyThree;   
    }
  }

  // Draw the currently selected Birdy image at her current position
  image(currentBirdy, birdX, birdY, 300, 300);

  // Move birdy automatically to the right if she is not angry
  if (!isAngry) {
    birdX += birdSpeedX;
  }

  // Restart when bird crosses screen (new round)
  if (birdX > width + 150) {
    triggerSuccess();
  }

  // Keep birdy inside screen vertically
  birdY = constrain(birdY, 50, height - 50);

  // ---------- COLLISION DETECTION ----------
  for (let brick of bricks) {
    if (
      birdX + 50 > brick.x &&          // Bird right edge past Brick left edge
      birdX - 50 < brick.x + 100 &&    // Bird left edge past Brick right edge
      birdY + 50 > brick.y &&          // Bird bottom edge past Brick top edge
      birdY - 50 < brick.y + 50        // Bird top edge past Brick bottom edge
    ) {
      triggerAngryMode();
    }
  } // End of brick loop

  // ---------- HANDLE ANGRY TIMER ----------
  if (isAngry && millis() - angryTimer > 1000) { // after 1 second
    gameState = "gameover"; 
  }
}

// Draws clouds and handles their motion
function drawClouds() {
  fill(233, 179, 251);
  noStroke();
  
  // 1st cloud group
  push();
  translate(cloudA1x, 0);
  drawCloudShapes();
  pop();
  
  // 2nd cloud group
  push();
  translate(cloudA2x, 0);
  drawCloudShapes();
  pop();

  cloudA1x -= cloudSpeed;
  cloudA2x -= cloudSpeed;

  if (cloudA1x <= -width / 2) {
    cloudA1x = width + width / 2;
  }
  if (cloudA2x <= -width / 2) {
    cloudA2x = width + width / 2;
  }
}

// Cloud shape definition
function drawCloudShapes() {
  ellipse(80, 530, 180);
  ellipse(350, 330, 330);
  ellipse(190, 450, 180);
  ellipse(540, 360, 200);
  ellipse(650, 420, 100);
  ellipse(720, 520, 180);
  rect(150, 400, 500, 160);
}

// All the key presses
function keyPressed() {
  // Menu Controls
  if (gameState === "start" && key === ' ') {
    gameState = "play";
  } else if (gameState === "gameover" && key === ' ') {
    resetGame();
    score = 0; // Reset score when starting a new game
    gameState = "play";
  }

  // Gameplay Controls (Only work during "play" state)
  if (gameState === "play") {
    if (keyCode === UP_ARROW) {
      birdY -= birdMoveStep;
    } else if (keyCode === DOWN_ARROW) {
      birdY += birdMoveStep;
    } else if (key === 'b' || key === 'B') {
      skyColor = color(random(255), random(255), random(255)); 
    }
  }

  return false; 

}

function randomizeBricks() {
  bricks = [];
  for (let i = 0; i < 3; i++) { // 3 bricks
    let bx = random(100, width - 200); // margin from edges
    let by = random(100, height - 300); // space from top and bottom
    bricks.push({x: bx, y: by});
  }
}

// Reset game after angry birdy or round end
function resetGame() {
  isAngry = false;
  birdX = 100;
  birdY = 400;
  randomizeBricks();
}

// Trigger angry mode when collision happens
function triggerAngryMode() {
  if (!isAngry) {
    isAngry = true;
    angryTimer = millis();
    bonkSound.play(); // NEW: Play the sound effect once!
  }
}

function triggerSuccess() {
  isCheering = true;
  cheerTimer = millis(); 
  cheerSound.play();     
  
  score++; 
  
  resetGame(); 
}

function drawStartScreen() {
  background(skyColor);
  fill(255);
  textAlign(CENTER, CENTER);
  textFont(font);
  
  textSize(80);
  text("FLY BIRDY FLY", width / 2, height / 2 - 50);
  
  textSize(40);
  text("Press SPACE to Start", width / 2, height / 2 + 50);
  textAlign(LEFT, BASELINE); // Reset text alignment for the rest of the game
}

function drawGameOverScreen() {
  background(132, 153, 79); // Grass color background
  fill(255);
  textAlign(CENTER, CENTER);
  textFont(font);
  
  textSize(80);
  fill(255, 100, 100); // Red text
  text("GAME OVER!", width / 2, height / 2 - 80);
  
  textSize(50);
  fill(255);
  text("Final Score: " + score, width / 2, height / 2);
  
  textSize(40);
  text("Press SPACE to Try Again", width / 2, height / 2 + 80);
  textAlign(LEFT, BASELINE); // Reset text alignment
}