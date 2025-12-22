export interface MainMenuItem {
  label: string;
  fasIcon?: string;
}

export interface MainMenuGroup {
  label: string;
  items: MainMenuItem[];
}
