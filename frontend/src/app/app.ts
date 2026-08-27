import { Component } from '@angular/core';
import { Translator } from './components/translator/translator';

@Component({
  selector: 'app-root',
  imports: [Translator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'frontend';
}