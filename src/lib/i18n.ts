export const locales = ['de', 'en'] as const;
export type Locale = typeof locales[number];
export function asLocale(locale?: string): Locale { return locale === 'en' ? 'en' : 'de'; }
export function localeHome(locale: Locale): string { return locale === 'en' ? '/en/' : '/'; }
export function localizedAppHref(id: string, locale: Locale): string {
  return id === 'welcome' ? localeHome(locale) : `${localeHome(locale)}apps/${id}/`;
}
export const otherLocale = (locale: Locale): Locale => locale === 'en' ? 'de' : 'en';
export const ui = {
  de: {
    siteTitle: 'Silas Kruckenberg Personal Computer',
    description: 'Silas’ persönlicher Schreibtisch. Arbeit, Gedanken und eine kleine Welt zum Entdecken.',
    computer: 'Silas’ persönlicher Computer', menu: 'Computer-Menü', home: 'Zurück zum Schreibtisch',
    desktop: 'Schreibtisch', file: 'Datei', view: 'Ansicht', changeWallpaper: 'Hintergrund wechseln',
    closeAll: 'Fenster schließen', apps: 'Apps', back: 'Zurück', close: 'Schließen',
    path: 'Dateipfad', emptyFolder: 'Dieser Ordner ist noch leer.', emptyPage: 'Hier entsteht etwas Neues.',
    imageViewer: 'Bildansicht', closeImage: 'Bildansicht schließen', video: 'Video',
    language: 'Sprache', contents: 'Inhalt', dateLocale: 'de-DE',
    mobileHome: 'Home', sceneLoading: 'Computer wird gestartet …', sceneError: '3D-Ansicht nicht verfügbar. Der Schreibtisch funktioniert trotzdem.',
    sceneRetry: 'Erneut versuchen', viewComputer: 'Computer ansehen', viewScreen: 'Zum Bildschirm',
    switchTo: 'English', switchLabel: 'Switch to English', closeWindow: (title: string) => `${title} schließen`,
    zoomWindow: (title: string) => `${title} vergrößern oder verkleinern`,
    folderContents: (title: string) => `In ${title}`,
  },
  en: {
    siteTitle: 'Silas Kruckenberg Personal Computer',
    description: 'Silas’ personal desktop. Work, thoughts and a small world to explore.',
    computer: 'Silas’ personal computer', menu: 'Computer menu', home: 'Back to desktop',
    desktop: 'Desktop', file: 'File', view: 'View', changeWallpaper: 'Change wallpaper',
    closeAll: 'Close windows', apps: 'Apps', back: 'Back', close: 'Close',
    path: 'File path', emptyFolder: 'This folder is still empty.', emptyPage: 'Something new is taking shape here.',
    imageViewer: 'Image viewer', closeImage: 'Close image viewer', video: 'Video',
    language: 'Language', contents: 'Contents', dateLocale: 'en-GB',
    mobileHome: 'Home', sceneLoading: 'Starting computer …', sceneError: '3D view unavailable. The desktop still works.',
    sceneRetry: 'Try again', viewComputer: 'View computer', viewScreen: 'Back to screen',
    switchTo: 'Deutsch', switchLabel: 'Auf Deutsch wechseln', closeWindow: (title: string) => `Close ${title}`,
    zoomWindow: (title: string) => `Maximize or restore ${title}`,
    folderContents: (title: string) => `Inside ${title}`,
  },
} as const;
export function strings(locale: Locale) { return ui[locale]; }
