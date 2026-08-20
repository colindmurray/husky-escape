export const GRAVITY = 0.3;
export const FRICTION = 0.8;
export const JUMP_FORCE = -12;

export abstract class Entity {
    constructor(
        public x: number,
        public y: number,
        public w: number,
        public h: number,
        public color: string
    ) {}

    public velX = 0;
    public velY = 0;
    public grounded = false;
    public markedForDeletion = false;

    abstract draw(ctx: CanvasRenderingContext2D, camX: number, currentLevel?: number): void;
    
    update(...args: any[]) {}

    colCheck(shapeB: Entity) {
        // Get centers
        let vX = (this.x + (this.w / 2)) - (shapeB.x + (shapeB.w / 2));
        let vY = (this.y + (this.h / 2)) - (shapeB.y + (shapeB.h / 2));
        // Add half widths/heights
        let hWidths = (this.w / 2) + (shapeB.w / 2);
        let hHeights = (this.h / 2) + (shapeB.h / 2);
        let colDir = null;

        if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
            let oX = hWidths - Math.abs(vX);
            let oY = hHeights - Math.abs(vY);
            if (oX >= oY) {
                if (vY > 0) {
                    colDir = "t";
                    this.y += oY;
                } else {
                    colDir = "b";
                    this.y -= oY;
                }
            } else {
                if (vX > 0) {
                    colDir = "l";
                    this.x += oX;
                } else {
                    colDir = "r";
                    this.x -= oX;
                }
            }
        }
        return colDir;
    }
}