import { FastifyRequest, FastifyReply } from 'fastify';
import { apiCallAuth } from '>/services';
import { GetBundleListContract, type GetBundleListResponse } from '>/contracts';
import { queryRows, getColumns } from '>/db';
import { JsonArray, Primitive, ColShape } from '>/types';

const SHORT_TEXT = 250;

export const getBundleList = async (req: FastifyRequest, rsp: FastifyReply) =>
  apiCallAuth({
    req,
    rsp,
    fn: async (): Promise<GetBundleListResponse> => {
      const { responseSchema } = GetBundleListContract;
      const { cols, columnsOrder } = getColumns('bundles');
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
