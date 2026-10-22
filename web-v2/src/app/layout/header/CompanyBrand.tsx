import { Link } from 'react-router';
import { DEFAULT_LOGO_URL } from './header.utils';
import type { HeaderBrand } from './header.types';

/** v1 `CompanyLogoNameComponent`: the organization's logo and name, linking home. */
export function CompanyBrand({ brand }: { brand: HeaderBrand }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-4 text-white no-underline hover:text-white">
      <img
        src={brand.logoUrl || DEFAULT_LOGO_URL}
        onError={event => {
          event.currentTarget.src = DEFAULT_LOGO_URL;
        }}
        alt=""
        width={40}
        height={40}
        className="shrink-0 object-contain select-none"
      />
      <span className="truncate text-[22px] leading-[42px] font-semibold select-none">{brand.name}</span>
    </Link>
  );
}
