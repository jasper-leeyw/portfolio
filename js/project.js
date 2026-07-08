import { DATA } from './data.js?v=3';
import { renderProject, renderResume, renderFooter } from './render.js?v=8';

const slug = new URLSearchParams(location.search).get('id');
const project = DATA.projects.find(p => p.slug === slug);

if (!project) {
  location.replace('projects.html');
} else {
  // Name only the thumbnail — matches what renderWork names on the card side.
  const thumb = document.getElementById('project-thumb');
  if (thumb) thumb.style.viewTransitionName = `project-${slug}`;

  // Reverse trip: name the thumbnail so it morphs back into the card.
  window.addEventListener('pageswap', e => {
    if (e.viewTransition && thumb) thumb.style.viewTransitionName = `project-${slug}`;
  });

  renderProject(project);
  renderResume(DATA.links);
  renderFooter(DATA.links);

  // Update page title with the project name
  document.title = `${project.title} — Jasper Lee`;
}
