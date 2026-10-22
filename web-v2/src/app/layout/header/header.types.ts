/** The signed-in user as the header shows it, and what the header can do with the account. */
export interface HeaderAccount {
  displayName: string;
  avatarUrl: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export interface HeaderTheme {
  isDark: boolean;
  onToggle: () => void;
}

export interface HeaderBrand {
  name: string;
  logoUrl: string;
}
