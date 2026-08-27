import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TranslationResponse {
  translated_text: string;
}

export interface LanguagePair {
  source: string;
  target: string;
}

@Injectable({ providedIn: 'root' })
export class Translation {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  translate(text: string, sourceLang: string, targetLang: string): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(`${this.apiUrl}/translate`, {
      text,
      source_lang: sourceLang,
      target_lang: targetLang
    });
  }

  getLanguagePairs(): Observable<{ pairs: LanguagePair[] }> {
    return this.http.get<{ pairs: LanguagePair[] }>(`${this.apiUrl}/languages`);
  }
}
