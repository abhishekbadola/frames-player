import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly framesBaseURL = `./assets/frames`;
  private readonly frameStart = 0; // To start frame with predfined frame number
  private readonly totalFrames = 11272;
  private readonly bufferSize = 50;
  private readonly preloadListCount = 4;
  private readonly timePerFrameInMilliseconds = 100; // 1000(1 second) / 10(frames per second) = 100 ms per frame;

  private currentFrameID; // To animate frames
  private lastFrameTime = Date.now();
  private lastFrameData; // To hold the last shown frame data

  buffering = false;
  preloadedImagesCount = this.frameStart;
  nextFrame = this.frameStart;
  isPlaying = false;
  size = 'original';
  subtitleText = '';
  timePerFrameInSeconds = this.timePerFrameInMilliseconds / 1000; // To manually enter time per frame in seconds
  addFrameStep = 0;
  loadedImageArray = []; // To verify the set of loaded images
  dynamicFPSMeter = 10;
  imagePreloaderArray = [];
  nextFrameData; // To hold the next frame to be loaded

  @ViewChild('imgContainer', { static: true }) imgContainerRef: ElementRef;
  @ViewChild('videoFrame', { static: true }) videoFrameRef: ElementRef;
  @ViewChild('selectFiles', { static: true }) selectFilesRef: ElementRef;

  constructor(private ngxService: NgxUiLoaderService) { }

  ngOnInit() {
    this.buffering = true;
    this.ngxService.startLoader('buffer');
    this.preloadImages();
  }

  videoFrameLoaded() {
    if (this.nextFrame <= this.totalFrames) {
      if (this.preloadedImagesCount === this.nextFrame) {
        this.ngxService.startLoader('buffer');
        this.buffering = true;

        this.preloadImages();

        cancelAnimationFrame(this.currentFrameID);
        return;
      }
    }
  }

  imagePreLoaded() {
    // Keeping a delay to avoid UI blocking
    const timeout = setTimeout(() => {
      this.preloadedImagesCount++;
      if (this.preloadedImagesCount === this.totalFrames || (this.preloadedImagesCount - this.nextFrame) >= this.bufferSize) {
        // If all images has been preloaded or if the buffersize is reached
        if (this.buffering && this.isPlaying) {
          // If buffering is on and video was in playing mode
          this.startVideo();
        }

        this.buffering = false;
        this.ngxService.stopLoader('buffer');
      }

      if (this.preloadedImagesCount < this.totalFrames && this.preloadedImagesCount % this.preloadListCount === 0) {
        // When previous set of images is loaded completely
        this.preloadImages();
      };

      clearTimeout(timeout);
    }, 0);
  }

  private preloadImages() {
    if (!this.nextFrame && this.preloadedImagesCount !== this.bufferSize) {
      // If first time preloading, when video is not played yet
      for (let i = 0; i < this.preloadListCount; i++) {
        if (i <= this.totalFrames) {
          if (this.preloadedImagesCount) {
            // If previous set of images preloaded
            this.imagePreloaderArray[i] += this.preloadListCount;
          } else {
            // If no image is preloaded yet
            this.imagePreloaderArray[i] = this.nextFrame + i + 1;
          }
        } else {
          break;
        }
      }
    } else {
      // If the video is buffering while playing
      for (let i = 0; i < this.preloadListCount; i++) {
        const imagesCount = this.imagePreloaderArray[i] + this.preloadListCount;
        if (imagesCount <= this.totalFrames) {
          this.imagePreloaderArray[i] = imagesCount;
        } else {
          break;
        }
      }
    }
  }

  private loadVideoFrame() {
    const now = Date.now();
    const diff = now - this.lastFrameTime;
    let timePerFrame = (this.lastFrameData || {} as any).millisecondsPerFrame || this.timePerFrameInMilliseconds;

    if (diff >= timePerFrame) {
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
        imgName = `s_000${'0000'.substr(this.nextFrame.toString().length - 1)}${this.nextFrame}`;
        imgPath = `${this.framesBaseURL}/${imgName}.jpg`;
        timePerFrame = this.timePerFrameInMilliseconds;
      }

      (this.videoFrameRef.nativeElement as HTMLImageElement).src = imgPath;

      this.lastFrameData = {
        name: `${imgName}.jpg`,
        src: imgPath,
        millisecondsPerFrame: timePerFrame
      };

      this.nextFrame++; // Update count for loading next frame

      this.lastFrameTime = now;

      // Just to test at which speed frames are loading
      this.dynamicFPSMeter = 1000 / diff;
    }

    if (this.nextFrame >= 1 && this.nextFrame <= this.totalFrames) {
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

    if (!this.buffering) {
      if (!this.nextFrame) {
        this.nextFrame++;
      }

      this.loadVideoFrame();
    }
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
