export interface ISystemComponentRow {
  label: string;
  pricePerUnit?: string;
  pricePerSquareMeter?: string;
}

export interface ISystemComponentGroup {
  label: string;
  rows: ISystemComponentRow[];
}

export interface ISystemComponentsTableProps {
  groups: ISystemComponentGroup[];
}
