import { icons as gameIcons } from '@iconify-json/game-icons';
import { icons as lucideIcons } from '@iconify-json/lucide';
import { icons as mdiIcons } from '@iconify-json/mdi';
import { icons as simpleIcons } from '@iconify-json/simple-icons';

import {
  mkdir,
  writeFile,
} from 'node:fs/promises';

import { resolve } from 'node:path';
import type { IconifyJSON } from '@iconify/types';

const iconSets = {
  'game-icons': gameIcons,
  lucide: lucideIcons,
  mdi: mdiIcons,
  'simple-icons': simpleIcons,
};

function getIconNames(iconSet: IconifyJSON) {
  return [
    ...Object.keys(iconSet.icons),
    ...Object.keys(iconSet.aliases ?? {}),
  ];
}

function createUnionType(
  typeName: string,
  prefix: string,
  iconSet: IconifyJSON,
): string {
  const names = getIconNames(iconSet)
    .sort((a: string, b: string): number => a.localeCompare(b));

  const values = names
    .map((name: string): string => `  | '${prefix}:${name}'`)
    .join('\n');

  return `export type ${typeName} =\n${values};`;
}

const typeBlocks = [
  createUnionType(
    'GameIconName',
    'game-icons',
    iconSets['game-icons'],
  ),

  createUnionType(
    'LucideIconName',
    'lucide',
    iconSets.lucide,
  ),

  createUnionType(
    'MdiIconName',
    'mdi',
    iconSets.mdi,
  ),

  createUnionType(
    'SimpleIconName',
    'simple-icons',
    iconSets['simple-icons'],
  ),
];

const output = `/**
 * 이 파일은 자동 생성됩니다.
 * 직접 수정하지 마십시오.
 */

${typeBlocks.join('\n\n')}

export type UiIconName =
  | GameIconName
  | LucideIconName
  | MdiIconName
  | SimpleIconName;
`;

const outputDirectory = resolve(
  process.cwd(),
  'app/types',
);

const outputFile = resolve(
  outputDirectory,
  'icon.generated.ts',
);

await mkdir(outputDirectory, {
  recursive: true,
});

await writeFile(
  outputFile,
  output,
  'utf8',
);

console.log(
  `[icons] 타입 파일 생성 완료: ${outputFile}`,
);
