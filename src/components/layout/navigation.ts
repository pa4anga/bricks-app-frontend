import { INTERNAL_DASHBOARD_ROUTE, INTERNAL_ROUTE_PREFIX } from '@/constants/routes';

export interface INavLink {
  label: string;
  href: string;
  external?: boolean;
}

export const navLinks: INavLink[] = [
  { label: 'Общи условия', href: '/terms' },
  { label: 'Защита на личните данни', href: 'https://wienerberger.bg/zashtita-lichni-danni', external: true },
  { label: 'Импресум', href: '/impresum' },
  { label: 'Бисквитки', href: '/cookies' },
  { label: 'Wienerberger.com', href: 'https://wienerberger.com/', external: true },
];

export interface INavbarItem {
  label: string;
  href: string;
}

export interface INavbarSection {
  label: string;
  items: INavbarItem[];
}

export const navbarSections: INavbarSection[] = [
  {
    label: 'Продукти',
    items: [
      { label: 'Тухли и блокове', href: '/prices/bricks' },
      { label: 'Тротоарни настилки', href: '/prices/pavement' },
      { label: 'Керемиди', href: '/prices/roof-tiles' },
    ],
  },
  {
    label: 'Акаунти',
    items: [
      { label: 'Всички акаунти', href: '/internal/accounts' },
      { label: 'Създаване на акаунт', href: '/internal/accounts/new' },
    ],
  },
  {
    label: 'Производствени бази',
    items: [
      { label: 'Всички производствени бази', href: '/internal/source-locations' },
      { label: 'Създаване на производствена база', href: '/internal/source-locations/new' },
    ],
  },
  {
    label: 'Категории надценка',
    items: [
      { label: 'Всички категории надценка', href: '/internal/fee-categories' },
      { label: 'Създаване на категория надценка', href: '/internal/fee-categories/new' },
    ],
  },
  {
    label: 'Населени места',
    items: [
      { label: 'Всички населени места', href: '/internal/settlements' },
      { label: 'Създаване на населено място', href: '/internal/settlements/new' },
    ],
  },
  {
    label: 'Локации',
    items: [
      { label: 'Всички локации', href: '/internal/locations' },
      { label: 'Създаване на локация', href: '/internal/locations/new' },
    ],
  },
  {
    label: 'Продуктов каталог',
    items: [
      { label: 'Тухли', href: '/internal/products/bricks' },
      { label: 'Покриви', href: '/internal/products/roofs' },
      { label: 'Настилки', href: '/internal/products/pavements' },
    ],
  },
  {
    label: 'Данни',
    items: [
      { label: 'Импорт и експорт', href: '/internal/data' },
      { label: 'Качване на изображение', href: '/internal/images/upload' },
      { label: 'Настройки', href: '/internal/config' },
    ],
  },
  {
    label: 'Ресурси',
    items: [
      { label: 'Документи', href: '/terms' },
      { label: 'Технически ръководства', href: '/impresum' },
      { label: 'Често задавани въпроси', href: '/cookies' },
    ],
  },
];

export interface INavbarSubsection {
  label: string;
  items: INavbarItem[];
}

export interface INavbarDropdownGroup {
  label: string;
  subsections: INavbarSubsection[];
}

export interface INavbarLinkGroup {
  label: string;
  href: string;
}

export type INavbarGroup = INavbarDropdownGroup | INavbarLinkGroup;

export const isNavbarLinkGroup = (group: INavbarGroup): group is INavbarLinkGroup => 'href' in group;

const INTERNAL_GROUP_DEFINITIONS: { label: string; sections: string[] }[] = [
  { label: 'Продуктов каталог', sections: ['Продуктов каталог'] },
  { label: 'Локации', sections: ['Локации', 'Производствени бази', 'Населени места'] },
  { label: 'Настройки', sections: ['Акаунти', 'Категории надценка', 'Данни'] },
];

const sectionByLabel = new Map(navbarSections.map(section => [section.label, section]));

const internalDropdownGroups: INavbarDropdownGroup[] = INTERNAL_GROUP_DEFINITIONS.map(group => ({
  label: group.label,
  subsections: group.sections
    .map(sectionLabel => ({
      label: sectionLabel,
      items: (sectionByLabel.get(sectionLabel)?.items ?? []).filter(item =>
        item.href.startsWith(INTERNAL_ROUTE_PREFIX)
      ),
    }))
    .filter(subsection => subsection.items.length > 0),
})).filter(group => group.subsections.length > 0);

export const internalNavbarGroups: INavbarGroup[] = [
  { label: 'Табло', href: INTERNAL_DASHBOARD_ROUTE },
  ...internalDropdownGroups,
];
