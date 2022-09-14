'use strict'

const canvas = document.querySelector('canvas');
canvas.width = 1024;
canvas.height = 600;
const ctx = canvas.getContext('2d');

const gandalfAccelY = 0.5;
const gandalfStep = 5;
const gandalfJump = 16;
const howDeepInMoss = 15;
const howCloseToPit = 20;

let gandalf;
let stages;
let slimes;
let backgroundObjects;
let backgroundImg;
let gandalfDistanceTraveled;

let isRightPressed = false;
let isLeftPressed = false;

let stayRight = new Image();
stayRight.src = "img/StayRight.png";

let stayLeft = new Image();
stayLeft.src = "img/StayLeft.png";

let runRight = new Image();
runRight.src = "img/RunRight.png";

let runLeft = new Image();
runLeft.src = "img/RunLeft.png";

let platform = new Image();
platform.src = "img/platform.png";

let smallPlatform = new Image();
smallPlatform.src = "img/SmallPlatform.png";

let stage = new Image();
stage.src = 'img/MediumStage1.png';

let background = new Image();
background.src = 'img/Background1.jpg';

let sideBackground = new Image();
sideBackground.src = 'img/Background2.jpg';

let mossSlopes = new Image();
mossSlopes.src = 'img/mossySlopes.png';

document.addEventListener('keydown', startMove, false);
document.addEventListener('keyup', finishMove, false);

//проверяю, находится ли игрок или его паротивник на платформе
function doesToutchThePlatform({obj, platform}) {
    return (obj.positionY + obj.height - howDeepInMoss <= platform.positionY &&
        obj.positionY + obj.height + obj.speedY - howDeepInMoss >= platform.positionY &&
        obj.positionX + obj.width - howCloseToPit >= platform.positionX &&
        obj.positionX + howCloseToPit <= platform.positionX + platform.width);
}
function doesHeroJumpOnTheEnemy({hero, enemy}) {
    return (hero.positionY + hero.height - howDeepInMoss <= enemy.positionY &&
        hero.positionY + hero.height + hero.speedY - howDeepInMoss >= enemy.positionY &&
        hero.positionX + hero.width - howCloseToPit >= enemy.positionX &&
        hero.positionX + howCloseToPit <= enemy.positionX + enemy.width);
}

class Wizzard {
    constructor(stayRight, stayLeft, runRight, runLeft) {
        this.positionX = 100;
        this.positionY = 100;
        this.width = 65;
        this.height = 145;
        this.speedX = 0;
        this.speedY = 0;
        this.accelY = gandalfAccelY;
        this.cadre = 0;
        this.standRight = stayRight;
        this.standLeft = stayLeft,
        this.runRight = runRight,
        this.runLeft = runLeft,
        this.currentState = this.standRight;
    }
    drawNewPosition() {
        if (this.positionY + this.height + this.speedY < canvas.height) {
            this.speedY += this.accelY;
        }

        this.positionX += this.speedX;
        this.positionY += this.speedY;

        ctx.drawImage(this.currentState, 165 * this.cadre, 0, 165, 277, this.positionX, this.positionY, this.width, this.height);
        this.cadre++;
        if (this.cadre > 79) {
            this.cadre = 0;
        }
    }
}

class Enemy {
    constructor(x, y, speedX, speedY) {
        this.positionX = x;
        this.positionY = y;
        this.speedX = speedX;
        this.speedY = speedY;
        this.accelY = gandalfAccelY;
        this.width = 50;
        this.height = 50;
    }
    drawEnemy() {
        if (this.positionY + this.height + this.speedY < canvas.height) {
            this.speedY += this.accelY;
        }

        this.positionX += this.speedX;
        this.positionY += this.speedY;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.positionX, this.positionY, this.width, this.height);
    }
}

class Background {
    constructor(x, y, image, imageWigth, imageHeight) {
        this.positionX = x;
        this.positionY = y;
        this.width = imageWigth;
        this.height = imageHeight;
        this.image = image;
    }
    drawBackground() {  
        ctx.drawImage(this.image, this.positionX, this.positionY);
    }
}

reset();
requestAnimationFrame(tick);

function tick() { 
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gandalf.accelY = gandalfAccelY;

    if (isRightPressed && gandalf.positionX < 500) {
        gandalf.speedX = gandalfStep;
    } else if ((isLeftPressed && gandalf.positionX > 200) ||
        (isLeftPressed && gandalfDistanceTraveled === 0 && gandalf.positionX > 0)) {
        gandalf.speedX = -gandalfStep;
    } else {
        gandalf.speedX = 0;
    }

    //для перемещения фона во время движения игрока
    //трюк подсмотрен в интернете
    if (isRightPressed && gandalf.speedX === 0) {
        backgroundObjects.forEach(backgroundObject => {backgroundObject.positionX -= 0.6 * gandalfStep});
        stages.forEach(stage => {stage.positionX -= gandalfStep});
        gandalfDistanceTraveled += gandalfStep;
        slimes.forEach(slime => {slime.positionX -= gandalfStep});
    }
    if (isLeftPressed && gandalf.speedX === 0 && gandalfDistanceTraveled > 0) {
        gandalfDistanceTraveled -= gandalfStep;
        backgroundObjects.forEach(backgroundObject => {backgroundObject.positionX += 0.6 * gandalfStep});
        stages.forEach(stage => {stage.positionX += gandalfStep});
        slimes.forEach(slime => {slime.positionX += gandalfStep});
    }

    //если игрок находится в пределах платформы
    stages.forEach(stage => {
        if (doesToutchThePlatform({obj:gandalf, platform: stage})) {
            gandalf.accelY = 0;
            gandalf.speedY = 0;
        }
        slimes.forEach(slime => {
            if (doesToutchThePlatform({obj: slime, platform: stage})) {
                slime.accelY = 0;
                slime.speedY = 0;
            }
        })
    });

    //условие проигрыша: если игрок упал - ресет
    if (gandalf.positionY > canvas.height) {
        reset();
    }

    backgroundImg.forEach(backgroundstep => backgroundstep.drawBackground());
    backgroundObjects.forEach(backgroundObject => backgroundObject.drawBackground());
    gandalf.drawNewPosition();
    slimes.forEach((slime, i) => 
        {slime.drawEnemy()
        //при прыжке на врага, игрока подбрасывает вверх, а враг исчезает. Можно использовать как трамплин
        if (doesHeroJumpOnTheEnemy({hero: gandalf, enemy: slime})) {
            gandalf.speedY -= 30;
            //setTimeout(() => {
                slimes.splice(i, 1);
            //}, 0);  
            //если игрок соприкоснулся с врагом - ресет
        } else if (gandalf.positionX + gandalf.width >= slime.positionX &&
                gandalf.positionY + gandalf.height > slime.positionY &&
                gandalf.positionX <= slime.positionX + slime.width) {
            reset();
        }
    });
    stages.forEach(stage => stage.drawBackground());
    
    requestAnimationFrame(tick);
}

function startMove(event) {
    event = event || window.event;
    //вперед
    if (event.code === 'KeyD') {
        gandalf.currentState = gandalf.runRight;
        isRightPressed = true;
    }
    //назад
    if (event.code === 'KeyA') {
        gandalf.currentState = gandalf.runLeft;
        isLeftPressed = true;
    }
    //прыжок
    if (event.code === 'KeyW') {
        gandalf.speedY -= gandalfJump;
    }
}

function finishMove(event) {
    event = event || window.event;
    //вперед
    if (event.code === 'KeyD') {
        gandalf.currentState = gandalf.standRight;
        isRightPressed = false;
    }
    //назад
    if (event.code === 'KeyA') {
        gandalf.currentState = gandalf.standLeft;
        isLeftPressed = false;
    }
}

function reset() {
    gandalf = new Wizzard(stayRight, stayLeft, runRight, runLeft);
    gandalfDistanceTraveled = 0;
    slimes = [new Enemy(800, 100, -0.3, 0)];
    stages = [
        new Background(200, 200, platform, 273, 120),
        new Background(500, 300, platform, 273, 120),
        new Background(0, 540, stage, 231, 120),
        new Background(230, 540, stage, 231, 120),
        new Background(550, 540, stage, 231, 120),
        new Background(781, 540, stage, 231, 120),
        new Background(1143, 300, smallPlatform, 123, 122),
        new Background(1512, 540, stage, 231, 120),
        new Background(1743, 540, stage, 231, 120),
    ];
    backgroundObjects = [
        new Background(-20, 400, mossSlopes, 7163, 371),   
    ];
    backgroundImg = [
        new Background(0, 0, background, 769, 610),
        new Background(769, 0, sideBackground, 769, 610),
    ]
}
