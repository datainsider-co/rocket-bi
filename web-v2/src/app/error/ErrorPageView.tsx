import { Button, Flex, Result, Typography } from 'antd';
import type { ErrorPageContent } from './errorPage.utils';

interface ErrorPageViewProps {
  content: ErrorPageContent;
  showDetail: boolean;
  onGoHome: () => void;
  onReload: () => void;
}

export function ErrorPageView({ content, showDetail, onGoHome, onReload }: ErrorPageViewProps) {
  return (
    <Flex vertical align="center" style={{ padding: 24 }}>
      <Result
        status={content.status}
        title={content.title}
        subTitle={content.description}
        extra={[
          <Button key="home" type="primary" onClick={onGoHome}>
            Back to home
          </Button>,
          content.status === '500' && (
            <Button key="reload" onClick={onReload}>
              Reload
            </Button>
          )
        ]}
      />
      {showDetail && content.detail && (
        <Typography.Paragraph code style={{ maxWidth: 900, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
          {content.detail}
        </Typography.Paragraph>
      )}
    </Flex>
  );
}
