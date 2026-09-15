import { ILike, Raw } from "typeorm";

export class SearchUtils {
  /**
   * Tìm kiếm thông minh với pg_trgm và unaccent
   * @param field - Tên field
   * @param keyword - Từ khóa
   * @param threshold - Ngưỡng similarity (0-1)
   */
 
  static createSmartSearch(
    field: string,
    keyword: string,
    threshold: number = 0.3,
    suffix: string = ""
  ) {
    const exactParam = `exactKeyword${suffix}`;
    const fuzzyParam = `fuzzyKeyword${suffix}`;
    const similarityParam = `similarityKeyword${suffix}`;
    const thresholdParam = `threshold${suffix}`;

    return {
      [field]: Raw(
        (alias) => `
        (
          unaccent(${alias}) ILIKE unaccent(:${exactParam}) OR 
          unaccent(${alias}) % unaccent(:${fuzzyParam}) OR
          similarity(unaccent(${alias}), unaccent(:${similarityParam})) > :${thresholdParam}
        )
      `,
        {
          [exactParam]: `%${keyword}%`,
          [fuzzyParam]: keyword,
          [similarityParam]: keyword,
          [thresholdParam]: threshold,
        }
      ),
    };
  }

  /**
   * Tìm kiếm với sắp xếp theo độ liên quan - Improved version
   */
  static createRelevanceSearch(field: string, keyword: string) {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return {};
    }

    return {
      [field]: Raw(
        (alias) => `
      CASE
        WHEN unaccent("${alias}"::text) ILIKE unaccent(:exactMatch) THEN 1.0
        WHEN unaccent("${alias}"::text) ILIKE unaccent(:startsWithMatch) THEN 0.9
        WHEN unaccent("${alias}"::text) ILIKE unaccent(:containsMatch) THEN 0.8
        ELSE similarity(unaccent("${alias}"::text), unaccent(:similarityMatch))
      END > 0.3
    `,
        {
          exactMatch: trimmedKeyword,
          startsWithMatch: `${trimmedKeyword}%`,
          containsMatch: `%${trimmedKeyword}%`,
          similarityMatch: trimmedKeyword,
        }
      ),
    };
  }

  /**
   * normal search
   * @param field - Tên field
   * @param keyword - Từ khóa
   */
  static createNormalSearch(field: string, keyword: string) {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return {};
    }

    return {
      [field]: ILike(`%${trimmedKeyword}%`),
    };
  }

  /**
   * Simple fallback search when pg_trgm is not available
   */
  static createSimpleSearch(field: string, keyword: string) {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return {};
    }

    return {
      [field]: Raw((alias) => `LOWER(${alias}) LIKE LOWER(:keyword)`, {
        keyword: `%${trimmedKeyword}%`,
      }),
    };
  }
}
