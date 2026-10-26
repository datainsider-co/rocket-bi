import { DirectoryType } from '@/core/directory/Directory';
import type { Directory } from '@/core/directory/Directory';

const ICON_URLS: Record<DirectoryType, string> = {
  [DirectoryType.Directory]: '/directory/directory.svg',
  [DirectoryType.Dashboard]: '/directory/dashboard.svg',
  [DirectoryType.Query]: '/directory/query.svg'
};

/** Type icon, name and a star when starred. Sizes are v1's `.directory-name-cell` (`table-cell-utils.scss`). */
export function DirectoryNameCell({ directory }: { directory: Directory }) {
  return (
    <span className="flex min-w-0 items-center">
      <img
        src={ICON_URLS[directory.directoryType] ?? ICON_URLS.directory}
        alt=""
        width={24}
        height={24}
        className="mr-4 shrink-0"
      />
      <span className="truncate leading-[1.4] font-medium tracking-[0.6px] text-[color:var(--directory-name-color,inherit)]">
        {directory.name}
      </span>
      {directory.isStarred && <i className="di-icon-star-fill ml-3 text-base" aria-label="Starred" />}
    </span>
  );
}
