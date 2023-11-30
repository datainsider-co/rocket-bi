export interface ContextMenuItem {
  /**
   * Using <i> tag for rendering icon
   * Refer icon than iconSrc if both are provided
   */
  icon?: string;
  /**
   * Render icon using <img> tag
   * Refer icon than iconSrc if both are provided
   */
  iconSrc?: string;

  text?: string;
  divider?: string;
  disabled?: boolean;
  cursor?: string;
  textColor?: string;
  click?: (event: MouseEvent) => void;
  id?: string;
  hidden?: boolean;
  children?: ContextMenuItem[];
  // show checked icon, refer render children than checked if both are provided
  active?: boolean;
}
