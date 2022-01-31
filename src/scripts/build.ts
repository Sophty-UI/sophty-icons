// eslint-disable-next-line node/no-unpublished-import
import camelcase from 'camelcase';
import { promises as fs } from 'fs';
import path from 'path';
// eslint-disable-next-line node/no-unpublished-import
import { Node, parse } from 'svg-parser';

const INPUT_DIR = 'src/icons';
const OUTPUT_DIR = 'src/components/__generated__';
const ICON_TEMPLATE = `
// GENERATE BY ./src/scripts/build.ts
// DON NOT EDIT IT MANUALLY
import { ForwardedRef, forwardRef } from 'react';

import Icon, { IIconProps } from '../Icon';

const <%= name %> = (props: IIconProps, ref: ForwardedRef<HTMLSpanElement>) => (
  <Icon
    {...props}
    ref={ref}
    icon={
      <%= component %>
    }
  />
);

export default forwardRef<HTMLSpanElement, IIconProps>(<%= name %>);
`;

const parseIcon = async (fileName: string): Promise<{ name: string; tree: Node }> => {
  const data = await fs.readFile(path.join(INPUT_DIR, fileName), 'utf-8');
  const name = `${camelcase(path.basename(fileName, path.extname(fileName)), { pascalCase: true })}Icon`;
  const [tree] = parse(data).children;

  return { name, tree };
};

const renderTree = (node: Node | string): string => {
  if (typeof node === 'string') return node;
  if (!('properties' in node) || !node.tagName) return '';

  const tag = node.tagName;
  const props: [string, string | number | boolean][] = Object.entries(node.properties ?? {}).filter(
    ([key]) => key !== 'fill'
  );

  if (tag === 'svg') {
    props.push(['fill', 'currentColor']);
    props.push(['aria-hidden', true]);
    props.push(['focusable', false]);
  }

  return `<${tag} ${props
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => (value === true ? `${name}` : `${name}="${value.toString()}"`))
    .join(' ')}>${node.children.map(child => renderTree(child)).join('')}</${tag}>`;
};

void (async () => {
  const files = await fs.readdir(INPUT_DIR);
  const icons = await Promise.all(files.map(parseIcon));

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all(
    icons.map(({ name, tree }) =>
      fs.writeFile(
        path.join(OUTPUT_DIR, `${name}.tsx`),
        ICON_TEMPLATE.replace(/<%= name %>/gi, name).replace(/<%= component %>/gi, renderTree(tree))
      )
    )
  );
})();
