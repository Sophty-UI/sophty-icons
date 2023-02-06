// eslint-disable-next-line node/no-unpublished-import
import camelcase from 'camelcase';
import { promises as fs } from 'fs';
import path from 'path';
// eslint-disable-next-line node/no-unpublished-import
import { ElementNode, Node, parse } from 'svg-parser';

const INPUT_DIR = 'src/icons';
const OUTPUT_DIR = 'src/components/__generated__';
const ICON_TEMPLATE = `
// GENERATE BY ./src/scripts/build.ts
// DON NOT EDIT IT MANUALLY
import { ForwardedRef, forwardRef } from 'react';

import Icon, { IIconProps } from '../Icon';

const <%= name %> = (props: IIconProps, ref: ForwardedRef<HTMLSpanElement>) => (
  <Icon {...props} ref={ref} aria-label="<%= aria %>" box="<%= box %>">
    <%= component %>
  </Icon>
);

export default forwardRef<HTMLSpanElement, IIconProps>(<%= name %>);
`;

const parseIcon = async (
  fileName: string
): Promise<{ aria: string; box: string; children: (string | Node)[]; name: string }> => {
  const data = await fs.readFile(path.join(INPUT_DIR, fileName), 'utf-8');
  const basename = path.basename(fileName, path.extname(fileName));
  const name = `${camelcase(basename, { pascalCase: true })}Icon`;
  const [node] = parse(data).children as [ElementNode];

  return { name, children: node.children, aria: basename, box: (node.properties?.viewBox ?? '0 0 24 24').toString() };
};

const renderTree = (node: string | Node): string => {
  if (typeof node === 'string') return node;
  if (!('properties' in node) || !node.tagName) return '';

  const { properties, tagName } = node;
  const props: [string, string | number | boolean][] = Object.entries(properties ?? {});

  return `<${tagName} ${props
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => (value === true ? `${name}` : `${name}="${value.toString()}"`))
    .join(' ')}>${node.children.map(child => renderTree(child)).join('')}</${tagName}>`;
};

void (async () => {
  const files = await fs.readdir(INPUT_DIR);
  const icons = await Promise.all(files.map(parseIcon));

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await Promise.all([
    ...icons.map(({ name, children, box, aria }) =>
      fs.writeFile(
        path.join(OUTPUT_DIR, `${name}.tsx`),
        ICON_TEMPLATE.replace(/<%= name %>/gi, name)
          .replace(/<%= box %>/gi, box)
          .replace(/<%= aria %>/gi, aria)
          .replace(/<%= component %>/gi, children.map(renderTree).join(''))
      )
    ),
    fs.writeFile(
      path.join(OUTPUT_DIR, 'index.ts'),
      icons.map(({ name }) => `export { default as ${name} } from './${name}';`).join('\n')
    ),
  ]);
})();
