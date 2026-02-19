import type { Exercise } from "@/src/lib/types";

export type Lesson = {
  id: string;
  name: string;
  exercise: Exercise;
};

export const DEFAULT_LESSON_ID = "basic-layout";

export const LESSONS: Lesson[] = [
  {
    id: "basic-layout",
    name: "Basic Page Structure with Header, Main, and Footer",
    exercise: {
      title: "Basic Page Structure with Header, Main, and Footer",
      description: "Construieste o pagina simpla cu header, continut principal si footer.",
      targetHtml: "<header><h1>My Website</h1><nav><a href='#'>Home</a><a href='#'>About</a><a href='#'>Contact</a></nav></header><main><section class='hero'><h2>Welcome</h2><p>Build modern pages with HTML and CSS.</p></section></main><footer>Copyright 2026</footer>",
      targetCss: "*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f4f7fb;color:#1f2937}header{background:#4caf50;color:#fff;padding:24px 16px;text-align:center}nav{display:flex;gap:24px;justify-content:center;margin-top:10px}nav a{color:#fff;text-decoration:none;font-weight:700}main{padding:24px;display:flex;justify-content:center}.hero{max-width:640px;background:#fff;border-radius:12px;padding:20px;box-shadow:0 8px 20px rgba(0,0,0,.08)}footer{text-align:center;padding:14px;background:#111827;color:#e5e7eb}",
      targetJs: "console.log('Lesson loaded: basic page structure');",
      hints: [
        "Incepe cu elementele semantice: header, main, footer.",
        "Foloseste display:flex pentru nav ca sa aliniezi linkurile.",
        "Adauga un card central in main cu border-radius si box-shadow.",
      ],
    },
  },
  {
    id: "tic-tac-toe-grid",
    name: "Joc de X si O (Tic Tac Toe)",
    exercise: {
      title: "Joc de X si O (Tic Tac Toe)",
      description: "Recreeaza interfata unui joc 3x3 cu stare pentru randul curent.",
      targetHtml: "<h1>Tic Tac Toe</h1><h2>Randul lui X</h2><div class='board'><button class='cell'>X</button><button class='cell'></button><button class='cell'></button><button class='cell'></button><button class='cell'>O</button><button class='cell'></button><button class='cell'></button><button class='cell'></button><button class='cell'></button></div>",
      targetCss: "body{margin:0;background:#d4d4d8;font-family:Helvetica,Arial,sans-serif;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}.board{display:grid;grid-template-columns:repeat(3,56px);gap:0}.cell{width:56px;height:56px;border:1px solid #111;background:#fff;font-size:24px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}",
      targetJs: "const cells=document.querySelectorAll('.cell'); let turn='X'; cells.forEach(c=>c.addEventListener('click',()=>{ if(c.textContent) return; c.textContent=turn; turn = turn==='X'?'O':'X';}));",
      hints: [
        "Foloseste grid cu 3 coloane egale pentru tabla.",
        "Celulele sunt butoane cu border subtire si dimensiune fixa.",
        "Actualizeaza randul curent dupa fiecare click valid.",
      ],
    },
  },
  {
    id: "product-card",
    name: "Responsive Product Card",
    exercise: {
      title: "Responsive Product Card",
      description: "Construieste un card de produs modern, cu buton de actiune.",
      targetHtml: "<div class='card'><span class='badge'>NEW</span><h2>Wireless Headphones</h2><p>Clear sound, all-day battery, lightweight design.</p><div class='row'><strong>$129</strong><button>Add to cart</button></div></div>",
      targetCss: "body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#e0f2fe,#dbeafe);font-family:system-ui}.card{width:min(92vw,360px);background:#fff;padding:20px;border-radius:16px;box-shadow:0 12px 30px rgba(2,6,23,.12)}.badge{display:inline-block;background:#111827;color:#fff;font-size:12px;padding:4px 8px;border-radius:999px}.card h2{margin:12px 0 8px}.card p{margin:0 0 16px;color:#475569}.row{display:flex;justify-content:space-between;align-items:center}.row button{border:none;background:#2563eb;color:#fff;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer}",
      targetJs: "console.log('Product card ready');",
      hints: [
        "Foloseste width:min(92vw, 360px) pentru responsive.",
        "Aplica un shadow discret si colturi rotunjite pe card.",
        "Aliniaza pretul si butonul pe acelasi rand cu flex.",
      ],
    },
  },
];

export function getLessonById(id: string | null | undefined): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS.find((lesson) => lesson.id === DEFAULT_LESSON_ID)!;
}
