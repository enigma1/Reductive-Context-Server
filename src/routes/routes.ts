import { FastifyInstance } from 'fastify';
import {
  abort,
  savePreferences,
  loadPreferences,
  checkSession,
  clearConversation,
  getOpenRouterModels,
  getPaths,
  readFile,
  writeFile,
  createBundle,
  getBundle,
  setBundle,
  submitBundle,
  resumeBundle,
  getBundleList,
  deleteBundles,
  getLanguages,
  createRole,
  getRoleList,
  getRole,
  setRole,
  deleteRoles,
  activateRole,
  exportDatabase,
} from './api';

export const routes = async (server: FastifyInstance) => {
  server.get('/api/active', async () => {
    return { ok: true };
  });
  server.get('/api/check-session', checkSession);
  server.post('/app/getPaths', loadPreferences);
  server.post('/app/load-preferences', loadPreferences);
  server.post('/app/save-preferences', savePreferences);
  server.post('/api/clear-conversation', clearConversation);
  server.get('/api/get-open-router-models', getOpenRouterModels);
  server.post('/api/get-paths', getPaths);
  server.post('/api/read-file', readFile);
  server.post('/api/write-file', writeFile);
  server.post('/api/create-bundle', createBundle);
  server.post('/api/get-bundle', getBundle);
  server.get('/api/get-bundle-list', getBundleList);
  server.post('/api/set-bundle', setBundle);
  server.post('/api/submit-bundle', submitBundle);
  server.post('/api/resume-bundle', resumeBundle);
  server.post('/api/delete-bundles', deleteBundles);
  server.get('/api/get-languages', getLanguages);
  server.get('/api/get-roles', getRoleList);
  server.post('/api/get-role', getRole);
  server.post('/api/set-role', setRole);
  server.post('/api/delete-roles', deleteRoles);
  server.post('/api/create-role', createRole);
  server.post('/api/activate-role', activateRole);
  server.post('/db/export', exportDatabase);
};
