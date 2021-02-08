import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private currentFrameID; // To animate frames
  private startTime = Date.now();
  private lastFrameData;
  private loadedImagesCount = 0;

  private readonly fps = 10;
  private readonly totalFrames = 11272;

  readonly framesBaseURL = `https://abhishekbadola.github.io/frames-player/assets/frames`;
  readonly preloadImgCount = 50; // Minimum images count to preload
  readonly loadImgArray = []; // Starting with preload images count

  nextFrame = 0;
  isPlaying = false;
  size = 'original';
  subtitleText = '';
  frameLength = 1 / this.fps;
  addFrameStep = 0;
  selectedFile;
  loadedImageArray = []; // To verify the set of loaded images

  @ViewChild('imgContainer', { static: true }) imgContainerRef: ElementRef;
  @ViewChild('videoFrame', { static: true }) videoFrameRef: ElementRef;
  @ViewChild('selectFiles', { static: true }) selectFilesRef: ElementRef;

  ngOnInit() {
    for (let i = 0; i < this.preloadImgCount; i++) {
      this.loadImgArray[i] = i + 1;
    }
  }

  imagePreLoaded(index) {
    // Keeping a delay to avoid UI blocking
    const timeout = setTimeout(() => {
      this.loadedImageArray[index] = this.loadImgArray[index];
      clearTimeout(timeout);
    }, 0);
  }

  loadVideoFrame() {
    const now = Date.now();
    const diff = now - this.startTime;
    const delayInSecs = (this.lastFrameData || {} as any).delayInSeconds || 1 / this.fps;

    if (diff >= delayInSecs * 1000) {
      // If the page is not visible
      // That is when you switch tabs or any window
      let imgName = 's_000' + '0000'.substr(this.nextFrame.toString().length - 1) + this.nextFrame;
      let imgPath = `${this.framesBaseURL}/${imgName}.jpg`;

      (this.videoFrameRef.nativeElement as HTMLImageElement).src = imgPath;

      this.lastFrameData = {
        name: `${imgName}.jpg`,
        src: imgPath,
        delayInSeconds: 1 / this.fps
      };

      this.preloadImages();

      this.nextFrame++; // Update count for loading next frame
      this.loadedImagesCount++;

      this.startTime = now;
    }

    // For better performance, using requestAnimationFrame API
    this.currentFrameID = requestAnimationFrame(this.loadVideoFrame.bind(this));
  }

  preloadImages(keepLoading = false) {
    if (this.loadImgArray[this.loadImgArray.length - 1] >= this.totalFrames) {
      // Pausing video at current frame
      this.isPlaying = false;
      cancelAnimationFrame(this.currentFrameID);
      return;
    }

    // If already set image sources are loaded
    if (this.loadedImageArray.length === this.preloadImgCount) {
      // If the frame sequence reaches at multiple of 50
      if (this.loadedImagesCount % this.preloadImgCount === 0) {
        this.loadedImageArray = [];
        // Then reset image resources to load new images in advance
        for (let i = 0; i < this.preloadImgCount; i++) {
          const nextImageCount = this.loadImgArray[i] + this.preloadImgCount;
          if (nextImageCount >= this.totalFrames) {
            // Pausing video at current frame
            this.isPlaying = false;
            cancelAnimationFrame(this.currentFrameID);
            return;
          } else {
            this.loadImgArray[i] = nextImageCount;
          }
        }
      }
      if (keepLoading) {
        // If player is paused or running in background keep the advance image loading
        this.loadedImagesCount++;
        this.checkIfImagesArePreLoaded();
      }
    } else {
      // If previously set image sources are still pending
      this.checkIfImagesArePreLoaded();
    }
  }

  private checkIfImagesArePreLoaded() {
    const timeout = setTimeout(() => {
      this.preloadImages(true);
      clearTimeout(timeout);
    }, 0);
  }

  startVideo() {
    // Play video
    this.isPlaying = true;
    if (!this.nextFrame) {
      this.nextFrame++;
      this.loadedImagesCount = this.nextFrame;
    }
    this.startTime = Date.now();
    this.loadVideoFrame();
  }

  pauseVideo() {
    // Pausing video at current frame
    this.isPlaying = false;
    cancelAnimationFrame(this.currentFrameID);

    // Keep lazy loading images on while the video frames are pause
    this.checkIfImagesArePreLoaded();
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
        this.selectedFile = {
          name: file.name,
          src: e.target.result as string,
          delayInSeconds: 1 / this.fps
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
    } else if (this.selectedFile) {
      this.addFrameStep = 2;
    }
  }

  submitAddFrame() {
    this.selectedFile.delayInSeconds = this.frameLength;
    this.lastFrameData = {
      ...this.selectedFile
    };

    const img = (this.videoFrameRef.nativeElement as HTMLImageElement);
    img.src = this.selectedFile.src;

    this.selectedFile = null;
    this.frameLength = 1 / this.fps;
    this.addFrameStep = 0;
  }

  cancelAddFrame() {
    this.selectFilesRef.nativeElement.value = '';
    this.addFrameStep = 0;
    this.selectedFile = null;
    this.frameLength = 1 / this.fps;
  }
}
