import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private currentFrameID;
  private framesData = [];
  private startTime = Date.now();
  private readonly fps = 10;

  nextFrame = 0;
  isPlaying = false;
  size = 'original';
  subtitleText = '';
  frameLength = 1/this.fps;
  addFrameStep = 0;
  selectedFile;

  @ViewChild('imgContainer', { static: true }) imgContainerRef: ElementRef;
  @ViewChild('videoFrame', { static: true }) videoFrameRef: ElementRef;
  @ViewChild('selectFiles', { static: true }) selectFilesRef: ElementRef;

  ngOnInit() {
  }

  loadVideoFrame() {
    const now = Date.now();
    const diff = now - this.startTime;
    const frameData = (this.framesData || [])[this.nextFrame - 1];
    const delayInSecs = (frameData || {}).delayInSeconds || 1/this.fps;

    if (diff >= delayInSecs * 1000) {
      // If the page is not visible
      // That is when you switch tabs or any window
      let imgName = 's_000';
      let imgSequence = this.nextFrame.toString();
      let imgPath = (frameData || {}).src || '';

      for (let i = 5; i > imgSequence.length; i--) {
        imgName += '0';
      }
      imgName += imgSequence;

      imgPath = `./assets/frames/${imgName}.jpg`;

      this.framesData.push({
        name: `${imgName}.jpg`,
        src: imgPath,
        delayInSeconds: 1/this.fps
      });

      (this.videoFrameRef.nativeElement as HTMLImageElement).src = imgPath;

      this.nextFrame++; // Update count for loading next frame

      this.startTime = now;
    }

    // For better performance, using requestAnimationFrame API
    this.currentFrameID = requestAnimationFrame(this.loadVideoFrame.bind(this));
  }

  startVideo() {
    // Play video
    this.isPlaying = true;
    if (!this.nextFrame) this.nextFrame++;
    this.startTime = Date.now();
    this.loadVideoFrame();
  }

  pauseVideo() {
    // Pausing video at current frame
    this.isPlaying = false;
    cancelAnimationFrame(this.currentFrameID);
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
        if (selectedFiles.length > 1) {
          this.framesData.push({
            name: file.name,
            src: e.target.result as string,
            delayInSeconds: 1/this.fps
          });
        } else {
          this.selectedFile = {
            name: file.name,
            src: e.target.result as string,
            delayInSeconds: 1/this.fps
          }

          this.selectFilesRef.nativeElement.value = '';
        }
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
    this.framesData.push({
      ...this.selectedFile
    });

    const img = (this.videoFrameRef.nativeElement as HTMLImageElement);
    img.src = this.selectedFile.src;

    this.selectedFile = null;
    this.frameLength = 1/this.fps;
    this.addFrameStep = 0;
  }

  cancelAddFrame() {
    this.selectFilesRef.nativeElement.value = '';
    this.addFrameStep = 0;
    this.selectedFile = null;
    this.frameLength = 1/this.fps;
  }
}
