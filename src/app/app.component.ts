import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly framesBaseURL = `https://abhishekbadola.github.io/frames-player/assets/frames`;
  private readonly frameStart = 0; // To start frame with predfined frame number
  private readonly totalFrames = 11272 - this.frameStart;
  private readonly bufferSize = 40;
  private readonly preloadListCount = 4;
  private readonly timePerFrameInMilliseconds = 100; // 1000(1 second) / 10(frames per second) = 100 ms per frame;

  private currentFrameID; // To animate frames
  private lastFrameTime = Date.now();
  private imageBuffer = {};
  private preloadedImagesCount = 0;
  private nextFrame = this.frameStart;
  private imagePreloaderArray = [];

  currentFrameData; // To hold the last shown frame data
  buffering = false;
  isPlaying = false;
  size = 'original';
  subtitleText = '';
  timePerFrameInSeconds = this.timePerFrameInMilliseconds / 1000; // To manually enter time per frame in seconds
  addFrameStep = 0;
  dynamicFPSMeter = 10;
  nextFrameData; // To hold the next frame to be loaded

  @ViewChild('imgContainer', { static: true }) imgContainerRef: ElementRef;
  @ViewChild('videoFrame', { static: true }) videoFrameRef: ElementRef;
  @ViewChild('selectFiles', { static: true }) selectFilesRef: ElementRef;

  constructor(private ngxService: NgxUiLoaderService, private _http: HttpClient, private _sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.buffering = true;
    this.ngxService.startLoader('buffer');
    this.preloadImages();
  }

  videoFrameLoaded(currentFrameData) {
    URL.revokeObjectURL(currentFrameData.src);
    delete this.imageBuffer[currentFrameData.sequence];

    if (currentFrameData.sequence - this.frameStart < this.totalFrames) {
      if (!Object.keys(this.imageBuffer).length) {
        this.ngxService.startLoader('buffer');
        this.buffering = true;

        this.preloadImages();

        cancelAnimationFrame(this.currentFrameID);
        return;
      }
    } else {
      this.pauseVideo();
    }
  }

  imagePreLoaded() {
    if (this.preloadedImagesCount === this.totalFrames || Object.keys(this.imageBuffer).length >= this.bufferSize) {
      // If all images has been preloaded or if the buffersize is reached
      if (this.buffering && this.isPlaying) {
        // If buffering is on and video was in playing mode
        this.startVideo();
      }

      this.buffering = false;
      this.ngxService.stopLoader('buffer');
    }

    if (this.preloadedImagesCount < this.totalFrames) {
      // When previous set of images is loaded completely
      this.preloadImages();
    };
  }

  private preloadImages() {
    // If first time preloading, when video is not played yet
    for (let i = 0; i < this.preloadListCount; i++) {
      if (!this.preloadedImagesCount) {
        // If no image is preloaded yet
        this.imagePreloaderArray[i] = this.frameStart + i + 1;
      } else {
        // If previous set of images preloaded
        const frameSequence = this.imagePreloaderArray[i] + this.preloadListCount;
        if (frameSequence - this.frameStart <= this.totalFrames) {
          this.imagePreloaderArray[i] = frameSequence;
        } else break;
      }
    }

    if (this.imagePreloaderArray.length) // If there are images to be preloaded
      forkJoin(this.imagePreloaderArray.map(sequence => {
        return this._http.get(`${this.framesBaseURL}/${this.getFrameName(sequence)}`, {
          responseType: "blob"
        }).pipe(map((image) => {
          this.preloadedImagesCount++;
          this.imageBuffer[sequence] = URL.createObjectURL(image);
          return image;
        }));
      })).subscribe(() => {
        // Load again and again till buffer is reached
        this.imagePreLoaded();
      });
  }

  private getFrameName(sequence) {
    return `s_000${'0000'.substr(sequence.toString().length - 1)}${sequence}.jpg`;
  }

  private loadVideoFrame() {
    const now = Date.now();
    const diff = now - this.lastFrameTime;
    let timePerFrame = (this.currentFrameData || {} as any).millisecondsPerFrame || this.timePerFrameInMilliseconds;

    if (diff >= timePerFrame && this.imageBuffer[this.nextFrame]) {
      // If the page is not visible
      // That is when you switch tabs or any window
      let imgName = '';
      let imgPath = '';

      if (this.nextFrameData) {
        const frameData = this.nextFrameData || {};
        imgName = frameData.name || '';
        imgPath = frameData.src || '';
        timePerFrame = frameData.millisecondsPerFrame || this.timePerFrameInMilliseconds
        this.nextFrameData = null;
        this.nextFrame--; // Update count for loading next frame
      } else {
        imgName = this.getFrameName(this.nextFrame);
        imgPath = this.imageBuffer[this.nextFrame];
        timePerFrame = this.timePerFrameInMilliseconds;
      }

      this.currentFrameData = {
        sequence: this.nextFrame,
        name: imgName,
        src: imgPath,
        millisecondsPerFrame: timePerFrame
      };

      this.nextFrame++; // Update count for loading next frame

      this.lastFrameTime = now;

      // Just to test at which speed frames are loading
      this.dynamicFPSMeter = 1000 / diff;
    }

    const loadedFrames = this.nextFrame - this.frameStart;
    if (loadedFrames >= 1 && loadedFrames <= this.totalFrames) {
      // For better performance, using requestAnimationFrame API
      this.currentFrameID = requestAnimationFrame(this.loadVideoFrame.bind(this));
    }
  }

  startVideo() {
    if (this.buffering && !this.isPlaying) {
      this.ngxService.startLoader('buffer');
    }

    // Play video
    this.isPlaying = true;

    if (!this.currentFrameData) {
      // If playing video for first time
      this.nextFrame++;
    }

    if (this.nextFrame - this.frameStart === this.totalFrames) {
      // Replay if all frames are shown
      this.nextFrame = this.frameStart;
      this.imageBuffer = {};
      this.preloadedImagesCount = 0;
      this.currentFrameID = null;
      this.lastFrameTime = Date.now();
    }

    this.loadVideoFrame();
  }

  pauseVideo() {
    if (this.buffering) {
      this.ngxService.stopLoader('buffer');
    }

    this.isPlaying = false;
    cancelAnimationFrame(this.currentFrameID); // Pausing video at current frame
    return;
  }

  resizeVideo(size: string) {
    let width;
    let fit = 'cover';

    this.size = size;

    switch (size) {
      case 'landscape': {
        width = `${16 * (this.imgContainerRef.nativeElement.clientHeight / 9)}px`;
        break;
      }
      case 'portrait': {
        width = `${9 * (this.imgContainerRef.nativeElement.clientHeight / 16)}px`;
        break;
      }
      case 'square': {
        width = `${this.imgContainerRef.nativeElement.clientHeight}px`;
        break;
      }

      default:
        width = '';
        fit = '';
    }

    this.imgContainerRef.nativeElement.style.width = width;
    this.videoFrameRef.nativeElement.style.width = width;
    this.videoFrameRef.nativeElement.style['object-fit'] = fit;
  }

  onFramesSelected(event: any) {
    const selectedFiles = event.target.files || [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.nextFrameData = {
          name: file.name,
          src: e.target.result as string,
          millisecondsPerFrame: this.timePerFrameInMilliseconds
        }

        this.selectFilesRef.nativeElement.value = '';
      };

      reader.readAsDataURL(file);
    }
  }

  clickedAddFrame() {
    if (this.isPlaying) {
      return;
    } else if (!this.addFrameStep) {
      this.addFrameStep++;
      this.selectFilesRef.nativeElement.click();
    } else if (this.nextFrameData) {
      this.addFrameStep = 2;
    }
  }

  submitAddFrame() {
    if (this.timePerFrameInSeconds > 0) {
      this.nextFrameData.millisecondsPerFrame = this.timePerFrameInSeconds * 1000;
      this.timePerFrameInSeconds = this.timePerFrameInMilliseconds / 1000;
      this.addFrameStep = 0;
    } else {
      console.error('Enter a valid number for time in seconds');
    }
  }

  cancelAddFrame() {
    this.selectFilesRef.nativeElement.value = '';
    this.addFrameStep = 0;
    this.nextFrameData = null;
    this.timePerFrameInSeconds = this.timePerFrameInMilliseconds / 1000;
  }
}

@Pipe({
  name: 'safeResourceUrl'
})
export class SafeResourceUrlPipe implements PipeTransform {

  constructor(private _sanitizer: DomSanitizer) { }

  /**
   * Returns sanitized secure resource URL as per angular standard
   * @param url - Resource url to sanitize
   */
  transform(url: string) {
    // To bind the full HTML content in the view
    return this._sanitizer.bypassSecurityTrustResourceUrl(url || '');
  }

}
