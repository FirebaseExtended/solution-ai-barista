import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoffeeSelectComponent } from './coffee-select.component';

describe('CoffeeSelectComponent', () => {
  let component: CoffeeSelectComponent;
  let fixture: ComponentFixture<CoffeeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoffeeSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoffeeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
