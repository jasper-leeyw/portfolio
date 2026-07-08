import { DATA } from './data.js?v=3';
import { renderAbout, renderResume, renderFooter } from './render.js?v=8';

renderAbout(DATA.about);
renderResume(DATA.links);
renderFooter(DATA.links);
