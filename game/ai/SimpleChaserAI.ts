import { Entity, JUMP_FORCE } from "../entities/Entity";
import { Porcupine } from "../entities/Porcupine";

export class SimpleChaserAI {
    public update(me: any, target: Entity | null, platforms: Entity[], enemies: Entity[] = []) {
        if (!target) {
            me.velX = 0;
            return;
        }

        // 1. Determine Direction (Chase Player)
        const dx = target.x - me.x;
        const dir = Math.sign(dx);
        
        // Stop jittering if very close
        if (Math.abs(dx) < 10) {
            me.velX = 0;
        } else {
            me.velX = dir * me.speed;
            me.dir = dir; // Visual direction
        }

        // 2. Obstacle / Hazard Avoidance (Only if grounded)
        if (me.grounded && Math.abs(me.velX) > 0) {
            const lookAheadDist = 80; // Distance to scan ahead
            const checkX = me.x + (me.w / 2) + (dir * lookAheadDist);
            const feetY = me.y + me.h + 5;
            
            let groundFound = false;
            let wallFound = false;
            let hazardFound = false;

            // Check Platforms (Ground & Wall)
            for (const p of platforms) {
                // Check for Ground
                if (checkX >= p.x && checkX <= p.x + p.w && 
                    feetY >= p.y && feetY <= p.y + p.h + 20) { // Tolerance
                    groundFound = true;
                }

                // Check for Wall (blocking path at body height)
                // We check a point in front of the enemy at center height
                if (checkX >= p.x && checkX <= p.x + p.w &&
                    me.y + (me.h/2) > p.y && me.y + (me.h/2) < p.y + p.h) {
                    wallFound = true;
                }
            }
            
            // Check Hazards (Porcupines)
            for (const e of enemies) {
                if (e instanceof Porcupine) {
                     // Check if it's generally ahead and on the same level
                     const isAhead = dir > 0 ? (e.x > me.x && e.x < checkX + 50) : (e.x < me.x && e.x > checkX - 50);
                     const isSameLevel = Math.abs((e.y + e.h) - (me.y + me.h)) < 20;

                     if (isAhead && isSameLevel) {
                         hazardFound = true;
                     }
                }
            }

            // Decision: Jump if no ground ahead OR wall ahead OR hazard ahead
            if (!groundFound || wallFound || hazardFound) {
                me.velY = JUMP_FORCE;
                me.grounded = false;
                // Add a small boost to clear gaps/hazards if moving
                me.x += dir * 5; 
            }
        }
    }
}