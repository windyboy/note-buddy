export default class Plugin {
  constructor(app: any, manifest: any);
  
  load(): Promise<void>;
  unload(): void;
  
  getData(): any;
  saveData(): void;
  
  saveSettings(): Promise<void>;
  loadSettings(): Promise<void>;
  
  registerEvent(eventRef: any): any;
  triggerEvent(event: string, ...data: any[]): any;
  
  registerCommand(command: Command): void;
  addCommand(command: Command): void;
  
  addRibbonIcon(icon: string, title: string, callback: (event: MouseEvent) => any): HTMLElement;
  addStatusBarItem(): HTMLElement;
  
  registerView(viewType: string, viewCreator: (leaf: WorkspaceLeaf) => ItemView): void;
  
  get app(): App;
  get manifest(): any;
  get vault(): Vault;
  get workspace(): Workspace;
  get settings(): any;
}

export interface Command {
  id: string;
  name: string;
  hotkeys?: Array<{ modifiers: string[], key: string }>;
  callback?: () => any;
  checkCallback?: (checking: boolean) => any;
}

export class ItemView {
  constructor(leaf: WorkspaceLeaf);
  
  getViewType(): string;
  getDisplayText(): string;
  getIcon(): string;
  
  onOpen(): Promise<void>;
  onClose(): Promise<void>;
  
  get containerEl(): HTMLElement;
}

export interface App {
  vault: Vault;
  workspace: Workspace;
  metadataCache: MetadataCache;
  plugins: PluginManager;
  commands: CommandManager;
  settings?: any;
}

export interface Vault {
  create(path: string, data: string): Promise<TFile>;
  read(file: TFile): Promise<string>;
  modify(file: TFile, data: string): Promise<void>;
  delete(file: TFile): Promise<void>;
  
  getAbstractFileByPath(path: string): TAbstractFile | null;
  getFiles(): TFile[];
}

export interface Workspace {
  onLayoutReady(callback: () => any): void;
  
  getLeavesOfType(viewType: string): WorkspaceLeaf[];
  getRightLeaf(split: boolean): WorkspaceLeaf;
  
  setActiveLeaf(leaf: WorkspaceLeaf): Promise<void>;
  
  openLinkText(linkText: string, sourcePath: string, openNew?: boolean): Promise<void>;
}

export interface WorkspaceLeaf {
  view: ItemView | null;
  
  setViewState(state: ViewState, eState?: any): Promise<void>;
  detach(): Promise<void>;
}

export interface ViewState {
  type: string;
  state?: any;
  active?: boolean;
}

export interface TFile extends TAbstractFile {
  extension: string;
}

export interface TAbstractFile {
  path: string;
  name: string;
  parent: TFolder | null;
}

export interface TFolder {
  path: string;
  name: string;
  parent: TFolder | null;
}

export interface MetadataCache {
  onCacheChanged(callback: (file: TFile) => any): void;
  getFileCache(file: TFile): any;
}
