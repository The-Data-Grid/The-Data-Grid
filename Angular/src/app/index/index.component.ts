import { Component, OnInit, OnDestroy } from '@angular/core';
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
  maxDistance = 13;

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

    this.updater(100, this.effect);
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
    console.log(this.maxDistance)
    this.maxDistance = this.goingUp ? this.maxDistance + 0.25 : this.maxDistance - 0.25;
    // set direction
    if(this.maxDistance > 25 && this.goingUp) {
      this.goingUp = false;
    } else if(this.maxDistance < 11 && !this.goingUp) {
      this.goingUp = true;
    }
    // recurse
    this.updater(ms, effect);
  }

}
