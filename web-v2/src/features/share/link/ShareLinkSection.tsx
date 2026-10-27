import { TeamOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Select, Skeleton, Typography } from 'antd';
import { ShareLevel } from '@/core/share/shareLevel';
import type { LevelOption } from '../share.utils';
import { linkSummary } from '../share.utils';
import { SectionHeader } from '../SectionHeader';
import { ShareCard } from '../ShareCard';
import type { SectionActions } from '../SectionFooter';
import { SectionFooter } from '../SectionFooter';
import { OptionRow } from './OptionRow';
import type { PasswordState } from './PasswordProtectionView';
import { PasswordProtectionView } from './PasswordProtectionView';

export interface LinkState {
  /** The link with its token; absent until there is one. */
  url?: string;
  level: ShareLevel;
  isLoading: boolean;
  error?: string;
  onLevelChange: (level: ShareLevel) => void;
  onCopy: (text: string) => void;
}

export interface ShareLinkSectionProps {
  expanded: boolean;
  onExpand: () => void;
  link: LinkState;
  levels: readonly LevelOption[];
  /** Offered to the owner of a dashboard or query. */
  password?: PasswordState;
  /** The iframe to copy, for dashboards. */
  embedCode?: string;
  actions: SectionActions;
}

/** "Get link" (v1 `ShareAnyone`). */
export function ShareLinkSection({ expanded, onExpand, link, levels, password, embedCode, actions }: ShareLinkSectionProps) {
  const { url, onCopy } = link;
  const copyLink = url ? (
    <Button type="link" className="px-2 text-base" onClick={() => onCopy(url)}>
      Copy link
    </Button>
  ) : undefined;

  if (!expanded) {
    return (
      <ShareCard label="Get link" onExpand={onExpand} aside={copyLink}>
        <SectionHeader icon="link" title="Get link" active={false} />
        <Typography.Text type="secondary" className="text-base tracking-[0.27px]">
          {linkSummary(link.level)}
        </Typography.Text>
      </ShareCard>
    );
  }
  return (
    <ShareCard label="Get link">
      <SectionHeader icon="link" title="Get link" active />
      {link.error ? (
        <Alert type="error" showIcon title={link.error} />
      ) : link.isLoading || !url ? (
        <Skeleton.Input active block size="large" />
      ) : (
        <div className="flex items-center gap-2">
          <Input readOnly variant="filled" size="large" aria-label="Link" value={url} className="text-[#8e8e93]" />
          {copyLink}
        </div>
      )}
      <OptionRow
        icon={<TeamOutlined />}
        title="Anyone with the link"
        description={linkSummary(link.level)}
        control={
          <Select
            aria-label="Access of anyone with the link"
            className="w-[170px]"
            variant="filled"
            size="large"
            disabled={!url}
            value={link.level}
            options={levels.map(option => ({ value: option.value, label: option.label }))}
            onChange={link.onLevelChange}
          />
        }
      />
      {password && <PasswordProtectionView {...password} />}
      {embedCode && url && (
        <div>
          <Button icon={<i className="di-icon-embed" />} onClick={() => onCopy(embedCode)}>
            Copy embed code
          </Button>
        </div>
      )}
      <SectionFooter {...actions} />
    </ShareCard>
  );
}
