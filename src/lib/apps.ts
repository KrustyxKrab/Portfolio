import { getCollection, type CollectionEntry } from 'astro:content';
import { localizedAppHref, type Locale } from './i18n';

export type AppId = string;
export type App = {
  id: AppId;
  title: string;
  icon: string;
  href: string;
  parent?: string;
  nav: boolean;
  deskIcon: boolean;
  desktopX?: number;
  desktopY?: number;
  width: number;
  height: number;
  data: CollectionEntry<'windows'>['data'];
  entry: CollectionEntry<'windows'> | CollectionEntry<'windowTranslations'>;
};

// Keep file IDs independent of public slugs so duplicates cannot overwrite data.
export function slugFromFilename(filename: string): string {
  return filename
    .toLowerCase().replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function appHref(id: AppId, locale: Locale = 'de'): string {
  return localizedAppHref(id, locale);
}

/** Build-time manifest: the Markdown folder is the only app registry. */
export async function getApps(locale: Locale = 'de'): Promise<App[]> {
  const entries = await getCollection('windows', ({ data }) => !data.draft);
  const translations = locale === 'en' ? await getCollection('windowTranslations') : [];
  const overrides = new Map(translations.map(entry => [entry.id, entry]));
  const apps = entries.flatMap(base => {
    const translated = overrides.get(base.id);
    if (translated?.data.draft) return [];
    // Untranslated body falls back to the base text.
    const entry = translated?.body?.trim() ? translated : base;
    const data = { ...base.data, ...translated?.data };
    // Public identity is shared by both locales, independent of translation text.
    data.slug = base.data.slug;
    data.parent = base.data.parent;
    const id = base.data.slug ?? slugFromFilename(base.id);
    return [{
      id, title: data.title, icon: data.icon, href: appHref(id, locale),
      parent: data.parent,
      nav: data.nav ?? (!data.parent && id !== 'welcome'),
      deskIcon: data.deskIcon ?? (!data.parent && id !== 'welcome'),
      desktopX: data.desktopX, desktopY: data.desktopY,
      width: data.width, height: data.height, data, entry,
    }];
  });
  const byId = new Map<string, App>();
  for (const app of apps) {
    if (!app.id) throw new Error(`Add a valid slug to ${app.entry.filePath ?? app.entry.id}.`);
    const duplicate = byId.get(app.id);
    if (duplicate) {
      throw new Error(`Duplicate slug "${app.id}": ${duplicate.entry.id} and ${app.entry.id}. Give one file a unique slug.`);
    }
    byId.set(app.id, app);
  }
  for (const app of apps) {
    const visited = new Set([app.id]);
    let parent = app.parent;
    while (parent) {
      if (visited.has(parent)) throw new Error(`Circular parent in "${app.entry.id}": ${parent}.`);
      visited.add(parent);
      const ancestor = byId.get(parent);
      parent = ancestor?.parent;
    }
  }
  // Deleting/unpublishing a folder also hides its descendants. They can be
  // restored or moved by updating their parent; no broken cards or routes.
  const hasPublishedParents = (app: App): boolean => {
    if (!app.parent) return true;
    const parent = byId.get(app.parent);
    return Boolean(parent && hasPublishedParents(parent));
  };
  return apps.filter(hasPublishedParents).sort((a, b) =>
    a.data.order - b.data.order || a.title.localeCompare(b.title, locale));
}
