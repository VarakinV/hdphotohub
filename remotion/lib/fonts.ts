import { loadFont } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadFontInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadFontLato } from '@remotion/google-fonts/Lato';
import { loadFont as loadFontPtSans } from '@remotion/google-fonts/PTSans';
import { loadFont as loadFontSourceSerif } from '@remotion/google-fonts/SourceSerif4';
import { loadFont as loadFontAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadFontBebasNeue } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadFontGrapeNuts } from '@remotion/google-fonts/GrapeNuts';
import { loadFont as loadFontParisienne } from '@remotion/google-fonts/Parisienne';

export const playfairDisplay = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export const inter = loadFontInter('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

export const lato = loadFontLato('normal', {
  weights: ['300', '400', '700', '900'],
  subsets: ['latin'],
});

export const ptSans = loadFontPtSans('normal', {
  weights: ['400', '700'],
  subsets: ['latin'],
});

export const sourceSerifPro = loadFontSourceSerif('normal', {
  weights: ['400', '600', '700'],
  subsets: ['latin'],
});

export const anton = loadFontAnton('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

export const bebasNeue = loadFontBebasNeue('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

export const grapeNuts = loadFontGrapeNuts('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

export const parisienne = loadFontParisienne('normal', {
  weights: ['400'],
  subsets: ['latin'],
});
