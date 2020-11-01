import { Component, OnInit } from '@angular/core';
import { MAT_STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { TimelineItem } from 'ngx-horizontal-timeline';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';



@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
  providers: [{
    provide: MAT_STEPPER_GLOBAL_OPTIONS, useValue: { displayDefaultIndicatorType: false }
  }]

})
export class AboutComponent implements OnInit {
  interests = [];
  isLinear = false;

  events = [
    {
      "date": "January 3",
      "title": "Here We Go Again",
      "description": "Iranian major general and commander of the Quds force Qasem Soleimani is assassinated at the behest of US President Donald Trump, leading to heightened fears of further escalation and possible ground war"
    },
    {
      "date": "January 20",
      "title": "The Apocolypse Begins",
      "description": "The first case of SARS-CoV-2 is recorded in the United States"
    },
    {
      "date": "January 26",
      "title": "A Legend Departs",
      "description": "Basketball superstar and global icon Kobe Bryant, along with 8 others, including his 13-year old daughter Gigi, are killed in a helicopter crash 30 miles northwest of Downtown Los Angeles"
    },
    {
      "date": "February 5",
      "title": "Trump Acquitted",
      "description": "Impeached US President Donald Trump is acquitted by the Senate by a vote of 52-48, on the charge of Obstruction of Congress. He is the third president to be impeached to then be acquitted, joining Andrew Johnson and Bill Clinton"
    },
    {
      "date": "February 23",
      "title": "Feel The Bern",
      "description": "Vermont Senator Bernie Sanders convincingly wins the Nevada presidential caucus, completing a clean sweep of the first three states and catapulting him to frontrunner status for the Democratic nomination"
    },
    {
      "date": "March 11",
      "title": "Apocolypse Now",
      "description": "All major sports league suspend their seasons indefinitely in the wake of the COVID-19 pandemic, sending shockwaves to many about the gravity of the situation"
    },
    {
      "date": "April 27",
      "title": "Arrival?",
      "description": "The Pentagon officially releases footage from US Navy Fighter Jets of Unidentified Flying Objects (UFOs). As per the video and eyewitness accounts, the objects were capable of high acceleration, deceleration and maneuverability. The clips were taken from the summer of 2014, and had been first reported by The New York Times in May of 2019."
    },
    {
      "date": "May 25",
      "title": "The World Awakens",
      "description": "George Floyd is murdered by Minnepolis police officer Derek Chauvin during a routine arrest, sparking worldwide uprisings"
    },
  ]

  constructor() { }
  ngOnit() { }

  @ViewChild('stepper') stepper: MatStepper;

  ngAfterViewInit() {
    this.stepper.selectedIndex = 0;
  }

  ngOnInit() {
  }
}
