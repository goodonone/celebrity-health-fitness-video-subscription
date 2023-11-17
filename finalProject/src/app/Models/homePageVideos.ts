export class homePageVideos {
    src?: string;
    startTime?: number;
    endTime?: number;

  
    constructor(src?: string, start?: number, end?: number) {
      this.src = src;
      this.startTime = start;
      this.endTime = end;
    }
}