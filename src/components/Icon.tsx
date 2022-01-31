import { ForwardedRef, forwardRef, ReactElement, ReactNode } from 'react';

export interface IIconProps extends React.HTMLProps<HTMLSpanElement> {
  icon?: ReactNode;
  rotate?: number;
  spin?: boolean;
}

const DEFAULT_TAB_INDEX = -1;

const Icon = ({ icon, name, tabIndex, ...props }: IIconProps, ref: ForwardedRef<HTMLSpanElement>): ReactElement => (
  <span
    {...props}
    aria-label={name}
    ref={ref}
    role="img"
    tabIndex={typeof tabIndex === 'undefined' || props.onClick ? DEFAULT_TAB_INDEX : tabIndex}
  >
    {icon}
  </span>
);

export default forwardRef<HTMLSpanElement, IIconProps>(Icon);
