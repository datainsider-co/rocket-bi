import { TitleBlock, type TitleBlockProps } from './TitleBlock';

/** v1 `TitleTab`: the title and subtitle's text and style. */
export function TitleTab(props: Omit<TitleBlockProps, 'name'>) {
  return (
    <div className="settings-stack">
      <TitleBlock {...props} name="title" />
      <TitleBlock {...props} name="subtitle" />
    </div>
  );
}
