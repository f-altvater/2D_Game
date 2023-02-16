window.addEventListener('click', game);

let gameMode;

function game() {

    //canvas setup
    const playground = document.getElementById('playground');
    const controls = document.getElementById('htmlCssWrapper');
    const ctx = playground.getContext('2d');
    const playerHealthBar = document.getElementById('playerHealthBar');
    const playerCurrentHealth = document.getElementById('playerHealthBar');
    playground.width = 750;
    playground.height = 1000;
    let lastTime;

    class InputHandler{

        constructor(game){
            this.game = game;

            window.addEventListener('keydown', input => {
                
                if((    (input.key === 'ArrowLeft') ||
                        (input.key === 'ArrowRight')) 

                        && this.game.keys.indexOf(input.key) === -1) {

                    this.game.keys.push(input.key);  

                } else if(input.key === ' ' && (this.game.gamePlays && !this.game.gameOver && !this.game.waveCleared)) {

                    this.game.player.shoot();

                } else if(input.key === 'Enter' && this.game.gamePlays && (this.game.gameOver || this.game.waveCleared)) {
                        
                    this.game.newWave();

                } else if(input.key === ' ' && !this.game.gamePlays) {

                    controls.style.display = 'none';
                    playground.style.display = 'block';
                    this.game.gamePlays = !this.game.gamePlays;
                    removeWindowListener();
                    playerHealthBar.style.display = 'block';

                    console.log(this.game.gameMode);

                } else if(input.key === 'd') {

                    this.game.debug = !this.game.debug;

                }    
            })
            window.addEventListener('keyup', input => {

                if(this.game.keys.indexOf(input.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(input.key), 1);
                }

            })

            playground.addEventListener('click', coordinates => {
                if(this.game.waveCleared){
                    this.game.mouseX = coordinates.offsetX * (playground.width / playground.offsetWidth);
                    this.game.mouseY = coordinates.offsetY * (playground.height / playground.offsetHeight);

                    for(let i = 0; i < 4; i++) {

                        if( (coordinates.offsetX * (playground.width / playground.offsetWidth) > this.game.shopUI.buttons[i][0]) &&
                            (coordinates.offsetX * (playground.width / playground.offsetWidth) < this.game.shopUI.buttons[i][0] + this.game.shopUI.buttons[i][2]) &&
                            (coordinates.offsetY * (playground.height / playground.offsetHeight) > this.game.shopUI.buttons[i][1]) &&
                            (coordinates.offsetY * (playground.height / playground.offsetHeight) < this.game.shopUI.buttons[i][1] + this.game.shopUI.buttons[i][3])) {

                                this.game.shop.upgrade(this.game.shopUI.buttons[i][4]);

                            }

                    }
                }    
            })
        }

    }

    class LaserParticle{

        constructor(game, x, y, add = 0) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 3;
            this.height = 10;
            this.speedY = -3;
            this.delete = false
            this.damageAdd = add;
            this.baseDamage = 8;
            this.damage = this.baseDamage + this.damageAdd;
            this.image = document.getElementById('playerLaser');
        }

        update() {
            this.y += this.speedY;
            if(this.y < this.game.height * 0.1) this.delete = true;
        }

        draw(context) {

            if(this.game.debug){
                context.strokeRect(this.x, this.y, this.width, this.height);
            }
            
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

    }

    class RocketParticle{

        constructor(game, x, y, add) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.damageAdd = add;
            this.baseDamage = 0;
            this.damage = this.baseDamage + this.damageAdd;
            this.speedY = -6;
            this.width = 5;
            this.height = 10;
            this.delete = false;
            this.image = document.getElementById('playerRocket');
        }

        update() {
            this.y += this.speedY;
            if(this.y < this.game.height * 0.1) this.delete = true;
        }

        draw(context) {
            if(this.game.debug){
                context.fillStyle = 'green';
                context.strokeRect(this.x, this.y, this.width, this.height);
            }

            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

    }

    class HelperLaser{

        constructor(game, x, y, damage) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.damage = damage;
            this.width = 2;
            this.height = 5;
            this.speedY = -9;
            this.delete = false
            this.image = document.getElementById('helperLaser');
        }

        update() {
            this.y += this.speedY;
            if(this.y < this.game.height * 0.1) this.delete = true;
        }

        draw(context) {
            if(this.game.debug){
                context.fillStyle = 'white';
                context.fillRect(this.x, this.y, this.width, this.height);
            }

            context.drawImage(this.image, this.x, this.y, this.width, this.height)

        }

    }

    class Helper{

        constructor(game, x, amplifier, helperShots) {
            this.game = game;
            this.x = x;
            this.y = 855;
            this.height = 25;
            this.width = 60;
            this.speedX = (Math.random() * 1.5 + 0.5);
            this.baseDamage = 30;
            this.damageAmplifier = amplifier;
            this.damage = Math.floor(this.baseDamage * this.damageAmplifier);
            this.shots = [];
            this.shotTimer = 0;
            this.shotInterval = 1000;
            this.shotsFiring = helperShots;
            this.image = document.getElementById('playerHelper');
        }

        update(deltaTime) {
            this.x += this.speedX;

            if(this.shotTimer >= this.shotInterval) {
                for(let i = 0; i < this.shotsFiring; i++) {
                    this.shots.push(new HelperLaser(this.game, this.x + Math.random() * this.width, this.y, this.damage));
                }
                this.shotTimer = 0;
            } else this.shotTimer += deltaTime;

            this.shots.forEach(shot => shot.update());
            this.shots = this.shots.filter(shot => !shot.delete);

            //boundaries
            if(this.x > this.game.width - 0.75 * this.width) {
                    this.speedX = -((Math.random() * 1.2 + 0.3) * 1.25);
            } else if(this.x < -(0.25 * this.width)) {
                this.speedX = (Math.random() * 1.2 + 0.3) * 1.25;
            }

            this.shots = this.shots.filter(shot => !shot.delete);
        }

        draw(context) {
            if(!this.game.gameOver && !this.game.waveCleared) {
                if(this.game.debug){
                    context.fillStyle = 'white';
                    context.fillRect(this.x, this.y, this.width, this.height);
                    context.font = '20px Helvetica';
                    context.fillText('Damage: ' + this.damage, this.x, this.y);
                }

                this.shots.forEach(shot => shot.draw(context));
                context.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        }

    }

    class Player{

        constructor(game) {
            this.game = game;
            this.width = 200;
            this.height = 100;
            this.x = 200;
            this.y = 890;
            this.speedX = 0;
            this.speed = 2.5;
            this.laserShot = [];
            this.rocketsShot = [];
            this.rocketInterval = 1000;
            this.rocketTimer = 0;
            this.laserDamageAdd = 0;
            this.rocketDamageAdd = 0;
            this.baseHealth = 150;
            this.healthAdd = 0;
            this.health = Math.floor(this.baseHealth + this.healthAdd);
            this.helperAmount = 0;
            this.helper = [];
            this.helperDamageAmplifier = 0;
            this.helperShots = 1;
            this.image = document.getElementById('player');
        }

        update(deltaTime) {
            //movement
            if(this.game.keys.includes('ArrowRight')) this.speedX = this.speed;
            else if(this.game.keys.includes('ArrowLeft')) this.speedX = -this.speed;
            else this.speedX = 0;

            this.x += this.speedX;

            //boundaries
            if(this.x < 0 - this.width * 0.25) this.x = 0 - this.width * 0.25;
            else if(this.x + this.width > this.game.width + this.width * 0.25) this.x = this.game.width - this.width * 0.75;

            //updating shot lasers
            this.laserShot.forEach(laser => laser.update());
            this.laserShot = this.laserShot.filter(laser => !laser.delete);

            //adding rockets
            if(this.rocketDamageAdd > 0) {

                if(this.rocketTimer >= this.rocketInterval && this.game.shop.rocketUpgrades > 0) {
                    this.rocketsShot.push(  new RocketParticle(this.game, this.x + this.width * 0.25, this.y, this.rocketDamageAdd),
                                            new RocketParticle(this.game, this.x + this.width * 0.75, this.y, this.rocketDamageAdd));
                    this.rocketTimer = 0;                        
                } else {
                    this.rocketTimer += deltaTime;
                }

            }

            //helper handling
            if(this.helper.length < this.helperAmount) {
                for(let i = 0; i < this.helperAmount; i++){
                    this.helper.push(new Helper(this.game, this.x + this.width * 0.5, this.helperDamageAmplifier, this.helperShots));
                }

            }


            this.helper.forEach(helper => helper.update(deltaTime));
            this.rocketsShot.forEach(rocket => rocket.update());
            this.rocketsShot = this.rocketsShot.filter(rocket => !rocket.delete);
        }

        draw(context) {
            if(!this.game.gameOver && !this.game.waveCleared) {

                if(this.game.debug){
                    context.fillStyle = 'white';
                    context.strokeRect(this.x, this.y, this.width, this.height);
                    context.font = '20px Helvetica';
                    context.fillText(this.health, this.x, this.y);
                }

                this.laserShot.forEach(laser => laser.draw(context));
                this.rocketsShot.forEach(rocket => rocket.draw(context));
                this.helper.forEach(helper => helper.draw(context));

                context.drawImage(this.image, this.x, this.y, this.width, this.height);

                playerCurrentHealth.style.width = '' + this.health / (this.baseHealth + this.healthAdd) + '%';
            }
        }

        shoot() {
            if(this.game.laserAmmo > 0) {
                this.laserShot.push(new LaserParticle(this.game, this.x + 10, this.y, this.laserDamageAdd),
                                    new LaserParticle(this.game, this.x + this.width - 10, this.y, this.laserDamageAdd));
                this.game.laserAmmo --;
            }
        }

    }

    class EnemyParticle{

        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 5;
            this.height = 10;
            this.speedY = (Math.random() * 1.2 + 0.3) / 0.5;
            this.delete = false;
            this.damage = 20;
            this.delete = false;
            this.image = document.getElementById('enemyLaser');
        }

        update() {
            this.y += this.speedY;
            if(this.y > 0.95 * this.game.height) this.delete = true;
        }

        draw(context) {
            if(this.game.debug){
                context.fillStyle = 'red';
                context.fillRect(this.x, this.y, this.width, this.height);
            }

            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

    }

    class Enemy{

        constructor(game, healthScaling, damageAmplifier, y = 0) {
            this.game = game;
            this.y = y;
            this.delete = false;
            this.speedY = (Math.random() * 1.2 + 0.3);
            this.healthScaling = healthScaling;
            this.damageAmplifier = damageAmplifier;
        }

        update() {
            if(this.game.gameMode === 'easy'){
                this.y += this.speedY;
            } else if(this.game.gameMode === 'normal'){
                this.y += this.speedY * 1.25;
            } else {
                this.y += this.speedY * 1.5;
            }
            
            if(this.y > this.game.height){
                this.delete = true;
                if(this.game.gameMode === 'normal'){

                    this.game.score -= this.score / 2;
                    this.game.player.health -= Math.ceil(this.damage / 2);

                    if(this.damage !== 3){
                        this.game.gold -= Math.ceil(this.gold / 2 );
                    }
                } else if(this.game.gameMode === 'noMercy'){

                    this.game.score -= this.score;
                    this.game.player.health -= this.damage;
                    this.game.gold -= this.gold;

                }
            }
        }

        draw(context) {

            if(this.game.debug){
                context.fillStyle = this.color;
                context.strokeRect(this.x, this.y, this.width, this.height);
                context.font = '20px Helvetica';
                context.fillText(this.health, this.x, this.y);
            }

            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

    }

    class MainEnemy1 extends Enemy{

        constructor(game, healthScaling, damageAmplifier, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, damageAmplifier, y);
            this.x = x;
            this.baseHealth = 25;
            this.baseDamage = 10;
            this.damage = Math.floor(this.baseDamage * this.damageAmplifier);
            this.width = 50;
            this.height = 50;
            this.color = 'red';
            this.health = Math.floor(this.baseHealth * this.healthScaling);
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
            this.image = document.getElementById('enemyOne');
        }

    }

    class MainEnemy2 extends Enemy{

        constructor(game, healthScaling, damageAmplifier, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, damageAmplifier, y);
            this.x = x;
            this.baseHealth = 35;
            this.baseDamage = 10;
            this.damage = Math.floor(this.baseDamage * this.damageAmplifier);
            this.width = 60;
            this.height = 40;
            this.color = 'green';
            this.health = Math.floor(this.baseHealth * this.healthScaling);
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
            this.image = document.getElementById('enemyTwo');
        }

    }

    class MainEnemy3 extends Enemy{

        constructor(game, healthScaling, damageAmplifier, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, damageAmplifier, y);
            this.x = x;
            this.baseHealth = 20;
            this.baseDamage = 10;
            this.damage = Math.floor(this.baseDamage * this.damageAmplifier);
            this.width = 40;
            this.height = 60;
            this.color = 'orange';
            this.health = Math.floor(this.baseHealth * this.healthScaling);
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
            this.image = document.getElementById('enemyThree');
        }

    }

    class Tank extends Enemy{

        constructor(game, healthScaling, damageAmplifier) {
            super(game, healthScaling, damageAmplifier);
            this.x = Math.random() * (this.game.width * 0.75);
            this.baseHealth = 500;
            this.baseDamage = 20;
            this.damage = Math.floor(this.baseDamage * this.damageAmplifier);
            this.width = 250;
            this.height = 100;
            this.speedY = (Math.random() * 1.2 + 0.3) * 0.75;
            this.color = 'black';
            this.health = Math.floor(this.baseHealth * this.healthScaling);
            this.gold = Math.floor((Math.random() * 1.5) * this.health / 3);
            this.score = this.health;
            this.image = document.getElementById('enemyTank');
        }

    }

    class GoldDigger extends Enemy{

        constructor(game, healthScaling, damageAmplifier, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, damageAmplifier, y);
            this.x = x;
            this.baseHealth = 20;
            this.damage = 3;
            this.width = 30;
            this.height = 45;
            this.speedY = (Math.random() * 1.2 + 0.3) / 0.25;
            this.color = 'yellow';
            this.health = Math.floor(this.baseHealth * this.healthScaling);
            this.gold =  Math.ceil(Math.random() * 3) * Math.ceil((Math.random() * 5) * this.health);
            this.score = this.health;
            this.image = document.getElementById('enemyGoldDigger');
        }

    }

    class Transporter extends Enemy{

        constructor(game, healthScaling, damageAmplifier) {
            super(game, healthScaling, damageAmplifier);
            this.x = Math.random() * (this.game.width * 0.75);
            this.baseHealth = 150;
            this.baseDamage = 20;
            this.damage = Math.floor(this.baseDamage * this.damageAmplifier);
            this.width = 150;
            this.height = 75;
            this.speedY = (Math.random() * 1.2 + 0.3) * 0.75;
            this.color = 'white';
            this.health = Math.floor(this.baseHealth * this.healthScaling);
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
            this.image = document.getElementById('enemyTransport');
        }

    }

    class Boss extends Enemy{

        constructor(game, healthScaling, damageAmplifier, y = 50) {
            super(game, healthScaling, damageAmplifier, y);
            this.x = Math.random() * (this.game.width * 0.5);
            this.baseHealth = 2000;
            this.baseDamage = 20;
            this.damage = Math.floor(this.baseDamage * (this.damageAmplifier - 0.5));
            this.width = 400;
            this.height = 75;
            this.speedY = 0;
            this.speedX = (Math.random() * 1.2 + 0.3) * 0.75;
            this.color = 'black';
            this.shots = [];
            this.shotInterval = 1000;
            this.shotTimer = 0;
            this.health = Math.floor(this.baseHealth * this.healthScaling);
            this.gold = Math.floor((Math.random() * 1.5) * this.health / 2);
            this.score = this.health;
            this.image1 = document.getElementById('bossAppOne');
            this.image2 = document.getElementById('bossAppTwo');
            this.image3 = document.getElementById('bossAppThree');
            this.imageArray = [this.image1, this.image2, this.image3];
            this.image = this.imageArray[Math.floor(Math.random() * 2)];
        }

        update(deltaTime) {
            this.x += this.speedX;

            if(this.shotTimer >= this.shotInterval) {
                this.shoot();
                this.shotTimer = 0;
            } else this.shotTimer += deltaTime;    

            this.shots.forEach(shot => shot.update());
            this.shots = this.shots.filter(shot => !shot.delete);

            //boundaries
            if(this.x > this.game.width - 0.75 * this.width) {
                    this.speedX = -((Math.random() * 1.2 + 0.3) * 1.25);
            } else if(this.x < -(0.25 * this.width)) {
                this.speedX = (Math.random() * 1.2 + 0.3) * 1.25;
            }

            this.shots = this.shots.filter(shot => !shot.delete);
        }    

        shoot() {
            this.shots.push(new EnemyParticle(this.game, this.x + (Math.random() * this.width), this.y + this.height));
            this.shots.push(new EnemyParticle(this.game, this.x + (Math.random() * this.width), this.y + this.height));  
        }

        draw(context) {
            this.shots.forEach(shot => shot.draw(context));
            context.drawImage(this.image, this.x, this.y, this.width, this.height);

            if(this.game.debug){
                context.fillStyle = this.color;
                context.strokeRect(this.x, this.y, this.width, this.height);
                context.font = '20px Helvetica';
                context.fillText(this.health, this.x, this.y);
            }
        }

    }

    class Shop{

        constructor(game) {
            this.game = game;
            this.laserUpgrades = 0;
            this.rocketUpgrades = 0;
            this.healthUpgrades = 0;
            this.helperUpgrades = 0;
            this.laserCost = 95;
            this.rocketCost = 150;
            this.healthCost = 250;
            this.helperCost = 400;
        }

        upgrade(element) {
            if(element === 'laserUpgrade' && this.game.gold >= this.laserCost) {
                this.game.gold -= this.laserCost;
                this.laserUpgrades ++;
                this.laserCost += Math.floor(this.laserCost * 0.25);
                this.applyUpgrades('laser');
            } else if(element === 'rocketUpgrade' && this.game.gold >= this.rocketCost) {
                this.game.gold -= this.rocketCost;
                this.rocketUpgrades ++;
                this.rocketCost += Math.floor(this.rocketCost * 0.5);
                this.applyUpgrades('rocket');
            } else if(element === 'healthUpgrade' && this.game.gold >= this.healthCost) {
                this.game.gold -= this.healthCost;
                this.healthUpgrades ++;
                this.healthCost += Math.floor(this.healthCost * 0.75);
                this.applyUpgrades('health');
            } else if(element === 'helperUpgrade' && this.game.gold >= this.helperCost) {
                this.game.gold -= this.helperCost;
                this.helperUpgrades ++;
                this.helperCost += Math.floor(this.helperCost * 0.8);
                this.applyUpgrades('helper');
            }
        }

        applyUpgrades(e) {

            if(e === 'laser'){
                this.game.player.laserDamageAdd = 4 * this.laserUpgrades;
                
                if(this.laserUpgrades%5 === 0){
                    this.game.laserAmmoInterval -= 50;
                }

            } else if(e === 'rocket'){
                this.game.player.rocketDamageAdd = 10 * this.rocketUpgrades;

            } else if(e === 'health'){
                this.game.player.healthAdd = 50 * this.healthUpgrades;
                this.game.player.health = this.game.player.baseHealth + this.game.player.healthAdd;

            } else if(e === 'helper'){
                if(this.helperUpgrades < 4 && this.helperUpgrades > 0){
                    this.game.player.helperAmount = 1;
                    this.game.player.helperDamageAmplifier += 0.5;
                    this.game.player.helper = [];

                } else if(this.helperUpgrades < 8 && this.helperUpgrades > 0){
                    this.game.player.helper = [];
                    this.game.player.helperShots = 2;
                    this.game.player.helperDamageAmplifier += 0.5
                } else if(this.helperUpgrades > 0){
                    this.game.player.helper = [];
                    this.game.player.helperAmount = 2
                    this.game.player.helperDamageAmplifier += 0.5
                }
            }
            
        }

    }

    class ShopUI{

        constructor(game) {
            this.game = game;
            this.color = 'yellow';
            this.fontFamily = 'Helvetica';
            this.fontSize = 20;
            this.buttons = [];
        }

        draw(context) {
            context.fillStyle = this.color;
            context.font = this.fontSize + 'px ' + this.fontFamily;

            //gold
            context.fillText('Gold: ' + this.game.gold, 550, 40);

            //next wave button
            context.fillStyle = 'white';
            context.font = 2.5 * this.fontSize + 'px ' + this.fontFamily;
            context.fillText('press Enter', 245, 300)
            context.fillText('to start next wave', 180, 400)

            //upgrade buttons
            for(let i = 0; i < 4; i++) {
                let text;
                context.fillStyle = this.color;
                context.font = '15px ' + this.fontFamily;
                context.fillRect(35 + 175 * i, 500, 150, 150);

                if(i === 0) {
                    text = 'laserUpgrade';
                    context.fillStyle = 'black';
                    context.fillText('Upgrade your Lasers', 42 + 175 * i, 525);
                    context.fillText('Costs: ' + this.game.shop.laserCost, 75 + 175 * i, 625);
                } else if(i === 1) {
                    text = 'rocketUpgrade';
                    context.fillStyle = 'black';
                    context.fillText('Upgrade your Rockets', 38 + 175 * i, 525);
                    context.fillText('Costs: ' + this.game.shop.rocketCost, 75 + 175 * i, 625);
                } else if(i === 2) {
                    text = 'healthUpgrade';
                    context.fillStyle = 'black';
                    context.fillText('Upgrade your Health', 43 + 175 * i, 525);
                    context.fillText('Costs: ' + this.game.shop.healthCost, 75 + 175 * i, 625);
                } else if(i === 3){
                    text = 'helperUpgrade';
                    context.fillStyle = 'black';
                    context.fillText('Upgrade your Helpers', 40 + 175 * i, 525);
                    context.fillText('Costs: ' + this.game.shop.helperCost, 75 + 175 * i, 625);
                }
                this.storeButtons(35 + 175 * i, 500, 150, 150, text);
            }

            //info sheets for upgradeables
            for(let i = 0; i < 4; i++) {
                let xCoord = 40 + 175 * i;
                context.fillStyle = 'rgb(50, 50, 50)';
                context.font = '15px ' + this.fontFamily;
                context.fillRect(36 + 175 * i, 665, 150, 310);
                context.fillStyle = 'white';
                if(i === 0) {
                    context.fillText('Current Damage: ' + (8 + this.game.player.laserDamageAdd), xCoord, 690);
                }else if(i === 1){
                    context.fillText('Current Damage: ' + (this.game.player.rocketDamageAdd), xCoord, 690);
                }else if(i === 2){
                    context.fillText('Current Health: ' + (this.game.player.health), xCoord, 690)
                }else if(i === 3){
                    context.fillText('Current Helpers: ' + (this.game.player.helper.length), xCoord, 690);
                    context.fillText('Current Damage: ' + (30 * this.game.player.helperDamageAmplifier), xCoord, 740);
                    
                }
            }
        }

        storeButtons(x, y, w, h, text) {
            if(this.buttons.length < 4)this.buttons.push([x, y, w, h, text]);
        }
        
    }

    class MainUI{

        constructor(game) {
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Helvetica';
            this.color = 'white';
        }

        draw(context) {
            context.save();

            context.fillStyle = this.color;
            context.font = this.fontSize + 'px ' + this.fontFamily;

            //debug
            if(this.game.debug){
                context.fillText('Enemy Interval: ' + this.game.enemyInterval / 1000, 500, 100);
                context.fillText('Reload Time Laser: ' + this.game.laserAmmoInterval / 1000, 20, 150);
            }

            //score
            context.fillText('Score: ' + this.game.score, 20, 40);

            //gold
            context.fillText('Gold: ' + this.game.gold, 550, 40);

            //time
            let formattedTime = (this.game.waveTime * 0.001).toFixed(1);
            context.fillText('Time left: ' + formattedTime, 20, 100);

            //wave counter
            context.fillText('Wave ' + this.game.waveCount, 300, 40);

            //laser ammo
            for(let i = 0; i < this.game.laserAmmo; i++) {
                context.fillRect(20 + 5 * i, 50, 3, 20);
            }

            //game over and wave cleared messages
            if(this.game.gameOver) {
                let message1 = 'Game Over!';
                let message2;
                let message2xCoord;

                if(this.game.waveCount > 1) {
                    message2 = 'You have cleared ' + (this.game.waveCount - 1) + ' waves! Good job!';
                    message2xCoord = this.game.width * 0.23;
                } else {
                    message2 = 'You have cleared no waves. Better luck next time!';
                    message2xCoord = this.game.width * 0.15;
                }    

                context.font = '70px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.25, this.game.height * 0.5);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message2, message2xCoord, this.game.height * 0.5 + 40);
            }

            context.restore();
        }

    }

    class Layer{

        constructor(game, image, scrollSpeedAmp){
            this.game = game;
            this.image = image;
            this.scrollSpeedAmp = scrollSpeedAmp;
            this.width = 750;
            this.height = 1000;
            this.x = 0;
            this.y = 0;
        }

        update(){
            if(this.y >= this.height) this.y = 0;
            this.y += this.game.speed * this.scrollSpeedAmp;
        }

        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x, this.y - this.height, this.width, this.height);
        }

    }

    class Background{

        constructor(game){
            this.game = game;
            this.image1 = document.getElementById('backgroundNebulaWhite');
            this.image2 = document.getElementById('backgroundNebulaBlue');
            this.image3 = document.getElementById('backgroundNebulaPink');
            this.layer1 = new Layer(this.game, this.image1, 0.6);
            this.layer2 = new Layer(this.game, this.image2, 1.2);
            this.layer3 = new Layer(this.game, this.image3, 1.0);
            this.layer = [this.layer1, this.layer2, this.layer3];
        }

        update(){
            this.layer.forEach(layer => layer.update());
        }

        draw(context){
            this.layer.forEach(layer => layer.draw(context));
        }

    }

    class Game{

        constructor(width, height, mode) {
            this.width = width;
            this.height = height;
            this.gameMode = mode;
            this.background = new Background(this);
            this.input = new InputHandler(this);
            this.mainUI = new MainUI(this);
            this.player = new Player(this);
            this.shop = new Shop(this);
            this.shopUI = new ShopUI(this);
            this.keys = [];
            this.enemies = [];
            this.laserAmmo = 10;
            this.maxLaserAmmo = 30;
            this.rockets = 0;
            this.laserAmmoTimer = 0;
            this.laserAmmoInterval = 750;
            this.rocketTimer = 0;
            this.rocketInterval = 0;
            this.gameOver = false;
            this.waveCleared = false;
            this.enemyTimer = 0;
            this.enemyInterval = 1250;
            this.score = 0;
            this.gold = 0;
            this.waveCount = 1;
            this.enemyHealthAmp = 1;
            this.enemyDamageAmp = 1;
            this.TimeLimit = 20000;
            this.waveTime = this.TimeLimit;
            this.speed = 1;
            this.debug = false;
            this.gamePlays = false;
        }

        update(deltaTime) {
            if(this.gamePlays){

                if(!this.gameOver && !this.waveCleared) this.waveTime -= deltaTime;

                this.player.update(deltaTime);

                this.background.update();

                //ammo refreshing
                this.laserAmmoTimer += deltaTime;
                if(this.laserAmmoTimer > this.laserAmmoInterval) {
                    if(this.laserAmmo < this.maxLaserAmmo) this.laserAmmo ++;
                    this.laserAmmoTimer = 0;
                } else this.laserAmmoTimer += deltaTime;

                //enemy spawns
                if(this.waveTime < 2 && !this.checkForBoss() && this.waveCount%5 === 0 && !this.waveCleared && !this.gameOver) {
                    
                    this.enemies.push(new Boss(this, this.enemyHealthAmp, this.enemyDamageAmp));
                
                } else if(this.enemyTimer > this.enemyInterval && (!this.gameOver && this.waveTime > 0)) {
                    
                    let enemyType = Math.random();
                    if(this.waveCount < 5) {   
                        
                        if(enemyType < 0.33) this.enemies.push(new MainEnemy1(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.66) this.enemies.push(new MainEnemy2(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.99) this.enemies.push(new MainEnemy3(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else this.enemies.push(new GoldDigger(this, this.enemyHealthAmp, this.enemyDamageAmp));

                    } else if (this.waveCount < 9) {

                        if(enemyType < 0.32) this.enemies.push(new MainEnemy1(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.64) this.enemies.push(new MainEnemy2(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.94) this.enemies.push(new MainEnemy3(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.99) this.enemies.push(new Transporter(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else this.enemies.push(new GoldDigger(this, this.enemyHealthAmp, this.enemyDamageAmp));

                    } else {

                        if(enemyType < 0.2) this.enemies.push(new MainEnemy1(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.4) this.enemies.push(new MainEnemy2(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.6) this.enemies.push(new MainEnemy3(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.8) this.enemies.push(new Transporter(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else if(enemyType < 0.99) this.enemies.push(new Tank(this, this.enemyHealthAmp, this.enemyDamageAmp));
                        else this.enemies.push(new GoldDigger(this, this.enemyHealthAmp, this.enemyDamageAmp));

                    }
                    this.enemyTimer = 0;
            
                }else this.enemyTimer += deltaTime;
            
                //enemy updates
                this.enemies.forEach(enemy => {
                    enemy.update(deltaTime);

                    //boss laser checker
                    if(enemy instanceof Boss) {
                        enemy.shots.forEach(shot => {
                            if(this.checkCollision(shot, this.player)) {
                                this.player.health -= enemy.damage;
                                shot.delete = true;
                                if(this.player.health <= 0) this.gameOver = true;
                            }
                            
                        })
                    }

                    //enemy and player collision check
                    if(this.checkCollision(this.player, enemy)) {
                        if(!this.waveCleared) {
                            if(!(enemy instanceof GoldDigger)){
                                this.score -= enemy.score;
                                this.gold -= enemy.gold;
                                this.player.health -= enemy.damage;
                            }
                            this.player.health -= enemy.damage;
                        }   
                        enemy.delete = true;
                        if(this.player.health <= 0) {
                            this.gameOver = true;
                            this.waveCleared = false;
                        }
                    }
                
                
                    if(!this.gameOver){
                        //enemy and laser check
                        this.player.laserShot.forEach(laser => {
                        this.applyCollisions(laser, enemy);
                        })
    
                        //enemy and rocket check
                        this.player.rocketsShot.forEach(rocket => {
                            this.applyCollisions(rocket, enemy);
                        })
    
                        //enemy and helper laser check
                        this.player.helper.forEach(helper => {
    
                            helper.shots.forEach(shot => {
                                this.applyCollisions(shot, enemy);
                                console.log(shot.damage);
                            })
    
                        })
                    }
                });

                if(this.gameOver || (this.waveTime <=0)) {
                    this.enemies.forEach(enemy => {
                        if(!(enemy instanceof Boss)) enemy.delete = true;
                    });
                    this.waveTime = 0;
                }    

                this.enemies = this.enemies.filter(enemy => !enemy.delete);

                if(this.waveCounter%5 != 0 && this.waveTime <= 0 && !this.checkForBoss() && !this.gameOver) this.waveCleared = true;

                }
            
        }

        draw(context) {
            if(this.gamePlays){

                this.background.draw(context);
                this.enemies.forEach(enemy => enemy.draw(context));
                this.player.draw(context);

                //main UI
                if(!this.gameOver && !this.waveCleared) this.mainUI.draw(context);

                if(this.gameOver) this.mainUI.draw(context);

                //show Shop
                if(this.waveCleared) this.shopUI.draw(context);

            }
        }

        checkCollision(rect1, rect2) {
            return (rect1.x < rect2.x + rect2.width &&
                    rect1.x + rect1.width > rect2.x &&
                    rect1.y < rect2.y + rect2.height &&
                    rect1.y + rect1.height > rect2.y);
        }

        checkForBoss() {
            let boss = [];

            this.enemies.forEach(enemy => {
                if (enemy instanceof Boss) boss.push(enemy);
            })

            return boss.length === 1;
        }

        newWave() {
            if(this.waveCleared) {
                    
                this.waveCount ++;
                this.TimeLimit += 2500;
                this.waveCleared = false;
                this.gameOver = false;
                this.waveTime = this.TimeLimit;
                this.laserAmmo = 10;

                if(this.gameMode === 'easy'){
                    this.player.health = this.player.baseHealth + this.player.healthAdd;
                } else if(this.gameMode === 'normal' && this.player.health < this.player.baseHealth + this.player.healthAdd - 25){
                    this.player.health += 25;
                }

                if(this.waveCount%3 === 0 && this.gameMode !== 'easy'){
                    this.enemyHealthAmp += 0.5;

                    if(this.gameMode === 'noMercy'){
                        this.enemyDamageAmp += 1;

                        if(this.enemyInterval > 600){
                            this.enemyInterval -= 150
                        }
                    }
                }

                if(this.waveCount%5 === 0 && this.gameMode == 'normal'){
                    this.enemyDamageAmp += 1;

                    if(this.enemyInterval > 800){
                        this.enemyInterval -= 150;
                    }
                }
                
            } else {
                    
                this.shop.healthUpgrades = 0;
                this.shop.laserUpgrades = 0;
                this.shop.rocketUpgrades = 0;
                this.shop.helperUpgrades = 0;
                this.waveCount = 1;
                this.TimeLimit = 20000;
                this.waveCleared = false;
                this.waveTime = this.TimeLimit;
                this.enemies = [];
                this.gameOver = false;
                this.player.health = this.player.baseHealth
                this.laserAmmoInterval = 750;
                this.player.helper = [];
                this.player.helperAmount = 0;
                this.enemyDamageAmp = 1;
                this.enemyHealthAmp = 1;
                this.enemyInterval = 1250;
                
            }
        }

        applyCollisions(type, enemy) {

            if(this.checkCollision(type, enemy)) {
                enemy.health -= type.damage;
                type.delete = true;

                if(enemy.health <= 0) {
                    enemy.delete = true;
                    if(enemy instanceof Transporter) { //spawning between 3 and 5 smaller enemies if enemy was a transporter
                        
                        let enemiesTransported = 3 + Math.floor(Math.random()  * 2);
                
                        if(enemiesTransported === 3) {
                            for(let i = 0; i < 3; i++) {
                                let encounter = Math.random();
                    
                                if(encounter < 0.3) this.enemies.push(new MainEnemy1(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if(encounter < 0.6) this.enemies.push(new MainEnemy2(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if( encounter < 0.9) this.enemies.push(new MainEnemy3(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else this.enemies.push(new GoldDigger(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                
                            }
                        } else if(enemiesTransported === 4) {
                            for(let i = 0; i < 4; i++) {
                                let encounter = Math.random();
                    
                                if(encounter < 0.3) this.enemies.push(new MainEnemy1(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if(encounter < 0.6) this.enemies.push(new MainEnemy2(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if( encounter < 0.9) this.enemies.push(new MainEnemy3(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else this.enemies.push(new GoldDigger(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                
                            }
                        } else {
                            for(let i = 0; i < 5; i++) {
                                let encounter = Math.random();
                    
                                if(encounter < 0.3) this.enemies.push(new MainEnemy1(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if(encounter < 0.6) this.enemies.push(new MainEnemy2(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if( encounter < 0.9) this.enemies.push(new MainEnemy3(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else this.enemies.push(new GoldDigger(this, this.enemyHealthAmp, this.enemyDamageAmp, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                
                            }
                        }
                    
                    }

                    if(enemy instanceof Boss) {
                        this.waveCleared = true;
                    }

                    if(!this.gameOver && !this.waveCleared){
                        this.score += enemy.score;
                        this.gold += enemy.gold;
                    }
                }
            }
            
        }

    }

    let game = new Game(playground.width, playground.height, gameMode);
        
    function animate(timeStamp) {
            
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
            
        ctx.clearRect(0, 0, playground.width, playground.height);

        if(game.gamePlays){
           game.update(deltaTime);
            game.draw(ctx);  
        }
        
        requestAnimationFrame(animate);
        
    }
    animate(0);
    
};

function returnGameMode(mode){
    gameMode = mode;
    if(mode === 'easy'){
        document.getElementById('easyMode').style.boxShadow = '0px 0px 5px 5px #43b02a';
        document.getElementById('normalMode').style.boxShadow = 'none';
        document.getElementById('noMercy').style.boxShadow = 'none';
            
        document.getElementsByClassName('startGame')[0].style.display = 'flex';

    } else if(mode === 'normal'){
        document.getElementById('normalMode').style.boxShadow = '0px 0px 5px 5px white';
        document.getElementById('easyMode').style.boxShadow = 'none';
        document.getElementById('noMercy').style.boxShadow = 'none';

        document.getElementsByClassName('startGame')[0].style.display = 'flex';
    } else if(mode === 'noMercy'){
        document.getElementById('noMercy').style.boxShadow = '0px 0px 5px 5px  #da291c ';
        document.getElementById('normalMode').style.boxShadow = 'none';
        document.getElementById('easyMode').style.boxShadow = 'none';

        document.getElementsByClassName('startGame')[0].style.display = 'flex';
    }
};

function removeWindowListener(){
    window.removeEventListener('click', game);
}