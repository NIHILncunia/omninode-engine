import { icons as gameIcons } from '@iconify-json/game-icons';
import { icons as lucideIcons } from '@iconify-json/lucide';
import { icons as mdiIcons } from '@iconify-json/mdi';
import { icons as simpleIcons } from '@iconify-json/simple-icons';
import type { IconifyJSON } from '@iconify/types';

export const iconSets = {
  'game-icons': gameIcons,
  lucide: lucideIcons,
  mdi: mdiIcons,
  'simple-icons': simpleIcons,
} satisfies Record<string, IconifyJSON>;

export type IconPrefix = keyof typeof iconSets;
