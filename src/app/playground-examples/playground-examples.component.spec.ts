import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaygroundExamplesComponent } from './playground-examples.component';

describe('PlaygroundExamplesComponent', () => {
  let component: PlaygroundExamplesComponent;
  let fixture: ComponentFixture<PlaygroundExamplesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaygroundExamplesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaygroundExamplesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
