export interface MenuItemDef {
    label: string;
    icon?: string;
    hotkey?: string;
    action?: () => void;
    disabled?: boolean;
    checked?: boolean;
    divider?: boolean;
    children?: MenuItemDef[];
}

export interface MenuGroupDef {
    title: string;
    items: MenuItemDef[];
}