
import { World } from "./World";
import { CutsceneManager } from "./CutsceneManager";
import { drawHuskyFace } from "../Utils";
import { gfxSettings } from "../GfxSettings";
import { EnhancedBackgrounds } from "./enhanced/EnhancedBackgrounds";
import { ParticleSystem } from "./enhanced/ParticleSystem";
import { PostFX } from "./enhanced/PostFX";
import { drawMenuBackdrop as drawMenuBackdropScene } from "./enhanced/EnhancedSprites";
import { drawEnhancedCutscene } from "./enhanced/EnhancedCutscenes";

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private enhancedBackgrounds = new EnhancedBackgrounds();
    private particles = new ParticleSystem();
    private postFX = new PostFX();

    constructor(canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!;
    }

    public resize(width: number, height: number) {
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
    }

    public drawGame(world: World) {
        const { width, height, cameraX, currentLevel } = world;
        const enhanced = gfxSettings.visualMode === 'enhanced';
        this.ctx.clearRect(0, 0, width, height);

        if (enhanced) {
            this.enhancedBackgrounds.draw(this.ctx, width, height, cameraX, currentLevel);
        } else {
            this.drawBackground(world);
        }

        this.ctx.save();
        world.platforms.forEach(p => p.draw(this.ctx, cameraX, currentLevel));
        world.waters.forEach(w => w.draw(this.ctx, cameraX));
        if (world.exit) world.exit.draw(this.ctx, cameraX);
        world.collectibles.forEach(c => !c.markedForDeletion && c.draw(this.ctx, cameraX));
        world.enemies.forEach(e => e.draw(this.ctx, cameraX));
        if (world.player) world.player.draw(this.ctx, cameraX, currentLevel);
        this.ctx.restore();

        // --- ENHANCED: particles + glow + grade (drawn last, purely cosmetic) ---
        if (enhanced) {
            this.particles.updateAndDraw(this.ctx, world);
            this.postFX.drawGlows(this.ctx, world);
            this.postFX.apply(this.ctx, world);
        }

        // --- LEVEL 9: ATMOSPHERIC OVERLAY (classic only — enhanced has its own storm) ---
        if (!enhanced && currentLevel === 9) {
            this.drawPierAtmosphere(world);
        }
    }

    private drawPierAtmosphere(world: World) {
        const { width, height, cameraX } = world;
        const ctx = this.ctx;
        const t = Date.now() / 1000;

        // 1. Rain
        ctx.strokeStyle = "rgba(170, 200, 255, 0.3)";
        ctx.lineWidth = 1;
        const rainSpeed = 20; // Falling speed
        const rainSlant = 5; // Wind effect
        for(let i=0; i<50; i++) {
             // Simple procedural rain based on time and index
             let rX = ((i * 137 + t * 500) % width);
             let rY = ((i * 53 + t * 800) % height);
             ctx.beginPath();
             ctx.moveTo(rX, rY);
             ctx.lineTo(rX - rainSlant, rY + rainSpeed);
             ctx.stroke();
        }

        // 2. Darkness Overlay with Lighthouse Beam
        ctx.fillStyle = "rgba(0, 0, 10, 0.4)"; 
        ctx.fillRect(0, 0, width, height);

        const lighthouseX = 4600 - cameraX;
        const lighthouseY = height - 300;
        const angle = Math.sin(t * 0.8) * 1.5 - 1.5; 
        
        ctx.save();
        ctx.translate(lighthouseX, lighthouseY);
        ctx.rotate(angle);
        
        const grad = ctx.createLinearGradient(0, 0, -1000, 200);
        grad.addColorStop(0, "rgba(255, 255, 200, 0.3)");
        grad.addColorStop(1, "rgba(255, 255, 200, 0.0)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-2000, -300);
        ctx.lineTo(-2000, 300);
        ctx.fill();
        ctx.restore();

        if (Math.random() < 0.005) {
             ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
             ctx.fillRect(0, 0, width, height);
        }
    }

    private drawBackground(world: World) {
        const { width, height, cameraX, currentLevel } = world;
        const ctx = this.ctx;

        if (currentLevel < 3) {
            // Pound
            ctx.fillStyle = "#2c3e50"; 
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.fillStyle = "#34495e";
            for(let i=0; i < width + cameraX; i+=100) {
                let renderX = i - (cameraX * 0.5); 
                ctx.fillRect((renderX % (width + 200)) - 100, 0, 10, height);
            }
            ctx.restore();
        } else if (currentLevel === 3) {
            // Spooky Dark Forest
            const time = Date.now() / 1000;
            
            // Deep Midnight Gradient
            const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
            skyGrad.addColorStop(0, "#050510");
            skyGrad.addColorStop(1, "#1a1a2e");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            // Blinking Glowing Eyes in background
            for(let i=0; i < 20; i++) {
                const seed = (i * 733);
                const xPos = (seed - (cameraX * 0.15)) % (width + 400) - 200;
                const yPos = (seed % (height - 200)) + 50;
                
                // Blink logic: eyes open most of the time
                const isBlinking = (Math.sin(time * 2 + seed) > 0.98);
                if (!isBlinking) {
                    ctx.fillStyle = "rgba(255, 255, 0, 0.6)"; // Spooky yellow
                    if (i % 3 === 0) ctx.fillStyle = "rgba(255, 50, 0, 0.6)"; // Some are red
                    
                    ctx.beginPath();
                    ctx.arc(xPos, yPos, 2, 0, Math.PI * 2);
                    ctx.arc(xPos + 8, yPos, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Distant silhouette trees
            for(let i=0; i < width + cameraX; i+=120) {
                let renderX = i - (cameraX * 0.3); 
                let xPos = (renderX % (width + 300)) - 100;
                
                ctx.fillStyle = "#0c0c1a"; // Darker silhouette
                ctx.fillRect(xPos + 15, height - 350, 25, 350);
                
                // Jagged, scary pine top
                ctx.beginPath();
                ctx.moveTo(xPos - 40, height - 100);
                ctx.lineTo(xPos + 25, height - 450); 
                ctx.lineTo(xPos + 90, height - 100);
                ctx.fill();
            }

            // Closer trees
            for(let i=0; i < width + cameraX; i+=250) {
                let renderX = i - (cameraX * 0.6); 
                let xPos = (renderX % (width + 500)) - 200;
                
                ctx.fillStyle = "#05050a"; // Almost black
                ctx.fillRect(xPos + 30, height - 400, 40, 400);
                
                // Branches
                ctx.strokeStyle = "#05050a";
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(xPos + 50, height - 300);
                ctx.lineTo(xPos - 50, height - 380);
                ctx.moveTo(xPos + 50, height - 250);
                ctx.lineTo(xPos + 150, height - 330);
                ctx.stroke();
            }

            // Ground fog
            ctx.fillStyle = "rgba(100, 100, 150, 0.05)";
            for(let i=0; i<3; i++) {
                const fogX = (time * (i*10+20) + i*400) % (width + 600) - 300;
                ctx.beginPath();
                ctx.ellipse(fogX, height - 50, 400, 60, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        } else if (currentLevel === 4) {
             // Beach
             ctx.fillStyle = "#87CEEB"; 
             ctx.fillRect(0, 0, width, height);
             ctx.fillStyle = "#f1c40f";
             ctx.beginPath();
             ctx.arc(width - 100, 100, 40, 0, Math.PI*2);
             ctx.fill();
             ctx.fillStyle = "#2980b9";
             ctx.fillRect(0, height - 100, width, 100);
             ctx.save();
             ctx.fillStyle = "rgba(255,255,255,0.6)";
             for(let i=0; i < width + cameraX; i+=400) {
                 let renderX = i - (cameraX * 0.05); 
                 let xPos = (renderX % (width + 500)) - 100;
                 ctx.beginPath();
                 ctx.arc(xPos, 150, 30, 0, Math.PI*2);
                 ctx.arc(xPos+40, 150, 40, 0, Math.PI*2);
                 ctx.arc(xPos+80, 150, 30, 0, Math.PI*2);
                 ctx.fill();
             }
             ctx.restore();
        } else if (currentLevel === 5) {
            // Mountain
            ctx.fillStyle = "#a0c4ff"; 
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            for(let i=0; i < width + cameraX; i+=300) {
                let renderX = i - (cameraX * 0.1); 
                let xPos = (renderX % (width + 600)) - 200;
                ctx.fillStyle = "#7f8c8d";
                ctx.beginPath();
                ctx.moveTo(xPos, height);
                ctx.lineTo(xPos + 200, height - 400); 
                ctx.lineTo(xPos + 400, height);
                ctx.fill();
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.moveTo(xPos + 150, height - 300);
                ctx.lineTo(xPos + 200, height - 400); 
                ctx.lineTo(xPos + 250, height - 300);
                ctx.lineTo(xPos + 225, height - 320);
                ctx.lineTo(xPos + 200, height - 280);
                ctx.lineTo(xPos + 175, height - 320);
                ctx.fill();
            }
            ctx.restore();
        } else if (currentLevel === 6) {
             // Ski Slope
             ctx.fillStyle = "#a0c4ff"; 
             ctx.fillRect(0, 0, width, height);
             ctx.save();
             ctx.fillStyle = "rgba(255,255,255,0.4)";
             for(let i=0; i < width + cameraX; i+=400) {
                 let renderX = i - (cameraX * 0.5); 
                 let xPos = (renderX % (width + 500)) - 100;
                 ctx.beginPath();
                 ctx.arc(xPos, 100, 40, 0, Math.PI*2);
                 ctx.fill();
             }
             ctx.restore();
        } else if (currentLevel === 7) {
            // The Chase
            ctx.fillStyle = "#4fc3f7"; 
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "#ffff00";
            ctx.beginPath();
            ctx.arc(width - 80, 80, 60, 0, Math.PI*2);
            ctx.fill();
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 2;
            for(let i=0; i < width + cameraX; i+= 500) {
                let renderX = i - (cameraX * 1.5); 
                let xPos = (renderX % (width + 1000)) - 500;
                ctx.beginPath();
                ctx.moveTo(xPos, height/2);
                ctx.lineTo(xPos + 300, height/2);
                ctx.stroke();
            }
            ctx.restore();
            ctx.fillStyle = "#7cb342"; 
            ctx.fillRect(0, height - 50, width, 50);
        } else if (currentLevel === 8) {
            // Underwater
            let grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, "#2980b9");
            grad.addColorStop(1, "#0a2639");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            for(let i=0; i < width + cameraX; i+=200) {
                let renderX = i - (cameraX * 0.2); 
                let xPos = (renderX % (width + 200));
                let yPos = (Math.sin(renderX * 0.01) * 200) + height/2;
                ctx.beginPath();
                ctx.arc(xPos, yPos, 5 + Math.random()*5, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.restore();
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width/2, height);
            ctx.fill();
            ctx.restore();
        } else if (currentLevel === 9) {
            // Stormy Pier
            ctx.fillStyle = "#1e272e"; // Dark Sky
            ctx.fillRect(0, 0, width, height);
            
            // Distant City Skyline
            ctx.fillStyle = "#0c1013";
            const skylineBase = height - 100;
            ctx.save();
            for(let i=0; i < width + cameraX; i+=50) {
                 let renderX = i - (cameraX * 0.1); 
                 let xPos = (renderX % (width + 100));
                 let bHeight = 50 + Math.random() * 100;
                 if ((i/50)%3===0) ctx.fillRect(xPos, skylineBase - 150, 40, 150);
                 else ctx.fillRect(xPos, skylineBase - 80, 30, 80);
            }
            ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
            for(let i=0; i < width; i+=200) {
                 if (Math.random() > 0.5) ctx.fillRect(i, skylineBase - 120, 2, 2);
            }
            ctx.restore();

            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(0, height - 100, width, 100);
        } else if (currentLevel === 10) {
            // Twilight Construction Site Skyline
            const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
            skyGrad.addColorStop(0, "#191c29"); // Deep midnight blue
            skyGrad.addColorStop(0.5, "#301b2a"); // Dusk violet
            skyGrad.addColorStop(1, "#83341b"); // Fire bright rust twilight
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, width, height);
            
            // Distant skeletal city skyscrapers and moving crane silhouettes
            const time = Date.now() / 1000;
            ctx.save();
            ctx.fillStyle = "rgba(18, 20, 31, 0.85)"; // Solid near dark structures
            
            for(let i=0; i < width + cameraX; i += 180) {
                 let renderX = i - (cameraX * 0.12);
                 let xPos = (renderX % (width + 300)) - 100;
                 
                 // High-rise structures with grid-skeletons (Unfinished buildings)
                 ctx.fillRect(xPos, height - 425, 85, 425);
                 
                 // Light windows or scaffolding dots
                 ctx.fillStyle = "rgba(255, 200, 0, 0.25)";
                 for (let wy = height - 380; wy < height - 50; wy += 40) {
                      ctx.fillRect(xPos + 10, wy, 8, 8);
                      ctx.fillRect(xPos + 25, wy, 8, 8);
                      ctx.fillRect(xPos + 50, wy, 8, 8);
                      ctx.fillRect(xPos + 65, wy, 8, 8);
                 }
                 ctx.fillStyle = "rgba(18, 20, 31, 0.85)";
            }

            // High-tension lattice crane silhouettes sweeping slowly
            ctx.strokeStyle = "#0d1017";
            ctx.lineWidth = 4;
            for(let i=0; i < width + cameraX; i += 400) {
                 let renderX = i - (cameraX * 0.2);
                 let xPos = (renderX % (width + 500)) - 150;
                 let pivotY = height - 250;
                 
                 // Draw tower stem
                 ctx.beginPath();
                 ctx.moveTo(xPos, height);
                 ctx.lineTo(xPos + 15, pivotY);
                 ctx.lineTo(xPos + 30, height);
                 ctx.stroke();
                 
                 // Diagonal truss grids
                 ctx.lineWidth = 1.5;
                 for (let ty = pivotY; ty < height; ty += 40) {
                      ctx.beginPath();
                      ctx.moveTo(xPos, ty);
                      ctx.lineTo(xPos + 30, ty + 20);
                      ctx.moveTo(xPos + 30, ty);
                      ctx.lineTo(xPos, ty + 20);
                      ctx.stroke();
                 }
                 
                 // Crane horizontal jib / boom arm rotating/sweeping slightly
                 ctx.lineWidth = 3.5;
                 let craneAnimAngle = Math.sin(time * 0.35 + (i / 400)) * 0.18;
                 ctx.save();
                 ctx.translate(xPos + 15, pivotY);
                 ctx.rotate(craneAnimAngle);
                 
                 ctx.beginPath();
                 ctx.moveTo(-90, 0); // Counter weight arm
                 ctx.lineTo(180, 0); // Front boom load arm
                 ctx.stroke();
                 
                 // Counterweight block
                 ctx.fillStyle = "#0d1017";
                 ctx.fillRect(-70, -10, 20, 15);
                 
                 // Hanging hook cable
                 ctx.lineWidth = 1;
                 ctx.strokeStyle = "rgba(0,0,0,0.6)";
                 ctx.beginPath();
                 ctx.moveTo(120, 0);
                 ctx.lineTo(120, 60 + Math.sin(time + i)*15); // Swinging cable
                 ctx.stroke();
                 ctx.restore();
            }
            
            ctx.restore();
        }
    }

    public drawCutscene(manager: CutsceneManager, width: number, height: number) {
        const { frame, step, currentType } = manager;
        const ctx = this.ctx;

        // Enhanced mode: fully composed cinematic scenes (classic art preserved below)
        if (gfxSettings.visualMode === 'enhanced') {
            drawEnhancedCutscene(ctx, currentType, step, width, height, frame);
            return;
        }

        const cx = width / 2;
        const cy = height / 2;

        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, width, height);

        if (currentType === 'pier_intro') {
             ctx.fillStyle = "#1e272e";
             ctx.fillRect(0, 0, width, height);
             
             ctx.strokeStyle = "rgba(255,255,255,0.2)";
             for(let i=0; i<20; i++) {
                 let rx = (frame * i * 13) % width;
                 let ry = (frame * 20) % height;
                 ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 20); ctx.stroke();
             }

             if (step === 0) {
                 ctx.fillStyle = "#2980b9";
                 ctx.fillRect(0, cy + 50, width, height/2);
                 drawHuskyFace(ctx, cx, cy + 50 - (Math.min(frame*2, 50)), 2, 'happy');
             } else if (step === 1) {
                 drawHuskyFace(ctx, cx - 100, cy, 2, 'determined');
                 ctx.fillStyle = "black";
                 ctx.fillRect(cx + 50, cy - 50, 200, 200);
                 ctx.fillStyle = "yellow";
                 ctx.fillRect(cx + 80, cy, 10, 10);
                 ctx.fillRect(cx + 120, cy - 20, 10, 10);
             } else {
                 drawHuskyFace(ctx, cx, cy + 50, 2, 'determined');
                 ctx.fillStyle = "#555";
                 ctx.beginPath(); ctx.arc(cx - 100, 100, 80, 0, Math.PI*2); ctx.fill();
                 ctx.beginPath(); ctx.arc(cx + 100, 80, 90, 0, Math.PI*2); ctx.fill();
                 if (frame % 50 < 5) {
                     ctx.fillStyle = "white";
                     ctx.fillRect(0, 0, width, height);
                 }
             }
             return;
        }

        if (currentType === 'pound_escape') {
            if (step < 2) {
                const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
                skyGrad.addColorStop(0, "#2c3e50"); 
                skyGrad.addColorStop(1, "#d35400"); 
                ctx.fillStyle = skyGrad;
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = "#ecf0f1";
                ctx.beginPath();
                ctx.arc(width - 100, 100, 40, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#1a252f";
                ctx.fillRect(0, height - 300, width, 300); 
                
                ctx.fillStyle = "#2c3e50";
                for (let y = height - 300; y < height; y += 40) {
                    for (let x = (y % 80 === 0 ? 0 : 20); x < width; x += 40) {
                        ctx.fillRect(x, y, 35, 35);
                    }
                }

                const t = Date.now() / 1000;
                const beamAngle = Math.sin(t) * 0.5;
                ctx.save();
                ctx.translate(cx + 200, height - 350); 
                ctx.rotate(beamAngle);
                ctx.fillStyle = "rgba(255, 255, 200, 0.2)";
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-150, height);
                ctx.lineTo(150, height);
                ctx.fill();
                ctx.restore();

                ctx.fillStyle = "#1a252f";
                ctx.fillRect(cx + 180, height - 400, 40, 100);
                ctx.fillRect(cx + 170, height - 420, 60, 20); 

                ctx.strokeStyle = "#95a5a6";
                ctx.lineWidth = 4;
                for(let y = height - 400; y < height; y+=50) {
                     ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cx - 80, y); ctx.stroke();
                     ctx.beginPath(); ctx.moveTo(cx + 80, y); ctx.lineTo(width, y); ctx.stroke();
                     ctx.beginPath(); ctx.moveTo(cx - 80, y); ctx.lineTo(cx - 60, y + 20); ctx.stroke();
                     ctx.beginPath(); ctx.moveTo(cx + 80, y); ctx.lineTo(cx + 60, y + 30); ctx.stroke();
                }
                ctx.fillStyle = "#7f8c8d";
                ctx.fillRect(cx - 90, height - 420, 10, 420);
                ctx.fillRect(cx + 80, height - 420, 10, 420);

                ctx.fillStyle = "#5d4037";
                ctx.fillRect(0, height - 50, width, 50);

                let hop = Math.abs(Math.sin(frame * 0.2)) * 50;
                drawHuskyFace(ctx, cx, cy - hop, 3, 'happy');
                
                if (step === 0) {
                    for(let i=0; i<30; i++) {
                        ctx.fillStyle = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'][i%4];
                        const px = (frame * (i * 7 + 10)) % width;
                        const py = (frame * (i * 2 + 5)) % height;
                        ctx.save();
                        ctx.translate(px, py);
                        ctx.rotate(frame * 0.1 * i);
                        ctx.fillRect(-5, -5, 10, 10);
                        ctx.restore();
                    }
                }
            } 
            else if (step === 2) {
                 const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
                 skyGrad.addColorStop(0, "#000000"); 
                 skyGrad.addColorStop(1, "#2c3e50");
                 ctx.fillStyle = skyGrad;
                 ctx.fillRect(0, 0, width, height);
                 
                 ctx.fillStyle = "black";
                 ctx.fillRect(0, height - 150, width, 150);
                 ctx.fillStyle = "#111"; 
                 ctx.fillRect(100, height - 250, 100, 100); 
                 ctx.fillRect(250, height - 200, 50, 50);

                 drawHuskyFace(ctx, cx, cy, 2.5, 'sad');
            }
            else {
                 const grad = ctx.createLinearGradient(0, 0, 0, height);
                 grad.addColorStop(0, "#050510"); 
                 grad.addColorStop(1, "#1a1a2e");
                 ctx.fillStyle = grad;
                 ctx.fillRect(0, 0, width, height);

                 ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                 ctx.beginPath();
                 ctx.arc(200, 150, 60, 0, Math.PI*2);
                 ctx.fill();

                 ctx.fillStyle = "#0f0f1a";
                 for(let i = 0; i < width; i += 150) {
                     const h = 200 + Math.random() * 100;
                     ctx.beginPath();
                     ctx.moveTo(i, height);
                     ctx.lineTo(i + 20, height - h);
                     ctx.lineTo(i + 40, height);
                     ctx.fill();
                     ctx.strokeStyle = "#0f0f1a";
                     ctx.lineWidth = 3;
                     ctx.beginPath();
                     ctx.moveTo(i + 20, height - h + 50);
                     ctx.lineTo(i - 20, height - h - 20);
                     ctx.stroke();
                 }

                 ctx.fillStyle = "rgba(200, 200, 200, 0.05)";
                 for(let i=0; i<5; i++) {
                     const fogX = (frame * (i+1) + i*200) % (width + 400) - 200;
                     ctx.beginPath();
                     ctx.ellipse(fogX, height - 100 - (i*20), 200, 50, 0, 0, Math.PI*2);
                     ctx.fill();
                 }

                 ctx.fillStyle = "black";
                 ctx.beginPath();
                 ctx.moveTo(-50, height);
                 ctx.quadraticCurveTo(50, height/2, 0, 0);
                 ctx.lineTo(-100, 0);
                 ctx.lineTo(-100, height);
                 ctx.fill();
                 ctx.beginPath();
                 ctx.moveTo(width + 50, height);
                 ctx.quadraticCurveTo(width - 50, height/2, width, 0);
                 ctx.lineTo(width + 100, 0);
                 ctx.lineTo(width + 100, height);
                 ctx.fill();

                 if (step === 3) {
                     const t = Date.now() / 500;
                     if (Math.sin(t) > 0) {
                         ctx.fillStyle = "yellow";
                         ctx.beginPath(); ctx.arc(width*0.2, height - 200, 3, 0, Math.PI*2); ctx.fill();
                         ctx.beginPath(); ctx.arc(width*0.2 + 15, height - 200, 3, 0, Math.PI*2); ctx.fill();
                         ctx.beginPath(); ctx.arc(width*0.8, height - 300, 4, 0, Math.PI*2); ctx.fill();
                         ctx.beginPath(); ctx.arc(width*0.8 + 20, height - 300, 4, 0, Math.PI*2); ctx.fill();
                     }
                     drawHuskyFace(ctx, cx, cy + 50, 2, 'determined');
                 } else {
                     drawHuskyFace(ctx, cx, cy, 3, 'determined');
                     ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                     ctx.lineWidth = 2;
                     for(let i=0; i<5; i++) {
                         const x = (frame * 15 + i * 150) % width;
                         const y = height/2 + (i * 60) - 100;
                         ctx.beginPath();
                         ctx.moveTo(x, y);
                         ctx.lineTo(x + 100, y);
                         ctx.stroke();
                     }
                 }
            }
            return;
        }

        if (currentType === 'underwater_intro') {
            ctx.fillStyle = "#2980b9";
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            for(let i=0; i<20; i++) {
                let bx = (frame * i * 17) % width;
                let by = height - ((frame * (i+2)) % height);
                ctx.beginPath(); ctx.arc(bx, by, 5 + (i%5), 0, Math.PI*2); ctx.fill();
            }

            if (step === 1) {
                drawHuskyFace(ctx, cx, cy + frame * 2, 2, 'sad');
            } else if (step === 3) {
                drawHuskyFace(ctx, cx, cy, 3, 'determined');
                ctx.strokeStyle = "black";
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(cx - 45, cy - 30, 20, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(cx + 45, cy - 30, 20, 0, Math.PI*2); ctx.stroke();
            } else {
                drawHuskyFace(ctx, cx, cy, 2, 'happy');
            }
            return;
        }

        if (currentType === 'chase') {
             const pulse = Math.sin(frame * 0.2) * 0.2;
             ctx.fillStyle = `rgba(192, 57, 43, ${0.4 + pulse})`;
             ctx.fillRect(0,0, width, height);

             if (step === 2) {
                 drawHuskyFace(ctx, cx, cy, 3, 'sad');
             } else if (step === 4) {
                 drawHuskyFace(ctx, cx + (Math.random()*10 - 5), cy, 3, 'determined');
                 ctx.fillStyle = "white";
                 ctx.font = "bold 80px Fredoka One";
                 ctx.textAlign = "center";
                 ctx.fillText("RUN!!!", cx, cy - 150);
             } else {
                 drawHuskyFace(ctx, cx, cy, 2, 'determined');
             }
             return;
        }
        
        if (step === 1) { 
             ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
             ctx.beginPath();
             ctx.arc(cx, cy, 150, 0, Math.PI*2);
             ctx.fill();
             drawHuskyFace(ctx, cx, cy, 2, 'happy');
        } 
        else if (step === 2) {
             const hx = cx - 300;
             const hy = cy - 50;
             ctx.fillStyle = "#27ae60";
             ctx.fillRect(0, hy + 100, width, height - (hy + 100));
             
             ctx.fillStyle = "#ecf0f1"; 
             ctx.fillRect(hx, hy, 200, 150);
             
             ctx.strokeStyle = "#bdc3c7";
             ctx.lineWidth = 1;
             ctx.beginPath();
             for(let i=0; i<150; i+=20) {
                 ctx.moveTo(hx, hy + i);
                 ctx.lineTo(hx + 200, hy + i);
             }
             ctx.stroke();

             ctx.fillStyle = "#c0392b"; 
             ctx.beginPath();
             ctx.moveTo(hx - 20, hy);
             ctx.lineTo(hx + 100, hy - 100);
             ctx.lineTo(hx + 220, hy);
             ctx.fill();

             ctx.fillStyle = "#34495e";
             ctx.fillRect(hx + 80, hy + 60, 40, 90);
             ctx.fillStyle = "#f1c40f"; 
             ctx.beginPath(); ctx.arc(hx + 115, hy + 105, 3, 0, Math.PI*2); ctx.fill();

             ctx.fillStyle = "#3498db";
             ctx.fillRect(hx + 20, hy + 30, 40, 40);
             ctx.fillRect(hx + 140, hy + 30, 40, 40);
             
             ctx.strokeStyle = "white"; 
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.moveTo(hx + 40, hy + 30); ctx.lineTo(hx + 40, hy + 70);
             ctx.moveTo(hx + 20, hy + 50); ctx.lineTo(hx + 60, hy + 50);
             ctx.moveTo(hx + 160, hy + 30); ctx.lineTo(hx + 160, hy + 70);
             ctx.moveTo(hx + 140, hy + 50); ctx.lineTo(hx + 180, hy + 50);
             ctx.stroke();
             
             let runSpeed = 4;
             let dogX = (hx + 100) + (frame * runSpeed); 
             let dogY = hy + 130;
             let hop = Math.abs(Math.sin(frame * 0.25)) * 10;
             
             ctx.save();
             ctx.translate(dogX, dogY - hop);
             
             ctx.fillStyle = "#95a5a6";
             ctx.beginPath(); ctx.ellipse(0, 0, 30, 15, 0, 0, Math.PI*2); ctx.fill();
             
             ctx.fillStyle = "#ecf0f1";
             ctx.beginPath(); ctx.ellipse(0, 5, 20, 10, 0, 0, Math.PI*2); ctx.fill();

             ctx.fillStyle = "#95a5a6";
             ctx.beginPath(); ctx.arc(25, -10, 15, 0, Math.PI*2); ctx.fill();
             
             ctx.fillStyle = "#ecf0f1"; 
             ctx.beginPath(); ctx.rect(30, -10, 12, 8); ctx.fill();
             ctx.fillStyle = "#2c3e50"; 
             ctx.beginPath(); ctx.arc(42, -10, 3, 0, Math.PI*2); ctx.fill();

             ctx.fillStyle = "#95a5a6";
             ctx.beginPath();
             ctx.moveTo(15, -20); ctx.lineTo(20, -35); ctx.lineTo(30, -20); ctx.fill();
             
             ctx.fillStyle = "#3498db";
             ctx.beginPath(); ctx.arc(30, -15, 3, 0, Math.PI*2); ctx.fill();

             ctx.strokeStyle = "#ecf0f1";
             ctx.lineWidth = 5;
             ctx.lineCap = "round";
             
             let legAngle = Math.sin(frame * 0.25); 
             
             ctx.beginPath();
             ctx.moveTo(-20, 5);
             ctx.lineTo(-25 + (legAngle * 15), 25);
             ctx.stroke();

             ctx.beginPath();
             ctx.moveTo(20, 5);
             ctx.lineTo(25 - (legAngle * 15), 25);
             ctx.stroke();

             ctx.strokeStyle = "#95a5a6";
             ctx.beginPath();
             ctx.moveTo(-25, -5);
             ctx.quadraticCurveTo(-40, -20, -35 + (legAngle * 5), -25);
             ctx.stroke();

             ctx.restore();
        }
        else if (step === 3) {
            if (frame % 60 < 10) ctx.fillStyle = "#500000";
            else ctx.fillStyle = "#2c3e50";
            ctx.fillRect(0, 0, width, height);

            drawHuskyFace(ctx, cx, cy, 1.5, 'sad');

            ctx.fillStyle = "#2c3e50";
            let barY = Math.min(0, -300 + frame * 10);
            if (barY > 0) barY = 0;
            
            for(let i = cx - 200; i <= cx + 200; i+= 50) {
                ctx.fillRect(i, cy - 200 + barY, 10, 400);
            }
        }
        else if (step === 4) {
            ctx.fillStyle = "#1a252f";
            ctx.fillRect(0, 0, width, height);
            let sob = Math.sin(frame * 0.1) * 5;
            ctx.save();
            ctx.translate(cx, cy + sob);
            drawHuskyFace(ctx, 0, 0, 2.5, 'sad'); 
            
            ctx.fillStyle = "#3498db";
            let tearY = (frame * 3) % 120;
            let tearAlpha = Math.max(0, 1 - (tearY / 100));
            if (frame > 10) { 
                 ctx.globalAlpha = tearAlpha;
                 ctx.beginPath();
                 ctx.arc(-35, 20 + tearY, 8, 0, Math.PI*2);
                 ctx.fill();
                 let tearY2 = ((frame + 20) * 3) % 120;
                 let tearAlpha2 = Math.max(0, 1 - (tearY2 / 100));
                 ctx.globalAlpha = tearAlpha2;
                 ctx.beginPath();
                 ctx.arc(35, 20 + tearY2, 8, 0, Math.PI*2);
                 ctx.fill();
                 ctx.globalAlpha = 1.0;
            }
            ctx.restore();
        }
        else if (step === 5) {
            let zoom = 1 + (frame % 100) * 0.01;
            drawHuskyFace(ctx, cx, cy, 2 * zoom, 'determined');

            if (frame > 5) {
                ctx.fillStyle = "#f1c40f";
                ctx.font = "bold 120px Fredoka One";
                ctx.strokeStyle = "#e67e22";
                ctx.lineWidth = 5;
                let bounce = Math.abs(Math.sin(frame * 0.2)) * 20;
                ctx.fillText("!", cx, cy - 120 - bounce);
                ctx.strokeText("!", cx, cy - 120 - bounce);
            }
        }
    }

    private menuBackdropStartedAt = performance.now();

    /** Animated title-screen scene for Enhanced mode (drawn during INTRO). */
    public drawMenuBackdrop(width: number, height: number) {
        const t = (performance.now() - this.menuBackdropStartedAt) / 1000;
        this.enhancedBackgrounds; // (module already loaded)
        drawMenuBackdropScene(this.ctx, width, height, t * 0.35 + 11);
    }

    /**
     * Enhanced-mode-only cinematic layer drawn AFTER the classic cutscene art.
     * Letterbox bars, per-scene color mood, soft vignette and light film grain
     * make every cutscene feel like a staged shot without altering its content,
     * timing or text.
     */
    private grainCache: HTMLCanvasElement | null = null;

    public drawCinematicOverlay(manager: CutsceneManager, width: number, height: number) {
        if (gfxSettings.visualMode !== 'enhanced') return;
        const ctx = this.ctx;
        const t = performance.now() / 1000;

        // Per-cutscene color mood
        let tint: [number, number, number, number] = [20, 30, 60, 0.12];
        switch (manager.currentType) {
            case 'pier_intro': tint = [10, 20, 50, 0.2]; break;
            case 'underwater_intro': tint = [20, 80, 140, 0.16]; break;
            case 'chase': tint = [90, 10, 10, 0.1]; break;
            case 'pound_escape': tint = [40, 20, 70, 0.12]; break;
        }
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]},${tint[3]})`);
        grad.addColorStop(1, `rgba(${Math.min(255, tint[0] + 30)},${tint[1]},${tint[2]},${tint[3] * 0.7})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Vignette (cached)
        this.postFX.applyVignettePublic(ctx, width, height, 0.42);

        // Cinematic letterbox bars
        const barH = Math.max(28, height * 0.055);
        ctx.fillStyle = "rgba(0,0,0,0.88)";
        ctx.fillRect(0, 0, width, barH);
        ctx.fillRect(0, height - barH, width, barH);

        // Light film grain (cheap tiled noise, jittered each frame)
        if (!this.grainCache) {
            const g = document.createElement('canvas');
            g.width = 128; g.height = 128;
            const gctx = g.getContext('2d')!;
            const img = gctx.createImageData(128, 128);
            for (let i = 0; i < img.data.length; i += 4) {
                const v = Math.floor(Math.random() * 255);
                img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 14;
            }
            gctx.putImageData(img, 0, 0);
            this.grainCache = g;
        }
        ctx.save();
        ctx.globalAlpha = 0.5;
        const ox = Math.floor(Math.random() * 128);
        const oy = Math.floor(Math.random() * 128);
        for (let y = -oy; y < height; y += 128) {
            for (let x = -ox; x < width; x += 128) {
                ctx.drawImage(this.grainCache, x, y);
            }
        }
        ctx.restore();

        void t;
    }
}
