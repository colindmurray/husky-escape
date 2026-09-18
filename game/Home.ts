import { drawFamilyDog, drawFamilyPerson } from './engine/FamilyArt';
import { Entity } from './entities/Entity';
import type { Player } from './entities/Player';
import { Platform } from './entities/Platform';
import { Exit } from './entities/Exit';
import { gfxSettings } from './GfxSettings';
import type { LevelData } from './levels/types';
import type { Accessory } from './Shop';

export const HOME_LEVEL = 15;
export const HOME_WIDTH = 1500;
export type HomeFloor = 'ground' | 'basement' | 'upstairs' | 'kitchen' | 'bedroom' | 'sunroom' | 'attic';
export const FLOORS: Record<HomeFloor, string> = { ground: 'Ground floor · Entry & shop', basement: 'Basement · Training & building', upstairs: 'Second floor · Master bedroom', kitchen: 'Ground floor · Kitchen', bedroom: 'Second floor · Reading nook', sunroom: 'Ground floor · Sunroom', attic: 'Top floor · Attic hideout' };
export const COMPANIONS = [
    { id: 'opal', dog: 'Opal', homeX: 380, accessory: 'collar' as Accessory, greeting: 'Hmph. This white carpet is my spot. It has smelled particularly lovely ever since Sammy visited. Do not wash it. Sammy! I mean Lammy. Where is my lamb? And where is that handsome Samwise? Not that I care. I am coming along to supervise.' },
    { id: 'ruby', dog: 'Ruby', homeX: 690, accessory: 'coat' as Accessory, greeting: 'Blep! I saved you a sploot spot. Opal keeps looking at Samwise instead of ME. I could just eat that little noodle… Only joking. Mostly. Let’s play!' },
    { id: 'samwise', dog: 'Samwise', homeX: 990, accessory: 'hat' as Accessory, greeting: 'Did someone say snacks? The little boy looked away and his toast just… vanished. Why is Opal calling me Lammy? Why is Ruby staring? Wait. Was that a HONK? Please tell me it wasn’t a goose.' },
] as const;
export type QuestStatus = 'accepted' | 'carrying' | 'found' | 'complete';
export type QuestProgress = Record<string, QuestStatus>;
export interface Quest {
    id: string; dog: string; item: string; level: number; x: number; rise: number;
    cosmetic?: Accessory; room?: HomeFloor; requires: string[]; reward: number; icon: string;
    hint: string; request: string; thanks: string;
}
export const QUESTS: Quest[] = [
    { id: 'peace', dog: 'Samwise', item: 'distraction biscuits', level: HOME_LEVEL, room: 'kitchen', x: 870, rise: 132, requires: [], reward: 12, icon: '🍪', hint: 'The blue biscuit tin is on the kitchen floor, beside the pantry.', request: 'Onyx! Opal keeps calling me Sammy, Ruby keeps licking her lips, and I have absolutely no idea why! Fetch the kitchen biscuits. We can share them. From a safe distance.', thanks: 'Biscuits for everyone! Opal has stopped chasing me. Ruby has stopped… whatever that was. Now we can explore the house!' },
    { id: 'lammy', dog: 'Opal', item: 'Lammy the lamb', level: 5, x: 1520, rise: 482, requires: ['peace'], reward: 18, icon: '🐑', hint: 'On the broad high ledge before the first moving mountain platform in level 5.', request: 'The carpet smells like Sammy, but my basket is empty. Sammy is missing! No, Lammy. My lamb toy. I left him in the mountains. Fetch him, please. I am not worried. Much.', thanks: 'Lammy! My darling Sammy—LAMMY. Stop looking at me like that. He belongs right here in my basket.' },
    { id: 'cushion', dog: 'Ruby', item: 'sploot cushion', level: 4, x: 1200, rise: 332, requires: ['peace'], reward: 16, icon: '🛏️', hint: 'At the right end of the first high sandy beach ledge in level 4.', request: 'Look at this SUNBEAM. A perfect sploot spot! My cushion is at the beach. Bring it home so I can do absolutely nothing on it. Blep.', thanks: 'Sunbeam. Cushion. Blep. This is the best day. Wake me if Opal finally notices me.' },
    { id: 'lunch', dog: 'Samwise', item: 'little boy’s lunchbox', level: 1, x: 1330, rise: 382, requires: ['peace'], reward: 20, icon: '🥪', hint: 'On the high platform above the last pound gap in level 1.', request: 'I am guarding the little boy’s toast. With my mouth. His lunchbox is still in the pound. Could you fetch it before he notices? We should probably give something back.', thanks: 'Lunchbox returned! The boy says we can bake biscuits together. I promise to eat only the samples.' },
    { id: 'ribbon', cosmetic: 'goose', dog: 'Opal', item: 'turquoise ribbon', level: HOME_LEVEL, room: 'sunroom', x: 1040, rise: 132, requires: ['lammy', 'cushion', 'lunch'], reward: 16, icon: '🎀', hint: 'Follow the goose to the far end of the sunroom. He left the ribbon beside his flowerpot.', request: 'Lammy needs a bow. For our tea party with Sammy. That outrageous goose pinched my turquoise ribbon! It is beside his flowerpot. I refuse to negotiate with poultry.', thanks: 'Perfect. Lammy looks very handsome. So does Sammy. I said LAMMY. The goose left you a feather costume as an apology. Try it on! Tea in the kitchen, please.' },
    { id: 'sun', dog: 'Ruby', item: 'rainbow sun-catcher', level: HOME_LEVEL, room: 'attic', x: 1000, rise: 132, requires: ['lammy', 'cushion', 'lunch'], reward: 16, icon: '🌈', hint: 'Beside the starry blanket fort at the far end of the attic.', request: 'I followed a sparkle upstairs! There is a rainbow sun-catcher by the blanket fort. Bring it to me and we can make my bedroom sunbeam EVEN BETTER.', thanks: 'RAINBOW SPLOOT! The bedroom is going to look amazing. Now let’s get biscuits. Blep.' },
    { id: 'recipe', dog: 'Samwise', item: 'biscuit recipe', level: 12, x: 610, rise: 212, requires: ['lammy', 'cushion', 'lunch'], reward: 22, icon: '📜', hint: 'On the first raised conveyor at the quiet bakery entrance in level 12.', request: 'The boy and I are baking a welcome-home feast! Small problem: I ate the recipe. There is another on the bakery’s first raised conveyor. Please fetch it. Do not tell the goose.', thanks: 'A recipe! Everybody to the kitchen! These biscuits are for sharing. Even with Ruby. Even if she keeps looking at me like a sandwich.' },
];
export const questAvailable = (quest: Quest, progress: QuestProgress) => quest.requires.every(id => progress[id] === 'complete');
export function houseChapter(progress: QuestProgress) {
    if (progress.peace !== 'complete') return 0;
    if (!['lammy', 'cushion', 'lunch'].every(id => progress[id] === 'complete')) return 1;
    return ['ribbon', 'sun', 'recipe'].every(id => progress[id] === 'complete') ? 3 : 2;
}
export function dogRoom(id: string, progress: QuestProgress): HomeFloor {
    const chapter = houseChapter(progress);
    if (chapter === 0) return 'ground';
    if (chapter === 3) return id === 'ruby' ? 'bedroom' : 'kitchen';
    if (id === 'samwise') return 'kitchen';
    return id === 'opal' ? chapter === 1 ? 'upstairs' : 'sunroom' : chapter === 1 ? 'bedroom' : 'attic';
}
export function dogActivity(id: string, progress: QuestProgress) {
    const chapter = houseChapter(progress);
    if (chapter === 0) return id === 'opal' ? 'hearts' : id === 'ruby' ? 'angry' : 'worried';
    if (id === 'opal') return progress.lammy === 'complete' ? 'cuddle' : 'sniff';
    if (id === 'ruby') return chapter === 1 || chapter === 3 ? 'curl' : 'play';
    return chapter >= 2 ? 'bake' : 'snack';
}
export function homeDogs(height: number, room: HomeFloor, progress: QuestProgress) {
    const chapter = houseChapter(progress);
    return COMPANIONS.filter(dog => dogRoom(dog.id, progress) === room).map((dog, i) => {
        const x = dog.id === 'ruby' && room === 'bedroom' ? 827 : chapter === 0 ? [450, 680, 880][i] : chapter === 3 ? [530, 720, 900][i] : dog.id === 'opal' ? 650 : dog.id === 'ruby' ? 780 : 690;
        const actor = new HomeDog({ ...dog, homeX: x }, height - 100);
        actor.activity = dogActivity(dog.id, progress); return actor;
    });
}


export const FAMILY = [
    { id: 'maria', name: 'Maria', room: 'bedroom', x: 720, greeting: 'Oh hi Onyx! Wanna read with me? I saved you a spot on the blanket. This chapter has a dragon who is afraid of kittens.', detail: 'Maria turns a page quietly. Ruby is curled into a little doughnut, with her tail tucked over her nose.', lines: ['A good reading nook needs three things: a book, a blanket, and a very sleepy Ruby.', 'Ruby dreams through all the exciting bits. Even dragons cannot wake her up.', 'You can borrow my little book satchel. Every adventure needs a story.'] },
    { id: 'belle', name: 'Belle', room: 'attic', x: 605, greeting: 'Hellooo doggie, Lets spin!', detail: 'Belle has declared this the Official Headquarters of Going Around in Circles. The cushions are her audience.', lines: ['I am not dizzy. The HOUSE is dizzy.', 'New rule: if you wobble, that counts as dancing.', 'I made you a spin treat! Six seconds of twirls, and nearby bones come dancing over.'] },
    { id: 'mom', name: 'Mom', room: 'sunroom', x: 595, greeting: 'Hi, Onyx! Come keep me company while I finish this chapter.', detail: 'Mom hums while she writes a story about a dragon, a brave heroine, and a very inconvenient prince.', lines: ['Everyone gets a cuddle. Then we put the cushions back. Yes, Belle, all of them.', 'In this chapter the princess rescues herself. The dragon helps with the luggage.', 'One song, one more page, then I am coming to see what you children have built.'] },
    { id: 'dad', name: 'Dad', room: 'ground', x: 550, greeting: 'Hi, Onyx! There’s always room for a good dog on this sofa.', detail: 'Dad sets down a case file. Today he is helping a small neighborhood stand up to a very big company.', lines: ['What do dogs call a lawyer? A paw-torney. I rest my case.', 'A big pile of money does not make somebody right. Everybody deserves a fair chance.', 'Your case is very strong: you are a good dog, and the evidence says you deserve a belly rub.'] },
] as const;
export type FamilyId = typeof FAMILY[number]['id'];
export class HomePerson extends Entity {
    public nearby = false;
    public animTime = 0;
    constructor(public person: typeof FAMILY[number], floor: number) { super(person.x, floor - 40, 40, 40, '#fff'); }
    update(player: Player) {
        this.animTime += 1 / 60;
        this.nearby = Math.abs(player.x - this.x) < 85 && Math.abs(player.y - this.y) < 60;
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) { drawFamilyPerson(ctx, this.person.id, this.x + 20 - camX, this.y + 40, this.animTime); }
}

export class HomeDog extends Entity {
    public nearby = false;
    private facingRight = true;
    public following = false;
    public activity = '';
    public animTime = 0;
    public gooseNearby = false;
    constructor(public quest: { id: string; dog: string; homeX: number; accessory: Accessory }, floor: number) {
        super(quest.homeX, floor - 40, 40, 40, '#fff');
    }
    update(player: Player) {
        this.animTime += 1 / 60;
        this.nearby = Math.abs(player.x - this.x) < 85 && Math.abs(player.y - this.y) < 55;
        this.facingRight = this.following && Math.abs(this.velX) > .1 ? this.velX > 0 : player.x > this.x;
        this.gooseNearby = player.accessories.has('goose');
    }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        ctx.save();
        if (!this.following) { ctx.translate(this.x + 20 - camX, this.y + 40); ctx.scale(1.3, 1.3); ctx.translate(-(this.x + 20 - camX), -(this.y + 40)); }
        drawFamilyDog(ctx, this.quest.id, this.x - camX, this.y, this.facingRight, Math.abs(this.velX) > .5, this.animTime, this.following, this.quest.id === 'samwise' && this.gooseNearby, this.activity);
        ctx.restore();
        if (this.following) {
            ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#263b48df'; ctx.fillRect(this.x - 15 - camX, this.y - 55, 70, 23);
            ctx.fillStyle = '#fff3cc'; ctx.fillText(this.quest.dog, this.x + 20 - camX, this.y - 40); ctx.restore();
        }
    }
}

export class QuestPickup extends Entity {
    constructor(public quest: Quest, height: number) { super(quest.x, height - quest.rise, 28, 28, '#f46269'); }
    draw(ctx: CanvasRenderingContext2D, camX: number) {
        if (this.markedForDeletion) return;
        const x = this.x - camX, y = this.y + Math.sin(performance.now() / 250) * 3;
        ctx.save(); ctx.translate(x, y);
        if (gfxSettings.visualMode === 'enhanced') { ctx.shadowColor = '#ffe4a0'; ctx.shadowBlur = 18; }
        ctx.strokeStyle = '#fff5ce'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(14, 14, 23, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
        if (this.quest.id === 'peace') {
            ctx.fillStyle = '#5b929a'; ctx.beginPath(); ctx.roundRect(0, 5, 28, 23, 5); ctx.fill(); ctx.fillStyle = '#edcb8d'; ctx.fillRect(-2, 3, 32, 5); ctx.beginPath(); ctx.arc(14, 18, 7, 0, Math.PI * 2); ctx.fill();
        } else if (this.quest.id === 'ribbon') {
            ctx.fillStyle = '#40b4ac'; ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(0, 2); ctx.lineTo(1, 23); ctx.lineTo(28, 2); ctx.lineTo(27, 23); ctx.closePath(); ctx.fill();
        } else if (this.quest.id === 'sun') {
            for (const [i, color] of ['#e88d91', '#eac36c', '#9abf89', '#6fb8c2', '#a999cb'].entries()) { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(14, 23, 13 - i * 2.5, Math.PI, 0); ctx.stroke(); }
        } else if (this.quest.id === 'recipe') {
            ctx.fillStyle = '#f8e4bb'; ctx.fillRect(2, 0, 25, 29); ctx.fillStyle = '#927452'; for (let y = 5; y < 25; y += 5) ctx.fillRect(7, y, 14, 2);
        } else if (this.quest.id === 'lammy') {
            ctx.fillStyle = '#fff6dc'; for (const [cx, cy, r] of [[10, 18, 10], [21, 10, 7], [3, 25, 4], [17, 26, 4]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = '#e57880'; ctx.fillRect(15, 15, 9, 3); ctx.fillStyle = '#333'; ctx.fillRect(23, 8, 2, 2);
        } else if (this.quest.id === 'cushion') {
            ctx.fillStyle = '#d85d79'; ctx.beginPath(); ctx.roundRect(0, 7, 29, 21, 7); ctx.fill(); ctx.strokeStyle = '#ffe8d0'; ctx.strokeRect(5, 12, 19, 11);
        } else if (this.quest.id === 'lunch') {
            ctx.strokeStyle = '#427580'; ctx.lineWidth = 3; ctx.strokeRect(10, 2, 10, 9); ctx.fillStyle = '#63b6bc'; ctx.fillRect(0, 8, 29, 20); ctx.fillStyle = '#ffdc81'; ctx.fillRect(12, 14, 6, 5);
        }
        ctx.restore();
    }
}

export function getHome(height: number, room: HomeFloor = 'ground', progress: QuestProgress = {}): LevelData {
    const floor = height - 100;
    return { platforms: [new Platform(0, floor, HOME_WIDTH, 100)], enemies: [], collectibles: [], waters: [],
        props: [...FAMILY.filter(p => p.room === room).map(p => new HomePerson(p, floor)), ...homeDogs(height, room, progress)], exit: new Exit(HOME_WIDTH + 1000, floor - 80), playerStart: { x: 150, y: floor - 40 } };
}


export const ROOM_DOORS: Record<HomeFloor, { x: number; to: HomeFloor; label: string }[]> = {
    ground: [{ x: 220, to: 'kitchen', label: 'Kitchen' }],
    kitchen: [{ x: 220, to: 'ground', label: 'Entry hall' }, { x: 1240, to: 'sunroom', label: 'Sunroom' }],
    upstairs: [{ x: 1250, to: 'bedroom', label: 'Bedroom' }],
    bedroom: [{ x: 220, to: 'upstairs', label: 'Master bedroom' }, { x: 1250, to: 'attic', label: 'Attic hideout' }],
    sunroom: [{ x: 220, to: 'kitchen', label: 'Kitchen' }],
    attic: [{ x: 220, to: 'bedroom', label: 'Bedroom' }],
    basement: [],
};
