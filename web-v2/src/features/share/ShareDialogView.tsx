import type { ShareLinkSectionProps } from './link/ShareLinkSection';
import { ShareLinkSection } from './link/ShareLinkSection';
import type { SharePeopleSectionProps } from './people/SharePeopleSection';
import { SharePeopleSection } from './people/SharePeopleSection';

interface ShareDialogViewProps {
  peopleSection: SharePeopleSectionProps;
  /** Absent when the resource has no link. */
  linkSection?: ShareLinkSectionProps;
}

/** The dialog's two cards, 8px apart (v1 `DiShareModal` header and footer). */
export function ShareDialogView({ peopleSection, linkSection }: ShareDialogViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <SharePeopleSection {...peopleSection} />
      {linkSection && <ShareLinkSection {...linkSection} />}
    </div>
  );
}
