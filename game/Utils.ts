export function drawHuskyFace(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, mood: 'happy' | 'sad' | 'determined' = 'happy') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Head
    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();

    // White Mask
    ctx.fillStyle = "#ecf0f1";
    ctx.beginPath();
    ctx.ellipse(0, 15, 35, 30, 0, 0, Math.PI*2);
    ctx.fill();

    // Ears
    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.moveTo(-30, -30); ctx.lineTo(-40, -70); ctx.lineTo(-10, -45); ctx.fill(); // Left
    ctx.beginPath();
    ctx.moveTo(30, -30); ctx.lineTo(40, -70); ctx.lineTo(10, -45); ctx.fill(); // Right

    // Eyes
    ctx.fillStyle = "#3498db";
    if (mood === 'sad') {
        // Sad eyes (half closed or tilted)
        ctx.beginPath(); ctx.arc(-15, -10, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -10, 6, 0, Math.PI*2); ctx.fill();
        // Eyelids
        ctx.fillStyle = "#95a5a6";
        ctx.fillRect(-22, -20, 15, 8);
        ctx.fillRect(8, -20, 15, 8);
        
    } else if (mood === 'determined') {
        // Determined eyes
        ctx.beginPath(); ctx.arc(-15, -10, 7, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -10, 7, 0, Math.PI*2); ctx.fill();
        
        // Angled Eyebrows
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        ctx.moveTo(-25, -20); ctx.lineTo(-5, -15); ctx.lineTo(-5, -18); ctx.lineTo(-25, -25); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(25, -20); ctx.lineTo(5, -15); ctx.lineTo(5, -18); ctx.lineTo(25, -25); ctx.fill();

    } else {
        // Happy eyes (default)
        ctx.beginPath(); ctx.arc(-15, -10, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -10, 8, 0, Math.PI*2); ctx.fill();
        // Shine
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(-12, -12, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(18, -12, 3, 0, Math.PI*2); ctx.fill();
    }

    // Nose
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath(); ctx.arc(0, 10, 8, 0, Math.PI*2); ctx.fill();

    // Mouth
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (mood === 'sad') {
        ctx.arc(0, 25, 10, Math.PI, 0); // Frown
    } else if (mood === 'determined') {
            ctx.moveTo(-10, 25); ctx.lineTo(10, 25); // Straight line
    } else {
        ctx.arc(0, 20, 10, 0, Math.PI); // Smile
    }
    ctx.stroke();

    ctx.restore();
}