import { Platform } from "./Platform";
import { gfxSettings } from "../GfxSettings";
import { drawControlPanelPolish } from "../engine/enhanced/EnhancedSprites";
import { audioManager } from "../Audio";
import { SoundType } from "../../types";

export class ControlPanel extends Platform {
    public pressed = false;
    private target: any;
    private targetOrigX: number;
    private targetOrigY: number;
    private targetDestX: number;
    private targetDestY: number;

    constructor(
        x: number,
        y: number,
        target: any,
        targetDestX: number,
        targetDestY: number
    ) {
        super(x, y, 45, 15);
        this.target = target;
        this.targetOrigX = target.x;
        this.targetOrigY = target.y;
        this.targetDestX = targetDestX;
        this.targetDestY = targetDestY;
    }

    update(platforms?: any, player?: any) {
        if (!player) return;

        // Check if player is standing on the panel
        const onTop = (
            player.x + player.w > this.x &&
            player.x < this.x + this.w &&
            player.y + player.h >= this.y - 4 &&
            player.y + player.h <= this.y + 4
        );

        if (onTop) {
            if (!this.pressed) {
                this.pressed = true;
                audioManager.playSFX(SoundType.WIN_SHORT); // Satisfying click/success note
            }
        }

        // Apply translation to target girder platform depending on button state
        if (this.pressed && this.target) {
            // Slide towards targetDest coordinates smoothly
            const dx = this.targetDestX - this.target.x;
            const dy = this.targetDestY - this.target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 1.5) {
                this.target.dx = (dx / dist) * 2.5;
                this.target.dy = (dy / dist) * 2.5;
                this.target.x += this.target.dx;
                this.target.y += this.target.dy;
            } else {
                this.target.x = this.targetDestX;
                this.target.y = this.targetDestY;
                this.target.dx = 0;
                this.target.dy = 0;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camX: number) {
        const x = this.x - camX;
        const y = this.y;

        // Draw Base Panel Box
        ctx.fillStyle = "#34495e";
        ctx.fillRect(x, y + 4, this.w, 11);
        
        ctx.strokeStyle = "#1e272e";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y + 4, this.w, 11);

        // Draw active / glowing button
        ctx.fillStyle = this.pressed ? "#2ecc71" : "#e74c3c"; // Green is pressed, red is idle
        if (this.pressed) {
            ctx.fillRect(x + 5, y + 3, this.w - 10, 2);
        } else {
            ctx.fillRect(x + 5, y + 1, this.w - 10, 4);
        }

        // Arrow graphics indicating linkage
        ctx.fillStyle = "white";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PAW", x + this.w / 2, y + 11);

        if (gfxSettings.visualMode === 'enhanced') {
            drawControlPanelPolish(ctx, x, y, this.w, this.pressed, Date.now() / 1000);
        }
    }
}
