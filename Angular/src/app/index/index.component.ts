import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
declare var VANTA;



@Component({
  selector: 'app-home',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit, OnDestroy {

  constructor() { }

  effect;
  goingUp = true;
  stop = false;
  maxDistance = 16;

  isLargeWindow = true;

  ngOnInit() {
    this.effect = VANTA.NET({
      el: "#vanta",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      color: 0x416a87,
      backgroundColor: 0xffffff,
      points: 13.00,
      maxDistance: this.maxDistance,
      spacing: 14.00
    })

    // Commented out for performance. When enabled updates the effect to pulse larger and smaller
    // this.updater(150, this.effect);

    let {
    	isXs,
    	isSm,
    	isM,
    	isL
	} = this.calcBreakpoints(window.innerWidth);

	this.isXs = isXs;
	this.isSm = isSm;
	this.isM = isM;
	this.isL = isL;

  }

  ngOnDestroy() {
    this.effect.destroy();
    this.stop = true;
  }

  updater = async (ms, effect) => {
    if(this.stop) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, ms));
    // update
    effect.setOptions({
      maxDistance: this.goingUp ? this.maxDistance + 0.25 : this.maxDistance - 0.25
    });
    this.maxDistance = this.goingUp ? this.maxDistance + 0.25 : this.maxDistance - 0.25;
    // set direction
    if(this.maxDistance > 23 && this.goingUp) {
      this.goingUp = false;
    } else if(this.maxDistance < 11 && !this.goingUp) {
      this.goingUp = true;
    }
    // recurse
    this.updater(ms, effect);
  }

  // Breakpoints

  isXs;
  isSm;
  isM;
  isL

calcBreakpoints(width) {
	let isXs = false;
	let isSm = false
	let isM = false
	let isL = false
	if(width > 1100) {
		isL = true;
	}
	else if(width > 768) {
		isM = true;
	}
	else if(width > 640) {
		isSm = true;
	}
	else {
		isXs = true;
	}
	return {
		isXs,
		isSm,
		isM,
		isL
  }};

  @HostListener('window:resize')
onResize() {
	let {
		isXs,
		isSm,
		isM,
		isL
	} = this.calcBreakpoints(window.innerWidth);

	this.isXs = isXs;
	this.isSm = isSm;
	this.isM = isM;
	this.isL = isL;

  if (window.innerWidth < 950) {
    this.isLargeWindow = false;
  }
  else {
    this.isLargeWindow = true;
  }
  console.log(this.isLargeWindow);
}

}
