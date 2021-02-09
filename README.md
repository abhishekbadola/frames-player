# Frames Player
## Description

This is a video player which shows some predefined frames at maximum speed of **10 frames per second** (The normal frame rate of a browser is 60 frames per second).

Features:

- Showing frames at 10 fps
- Play or pause video
- **Resize frame** options
- Aspect ratios for given resize options Original - **default**, Landscape - **16 : 9 ratio**, Portrait **9 : 16**, Square - **1 : 1** )
- Adding a new frame in paused state. **Enter duration in seconds** for which the added frame will be shown (Click on play and rest of the frames play after that time)
- **Write Subtitle** on a frame in realtime (Only in paused state)
- **Frame rate speed** at bottom left
- Show **buffering** if the internet speed is slow 

Implementation approach:

- As we know javascript is single threaded, I am using **requestAnimationFrame** API to switch frames to form a video
- Frames are paused while the tab/window is switched, that is if you are on different screen.
- Javascript doesn't gurantee you to play at specified frame speed but **requestAnimationFrame** helps in managing better performance of webpage and saving battery life.
- Added service worker to cache loaded frames (for better performance)
- Implemented buffering (taking buffer size as 50 frames) so that the frames doesn't lag or become choppy. That's how the frame rate is also maintained
- Frame can be added in paused state. Clicking on play again displays the frame for the duration you entered
- Text entered will be reflected in realtime as subtitle above the frame

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
