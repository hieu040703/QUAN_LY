import { SelectQueryBuilder, FindOptionsSelect, ObjectLiteral } from "typeorm";

/**
 * Helper tự động apply nested FindOptionsSelect vào QueryBuilder
 */
export function applySelects<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  select: FindOptionsSelect<T>
) {
  const queue: Array<{ parentAlias: string; selectObj: any; relation: string }> =
    [];
  queue.push({ parentAlias: alias, selectObj: select, relation: "" });

  while (queue.length) {
    const { parentAlias, selectObj, relation } = queue.shift()!;

    Object.keys(selectObj).forEach((key) => {
      const value = selectObj[key];

      if (value === true) {
        qb.addSelect(`${parentAlias}.${key}`);
      } else if (typeof value === "object") {
        const joinAlias = relation ? `${relation}_${key}` : key;
        qb.leftJoin(`${parentAlias}.${key}`, joinAlias);
        queue.push({ parentAlias: joinAlias, selectObj: value, relation: joinAlias });
      }
    });
  }
}
