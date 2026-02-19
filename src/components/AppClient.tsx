'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import { CheckCircle, MessageSquare, Settings, User, Sparkles, Loader2, Send, X, Minimize2, Maximize2, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import { Exercise, getTeacherFeedback, getChatResponse } from '../services/geminiService';
import type { AiLanguage } from '@/src/lib/languages';

type SettingsResponse = {
  defaultLessonId: string;
  selectedLessonId: string;
  selectedAiLanguage: AiLanguage;
  aiLanguageOptions: { code: AiLanguage; label: string }[];
  lessons: { id: string; name: string; title: string; description: string }[];
  exercise_json: string | null;
};

const STARTER_CODE: Record<AiLanguage, { html: string; css: string; js: string }> = {
  ro: {
    html: '<!-- Scrie HTML aici -->\n<div class="box">Salut!</div>',
    css: '/* Scrie CSS aici */\n.box {\n  color: white;\n  padding: 20px;\n  background: #3b82f6;\n  border-radius: 8px;\n}',
    js: '// Scrie JS aici\nconsole.log("Hello World");',
  },
  en: {
    html: '<!-- Write HTML here -->\n<div class="box">Hello!</div>',
    css: '/* Write CSS here */\n.box {\n  color: white;\n  padding: 20px;\n  background: #3b82f6;\n  border-radius: 8px;\n}',
    js: '// Write JS here\nconsole.log("Hello World");',
  },
  es: {
    html: '<!-- Escribe HTML aqui -->\n<div class="box">Hola!</div>',
    css: '/* Escribe CSS aqui */\n.box {\n  color: white;\n  padding: 20px;\n  background: #3b82f6;\n  border-radius: 8px;\n}',
    js: '// Escribe JS aqui\nconsole.log("Hello World");',
  },
  fr: {
    html: '<!-- Ecris le HTML ici -->\n<div class="box">Salut!</div>',
    css: '/* Ecris le CSS ici */\n.box {\n  color: white;\n  padding: 20px;\n  background: #3b82f6;\n  border-radius: 8px;\n}',
    js: '// Ecris le JS ici\nconsole.log("Hello World");',
  },
  de: {
    html: '<!-- Schreibe HTML hier -->\n<div class="box">Hallo!</div>',
    css: '/* Schreibe CSS hier */\n.box {\n  color: white;\n  padding: 20px;\n  background: #3b82f6;\n  border-radius: 8px;\n}',
    js: '// Schreibe JS hier\nconsole.log("Hello World");',
  },
  it: {
    html: '<!-- Scrivi HTML qui -->\n<div class="box">Ciao!</div>',
    css: '/* Scrivi CSS qui */\n.box {\n  color: white;\n  padding: 20px;\n  background: #3b82f6;\n  border-radius: 8px;\n}',
    js: '// Scrivi JS qui\nconsole.log("Hello World");',
  },
  pt: {
    html: '<!-- Escreva HTML aqui -->\n<div class="box">Ola!</div>',
    css: '/* Escreva CSS aqui */\n.box {\n  color: white;\n  padding: 20px;\n  background: #3b82f6;\n  border-radius: 8px;\n}',
    js: '// Escreva JS aqui\nconsole.log("Hello World");',
  },
};

const LESSON_LABELS: Record<AiLanguage, Record<string, { name: string; description: string }>> = {
  ro: {
    "basic-layout": { name: "Structura de pagina: Header, Main, Footer", description: "Construieste o pagina simpla cu header, continut principal si footer." },
    "tic-tac-toe-grid": { name: "Joc de X si O (Tic Tac Toe)", description: "Recreeaza interfata unui joc 3x3 cu stare pentru randul curent." },
    "product-card": { name: "Card de produs responsive", description: "Construieste un card de produs modern, cu buton de actiune." },
    "pocket-calculator": { name: "Calculator simplu de buzunar", description: "Creeaza un calculator simplu cu cifre, operatii si buton de egal." },
  },
  en: {
    "basic-layout": { name: "Basic Page Structure", description: "Build a simple page with header, main content, and footer." },
    "tic-tac-toe-grid": { name: "Tic Tac Toe", description: "Recreate a 3x3 game UI with current turn state." },
    "product-card": { name: "Responsive Product Card", description: "Build a modern product card with a call-to-action button." },
    "pocket-calculator": { name: "Simple Pocket Calculator", description: "Build a basic calculator with numbers, operations, and equals." },
  },
  es: {
    "basic-layout": { name: "Estructura basica de pagina", description: "Crea una pagina simple con encabezado, contenido principal y pie." },
    "tic-tac-toe-grid": { name: "Tres en raya", description: "Recrea una interfaz 3x3 con estado del turno actual." },
    "product-card": { name: "Tarjeta de producto responsive", description: "Construye una tarjeta moderna con boton de accion." },
    "pocket-calculator": { name: "Calculadora de bolsillo simple", description: "Crea una calculadora basica con numeros, operaciones e igual." },
  },
  fr: {
    "basic-layout": { name: "Structure de page de base", description: "Construis une page simple avec en-tete, contenu principal et pied." },
    "tic-tac-toe-grid": { name: "Morpion", description: "Recree une interface 3x3 avec l'etat du tour courant." },
    "product-card": { name: "Carte produit responsive", description: "Construis une carte produit moderne avec bouton d'action." },
    "pocket-calculator": { name: "Calculatrice de poche simple", description: "Cree une calculatrice simple avec chiffres, operations et egal." },
  },
  de: {
    "basic-layout": { name: "Grundstruktur einer Seite", description: "Erstelle eine einfache Seite mit Header, Hauptbereich und Footer." },
    "tic-tac-toe-grid": { name: "Tic Tac Toe", description: "Bilde eine 3x3-Spieloberflaeche mit Zugstatus nach." },
    "product-card": { name: "Responsive Produktkarte", description: "Erstelle eine moderne Produktkarte mit Aktionsbutton." },
    "pocket-calculator": { name: "Einfacher Taschenrechner", description: "Baue einen einfachen Rechner mit Zahlen, Operationen und Gleich." },
  },
  it: {
    "basic-layout": { name: "Struttura pagina di base", description: "Crea una pagina semplice con header, contenuto principale e footer." },
    "tic-tac-toe-grid": { name: "Tris", description: "Ricrea una UI 3x3 con stato del turno corrente." },
    "product-card": { name: "Scheda prodotto responsive", description: "Costruisci una scheda prodotto moderna con bottone azione." },
    "pocket-calculator": { name: "Calcolatrice tascabile semplice", description: "Crea una calcolatrice base con numeri, operazioni e uguale." },
  },
  pt: {
    "basic-layout": { name: "Estrutura basica de pagina", description: "Crie uma pagina simples com cabecalho, conteudo principal e rodape." },
    "tic-tac-toe-grid": { name: "Jogo da velha", description: "Recrie uma interface 3x3 com estado do turno atual." },
    "product-card": { name: "Card de produto responsivo", description: "Construa um card moderno com botao de acao." },
    "pocket-calculator": { name: "Calculadora de bolso simples", description: "Crie uma calculadora basica com numeros, operacoes e igual." },
  },
};

const UI_TEXT: Record<
  AiLanguage,
  {
    newLesson: string;
    assistant: string;
    askTeacher: string;
    realtime: string;
    adminPanel: string;
    liveResult: string;
    target: string;
    aiTeacher: string;
    online: string;
    today: string;
    welcome: string;
    messagePlaceholder: string;
    seeMore: string;
    seeLess: string;
    preparingLesson: string;
    savedLessons: string;
    aiLanguage: string;
    cancel: string;
    launchLesson: string;
    defaultBadge: string;
    close: string;
  }
> = {
  ro: {
    newLesson: "Lecție Nouă",
    assistant: "AI Teacher Assistant",
    askTeacher: "Întreabă profesorul",
    realtime: "Asistență în timp real",
    adminPanel: "Admin Panel",
    liveResult: "Rezultatul Tău Live",
    target: "Obiectiv",
    aiTeacher: "Profesor AI",
    online: "online",
    today: "Astăzi",
    welcome: "Salut! Sunt aici sa te ajut. Incepe sa scrii cod pentru a replica designul de mai sus sau pune-mi o intrebare.",
    messagePlaceholder: "Scrie un mesaj",
    seeMore: "Vezi mai mult",
    seeLess: "Vezi mai puțin",
    preparingLesson: "Pregătim lecția...",
    savedLessons: "Lectii Salvate",
    aiLanguage: "Limba AI",
    cancel: "Anuleaza",
    launchLesson: "Lanseaza lectia",
    defaultBadge: "Default",
    close: "Inchide",
  },
  en: {
    newLesson: "New Lesson",
    assistant: "AI Teacher Assistant",
    askTeacher: "Ask the teacher",
    realtime: "Real-time assistance",
    adminPanel: "Admin Panel",
    liveResult: "Your Live Result",
    target: "Target",
    aiTeacher: "AI Teacher",
    online: "online",
    today: "Today",
    welcome: "Hi! I'm here to help you. Start writing code to replicate the design above or ask me a question.",
    messagePlaceholder: "Type a message",
    seeMore: "See more",
    seeLess: "See less",
    preparingLesson: "Preparing lesson...",
    savedLessons: "Saved Lessons",
    aiLanguage: "AI Language",
    cancel: "Cancel",
    launchLesson: "Launch lesson",
    defaultBadge: "Default",
    close: "Close",
  },
  es: {
    newLesson: "Nueva Lección",
    assistant: "Asistente de Profesor IA",
    askTeacher: "Preguntar al profesor",
    realtime: "Asistencia en tiempo real",
    adminPanel: "Panel de Admin",
    liveResult: "Tu Resultado en Vivo",
    target: "Objetivo",
    aiTeacher: "Profesor IA",
    online: "en línea",
    today: "Hoy",
    welcome: "¡Hola! Estoy aquí para ayudarte. Empieza a escribir código para replicar el diseño de arriba o hazme una pregunta.",
    messagePlaceholder: "Escribe un mensaje",
    seeMore: "Ver más",
    seeLess: "Ver menos",
    preparingLesson: "Preparando lección...",
    savedLessons: "Lecciones Guardadas",
    aiLanguage: "Idioma IA",
    cancel: "Cancelar",
    launchLesson: "Iniciar lección",
    defaultBadge: "Predeterminado",
    close: "Cerrar",
  },
  fr: {
    newLesson: "Nouvelle Leçon",
    assistant: "Assistant Professeur IA",
    askTeacher: "Demander au professeur",
    realtime: "Assistance en temps réel",
    adminPanel: "Panneau Admin",
    liveResult: "Votre Résultat en Direct",
    target: "Objectif",
    aiTeacher: "Professeur IA",
    online: "en ligne",
    today: "Aujourd'hui",
    welcome: "Salut! Je suis là pour t'aider. Commence à écrire du code pour reproduire le design ci-dessus ou pose-moi une question.",
    messagePlaceholder: "Écrire un message",
    seeMore: "Voir plus",
    seeLess: "Voir moins",
    preparingLesson: "Préparation de la leçon...",
    savedLessons: "Leçons Enregistrées",
    aiLanguage: "Langue IA",
    cancel: "Annuler",
    launchLesson: "Lancer la leçon",
    defaultBadge: "Par défaut",
    close: "Fermer",
  },
  de: {
    newLesson: "Neue Lektion",
    assistant: "KI Lehrer Assistent",
    askTeacher: "Lehrer fragen",
    realtime: "Echtzeit-Hilfe",
    adminPanel: "Admin-Bereich",
    liveResult: "Dein Live-Ergebnis",
    target: "Ziel",
    aiTeacher: "KI Lehrer",
    online: "online",
    today: "Heute",
    welcome: "Hallo! Ich bin hier, um dir zu helfen. Fang an, Code zu schreiben, um das Design oben nachzubauen, oder stelle mir eine Frage.",
    messagePlaceholder: "Nachricht schreiben",
    seeMore: "Mehr anzeigen",
    seeLess: "Weniger anzeigen",
    preparingLesson: "Lektion wird vorbereitet...",
    savedLessons: "Gespeicherte Lektionen",
    aiLanguage: "KI-Sprache",
    cancel: "Abbrechen",
    launchLesson: "Lektion starten",
    defaultBadge: "Standard",
    close: "Schließen",
  },
  it: {
    newLesson: "Nuova Lezione",
    assistant: "Assistente Insegnante IA",
    askTeacher: "Chiedi al professore",
    realtime: "Assistenza in tempo reale",
    adminPanel: "Pannello Admin",
    liveResult: "Il Tuo Risultato Live",
    target: "Obiettivo",
    aiTeacher: "Professore IA",
    online: "online",
    today: "Oggi",
    welcome: "Ciao! Sono qui per aiutarti. Inizia a scrivere codice per replicare il design sopra oppure fammi una domanda.",
    messagePlaceholder: "Scrivi un messaggio",
    seeMore: "Vedi di più",
    seeLess: "Vedi meno",
    preparingLesson: "Preparazione della lezione...",
    savedLessons: "Lezioni Salvate",
    aiLanguage: "Lingua IA",
    cancel: "Annulla",
    launchLesson: "Avvia lezione",
    defaultBadge: "Predefinito",
    close: "Chiudi",
  },
  pt: {
    newLesson: "Nova Lição",
    assistant: "Assistente de Professor IA",
    askTeacher: "Perguntar ao professor",
    realtime: "Assistência em tempo real",
    adminPanel: "Painel Admin",
    liveResult: "Seu Resultado Ao Vivo",
    target: "Objetivo",
    aiTeacher: "Professor IA",
    online: "online",
    today: "Hoje",
    welcome: "Olá! Estou aqui para te ajudar. Comece a escrever código para reproduzir o design acima ou me faça uma pergunta.",
    messagePlaceholder: "Escreva uma mensagem",
    seeMore: "Ver mais",
    seeLess: "Ver menos",
    preparingLesson: "Preparando lição...",
    savedLessons: "Lições Salvas",
    aiLanguage: "Idioma IA",
    cancel: "Cancelar",
    launchLesson: "Iniciar lição",
    defaultBadge: "Padrão",
    close: "Fechar",
  },
};

const StudentView = ({ onAdmin, reloadToken }: { onAdmin: () => void; reloadToken: number }) => {
  const [html, setHtml] = useState(STARTER_CODE.ro.html);
  const [css, setCss] = useState(STARTER_CODE.ro.css);
  const [js, setJs] = useState(STARTER_CODE.ro.js);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [aiLanguage, setAiLanguage] = useState<AiLanguage>('ro');
  const [isRealTime, setIsRealTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; role: 'user' | 'model'; text: string; time: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [minimizedEditors, setMinimizedEditors] = useState({ html: false, css: false, js: false });
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [isObjectiveDrawerOpen, setIsObjectiveDrawerOpen] = useState(false);
  const [isLiveDrawerOpen, setIsLiveDrawerOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [sessionStartTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );
  const ui = UI_TEXT[aiLanguage] ?? UI_TEXT.ro;
  const isBelow1200 = viewportWidth < 1200;
  const isBelow800 = viewportWidth < 800;
  
  const lastRealtimeSnapshotRef = useRef<string | null>(null);
  const seenModelMessagesRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const resetLessonWorkspace = (language: AiLanguage = aiLanguage) => {
    const starter = STARTER_CODE[language] ?? STARTER_CODE.ro;
    setHtml(starter.html);
    setCss(starter.css);
    setJs(starter.js);
    setChatInput('');
    setChatMessages([]);
    setExpandedDetails({});
    setIsChatting(false);
    setIsChatOpen(false);
    setUnreadCount(0);
    setIsRealTime(false);
    setChecking(false);
    setMinimizedEditors({ html: false, css: false, js: false });
    lastRealtimeSnapshotRef.current = null;
    seenModelMessagesRef.current = new Set();
  };

  const playIncomingMessageSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.06);
      gain2.gain.setValueAtTime(0.0001, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.2);

      setTimeout(() => {
        void ctx.close();
      }, 260);
    } catch {
      // Ignore notification sound failures (browser autoplay restrictions, etc.)
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [reloadToken]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isBelow1200) {
      setIsObjectiveDrawerOpen(false);
    }
    if (!isBelow800) {
      setIsLiveDrawerOpen(false);
      setIsModeMenuOpen(false);
    }
  }, [isBelow1200, isBelow800]);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [chatMessages, isChatOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = (await res.json()) as SettingsResponse;
      if (data.exercise_json) {
        setExercise(JSON.parse(data.exercise_json));
      }
      const nextLanguage = data.selectedAiLanguage || 'ro';
      setAiLanguage(nextLanguage);
      resetLessonWorkspace(nextLanguage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeAiMessage = (text: string) => {
    let formatted = text.trim();
      formatted = formatted.replace(/([^\n*])(\d+\.\s)/g, '$1\n$2');
    formatted = formatted.replace(/(^|\n)(\d+)\.\s*([A-Za-zĂÂÎȘȘȚȚăâîșț]+)\s*:/g, '$1**$2. $3:**');
    return formatted;
  };

  const parseShortAndDetails = (text: string) => {
    const marker = '\n\n[[MORE]]\n\n';
    if (text.includes(marker)) {
      const [shortPart, ...rest] = text.split(marker);
      return {
        shortText: shortPart.trim(),
        detailsText: rest.join(marker).trim(),
      };
    }

    const scurtMatch = text.match(/\[SCURT\]([\s\S]*?)\[\/SCURT\]/i);
    const detaliiMatch = text.match(/\[DETALII\]([\s\S]*?)\[\/DETALII\]/i);
    if (!scurtMatch) {
      return { shortText: text, detailsText: '' };
    }
    return {
      shortText: scurtMatch[1].trim(),
      detailsText: detaliiMatch ? detaliiMatch[1].trim() : '',
    };
  };

  const createMessage = (role: 'user' | 'model', text: string) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  const appendModelMessageIfUnique = (text: string) => {
    const formatted = normalizeAiMessage(text);
    let didAdd = false;
    setChatMessages((prev) => {
      const normalized = formatted.trim();
      if (seenModelMessagesRef.current.has(normalized)) {
        return prev;
      }
      const lastModel = [...prev].reverse().find((msg) => msg.role === 'model');
      if (lastModel && lastModel.text.trim() === normalized) {
        return prev;
      }
      didAdd = true;
      seenModelMessagesRef.current.add(normalized);
      return [...prev, createMessage('model', formatted)];
    });
    if (didAdd) {
      playIncomingMessageSound();
      if (!isChatOpen) setUnreadCount((prev) => prev + 1);
    }
  };

  const handleVerify = async (realTime = false) => {
    if (!exercise || checking) return;
    if (realTime && !isRealTime) return;
    const snapshot = `${html}\n/*__CSS__*/\n${css}\n/*__JS__*/\n${js}`;
    if (realTime && lastRealtimeSnapshotRef.current === snapshot) return;

    setChecking(true);
    try {
      const result = await getTeacherFeedback(exercise, { html, css, js }, realTime, aiLanguage);
      appendModelMessageIfUnique(result.feedback);
      if (realTime) {
        lastRealtimeSnapshotRef.current = snapshot;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !exercise || isChatting) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, createMessage('user', userMsg)]);
    setIsChatting(true);

    try {
      const response = await getChatResponse(
        exercise,
        { html, css, js },
        userMsg,
        chatMessages.map((m) => ({ role: m.role, text: m.text })),
        aiLanguage,
      );
      appendModelMessageIfUnique(response);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  const toggleEditor = (type: 'html' | 'css' | 'js') => {
    setMinimizedEditors(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Real-time debounce
  useEffect(() => {
    if (isRealTime) {
      const timer = setTimeout(() => {
        handleVerify(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [html, css, js, isRealTime]);

  useEffect(() => {
    if (!isRealTime) {
      lastRealtimeSnapshotRef.current = null;
    }
  }, [isRealTime, exercise?.title]);

  const srcDoc = `
    <html>
      <style>${css}</style>
      <body>${html}</body>
      <script>${js}</script>
    </html>
  `;

  const targetDoc = exercise ? `
    <html>
      <style>${exercise.targetCss}</style>
      <body>${exercise.targetHtml}</body>
      <script>${exercise.targetJs}</script>
    </html>
  ` : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-zinc-400 animate-pulse">{ui.preparingLesson}</p>
        </div>
      </div>
    );
  }

  const headerHeight = "h-12";

  const editorsColumn = (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className={`flex flex-col border-b border-zinc-800 transition-all duration-300 ${minimizedEditors.html ? 'h-12' : 'flex-1 min-h-0'}`}>
        <div className={`flex items-center justify-between px-4 ${headerHeight} bg-zinc-900 border-b border-zinc-800 shrink-0`}>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">HTML</span>
          <button onClick={() => toggleEditor('html')} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
            {minimizedEditors.html ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
        {!minimizedEditors.html && (
          <div className="flex-1 overflow-auto p-4 font-mono">
            <Editor
              value={html}
              onValueChange={setHtml}
              highlight={code => highlight(code, languages.markup, 'markup')}
              padding={10}
              className="min-h-full outline-none"
            />
          </div>
        )}
      </div>

      <div className={`flex flex-col border-b border-zinc-800 transition-all duration-300 ${minimizedEditors.css ? 'h-12' : 'flex-1 min-h-0'}`}>
        <div className={`flex items-center justify-between px-4 ${headerHeight} bg-zinc-900 border-b border-zinc-800 shrink-0`}>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CSS</span>
          <button onClick={() => toggleEditor('css')} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
            {minimizedEditors.css ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
        {!minimizedEditors.css && (
          <div className="flex-1 overflow-auto p-4 font-mono">
            <Editor
              value={css}
              onValueChange={setCss}
              highlight={code => highlight(code, languages.css, 'css')}
              padding={10}
              className="min-h-full outline-none"
            />
          </div>
        )}
      </div>

      <div className={`flex flex-col transition-all duration-300 ${minimizedEditors.js ? 'h-12' : 'flex-1 min-h-0'}`}>
        <div className={`flex items-center justify-between px-4 ${headerHeight} bg-zinc-900 border-b border-zinc-800 shrink-0`}>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Javascript</span>
          <button onClick={() => toggleEditor('js')} className="p-1 hover:bg-zinc-800 rounded text-zinc-500">
            {minimizedEditors.js ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
        {!minimizedEditors.js && (
          <div className="flex-1 overflow-auto p-4 font-mono">
            <Editor
              value={js}
              onValueChange={setJs}
              highlight={code => highlight(code, languages.javascript, 'javascript')}
              padding={10}
              className="min-h-full outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );

  const livePreviewColumn = (
    <div className="h-full flex flex-col bg-white">
      <div className={`flex items-center justify-between px-4 ${headerHeight} bg-zinc-900 border-b border-zinc-800 shrink-0`}>
        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-[pulse_0.7s_ease-in-out_infinite]" />
          {ui.liveResult}
        </span>
      </div>
      <div className="flex-1">
        <iframe
          title="user-preview"
          srcDoc={srcDoc}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );

  const targetPreviewColumn = (
    <div className="h-full flex flex-col bg-white">
      <div className={`flex items-center justify-between px-4 ${headerHeight} bg-zinc-900 border-b border-zinc-800 shrink-0`}>
        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          {ui.target}
        </span>
      </div>
      <div className="flex-1">
        <iframe
          title="target-preview"
          srcDoc={targetDoc}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">{exercise?.title || ui.newLesson}</h1>
            <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">{ui.assistant}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          {isBelow800 ? (
            <div className="relative">
              <button
                onClick={() => setIsModeMenuOpen((prev) => !prev)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors"
                aria-label="Mode menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              {isModeMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl z-30">
                  <button
                    onClick={() => {
                      if (!isRealTime) {
                        handleVerify(false);
                      } else {
                        setIsRealTime(false);
                      }
                      setIsModeMenuOpen(false);
                    }}
                    disabled={!isRealTime && checking}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${!isRealTime ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
                  >
                    {!isRealTime && (checking ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <CheckCircle className="w-3.5 h-3.5 text-blue-400" />)}
                    {ui.askTeacher}
                  </button>
                  <button
                    onClick={() => {
                      setIsRealTime(true);
                      setIsModeMenuOpen(false);
                    }}
                    className={`mt-1 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${isRealTime ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
                  >
                    {ui.realtime}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex bg-zinc-800 rounded-full p-1">
              <button 
                onClick={() => {
                  if (!isRealTime) {
                    handleVerify(false);
                  } else {
                    setIsRealTime(false);
                  }
                }}
                disabled={!isRealTime && checking}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${!isRealTime ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}` }
              >
                {!isRealTime && (checking ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <CheckCircle className="w-3.5 h-3.5 text-blue-400" />)}
                {ui.askTeacher}
              </button>
              <button 
                onClick={() => setIsRealTime(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isRealTime ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {ui.realtime}
              </button>
            </div>
          )}
          <button 
            onClick={onAdmin}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-full transition-colors"
            title={ui.adminPanel}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {!isBelow1200 ? (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={33} minSize={20}>{editorsColumn}</Panel>
            <PanelResizeHandle className="w-1.5 bg-zinc-900 hover:bg-blue-600 transition-colors border-x border-zinc-800 cursor-col-resize" />
            <Panel defaultSize={33} minSize={20}>{livePreviewColumn}</Panel>
            <PanelResizeHandle className="w-1.5 bg-zinc-900 hover:bg-blue-600 transition-colors border-x border-zinc-800 cursor-col-resize" />
            <Panel defaultSize={34} minSize={20}>{targetPreviewColumn}</Panel>
          </PanelGroup>
        ) : isBelow800 ? (
          <div className="w-full h-full">{editorsColumn}</div>
        ) : (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={56} minSize={28}>{editorsColumn}</Panel>
            <PanelResizeHandle className="w-1.5 bg-zinc-900 hover:bg-blue-600 transition-colors border-x border-zinc-800 cursor-col-resize" />
            <Panel defaultSize={44} minSize={26}>{livePreviewColumn}</Panel>
          </PanelGroup>
        )}
      </main>

      {isBelow1200 && !isLiveDrawerOpen && (
        <>
          <button
            type="button"
            onClick={() => {
              setIsObjectiveDrawerOpen((prev) => !prev);
              if (isBelow800) setIsLiveDrawerOpen(false);
            }}
            className="fixed top-[42%] -translate-y-1/2 z-30 bg-blue-600 text-zinc-100 border border-zinc-700 border-r-0 rounded-l-xl px-2 py-4 shadow-xl transition-[right] duration-300"
            style={{ right: isObjectiveDrawerOpen ? 'min(92vw, 560px)' : '0px' }}
          >
            <span className="block text-[10px] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">{ui.target}</span>
          </button>
          <div className={`fixed top-14 right-0 bottom-0 w-[min(92vw,560px)] bg-white border-l border-zinc-300 shadow-2xl z-30 transition-transform duration-300 ${isObjectiveDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {targetPreviewColumn}
          </div>
        </>
      )}

      {isBelow800 && !isObjectiveDrawerOpen && (
        <>
          <button
            type="button"
            onClick={() => {
              setIsLiveDrawerOpen((prev) => !prev);
              setIsObjectiveDrawerOpen(false);
            }}
            className="fixed top-[58%] -translate-y-1/2 z-30 bg-blue-600 text-zinc-100 border border-zinc-700 border-r-0 rounded-l-xl px-2 py-4 shadow-xl transition-[right] duration-300"
            style={{ right: isLiveDrawerOpen ? 'min(92vw, 560px)' : '0px' }}
          >
            <span className="block text-[10px] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">{ui.liveResult}</span>
          </button>
          <div className={`fixed top-14 right-0 bottom-0 w-[min(92vw,560px)] bg-white border-l border-zinc-300 shadow-2xl z-30 transition-transform duration-300 ${isLiveDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {livePreviewColumn}
          </div>
        </>
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`relative w-14 h-14 ${isChatOpen ? 'bg-[#b9e8bf]' : 'bg-[#9ad89f] hover:bg-[#a7dfa9]'} text-zinc-900 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110`}
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (isChatting || checking) ? (
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-900 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </span>
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-4 right-4 top-16 bottom-24 md:left-auto md:right-6 md:top-auto md:bottom-24 md:w-[420px] md:h-[70vh] bg-[#f4e2b9] border border-[#e7c980] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-40"
          >
            <div className="bg-[#c5e8c9] px-4 py-3 flex items-center justify-between shadow-lg border-b border-[#add8b2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#9ad89f] flex items-center justify-center border border-[#84c58e]">
                  <User className="w-6 h-6 text-emerald-950" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-emerald-950">{ui.aiTeacher}</p>
                  <p className="text-[12px] text-emerald-800/80">{ui.online}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-black/10 rounded-full text-emerald-900/80">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2 bg-[#f1dca4] relative">
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
              <div className="relative z-10 flex flex-col space-y-2">
                <div className="flex justify-center mb-4">
                  <span className="bg-[#f9efcf] text-[11px] text-[#7a6640] px-3 py-1 rounded-lg uppercase font-medium border border-[#e8d19b]">{ui.today}</span>
                </div>

                <div className="flex justify-start">
                  <div className="bg-[#fff7e4] rounded-lg rounded-tl-none p-2.5 max-w-[85%] min-w-0 overflow-hidden relative shadow-sm border border-[#ead4a2]">
                    <div className="text-[14.2px] text-[#3b3426] leading-relaxed markdown-body">
                      <ReactMarkdown
                        components={{
                          h3: ({node, ...props}) => <strong {...props} className="block mb-1" />,
                          pre: ({node, ...props}) => <pre {...props} className="my-2 max-w-full overflow-x-auto rounded-md bg-[#f3e2bb] p-2 border border-[#e2c98d]" />,
                          code: ({node, className, ...props}) => {
                            const isInline = !String(className || "").includes("language-");
                            if (isInline) {
                              return <code {...props} className="bg-[#f3e2bb] px-1 rounded text-[#0b8f50] font-mono break-words" />;
                            }
                            return <code {...props} className="text-[#0b8f50] font-mono" />;
                          }
                        }}
                      >
                        {ui.welcome}
                      </ReactMarkdown>
                    </div>
                    <p className="text-[11px] text-[#8b7b60] text-right mt-1">{sessionStartTime}</p>
                  </div>
                </div>

                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.role === 'user' ? 'bg-[#d9fdd3] rounded-tr-none border-[#bfeab3]' : 'bg-[#fff7e4] rounded-tl-none border-[#ead4a2]'} rounded-lg p-2.5 max-w-[85%] min-w-0 overflow-hidden relative shadow-sm border`}>
                      <div className="text-[14.2px] text-[#3b3426] leading-relaxed whitespace-pre-wrap markdown-body">
                        {msg.role === 'model' ? (
                          (() => {
                            const { shortText, detailsText } = parseShortAndDetails(msg.text);
                            const isExpanded = Boolean(expandedDetails[msg.id]);
                            return (
                              <>
                                <ReactMarkdown
                                  components={{
                                    h3: ({node, ...props}) => <strong {...props} className="block mb-1" />,
                                    pre: ({node, ...props}) => <pre {...props} className="my-2 max-w-full overflow-x-auto rounded-md bg-[#f3e2bb] p-2 border border-[#e2c98d]" />,
                                    code: ({node, className, ...props}) => {
                                      const isInline = !String(className || "").includes("language-");
                                      if (isInline) {
                                        return <code {...props} className="bg-[#f3e2bb] px-1 rounded text-[#0b8f50] font-mono break-words" />;
                                      }
                                      return <code {...props} className="text-[#0b8f50] font-mono" />;
                                    }
                                  }}
                                >
                                  {isExpanded && detailsText ? `${shortText}\n\n${detailsText}` : shortText}
                                </ReactMarkdown>
                                {detailsText && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedDetails((prev) => ({ ...prev, [msg.id]: !isExpanded }))}
                                    className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-600"
                                  >
                                    {isExpanded ? ui.seeLess : ui.seeMore}
                                  </button>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          <ReactMarkdown
                            components={{
                              h3: ({node, ...props}) => <strong {...props} className="block mb-1" />,
                              pre: ({node, ...props}) => <pre {...props} className="my-2 max-w-full overflow-x-auto rounded-md bg-[#f3e2bb] p-2 border border-[#e2c98d]" />,
                              code: ({node, className, ...props}) => {
                                const isInline = !String(className || "").includes("language-");
                                if (isInline) {
                                  return <code {...props} className="bg-[#f3e2bb] px-1 rounded text-[#0b8f50] font-mono break-words" />;
                                }
                                return <code {...props} className="text-[#0b8f50] font-mono" />;
                              }
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8b7b60] text-right mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="p-1 max-w-[85%]">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#6f8458] rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-[#6f8458] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-[#6f8458] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            <form onSubmit={handleChatSubmit} className="bg-[#edd59e] p-2.5 flex items-center gap-2 border-t border-[#d9be7e]">
              <div className="flex-1 bg-[#fff4d7] rounded-lg px-4 py-2 flex items-center border border-[#e3cb92]">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={ui.messagePlaceholder}
                  className="w-full bg-transparent border-none text-[15px] text-[#3b3426] focus:outline-none placeholder:text-[#8b7b60]"
                />
              </div>
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatting}
                className="w-11 h-11 bg-[#9ad89f] hover:bg-[#a7dfa9] disabled:opacity-50 text-emerald-950 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-md"
              >
                <Send className="w-5 h-5 fill-current" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminView = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [defaultLessonId, setDefaultLessonId] = useState('');
  const [selectedAiLanguage, setSelectedAiLanguage] = useState<AiLanguage>('ro');
  const [aiLanguageOptions, setAiLanguageOptions] = useState<{ code: AiLanguage; label: string }[]>([]);
  const [lessons, setLessons] = useState<{ id: string; name: string; title: string; description: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const ui = UI_TEXT[selectedAiLanguage] ?? UI_TEXT.ro;

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: SettingsResponse) => {
        setSelectedLessonId(data.selectedLessonId);
        setDefaultLessonId(data.defaultLessonId);
        setSelectedAiLanguage(data.selectedAiLanguage || 'ro');
        setAiLanguageOptions(data.aiLanguageOptions || []);
        setLessons(data.lessons);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedLessonId, selectedAiLanguage })
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Settings className="w-6 h-6 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{ui.adminPanel}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            aria-label={ui.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{ui.savedLessons}</label>
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const localized = LESSON_LABELS[selectedAiLanguage]?.[lesson.id];
                return (
                <label
                  key={lesson.id}
                  className={`block w-full border rounded-xl p-3 cursor-pointer transition-colors ${
                    selectedLessonId === lesson.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{localized?.name || lesson.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{localized?.description || lesson.description}</p>
                    </div>
                    {lesson.id === defaultLessonId && (
                      <span className="text-[10px] uppercase tracking-wider bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">{ui.defaultBadge}</span>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="lesson"
                    value={lesson.id}
                    checked={selectedLessonId === lesson.id}
                    onChange={() => setSelectedLessonId(lesson.id)}
                    className="sr-only"
                  />
                </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{ui.aiLanguage}</label>
            <select
              value={selectedAiLanguage}
              onChange={(e) => setSelectedAiLanguage(e.target.value as AiLanguage)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {aiLanguageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors"
            >
              {ui.cancel}
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || !selectedLessonId}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {ui.launchLesson}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const handleSaved = () => {
    setIsAdminOpen(false);
    setReloadToken((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <StudentView onAdmin={() => setIsAdminOpen(true)} reloadToken={reloadToken} />
      {isAdminOpen && (
        <AdminView onClose={() => setIsAdminOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
