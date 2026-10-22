/* File: src/routes/api/createRole.ts
  Creates a new role in the database
*/
import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { CreateRoleContract, type CreateRoleResponse } from '>/contracts';
import { queryOne, execute } from '>/db';
import { RoleRow } from '>/types';
import { appErrors } from '>/services';

export const createRole = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<CreateRoleResponse> => {
      const { requestSchema, responseSchema } = CreateRoleContract;
      const {
        name,
        roleMain,
        contentRules,
        contentExamples,
        scopePrompt,
        scopeRules,
        scopeExamples,
      } = requestSchema.parse(req.body);

      const existing = queryOne<RoleRow>(
        `SELECT role_name FROM ai_roles WHERE role_name = ?`,
        name,
      );
      if (existing) {
        throw appErrors.sql({
          code: 'conflict',
          message: `Role "${name}" already exists`,
        });
      }

      const sqlCreate = `
        INSERT INTO ai_roles (role_name, role_main, content_rules, content_examples,
        scope_prompt, scope_rules, scope_examples)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      execute(
        sqlCreate,
        name,
        roleMain,
        contentRules,
        contentExamples,
        scopePrompt,
        scopeRules,
        scopeExamples,
      );

      return responseSchema.parse({
        ok: true,
        message: 'Role created',
      });
    },
  });
