/**
 * Bakery enhanced-mode sprite helpers (Level 12). Classic canvas art lives on
 * the entities themselves; these additive polish draws run only in Enhanced
 * mode and never touch world state.
 */

/** Shared baker figure for the apprentice chaser (small) and boss (big). */
export function drawBakerPolish(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    walkAnim: number, dir: number,
    isBoss = false,
    slamming = false,
    stunned = false
) {
    const t = Date.now() / 1000;
    ctx.save();
    if (dir === -1) {
        ctx.translate(x + w / 2, y);
        ctx.scale(-1, 1);
        ctx.translate(-(x + w / 2), -y);
    }

    const legSwing = Math.sin(walkAnim) * (h * 0.09);
    const bob = Math.abs(Math.sin(walkAnim * 0.7)) * 2;

    // Warm rim-light behind the figure
    const halo = ctx.createRadialGradient(x + w / 2, y + h / 2, 6, x + w / 2, y + h / 2, w);
    halo.addColorStop(0, 'rgba(255,180,100,0.20)');
    halo.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(x - w / 2, y - h / 4, w * 2, h * 1.5);

    // Legs + shoes
    ctx.fillStyle = '#2c3a4a';
    const legH = h * 0.27;
    ctx.fillRect(x + w * 0.28 + legSwing, y + h - legH, w * 0.16, legH);
    ctx.fillRect(x + w * 0.56 - legSwing, y + h - legH, w * 0.16, legH);
    ctx.fillStyle = '#141414';
    ctx.fillRect(x + w * 0.24 + legSwing, y + h - 5, w * 0.24, 5);
    ctx.fillRect(x + w * 0.52 - legSwing, y + h - 5, w * 0.24, 5);

    // Apron body with soft shading
    const bodyGrad = ctx.createLinearGradient(x, y, x + w, y);
    bodyGrad.addColorStop(0, '#dfe6ea');
    bodyGrad.addColorStop(0.5, '#ffffff');
    bodyGrad.addColorStop(1, '#c9d2d8');
    ctx.fillStyle = bodyGrad;
    const bodyY = y + h * 0.32 + bob * 0.3;
    ctx.beginPath();
    ctx.roundRect(x + w * 0.14, bodyY, w * 0.72, h * 0.44, 7);
    ctx.fill();
    // Neckerchief
    ctx.fillStyle = isBoss ? '#c0392b' : '#b03a2e';
    ctx.fillRect(x + w * 0.4, bodyY, w * 0.2, h * 0.08);
    // Flour dust smudges
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x + w * 0.3, bodyY + h * 0.3, 4, 0, Math.PI * 2);
    ctx.arc(x + w * 0.68, bodyY + h * 0.22, 3, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.fillStyle = '#f1c27d';
    ctx.fillRect(x + w * 0.04, bodyY + h * 0.06 - legSwing * 0.4, w * 0.12, h * 0.26);
    if (isBoss) {
        // Rolling pin arm
        ctx.save();
        ctx.translate(x + w * 0.88, bodyY + h * 0.1);
        ctx.rotate(slamming ? 0.6 : -0.9 + Math.sin(t * 2) * 0.06);
        const pinGrad = ctx.createLinearGradient(0, -h * 0.4, 0, 0);
        pinGrad.addColorStop(0, '#c98f4a');
        pinGrad.addColorStop(1, '#8a5a2e');
        ctx.fillStyle = pinGrad;
        ctx.beginPath();
        ctx.roundRect(-w * 0.08, -h * 0.42, w * 0.16, h * 0.42, 5);
        ctx.fill();
        ctx.restore();
    } else {
        ctx.fillRect(x + w * 0.84, bodyY + h * 0.06 + legSwing * 0.4, w * 0.12, h * 0.26);
    }

    // Head
    ctx.fillStyle = '#f4c99b';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.2 + bob * 0.3, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
    // Moustache / brows
    ctx.fillStyle = isBoss ? '#4e342e' : '#5d4037';
    ctx.fillRect(x + w * 0.36, y + h * 0.24 + bob * 0.3, w * 0.28, 3);
    ctx.fillStyle = '#222';
    const glint = stunned ? '#ffff88' : '#222';
    ctx.fillStyle = glint;
    ctx.fillRect(x + w * 0.56, y + h * 0.17 + bob * 0.3, 3, 3);

    // Toque with glow when it's the hittable target
    const hatY = y + bob * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x + w * 0.2, hatY - h * 0.12, w * 0.6, h * 0.2, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.5, hatY - h * 0.1, w * 0.34, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#cfd6da';
    ctx.fillRect(x + w * 0.2, hatY + h * 0.06, w * 0.6, 3);
    if (isBoss) {
        const pulse = 0.25 + 0.2 * Math.sin(t * 6);
        ctx.fillStyle = `rgba(241,196,15,${pulse})`;
        ctx.beginPath();
        ctx.arc(x + w * 0.5, hatY, w * 0.48, 0, Math.PI * 2);
        ctx.fill();
    }
    if (stunned) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = `bold ${Math.max(12, w * 0.22)}px Arial`;
        ctx.fillText('★ ★ ★', x + w * 0.1, hatY - h * 0.2 + Math.sin(t * 10) * 3);
    }

    ctx.restore();
}
