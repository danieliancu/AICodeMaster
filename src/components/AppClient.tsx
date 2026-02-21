'use client';

import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import { CheckCircle, MessageSquare, Settings, User, Loader2, Send, X, Minimize2, Maximize2, Menu, CircleHelp, Mouse, Rocket, Activity, UserRound, LogIn, UserPlus, Lock, ArrowUpDown, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import { Exercise, getTeacherFeedback, getChatResponse } from '../services/geminiService';
import { isAiLanguage, type AiLanguage } from '@/src/lib/languages';
import type { LessonProgress, Technology } from '@/src/lib/types';

type SettingsResponse = {
  defaultLessonId: string;
  selectedLessonId: string;
  selectedAiLanguage: AiLanguage;
  preferredEditorTheme?: 'light' | 'dark';
  preferredXrayEnabled?: boolean;
  aiLanguageOptions: { code: AiLanguage; label: string }[];
  lessons: {
    id: string;
    name: string;
    title: string;
    description: string;
    progress: LessonProgress;
    technologies: Technology[];
  }[];
  exercise_json: string | null;
};

type GuideStepId = 'editors' | 'live' | 'target' | 'xray' | 'teacher' | 'modes';
type GuideLanguageContent = {
  howItWorks: string;
  previous: string;
  next: string;
  finish: string;
  steps: { id: GuideStepId; title: string; description: string }[];
};

const AUTH_TOKEN_STORAGE_KEY = 'aicodemaster_auth_token';
const GUEST_AI_LANGUAGE_STORAGE_KEY = 'aicodemaster_guest_ai_language';
const GUEST_LESSON_STORAGE_KEY = 'aicodemaster_guest_lesson_id';
const GUEST_EDITOR_THEME_STORAGE_KEY = 'aicodemaster_guest_editor_theme';
const WORKSPACE_FLOW_SEEN_STORAGE_KEY = 'aicodemaster_workspace_flow_seen';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

const clearGuestSessionSettings = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(GUEST_LESSON_STORAGE_KEY);
};

const setGuestLanguage = (language: AiLanguage) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_AI_LANGUAGE_STORAGE_KEY, language);
};

const getGuestLanguage = (): AiLanguage | null => {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(GUEST_AI_LANGUAGE_STORAGE_KEY);
  return isAiLanguage(value) ? value : null;
};

const setGuestLessonId = (lessonId: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(GUEST_LESSON_STORAGE_KEY, lessonId);
};

const getGuestLessonId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const value = window.sessionStorage.getItem(GUEST_LESSON_STORAGE_KEY);
  return value?.trim() || null;
};

const setGuestEditorTheme = (theme: 'light' | 'dark') => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_EDITOR_THEME_STORAGE_KEY, theme);
};

const getGuestEditorTheme = (): 'light' | 'dark' | null => {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(GUEST_EDITOR_THEME_STORAGE_KEY);
  return value === 'dark' || value === 'light' ? value : null;
};

type XrayCategory = 'container' | 'text' | 'media' | 'interactive';
type XrayCssGroups = {
  layout: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, string>;
  visual: Record<string, string>;
};
type XrayNodeInfo = {
  tag: string;
  classSummary: string;
  selectorPath: string;
  category: XrayCategory;
  pointerX?: number;
  pointerY?: number;
  keyCss: Record<string, string>;
  boxModel: Record<string, string>;
  fullCss: XrayCssGroups;
};


type UiText = {
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
  close: string;
  statusNotStarted: string;
  statusInProgress: string;
  statusCompleted: string;
  userAccount: string;
  adminGuestNoticeTitle: string;
  adminGuestNoticeDescription: string;
  authLogin: string;
  authRegister: string;
  authFullName: string;
  authEmail: string;
  authPassword: string;
  authConfirmPassword: string;
  authPasswordsNoMatch: string;
  authInvalidCredentials: string;
  authMissingFields: string;
  authEmailExists: string;
  authUnauthorized: string;
  authUnexpectedError: string;
  authPendingMessage: string;
  authCreateAccount: string;
  authSaveProfile: string;
  authLogout: string;
  authDeleteAccount: string;
  authDeleteConfirm: string;
  authProfileSaved: string;
  adminUserPassword: string;
  techHtml: string;
  techCss: string;
  techJavascript: string;
  techPython: string;
  techPhp: string;
  techSql: string;
  workspaceFlowTitle: string;
  workspaceFlowDescription: string;
  panelEditorsTitle: string;
  panelLiveTitle: string;
  panelTargetTitle: string;
  panelEditorsHint: string;
  panelLiveHint: string;
  panelTargetHint: string;
  startGuideCta: string;
  dismissGuideCta: string;
  xrayModeLabel: string;
  xrayModeOn: string;
  xrayModeOff: string;
  xrayDrawerTitle: string;
  xrayEmptyState: string;
  xrayDesktopOnlyHint: string;
  xrayHelpHint: string;
  xrayHelpIconLabel: string;
  xrayHelpBoxModel: string;
  xrayHelpLayout: string;
  xrayHelpSpacing: string;
  xrayHelpTypography: string;
  xrayHelpVisual: string;
};

const EMPTY_UI_TEXT: UiText = {
  newLesson: '',
  assistant: '',
  askTeacher: '',
  realtime: '',
  adminPanel: '',
  liveResult: '',
  target: '',
  aiTeacher: '',
  online: '',
  today: '',
  welcome: '',
  messagePlaceholder: '',
  seeMore: '',
  seeLess: '',
  preparingLesson: '',
  savedLessons: '',
  aiLanguage: '',
  cancel: '',
  launchLesson: '',
  close: '',
  statusNotStarted: '',
  statusInProgress: '',
  statusCompleted: '',
  userAccount: '',
  adminGuestNoticeTitle: '',
  adminGuestNoticeDescription: '',
  authLogin: '',
  authRegister: '',
  authFullName: '',
  authEmail: '',
  authPassword: '',
  authConfirmPassword: '',
  authPasswordsNoMatch: '',
  authInvalidCredentials: '',
  authMissingFields: '',
  authEmailExists: '',
  authUnauthorized: '',
  authUnexpectedError: '',
  authPendingMessage: '',
  authCreateAccount: '',
  authSaveProfile: '',
  authLogout: '',
  authDeleteAccount: '',
  authDeleteConfirm: '',
  authProfileSaved: '',
  adminUserPassword: '',
  techHtml: '',
  techCss: '',
  techJavascript: '',
  techPython: '',
  techPhp: '',
  techSql: '',
  workspaceFlowTitle: '',
  workspaceFlowDescription: '',
  panelEditorsTitle: '',
  panelLiveTitle: '',
  panelTargetTitle: '',
  panelEditorsHint: '',
  panelLiveHint: '',
  panelTargetHint: '',
  startGuideCta: '',
  dismissGuideCta: '',
  xrayModeLabel: '',
  xrayModeOn: '',
  xrayModeOff: '',
  xrayDrawerTitle: '',
  xrayEmptyState: '',
  xrayDesktopOnlyHint: '',
  xrayHelpHint: '',
  xrayHelpIconLabel: '',
  xrayHelpBoxModel: '',
  xrayHelpLayout: '',
  xrayHelpSpacing: '',
  xrayHelpTypography: '',
  xrayHelpVisual: '',
};

const DEFAULT_DB_GUIDE: GuideLanguageContent = {
  howItWorks: '',
  previous: '',
  next: '',
  finish: '',
  steps: [],
};

const mergeUiText = (overrides: Record<string, string>): UiText => {
  return { ...EMPTY_UI_TEXT, ...overrides };
};

const PROGRESS_STEPS: LessonProgress[] = ['not_started', 'in_progress', 'completed'];

const getTechnologyLabel = (technology: Technology, ui: UiText): string => {
  switch (technology) {
    case 'html':
      return ui.techHtml;
    case 'css':
      return ui.techCss;
    case 'javascript':
      return ui.techJavascript;
    case 'python':
      return ui.techPython;
    case 'php':
      return ui.techPhp;
    case 'sql':
      return ui.techSql;
    default:
      return technology;
  }
};

const parseJsonOverride = <T,>(value: string | undefined): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const StudentView = ({ onAdmin, onAuth, isAuthenticated, reloadToken }: { onAdmin: () => void; onAuth: () => void; isAuthenticated: boolean; reloadToken: number }) => {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState('');
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [isEditorsLightMode, setIsEditorsLightMode] = useState(true);
  const [isXrayEnabled, setIsXrayEnabled] = useState(false);
  const [hoverXrayNode, setHoverXrayNode] = useState<XrayNodeInfo | null>(null);
  const [selectedXrayNode, setSelectedXrayNode] = useState<XrayNodeInfo | null>(null);
  const [isXrayDrawerOpen, setIsXrayDrawerOpen] = useState(false);
  const [xrayHelpPopover, setXrayHelpPopover] = useState<{
    key: 'boxModel' | 'layout' | 'spacing' | 'typography' | 'visual';
    left: number;
    top: number;
  } | null>(null);
  const [uiOverrides, setUiOverrides] = useState<Record<string, string>>({});
  const [sessionStartTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );
  const ui = mergeUiText(uiOverrides);
  const dbGuide = parseJsonOverride<GuideLanguageContent>(uiOverrides.guide_json);
  const guide = dbGuide ?? DEFAULT_DB_GUIDE;
  const guideSteps = guide.steps;
  const isBelow1200 = viewportWidth < 1200;
  const isBelow800 = viewportWidth < 800;
  
  const lastRealtimeSnapshotRef = useRef<string | null>(null);
  const seenModelMessagesRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatWasOpenBeforeGuideRef = useRef(false);
  const lastSyncedEditorThemeRef = useRef<'light' | 'dark' | null>(null);
  const lastSyncedXrayRef = useRef<boolean | null>(null);
  const targetFrameRef = useRef<HTMLIFrameElement | null>(null);

  const activeGuideStep = guideSteps[guideStepIndex];
  const isGuideOverlayActive = isGuideOpen && !isBelow1200;
  const activeTechnologies = exercise?.technologies ?? [];
  const hasJavaScript = activeTechnologies.includes('javascript');
  const xrayHelpTextByKey: Record<'boxModel' | 'layout' | 'spacing' | 'typography' | 'visual', string> = {
    boxModel: ui.xrayHelpBoxModel || 'Box model: shows the element final size (content) plus padding, border, and margin.',
    layout: ui.xrayHelpLayout || 'Layout: rules that control placement in the page (display, position, width/height, flex/grid, align, gap).',
    spacing: ui.xrayHelpSpacing || 'Spacing: inner and outer distances (padding, margin), plus border and box-sizing.',
    typography: ui.xrayHelpTypography || 'Typography: text rules (font-family, font-size, font-weight, line-height, letter-spacing, text-align, color).',
    visual: ui.xrayHelpVisual || 'Visual: visual appearance (background, box-shadow, opacity, overflow, z-index).',
  };
  const toggleXrayHelpPopover = (
    event: React.MouseEvent<HTMLButtonElement>,
    key: 'boxModel' | 'layout' | 'spacing' | 'typography' | 'visual',
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setXrayHelpPopover((prev) => {
      if (prev?.key === key) return null;
      const popoverWidth = 360;
      const estimatedHeight = 170;
      const margin = 12;
      const left = Math.min(Math.max(margin, rect.left), Math.max(margin, window.innerWidth - popoverWidth - margin));
      let top = rect.bottom + 8;
      if (top + estimatedHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - estimatedHeight - 8);
      }
      return { key, left, top };
    });
  };

  const resetLessonWorkspace = (technologies?: Technology[], textOverrides?: Record<string, string>) => {
    const sourceOverrides = textOverrides ?? uiOverrides;
    const dbStarter = parseJsonOverride<{ html: string; css: string; js: string }>(sourceOverrides.starter_json);
    const starter = dbStarter ?? { html: '', css: '', js: '' };
    const lessonTechnologies = technologies ?? activeTechnologies;
    setHtml(starter.html);
    setCss(starter.css);
    setJs(lessonTechnologies.includes('javascript') ? starter.js : '');
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
    const token = getAuthToken();
    fetch(`/api/i18n?language=${encodeURIComponent(aiLanguage)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.json())
      .then((data: { texts?: Record<string, string> }) => {
        setUiOverrides(data.texts || {});
      })
      .catch(() => {});
  }, [aiLanguage]);

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
    if (!isGuideOpen || !activeGuideStep) return;
    if (activeGuideStep.id === 'teacher') {
      setIsChatOpen(true);
      return;
    }
    if (!chatWasOpenBeforeGuideRef.current) {
      setIsChatOpen(false);
    }
  }, [activeGuideStep, isGuideOpen]);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
    }
  }, [chatMessages, isChatOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const guestLanguage = !token ? getGuestLanguage() : null;
      const guestLessonId = !token ? getGuestLessonId() : null;
      const params = new URLSearchParams();
      if (guestLanguage) params.set('language', guestLanguage);
      if (guestLessonId) params.set('lessonId', guestLessonId);
      const url = params.size ? `/api/settings?${params.toString()}` : '/api/settings';
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = (await res.json()) as SettingsResponse;
      const effectiveLanguage = token ? (data.selectedAiLanguage || 'ro') : (guestLanguage || data.selectedAiLanguage || 'ro');
      const resolvedLessonId = data.selectedLessonId || data.defaultLessonId;
      setSelectedLessonId(resolvedLessonId);
      const nextExercise = data.exercise_json ? (JSON.parse(data.exercise_json) as Exercise) : null;
      setExercise(nextExercise);
      setAiLanguage(effectiveLanguage);
      const nextEditorTheme = token
        ? (data.preferredEditorTheme === 'dark' ? 'dark' : 'light')
        : (getGuestEditorTheme() ?? 'light');
      const nextXrayEnabled = token
        ? Boolean(data.preferredXrayEnabled)
        : false;
      lastSyncedEditorThemeRef.current = null;
      lastSyncedXrayRef.current = null;
      setIsEditorsLightMode(nextEditorTheme === 'light');
      setIsXrayEnabled(nextXrayEnabled);
      setHoverXrayNode(null);
      setSelectedXrayNode(null);
      setIsXrayDrawerOpen(false);

      let nextOverrides: Record<string, string> = uiOverrides;
      try {
        const i18nRes = await fetch(`/api/i18n?language=${encodeURIComponent(effectiveLanguage)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (i18nRes.ok) {
          const i18nData = (await i18nRes.json()) as { texts?: Record<string, string> };
          nextOverrides = i18nData.texts || {};
          setUiOverrides(nextOverrides);
        }
      } catch {
        // Keep current UI overrides if i18n fetch fails.
      }

      resetLessonWorkspace(nextExercise?.technologies, nextOverrides);

      if (token && resolvedLessonId) {
        const wsRes = await fetch(`/api/workspace?lessonId=${encodeURIComponent(resolvedLessonId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (wsRes.ok) {
          const workspace = await wsRes.json() as {
            codeByTech?: Partial<Record<Technology, string>>;
            aiMessages?: { id: string; role: 'user' | 'model' | 'system'; text: string; time: string }[];
          };
          if (workspace.codeByTech?.html !== undefined) setHtml(workspace.codeByTech.html);
          if (workspace.codeByTech?.css !== undefined) setCss(workspace.codeByTech.css);
          if (workspace.codeByTech?.javascript !== undefined) setJs(workspace.codeByTech.javascript);
          if (Array.isArray(workspace.aiMessages)) {
            const restored = workspace.aiMessages
              .filter((msg) => msg.role === 'user' || msg.role === 'model')
              .map((msg) => ({ id: msg.id, role: msg.role as 'user' | 'model', text: msg.text, time: msg.time }));
            setChatMessages(restored);
          }
        }
      }
      setWorkspaceLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeAiMessage = (text: string) => {
    let formatted = text.replace(/\r/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    formatted = formatted.replace(/([^\n*])(\d+\.\s)/g, '$1\n$2');
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
    const snapshot = hasJavaScript ? `${html}\n/*__CSS__*/\n${css}\n/*__JS__*/\n${js}` : `${html}\n/*__CSS__*/\n${css}`;
    if (realTime && lastRealtimeSnapshotRef.current === snapshot) return;

    setChecking(true);
    try {
      const userCode = hasJavaScript ? { html, css, js } : { html, css };
      const result = await getTeacherFeedback(exercise, userCode, realTime, aiLanguage, selectedLessonId);
      appendModelMessageIfUnique(result.feedback);
      if (result.isCorrect && selectedLessonId) {
        const token = getAuthToken();
        await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            lessonProgress: {
              [selectedLessonId]: 'completed',
            },
          }),
        });
      }
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
      const userCode = hasJavaScript ? { html, css, js } : { html, css };
      const response = await getChatResponse(
        exercise,
        userCode,
        userMsg,
        chatMessages.map((m) => ({ role: m.role, text: m.text })),
        aiLanguage,
        selectedLessonId,
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

  const startGuide = () => {
    chatWasOpenBeforeGuideRef.current = isChatOpen;
    setGuideStepIndex(0);
    setIsGuideOpen(true);
  };

  const finishGuide = () => {
    setIsGuideOpen(false);
    setGuideStepIndex(0);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WORKSPACE_FLOW_SEEN_STORAGE_KEY, 'true');
    }
    if (!chatWasOpenBeforeGuideRef.current) {
      setIsChatOpen(false);
    }
  };

  const goToGuideStep = (index: number) => {
    if (index < 0 || index >= guideSteps.length) return;
    setGuideStepIndex(index);
  };

  const getGuidePanelClass = (panelId: GuideStepId) => {
    const focusedPanelId: GuideStepId | undefined = activeGuideStep?.id === 'xray' ? 'target' : activeGuideStep?.id;
    if (!isGuideOverlayActive) {
      return 'opacity-100';
    }
    if (focusedPanelId === panelId) {
      if (panelId === 'teacher') {
        return 'opacity-100 z-[55]';
      }
      return 'opacity-100 relative z-[55]';
    }
    return 'opacity-100 pointer-events-none select-none';
  };

  const splitGuideDescription = (text: string) => {
    const normalized = text.trim();
    if (!normalized) return { lead: '', rest: '' };
    const sentenceMatch = normalized.match(/^(.+?[.!?])\s+([\s\S]+)$/);
    if (sentenceMatch) {
      return { lead: sentenceMatch[1].trim(), rest: sentenceMatch[2].trim() };
    }
    return { lead: normalized, rest: '' };
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

  useEffect(() => {
    if (!workspaceLoaded || !selectedLessonId) return;
    const token = getAuthToken();
    if (!token) return;
    const timer = setTimeout(() => {
      const codeByTech: Partial<Record<Technology, string>> = {
        html,
        css,
        ...(hasJavaScript ? { javascript: js } : {}),
      };
      void fetch('/api/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          codeByTech,
          renderedOutput: srcDoc,
          eventType: 'workspace_autosave',
          payloadJson: { hasJavaScript },
        }),
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [workspaceLoaded, selectedLessonId, html, css, js, hasJavaScript]);

  useEffect(() => {
    if (!workspaceLoaded || isGuideOpen || !guideSteps.length) return;
    if (typeof window === 'undefined') return;
    const flowSeen = window.localStorage.getItem(WORKSPACE_FLOW_SEEN_STORAGE_KEY) === 'true';
    if (flowSeen) return;
    chatWasOpenBeforeGuideRef.current = isChatOpen;
    setGuideStepIndex(0);
    setIsGuideOpen(true);
  }, [workspaceLoaded, guideSteps.length, isGuideOpen, isChatOpen]);

  useEffect(() => {
    if (!workspaceLoaded) return;
    const token = getAuthToken();

    const currentTheme: 'light' | 'dark' = isEditorsLightMode ? 'light' : 'dark';
    if (!token) {
      setGuestEditorTheme(currentTheme);
      return;
    }
    if (lastSyncedEditorThemeRef.current === null) {
      lastSyncedEditorThemeRef.current = currentTheme;
      return;
    }
    if (lastSyncedEditorThemeRef.current === currentTheme) return;

    lastSyncedEditorThemeRef.current = currentTheme;
    void fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ preferredEditorTheme: currentTheme }),
    }).catch(() => {});
  }, [workspaceLoaded, isEditorsLightMode]);

  useEffect(() => {
    if (!workspaceLoaded) return;
    const token = getAuthToken();
    if (!token) return;
    if (lastSyncedXrayRef.current === null) {
      lastSyncedXrayRef.current = isXrayEnabled;
      return;
    }
    if (lastSyncedXrayRef.current === isXrayEnabled) return;

    lastSyncedXrayRef.current = isXrayEnabled;
    void fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ preferredXrayEnabled: isXrayEnabled }),
    }).catch(() => {});
  }, [workspaceLoaded, isXrayEnabled]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!targetFrameRef.current || event.source !== targetFrameRef.current.contentWindow) return;
      if (!event.data || typeof event.data !== 'object') return;
      const message = event.data as { type?: string; payload?: XrayNodeInfo };
      if (message.type === 'aicodemaster_xray_hover' && message.payload) {
        setHoverXrayNode(message.payload);
      }
      if (message.type === 'aicodemaster_xray_select' && message.payload) {
        setSelectedXrayNode(message.payload);
        setIsXrayDrawerOpen(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (isBelow1200) {
      setHoverXrayNode(null);
      setSelectedXrayNode(null);
      setIsXrayDrawerOpen(false);
    }
  }, [isBelow1200]);

  useEffect(() => {
    if (!isXrayEnabled) {
      setHoverXrayNode(null);
      setSelectedXrayNode(null);
      setIsXrayDrawerOpen(false);
      setXrayHelpPopover(null);
    }
  }, [isXrayEnabled]);

  useEffect(() => {
    if (!isXrayDrawerOpen) {
      setXrayHelpPopover(null);
    }
  }, [isXrayDrawerOpen]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsXrayDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isXrayAvailable = !isBelow1200;
  const shouldInjectXray = isXrayEnabled && isXrayAvailable;
  const anchorGuardScript = `
    (function () {
      function isAnchorTarget(node) {
        return node instanceof Element ? node.closest('a[href]') : null;
      }

      function preventAnchorNavigation(event) {
        const anchor = isAnchorTarget(event.target);
        if (!anchor) return;
        event.preventDefault();
        event.stopPropagation();
      }

      document.addEventListener('click', preventAnchorNavigation, true);
      document.addEventListener('auxclick', preventAnchorNavigation, true);
      document.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const anchor = isAnchorTarget(event.target);
        if (!anchor) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);
    })();
  `;
  const xrayScript = `
    (function () {
      const XRAY_COLORS = {
        container: '#38bdf8',
        text: '#f59e0b',
        media: '#22c55e',
        interactive: '#ef4444'
      };
      const STYLE_ID = 'aicm-xray-style';
      const SELECTED_ATTR = 'data-aicm-xray-selected';

      function shouldIgnore(el) {
        const tag = el.tagName.toLowerCase();
        return ['html', 'head', 'body', 'script', 'style', 'meta', 'link'].includes(tag);
      }

      function getCategory(el) {
        const tag = el.tagName.toLowerCase();
        if (['button', 'input', 'select', 'textarea', 'label', 'summary', 'details'].includes(tag) || el.hasAttribute('onclick') || el.getAttribute('role') === 'button') return 'interactive';
        if (['img', 'svg', 'video', 'canvas', 'picture', 'figure', 'iframe'].includes(tag)) return 'media';
        if (['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'li', 'small', 'strong', 'em', 'label'].includes(tag)) return 'text';
        return 'container';
      }

      function formatPath(el) {
        const chunks = [];
        let node = el;
        let depth = 0;
        while (node && depth < 6 && node.tagName) {
          const tag = node.tagName.toLowerCase();
          const cls = node.className && typeof node.className === 'string'
            ? '.' + node.className.trim().split(/\\s+/).filter(Boolean).slice(0, 1).join('.')
            : '';
          chunks.unshift(tag + cls);
          node = node.parentElement;
          depth += 1;
        }
        return chunks.join(' > ');
      }

      function pickMap(style, props) {
        const out = {};
        props.forEach((prop) => { out[prop] = style.getPropertyValue(prop) || ''; });
        return out;
      }

      function px(value) {
        const n = parseFloat(value || '0');
        return Number.isFinite(n) ? n.toFixed(1) + 'px' : '0px';
      }

      function serializeElement(el, point) {
        const style = getComputedStyle(el);
        const classSummary = el.className && typeof el.className === 'string'
          ? el.className.trim().split(/\\s+/).filter(Boolean).slice(0, 3).map((c) => '.' + c).join(' ')
          : '';
        const keyCss = pickMap(style, ['display', 'position', 'width', 'height', 'gap', 'justify-content', 'align-items']);
        const boxModel = {
          width: px(style.width),
          height: px(style.height),
          margin: [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft].map(px).join(' '),
          padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(px).join(' '),
          border: style.border || '',
        };
        const fullCss = {
          layout: pickMap(style, ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'flex-direction', 'justify-content', 'align-items', 'gap', 'grid-template-columns', 'grid-template-rows']),
          spacing: pickMap(style, ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border', 'border-radius', 'box-sizing']),
          typography: pickMap(style, ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'color']),
          visual: pickMap(style, ['background', 'background-color', 'box-shadow', 'opacity', 'overflow', 'z-index']),
        };
        return {
          tag: el.tagName.toLowerCase(),
          classSummary,
          selectorPath: formatPath(el),
          category: getCategory(el),
          pointerX: point && typeof point.x === 'number' ? point.x : undefined,
          pointerY: point && typeof point.y === 'number' ? point.y : undefined,
          keyCss,
          boxModel,
          fullCss
        };
      }

      function applyStyles() {
        const prev = document.getElementById(STYLE_ID);
        if (prev) prev.remove();
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = \`
          body[data-aicm-xray="on"] *[data-aicm-xray-kind] { outline-offset: -2px; }
          body[data-aicm-xray="on"] *[data-aicm-xray-kind="container"] { outline: 2px dashed \${XRAY_COLORS.container}; }
          body[data-aicm-xray="on"] *[data-aicm-xray-kind="text"] { outline: 2px dashed \${XRAY_COLORS.text}; }
          body[data-aicm-xray="on"] *[data-aicm-xray-kind="media"] { outline: 2px dashed \${XRAY_COLORS.media}; }
          body[data-aicm-xray="on"] *[data-aicm-xray-kind="interactive"] { outline: 2px dashed \${XRAY_COLORS.interactive}; cursor: crosshair !important; }
          body[data-aicm-xray="on"] *[\${SELECTED_ATTR}] { box-shadow: inset 0 0 0 2px #60a5fa; }
        \`;
        document.head.appendChild(style);
      }

      function decorateElements() {
        const all = document.body.querySelectorAll('*');
        all.forEach((el) => {
          if (!(el instanceof HTMLElement) || shouldIgnore(el)) return;
          el.setAttribute('data-aicm-xray-kind', getCategory(el));
        });
      }

      function post(type, payload) {
        window.parent.postMessage({ type, payload }, '*');
      }

      function clearSelection() {
        const selected = document.querySelector('*[' + SELECTED_ATTR + ']');
        if (selected) selected.removeAttribute(SELECTED_ATTR);
      }

      applyStyles();
      decorateElements();
      document.body.setAttribute('data-aicm-xray', 'on');

      let lastHoverAt = 0;
      document.addEventListener('mousemove', (ev) => {
        const now = Date.now();
        if (now - lastHoverAt < 40) return;
        lastHoverAt = now;
        const el = ev.target instanceof HTMLElement ? ev.target : null;
        if (!el || shouldIgnore(el)) return;
        post('aicodemaster_xray_hover', serializeElement(el, { x: ev.clientX, y: ev.clientY }));
      }, true);

      document.addEventListener('click', (ev) => {
        const el = ev.target instanceof HTMLElement ? ev.target : null;
        if (!el || shouldIgnore(el)) return;
        ev.preventDefault();
        ev.stopPropagation();
        clearSelection();
        el.setAttribute(SELECTED_ATTR, '1');
        post('aicodemaster_xray_select', serializeElement(el, { x: ev.clientX, y: ev.clientY }));
      }, true);

      const observer = new MutationObserver(() => {
        window.requestAnimationFrame(decorateElements);
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: false });
    })();
  `;

  const srcDoc = `
    <html>
      <style>${css}</style>
      <body>${html}</body>
      <script>${anchorGuardScript}</script>
      ${hasJavaScript ? `<script>${js}</script>` : ''}
    </html>
  `;

  const targetDoc = exercise ? `
    <html>
      <style>${exercise.targetCss}</style>
      <body>${exercise.targetHtml}</body>
      <script>${anchorGuardScript}</script>
      ${hasJavaScript ? `<script>${exercise.targetJs}</script>` : ''}
      ${shouldInjectXray ? `<script>${xrayScript}</script>` : ''}
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
  const panelShellClass = "relative h-full rounded-xl overflow-hidden border border-zinc-800/90 shadow-[0_10px_28px_rgba(0,0,0,0.35)]";
  const workflowTitle = ui.workspaceFlowTitle || 'Workflow';
  const workflowDescription =
    ui.workspaceFlowDescription || '1 Write in the editor -> 2 Check live result -> 3 Match the model';
  const editorsPanelTitle = ui.panelEditorsTitle || 'Editors';
  const livePanelTitle = ui.panelLiveTitle || ui.liveResult;
  const targetPanelTitle = ui.panelTargetTitle || ui.target;
  const editorsPanelHint = ui.panelEditorsHint || 'Write and update your HTML, CSS, and JS here.';
  const livePanelHint = ui.panelLiveHint || 'See what your current code produces in real time.';
  const targetPanelHint = ui.panelTargetHint || 'Compare your output with the model in panel 3.';
  const editorsContainerBgClass = isEditorsLightMode ? 'bg-zinc-50 text-zinc-900' : 'bg-zinc-950 text-zinc-100';
  const editorsHeaderBgClass = isEditorsLightMode ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800';
  const editorsSectionBorderClass = isEditorsLightMode ? 'border-zinc-200' : 'border-zinc-800';
  const editorsLabelClass = isEditorsLightMode ? 'text-zinc-700' : 'text-zinc-500';
  const editorsButtonClass = isEditorsLightMode ? 'text-zinc-600 hover:bg-zinc-200' : 'text-zinc-500 hover:bg-zinc-800';
  const resizeHandle = (
    <PanelResizeHandle className="w-3 flex items-center justify-center cursor-col-resize group">
      <div className="h-20 w-2 rounded-full border border-zinc-700 bg-zinc-900/90 flex items-center justify-center transition-colors group-hover:border-blue-500 group-hover:bg-zinc-900">
        <span className="h-6 w-[3px] rounded-full bg-zinc-500 transition-colors group-hover:bg-blue-400" />
      </div>
    </PanelResizeHandle>
  );

  const editorsColumn = (
    <div className={`${panelShellClass} flex flex-col transition-opacity duration-200 ${editorsContainerBgClass} ${getGuidePanelClass('editors')}`}>
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="relative pr-12">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold leading-none text-white">
              1
            </span>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{editorsPanelTitle}</p>
          </div>
          <p className="text-[11px] text-zinc-300">{editorsPanelHint}</p>
          <button
            type="button"
            onClick={() => setIsEditorsLightMode((prev) => !prev)}
            className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-md text-blue-300 hover:bg-zinc-800 hover:text-blue-200 transition-colors"
            title="Editor theme"
            aria-label="Toggle editor theme"
          >
            {isEditorsLightMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className={`flex flex-col border-b ${editorsSectionBorderClass} transition-all duration-300 ${minimizedEditors.html ? 'h-12' : 'flex-1 min-h-0'}`}>
        <div className={`flex items-center justify-between px-4 ${headerHeight} border-b shrink-0 ${editorsHeaderBgClass}`}>
          <span className={`text-xs font-bold uppercase tracking-widest ${editorsLabelClass}`}>{getTechnologyLabel('html', ui)}</span>
          <button onClick={() => toggleEditor('html')} className={`p-1 rounded ${editorsButtonClass}`}>
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

      <div className={`flex flex-col ${hasJavaScript ? `border-b ${editorsSectionBorderClass}` : ''} transition-all duration-300 ${minimizedEditors.css ? 'h-12' : 'flex-1 min-h-0'}`}>
        <div className={`flex items-center justify-between px-4 ${headerHeight} border-b shrink-0 ${editorsHeaderBgClass}`}>
          <span className={`text-xs font-bold uppercase tracking-widest ${editorsLabelClass}`}>{getTechnologyLabel('css', ui)}</span>
          <button onClick={() => toggleEditor('css')} className={`p-1 rounded ${editorsButtonClass}`}>
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

      {hasJavaScript && (
        <div className={`flex flex-col transition-all duration-300 ${minimizedEditors.js ? 'h-12' : 'flex-1 min-h-0'}`}>
          <div className={`flex items-center justify-between px-4 ${headerHeight} border-b shrink-0 ${editorsHeaderBgClass}`}>
            <span className={`text-xs font-bold uppercase tracking-widest ${editorsLabelClass}`}>{getTechnologyLabel('javascript', ui)}</span>
            <button onClick={() => toggleEditor('js')} className={`p-1 rounded ${editorsButtonClass}`}>
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
      )}
    </div>
  );

  const livePreviewColumn = (
    <div className={`${panelShellClass} flex flex-col bg-white transition-opacity duration-200 ${getGuidePanelClass('live')}`}>
      <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold leading-none text-white">
            2
          </span>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{livePanelTitle}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-300">{livePanelHint}</p>
      </div>
      <div className="relative flex-1">
        <iframe
          title="user-preview"
          srcDoc={srcDoc}
          className="w-full h-full border-none"
        />
        {shouldInjectXray && isXrayDrawerOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/80">
            <div className="h-[94%] w-[94%] border border-zinc-700 bg-zinc-950 p-3 text-zinc-100 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-300">{ui.xrayDrawerTitle || 'X-Ray CSS Inspector'}</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsXrayDrawerOpen(false);
                    setXrayHelpPopover(null);
                  }}
                  className="rounded-md p-1 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  aria-label={ui.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {!selectedXrayNode ? (
                <p className="text-xs text-zinc-400">{ui.xrayEmptyState || 'Select an element in the Model panel to inspect CSS.'}</p>
              ) : (
                <div className="space-y-3 overflow-auto pr-1 text-xs h-[calc(100%-2rem)]">
                  <div className="rounded-md border border-zinc-700 bg-zinc-900/70 p-2">
                    <p className="font-semibold text-blue-300">{selectedXrayNode.tag}{selectedXrayNode.classSummary ? ` ${selectedXrayNode.classSummary}` : ''}</p>
                    <p className="mt-1 break-words text-zinc-300">{selectedXrayNode.selectorPath}</p>
                  </div>
                  <div className="rounded-md border border-zinc-700 bg-zinc-900/70 p-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[18px] font-semibold text-emerald-300">Box model</p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => toggleXrayHelpPopover(event, 'boxModel')}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[14px] font-bold leading-none text-zinc-900"
                          aria-label={ui.xrayHelpIconLabel || 'Help'}
                        >
                          ?
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 space-y-1 text-zinc-300">
                      {Object.entries(selectedXrayNode.boxModel).map(([key, value]) => (
                        <p key={key}><span className="text-zinc-400">{key}</span>: {value}</p>
                      ))}
                    </div>
                  </div>
                  {Object.entries(selectedXrayNode.fullCss).map(([group, entries]) => (
                    <div key={group} className="rounded-md border border-zinc-700 bg-zinc-900/70 p-2">
                      <div className="flex items-center gap-2">
                        <p className="text-[18px] font-semibold capitalize text-amber-300">{group}</p>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(event) => toggleXrayHelpPopover(event, group as 'layout' | 'spacing' | 'typography' | 'visual')}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[14px] font-bold leading-none text-zinc-900"
                            aria-label={ui.xrayHelpIconLabel || 'Help'}
                          >
                            ?
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 space-y-1 text-zinc-300">
                        {Object.entries(entries).map(([prop, value]) => (
                          <p key={prop}><span className="text-zinc-400">{prop}</span>: {value || '-'}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {xrayHelpPopover && (
              <div
                className="fixed z-[80] w-[360px] rounded-md border border-zinc-600 bg-zinc-950 p-3 text-[18px] leading-snug text-zinc-200 shadow-2xl"
                style={{ left: `${xrayHelpPopover.left}px`, top: `${xrayHelpPopover.top}px` }}
              >
                {xrayHelpTextByKey[xrayHelpPopover.key]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const targetPreviewColumn = (
    <div className={`${panelShellClass} flex flex-col bg-white transition-opacity duration-200 ${getGuidePanelClass('target')}`}>
      <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="relative pr-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold leading-none text-white">
              3
            </span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{targetPanelTitle}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-300">{targetPanelHint}</p>
          {!isXrayAvailable && (
            <p className="mt-1 text-[10px] text-zinc-400">{ui.xrayDesktopOnlyHint || 'X-Ray is available on desktop.'}</p>
          )}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1">
            {isXrayAvailable && (
              <button
                type="button"
                onClick={() => setIsXrayEnabled((prev) => !prev)}
                className={`inline-flex h-10 items-center justify-center gap-1 rounded-md px-2 transition-colors ${
                  isXrayEnabled ? 'bg-blue-600 text-white hover:bg-blue-500' : 'text-blue-300 hover:bg-zinc-800 hover:text-blue-200'
                } ${isGuideOverlayActive && activeGuideStep?.id === 'xray' ? 'ring-2 ring-blue-300 ring-offset-2 ring-offset-zinc-900 shadow-[0_0_0_3px_rgba(59,130,246,0.35)]' : ''}`}
                title={`${ui.xrayModeLabel || 'X-Ray'}: ${isXrayEnabled ? (ui.xrayModeOn || 'ON') : (ui.xrayModeOff || 'OFF')}`}
                aria-label={ui.xrayModeLabel || 'X-Ray'}
              >
                {isXrayEnabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                <span className="text-[10px] font-semibold uppercase tracking-wide">{ui.xrayModeLabel || 'X-Ray'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onAdmin}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-blue-300 hover:bg-zinc-800 hover:text-blue-200 transition-colors"
              title={ui.adminPanel}
              aria-label={ui.adminPanel}
            >
              <ArrowUpDown className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="relative flex-1">
        <iframe
          title="target-preview"
          srcDoc={targetDoc}
          ref={targetFrameRef}
          className="w-full h-full border-none"
        />
        {shouldInjectXray && hoverXrayNode && (
          <div
            className="pointer-events-none absolute z-20 w-[320px] rounded-md border border-blue-900 bg-[#0b1220] px-3 py-2 font-mono text-[12px] leading-6 text-slate-100 shadow-2xl"
            style={{
              left: `${Math.max(10, Math.min((hoverXrayNode.pointerX ?? 10) + 12, Math.max(10, viewportWidth - 420)))}px`,
              top: `${Math.max(10, Math.min((hoverXrayNode.pointerY ?? 10) + 10, 420))}px`,
            }}
          >
            <p className="font-semibold text-blue-300">
              {hoverXrayNode.tag}{hoverXrayNode.classSummary ? ` ${hoverXrayNode.classSummary}` : ''}
            </p>
            <p className="truncate text-slate-300">{hoverXrayNode.selectorPath}</p>
            <p className="text-slate-400">{'{'}</p>
            {(['display', 'position', 'width'] as const).map((prop) => (
              <p key={prop} className="text-slate-300">
                {prop}: {hoverXrayNode.keyCss[prop] || '-'};
              </p>
            ))}
            <p className="text-slate-400">{'}'}</p>
          </div>
        )}
        {shouldInjectXray && !selectedXrayNode && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-md border border-zinc-700 bg-zinc-900/90 px-2 py-1 text-[18px] text-zinc-300">
            {ui.xrayHelpHint || 'Hover to inspect. Click an element to open full CSS.'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header
        className={`flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md ${
          isGuideOverlayActive && activeGuideStep?.id === 'modes' ? 'relative z-[55]' : 'z-10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Mouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">{exercise?.title || ui.newLesson}</h1>
            <p className="mt-1 text-[11px] text-blue-300">
              {workflowDescription}
            </p>
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
                      startGuide();
                      setIsModeMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <CircleHelp className="w-3.5 h-3.5 text-blue-400" />
                    {ui.startGuideCta || guide.howItWorks}
                  </button>
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
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${!isRealTime ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
                  >
                    {!isRealTime && checking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      <CheckCircle className={`w-3.5 h-3.5 ${!isRealTime ? 'text-blue-300' : 'text-blue-400'}`} />
                    )}
                    {ui.askTeacher}
                  </button>
                  <button
                    onClick={() => {
                      setIsRealTime(true);
                      setIsModeMenuOpen(false);
                    }}
                    className={`mt-1 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-2 ${isRealTime ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-300" />
                    {ui.realtime}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center gap-2 transition-opacity duration-200 ${getGuidePanelClass('modes')}`}>
              <button
                onClick={startGuide}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
              >
                <CircleHelp className="w-3.5 h-3.5 text-blue-400" />
                {ui.startGuideCta || guide.howItWorks}
              </button>
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
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${!isRealTime ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}` }
              >
                {!isRealTime && checking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <CheckCircle className={`w-3.5 h-3.5 ${!isRealTime ? 'text-blue-300' : 'text-blue-400'}`} />
                )}
                {ui.askTeacher}
              </button>
              <button 
                onClick={() => setIsRealTime(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isRealTime ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Activity className="w-3.5 h-3.5 text-blue-300" />
                {ui.realtime}
              </button>
              </div>
            </div>
          )}
          <button
            onClick={onAuth}
            className={`p-2 rounded-full transition-colors ${isAuthenticated ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
            title={ui.userAccount}
          >
            {isAuthenticated ? <Lock className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
          </button>
          <button 
            onClick={onAdmin}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-full transition-colors"
            title={ui.adminPanel}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative p-2">
        {!isBelow1200 ? (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={33} minSize={20}>{editorsColumn}</Panel>
            {resizeHandle}
            <Panel defaultSize={33} minSize={20}>{livePreviewColumn}</Panel>
            {resizeHandle}
            <Panel defaultSize={34} minSize={20}>{targetPreviewColumn}</Panel>
          </PanelGroup>
        ) : isBelow800 ? (
          <div className="w-full h-full">{editorsColumn}</div>
        ) : (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={56} minSize={28}>{editorsColumn}</Panel>
            {resizeHandle}
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
            <span className="block text-[10px] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">3. {targetPanelTitle}</span>
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
            <span className="block text-[10px] uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">2. {livePanelTitle}</span>
          </button>
          <div className={`fixed top-14 right-0 bottom-0 w-[min(92vw,560px)] bg-white border-l border-zinc-300 shadow-2xl z-30 transition-transform duration-300 ${isLiveDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {livePreviewColumn}
          </div>
        </>
      )}

      <div className={`fixed bottom-6 right-6 z-40 transition-opacity duration-200 ${getGuidePanelClass('teacher')}`}>
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
            className={`fixed left-4 right-4 top-16 bottom-24 md:left-auto md:right-6 md:top-auto md:bottom-24 md:w-[420px] md:h-[70vh] bg-[#f4e2b9] border border-[#e7c980] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-40 transition-opacity duration-200 ${getGuidePanelClass('teacher')}`}
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
                          ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside pl-1 my-2 space-y-1" />,
                          ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside pl-1 my-2 space-y-1" />,
                          li: ({node, ...props}) => <li {...props} className="leading-relaxed" />,
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
                                    ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside pl-1 my-2 space-y-1" />,
                                    ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside pl-1 my-2 space-y-1" />,
                                    li: ({node, ...props}) => <li {...props} className="leading-relaxed" />,
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
                              ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside pl-1 my-2 space-y-1" />,
                              ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside pl-1 my-2 space-y-1" />,
                              li: ({node, ...props}) => <li {...props} className="leading-relaxed" />,
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

      {isGuideOpen && activeGuideStep && (
        <>
          {isGuideOverlayActive && <div className="fixed inset-0 z-40 bg-black/70" />}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="w-full max-w-md h-[400px] rounded-2xl border border-zinc-700 bg-zinc-900/95 p-5 shadow-2xl flex flex-col">
            <h3 className="mt-2 text-2xl font-semibold text-zinc-50 shrink-0">{activeGuideStep.title}</h3>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              {(() => {
                const { lead, rest } = splitGuideDescription(activeGuideStep.description);
                return (
                  <div className="space-y-2">
                    <p className="text-xl leading-relaxed text-zinc-100">{lead}</p>
                    {rest && <p className="text-sm leading-relaxed text-zinc-300">{rest}</p>}
                  </div>
                );
              })()}
            </div>
            <div className="mt-5 flex items-center justify-start gap-2 shrink-0">
              <button
                type="button"
                onClick={() => goToGuideStep(guideStepIndex - 1)}
                disabled={guideStepIndex === 0}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guide.previous}
              </button>
              <div className="flex items-center gap-2">
                {guideSteps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToGuideStep(index)}
                    aria-label={`${index + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${index === guideStepIndex ? 'bg-blue-400' : 'bg-zinc-600 hover:bg-zinc-500'}`}
                  >
                    <span className="sr-only">{step.title}</span>
                  </button>
                ))}
              </div>
              {guideStepIndex < guideSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToGuideStep(guideStepIndex + 1)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  {guide.next}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishGuide}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {ui.dismissGuideCta || guide.finish}
                </button>
              )}
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
};

const AdminView = ({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) => {
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [defaultLessonId, setDefaultLessonId] = useState('');
  const [selectedAiLanguage, setSelectedAiLanguage] = useState<AiLanguage>('ro');
  const [aiLanguageOptions, setAiLanguageOptions] = useState<{ code: AiLanguage; label: string }[]>([]);
  const [lessons, setLessons] = useState<SettingsResponse['lessons']>([]);
  const [saving, setSaving] = useState(false);
  const [uiOverrides, setUiOverrides] = useState<Record<string, string>>({});
  const isGuest = !getAuthToken();
  const ui = mergeUiText(uiOverrides);

  useEffect(() => {
    const token = getAuthToken();
    const guestLanguage = !token ? getGuestLanguage() : null;
    const guestLessonId = !token ? getGuestLessonId() : null;
    const params = new URLSearchParams();
    if (guestLanguage) params.set('language', guestLanguage);
    if (guestLessonId) params.set('lessonId', guestLessonId);
    const url = params.size ? `/api/settings?${params.toString()}` : '/api/settings';
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.json())
      .then((data: SettingsResponse) => {
        setSelectedLessonId(data.selectedLessonId || data.defaultLessonId);
        setDefaultLessonId(data.defaultLessonId);
        setSelectedAiLanguage((guestLanguage || data.selectedAiLanguage || 'ro') as AiLanguage);
        setAiLanguageOptions(data.aiLanguageOptions || []);
        setLessons(data.lessons);
      });
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    fetch(`/api/i18n?language=${encodeURIComponent(selectedAiLanguage)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.json())
      .then((data: { texts?: Record<string, string> }) => {
        setUiOverrides(data.texts || {});
      })
      .catch(() => {});
  }, [selectedAiLanguage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setGuestLanguage(selectedAiLanguage);
        setGuestLessonId(selectedLessonId || defaultLessonId);
        onSaved();
        return;
      }
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-6" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] bg-white border border-zinc-200 rounded-2xl shadow-xl flex flex-col text-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Settings className="w-6 h-6 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{ui.adminPanel}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition-colors"
            aria-label={ui.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 px-8 pb-4 min-h-0 overflow-y-auto flex-1">
          <div>
            {isGuest && (
              <div className="mb-4 rounded-xl border border-red-400 bg-red-500 p-3 text-white">
                <p className="text-sm font-semibold text-white">{ui.adminGuestNoticeTitle}</p>
                <p className="mt-1 text-xs text-red-50">{ui.adminGuestNoticeDescription}</p>
              </div>
            )}
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">{ui.savedLessons}</label>
            <div className="space-y-2">
              {lessons.map((lesson) => {
                const progressLabelMap: Record<LessonProgress, string> = {
                  not_started: ui.statusNotStarted,
                  in_progress: ui.statusInProgress,
                  completed: ui.statusCompleted,
                };
                return (
                <label
                  key={lesson.id}
                  className={`block w-full border rounded-xl p-3 cursor-pointer transition-colors ${
                    selectedLessonId === lesson.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{lesson.name}</p>
                      <p className="text-xs text-zinc-600 mt-1">{lesson.description}</p>
                      <div className="mt-3 grid w-full grid-cols-2 gap-3">
                        <div className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 flex items-center">
                          <div className="flex items-center justify-start gap-2 overflow-hidden whitespace-nowrap text-[11px] leading-none">
                            {PROGRESS_STEPS.map((step, index) => {
                              const isActive = lesson.progress === step;
                              return (
                                <React.Fragment key={step}>
                                  <span className={isActive ? 'font-semibold text-blue-600' : 'font-semibold text-zinc-500'}>
                                    {progressLabelMap[step]}
                                  </span>
                                  {index < PROGRESS_STEPS.length - 1 && (
                                    <span className={`inline-block h-1 w-1 rounded-full ${isActive ? 'bg-blue-600' : 'bg-zinc-400'}`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        <div className="w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5">
                          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                            {lesson.technologies.map((technology) => (
                              <span key={`${lesson.id}-${technology}`} className="px-2 py-1 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                                {getTechnologyLabel(technology, ui)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
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
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">{ui.aiLanguage}</label>
            <select
              value={selectedAiLanguage}
              onChange={(e) => setSelectedAiLanguage(e.target.value as AiLanguage)}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {aiLanguageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex gap-3 px-8 py-4 border-t border-zinc-200 shrink-0 bg-white rounded-b-2xl">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl transition-colors"
          >
            {ui.cancel}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || !selectedLessonId}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            {ui.launchLesson}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AuthView = ({ onClose, onAuthChanged }: { onClose: () => void; onAuthChanged: (isAuthenticated: boolean) => void }) => {
  const [aiLanguage, setAiLanguage] = useState<AiLanguage>(() => getGuestLanguage() || 'ro');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [uiOverrides, setUiOverrides] = useState<Record<string, string>>({});
  const ui = mergeUiText(uiOverrides);

  const mapAuthErrorToUi = (error: unknown): string => {
    const text = typeof error === 'string' ? error : '';
    if (text === 'Missing email or password.' || text === 'Missing required fields.') return ui.authMissingFields;
    if (text === 'Email already exists.') return ui.authEmailExists;
    if (text === 'Invalid credentials.') return ui.authInvalidCredentials;
    if (text === 'Unauthorized') return ui.authUnauthorized;
    return ui.authUnexpectedError || ui.authInvalidCredentials;
  };

  useEffect(() => {
    const token = getAuthToken();
    const guestLanguage = !token ? getGuestLanguage() : null;
    const guestLessonId = !token ? getGuestLessonId() : null;
    const params = new URLSearchParams();
    if (guestLanguage) params.set('language', guestLanguage);
    if (guestLessonId) params.set('lessonId', guestLessonId);
    const url = params.size ? `/api/settings?${params.toString()}` : '/api/settings';

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.json())
      .then((data: SettingsResponse) => {
        const nextLanguage = guestLanguage || data.selectedAiLanguage;
        if (isAiLanguage(nextLanguage)) {
          setAiLanguage(nextLanguage);
        }
      })
      .catch(() => {});

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    setProfileLoading(true);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          setMessage(ui.authUnauthorized || ui.authUnexpectedError || ui.authInvalidCredentials);
          return null;
        }
        return res.json();
      })
      .then((data: { user: { fullName: string; email: string } } | null) => {
        if (!data?.user) return;
        setIsAuthenticated(true);
        setFullName(data.user.fullName);
        setEmail(data.user.email);
      })
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    fetch(`/api/i18n?language=${encodeURIComponent(aiLanguage)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.json())
      .then((data: { texts?: Record<string, string> }) => {
        setUiOverrides(data.texts || {});
      })
      .catch(() => {});
  }, [aiLanguage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && password !== confirmPassword) {
      setMessage(ui.authPasswordsNoMatch);
      return;
    }
    const url = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload =
      mode === 'register'
        ? { fullName: fullName.trim(), email: email.trim().toLowerCase(), password, preferredAiLanguage: aiLanguage }
        : { email: email.trim().toLowerCase(), password };
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setMessage(mapAuthErrorToUi(data?.error));
          return;
        }
        if (typeof data?.token === 'string') {
          setAuthToken(data.token);
          onAuthChanged(true);
          onClose();
          return;
        }
        setMessage(ui.authUnexpectedError || ui.authInvalidCredentials);
      })
      .catch(() => setMessage(ui.authUnexpectedError || ui.authInvalidCredentials));
  };

  const handleSaveProfile = async () => {
    const token = getAuthToken();
    if (!token) return;
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || undefined,
        preferredAiLanguage: aiLanguage,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(mapAuthErrorToUi(data?.error));
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setMessage(ui.authProfileSaved);
  };

  const handleLogout = async () => {
    const token = getAuthToken();
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearAuthToken();
    clearGuestSessionSettings();
    setIsAuthenticated(false);
    onAuthChanged(false);
    onClose();
  };

  const handleDeleteAccount = async () => {
    const token = getAuthToken();
    if (!token) return;
    const ok = window.confirm(ui.authDeleteConfirm);
    if (!ok) return;
    await fetch('/api/auth/me', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    clearAuthToken();
    clearGuestSessionSettings();
    setIsAuthenticated(false);
    onAuthChanged(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">{ui.userAccount}</h2>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg transition-colors"
            aria-label={ui.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {profileLoading ? (
          <div className="py-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : isAuthenticated ? (
          <div className="space-y-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={ui.authFullName}
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ui.authEmail}
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={ui.adminUserPassword}
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {message && <p className="text-xs text-zinc-600">{message}</p>}

            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              {ui.authSaveProfile}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              {ui.authLogout}
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              {ui.authDeleteAccount}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
              >
                <LogIn className="w-4 h-4" />
                {ui.authLogin}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
              >
                <UserPlus className="w-4 h-4" />
                {ui.authRegister}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={ui.authFullName}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ui.authEmail}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={ui.authPassword}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {mode === 'register' && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={ui.authConfirmPassword}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}

              {message && <p className="text-xs text-zinc-600">{message}</p>}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
              >
                {mode === 'login' ? ui.authLogin : ui.authCreateAccount}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setIsAuthenticated(Boolean(getAuthToken()));
  }, []);

  const handleSaved = () => {
    setIsAdminOpen(false);
    setReloadToken((prev) => prev + 1);
  };

  const handleAuthChanged = (next: boolean) => {
    setIsAuthenticated(next);
    setReloadToken((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <StudentView onAdmin={() => setIsAdminOpen(true)} onAuth={() => setIsAuthOpen(true)} isAuthenticated={isAuthenticated} reloadToken={reloadToken} />
      {isAuthOpen && (
        <AuthView onClose={() => setIsAuthOpen(false)} onAuthChanged={handleAuthChanged} />
      )}
      {isAdminOpen && (
        <AdminView onClose={() => setIsAdminOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}


