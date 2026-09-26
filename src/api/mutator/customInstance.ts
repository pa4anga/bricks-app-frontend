import type { AxiosRequestConfig } from 'axios';

import { AXIOS_INSTANCE } from '@/api/axiosInstance';

export const customInstance = async <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  const { data } = await AXIOS_INSTANCE({ ...config, ...options });
  return data;
};

export default customInstance;
