import { Position, Suggestion } from './operation';

export enum DecisionAction {
	ACCEPTED = "accepted",
	REJECTED = "rejected",
	EDITED = "edited"
}

export interface Decision {
	suggestionId: string;
	action: DecisionAction;
	editedContent?: string;
	timestamp: number;
}

export interface Annotation {
	suggestionId: string;
	widget: any; // CodeMirror WidgetType instance
	position: Position;
	visible: boolean;
}

export interface PreviewState {
	operationId: string;
	annotations: Annotation[];
	decisions: Map<string, Decision>;
	currentSuggestionIndex: number;
}
