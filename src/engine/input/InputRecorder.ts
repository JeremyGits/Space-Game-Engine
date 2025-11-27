/**
 * Input Recorder
 * Records and plays back input sequences
 */

import type { InputRecording, InputEvent } from '../../types/input/InputTypes';

export class InputRecorder {
  private recording: InputRecording | null = null;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private playbackTime: number = 0;
  private playbackFrameIndex: number = 0;
  private recordingStartTime: number = 0;

  /**
   * Start recording
   */
  public startRecording(): void {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    this.recording = {
      frames: [],
      duration: 0,
      startTime: Date.now()
    };
    
    this.isRecording = true;
    this.recordingStartTime = performance.now();
  }

  /**
   * Stop recording
   */
  public stopRecording(): InputRecording | null {
    if (!this.isRecording) {
      console.warn('Not recording');
      return null;
    }

    this.isRecording = false;
    
    if (this.recording) {
      this.recording.duration = performance.now() - this.recordingStartTime;
    }

    const result = this.recording;
    this.recording = null;
    
    return result;
  }

  /**
   * Record input event
   */
  public recordEvent(event: InputEvent): void {
    if (!this.isRecording || !this.recording) {
      return;
    }

    const timestamp = performance.now() - this.recordingStartTime;
    
    // Find or create frame for this timestamp
    let frame = this.recording.frames.find(f => 
      Math.abs(f.timestamp - timestamp) < 16 // Within one frame (60fps)
    );

    if (!frame) {
      frame = {
        timestamp,
        events: []
      };
      this.recording.frames.push(frame);
      
      // Keep frames sorted by timestamp
      this.recording.frames.sort((a, b) => a.timestamp - b.timestamp);
    }

    frame.events.push({ ...event });
  }

  /**
   * Start playback
   */
  public startPlayback(recording: InputRecording): void {
    if (this.isPlaying) {
      console.warn('Already playing');
      return;
    }

    this.recording = recording;
    this.isPlaying = true;
    this.playbackTime = 0;
    this.playbackFrameIndex = 0;
  }

  /**
   * Stop playback
   */
  public stopPlayback(): void {
    this.isPlaying = false;
    this.playbackTime = 0;
    this.playbackFrameIndex = 0;
    this.recording = null;
  }

  /**
   * Update playback
   */
  public update(deltaTime: number): InputEvent[] {
    if (!this.isPlaying || !this.recording) {
      return [];
    }

    this.playbackTime += deltaTime * 1000; // Convert to milliseconds

    const events: InputEvent[] = [];

    // Process all frames up to current playback time
    while (this.playbackFrameIndex < this.recording.frames.length) {
      const frame = this.recording.frames[this.playbackFrameIndex];
      
      if (frame.timestamp > this.playbackTime) {
        break;
      }

      events.push(...frame.events);
      this.playbackFrameIndex++;
    }

    // Check if playback is complete
    if (this.playbackFrameIndex >= this.recording.frames.length) {
      this.stopPlayback();
    }

    return events;
  }

  /**
   * Check if currently recording
   */
  public getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check if currently playing
   */
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current playback progress (0-1)
   */
  public getPlaybackProgress(): number {
    if (!this.isPlaying || !this.recording || this.recording.duration === 0) {
      return 0;
    }
    return Math.min(1, this.playbackTime / this.recording.duration);
  }

  /**
   * Export recording to JSON
   */
  public exportRecording(recording: InputRecording): string {
    return JSON.stringify(recording, null, 2);
  }

  /**
   * Import recording from JSON
   */
  public importRecording(json: string): InputRecording | null {
    try {
      const recording = JSON.parse(json) as InputRecording;
      
      // Validate recording structure
      if (!recording.frames || !Array.isArray(recording.frames)) {
        throw new Error('Invalid recording format');
      }

      return recording;
    } catch (error) {
      console.error('Failed to import recording:', error);
      return null;
    }
  }

  /**
   * Get recording statistics
   */
  public getRecordingStats(recording: InputRecording): {
    duration: number;
    frameCount: number;
    eventCount: number;
    averageEventsPerFrame: number;
  } {
    const eventCount = recording.frames.reduce((sum, frame) => sum + frame.events.length, 0);
    
    return {
      duration: recording.duration,
      frameCount: recording.frames.length,
      eventCount,
      averageEventsPerFrame: recording.frames.length > 0 
        ? eventCount / recording.frames.length 
        : 0
    };
  }
}
