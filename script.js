window.addEventListener('load', function() {

    //canvas setup
    const playground = this.document.getElementById('playground');
    const ctx = playground.getContext('2d');
    playground.width = 750;
    playground.height = 1000;

    class InputHandler{

        constructor(game) {
            this.game = game;

            window.addEventListener('keydown', input => {
                
                if((    (input.key === 'ArrowLeft') ||
                        (input.key === 'ArrowRight')) 

                        && this.game.keys.indexOf(input.key) === -1) {

                    this.game.keys.push(input.key);  

                } else if(input.key === ' ' && (!this.game.gameOver && !this.game.waveCleared)) {

                    this.game.player.shoot();

                } else if(input.key === 'Enter') {

                    this.game.newWave();

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
                    console.log(`x: ${this.game.mouseX} | y: ${this.game.mouseY}`);
                    console.log(this.game.shopUI.buttons);

                    for(let i = 0; i < 4; i++) {

                        if( (this.game.mouseX > this.game.shopUI.buttons[i][0]) &&
                            (this.game.mouseX < this.game.shopUI.buttons[i][0] + this.game.shopUI.buttons[i][2]) &&
                            (this.game.mouseY > this.game.shopUI.buttons[i][1]) &&
                            (this.game.mouseY < this.game.shopUI.buttons[i][1] + this.game.shopUI.buttons[i][3])) {

                                this.game.shop.upgrade(this.game.shopUI.buttons[i][4]);
                                this.game.shop.applyUpgrades();

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
            this.baseDamage = 10;
            this.damage = this.baseDamage + this.damageAdd;
        }

        update() {
            this.y += this.speedY;
            if(this.y < this.game.height * 0.1) this.delete = true;
        }

        draw(context) {
            context.strokeRect(this.x, this.y, this.width, this.height);
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
        }

        update() {
            this.y += this.speedY;
            if(this.y < this.game.height * 0.1) this.delete = true;
        }

        draw(context) {
            context.fillStyle = 'green';
            context.strokeRect(this.x, this.y, this.width, this.height);
        }

    }

    class HelperLaser {

        constructor(game, x, y, damage) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.damage = damage;
            this.width = 2;
            this.height = 5;
            this.speedY = -9;
            this.delete = false
        }

        update() {
            this.y += this.speedY;
            if(this.y < this.game.height * 0.1) this.delete = true;
        }

        draw(context) {
            context.fillStyle = 'white';
            context.fillRect(this.x, this.y, this.width, this.height);
        }

    }

    class Helper {

        constructor(game, x, amplifier, helperShots) {
            this.game = game;
            this.x = x;
            this.y = 855;
            this.height = 25;
            this.width = 60;
            this.speedX = (Math.random() * 1.5 + 0.5);
            this.baseDamage = 15;
            this.damageAmplifier = amplifier;
            this.damage = Math.floor(this.baseDamage * this.damageAmplifier);
            this.shots = [];
            this.shotTimer = 0;
            this.shotInterval = 1000;
            this.shotsFiring = helperShots;
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
                context.fillStyle = 'white';
                context.fillRect(this.x, this.y, this.width, this.height);
                context.font = '20px Helvetica';
                context.fillText('Damage: ' + this.damage, this.x, this.y);

                this.shots.forEach(shot => shot.draw(context));
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
            this.baseHealth = 100;
            this.healthAdd = 1;
            this.health = Math.floor(this.baseHealth * this.healthAdd);
            this.helperAmount = 0;
            this.helper = [];
            this.helperDamageAmplifier = 1;
            this.helperShots = 1;
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

                if(this.rocketTimer >= this.rocketInterval) {
                    this.rocketsShot.push(  new RocketParticle(this.game, this.x + this.width * 0.25, this.y, this.rocketDamageAdd),
                                            new RocketParticle(this.game, this.x + this.width * 0.75, this.y, this.rocketDamageAdd));
                    this.rocketTimer = 0;                        
                } else {
                    this.rocketTimer += deltaTime;
                }

            }

            //helper handling
            if(this.helper.length < this.helperAmount) {
                this.helper.push(new Helper(this.game, this.x + this.width * 0.5, this.helperDamageAmplifier, this.helperShots));
            }


            this.helper.forEach(helper => helper.update(deltaTime));
            this.rocketsShot.forEach(rocket => rocket.update());
            this.rocketsShot = this.rocketsShot.filter(rocket => !rocket.delete);
        }

        draw(context) {
            if(!this.game.gameOver && !this.game.waveCleared) {
                context.fillStyle = 'white';
                context.strokeRect(this.x, this.y, this.width, this.height);
                context.font = '20px Helvetica';
                context.fillText(this.health, this.x, this.y);

                this.laserShot.forEach(laser => laser.draw(context));
                this.rocketsShot.forEach(rocket => rocket.draw(context));
                this.helper.forEach(helper => helper.draw(context));
            }
        }

        shoot() {
            if(this.game.laserAmmo > 0) {
                this.laserShot.push(new LaserParticle(this.game, this.x, this.y, this.laserDamageAdd),
                                    new LaserParticle(this.game, this.x + this.width, this.y, this.laserDamageAdd));
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
        }

        update() {
            this.y += this.speedY;
            if(this.y > 0.95 * this.game.height) this.delete = true;
        }

        draw(context) {
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y, this.width, this.height);
        }

    }

    class Enemy{

        constructor(game, healthScaling = 1, y = 0) {
            this.game = game;
            this.y = y;
            this.delete = false;
            this.speedY = (Math.random() * 1.2 + 0.3);
            this.healthScaling = healthScaling;
        }

        update() {
            this.y += this.speedY;
            if(this.y > this.game.height) this.delete = true;
        }

        draw(context) {
            context.fillStyle = this.color;
            context.strokeRect(this.x, this.y, this.width, this.height);
            context.font = '20px Helvetica';
            context.fillText(this.health, this.x, this.y);
        }

    }

    class MainEnemy1 extends Enemy{

        constructor(game, healthScaling = 1, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, y);
            this.x = x;
            this.baseHealth = 25;
            this.damage = 10;
            this.width = 50;
            this.height = 50;
            this.color = 'red';
            this.health = this.baseHealth * this.healthScaling;
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
        }

    }

    class MainEnemy2 extends Enemy{

        constructor(game, healthScaling = 1, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, y);
            this.x = x;
            this.baseHealth = 35;
            this.damage = 10;
            this.width = 60;
            this.height = 40;
            this.color = 'green';
            this.health = this.baseHealth * this.healthScaling;
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
        }

    }

    class MainEnemy3 extends Enemy{

        constructor(game, healthScaling = 1, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, y);
            this.x = x;
            this.baseHealth = 20;
            this.damage = 10;
            this.width = 40;
            this.height = 60;
            this.color = 'orange';
            this.health = this.baseHealth * this.healthScaling;
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
        }

    }

    class Tank extends Enemy{

        constructor(game, healthScaling = 1) {
            super(game, healthScaling);
            this.x = Math.random() * (this.game.width * 0.75);
            this.baseHealth = 150;
            this.damage = 20;
            this.width = 250;
            this.height = 100;
            this.speedY = (Math.random() * 1.2 + 0.3) * 0.5;
            this.color = 'black';
            this.health = this.baseHealth * this.healthScaling;
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
        }

    }

    class GoldDigger extends Enemy{

        constructor(game, healthScaling = 1, x = Math.random() * (playground.width * 0.95), y = 0) {
            super(game, healthScaling, y);
            this.x = x;
            this.baseHealth = 20;
            this.damage = 5;
            this.width = 30;
            this.height = 45;
            this.speedY = (Math.random() * 1.2 + 0.3) / 0.25;
            this.color = 'yellow';
            this.health = this.baseHealth * this.healthScaling;
            this.gold = 10 * Math.floor((Math.random() * 5) * this.health);
            this.score = this.health;
        }

    }

    class Transporter extends Enemy{

        constructor(game, healthScaling = 1) {
            super(game, healthScaling);
            this.x = Math.random() * (this.game.width * 0.75);
            this.baseHealth = 100;
            this.damage = 30;
            this.width = 150;
            this.height = 75;
            this.speedY = (Math.random() * 1.2 + 0.3) * 0.75;
            this.color = 'white';
            this.health = this.baseHealth * this.healthScaling;
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
        }

    }

    class Boss extends Enemy{

        constructor(game, healthScaling = 1, y = 50) {
            super(game, healthScaling, y);
            this.x = Math.random() * (this.game.width * 0.5);
            this.baseHealth = 1000;
            this.damage = 30;
            this.width = 400;
            this.height = 75;
            this.speedY = 0;
            this.speedX = (Math.random() * 1.2 + 0.3) * 0.75;
            this.color = 'black';
            this.shots = [];
            this.shotInterval = 1000;
            this.shotTimer = 0;
            this.health = this.baseHealth + this.healthScaling;
            this.gold = Math.floor((Math.random() * 1.5) * this.health);
            this.score = this.health;
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

            context.fillStyle = this.color;
            context.strokeRect(this.x, this.y, this.width, this.height);
            context.font = '20px Helvetica';
            context.fillText(this.health, this.x, this.y);
        }

    }

    class Shop{

        constructor(game) {
            this.game = game;
            this.laserUpgrades = 0;
            this.rocketUpgrades = 0;
            this.healthUpgrades = 0;
            this.helperUpgrades = 0;
            this.laserCost = 100;
            this.rocketCost = 200;
            this.healthCost = 300;
            this.helperCost = 400;
        }

        upgrade(element) {
            if(element === 'laserUpgrade' && this.game.gold >= this.laserCost) {
                this.game.gold -= this.laserCost;
                this.laserUpgrades ++;
                this.laserCost += Math.floor(this.laserCost * 1.15);
            } else if(element === 'rocketUpgrade' && this.game.gold >= this.rocketCost) {
                this.game.gold -= this.rocketCost;
                this.rocketUpgrades ++;
                this.rocketCost += Math.floor(this.rocketCost * 1.25);
            } else if(element === 'healthUpgrade' && this.game.gold >= this.healthCost) {
                this.game.gold -= this.healthCost;
                this.healthUpgrades ++;
                this.healthCost += Math.floor(this.healthCost * 1.3);
            } else if(element === 'helperUpgrade' && this.game.gold >= this.helperCost) {
                this.game.gold -= this.helperCost;
                this.helperUpgrades ++;
                this.helperCost += Math.floor(this.helperCost * 1.5);
            }
        }

        applyUpgrades() {

            //laser upgrades
            if(this.laserUpgrades > 0) {
                this.game.player.laserDamageAdd += 10;
                
                if(this.laserUpgrades >= 15) {
                    this.game.laserAmmoInterval = 350;
                } else if(this.laserUpgrades >= 10) {
                    this.game.laserAmmoInterval = 400;
                } else if(this.laserUpgrades >= 5) {
                    this.game.laserAmmoInterval = 450;
                }
            }
            

            //rocket upgrades
            if(this.rocketUpgrades >= 1) {
                this.game.player.rocketDamageAdd += 20;
            }

            //health upgrades
            if(this.healthUpgrades >= 1) {
                this.game.player.healthAdd += 0.25;
            }

            //helper upgrades
            if(this.helperUpgrades > 0 && this.helperUpgrades < 4) {
                this.game.player.helperAmount = 1;
                this.game.player.helperDamageAmplifier += 0.5 + this.helperUpgrades * 0.5;
            } else if(this.helperUpgrades > 3 && this.helperUpgrades < 5) {
                this.game.player.helperAmount = 1;
                this.game.player.helperShots = 2;
                this.game.player.helperDamageAmplifier += 0.5;
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
            context.fillText('BebaCoins: ' + this.game.gold, 550, 40);

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
                } else {
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
                context.fillStyle = 'black';
                context.font = '15px ' + this.fontFamily;
                context.fillRect(36 + 175 * i, 665, 150, 310);
                context.fillStyle = 'white';
                if(i === 0) {
                    context.fillText('Damage: ' + (10 + this.game.player.laserDamageAdd), xCoord, 690);
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

            //score
            context.fillText('Score: ' + this.game.score, 20, 40);

            //gold
            context.fillText('BebaCoins: ' + this.game.gold, 550, 40);

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

    class Game{

        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.input = new InputHandler(this);
            this.mainUI = new MainUI(this);
            this.player = new Player(this);
            this.shop = new Shop(this);
            this.shopUI = new ShopUI(this);
            this.keys = [];
            this.mouseX = 0;
            this.mouseY = 0;
            this.enemies = [];
            this.laserAmmo = 15;
            this.maxLaserAmmo = 30;
            this.rockets = 0;
            this.laserAmmoTimer = 0;
            this.laserAmmoInterval = 500;
            this.rocketTimer = 0;
            this.rocketInterval = 0;
            this.gameOver = false;
            this.waveCleared = false;
            this.enemyTimer = 0;
            this.enemyInterval = 1000;
            this.score = 0;
            this.gold = 0;
            this.waveCount = 1;
            this.TimeLimit = 20000;
            this.waveTime = this.TimeLimit;
            this.speed = 1;
            this.debug = true;
        }

        update(deltaTime) {
            if(!this.gameOver && !this.waveCleared) this.waveTime -= deltaTime;

            this.player.update(deltaTime);

            //ammo refreshing
            this.laserAmmoTimer += deltaTime;
            if(this.laserAmmoTimer > this.laserAmmoInterval) {
                if(this.laserAmmo < this.maxLaserAmmo) this.laserAmmo ++;
                this.laserAmmoTimer = 0;
            } else this.laserAmmoTimer += deltaTime;

            //enemy spawns
            if(this.waveTime < 2 && !this.checkForBoss() && this.waveCount%3 === 0 && !this.waveCleared && !this.gameOver) {
                
                if(this.waveCount === 3) this.enemies.push(new Boss(this));
                if(this.waveCount === 6) this.enemies.push(new Boss(this, 2));
                if(this.waveCount === 9) this.enemies.push(new Boss(this, 4));
            
            } else if(this.enemyTimer > this.enemyInterval && (!this.gameOver && this.waveTime > 0)) {
                
                let enemyType = Math.random();
                if(this.waveCount < 4) {   
                    
                    if(enemyType < 0.33) this.enemies.push(new MainEnemy1(this));
                    else if(enemyType < 0.66) this.enemies.push(new MainEnemy2(this));
                    else if(enemyType < 0.99) this.enemies.push(new MainEnemy3(this));
                    else this.enemies.push(new GoldDigger(this));

                } else if (4 <= this.waveCount < 7) {

                    if(enemyType < 0.3) this.enemies.push(new MainEnemy1(this, 2));
                    else if(enemyType < 0.6) this.enemies.push(new MainEnemy2(this, 2));
                    else if(enemyType < 0.9) this.enemies.push(new MainEnemy3(this, 2));
                    else if(enemyType < 0.99) this.enemies.push(new Transporter(this, 2));
                    else this.enemies.push(new GoldDigger(this, 4));

                } else if (7 <= this.waveCount) {

                    if(enemyType < 0.25) this.enemies.push(new MainEnemy1(this, 4));
                    else if(enemyType < 0.5) this.enemies.push(new MainEnemy2(this, 4));
                    else if(enemyType < 0.75) this.enemies.push(new MainEnemy3(this, 4));
                    else if(enemyType < 0.87) this.enemies.push(new Transporter(this, 4));
                    else if(enemyType < 0.99) this.enemies.push(new Tank(this, 4));
                    else this.enemies.push(new GoldDigger(this, 8));

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
                            this.player.health -= shot.damage;
                            shot.delete = true;
                        }

                        if(this.player.health <= 0) this.gameOver = true;
                    })
                }

                //enemy and player collision check
                if(this.checkCollision(this.player, enemy)) {
                    if(!this.waveCleared) this.player.health -= enemy.damage;   
                    enemy.delete = true;
                    if(this.player.health <= 0) {
                        this.gameOver = true;
                        this.waveCleared = false;
                    }
                }
                
                

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
            });

            if(this.gameOver || (this.waveTime <=0)) {
                this.enemies.forEach(enemy => {
                    if(!(enemy instanceof Boss)) enemy.delete = true;
                });
                this.waveTime = 0;
            }    

            this.enemies = this.enemies.filter(enemy => !enemy.delete);

            if(this.waveCounter%2 != 0 && this.waveTime <= 0 && !this.checkForBoss() && !this.gameOver) this.waveCleared = true;
            
        }

        draw(context) {
            this.enemies.forEach(enemy => enemy.draw(context));
            this.player.draw(context);

            //main UI
            if(!this.gameOver && !this.waveCleared) this.mainUI.draw(context);

            if(this.gameOver) this.mainUI.draw(context);

            //show Shop
            if(this.waveCleared) this.shopUI.draw(context);
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
                this.TimeLimit += 10000;
                this.waveCleared = false;
                this.gameOver = false;
                this.waveTime = this.TimeLimit;
                this.laserAmmo = 15;
                this.player.health = this.player.baseHealth * this.player.healthAdd;
                
            } else {
                    
                this.shop.healthUpgrades = 0;
                this.shop.laserUpgrades = 0;
                this.shop.rocketUpgrades = 0;
                this.shop.helperUpgrades = 0;
                this.waveCount = 1;
                this.TimeLimit = 20000;
                this.waveCleared = false;
                this.waveTime = this.TimeLimit;
                this.gameOver = false;
                this.player.health = this.player.baseHealth
                
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
                    
                                if(encounter < 0.3) this.enemies.push(new MainEnemy1(this, enemy.healthScaling ,enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if(encounter < 0.6) this.enemies.push(new MainEnemy2(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if( encounter < 0.9) this.enemies.push(new MainEnemy3(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else this.enemies.push(new GoldDigger(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                
                            }
                        } else if(enemiesTransported === 4) {
                            for(let i = 0; i < 4; i++) {
                                let encounter = Math.random();
                    
                                if(encounter < 0.3) this.enemies.push(new MainEnemy1(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if(encounter < 0.6) this.enemies.push(new MainEnemy2(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if( encounter < 0.9) this.enemies.push(new MainEnemy3(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else this.enemies.push(new GoldDigger(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                
                            }
                        } else {
                            for(let i = 0; i < 5; i++) {
                                let encounter = Math.random();
                    
                                if(encounter < 0.3) this.enemies.push(new MainEnemy1(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if(encounter < 0.6) this.enemies.push(new MainEnemy2(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else if( encounter < 0.9) this.enemies.push(new MainEnemy3(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                                else this.enemies.push(new GoldDigger(this, enemy.healthScaling, enemy.x + (Math.random() * enemy.width), enemy.y + (Math.random() * enemy.height)));
                
                            }
                        }
                    
                    }

                    if(enemy instanceof Boss) {
                        this.waveCleared = true;
                    }

                    if(!this.gameOver && !this.waveCleared) this.score += enemy.score;
                    if(!this.gameOver && !this.waveCleared) this.gold += enemy.gold;
                }
            }
            
        }

    }

    const game = new Game(playground.width, playground.height);
    let lastTime = 0;

    function animate(timeStamp) {

        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        ctx.clearRect(0, 0, playground.width, playground.height);

        game.update(deltaTime);
        game.draw(ctx);

        requestAnimationFrame(animate);

    }

    animate(0); 
});
