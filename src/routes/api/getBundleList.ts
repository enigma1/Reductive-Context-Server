import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetBundleListContract, type GetBundleListResponse } from '>/contracts';
import { queryRows, getColumns } from '>/db';
import { JsonArray, Primitive } from '>/types';

const SHORT_TEXT = 250;

type ColShape = {
  name: string;
  type: string;
};
export const getBundleList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetBundleListResponse> => {
      const { responseSchema } = GetBundleListContract;
      const colsArray = getColumns('bundles');
      const columnsOrder = colsArray.map((col) => col.name);
      const cols = colsArray.reduce(
        (acc, current) => {
          return {
            ...acc,
            [current.name]: { name: current.name, type: current.type },
          };
        },
        {} as Record<string, ColShape>,
      );
      const sqlBundle = `SELECT * FROM bundles`;
      const fullRows = queryRows<Primitive>(sqlBundle);
      const rows = fullRows.map((row) =>
        row.map((value, i) => {
          const colType = cols[columnsOrder[i]]?.type ?? '';
          if (
            colType.toUpperCase().includes('TEXT') &&
            typeof value === 'string'
          ) {
            return value.length > SHORT_TEXT
              ? value.slice(0, SHORT_TEXT) + '…'
              : value;
          }
          return value;
        }),
      );

      return responseSchema.parse({
        ok: true,
        message: 'Bundle list retrieved',
        rows,
        cols,
        columnsOrder,
      });
    },
  });
