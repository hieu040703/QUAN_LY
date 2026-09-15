/**
 * Helper để generate address options từ JSON data
 * Format: "Thành phố Hà Nội - Phường Hà Đông"
 */

export interface WardData {
  Name: string;
}

export interface ProvinceData {
  Name: string;
  Wards: WardData[];
  Plates: number[];
}

/**
 * Generate danh sách address options
 * @returns Array of "Tỉnh/TP - Phường/Xã" strings
 */
export function generateAddressOptions(provinces: ProvinceData[]): string[] {
  const options: string[] = [];

  for (const province of provinces) {
    for (const ward of province.Wards) {
      options.push(`${province.Name} - ${ward.Name}`);
    }
  }

  return options.sort(); // Sắp xếp alphabet để dễ tìm
}

/**
 * Parse address string thành state và ward
 * @param address Format: "Thành phố Hà Nội - Phường Hà Đông"
 * @returns { state, ward }
 */
export function parseAddress(address: string): { state: string; ward: string } {
  const [state, ward] = address.split("-").map((s) => s.trim());
  return { state: state || "", ward: ward || "" };
}
