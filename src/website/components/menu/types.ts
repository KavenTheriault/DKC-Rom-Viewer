export interface MenuItem<ValueType> {
  fasIcon?: string;
  label: string;
  value: ValueType;
}

export interface MenuGroup<ValueType> {
  label: string;
  items: MenuItem<ValueType>[];
}
