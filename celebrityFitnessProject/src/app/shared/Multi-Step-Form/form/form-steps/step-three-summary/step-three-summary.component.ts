import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { FormService } from '../../form.service';

@Component({
  selector: 'app-step-three-summary',
  templateUrl: './step-three-summary.component.html',
  styleUrls: ['./step-three-summary.component.css'],
})
export class StepThreeSummaryComponent implements OnInit {
  @Input() stepForm!: FormGroup;
  @Input() tierTwoThree!: boolean;
  // @Output() enterPressed = new EventEmitter<void>();

  personalDetails = this.rootFormGroup.form.get('personalDetails')?.value;
  planDetails = this.rootFormGroup.form.get('planDetails')?.value;

  constructor(
    private rootFormGroup: FormGroupDirective,
    private formService: FormService
  ) {}
  ngOnInit(): void {
    console.log(`This is step three summary component${this.tierTwoThree}`);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tierTwoThree']) {
      console.log('StepThreeSummaryComponent ngOnChanges - tierTwoThree:', changes['tierTwoThree'].currentValue);
    }
  }

  changePlan() {
    this.formService.goBackToPreviousStep(3);
  }

  // onEnterPress() {
  //   this.enterPressed.emit();
  // }
}
