const BOX = 'M14.125 16H1.875C.841 16 0 15.159 0 14.125V1.875C0 .841.841 0 1.875 0h12.25C15.159 0 16 .841 16 1.875v12.25C16 15.159 15.159 16 14.125 16z';
const BOX_OUTLINE =
  'M14.125 16H1.875C.841 16 0 15.159 0 14.125V1.875C0 .841.841 0 1.875 0h12.25C15.159 0 16 .841 16 1.875v12.25C16 15.159 15.159 16 14.125 16zM1.875 1.25c-.345 0-.625.28-.625.625v12.25c0 .345.28.625.625.625h12.25c.345 0 .625-.28.625-.625V1.875c0-.345-.28-.625-.625-.625H1.875z';
const CHECK = 'M13.466 4.729L12.534 3.896 6.754 10.351 3.399 7.162 2.538 8.068 6.826 12.144z';
const RING = 'M8 0c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z';

interface ChoiceIconProps {
  multiple: boolean;
  checked: boolean;
}

/**
 * v1's choice icons (`ActiveMultiChoiceIcon`, `DeactivateSingleChoiceIcon`, ...), filled with the filter's active and
 * inactive colors (`--filter-active`, `--filter-de-active`).
 */
export function ChoiceIcon({ multiple, checked }: ChoiceIconProps) {
  const fill = checked ? 'var(--filter-active)' : 'var(--filter-de-active)';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      {multiple ? (
        checked ? (
          <>
            <path fill={fill} d={BOX} />
            <path fill="#fff" d={CHECK} />
          </>
        ) : (
          <path fill={fill} fillRule="nonzero" d={BOX_OUTLINE} />
        )
      ) : (
        <g fill={fill}>
          <path fillRule="nonzero" d={RING} />
          {checked && <circle cx="8" cy="8" r="4" />}
        </g>
      )}
    </svg>
  );
}
