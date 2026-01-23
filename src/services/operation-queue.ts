import { OpenCodeClient } from './opencode-client';
import { OperationRequest, OperationStatus, OperationType } from '../models/operation';

export interface QueuedOperation {
	request: OperationRequest;
	priority: number;
	enqueueTime: number;
	abortController: AbortController;
}

export type OperationHandler = (request: OperationRequest) => Promise<void>;

export class OperationQueue {
	private queue: QueuedOperation[] = [];
	private current: QueuedOperation | null = null;
	private processing = false;

	constructor(private client: OpenCodeClient) {}

	async enqueue(
		request: OperationRequest,
		handler: OperationHandler,
		priority: number = 0
	): Promise<void> {
		const abortController = new AbortController();
		const queuedOp: QueuedOperation = {
			request,
			priority,
			enqueueTime: Date.now(),
			abortController
		};

		this.queue.push(queuedOp);
		this.queue.sort((a, b) => a.priority - b.priority);

		if (!this.processing) {
			await this.processQueue(handler);
		}
	}

	private async processQueue(handler: OperationHandler): Promise<void> {
		this.processing = true;

		while (this.queue.length > 0) {
			const queuedOp = this.queue.shift();
			if (!queuedOp) break;

			// Check if cancelled
			if (queuedOp.abortController.signal.aborted) {
				queuedOp.request.status = OperationStatus.CANCELLED;
				continue;
			}

			this.current = queuedOp;
			queuedOp.request.status = OperationStatus.PROCESSING;

			try {
				await handler(queuedOp.request);
				queuedOp.request.status = OperationStatus.COMPLETED;
			} catch (error) {
				queuedOp.request.status = OperationStatus.FAILED;
				console.error('Operation failed:', error);
			} finally {
				this.current = null;
			}
		}

		this.processing = false;
	}

	cancel(operationId: string): boolean {
		// Cancel current operation
		if (this.current && this.current.request.id === operationId) {
			this.current.abortController.abort();
			this.current.request.status = OperationStatus.CANCELLED;
			return true;
		}

		// Cancel queued operation
		const queuedOp = this.queue.find(op => op.request.id === operationId);
		if (queuedOp) {
			queuedOp.abortController.abort();
			queuedOp.request.status = OperationStatus.CANCELLED;
			this.queue = this.queue.filter(op => op.request.id !== operationId);
			return true;
		}

		return false;
	}

	getQueueSize(): number {
		return this.queue.length;
	}

	getCurrentOperation(): OperationRequest | null {
		return this.current?.request || null;
	}

	isProcessing(): boolean {
		return this.processing;
	}
}
