import type { ISystemComponentGroup } from '../SystemComponentsTable/types';

export interface ISystemComponentsPrintProps {
  productName?: string;
  groups: ISystemComponentGroup[];
}
