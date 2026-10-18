/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

const VIDEO_URL = '/background-video.mp4';
const MOBILE_VIDEO_URL = '/background-video-mobile.mp4';
const FALLBACK_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4';

const OWNER_PIN = '7374';

const TYPEWRITER_TEXT =
  'Explora mis proyectos, series fotográficas y producciones multimedia. ¿Qué proyecto revisamos hoy?';

export type MediaType = 'foto' | 'video' | 'pdf';

export interface ProjectMedia {
  id: string;
  type: MediaType;
  url: string;
  name: string;
  size?: string;
}

export interface Project {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  cover?: string;
  media: ProjectMedia[];
}

export const SEMESTER_OPTIONS = ['2025-1', '2025-2', '2026-1', '2026-2'] as const;
export type Semester = (typeof SEMESTER_OPTIONS)[number];

const DEFAULT_CATEGORIES = [
  'Fotografía',
  'Diseño',
  'Audiovisual',
  'Desarrollo',
  '3D / Motion',
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'A.R.I.A Visual Architecture',
    date: '2026-1 y 2026-2',
    category: 'Diseño',
    description:
      'Sistema de diseño sensorial interactivo y prototipado cinemático para interfaces de nueva generación.',
    media: [
      {
        id: 'm1',
        type: 'foto',
        name: 'Interfaz_Principal.jpg',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'm2',
        type: 'foto',
        name: 'Wireframes_Detalle.jpg',
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'm3',
        type: 'pdf',
        name: 'Especificaciones_Tecnicas_ARIA.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '1.4 MB',
      },
    ],
  },
  {
    id: '2',
    title: 'Luces de Asfalto - Serie 35mm',
    date: '2025-2 a 2026-1',
    category: 'Fotografía',
    description:
      'Crónica fotográfica documental capturada en película de 35mm sobre la soledad y la vibración nocturna urbana.',
    media: [
      {
        id: 'm4',
        type: 'foto',
        name: 'Calle_Nocturna_01.jpg',
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'm5',
        type: 'foto',
        name: 'Geometrias_Luz.jpg',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'm6',
        type: 'foto',
        name: 'Retrato_Penumbra.jpg',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  {
    id: '3',
    title: 'Cinetik Sculpture Reel',
    date: '2025-1',
    category: '3D / Motion',
    description:
      'Composiciones procedurales animadas y escultura virtual con iluminación dinámica y renderizado en tiempo real.',
    media: [
      {
        id: 'm7',
        type: 'video',
        name: 'Motion_Loop_Preview.mp4',
        url: '/background-video.mp4',
      },
      {
        id: 'm8',
        type: 'foto',
        name: 'Render_Still_HighRes.jpg',
        url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'm9',
        type: 'pdf',
        name: 'Memoria_Conceptual_Cinetik.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '2.8 MB',
      },
    ],
  },
];

function useTypewriter(text: string, speed = 36, startDelay = 500) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let index = 0;
    let timer: ReturnType<typeof setInterval> | null = null;

    setDisplayed('');
    setDone(false);

    const delayTimeout = setTimeout(() => {
      timer = setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          setDone(true);
          if (timer) clearInterval(timer);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(delayTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

const DEFAULT_CV_URL = '/cv-samuel-restrepo.pdf';

export interface HeroTexts {
  blurredLine1: string;
  blurredLine2: string;
  typewriterText: string;
}

const DEFAULT_HERO_TEXTS: HeroTexts = {
  blurredLine1: 'Hola, bienvenido al portafolio de',
  blurredLine2: 'Samuel Restrepo · Proyectos, Fotografía & Multimedia',
  typewriterText:
    'Explora mis proyectos, series fotográficas y producciones multimedia. ¿Qué proyecto revisamos hoy?',
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const prevXRef = useRef<number | null>(null);

  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_URL);
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia('(max-width: 767px)').matches
  );
  const [cvPdfUrl, setCvPdfUrl] = useState<string>(() => {
    return localStorage.getItem('sr_cv_pdf_url') || DEFAULT_CV_URL;
  });
  const cvFileInputRef = useRef<HTMLInputElement>(null);

  // Editable Hero Texts (stored in localStorage)
  const [heroTexts, setHeroTexts] = useState<HeroTexts>(() => {
    const saved = localStorage.getItem('sr_hero_texts');
    if (saved) {
      try {
        return { ...DEFAULT_HERO_TEXTS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_HERO_TEXTS;
      }
    }
    return DEFAULT_HERO_TEXTS;
  });
  const [editHeroTexts, setEditHeroTexts] = useState<HeroTexts>(heroTexts);
  const [heroTextSavedNotice, setHeroTextSavedNotice] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  // Authentication State (PIN: 7374)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('sr_admin_auth') === 'true';
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Dynamic Categories (stored in localStorage)
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('sr_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const [newCatInput, setNewCatInput] = useState('');

  const normalizeSemester = (dateStr: string): string => {
    if (!dateStr) return '2026-2';
    // If it already contains valid semester references (including multi-semesters like '2025-2 y 2026-1', '2025-1 a 2026-1')
    if (
      dateStr.includes('2025-1') ||
      dateStr.includes('2025-2') ||
      dateStr.includes('2026-1') ||
      dateStr.includes('2026-2')
    ) {
      return dateStr;
    }
    if (dateStr.includes('2025')) {
      return dateStr.includes('-2') ? '2025-2' : '2025-1';
    }
    return '2026-2';
  };

  // Projects list (stored in localStorage)
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('sr_projects');
    if (saved) {
      try {
        const parsed: Project[] = JSON.parse(saved);
        return parsed.map((p) => ({
          ...p,
          date: normalizeSemester(p.date),
        }));
      } catch {
        return INITIAL_PROJECTS;
      }
    }
    return INITIAL_PROJECTS;
  });

  // Active view modals
  const [activeModal, setActiveModal] = useState<
    'projects' | 'admin' | 'new_project' | 'edit_project' | 'about' | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (!lightboxPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxPhoto(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxPhoto]);
  const [projectMediaFilter, setProjectMediaFilter] = useState<
    'all' | 'foto' | 'video' | 'pdf'
  >('all');

  // Admin tabs
  const [adminTab, setAdminTab] = useState<
    'projects' | 'categories' | 'hero' | 'cv' | 'blob'
  >('projects');
  const [copiedConfigNotice, setCopiedConfigNotice] = useState(false);
  const jsonImportInputRef = useRef<HTMLInputElement>(null);


  // New / Edit Project Form State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState<string>('2026-2');
  const [formCategory, setFormCategory] = useState(categories[0] || 'Fotografía');
  const [formDescription, setFormDescription] = useState('');
  const [formMediaList, setFormMediaList] = useState<ProjectMedia[]>([]);
  const [formCover, setFormCover] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState('');

  // Estados heredados para compatibilidad con sesiones previas. Los medios se
  // gestionan exclusivamente mediante rutas de /public.
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [blobUploadNotice, setBlobUploadNotice] = useState('');
  const [blobSyncStatus, setBlobSyncStatus] = useState<
    'idle' | 'checking' | 'connected' | 'not_connected' | 'syncing' | 'synced' | 'error'
  >('idle');
  const [blobSyncMessage, setBlobSyncMessage] = useState('');
  const [projectSaveMessage, setProjectSaveMessage] = useState('');
  const [customBlobToken, setCustomBlobToken] = useState(() => {
    return localStorage.getItem('sr_vercel_blob_token') || '';
  });
  const [blobTokenInput, setBlobTokenInput] = useState(() => {
    return localStorage.getItem('sr_vercel_blob_token') || '';
  });
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [showTokenChars, setShowTokenChars] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('sr_blob_last_synced') || '';
  });
  const [lastSyncedUrl, setLastSyncedUrl] = useState<string>(() => {
    return localStorage.getItem('sr_blob_last_url') || '';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  useEffect(() => {
    setVideoSrc(isMobile ? MOBILE_VIDEO_URL : VIDEO_URL);
  }, [isMobile]);

  // File Inputs
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const projectDetailFileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('sr_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('sr_projects', JSON.stringify(projects));
    } catch {
      setProjectSaveMessage(
        'No se pudo guardar en este navegador. Libera espacio de almacenamiento e inténtalo de nuevo.'
      );
    }
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('sr_cv_pdf_url', cvPdfUrl);
  }, [cvPdfUrl]);

  useEffect(() => {
    localStorage.setItem('sr_hero_texts', JSON.stringify(heroTexts));
  }, [heroTexts]);

  // Cargar el portafolio guardado en Vercel Blob (fuente de verdad compartida)
  const [remoteReady, setRemoteReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const savedToken = localStorage.getItem('sr_vercel_blob_token')?.trim();
    const headers: Record<string, string> = {};
    if (savedToken) headers['x-blob-token'] = savedToken;

    fetch('/api/projects', { cache: 'no-store', headers })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status} al cargar el portafolio`);
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json?.data) return;
        const data = json.data;
        if (Array.isArray(data.projects)) {
          setProjects(
            data.projects.map((p: Project) => ({ ...p, date: normalizeSemester(p.date) }))
          );
        }
        if (Array.isArray(data.categories) && data.categories.length) {
          setCategories(data.categories);
        }
        if (data.heroTexts) {
          const merged = { ...DEFAULT_HERO_TEXTS, ...data.heroTexts };
          setHeroTexts(merged);
          setEditHeroTexts(merged);
        }
        if (typeof data.cvPdfUrl === 'string' && data.cvPdfUrl) {
          setCvPdfUrl(data.cvPdfUrl);
        }
      })
      .catch((err) => console.warn('No se pudo cargar el portafolio desde Vercel Blob:', err))
      .finally(() => {
        if (!cancelled) setRemoteReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoguardado en Vercel Blob cuando el administrador hace cambios
  const syncRef = useRef<() => Promise<boolean>>(async () => false);
  useEffect(() => {
    if (!remoteReady || !isAdmin) return;
    const timer = setTimeout(() => {
      syncRef.current();
    }, 1200);
    return () => clearTimeout(timer);
  }, [projects, categories, heroTexts, cvPdfUrl, remoteReady, isAdmin]);

  // Typewriter bound to editable hero text
  const { displayed, done: typewriterDone } = useTypewriter(
    heroTexts.typewriterText,
    36,
    500
  );

  // Action pills animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setButtonsVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // First frame render
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const initialTime = 0.01;
      targetTimeRef.current = initialTime;
      videoRef.current.currentTime = initialTime;
    }
  };

  const handleSeeked = () => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.02) {
      video.currentTime = targetTimeRef.current;
    } else {
      isSeekingRef.current = false;
    }
  };

  // Video Scrubbing (Left = Forward, Right = Rewind)
  useEffect(() => {
    if (isMobile) {
      prevXRef.current = null;
      return;
    }

    const SENSITIVITY = 0.8;

    const applyScrubDelta = (delta: number) => {
      const video = videoRef.current;
      if (!video || !video.duration || Number.isNaN(video.duration)) return;

      const offset =
        (-delta / window.innerWidth) * SENSITIVITY * video.duration;
      const newTarget = Math.max(
        0,
        Math.min(video.duration, targetTimeRef.current + offset)
      );
      targetTimeRef.current = newTarget;

      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = newTarget;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (prevXRef.current === null) {
        prevXRef.current = e.clientX;
        return;
      }
      const delta = e.clientX - prevXRef.current;
      prevXRef.current = e.clientX;
      applyScrubDelta(delta);
    };

    const handleMouseLeave = () => {
      prevXRef.current = null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        prevXRef.current = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const clientX = e.touches[0].clientX;
      if (prevXRef.current === null) {
        prevXRef.current = clientX;
        return;
      }
      const delta = clientX - prevXRef.current;
      prevXRef.current = clientX;
      applyScrubDelta(delta);
    };

    const handleTouchEnd = () => {
      prevXRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // Admin PIN verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === OWNER_PIN) {
      setIsAdmin(true);
      sessionStorage.setItem('sr_admin_auth', 'true');
      setShowPinModal(false);
      setEnteredPin('');
      setPinError(false);
      setActiveModal('admin');
    } else {
      setPinError(true);
      setEnteredPin('');
    }
  };

  const handleOwnerClick = () => {
    if (isAdmin) {
      setActiveModal('admin');
    } else {
      setEnteredPin('');
      setPinError(false);
      setShowPinModal(true);
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('sr_admin_auth');
    setActiveModal(null);
  };

  // Upload single file directly to Vercel Blob (or fallback to local base64)
  const uploadSingleFile = async (
    file: File
  ): Promise<{ media: ProjectMedia; isBlob: boolean }> => {
    let type: MediaType = 'foto';
    if (file.type.startsWith('video/')) {
      type = 'video';
    } else if (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      type = 'pdf';
    }
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    const activeToken = (
      customBlobToken || localStorage.getItem('sr_vercel_blob_token') || ''
    ).trim();

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await upload(`proyectos/${cleanFileName}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        multipart: file.size > 20 * 1024 * 1024,
        headers: activeToken ? { 'x-blob-token': activeToken } : undefined,
        onUploadProgress: ({ percentage }) => {
          setUploadProgressText(`Subiendo ${file.name}: ${Math.round(percentage)}%`);
        },
      });
      return {
        media: {
          id: Date.now().toString() + Math.random().toString().slice(2, 6),
          type,
          name: file.name,
          url: blob.url,
          size: sizeInMb,
        },
        isBlob: true,
      };
    } catch (clientUploadErr) {
      // Método Server Upload directo (para archivos <= 4.5 MB como imágenes o avatares)
      if (file.size <= 4.5 * 1024 * 1024) {
        try {
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const serverRes = await fetch(
            `/api/upload?filename=${encodeURIComponent(cleanFileName)}`,
            {
              method: 'POST',
              headers: activeToken ? { 'x-blob-token': activeToken } : undefined,
              body: file,
            }
          );
          if (serverRes.ok) {
            const serverBlob = await serverRes.json();
            if (serverBlob && serverBlob.url) {
              return {
                media: {
                  id: Date.now().toString() + Math.random().toString().slice(2, 6),
                  type,
                  name: file.name,
                  url: serverBlob.url,
                  size: sizeInMb,
                },
                isBlob: true,
              };
            }
          }
        } catch (serverErr) {
          console.warn('Server upload fallback failed:', serverErr);
        }
      }
      console.warn('Subida a Vercel Blob no completada:', clientUploadErr);
    }

    // 2. Fallback de lectura local (previsualización si no hay conexión con Vercel)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          media: {
            id: Date.now().toString() + Math.random().toString().slice(2, 6),
            type,
            name: file.name,
            url: reader.result as string,
            size: sizeInMb,
          },
          isBlob: false,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Convert File to ProjectMedia with progress tracking and automatic Vercel Blob storage
  const processFiles = async (files: FileList): Promise<ProjectMedia[]> => {
    setIsUploadingMedia(true);
    setUploadProgressText(`Preparando subida de ${files.length} archivo(s)...`);
    const results: ProjectMedia[] = [];
    let blobCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setUploadProgressText(
        `Subiendo a la nube (${i + 1}/${files.length}): ${f.name} (${(f.size / (1024 * 1024)).toFixed(1)} MB)...`
      );
      try {
        const { media, isBlob } = await uploadSingleFile(f);
        results.push(media);
        if (isBlob) blobCount++;
      } catch (err) {
        console.error('Error procesando archivo:', err);
      }
    }

    setIsUploadingMedia(false);
    setUploadProgressText('');

    if (blobCount > 0) {
      setBlobUploadNotice(
        `✓ ¡${blobCount} archivo(s) guardado(s) permanentemente en Vercel Blob!`
      );
      setTimeout(() => setBlobUploadNotice(''), 5000);
    } else {
      setBlobUploadNotice(
        `📁 Archivos cargados. Al desplegar en Vercel con Blob activado o con token, se almacenarán en la nube automáticamente.`
      );
      setTimeout(() => setBlobUploadNotice(''), 6000);
    }

    return results;
  };

  // Sincronización automática de proyectos en la nube de Vercel Blob
  const syncPortfolioToVercelBlob = async (customProjects?: Project[]) => {
    setBlobSyncStatus('syncing');
    setBlobSyncMessage('Enviando datos y sincronizando con Vercel Blob...');
    setProjectSaveMessage('Cambios guardados localmente; sincronizando con Vercel Blob...');
    try {
      const activeToken = (
        customBlobToken || localStorage.getItem('sr_vercel_blob_token') || ''
      ).trim();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['x-blob-token'] = activeToken;
      }

      const payload = {
        projects: customProjects || projects,
        categories,
        heroTexts,
        cvPdfUrl,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let json: { success?: boolean; error?: string; url?: string } = {};
      try {
        json = JSON.parse(responseText);
      } catch {
        // Some platform failures return an HTML or plain-text response instead of JSON.
      }

      if (!res.ok || !json.success) {
        const responseError = responseText
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 300);
        throw new Error(
          json.error ||
            (responseError && responseError !== '[object Object]'
              ? `Error HTTP ${res.status}: ${responseError}`
              : `Error HTTP ${res.status} al sincronizar con Vercel Blob`)
        );
      }

      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setBlobSyncStatus('synced');
      setBlobSyncMessage(
        `🟢 ¡Portfolio sincronizado con éxito en Vercel Blob a las ${timeStr}! Los cambios ya están disponibles en la nube.`
      );
      setProjectSaveMessage('Cambios guardados en este navegador y sincronizados con Vercel Blob.');
      setLastSyncedTime(timeStr);
      localStorage.setItem('sr_blob_last_synced', timeStr);
      if (json.url) {
        setLastSyncedUrl(json.url);
        localStorage.setItem('sr_blob_last_url', json.url);
      }
      return true;
    } catch (err: any) {
      setBlobSyncStatus('error');
      setProjectSaveMessage(
        `Cambios guardados solo en este navegador; no se pudieron sincronizar con Vercel Blob: ${err.message || 'error desconocido'}.`
      );
      setBlobSyncMessage(
        `❌ Error al sincronizar: ${err.message || 'No se pudo guardar en Vercel Blob. Configura el token o actívalo en vercel.com.'}`
      );
      return false;
    }
  };

  syncRef.current = () => syncPortfolioToVercelBlob();

  // Comprobar estado de conexión con Vercel Blob
  const checkVercelBlobStatus = async (overrideToken?: unknown) => {
    setBlobSyncStatus('checking');
    setBlobSyncMessage('Comprobando conexión con Vercel Blob...');
    try {
      const activeToken =
        typeof overrideToken === 'string'
          ? overrideToken.trim()
          : (customBlobToken || localStorage.getItem('sr_vercel_blob_token') || '').trim();

      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['x-blob-token'] = activeToken;
      }

      const res = await fetch('/api/projects', { headers, cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.error)) {
        setBlobSyncStatus('error');
        setBlobSyncMessage(
          json?.error ||
            `Error de conexión (Código ${res.status}). Verifica que tu token sea válido.`
        );
        return;
      }

      if (json && json.connected) {
        if (json.data) {
          const data = json.data;
          if (Array.isArray(data.projects)) {
            setProjects(
              data.projects.map((project: Project) => ({
                ...project,
                date: normalizeSemester(project.date),
              }))
            );
          }
          if (Array.isArray(data.categories) && data.categories.length) {
            setCategories(data.categories);
          }
          if (data.heroTexts) {
            const merged = { ...DEFAULT_HERO_TEXTS, ...data.heroTexts };
            setHeroTexts(merged);
            setEditHeroTexts(merged);
          }
          if (typeof data.cvPdfUrl === 'string' && data.cvPdfUrl) {
            setCvPdfUrl(data.cvPdfUrl);
          }
        }
        setBlobSyncStatus('connected');
        setBlobSyncMessage(
          json.message ||
            '🟢 ¡Conexión exitosa a tu Vercel Blob Store! Tus fotos, vídeos y datos se guardarán automáticamente en la nube.'
        );
        if (json.url) {
          setLastSyncedUrl(json.url);
          localStorage.setItem('sr_blob_last_url', json.url);
        }
      } else if (json && json.warning) {
        setBlobSyncStatus('not_connected');
        setBlobSyncMessage(
          '🟡 Pendiente de vincular: No se detectó BLOB_READ_WRITE_TOKEN en el entorno ni en el panel. Pega tu token abajo para activarlo de inmediato o crea el Blob Store en Vercel.'
        );
      } else {
        setBlobSyncStatus('not_connected');
        setBlobSyncMessage(
          json?.message ||
            '⚪ Vercel Blob no conectado. Configura tu token para sincronización en la nube.'
        );
      }
    } catch (err: any) {
      setBlobSyncStatus('error');
      setBlobSyncMessage(
        `Error de red al consultar /api/projects: ${err.message || 'Error de conexión'}`
      );
    }
  };

  // Guardar Token personalizado de Vercel Blob
  const handleSaveCustomToken = (tokenToSave?: string) => {
    const val = typeof tokenToSave === 'string' ? tokenToSave : blobTokenInput;
    const clean = val
      .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, '')
      .replace(/^['"]|['"]$/g, '')
      .trim();

    if (clean && clean.startsWith('store_')) {
      setBlobSyncStatus('error');
      setBlobSyncMessage(
        `⚠️ Has ingresado el Store ID ("${clean}"). Vercel Blob requiere el token secreto que empieza por "vercel_blob_rw_...". Lo encuentras en Vercel > tu Blob Store > pestaña Settings > Tokens.`
      );
      setBlobTokenInput(clean);
      return;
    }

    setCustomBlobToken(clean);
    setBlobTokenInput(clean);
    localStorage.setItem('sr_vercel_blob_token', clean);
    if (clean) {
      checkVercelBlobStatus(clean);
    } else {
      setBlobSyncStatus('not_connected');
      setBlobSyncMessage('Token eliminado. Se utilizará la variable de entorno de Vercel si existe.');
      checkVercelBlobStatus('');
    }
  };

  // Category management functions (In Admin Panel)
  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      setFormCategory(trimmed);
    }
    setNewCatInput('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert('Debes mantener al menos una categoría en el portafolio.');
      return;
    }
    const updated = categories.filter((c) => c !== catToDelete);
    setCategories(updated);
    if (selectedCategory === catToDelete) {
      setSelectedCategory('Todos');
    }
    if (formCategory === catToDelete) {
      setFormCategory(updated[0] || '');
    }
  };

  // Hero Texts Handlers (Editable desde Admin)
  const handleSaveHeroTexts = (e: React.FormEvent) => {
    e.preventDefault();
    setHeroTexts(editHeroTexts);
    localStorage.setItem('sr_hero_texts', JSON.stringify(editHeroTexts));
    setHeroTextSavedNotice(true);
    setTimeout(() => {
      setHeroTextSavedNotice(false);
    }, 3000);
  };

  const handleResetHeroTexts = () => {
    if (confirm('¿Restablecer los textos iniciales a los valores por defecto?')) {
      setEditHeroTexts(DEFAULT_HERO_TEXTS);
      setHeroTexts(DEFAULT_HERO_TEXTS);
      localStorage.setItem('sr_hero_texts', JSON.stringify(DEFAULT_HERO_TEXTS));
      setHeroTextSavedNotice(true);
      setTimeout(() => {
        setHeroTextSavedNotice(false);
      }, 3000);
    }
  };

  const moveMedia = (fromIndex: number, direction: -1 | 1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= formMediaList.length) return;
    setFormMediaList((current) => {
      const next = [...current];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  };

  // Export & Vercel Handlers
  const handleCopyProjectsConfig = () => {
    const code = `const INITIAL_PROJECTS: Project[] = ${JSON.stringify(projects, null, 2)};`;
    navigator.clipboard.writeText(code);
    setCopiedConfigNotice(true);
    setTimeout(() => setCopiedConfigNotice(false), 3000);
  };

  const handleDownloadProjectsJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'proyectos-samuel-restrepo.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportProjectsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setProjects(imported);
          localStorage.setItem('sr_projects', JSON.stringify(imported));
          alert('¡Proyectos importados con éxito!');
        }
      } catch {
        alert('Error al leer el archivo JSON. Verifica el formato.');
      }
    };
    reader.readAsText(file);
  };

  // Open Create Project Modal
  const openCreateProjectModal = () => {
    setEditingProjectId(null);
    setFormTitle('');
    setFormDate('2026-2');
    setFormCategory(categories[0] || 'Fotografía');
    setFormDescription('');
    setFormMediaList([]);
    setFormCover('');
    setCoverError('');
    setActiveModal('new_project');
  };

  // Open Edit Project Modal
  const openEditProjectModal = (project: Project) => {
    setEditingProjectId(project.id);
    setFormTitle(project.title);
    setFormDate(normalizeSemester(project.date));
    setFormCategory(project.category);
    setFormDescription(project.description);
    setFormMediaList(project.media);
    setFormCover(project.cover || '');
    setCoverError('');
    // El detalle y el formulario usan la misma capa visual. Cerramos el
    // detalle para que el formulario de edición siempre reciba los clics.
    setActiveProject(null);
    setActiveModal('edit_project');
  };

  // Save Project (Create or Edit)
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let updatedList: Project[] = [];
    if (editingProjectId) {
      // Update existing
      updatedList = projects.map((p) =>
        p.id === editingProjectId
          ? {
              ...p,
              title: formTitle.trim(),
              date: formDate.trim() || p.date,
              category: formCategory,
              description: formDescription.trim(),
              cover: formCover || undefined,
              media: formMediaList,
            }
          : p
      );
      setProjects(updatedList);
      if (activeProject?.id === editingProjectId) {
        setActiveProject({
          ...activeProject,
          title: formTitle.trim(),
          date: formDate,
          category: formCategory,
          description: formDescription.trim(),
          cover: formCover || undefined,
          media: formMediaList,
        });
      }
    } else {
      // Create new
      const newProj: Project = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        date: formDate,
        category: formCategory || categories[0] || 'General',
        description: formDescription.trim() || 'Proyecto creativo de Samuel Restrepo.',
        cover: formCover || undefined,
        media: formMediaList,
      };
      updatedList = [newProj, ...projects];
      setProjects(updatedList);
    }

    // Los metadatos se guardan en el navegador. Los archivos viven en /public
    // y se publican junto al sitio al desplegarlo.
    setProjectSaveMessage('Cambios guardados en este navegador.');

    setActiveModal('admin');
  };

  const handleDeleteProject = (projectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      const nextProjects = projects.filter((p) => p.id !== projectId);
      setProjects(nextProjects);
      setProjectSaveMessage('Proyecto eliminado en este navegador.');
      if (activeProject?.id === projectId) {
        setActiveProject(null);
      }
    }
  };

  // Attach files to form
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = await processFiles(e.target.files);
      setFormMediaList((prev) => [...prev, ...newFiles]);
    }
  };

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCoverError('La portada debe ser una imagen (JPG, PNG, WEBP o GIF).');
      return;
    }
    setCoverError('');
    setIsUploadingCover(true);
    try {
      const { media } = await uploadSingleFile(file);
      setFormCover(media.url);
    } catch (err) {
      console.error('Error subiendo portada:', err);
      setCoverError('No se pudo subir la portada. Inténtalo de nuevo.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Filter projects by category for public viewer
  const filteredProjects =
    selectedCategory === 'Todos'
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-sans text-white">
      {/* Permanent Background Video (mouse-scrub controlled: Left = Play forward, Right = Rewind) */}
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        autoPlay={isMobile}
        loop={isMobile}
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onSeeked={handleSeeked}
        onError={() => {
          if (videoSrc === MOBILE_VIDEO_URL) {
            setVideoSrc(VIDEO_URL);
          } else if (videoSrc !== FALLBACK_VIDEO_URL) {
            setVideoSrc(FALLBACK_VIDEO_URL);
          }
        }}
        className="fixed inset-0 z-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: '70% center' }}
      />

      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxPhoto.name}
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={lightboxPhoto.url}
            alt={lightboxPhoto.name}
            onClick={(e) => e.stopPropagation()}
            className="block w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg cursor-default"
          />
          <p className="mt-3 text-xs text-white/60 truncate max-w-full">{lightboxPhoto.name}</p>
        </div>
      )}

      {/* Subtle overlay gradient to ensure high legibility */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30"
        aria-hidden="true"
      />

      {/* NAVBAR (fixed, z-index: 10) */}
      <nav className="fixed top-0 left-0 right-0 z-10 w-full px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
        {/* Logo: Samuel Restrepo® ✳︎ (Acceso al panel de administrador oculto aquí) */}
        <button
          type="button"
          onClick={handleOwnerClick}
          title={isAdmin ? 'Panel de Administrador' : 'Samuel Restrepo'}
          className="flex flex-row items-center gap-3 text-white cursor-pointer no-underline group bg-transparent border-0 p-0 text-left"
        >
          <span
            className="text-[21px] sm:text-[26px] tracking-tight text-white font-medium"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Samuel Restrepo®
          </span>
          <span
            className="text-[25px] sm:text-[30px] text-white select-none leading-none inline-block transition-transform duration-300 group-hover:rotate-45"
            style={{ letterSpacing: '-0.02em' }}
            aria-hidden="true"
          >
            ✳︎
          </span>

          {isAdmin && (
            <span className="ml-2 text-[10px] font-mono uppercase bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30 hidden sm:inline-block">
              Admin
            </span>
          )}
        </button>

        {/* Desktop Nav Links (center, hidden below md) */}
        <div className="hidden md:flex items-center text-[21px] lg:text-[23px] text-white">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('Todos');
              setActiveModal('projects');
            }}
            className="hover:opacity-60 transition-opacity duration-200 cursor-pointer bg-transparent border-0 text-white"
          >
            Proyectos
          </button>
          <span className="select-none">,&nbsp;</span>
          <button
            type="button"
            onClick={() => setActiveModal('about')}
            className="hover:opacity-60 transition-opacity duration-200 cursor-pointer bg-transparent border-0 text-white"
          >
            Sobre mí
          </button>

          {isAdmin && (
            <>
              <span className="select-none">,&nbsp;</span>
              <button
                type="button"
                onClick={() => {
                  setEditHeroTexts(heroTexts);
                  setActiveModal('admin');
                }}
                className="hover:opacity-60 transition-opacity duration-200 cursor-pointer bg-transparent border-0 text-white underline underline-offset-4"
              >
                Panel Admin
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden relative z-20 flex flex-col justify-center items-center gap-[5px] p-2 focus:outline-none cursor-pointer"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
        >
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 transform origin-center ${
              mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 transform origin-center ${
              mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </nav>

      {/* Mobile Overlay Menu */}
      <div
        className={`fixed inset-0 bg-black/95 backdrop-blur-lg z-[9] flex flex-col justify-center px-8 gap-8 md:hidden transition-all duration-300 ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('Todos');
            setActiveModal('projects');
            setMobileMenuOpen(false);
          }}
          className="text-[32px] font-medium text-white text-left hover:opacity-60 transition-opacity duration-200 bg-transparent border-0"
        >
          Proyectos
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveModal('about');
            setMobileMenuOpen(false);
          }}
          className="text-[32px] font-medium text-white text-left hover:opacity-60 transition-opacity duration-200 bg-transparent border-0"
        >
          Sobre mí
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditHeroTexts(heroTexts);
              setActiveModal('admin');
              setMobileMenuOpen(false);
            }}
            className="text-[28px] font-medium text-white text-left underline underline-offset-4 hover:opacity-60 transition-opacity duration-200 bg-transparent border-0"
          >
            Panel de Administrador
          </button>
        )}
      </div>

      {/* HERO SECTION */}
      <main className="relative z-[1] w-full h-screen flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden">
        <div className="max-w-xl relative z-10">
          {/* Blurred intro label: Samuel Restrepo (Editable desde Admin) */}
          <div
            className="pointer-events-none select-none mb-5 sm:mb-6 font-normal text-white"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              filter: 'blur(4px)',
            }}
          >
            {heroTexts.blurredLine1}
            <br />
            {heroTexts.blurredLine2}
          </div>

          {/* Typewriter text (Editable desde Admin) */}
          <p
            className="text-white mb-5 sm:mb-6 font-normal min-h-[54px]"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
            }}
          >
            <span>{displayed}</span>
            {!typewriterDone && (
              <span
                className="inline-block w-[2px] h-[1.1em] bg-white align-middle ml-[2px] animate-cursor-blink"
                aria-hidden="true"
              />
            )}
          </p>

          {/* Action pill buttons (Públicos) */}
          <div
            className="flex flex-wrap gap-y-1"
            style={{
              opacity: buttonsVisible ? 1 : 0,
              transform: buttonsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Todos');
                setActiveModal('projects');
              }}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Ver proyectos
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Sobre mí
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditHeroTexts(heroTexts);
                  setActiveModal('admin');
                }}
                className="inline-flex items-center justify-center bg-transparent text-white border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer"
              >
                ⚙️ Panel Administrador
              </button>
            )}
          </div>
        </div>
      </main>

      {/* PIN AUTHENTICATION MODAL (Acceso oculto con PIN: 7374) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-neutral-950 border border-white/20 rounded-2xl p-6 sm:p-7 text-white shadow-2xl animate-fade-in text-center">
            <button
              type="button"
              onClick={() => {
                setShowPinModal(false);
                setEnteredPin('');
                setPinError(false);
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-full cursor-pointer text-sm"
              aria-label="Cerrar"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 text-xl">
              🔒
            </div>

            <h3
              className="text-xl font-medium tracking-tight mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Acceso de Administrador
            </h3>
            <p className="text-xs text-white/60 mb-5">
              Panel reservado para Samuel Restrepo. Ingresa tu PIN de 4 dígitos.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="PIN..."
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  className={`w-36 mx-auto text-center tracking-[0.5em] text-2xl font-mono py-2 px-3 bg-neutral-900 border rounded-xl text-white focus:outline-none transition-colors ${
                    pinError
                      ? 'border-red-500 bg-red-950/20'
                      : 'border-white/30 focus:border-white'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-red-400 mt-2 font-medium">
                    PIN incorrecto. Inténtalo de nuevo.
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 rounded-full text-xs text-white/60 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-medium bg-white text-black hover:bg-white/90 transition-colors cursor-pointer"
                >
                  Entrar al panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PANEL (Exclusivo para el propietario con PIN: 7374) */}
      {activeModal === 'admin' && isAdmin && (
        <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-2xl flex flex-col text-white animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-12 py-5 border-b border-white/10 flex flex-wrap justify-between items-center gap-3 shrink-0 bg-neutral-900/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-green-400 bg-green-950/50 border border-green-800/60 px-2 py-0.5 rounded-full">
                  ● Propietario Autenticado
                </span>
                <span className="text-xs text-white/40">PIN: 7374</span>
              </div>
              <h2
                className="text-2xl sm:text-3xl font-medium tracking-tight mt-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Panel de Administrador · Samuel Restrepo
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreateProjectModal}
                className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-white/90 text-xs font-medium px-4 py-2 rounded-full cursor-pointer transition-colors shadow-lg"
              >
                <span>+ Subir nuevo proyecto</span>
              </button>
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-2 border border-red-900/40 rounded-full hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                Cerrar sesión
              </button>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer text-lg leading-none"
                aria-label="Cerrar panel de administración"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="px-6 sm:px-12 py-3 border-b border-white/10 flex gap-4 shrink-0 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setAdminTab('projects')}
              className={`text-sm pb-2 border-b-2 font-medium transition-colors cursor-pointer ${
                adminTab === 'projects'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              Gestión de Proyectos ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('categories')}
              className={`text-sm pb-2 border-b-2 font-medium transition-colors cursor-pointer ${
                adminTab === 'categories'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              Gestión de Categorías ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setEditHeroTexts(heroTexts);
                setAdminTab('hero');
              }}
              className={`text-sm pb-2 border-b-2 font-medium transition-colors cursor-pointer ${
                adminTab === 'hero'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              Textos de Inicio
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('cv')}
              className={`text-sm pb-2 border-b-2 font-medium transition-colors cursor-pointer ${
                adminTab === 'cv'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              CV de Samuel (PDF)
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminTab('blob');
                if (blobSyncStatus === 'idle') checkVercelBlobStatus();
              }}
              className={`text-sm pb-2 border-b-2 font-medium transition-colors cursor-pointer ${
                adminTab === 'blob'
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              Guardado en la nube
            </button>
          </div>

          {/* Admin Tab Content */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-6">
            {/* TAB 1: PROYECTOS (Subir, Modificar, Eliminar) */}
            {adminTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs sm:text-sm text-white/60">
                    Aquí puedes modificar títulos, fechas, categorías y archivos adjuntos (fotos, vídeos y PDFs), o eliminar proyectos existentes.
                  </p>
                </div>

                {projectSaveMessage && (
                  <div
                    role="status"
                    className={`rounded-lg border px-3 py-2.5 text-xs ${
                      blobSyncStatus === 'error'
                        ? 'border-red-700/60 bg-red-950/50 text-red-200'
                        : blobSyncStatus === 'syncing'
                          ? 'border-amber-700/60 bg-amber-950/50 text-amber-200'
                          : 'border-emerald-700/60 bg-emerald-950/50 text-emerald-200'
                    }`}
                  >
                    {projectSaveMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {projects.map((proj) => {
                    const photosCount = proj.media.filter((m) => m.type === 'foto').length;
                    const videosCount = proj.media.filter((m) => m.type === 'video').length;
                    const pdfsCount = proj.media.filter((m) => m.type === 'pdf').length;

                    return (
                      <div
                        key={proj.id}
                        className="bg-neutral-900/90 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-white/20 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                              {proj.category}
                            </span>
                            <span className="text-white/40">{proj.date}</span>
                          </div>
                          <h3 className="text-lg font-medium text-white">{proj.title}</h3>
                          <div className="flex gap-2 text-xs text-white/50">
                            <span>📷 {photosCount} fotos</span>
                            <span>🎬 {videosCount} vídeos</span>
                            <span>📄 {pdfsCount} PDFs</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProject(proj);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:border-white text-white/80 hover:text-white transition-colors cursor-pointer"
                          >
                            Ver contenido
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditProjectModal(proj)}
                            className="text-xs px-3.5 py-1.5 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors cursor-pointer"
                          >
                            Modificar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-800/60 text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CATEGORÍAS (Agregar y Eliminar) */}
            {adminTab === 'categories' && (
              <div className="max-w-2xl space-y-6">
                {/* Form to Add Category */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5">
                  <h3 className="text-sm font-medium uppercase font-mono tracking-wider text-white/60 mb-2">
                    Agregar nueva categoría
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. Arquitectura, Retratos, Animación..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory();
                      }}
                      className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="bg-white text-black font-medium text-xs px-5 py-2 rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
                    >
                      Añadir categoría
                    </button>
                  </div>
                </div>

                {/* List of Categories with Delete Option */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5">
                  <h3 className="text-sm font-medium uppercase font-mono tracking-wider text-white/60 mb-4">
                    Categorías activas ({categories.length})
                  </h3>
                  <div className="divide-y divide-white/10">
                    {categories.map((cat) => {
                      const count = projects.filter((p) => p.category === cat).length;
                      return (
                        <div
                          key={cat}
                          className="py-3 flex justify-between items-center text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{cat}</span>
                            <span className="text-xs font-mono text-white/40">
                              ({count} proyecto{count === 1 ? '' : 's'})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:bg-red-950/30 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EDICIÓN DE TEXTOS DEL INICIO (HERO) */}
            {adminTab === 'hero' && (
              <div className="max-w-3xl space-y-6">
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-medium uppercase font-mono tracking-wider text-white/60">
                        Personalizar Textos del Inicio
                      </h3>
                      <p className="text-xs text-white/70 mt-1">
                        Modifica los mensajes de la pantalla de inicio: el encabezado con efecto difuminado y la frase animada tipo máquina de escribir.
                      </p>
                    </div>
                  </div>

                  {heroTextSavedNotice && (
                    <div className="mb-4 mt-2 p-3 bg-green-950/60 border border-green-800 rounded-lg text-green-300 text-xs flex items-center gap-2">
                      <span className="text-base font-bold">✓</span>
                      <span>Textos de inicio actualizados y guardados correctamente.</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveHeroTexts} className="space-y-4 mt-4">
                    <div>
                      <label className="block text-xs font-medium text-white/80 mb-1">
                        Línea 1 del encabezado difuminado
                      </label>
                      <input
                        type="text"
                        required
                        value={editHeroTexts.blurredLine1}
                        onChange={(e) =>
                          setEditHeroTexts((prev) => ({
                            ...prev,
                            blurredLine1: e.target.value,
                          }))
                        }
                        placeholder="Ej. Hola, bienvenido al portafolio de"
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/80 mb-1">
                        Línea 2 del encabezado difuminado (Nombre y Especialidad)
                      </label>
                      <input
                        type="text"
                        required
                        value={editHeroTexts.blurredLine2}
                        onChange={(e) =>
                          setEditHeroTexts((prev) => ({
                            ...prev,
                            blurredLine2: e.target.value,
                          }))
                        }
                        placeholder="Ej. Samuel Restrepo · Proyectos, Fotografía & Multimedia"
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/80 mb-1">
                        Mensaje animado (Efecto Máquina de Escribir)
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editHeroTexts.typewriterText}
                        onChange={(e) =>
                          setEditHeroTexts((prev) => ({
                            ...prev,
                            typewriterText: e.target.value,
                          }))
                        }
                        placeholder="Ej. Explora mis proyectos, series fotográficas y producciones multimedia. ¿Qué proyecto revisamos hoy?"
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors resize-none"
                      />
                      <p className="text-[11px] text-white/40 mt-1 font-mono">
                        Se reproducirá progresivamente en la pantalla de inicio sobre el vídeo interactivo.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="bg-white text-black font-medium text-xs px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors cursor-pointer shadow"
                      >
                        Guardar cambios en el inicio
                      </button>
                      <button
                        type="button"
                        onClick={handleResetHeroTexts}
                        className="border border-white/20 text-white/70 hover:text-white hover:bg-white/5 font-medium text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Restablecer textos originales
                      </button>
                    </div>
                  </form>
                </div>

                {/* Previsualización en vivo */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5 sm:p-6">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white/50 mb-3">
                    Previsualización en tiempo real
                  </h4>
                  <div className="p-6 rounded-lg bg-black/80 border border-white/10 relative overflow-hidden">
                    <div
                      className="pointer-events-none select-none mb-3 font-normal text-white"
                      style={{
                        fontSize: 'clamp(15px, 2.5vw, 20px)',
                        lineHeight: 1.3,
                        filter: 'blur(3.5px)',
                      }}
                    >
                      {editHeroTexts.blurredLine1}
                      <br />
                      {editHeroTexts.blurredLine2}
                    </div>
                    <p
                      className="text-white font-normal text-sm sm:text-base"
                      style={{ lineHeight: 1.35 }}
                    >
                      {editHeroTexts.typewriterText}
                      <span className="inline-block w-[2px] h-[1em] bg-white align-middle ml-[2px] animate-cursor-blink" />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GESTIÓN DE CV (PDF) */}
            {adminTab === 'cv' && (
              <div className="max-w-3xl space-y-6">
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5">
                  <h3 className="text-sm font-medium uppercase font-mono tracking-wider text-white/60 mb-2">
                    Configuración del Curriculum Vitae (PDF)
                  </h3>
                  <p className="text-xs text-white/70 mb-4 leading-relaxed">
                    Este documento PDF es el único contenido que se mostrará a los visitantes al pulsar en <strong>"Sobre mí"</strong>.
                  </p>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-[11px] font-mono text-white/50 block">Archivo actual:</span>
                        <span className="text-xs font-mono text-white select-all break-all">{cvPdfUrl}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const path = window.prompt(
                              'Escribe la ruta del PDF dentro de public/',
                              cvPdfUrl
                            );
                            if (path?.trim()) {
                              const cleanPath = path.trim().replace(/^public\/?/i, '');
                              setCvPdfUrl(
                                cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`
                              );
                            }
                          }}
                          className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
                        >
                          Elegir ruta de PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setCvPdfUrl(DEFAULT_CV_URL)}
                          className="border border-white/20 text-white/80 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Usar ruta /cv-samuel-restrepo.pdf
                        </button>
                      </div>
                    </div>

                    <input
                      ref={cvFileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploadingMedia(true);
                          setUploadProgressText(`Subiendo CV a Vercel Blob: ${file.name}...`);
                          try {
                            const { media, isBlob } = await uploadSingleFile(file);
                            setCvPdfUrl(media.url);
                            if (isBlob) {
                              setBlobUploadNotice('✓ ¡CV PDF guardado permanentemente en Vercel Blob!');
                            } else {
                              setBlobUploadNotice('✓ CV cargado en vista previa.');
                            }
                            setTimeout(() => setBlobUploadNotice(''), 4500);
                          } catch (err) {
                            console.error('Error al subir CV:', err);
                          } finally {
                            setIsUploadingMedia(false);
                            setUploadProgressText('');
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {isUploadingMedia && (
                    <div className="p-3 bg-neutral-900 border border-white/20 rounded-xl flex items-center gap-2.5 text-xs text-white mb-3 animate-pulse">
                      <span className="text-base animate-spin">⏳</span>
                      <div>
                        <p className="font-medium text-white">Subiendo CV a Vercel Blob...</p>
                        <p className="text-[11px] text-white/60 font-mono">{uploadProgressText}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-white/50 leading-normal">
                    📁 <strong>Para incrustar directamente en carpetas:</strong> Puedes colocar o reemplazar tu archivo PDF directamente en la carpeta <code>public/cv-samuel-restrepo.pdf</code> del proyecto.
                  </p>
                </div>

                {/* Previsualización en vivo */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium uppercase font-mono tracking-wider text-white/60">
                      Previsualización en tiempo real
                    </h3>
                    <a
                      href={cvPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-white underline underline-offset-2 hover:opacity-80"
                    >
                      Abrir PDF en ventana completa ↗
                    </a>
                  </div>
                  <div className="w-full h-96 rounded-lg overflow-hidden bg-black border border-white/10">
                    <iframe
                      src={`${cvPdfUrl}#toolbar=0`}
                      title="Previsualización CV"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VERCEL BLOB (ALMACENAMIENTO AUTOMÁTICO EN LA NUBE) */}
            {adminTab === 'blob' && (
              <div className="max-w-4xl space-y-6">
                {/* Banner Principal: Cómo funciona Vercel Blob */}
                <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-black border border-white/20 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="text-3xl">☁️</span>
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-white tracking-tight">
                        ¿Cómo funciona Vercel Blob con tu página?
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full inline-block mt-1">
                        ✓ Integración nativa ya implementada en el código
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed mt-2">
                    <strong>Vercel Blob</strong> es el almacenamiento en la nube oficial de Vercel. Funciona como un disco duro global de altísima velocidad: cuando subes una foto, un vídeo o un PDF desde tu panel de administrador, el archivo <strong>no se queda atrapado en tu navegador</strong>, sino que <strong>vuela de inmediato a los servidores de Vercel Blob</strong>, generando una URL pública y permanente (<code className="text-white/90 bg-white/10 px-1 py-0.5 rounded">https://...public.blob.vercel-storage.com/...</code>).
                  </p>
                </div>

                {/* Monitor de Estado y Conexión en Tiempo Real */}
                <div
                  className={`border rounded-2xl p-5 sm:p-6 space-y-5 transition-all shadow-xl ${
                    blobSyncStatus === 'connected' || blobSyncStatus === 'synced'
                      ? 'bg-neutral-900/90 border-emerald-500/40 shadow-emerald-950/20'
                      : blobSyncStatus === 'error'
                        ? 'bg-neutral-900/90 border-red-500/40 shadow-red-950/20'
                        : blobSyncStatus === 'checking' || blobSyncStatus === 'syncing'
                          ? 'bg-neutral-900/90 border-amber-500/40 shadow-amber-950/20'
                          : 'bg-neutral-900/90 border-white/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                          Monitor de Estado en Vivo
                        </span>
                        {customBlobToken && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.2 rounded-full">
                            Token configurado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                            blobSyncStatus === 'connected' || blobSyncStatus === 'synced'
                              ? 'bg-emerald-400 animate-pulse'
                              : blobSyncStatus === 'syncing' || blobSyncStatus === 'checking'
                                ? 'bg-amber-400 animate-spin'
                                : blobSyncStatus === 'error'
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                          }`}
                        />
                        <h4 className="text-sm sm:text-base font-semibold text-white">
                          {blobSyncStatus === 'connected'
                            ? '🟢 Conectado con Vercel Blob (Almacenamiento Activo)'
                            : blobSyncStatus === 'synced'
                              ? '🟢 ¡Portfolio sincronizado con éxito en la nube!'
                              : blobSyncStatus === 'syncing'
                                ? '⏳ Sincronizando datos con Vercel Blob...'
                                : blobSyncStatus === 'checking'
                                  ? '⏳ Comprobando conexión con Vercel Blob...'
                                  : blobSyncStatus === 'error'
                                    ? '🔴 Error de conexión con Vercel Blob'
                                    : '🟡 Pendiente de conexión (Token requerido para pruebas)'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => checkVercelBlobStatus()}
                        disabled={blobSyncStatus === 'checking' || blobSyncStatus === 'syncing'}
                        className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-white/15 flex items-center gap-2 font-medium"
                      >
                        <span className={blobSyncStatus === 'checking' ? 'animate-spin' : ''}>
                          🔄
                        </span>
                        <span>
                          {blobSyncStatus === 'checking'
                            ? 'Comprobando...'
                            : 'Comprobar conexión'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => syncPortfolioToVercelBlob()}
                        disabled={blobSyncStatus === 'checking' || blobSyncStatus === 'syncing'}
                        className="bg-white text-black hover:bg-white/90 disabled:opacity-50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2"
                      >
                        <span className={blobSyncStatus === 'syncing' ? 'animate-spin' : ''}>
                          ☁️
                        </span>
                        <span>
                          {blobSyncStatus === 'syncing'
                            ? 'Sincronizando...'
                            : 'Sincronizar proyectos ahora'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Mensaje detallado del servidor */}
                  {blobSyncMessage && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-mono border leading-relaxed ${
                        blobSyncStatus === 'connected' || blobSyncStatus === 'synced'
                          ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                          : blobSyncStatus === 'error'
                            ? 'bg-red-950/40 border-red-800/50 text-red-200'
                            : blobSyncStatus === 'checking' || blobSyncStatus === 'syncing'
                              ? 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                              : 'bg-black/50 border-white/10 text-white/80'
                      }`}
                    >
                      {blobSyncMessage}
                    </div>
                  )}

                  {/* Fila de metadatos de sincronización */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-white/50 block">
                        Destino en la nube
                      </span>
                      <span className="font-mono text-white/90 truncate block mt-0.5">
                        portfolio-data.json
                      </span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-white/50 block">
                        Última sincronización
                      </span>
                      <span className="font-mono text-white/90 truncate block mt-0.5">
                        {lastSyncedTime ? `Hoy a las ${lastSyncedTime}` : 'Sin registrar'}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[10px] font-mono uppercase text-white/50 block">
                        Enlace de datos CDN
                      </span>
                      {lastSyncedUrl ? (
                        <a
                          href={lastSyncedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-400 hover:underline truncate block mt-0.5"
                        >
                          Ver JSON público ↗
                        </a>
                      ) : (
                        <span className="font-mono text-white/40 block mt-0.5">
                          Disponible tras sincronizar
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gestor y Configuración del Token de Vercel Blob */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>🔑</span>
                        <span>Token de Vercel Blob (BLOB_READ_WRITE_TOKEN)</span>
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        Conecta tu Blob Store directamente pegando tu token aquí para probarlo ahora mismo.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTokenInput(!showTokenInput)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer self-start sm:self-auto"
                    >
                      {showTokenInput ? '✕ Ocultar configuración de token' : '⚙️ Configurar o cambiar token'}
                    </button>
                  </div>

                  {showTokenInput && (
                    <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-medium text-white/90">
                          Pega tu token secreto (<code className="text-emerald-400">vercel_blob_rw_...</code>):
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTokenChars(!showTokenChars)}
                          className="text-[11px] text-white/50 hover:text-white cursor-pointer"
                        >
                          {showTokenChars ? '🙈 Ocultar' : '👁️ Ver caracteres'}
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type={showTokenChars ? 'text' : 'password'}
                          value={blobTokenInput}
                          onChange={(e) => setBlobTokenInput(e.target.value)}
                          placeholder="vercel_blob_rw_..."
                          className="flex-1 bg-neutral-950 border border-white/20 rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-white transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomToken()}
                          className="bg-white text-black hover:bg-white/90 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
                        >
                          Guardar y Comprobar
                        </button>
                        {customBlobToken && (
                          <button
                            type="button"
                            onClick={() => handleSaveCustomToken('')}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs px-3 py-2 rounded-lg border border-red-500/30 transition-colors cursor-pointer shrink-0"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/70 space-y-1.5">
                        <p>
                          💡 <strong>¿Dónde conseguirlo en Vercel?</strong>
                        </p>
                        <p className="leading-relaxed">
                          1. En Vercel, entra a tu almacén Blob (<code className="text-white/90">store_5o1b0IlqxA778RJQ</code>).
                          <br />
                          2. Haz clic en la pestaña <strong>Settings</strong> ➔ menú lateral <strong>Tokens</strong>.
                          <br />
                          3. Si no hay ninguno, haz clic en <strong>Create Token</strong> (con permisos <em>Read and Write</em>).
                          <br />
                          4. Copia el token que empieza por <code className="text-emerald-400">vercel_blob_rw_...</code> y pégalo arriba.
                        </p>
                        <p className="text-amber-300/90 text-[10px] font-mono">
                          ⚠️ Aviso: <code className="text-white">store_5o1b0IlqxA778RJQ</code> es el ID del almacén, no el token. Vercel Blob requiere el token secreto que inicia con <code className="text-emerald-300">vercel_blob_rw_</code>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flujo Automático Paso a Paso */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5 sm:p-6">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <span>⚡</span>
                    <span>¿Cómo se almacenan automáticamente tus archivos?</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                      <span className="text-xs font-mono text-emerald-400 font-semibold block mb-1">
                        PASO 1 · Subida Directa
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Al arrastrar o elegir fotos, vídeos o el CV en el admin, se envían automáticamente al endpoint <code className="text-white/90">/api/upload.ts</code> de Vercel Blob.
                      </p>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                      <span className="text-xs font-mono text-emerald-400 font-semibold block mb-1">
                        PASO 2 · CDN Permanente
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Vercel guarda el archivo en su red CDN mundial y le asigna un enlace permanente de alta velocidad (<code className="text-white/90">blob.vercel-storage.com</code>).
                      </p>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                      <span className="text-xs font-mono text-emerald-400 font-semibold block mb-1">
                        PASO 3 · Guardado Global
                      </span>
                      <p className="text-xs text-white/70 leading-relaxed">
                        Al guardar el proyecto, se actualiza automáticamente <code className="text-white/90">portfolio-data.json</code> en Vercel Blob. Todos los visitantes ven tus cambios al instante.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Los 3 Clics para Activar Vercel Blob en Vercel */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5 sm:p-6 space-y-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>🛠️</span>
                    <span>Cómo activar Vercel Blob en tu cuenta de Vercel (Solo 3 clics)</span>
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Todo el código del proyecto (frontend y endpoints serverless) ya está completamente programado y listo. Para que Vercel Blob empiece a recibir tus archivos, solo debes hacer esto en tu cuenta de Vercel:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
                      <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="text-xs text-white/80">
                        <strong>Entra a tu proyecto en Vercel:</strong> Ve a tu panel en <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-white underline underline-offset-2">vercel.com</a> y abre el proyecto de la web de Samuel Restrepo.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
                      <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="text-xs text-white/80">
                        <strong>Crea el Blob Store:</strong> En el menú superior de tu proyecto, haz clic en la pestaña <strong>Storage</strong>. Luego haz clic en <strong>Create Database</strong> y elige <strong>Blob</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10">
                      <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div className="text-xs text-white/80">
                        <strong>Conectar automáticamente:</strong> Dale clic a <strong>Continue</strong>. Vercel conectará automáticamente el Blob a tu web inyectando la variable <code className="text-emerald-400 bg-black/40 px-1 py-0.5 rounded">BLOB_READ_WRITE_TOKEN</code>.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-300">
                    💡 <strong>¡Eso es todo!</strong> No necesitas tocar código, ni configurar bases de datos complejas. A partir de ese momento, cada vez que entres como administrador a tu página y subas fotos, vídeos o proyectos, se guardarán solos en la nube permanentemente.
                  </div>
                </div>

                {/* Copia de Seguridad & Exportador */}
                <div className="bg-neutral-900 border border-white/15 rounded-xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h4 className="text-sm font-medium uppercase font-mono tracking-wider text-white/70">
                        Copias de seguridad & Exportador
                      </h4>
                      <p className="text-xs text-white/50">
                        Descarga tus proyectos en un archivo JSON o copia el código para el archivo <code>src/App.tsx</code>.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyProjectsConfig}
                        className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg hover:bg-white/90 transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <span>📋</span>
                        <span>{copiedConfigNotice ? '¡Código Copiado!' : 'Copiar código para App.tsx'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadProjectsJson}
                        className="border border-white/20 text-white/90 hover:text-white hover:bg-white/5 text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>💾</span>
                        <span>Descargar JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => jsonImportInputRef.current?.click()}
                        className="border border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>📥</span>
                        <span>Importar JSON</span>
                      </button>

                      <input
                        ref={jsonImportInputRef}
                        type="file"
                        accept="application/json"
                        onChange={handleImportProjectsJson}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {copiedConfigNotice && (
                    <div className="p-3 bg-green-950/60 border border-green-800 rounded-lg text-green-300 text-xs flex items-center gap-2">
                      <span className="font-bold">✓</span>
                      <span>
                        ¡Código copiado al portapapeles! Reemplaza la constante <code>INITIAL_PROJECTS</code> en <code>src/App.tsx</code> con este contenido.
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <pre className="bg-black/80 border border-white/10 rounded-lg p-4 text-[11px] font-mono text-white/70 max-h-48 overflow-auto whitespace-pre">
                      {`const INITIAL_PROJECTS: Project[] = ${JSON.stringify(projects, null, 2)};`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL (Título, fecha, añadir fotos, vídeos o PDF) */}
      {(activeModal === 'new_project' || activeModal === 'edit_project') && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-white/20 rounded-2xl p-6 sm:p-8 text-white shadow-2xl my-8">
            <button
              type="button"
              onClick={() => setActiveModal('admin')}
              className="absolute top-5 right-5 text-white/60 hover:text-white p-2 rounded-full cursor-pointer text-base"
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                Panel de Administrador
              </span>
              <h2
                className="text-2xl font-medium tracking-tight mt-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {editingProjectId ? 'Modificar Proyecto' : 'Subir Nuevo Proyecto'}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Define el título y la fecha, y adjunta fotografías, vídeos o archivos PDF.
              </p>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              {/* Título & Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">
                    Título del proyecto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. Campaña Visual Bogotá"
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-white/80">
                      Fecha semestral del proyecto *
                    </label>
                    <span className="text-[11px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {formDate}
                    </span>
                  </div>

                  {/* Campo editable directo */}
                  <input
                    type="text"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="Ej. 2025-2 y 2026-1 o 2025-1 a 2026-1"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-white transition-colors"
                  />

                  {/* Semestres individuales (1 clic) */}
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider block mb-1">
                      Semestre único:
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {SEMESTER_OPTIONS.map((sem) => {
                        const isSelected = formDate === sem;
                        return (
                          <button
                            key={sem}
                            type="button"
                            onClick={() => setFormDate(sem)}
                            className={`py-1.5 text-center rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-white text-black border-white shadow-sm font-semibold'
                                : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {sem}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Combinaciones y rangos comunes (1 clic) */}
                  <div>
                    <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider block mb-1">
                      Rangos y combinaciones semestrales:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        '2025-2 y 2026-1',
                        '2026-1 y 2026-2',
                        '2025-1 a 2026-1',
                        '2025-1 a 2026-2',
                        '2025-1 y 2025-2',
                      ].map((preset) => {
                        const isSelected = formDate === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFormDate(preset)}
                            className={`px-2.5 py-1 text-center rounded-full text-[11px] font-mono transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-white text-black border-white font-medium shadow-sm'
                                : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Categoría
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles, concepto o técnica del proyecto..."
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              {/* Portada (solo visible en la galería "Ver proyectos") */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="project-cover-upload" className="block text-xs font-medium text-white/80">
                    Portada del proyecto
                  </label>
                  <span className="text-[11px] text-white/50">
                    Solo se muestra en la galería de proyectos
                  </span>
                </div>

                <div className="flex gap-3 items-stretch">
                  <label
                    htmlFor="project-cover-upload"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (isUploadingCover) return;
                      handleCoverUpload(e.dataTransfer.files[0]);
                    }}
                    className={`relative w-40 shrink-0 aspect-[4/3] rounded-xl overflow-hidden border border-dashed border-white/25 bg-white/5 flex items-center justify-center text-center transition-colors ${isUploadingCover ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-white/60 hover:bg-white/10'}`}
                  >
                    {formCover ? (
                      <img
                        src={formCover}
                        alt="Portada del proyecto"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <span className="px-3 text-[11px] text-white/60">
                        {isUploadingCover ? 'Subiendo...' : 'Haz clic o arrastra una imagen'}
                      </span>
                    )}
                    {formCover && isUploadingCover && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[11px] text-white">
                        Subiendo...
                      </span>
                    )}
                    <input
                      id="project-cover-upload"
                      type="file"
                      accept="image/*"
                      disabled={isUploadingCover}
                      onChange={async (e) => {
                        await handleCoverUpload(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>

                  <div className="flex flex-col justify-between gap-2 text-[11px] text-white/60">
                    <p className="leading-relaxed">
                      Recomendado: imagen horizontal 4:3. Si no subes portada, se usará la primera foto del proyecto.
                    </p>
                    {formCover && (
                      <div className="flex gap-3">
                        <label
                          htmlFor="project-cover-upload"
                          className="text-white/80 hover:text-white underline underline-offset-2 cursor-pointer"
                        >
                          Cambiar
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormCover('')}
                          disabled={isUploadingCover}
                          className="text-red-400 hover:text-red-300 cursor-pointer disabled:opacity-40"
                        >
                          Quitar portada
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {coverError && (
                  <p className="mt-2 text-[11px] text-red-400" role="alert">
                    {coverError}
                  </p>
                )}
              </div>

              {/* Adjuntos: Fotos, Vídeos o PDFs */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-white/80">
                    Archivos del proyecto (Fotos, Vídeos o PDF)
                  </label>
                  <span className="text-[11px] font-mono text-white/50">
                    {formMediaList.length} archivo(s) seleccionado(s)
                  </span>
                </div>

                <label
                  htmlFor="project-media-upload"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (isUploadingMedia || !e.dataTransfer.files.length) return;
                    const newFiles = await processFiles(e.dataTransfer.files);
                    setFormMediaList((prev) => [...prev, ...newFiles]);
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-6 text-center transition-colors ${isUploadingMedia ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-white/60 hover:bg-white/10'}`}
                >
                  <span className="text-sm font-medium text-white">
                    {isUploadingMedia ? 'Subiendo archivos...' : 'Haz clic o arrastra tus archivos aquí'}
                  </span>
                  <span className="text-[11px] text-white/50">
                    Fotos (JPG, PNG, WEBP, GIF), vídeos (MP4, MOV, WEBM) y PDF. Puedes seleccionar varios a la vez.
                  </span>
                  <input
                    id="project-media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf"
                    disabled={isUploadingMedia}
                    onChange={async (e) => {
                      await handleMediaUpload(e);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>

                {isUploadingMedia && (
                  <p className="mt-2 text-[11px] font-mono text-white/60" aria-live="polite">
                    {uploadProgressText}
                  </p>
                )}
                {!isUploadingMedia && blobUploadNotice && (
                  <p className="mt-2 text-[11px] text-white/70" aria-live="polite">
                    {blobUploadNotice}
                  </p>
                )}

                {/* Previsualización y gestión de archivos añadidos */}
                {formMediaList.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {formMediaList.map((m, idx) => {
                      return (
                        <div
                          key={m.id}
                          className="relative rounded-lg overflow-hidden bg-neutral-900 border border-white/10 p-2.5 flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">
                                {m.type === 'foto'
                                  ? '📷'
                                  : m.type === 'video'
                                    ? '🎬'
                                    : '📄'}
                              </span>
                              <span className="text-[10px] font-mono uppercase text-white/60">
                                {m.type}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.2 rounded shrink-0">
                              #{idx + 1}
                            </span>
                          </div>
                          <p className="text-xs text-white truncate font-medium">
                            {m.name}
                          </p>
                          <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[10px]">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => moveMedia(idx, -1)}
                                disabled={idx === 0}
                                className="text-white/60 hover:text-white disabled:opacity-25 cursor-pointer"
                                aria-label="Mover archivo arriba"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveMedia(idx, 1)}
                                disabled={idx === formMediaList.length - 1}
                                className="text-white/60 hover:text-white disabled:opacity-25 cursor-pointer"
                                aria-label="Mover archivo abajo"
                              >
                                ↓
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFormMediaList((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveModal('admin')}
                  className="px-4 py-2 rounded-full text-xs font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-medium bg-white text-black hover:bg-white/90 transition-colors cursor-pointer"
                >
                  {editingProjectId ? 'Guardar cambios' : 'Publicar proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC PROJECTS GALLERY VIEW (Ver proyectos para visitantes) */}
      {activeModal === 'projects' && (
        <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-xl flex flex-col text-white animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-12 py-5 border-b border-white/10 flex justify-between items-center shrink-0">
            <div>
              <h2
                className="text-2xl sm:text-3xl font-medium tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Proyectos de Samuel Restrepo
              </h2>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                {projects.length} obras registradas · Fotos, vídeos y documentos PDF
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveModal('admin')}
                  className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-white/90 text-xs font-medium px-4 py-2 rounded-full cursor-pointer transition-colors"
                >
                  <span>Panel Administrador</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer text-lg leading-none"
                aria-label="Cerrar proyectos"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Categorías (Filtros limpios para visitantes) */}
          <div className="px-6 sm:px-12 py-3 border-b border-white/5 flex flex-wrap items-center gap-2 shrink-0 bg-white/[0.02]">
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider mr-1">
              Filtrar por:
            </span>

            {/* "Todos" button */}
            <button
              type="button"
              onClick={() => setSelectedCategory('Todos')}
              className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                selectedCategory === 'Todos'
                  ? 'bg-white text-black font-medium'
                  : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white'
              }`}
            >
              Todos ({projects.length})
            </button>

            {/* Dynamic Categories list */}
            {categories.map((cat) => {
              const count = projects.filter((p) => p.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {cat} <span className="opacity-60 text-[11px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Projects Grid */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const photosCount = project.media.filter(
                  (m) => m.type === 'foto'
                ).length;
                const videosCount = project.media.filter(
                  (m) => m.type === 'video'
                ).length;
                const pdfsCount = project.media.filter(
                  (m) => m.type === 'pdf'
                ).length;

                const coverPhoto =
                  project.cover ||
                  project.media.find((m) => m.type === 'foto')?.url ||
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

                return (
                  <div
                    key={project.id}
                    onClick={() => setActiveProject(project)}
                    className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10 cursor-pointer transition-all duration-300 hover:border-white/40 hover:-translate-y-1 flex flex-col"
                  >
                    {/* Media Cover */}
                    <div className="aspect-[4/3] w-full overflow-hidden bg-black/60 relative">
                      <img
                        src={coverPhoto}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Badges for photos, videos, and PDFs */}
                      <div className="absolute bottom-2 left-2 flex gap-1.5">
                        {photosCount > 0 && (
                          <span className="bg-black/80 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded-full font-mono flex items-center gap-1 border border-white/10">
                            📷 {photosCount}
                          </span>
                        )}
                        {videosCount > 0 && (
                          <span className="bg-black/80 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded-full font-mono flex items-center gap-1 border border-white/10">
                            🎬 {videosCount}
                          </span>
                        )}
                        {pdfsCount > 0 && (
                          <span className="bg-black/80 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded-full font-mono flex items-center gap-1 border border-white/10">
                            📄 {pdfsCount} PDF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content: Title & Date */}
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[11px] font-mono text-white/50 tracking-wider uppercase">
                            {project.category}
                          </span>
                          <span className="text-[11px] font-mono text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                            {project.date}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-white group-hover:underline underline-offset-2">
                          {project.title}
                        </h3>
                        <p className="text-white/60 text-xs mt-1.5 line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[11px] text-white/50">
                        <span>{project.media.length} archivos adjuntos</span>
                        <span className="group-hover:text-white transition-colors">
                          Explorar obra →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="py-20 text-center text-white/50">
                <p>No hay proyectos en la categoría "{selectedCategory}".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROJECT DETAIL & MEDIA VIEWER (Visualizador de Fotos, Vídeos y PDFs) */}
      {activeProject && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-neutral-950 border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0 bg-neutral-900/60">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-white/50 mb-1">
                  <span className="uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                    {activeProject.category}
                  </span>
                  <span>·</span>
                  <span>Fecha: {activeProject.date}</span>
                </div>
                <h3
                  className="text-xl sm:text-2xl font-medium tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {activeProject.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditProjectModal(activeProject)}
                      className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-medium hover:bg-white/90 transition-colors cursor-pointer"
                    >
                      Modificar proyecto
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setActiveProject(null)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer text-lg leading-none"
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Description & Media Filter Tabs */}
            <div className="px-6 py-3 border-b border-white/5 flex flex-wrap justify-between items-center gap-3 bg-white/[0.01]">
              <p className="text-xs sm:text-sm text-white/70 max-w-xl">
                {activeProject.description}
              </p>

              {/* Media Filter Tabs */}
              <div className="flex gap-1.5">
                {(['all', 'foto', 'video', 'pdf'] as const).map((type) => {
                  const count =
                    type === 'all'
                      ? activeProject.media.length
                      : activeProject.media.filter((m) => m.type === type).length;
                  const label =
                    type === 'all'
                      ? 'Todos'
                      : type === 'foto'
                      ? 'Fotos'
                      : type === 'video'
                      ? 'Vídeos'
                      : 'PDFs';
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProjectMediaFilter(type)}
                      className={`text-xs px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        projectMediaFilter === type
                          ? 'bg-white text-black font-medium'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Fotos Gallery */}
              {(projectMediaFilter === 'all' || projectMediaFilter === 'foto') &&
                activeProject.media.filter((m) => m.type === 'foto').length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-white/50 mb-3 flex items-center gap-1.5">
                      <span>📷 Fotografías</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeProject.media
                        .filter((m) => m.type === 'foto')
                        .map((m) => (
                          <div
                            key={m.id}
                            className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-white/10"
                          >
                            <button
                              type="button"
                              onClick={() => setLightboxPhoto({ url: m.url, name: m.name })}
                              className="block w-full cursor-zoom-in overflow-hidden"
                              aria-label={`Ampliar ${m.name}`}
                            >
                              <img
                                src={m.url}
                                alt={m.name}
                                className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </button>
                            <div className="p-2.5 flex justify-between items-center text-xs text-white/70 bg-neutral-950">
                              <span className="truncate">{m.name}</span>
                              <button
                                type="button"
                                onClick={() => setLightboxPhoto({ url: m.url, name: m.name })}
                                className="ml-2 shrink-0 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                aria-label={`Ver ${m.name} en grande`}
                                title="Ver en grande"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="15 3 21 3 21 9" />
                                  <polyline points="9 21 3 21 3 15" />
                                  <line x1="21" y1="3" x2="14" y2="10" />
                                  <line x1="3" y1="21" x2="10" y2="14" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Vídeos Section */}
              {(projectMediaFilter === 'all' || projectMediaFilter === 'video') &&
                activeProject.media.filter((m) => m.type === 'video').length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-white/50 mb-3 flex items-center gap-1.5">
                      <span>🎬 Vídeos</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      {activeProject.media
                        .filter((m) => m.type === 'video')
                        .map((m) => (
                          <div
                            key={m.id}
                            className="rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex flex-col"
                          >
                            <div className="bg-black flex justify-center">
                              <video
                                src={m.url}
                                controls
                                playsInline
                                preload="metadata"
                                className="block w-auto h-auto max-w-full max-h-[70vh]"
                              />
                            </div>
                            <div className="p-2.5 text-xs text-white/80 bg-neutral-950 flex justify-between items-center">
                              <span className="truncate">{m.name}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* PDFs Section */}
              {(projectMediaFilter === 'all' || projectMediaFilter === 'pdf') &&
                activeProject.media.filter((m) => m.type === 'pdf').length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-white/50 mb-3 flex items-center gap-1.5">
                      <span>📄 Documentos PDF</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeProject.media
                        .filter((m) => m.type === 'pdf')
                        .map((m) => (
                          <div
                            key={m.id}
                            className="rounded-xl p-4 bg-neutral-900 border border-white/10 flex items-center justify-between group hover:border-white/30 transition-all"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <span className="text-2xl p-2 rounded-lg bg-red-900/30 text-red-400">
                                📄
                              </span>
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">
                                  {m.name}
                                </p>
                                {m.size && (
                                  <p className="text-[11px] text-white/40">
                                    {m.size}
                                  </p>
                                )}
                              </div>
                            </div>
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                              download={m.name}
                              className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors ml-2"
                            >
                              Abrir PDF
                            </a>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-white/10 flex justify-between items-center shrink-0 bg-neutral-950">
              <span className="text-xs text-white/40">
                {activeProject.media.length} elemento(s) multimedia
              </span>
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-medium hover:bg-white/90 transition-colors cursor-pointer"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT ME MODAL: EXCLUSIVELY SAMUEL RESTREPO'S CV PDF */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="relative w-full max-w-5xl h-[92vh] bg-neutral-950 border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-5 sm:px-8 py-3.5 border-b border-white/10 flex justify-between items-center shrink-0 bg-neutral-900/70">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">📄</span>
                <div>
                  <h3
                    className="text-base sm:text-xl font-medium tracking-tight text-white leading-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Curriculum Vitae · Samuel Restrepo
                  </h3>
                  <p className="text-[11px] font-mono text-white/50">
                    Archivo: {cvPdfUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href={cvPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-white text-black px-3.5 py-1.5 rounded-full font-medium hover:bg-white/90 transition-colors"
                >
                  <span>Abrir en nueva pestaña ↗</span>
                </a>
                <a
                  href={cvPdfUrl}
                  download="CV_Samuel_Restrepo.pdf"
                  className="text-xs border border-white/20 hover:border-white text-white/80 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer text-lg leading-none"
                  aria-label="Cerrar CV"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Embedded PDF Viewer */}
            <div className="flex-1 w-full h-full bg-neutral-900 overflow-hidden relative">
              <iframe
                src={`${cvPdfUrl}#toolbar=1&navpanes=0`}
                title="Curriculum Vitae - Samuel Restrepo"
                className="w-full h-full border-0 bg-neutral-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
