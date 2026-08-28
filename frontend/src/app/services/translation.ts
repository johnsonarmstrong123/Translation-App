import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface TranslationResponse {
  translated_text: string;
}

export interface LanguagePair {
  source: string;
  target: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AdminStats {
  total_users: number;
  total_translations: number;
  language_pair_usage: { source: string; target: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class Translation {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  signup(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { email, password }).pipe(
      tap(res => localStorage.setItem('access_token', res.access_token))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => localStorage.setItem('access_token', res.access_token))
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  translate(text: string, sourceLang: string, targetLang: string): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(
      `${this.apiUrl}/translate`,
      { text, source_lang: sourceLang, target_lang: targetLang },
      { headers: this.authHeaders() }
    );
  }

  getLanguagePairs(): Observable<{ pairs: LanguagePair[] }> {
    return this.http.get<{ pairs: LanguagePair[] }>(`${this.apiUrl}/languages`);
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/admin/stats`, { headers: this.authHeaders() });
  }
}