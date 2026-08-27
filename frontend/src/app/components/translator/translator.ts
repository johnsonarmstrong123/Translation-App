import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Translation } from '../../services/translation';

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './translator.html',
  styleUrl: './translator.css'
})
export class Translator {
  inputText = '';
  outputText = '';
  loading = false;

  constructor(private translationService: Translation) {}

  onTranslate() {
    if (!this.inputText.trim()) return;
    this.loading = true;
    this.translationService.translate(this.inputText).subscribe({
      next: (res) => {
        this.outputText = res.translated_text;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.outputText = 'Error translating text.';
        this.loading = false;
      }
    });
  }
}