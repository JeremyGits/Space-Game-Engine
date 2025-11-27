/**
 * Pipeline Stage
 * 
 * Represents a stage in the voxel rendering pipeline.
 */

export type StageStatus = 'pending' | 'running' | 'complete' | 'error';

export interface PipelineStageResult<T> {
  data: T;
  duration: number;
  status: StageStatus;
  error?: Error;
}

export class PipelineStage<TInput, TOutput> {
  constructor(
    public name: string,
    private processor: (input: TInput) => Promise<TOutput> | TOutput
  ) {}
  
  async execute(input: TInput): Promise<PipelineStageResult<TOutput>> {
    const startTime = performance.now();
    let status: StageStatus = 'running';
    let data: TOutput;
    let error: Error | undefined;
    
    try {
      data = await this.processor(input);
      status = 'complete';
    } catch (e) {
      status = 'error';
      error = e as Error;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      return { data: data!, duration, status, error };
    }
  }
}
