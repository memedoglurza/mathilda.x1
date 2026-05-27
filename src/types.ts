export interface AppUserData {
  username: string;
  profileImage: string | null;
  items: Level1Item[];
}

export interface Level1Item {
  id: string;
  name: string;
  image: string; // Base64 or a gradient reference
  items: Level2Item[];
}

export interface Level2Item {
  id: string;
  name: string;
  image: string; // Base64 or a gradient reference
  items: Level3Item[];
}

export interface Level3Item {
  id: string;
  name: string;
  image: string; // Base64 or a gradient reference
  text: string;  // Level 4 text area contents
}

// Navigation state
export type NavigationPage =
  | { type: 'login' }
  | { type: 'home' }
  | { type: 'level2'; val1Id: string }
  | { type: 'level3'; val1Id: string; val2Id: string }
  | { type: 'level4'; val1Id: string; val2Id: string; val3Id: string };
