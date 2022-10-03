export interface CommonPermissionProvider {
  all(): string;

  view(): string;

  create(): string;

  edit(): string;

  delete(): string;
}
