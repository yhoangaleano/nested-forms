import {
  Component,
  forwardRef,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  Optional,
  AfterViewInit,
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroupDirective,
  NgForm,
  FormArray,
} from '@angular/forms';
import { map, Subject, takeUntil } from 'rxjs';

// Configs
import { checkNameExists } from '../../configs';
import { HobbiesType } from '../custom-native-form-hobbies';

// Models
import { AttendantFormType, AttendantType } from './models';

// Interface
import {
  ChildFormsUtility,
  ChildFormsUtilityInterface,
} from './../../utilities';

@Component({
  selector: 'custom-native-form-attendant',
  templateUrl: './custom-native-form-attendant.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomNativeFormAttendantComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CustomNativeFormAttendantComponent),
      multi: true,
    },
  ],
})
export class CustomNativeFormAttendantComponent
  implements
    OnInit,
    AfterViewInit,
    OnDestroy,
    ControlValueAccessor,
    ChildFormsUtilityInterface
{
  @Input() public touchedChangingInput: boolean;

  @Output() public onBlur: EventEmitter<Event>;
  @Output() public onInput: EventEmitter<Partial<AttendantType> | null>;

  @ViewChild('formRef')
  public formRef!: NgForm;

  private readonly unSubscribe$: Subject<void>;

  public form!: FormGroup;
  public onTouched!: Function;
  public childFormsUtility!: ChildFormsUtility;

  get hobbiesFormArray() {
    return this.form.get('hobbies') as FormArray;
  }

  get hobbiesFormControls() {
    return (this.form.controls['hobbies'] as FormArray)
      .controls as Array<FormControl>;
  }

  constructor(@Optional() public formGroupDirective?: FormGroupDirective) {
    this.touchedChangingInput = false;
    this.onBlur = new EventEmitter<Event>();
    this.onInput = new EventEmitter<Partial<AttendantType> | null>();
    this.unSubscribe$ = new Subject();
  }

  ngOnInit() {
    this.createForm();
  }

  ngAfterViewInit(): void {
    this.childFormsUtility = new ChildFormsUtility(
      this.unSubscribe$,
      this.formRef,
      this.formGroupDirective
    );
    this.childFormsUtility.listenSubmitAndResetParentFormGroupDirective(() =>
      this.clearHobbies()
    );
  }

  public ngOnDestroy(): void {
    this.unSubscribe$.next();
    this.unSubscribe$.complete();
  }

  public onInputBlur(event: Event): void {
    this.onTouched();
    this.onBlur.emit(event);
  }

  public onInputChange(value: Partial<AttendantType> | null): void {
    if (this.touchedChangingInput) {
      this.onTouched();
    }
    this.onInput.emit(value);
  }

  public registerOnChange(
    fn: (val: Partial<AttendantType> | null) => void
  ): void {
    this.form.valueChanges
      .pipe(
        takeUntil(this.unSubscribe$),
        map((value) => {
          return this.createAttendant(value);
        })
      )
      .subscribe((attendant) => {
        fn(attendant);
        this.onInputChange(attendant);
      });
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public createForm() {
    this.form = new FormGroup<AttendantFormType>({
      name: new FormControl(null, {
        validators: Validators.required,
        asyncValidators: [checkNameExists],
        nonNullable: true,
      }),
      lastName: new FormControl(null, {
        validators: Validators.required,
        nonNullable: true,
      }),
      age: new FormControl(null, {
        validators: Validators.required,
        nonNullable: true,
      }),
      address: new FormControl(null, {
        validators: Validators.required,
        nonNullable: true,
      }),
      hobbies: new FormArray<FormControl<HobbiesType | null>>(
        [],
        [Validators.required]
      ),
    });
  }

  writeValue(value: AttendantType | null): void {
    const attendant = this.createAttendant(value);
    this.form.patchValue(attendant, { emitEvent: false });
  }

  setDisabledState(disabled: boolean): void {
    if (disabled) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  private createAttendant(value: Partial<AttendantType> | null): AttendantType {
    return {
      name: value?.name ?? null,
      lastName: value?.lastName ?? null,
      age: value?.age ?? null,
      address: value?.address ?? null,
      hobbies: value?.hobbies ?? null,
    };
  }

  validate(control: AbstractControl<AttendantType>): ValidationErrors | null {
    if (control.valid && this.form.valid) {
      return null;
    }
    let errors: Record<string, ValidationErrors> =
      this.childFormsUtility?.getControlsErrors() ?? {};
    return { attendant: { message: 'Attendant is not valid', errors } };
  }

  // FormArray methods
  public addHobbies(): void {
    this.hobbiesFormArray.push(new FormControl(null));
  }

  public deleteHobbies(hobbiesIndex: number): void {
    this.hobbiesFormArray.removeAt(hobbiesIndex);
  }

  public clearHobbies() {
    this.hobbiesFormArray.clear();
  }
}
