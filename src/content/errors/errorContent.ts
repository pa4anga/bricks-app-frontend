import type { IErrorContent } from './types';

export const errorContentMap: Partial<Record<number, IErrorContent>> = {
  400: {
    statusCode: 400,
    title: 'Невалидна заявка',
    description: 'Заявката не може да бъде обработена. Моля, проверете въведените данни и опитайте отново.',
  },
  401: {
    statusCode: 401,
    title: 'Необходима е автентикация',
    description: 'За да продължите, е необходимо да влезете в профила си.',
  },
  403: {
    statusCode: 403,
    title: 'Достъпът е отказан',
    description: 'Нямате права за достъп до тази страница.',
  },
  404: {
    statusCode: 404,
    title: 'Страницата не е намерена',
    description: 'Страницата, която търсите, не съществува или е преместена.',
  },
  409: {
    statusCode: 409,
    title: 'Конфликт',
    description: 'Заявката е в конфликт с текущото състояние на данните.',
  },
  413: {
    statusCode: 413,
    title: 'Заявката е твърде голяма',
    description: 'Изпратените данни надвишават допустимия размер.',
  },
  422: {
    statusCode: 422,
    title: 'Невалидни данни',
    description: 'Изпратените данни не могат да бъдат обработени. Моля, проверете ги и опитайте отново.',
  },
  429: {
    statusCode: 429,
    title: 'Твърде много заявки',
    description: 'Изпратихте твърде много заявки за кратко време. Моля, опитайте отново по-късно.',
  },
  500: {
    statusCode: 500,
    title: 'Възникна грешка в сървъра',
    description: 'Нещо се обърка от наша страна. Моля, опитайте отново по-късно.',
  },
  502: {
    statusCode: 502,
    title: 'Проблем със сървъра',
    description: 'Сървърът получи невалиден отговор. Моля, опитайте отново по-късно.',
  },
  503: {
    statusCode: 503,
    title: 'Услугата е временно недостъпна',
    description: 'Услугата е временно недостъпна. Моля, опитайте отново по-късно.',
  },
  504: {
    statusCode: 504,
    title: 'Сървърът не отговори навреме',
    description: 'Заявката отне твърде дълго време. Моля, опитайте отново по-късно.',
  },
};

export const fallbackErrorContent: IErrorContent = {
  statusCode: 0,
  title: 'Възникна грешка',
  description: 'Възникна неочаквана грешка. Моля, опитайте отново по-късно.',
};

export const getErrorContent = (statusCode: number): IErrorContent =>
  errorContentMap[statusCode] ?? { ...fallbackErrorContent, statusCode };
