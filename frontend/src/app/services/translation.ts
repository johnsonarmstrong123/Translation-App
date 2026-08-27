import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TranslationResponse {
  translated_text: string;
}

@Injectable({ providedIn: 'root' })
export class Translation {
  private apiUrl = 'http://localhost:8000/translate';

  constructor(private http: HttpClient) {}

  translate(text: string): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(this.apiUrl, { text });
  }
}
