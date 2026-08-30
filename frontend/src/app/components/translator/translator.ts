import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Translation, LanguagePair } from '../../services/translation';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  tw: 'Twi'
};

@Component({
  selector: 'app-translator',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './translator.html',
  styleUrl: './translator.css'
})
export class Translator implements OnInit {
  inputText = '';
  outputText = '';
  loading = false;

  languagePairs: LanguagePair[] = [];
  sourceOptions: string[] = [];
  targetOptions: string[] = [];

  sourceLang = 'en';
  targetLang = 'fr';

  languageNames = LANGUAGE_NAMES;

  constructor(private translationService: Translation) {}

  ngOnInit() {
    this.translationService.getLanguagePairs().subscribe({
      next: (res) => {
        this.languagePairs = res.pairs;
        this.sourceOptions = [...new Set(res.pairs.map(p => p.source))];
        this.updateTargetOptions();
      },
      error: (err) => console.error('Failed to load languages', err)
    });
  }

  updateTargetOptions() {
    this.targetOptions = this.languagePairs
      .filter(p => p.source === this.sourceLang)
      .map(p => p.target);

    if (!this.targetOptions.includes(this.targetLang)) {
      this.targetLang = this.targetOptions[0] ?? '';
    }
  }

  onTranslate() {
    if (!this.inputText.trim()) return;
    this.loading = true;
    this.translationService.translate(this.inputText, this.sourceLang, this.targetLang).subscribe({
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