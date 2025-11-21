export interface CharacterItem {
  character: string;
  pinyin: string;
}

export interface QueryResult {
  characters: CharacterItem[];
  explanation: string;
}

// Web Speech API types (often missing from standard TS libs in some envs)
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export enum AppState {
  IDLE,
  LISTENING,
  PROCESSING,
  SUCCESS,
  ERROR,
}