import type { EndingDefinition, StoryNode } from '../../types/game';

import shsYear1 from './shs_year1.json';
import shsYear2 from './shs_year2.json';
import collegeYear1 from './college_year1.json';
import collegeYear2 from './college_year2.json';
import collegeYear3 from './college_year3.json';
import collegeYear4 from './college_year4.json';
import eventsRandom from './events_random.json';
import endingsData from './endings.json';

import sideBarkada from './arcs_side/barkada.json';
import sideCrush from './arcs_side/crush.json';
import sideFamily from './arcs_side/family.json';
import sideOrg from './arcs_side/org.json';
import sideThesis from './arcs_side/thesis.json';

import courseBsit from './arcs_course/bsit.json';
import courseBscs from './arcs_course/bscs.json';
import courseNursing from './arcs_course/nursing.json';
import courseEducation from './arcs_course/education.json';
import courseEngineering from './arcs_course/engineering.json';
import courseCriminology from './arcs_course/criminology.json';
import courseBsba from './arcs_course/bsba.json';
import courseHospitality from './arcs_course/hospitality.json';
import coursePsychology from './arcs_course/psychology.json';
import expandedMilestones from './expanded_milestones.json';
import expandedChallenges from './expanded_challenges.json';

/**
 * Central bundled story registry.
 * Everything is imported directly at build time so it works 100% offline
 * (including in single-file `file://` builds and Capacitor Android APKs).
 *
 * To add a new chapter, side arc, or course arc:
 * 1. Create a JSON file matching `StoryNode[]`
 * 2. Import and include it in `ALL_BASE_STORY_NODES` below
 * 3. Run `npm run validate-story` to verify zero dead ends or bad asset IDs
 */
export const ALL_BASE_STORY_NODES: StoryNode[] = [
  ...(shsYear1 as StoryNode[]),
  ...(shsYear2 as StoryNode[]),
  ...(collegeYear1 as StoryNode[]),
  ...(collegeYear2 as StoryNode[]),
  ...(collegeYear3 as StoryNode[]),
  ...(collegeYear4 as StoryNode[]),
  ...(eventsRandom as StoryNode[]),
  ...(sideBarkada as StoryNode[]),
  ...(sideCrush as StoryNode[]),
  ...(sideFamily as StoryNode[]),
  ...(sideOrg as StoryNode[]),
  ...(sideThesis as StoryNode[]),
  ...(courseBsit as StoryNode[]),
  ...(courseBscs as StoryNode[]),
  ...(courseNursing as StoryNode[]),
  ...(courseEducation as StoryNode[]),
  ...(courseEngineering as StoryNode[]),
  ...(courseCriminology as StoryNode[]),
  ...(courseBsba as StoryNode[]),
  ...(courseHospitality as StoryNode[]),
  ...(coursePsychology as StoryNode[]),
  ...(expandedMilestones as StoryNode[]),
  ...(expandedChallenges as StoryNode[]),
];

export const ALL_ENDINGS: EndingDefinition[] = endingsData as EndingDefinition[];

export function getStoryMap(customNodes: StoryNode[] = []): Map<string, StoryNode> {
  const map = new Map<string, StoryNode>();
  for (const node of ALL_BASE_STORY_NODES) {
    map.set(node.id, node);
  }
  for (const node of customNodes) {
    map.set(node.id, node);
  }
  return map;
}
