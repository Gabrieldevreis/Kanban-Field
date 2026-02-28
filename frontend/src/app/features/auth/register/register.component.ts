import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  signupForm!: FormGroup;
  passwordStrength = 0;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  isDarkMode = false;

  // Password requirement checks
  passwordChecks = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstname: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZÀ-ÿ\s]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
        ]
      ],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Subscribe to theme changes
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      if (this.signupForm.get('firstname')?.invalid) {
        const errors = this.signupForm.get('firstname')?.errors;
        if (errors?.['required']) {
          this.errorMessage = 'O nome é obrigatório.';
        } else if (errors?.['minlength']) {
          this.errorMessage = 'O nome deve ter no mínimo 3 caracteres.';
        } else if (errors?.['maxlength']) {
          this.errorMessage = 'O nome deve ter no máximo 50 caracteres.';
        } else if (errors?.['pattern']) {
          this.errorMessage = 'O nome deve conter apenas letras e espaços.';
        }
      } else if (this.signupForm.get('email')?.invalid) {
        this.errorMessage = 'Insira um email válido.';
      } else if (this.signupForm.get('password')?.invalid) {
        this.errorMessage = 'A senha não atende aos requisitos mínimos de segurança.';
      } else if (this.signupForm.errors?.['passwordMismatch']) {
        this.errorMessage = 'As senhas não coincidem.';
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const registerData = {
      name: this.signupForm.value.firstname,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.errorMessage = null;
        this.successMessage = 'Conta criada com sucesso! Redirecionando para login...';
        
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { registered: 'true', email: this.signupForm.value.email }
          });
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Erro ao criar conta. Tente novamente.';
      }
    });
  }

  updatePasswordStrength() {
    const value = this.signupForm.get('password')?.value || '';
    
    // Update individual checks
    this.passwordChecks.minLength = value.length >= 8;
    this.passwordChecks.hasUpperCase = /[A-Z]/.test(value);
    this.passwordChecks.hasLowerCase = /[a-z]/.test(value);
    this.passwordChecks.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    // Calculate overall strength
    let strength = 0;
    if (this.passwordChecks.minLength) strength += 25;
    if (this.passwordChecks.hasUpperCase) strength += 25;
    if (this.passwordChecks.hasLowerCase) strength += 25;
    if (this.passwordChecks.hasSpecialChar) strength += 25;

    this.passwordStrength = strength;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
