export enum OperationType {
	SUMMARIZE = "summarize",
	EXTRACT_TASKS = "extract_tasks",
	IMPROVE_STRUCTURE = "improve_structure",
	SUGGEST_LINKS = "suggest_links"
}

export enum OperationStatus {
	QUEUED = "queued",
	PROCESSING = "processing",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled"
}

export enum ErrorCode {
	CONNECTION_REFUSED = "connection_refused",
	TIMEOUT = "timeout",
	INVALID_RESPONSE = "invalid_response",
	SERVICE_ERROR = "service_error"
}

export interface Position {
	line: number;
	ch: number;
}

export interface OperationError {
	code: ErrorCode;
	message: string;
	details?: string;
}

export interface Suggestion {
	id: string;
	type: string;
	content: string;
	position?: Position;
	explanation?: string;
	confidence?: number;
}

export interface OperationRequest {
	id: string;
	type: OperationType;
	content: string;
	notePath: string;
	timestamp: number;
	status: OperationStatus;
	sessionId?: string;
}

export interface OperationResult {
	operationId: string;
	suggestions: Suggestion[];
	sessionId: string;
	timestamp: number;
	error?: OperationError;
}
